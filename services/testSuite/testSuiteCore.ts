/**
 * Test Suite Core Runner
 * Main test execution engine for the Universal History Simulator
 */

import {
  Test,
  TestCategory,
  TestContext,
  TestResult,
  TestSummary,
  TestRunner,
  TestStatus,
  Assert,
  PerformanceMetrics
} from './types';
import { createAssertions } from './assertions';
import { testReporter } from './testReporter';
import { createTestCategories } from './testCategories';

class TestSuiteRunner implements TestRunner {
  private categories: TestCategory[] = [];
  private isRunning = false;
  private abortController: AbortController | null = null;
  private testResults: Map<string, TestResult> = new Map();

  constructor() {
    this.loadCategories();
  }

  private async loadCategories() {
    this.categories = await createTestCategories();
  }

  async getCategories(): Promise<TestCategory[]> {
    if (this.categories.length === 0) {
      await this.loadCategories();
    }
    return this.categories;
  }

  async runTest(test: Test, contextOverrides?: Partial<TestContext>): Promise<TestResult> {
    const startTime = performance.now();
    const logs: string[] = [];
    const warnings: string[] = [];
    let status: TestStatus = 'running';
    let error: string | undefined;
    let stackTrace: string | undefined;
    let skipReason: string | undefined;

    // Create test context with assertions
    const context: TestContext = {
      ...contextOverrides,
      assert: createAssertions(),
      skip: (reason?: string) => {
        status = 'skip';
        skipReason = reason;
        throw new Error(`Test skipped: ${reason || 'No reason provided'}`);
      },
      warn: (message: string) => {
        warnings.push(message);
        if (status !== 'fail') status = 'warning';
      },
      log: (message: string) => {
        logs.push(message);
      },
      measure: async (name: string, fn: () => Promise<any>) => {
        const measureStart = performance.now();
        try {
          const result = await fn();
          const duration = performance.now() - measureStart;
          logs.push(`Performance: ${name} took ${duration.toFixed(2)}ms`);
          return result;
        } catch (err) {
          const duration = performance.now() - measureStart;
          logs.push(`Performance: ${name} failed after ${duration.toFixed(2)}ms`);
          throw err;
        }
      }
    };

    // Set up timeout
    const timeout = test.timeout || 30000; // Default 30 seconds
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      testReporter.onTestStart(test);

      // Run test with timeout
      await Promise.race([
        test.fn(context),
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Test timeout after ${timeout}ms`));
          }, timeout);
        })
      ]);

      if (status === 'skip') {
        // Already handled by skip function
      } else if (warnings.length > 0) {
        status = 'warning';
      } else {
        status = 'pass';
      }
    } catch (err: any) {
      if (status !== 'skip') {
        status = 'fail';
        error = err.message || String(err);
        stackTrace = err.stack;
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    const duration = performance.now() - startTime;

    // Collect performance metrics if available
    const performanceMetrics = this.collectPerformanceMetrics();

    const result: TestResult = {
      id: test.id,
      name: test.name,
      category: test.category,
      status,
      duration: Math.round(duration),
      error,
      stackTrace,
      warnings: warnings.length > 0 ? warnings : undefined,
      logs: logs.length > 0 ? logs : undefined,
      performanceMetrics,
      timestamp: Date.now()
    };

    this.testResults.set(test.id, result);
    testReporter.onTestComplete(result);

    return result;
  }

  async runCategory(categoryId: string, context?: Partial<TestContext>): Promise<TestResult[]> {
    const category = this.categories.find(c => c.id === categoryId);
    if (!category) {
      throw new Error(`Category not found: ${categoryId}`);
    }

    const results: TestResult[] = [];

    testReporter.onCategoryStart(category);

    // Run setup if defined
    if (category.setup) {
      try {
        await category.setup();
      } catch (err) {
        console.error(`Category setup failed for ${category.name}:`, err);
      }
    }

    // Run each test in the category
    for (const test of category.tests) {
      if (this.abortController?.signal.aborted) {
        break;
      }

      const result = await this.runTest(test, context);
      results.push(result);

      // Handle retries for failed tests
      if (result.status === 'fail' && test.retries) {
        for (let retry = 0; retry < test.retries; retry++) {
          console.log(`Retrying test ${test.name} (attempt ${retry + 1}/${test.retries})`);
          const retryResult = await this.runTest(test, context);
          if (retryResult.status !== 'fail') {
            results[results.length - 1] = retryResult;
            break;
          }
        }
      }
    }

    // Run teardown if defined
    if (category.teardown) {
      try {
        await category.teardown();
      } catch (err) {
        console.error(`Category teardown failed for ${category.name}:`, err);
      }
    }

    testReporter.onCategoryComplete(category, results);

    return results;
  }

  async runAll(context?: Partial<TestContext>): Promise<TestSummary> {
    this.isRunning = true;
    this.abortController = new AbortController();
    this.testResults.clear();

    const startTime = performance.now();
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalWarnings = 0;

    const categoryResults = [];

    for (const category of this.categories) {
      if (this.abortController.signal.aborted) break;

      const results = await this.runCategory(category.id, context);

      const passed = results.filter(r => r.status === 'pass').length;
      const failed = results.filter(r => r.status === 'fail').length;
      const skipped = results.filter(r => r.status === 'skip').length;
      const warnings = results.filter(r => r.status === 'warning').length;

      totalPassed += passed;
      totalFailed += failed;
      totalSkipped += skipped;
      totalWarnings += warnings;

      categoryResults.push({
        id: category.id,
        name: category.name,
        total: results.length,
        passed,
        failed,
        skipped,
        duration: results.reduce((sum, r) => sum + r.duration, 0)
      });
    }

    const duration = performance.now() - startTime;
    const total = totalPassed + totalFailed + totalSkipped;

    const summary: TestSummary = {
      total,
      passed: totalPassed,
      failed: totalFailed,
      skipped: totalSkipped,
      warnings: totalWarnings,
      duration: Math.round(duration),
      passRate: total > 0 ? (totalPassed / total) * 100 : 0,
      timestamp: Date.now(),
      categories: categoryResults
    };

    testReporter.onSuiteComplete(summary);

    this.isRunning = false;
    this.abortController = null;

    return summary;
  }

  async runSmoke(context?: Partial<TestContext>): Promise<TestSummary> {
    // Run only tests tagged as 'smoke'
    const smokeTests = this.categories
      .flatMap(c => c.tests)
      .filter(t => t.tags?.includes('smoke'));

    const startTime = performance.now();
    const results: TestResult[] = [];

    for (const test of smokeTests) {
      if (this.abortController?.signal.aborted) break;
      const result = await this.runTest(test, context);
      results.push(result);
    }

    const duration = performance.now() - startTime;
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const skipped = results.filter(r => r.status === 'skip').length;
    const total = results.length;

    const summary: TestSummary = {
      total,
      passed,
      failed,
      skipped,
      duration: Math.round(duration),
      passRate: total > 0 ? (passed / total) * 100 : 0,
      timestamp: Date.now()
    };

    return summary;
  }

  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isRunning = false;
  }

  reset(): void {
    this.testResults.clear();
    this.isRunning = false;
    this.abortController = null;
  }

  private collectPerformanceMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {};

    // Memory usage (if available)
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      metrics.memoryUsage = memInfo.usedJSHeapSize;
      metrics.jsHeapSize = memInfo.totalJSHeapSize;
    }

    // DOM node count
    metrics.domNodes = document.getElementsByTagName('*').length;

    // Frame rate estimation (rough)
    // This would need a more sophisticated implementation for accurate FPS
    metrics.fps = 60; // Placeholder

    return metrics;
  }
}

// Export singleton instance
export const testRunner = new TestSuiteRunner();