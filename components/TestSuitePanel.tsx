import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Play, Square, CheckCircle, XCircle, AlertCircle, Clock, Zap, Download, RefreshCw, ChevronRight, ChevronDown, Activity } from 'lucide-react';
import { testRunner } from '../services/testSuite/testSuiteCore';
import { TestCategory, TestResult, TestStatus, TestSummary } from '../services/testSuite/types';

interface TestSuitePanelProps {
  isOpen: boolean;
  onClose: () => void;
  playerCharacter?: any;
  mapData?: any;
  currentZone?: string;
  currentYear?: number;
}

const TestSuitePanel: React.FC<TestSuitePanelProps> = ({
  isOpen,
  onClose,
  playerCharacter,
  mapData,
  currentZone,
  currentYear
}) => {
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Map<string, TestResult>>(new Map());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTestCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testLogs]);

  const loadTestCategories = async () => {
    const loadedCategories = await testRunner.getCategories();
    setCategories(loadedCategories);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults(new Map());
    setTestLogs([]);
    setSummary(null);
    abortControllerRef.current = new AbortController();

    const startTime = Date.now();
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    try {
      for (const category of categories) {
        if (abortControllerRef.current?.signal.aborted) break;

        for (const test of category.tests) {
          if (abortControllerRef.current?.signal.aborted) break;

          setCurrentTest(`${category.name} > ${test.name}`);
          addLog(`Running: ${test.name}`, 'info');

          const result = await testRunner.runTest(test, {
            playerCharacter,
            mapData,
            currentZone,
            currentYear
          });

          setTestResults(prev => new Map(prev).set(test.id, result));

          if (result.status === 'pass') {
            passed++;
            addLog(`✓ ${test.name} (${result.duration}ms)`, 'success');
          } else if (result.status === 'fail') {
            failed++;
            addLog(`✗ ${test.name}: ${result.error}`, 'error');
          } else if (result.status === 'skip') {
            skipped++;
            addLog(`⊘ ${test.name}: Skipped`, 'warning');
          }
        }
      }
    } catch (error) {
      addLog(`Test suite error: ${error}`, 'error');
    } finally {
      const duration = Date.now() - startTime;
      const total = passed + failed + skipped;

      setSummary({
        total,
        passed,
        failed,
        skipped,
        duration,
        passRate: total > 0 ? (passed / total) * 100 : 0,
        timestamp: Date.now()
      });

      setIsRunning(false);
      setCurrentTest(null);
      abortControllerRef.current = null;
    }
  };

  const runCategoryTests = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    setSelectedCategory(categoryId);
    setIsRunning(true);
    setTestLogs([]);
    abortControllerRef.current = new AbortController();

    const startTime = Date.now();
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    try {
      for (const test of category.tests) {
        if (abortControllerRef.current?.signal.aborted) break;

        setCurrentTest(`${category.name} > ${test.name}`);
        addLog(`Running: ${test.name}`, 'info');

        const result = await testRunner.runTest(test, {
          playerCharacter,
          mapData,
          currentZone,
          currentYear
        });

        setTestResults(prev => new Map(prev).set(test.id, result));

        if (result.status === 'pass') {
          passed++;
          addLog(`✓ ${test.name} (${result.duration}ms)`, 'success');
        } else if (result.status === 'fail') {
          failed++;
          addLog(`✗ ${test.name}: ${result.error}`, 'error');
          if (result.stackTrace) {
            addLog(`  Stack: ${result.stackTrace}`, 'debug');
          }
        } else if (result.status === 'skip') {
          skipped++;
          addLog(`⊘ ${test.name}: Skipped`, 'warning');
        }
      }
    } catch (error) {
      addLog(`Category test error: ${error}`, 'error');
    } finally {
      const duration = Date.now() - startTime;
      addLog(`Category complete: ${passed} passed, ${failed} failed, ${skipped} skipped (${duration}ms)`, 'info');
      setIsRunning(false);
      setCurrentTest(null);
      setSelectedCategory(null);
      abortControllerRef.current = null;
    }
  };

  const runSmokeTests = async () => {
    setIsRunning(true);
    setTestLogs([]);
    addLog('Starting smoke tests...', 'info');

    const smokeTests = categories
      .flatMap(c => c.tests)
      .filter(t => t.tags?.includes('smoke'));

    for (const test of smokeTests) {
      setCurrentTest(test.name);
      const result = await testRunner.runTest(test, {
        playerCharacter,
        mapData,
        currentZone,
        currentYear
      });
      setTestResults(prev => new Map(prev).set(test.id, result));
      addLog(`${result.status === 'pass' ? '✓' : '✗'} ${test.name}`, result.status === 'pass' ? 'success' : 'error');
    }

    setIsRunning(false);
    setCurrentTest(null);
    addLog('Smoke tests complete!', 'success');
  };

  const stopTests = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addLog('Test run aborted by user', 'warning');
    }
  };

  const addLog = (message: string, level: 'info' | 'success' | 'error' | 'warning' | 'debug' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const colorClass = {
      info: 'text-gray-300',
      success: 'text-green-400',
      error: 'text-red-400',
      warning: 'text-yellow-400',
      debug: 'text-gray-500'
    }[level];

    setTestLogs(prev => [...prev, `<span class="${colorClass}">[${timestamp}] ${message}</span>`]);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const exportResults = () => {
    const exportData = {
      timestamp: Date.now(),
      summary,
      results: Array.from(testResults.entries()).map(([id, result]) => ({
        id,
        ...result
      })),
      logs: testLogs
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addLog('Results exported successfully', 'success');
  };

  const getCategoryStatus = (category: TestCategory): TestStatus => {
    const categoryResults = category.tests.map(t => testResults.get(t.id));
    if (categoryResults.every(r => r?.status === 'pass')) return 'pass';
    if (categoryResults.some(r => r?.status === 'fail')) return 'fail';
    if (categoryResults.some(r => r?.status === 'warning')) return 'warning';
    if (categoryResults.every(r => r?.status === 'skip')) return 'skip';
    return 'pending';
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'skip': return <Clock className="w-5 h-5 text-gray-500" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      critical: 'bg-red-600',
      high: 'bg-orange-600',
      medium: 'bg-yellow-600',
      low: 'bg-green-600'
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold text-white rounded ${colors[priority as keyof typeof colors] || 'bg-gray-600'}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Production Test Suite</h2>
            {isRunning && (
              <span className="px-3 py-1 text-xs font-semibold bg-blue-600 rounded-full text-white animate-pulse">
                RUNNING
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 p-4 border-b border-slate-700 bg-slate-800/50">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-md hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Run All Tests
          </button>
          <button
            onClick={runSmokeTests}
            disabled={isRunning}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-md hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Smoke Test (30s)
          </button>
          {isRunning && (
            <button
              onClick={stopTests}
              className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          )}
          <div className="flex-1" />
          {summary && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-400">✓ {summary.passed}</span>
              <span className="text-red-400">✗ {summary.failed}</span>
              <span className="text-yellow-400">⊘ {summary.skipped}</span>
              <span className="text-gray-400">|</span>
              <span className="text-blue-400">{summary.passRate.toFixed(1)}% pass rate</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-300">{(summary.duration / 1000).toFixed(1)}s</span>
            </div>
          )}
          <button
            onClick={exportResults}
            disabled={testResults.size === 0}
            className="px-3 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Categories Panel */}
          <div className="w-1/3 border-r border-slate-700 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Test Categories</h3>
              <div className="space-y-2">
                {categories.map(category => {
                  const status = getCategoryStatus(category);
                  const isExpanded = expandedCategories.has(category.id);
                  const isSelected = selectedCategory === category.id;

                  return (
                    <div key={category.id} className="bg-slate-800 rounded-lg overflow-hidden">
                      <div
                        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/50 transition-colors ${
                          isSelected ? 'bg-slate-700' : ''
                        }`}
                        onClick={() => toggleCategory(category.id)}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          {getStatusIcon(status)}
                          <span className="font-medium text-white">{category.name}</span>
                          <span className="text-xs text-gray-400">({category.tests.length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(category.priority)}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              runCategoryTests(category.id);
                            }}
                            disabled={isRunning}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            Run
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-slate-700">
                          {category.tests.map(test => {
                            const result = testResults.get(test.id);
                            return (
                              <div
                                key={test.id}
                                className="flex items-center justify-between px-6 py-2 hover:bg-slate-700/30 text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  {result ? getStatusIcon(result.status) : <Clock className="w-4 h-4 text-gray-600" />}
                                  <span className="text-gray-300">{test.name}</span>
                                </div>
                                {result && (
                                  <span className="text-xs text-gray-500">{result.duration}ms</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Test Output Console */}
          <div className="flex-1 flex flex-col bg-black/30">
            <div className="flex items-center justify-between p-3 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Test Output</h3>
              {currentTest && (
                <span className="text-xs text-blue-400 animate-pulse">Running: {currentTest}</span>
              )}
              <button
                onClick={() => setTestLogs([])}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
              {testLogs.map((log, index) => (
                <div key={index} dangerouslySetInnerHTML={{ __html: log }} />
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-700 bg-slate-800/50 text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>Game Context: {currentZone || 'N/A'} | Year {currentYear || 'N/A'}</span>
            <span>Character: {playerCharacter?.name || 'None'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Tests: {testResults.size} run</span>
            <span>Memory: {(performance as any).memory?.usedJSHeapSize ?
              `${((performance as any).memory.usedJSHeapSize / 1048576).toFixed(1)}MB` : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSuitePanel;