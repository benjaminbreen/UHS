# Universal History Simulator - Test Suite Roadmap

## Executive Summary
This document outlines the current state, findings, and future implementation plan for a comprehensive testing suite for the Universal History Simulator, a complex educational history game with 500+ React components and 160+ services.

---

## 📊 Current State Analysis

### Codebase Scale
- **506 React Components** (.tsx files)
- **164 Service Files** (business logic)
- **21 Custom Hooks** (React state management)
- **47+ Modal Components** (UI interactions)
- **50+ Biome Types** (map generation)
- **9 Game Modes** (different play styles)
- **No existing test framework** (package.json has no test dependencies)

### Architecture Overview
```
/august-6-uhs
├── components/        # 506 React components
├── services/         # 164 service files (game logic)
├── hooks/           # 21 custom React hooks
├── generation/      # Map & content generation
├── constants/       # Game data and configuration
├── types/          # TypeScript definitions
└── utils/          # Helper functions
```

### Key Systems Identified
1. **Map Generation System** (`generation/standardMap/`, `generation/specialMap/`)
2. **Event System** (`services/eventService.ts`, 9 game modes)
3. **Combat System** (`services/combatService.ts`, `components/CombatModal.tsx`)
4. **Save/Load System** (`services/saveGameService.ts`, `services/shareableStateService.ts`)
5. **NPC System** (`services/npcPersistenceService.ts`, NPC generation & behavior)
6. **Disease System** (`services/diseaseService.ts`, progression mechanics)
7. **Quest System** (`services/questService.ts`, educational objectives)
8. **Primary Sources** (`services/primarySourceService.ts`, 167 historical documents)

---

## 🔍 Findings from Implementation Attempts

### Week 1 Implementation (Success) ✅
Successfully created test infrastructure:
- **TestSuitePanel.tsx**: Professional UI with real-time test execution
- **testSuiteCore.ts**: Test runner with timeout, retry logic, performance metrics
- **assertions.ts**: 50+ assertion methods including game-specific validations
- **testReporter.ts**: Result reporting with IndexedDB storage
- **types.ts**: Complete TypeScript definitions for test system

### Week 2 Implementation (Lessons Learned) ⚠️
Initial attempts revealed critical issues:

#### Problems Encountered:
1. **Import/Export Mismatches**: Many functions are not exported or use different names
   - Example: Tried `generateStandardMap`, actual export is `proceduralGenerateMap`
2. **No Test Environment**: No test configuration in package.json
3. **Tight Coupling**: Many components directly import services without dependency injection
4. **Side Effects**: Services often have global state or localStorage dependencies
5. **Missing Mocks**: No existing mock infrastructure for complex systems

#### Technical Debt Discovered:
- Multiple `TODO`, `FIXME`, `BUG`, `HACK` comments throughout codebase
- Deprecated systems still referenced (e.g., ambiance text system)
- Complex circular dependencies between services

---

## 🎯 Proposed Test Strategy

### Testing Philosophy
1. **Progressive Enhancement**: Start with what's testable, gradually improve testability
2. **Risk-Based Priority**: Test critical path features first
3. **Isolation Through Mocking**: Create comprehensive mock layer
4. **Real Integration Tests**: Test actual game flows end-to-end
5. **Performance Monitoring**: Track regressions in key metrics

### Test Categories Priority Matrix

| Priority | Category | Coverage Target | Timeline |
|----------|----------|-----------------|----------|
| P0 | Critical Path | 90% | Week 1-2 |
| P1 | Core Systems | 80% | Week 3-4 |
| P2 | Game Features | 70% | Week 5-6 |
| P3 | UI Components | 60% | Week 7-8 |
| P4 | Educational | 50% | Week 9-10 |

---

## 📅 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2) ✅ COMPLETED
- [x] Create test infrastructure
- [x] Build assertion library
- [x] Implement test runner
- [x] Create reporting system
- [x] Wire to UI

### Phase 2: Test Environment Setup (Week 3) 🚀 NEXT
```json
// Add to package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@vitest/ui": "^1.0.0",
    "vitest": "^1.0.0",
    "jsdom": "^23.0.0",
    "@vitest/coverage": "^1.0.0"
  }
}
```

### Phase 3: Mock Infrastructure (Week 4)
Create comprehensive mocks for:
```typescript
// services/testSuite/mocks/
├── mockMapGenerator.ts
├── mockEventService.ts
├── mockCombatService.ts
├── mockSaveService.ts
├── mockNPCService.ts
└── mockLocalStorage.ts
```

### Phase 4: Critical Path Tests (Weeks 5-6)

#### 4.1 Map Generation Tests
```typescript
describe('Map Generation', () => {
  test('generates valid map with all biomes', async () => {
    const map = await proceduralGenerateMap({...});
    expect(map.tiles).toHaveLength(expectedTileCount);
    expect(map.biomes).toContainAllBiomes();
  });

  test('seed reproducibility', async () => {
    const map1 = await generateWithSeed('TEST');
    const map2 = await generateWithSeed('TEST');
    expect(map1).toDeepEqual(map2);
  });
});
```

#### 4.2 Save/Load Tests
```typescript
describe('Save/Load System', () => {
  test('preserves complete game state', async () => {
    const state = createTestState();
    const savedId = await saveGame(state);
    const loaded = await loadGame(savedId);
    expect(loaded).toMatchGameState(state);
  });
});
```

### Phase 5: Integration Tests (Weeks 7-8)

#### Test Scenarios:
1. **New Game Flow**: Start → Character Creation → World Generation → Gameplay
2. **Combat Flow**: Encounter → Battle → Victory/Defeat → Loot
3. **Quest Flow**: Receive Quest → Complete Objectives → Claim Rewards
4. **Save/Share Flow**: Save Game → Generate URL → Load from URL

### Phase 6: UI Component Tests (Week 9)

Focus on critical modals:
```typescript
describe('Modal Components', () => {
  test.each(CRITICAL_MODALS)('$name opens and closes correctly', async (modal) => {
    const { getByRole } = render(<modal.Component />);
    expect(getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(getByRole('button', { name: /close/i }));
    expect(queryByRole('dialog')).not.toBeInTheDocument();
  });
});
```

### Phase 7: Performance Tests (Week 10)

```typescript
describe('Performance Benchmarks', () => {
  test('map generation under 2 seconds', async () => {
    const start = performance.now();
    await generateLargeMap(100, 100);
    expect(performance.now() - start).toBeLessThan(2000);
  });

  test('no memory leaks in gameplay loop', async () => {
    const initialMemory = getMemoryUsage();
    await simulateGameplay(30); // 30 minutes
    expect(getMemoryUsage()).toBeLessThan(initialMemory * 1.5);
  });
});
```

### Phase 8: Educational Feature Tests (Week 11)

```typescript
describe('Educational Features', () => {
  test('primary sources accessible', async () => {
    const sources = await primarySourceService.getSources();
    expect(sources).toHaveLength(167);
  });

  test('quest learning objectives tracked', async () => {
    const quest = await startEducationalQuest();
    await completeObjective(quest.objectives[0]);
    expect(quest.progress).toBe(1);
  });
});
```

### Phase 9: Continuous Integration (Week 12)

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

---

## 🎯 Success Metrics

### Coverage Goals
- **Critical Path**: 90% coverage
- **Core Systems**: 80% coverage
- **UI Components**: 70% coverage
- **Overall**: 75% coverage

### Performance Targets
- **Test Suite Runtime**: < 5 minutes for full suite
- **Smoke Tests**: < 30 seconds
- **CI Pipeline**: < 10 minutes total

### Quality Indicators
- **Bug Detection Rate**: Find 80% of bugs before production
- **Regression Prevention**: 95% of fixed bugs stay fixed
- **Flaky Test Rate**: < 2% of tests

---

## 🚧 Challenges & Mitigations

### Challenge 1: No Existing Test Infrastructure
**Mitigation**: Build incrementally, starting with most critical systems

### Challenge 2: Tightly Coupled Code
**Mitigation**: Create comprehensive mock layer, refactor gradually

### Challenge 3: Complex State Management
**Mitigation**: Use state snapshots and deterministic testing

### Challenge 4: Performance Testing Complexity
**Mitigation**: Create performance benchmark suite with baselines

### Challenge 5: 500+ Components to Test
**Mitigation**: Focus on critical path, use snapshot testing for others

---

## 📊 Resource Requirements

### Team Needs
- **1 Test Engineer**: Full-time for initial 12 weeks
- **Developer Support**: 20% time for refactoring/exports
- **Code Review**: All test PRs reviewed by game developers

### Tools & Infrastructure
- **Vitest**: Modern, fast test runner
- **Testing Library**: React component testing
- **Playwright**: E2E testing (future)
- **GitHub Actions**: CI/CD pipeline
- **Codecov**: Coverage tracking

### Time Estimate
- **Phase 1-2**: ✅ Complete (2 weeks)
- **Phase 3-9**: 10 weeks remaining
- **Total**: 12 weeks to comprehensive coverage

---

## 🎉 Expected Outcomes

### Immediate Benefits (Weeks 1-4)
- Catch critical bugs before deployment
- Confidence in core system stability
- Regression detection for fixed bugs

### Medium-term Benefits (Weeks 5-8)
- Faster development through automated validation
- Safe refactoring with test coverage
- Performance regression detection

### Long-term Benefits (Weeks 9-12)
- Full CI/CD pipeline
- Comprehensive documentation through tests
- Onboarding tool for new developers
- Educational assessment validation

---

## 📝 Next Steps

1. **Immediate**: Add test dependencies to package.json
2. **Week 3**: Create mock infrastructure
3. **Week 4**: Begin critical path test implementation
4. **Week 5**: Implement integration tests
5. **Ongoing**: Refactor code for better testability

---

## Appendix: Test File Structure

```
/august-6-uhs
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── utils/
│   ├── integration/
│   │   ├── flows/
│   │   └── systems/
│   ├── e2e/
│   │   └── scenarios/
│   └── performance/
│       └── benchmarks/
├── services/testSuite/  # Existing test infrastructure
│   ├── assertions.ts
│   ├── testRunner.ts
│   ├── testReporter.ts
│   └── mocks/
└── vitest.config.ts
```

---

*Document Version: 1.0*
*Created: September 21, 2024*
*Last Updated: September 21, 2024*
*Author: Test Engineering Team*