/**
 * Test Reporter
 * Handles test result reporting and storage
 */

import {
  Test,
  TestCategory,
  TestResult,
  TestSummary,
  TestReporter,
  CategorySummary
} from './types';

class TestReporterImpl implements TestReporter {
  private results: TestResult[] = [];
  private currentCategory: TestCategory | null = null;
  private startTime: number = 0;
  private logs: string[] = [];

  onTestStart(test: Test): void {
    this.log(`[TEST START] ${test.name}`);
  }

  onTestComplete(result: TestResult): void {
    this.results.push(result);

    const icon = this.getStatusIcon(result.status);
    const duration = `${result.duration}ms`;

    this.log(`[TEST ${result.status.toUpperCase()}] ${icon} ${result.name} (${duration})`);

    if (result.error) {
      this.log(`  Error: ${result.error}`);
    }

    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        this.log(`  Warning: ${warning}`);
      });
    }

    // Store results in IndexedDB for persistence
    this.storeResult(result);
  }

  onCategoryStart(category: TestCategory): void {
    this.currentCategory = category;
    this.log(`\n[CATEGORY START] ${category.name}`);
    this.log(`  Priority: ${category.priority}`);
    this.log(`  Tests: ${category.tests.length}`);
  }

  onCategoryComplete(category: TestCategory, results: TestResult[]): void {
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const skipped = results.filter(r => r.status === 'skip').length;
    const duration = results.reduce((sum, r) => sum + r.duration, 0);

    this.log(`[CATEGORY COMPLETE] ${category.name}`);
    this.log(`  Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    this.log(`  Duration: ${duration}ms\n`);
  }

  onSuiteComplete(summary: TestSummary): void {
    this.log('\n' + '='.repeat(60));
    this.log('TEST SUITE COMPLETE');
    this.log('='.repeat(60));
    this.log(`Total Tests: ${summary.total}`);
    this.log(`Passed: ${summary.passed} (${summary.passRate.toFixed(1)}%)`);
    this.log(`Failed: ${summary.failed}`);
    this.log(`Skipped: ${summary.skipped}`);
    if (summary.warnings) {
      this.log(`Warnings: ${summary.warnings}`);
    }
    this.log(`Duration: ${(summary.duration / 1000).toFixed(2)}s`);
    this.log('='.repeat(60));

    // Store summary
    this.storeSummary(summary);
  }

  generateReport(): string {
    const report: string[] = [];

    report.push('# Test Report');
    report.push(`Generated: ${new Date().toISOString()}\n`);

    // Summary section
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;

    report.push('## Summary');
    report.push(`- Total: ${total}`);
    report.push(`- Passed: ${passed} (${total > 0 ? (passed / total * 100).toFixed(1) : 0}%)`);
    report.push(`- Failed: ${failed}`);
    report.push(`- Skipped: ${skipped}`);
    report.push(`- Warnings: ${warnings}\n`);

    // Failed tests section
    if (failed > 0) {
      report.push('## Failed Tests');
      this.results
        .filter(r => r.status === 'fail')
        .forEach(result => {
          report.push(`\n### ${result.name}`);
          report.push(`- Category: ${result.category}`);
          report.push(`- Error: ${result.error}`);
          if (result.stackTrace) {
            report.push('```');
            report.push(result.stackTrace);
            report.push('```');
          }
        });
      report.push('');
    }

    // Warnings section
    if (warnings > 0) {
      report.push('## Tests with Warnings');
      this.results
        .filter(r => r.status === 'warning')
        .forEach(result => {
          report.push(`\n### ${result.name}`);
          if (result.warnings) {
            result.warnings.forEach(warning => {
              report.push(`- ${warning}`);
            });
          }
        });
      report.push('');
    }

    // Performance section
    report.push('## Performance');
    const slowTests = this.results
      .filter(r => r.duration > 1000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    if (slowTests.length > 0) {
      report.push('\n### Slowest Tests');
      slowTests.forEach(result => {
        report.push(`- ${result.name}: ${result.duration}ms`);
      });
    }

    // Full results
    report.push('\n## All Results');
    this.results.forEach(result => {
      const icon = this.getStatusIcon(result.status);
      report.push(`${icon} ${result.name} (${result.duration}ms)`);
    });

    return report.join('\n');
  }

  exportResults(format: 'json' | 'html' | 'markdown'): string {
    switch (format) {
      case 'json':
        return this.exportJSON();
      case 'html':
        return this.exportHTML();
      case 'markdown':
        return this.generateReport();
      default:
        return this.exportJSON();
    }
  }

  private exportJSON(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      results: this.results,
      logs: this.logs
    }, null, 2);
  }

  private exportHTML(): string {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Test Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 20px 0; }
    .stat { text-align: center; padding: 20px; border-radius: 8px; background: #f8f9fa; }
    .stat-number { font-size: 2em; font-weight: bold; margin: 10px 0; }
    .passed { color: #4CAF50; }
    .failed { color: #f44336; }
    .skipped { color: #ff9800; }
    .test-result { padding: 10px; margin: 5px 0; border-left: 4px solid; background: #fafafa; }
    .test-pass { border-color: #4CAF50; }
    .test-fail { border-color: #f44336; }
    .test-skip { border-color: #ff9800; }
    .error { background: #ffebee; padding: 10px; margin: 10px 0; border-radius: 4px; color: #c62828; }
    .duration { color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Test Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>

    <div class="summary">
      <div class="stat">
        <div>Total Tests</div>
        <div class="stat-number">${total}</div>
      </div>
      <div class="stat">
        <div>Passed</div>
        <div class="stat-number passed">${passed}</div>
        <div>${total > 0 ? (passed / total * 100).toFixed(1) : 0}%</div>
      </div>
      <div class="stat">
        <div>Failed</div>
        <div class="stat-number failed">${failed}</div>
      </div>
      <div class="stat">
        <div>Skipped</div>
        <div class="stat-number skipped">${this.results.filter(r => r.status === 'skip').length}</div>
      </div>
    </div>

    <h2>Test Results</h2>
    ${this.results.map(result => `
      <div class="test-result test-${result.status}">
        <strong>${result.name}</strong>
        <span class="duration">(${result.duration}ms)</span>
        ${result.error ? `<div class="error">Error: ${result.error}</div>` : ''}
      </div>
    `).join('')}
  </div>
</body>
</html>`;
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'pass': return '✓';
      case 'fail': return '✗';
      case 'skip': return '⊘';
      case 'warning': return '⚠';
      default: return '•';
    }
  }

  private log(message: string): void {
    this.logs.push(`[${new Date().toLocaleTimeString()}] ${message}`);
    console.log(message);
  }

  private async storeResult(result: TestResult): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['testResults'], 'readwrite');
      const store = transaction.objectStore('testResults');
      await store.add(result);
    } catch (error) {
      console.error('Failed to store test result:', error);
    }
  }

  private async storeSummary(summary: TestSummary): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['testSummaries'], 'readwrite');
      const store = transaction.objectStore('testSummaries');
      await store.add(summary);
    } catch (error) {
      console.error('Failed to store test summary:', error);
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TestSuiteDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('testResults')) {
          const resultStore = db.createObjectStore('testResults', {
            keyPath: 'id',
            autoIncrement: true
          });
          resultStore.createIndex('timestamp', 'timestamp');
          resultStore.createIndex('status', 'status');
          resultStore.createIndex('category', 'category');
        }

        if (!db.objectStoreNames.contains('testSummaries')) {
          const summaryStore = db.createObjectStore('testSummaries', {
            keyPath: 'timestamp'
          });
          summaryStore.createIndex('passRate', 'passRate');
        }
      };
    });
  }

  async getHistoricalResults(limit: number = 100): Promise<TestResult[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['testResults'], 'readonly');
      const store = transaction.objectStore('testResults');
      const index = store.index('timestamp');

      return new Promise((resolve, reject) => {
        const results: TestResult[] = [];
        const request = index.openCursor(null, 'prev');

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor && results.length < limit) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get historical results:', error);
      return [];
    }
  }

  reset(): void {
    this.results = [];
    this.currentCategory = null;
    this.logs = [];
  }
}

export const testReporter = new TestReporterImpl();