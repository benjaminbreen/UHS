/**
 * Test Suite Type Definitions
 */

export type TestStatus = 'pending' | 'running' | 'pass' | 'fail' | 'skip' | 'warning';

export type TestPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Test {
  id: string;
  name: string;
  description?: string;
  category: string;
  priority: TestPriority;
  tags?: string[];
  timeout?: number;
  retries?: number;
  fn: (context: TestContext) => Promise<void> | void;
}

export interface TestContext {
  playerCharacter?: any;
  mapData?: any;
  currentZone?: string;
  currentYear?: number;
  assert: Assert;
  skip: (reason?: string) => void;
  warn: (message: string) => void;
  log: (message: string) => void;
  measure: (name: string, fn: () => Promise<any>) => Promise<any>;
}

export interface TestResult {
  id: string;
  name: string;
  category: string;
  status: TestStatus;
  duration: number;
  error?: string;
  stackTrace?: string;
  warnings?: string[];
  logs?: string[];
  screenshots?: string[];
  performanceMetrics?: PerformanceMetrics;
  timestamp: number;
}

export interface TestCategory {
  id: string;
  name: string;
  description?: string;
  priority: TestPriority;
  tests: Test[];
  dependencies?: string[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  warnings?: number;
  duration: number;
  passRate: number;
  coverage?: number;
  timestamp: number;
  categories?: CategorySummary[];
}

export interface CategorySummary {
  id: string;
  name: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

export interface PerformanceMetrics {
  fps?: number;
  memoryUsage?: number;
  renderTime?: number;
  apiCallTime?: number;
  domNodes?: number;
  jsHeapSize?: number;
}

export interface Assert {
  // Basic assertions
  equal: (actual: any, expected: any, message?: string) => void;
  notEqual: (actual: any, expected: any, message?: string) => void;
  strictEqual: (actual: any, expected: any, message?: string) => void;
  deepEqual: (actual: any, expected: any, message?: string) => void;

  // Truthiness
  true: (value: any, message?: string) => void;
  false: (value: any, message?: string) => void;
  truthy: (value: any, message?: string) => void;
  falsy: (value: any, message?: string) => void;

  // Existence
  exists: (value: any, message?: string) => void;
  notExists: (value: any, message?: string) => void;
  defined: (value: any, message?: string) => void;
  undefined: (value: any, message?: string) => void;
  null: (value: any, message?: string) => void;
  notNull: (value: any, message?: string) => void;

  // Type checking
  isType: (value: any, type: string, message?: string) => void;
  isArray: (value: any, message?: string) => void;
  isObject: (value: any, message?: string) => void;
  isString: (value: any, message?: string) => void;
  isNumber: (value: any, message?: string) => void;
  isBoolean: (value: any, message?: string) => void;
  isFunction: (value: any, message?: string) => void;

  // Comparisons
  greaterThan: (actual: number, expected: number, message?: string) => void;
  greaterThanOrEqual: (actual: number, expected: number, message?: string) => void;
  lessThan: (actual: number, expected: number, message?: string) => void;
  lessThanOrEqual: (actual: number, expected: number, message?: string) => void;
  between: (value: number, min: number, max: number, message?: string) => void;

  // Collections
  contains: (collection: any[] | string, item: any, message?: string) => void;
  notContains: (collection: any[] | string, item: any, message?: string) => void;
  lengthOf: (collection: any[] | string, length: number, message?: string) => void;
  empty: (collection: any[] | string | object, message?: string) => void;
  notEmpty: (collection: any[] | string | object, message?: string) => void;

  // Errors
  throws: (fn: () => any, expectedError?: string | RegExp | typeof Error, message?: string) => void;
  doesNotThrow: (fn: () => any, message?: string) => void;
  rejects: (promise: Promise<any>, expectedError?: string | RegExp | typeof Error, message?: string) => Promise<void>;
  doesNotReject: (promise: Promise<any>, message?: string) => Promise<void>;

  // Custom game-specific assertions
  validTile: (tile: any, message?: string) => void;
  validBiome: (biome: string, message?: string) => void;
  validNPC: (npc: any, message?: string) => void;
  validItem: (item: any, message?: string) => void;
  validModal: (modal: any, message?: string) => void;
  validSaveData: (data: any, message?: string) => void;
  performanceWithin: (metric: string, maxValue: number, message?: string) => void;
}

export interface TestRunner {
  getCategories: () => Promise<TestCategory[]>;
  runTest: (test: Test, context?: Partial<TestContext>) => Promise<TestResult>;
  runCategory: (categoryId: string, context?: Partial<TestContext>) => Promise<TestResult[]>;
  runAll: (context?: Partial<TestContext>) => Promise<TestSummary>;
  runSmoke: (context?: Partial<TestContext>) => Promise<TestSummary>;
  stop: () => void;
  reset: () => void;
}

export interface TestReporter {
  onTestStart: (test: Test) => void;
  onTestComplete: (result: TestResult) => void;
  onCategoryStart: (category: TestCategory) => void;
  onCategoryComplete: (category: TestCategory, results: TestResult[]) => void;
  onSuiteComplete: (summary: TestSummary) => void;
  generateReport: () => string;
  exportResults: (format: 'json' | 'html' | 'markdown') => string;
}