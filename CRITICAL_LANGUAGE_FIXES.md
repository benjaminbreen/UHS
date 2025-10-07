# Critical Language Chain Fixes - Quick Reference

## Top 15 Most Critical Broken Chains

### 1. Greek Evolution Chain (BROKEN)
```
ANCIENT_GREEK (Line 255)
    ↓ [successors: KOINE_GREEK] ❌ MISSING
    ↓
BYZANTINE_GREEK (Line 1010)
    ↓ [predecessors: KOINE_GREEK] ❌ MISSING
    ↓
MODERN_GREEK
```

**FIX**: Add KOINE_GREEK entry (~300 BCE to 300 CE)
```typescript
KOINE_GREEK: {
  id: 'KOINE_GREEK',
  name: 'Koine Greek',
  period: [-300, 300],
  predecessors: ['ANCIENT_GREEK'],
  successors: ['BYZANTINE_GREEK'],
  // ... other fields
}
```

---

### 2. Latin → Romance Chain (BROKEN)
```
LATIN (Line 212)
    ↓ [successors: VULGAR_LATIN, SPANISH, PORTUGUESE, ROMANIAN] ❌ ALL MISSING
    ↓
OLD_FRENCH (Line 784)
    ↓ [predecessors: VULGAR_LATIN, FRANKISH] ❌ BOTH MISSING
```

**FIX**: Add VULGAR_LATIN (~200 BCE to 800 CE)
```typescript
VULGAR_LATIN: {
  id: 'VULGAR_LATIN',
  name: 'Vulgar Latin',
  period: [-200, 800],
  predecessors: ['LATIN'],
  successors: ['OLD_FRENCH', 'ITALIAN', 'EARLY_SPANISH', 'EARLY_PORTUGUESE', 'ROMANIAN'],
  // ... other fields
}
```

**Also add**:
- ROMANIAN (modern Romance language)
- OLD_SPANISH (900-1300 CE) - link EARLY_SPANISH
- GALICIAN_PORTUGUESE (900-1350 CE) - link EARLY_PORTUGUESE
- FRANKISH (500-900 CE) - Germanic influence on Old French

---

### 3. Germanic Chain (BROKEN)
```
PROTO_GERMANIC (Line 561)
    ↓ [successors: OLD_HIGH_GERMAN] ❌ MISSING
    ↓
GERMAN (Line 3469)
    ↓ [predecessors: OLD_HIGH_GERMAN] ❌ MISSING
    ↓ [successors: MODERN_GERMAN] ❌ MISSING
```

**FIX**: Add OLD_HIGH_GERMAN (500-1050 CE)
```typescript
OLD_HIGH_GERMAN: {
  id: 'OLD_HIGH_GERMAN',
  name: 'Old High German',
  period: [500, 1050],
  predecessors: ['PROTO_GERMANIC'],
  successors: ['GERMAN'],
  // ... other fields
}
```

**Also add**:
- MODERN_GERMAN (1800-present)
- OLD_DUTCH (500-1150 CE) - for DUTCH chain

---

### 4. Sanskrit → Modern Indo-Aryan (BROKEN)
```
SANSKRIT (Line 333)
    ↓ [successors: PRAKRITS, HINDI, BENGALI, MARATHI] ❌ ALL MISSING
    ↓
MUGHAL_URDU (Line 2796)
    ↓ [predecessors: HINDUSTANI] ❌ MISSING
```

**FIX**: Add critical Middle Indo-Aryan languages
```typescript
PRAKRITS: {
  id: 'PRAKRITS',
  name: 'Prakrits',
  period: [-600, 1000],
  predecessors: ['SANSKRIT', 'CLASSICAL_SANSKRIT'],
  successors: ['HINDI', 'BENGALI', 'MARATHI', 'HINDUSTANI'],
}

HINDUSTANI: {
  id: 'HINDUSTANI',
  name: 'Hindustani',
  period: [1200, 1800],
  predecessors: ['PRAKRITS'],
  successors: ['MUGHAL_URDU', 'MODERN_HINDI'],
}

HINDI: {
  id: 'HINDI',
  name: 'Hindi',
  period: [1000, 2024],
  predecessors: ['PRAKRITS'],
}

BENGALI: {
  id: 'BENGALI',
  name: 'Bengali',
  period: [1000, 2024],
  predecessors: ['PRAKRITS'],
}
```

---

### 5. Chinese Evolution (BROKEN)
```
CLASSICAL_CHINESE (Line 423)
    ↓ [successors: MANDARIN] ❌ MISSING
    ↓
MIDDLE_CHINESE (Line 1055)
    ↓ [successors: MANDARIN] ❌ MISSING
    ↓
EARLY_MANDARIN (Line 2818)
    ↓ [successors: MODERN_MANDARIN] ❌ MISSING
```

**FIX**: Either rename EARLY_MANDARIN to MANDARIN, or add:
```typescript
MANDARIN: {
  id: 'MANDARIN',
  name: 'Mandarin Chinese',
  period: [1200, 1900],
  predecessors: ['MIDDLE_CHINESE'],
  successors: ['MODERN_MANDARIN'],
}

MODERN_MANDARIN: {
  id: 'MODERN_MANDARIN',
  name: 'Modern Mandarin',
  period: [1900, 2024],
  predecessors: ['EARLY_MANDARIN'],
}
```

---

### 6. Japanese Evolution (BROKEN)
```
CLASSICAL_JAPANESE (Line 1071)
    ↓ [successors: MIDDLE_JAPANESE] ❌ MISSING
    ↓
EDO_JAPANESE (Line 2840)
    ↓ [predecessors: MIDDLE_JAPANESE] ❌ MISSING
    ↓ [successors: MODERN_JAPANESE] ❌ MISSING
```

**FIX**: Add MIDDLE_JAPANESE
```typescript
MIDDLE_JAPANESE: {
  id: 'MIDDLE_JAPANESE',
  name: 'Middle Japanese',
  period: [1185, 1603],
  predecessors: ['CLASSICAL_JAPANESE'],
  successors: ['EDO_JAPANESE'],
}

MODERN_JAPANESE: {
  id: 'MODERN_JAPANESE',
  name: 'Modern Japanese',
  period: [1868, 2024],
  predecessors: ['EDO_JAPANESE'],
}
```

---

### 7. Arabic Chain (BROKEN)
```
PROTO_AFROASIATIC (Line 193)
    ↓ [successors: PROTO_SEMITIC] ❌ MISSING
    ↓
CLASSICAL_ARABIC (Line 1033)
    ↓ [predecessors: OLD_ARABIC] ❌ MISSING
```

**FIX**: Add Proto-Semitic and Old Arabic
```typescript
PROTO_SEMITIC: {
  id: 'PROTO_SEMITIC',
  name: 'Proto-Semitic',
  period: [-3750, -2500],
  predecessors: ['PROTO_AFROASIATIC'],
  successors: ['AKKADIAN', 'ANCIENT_HEBREW', 'PHOENICIAN', 'OLD_ARABIC'],
  isReconstructed: true,
}

OLD_ARABIC: {
  id: 'OLD_ARABIC',
  name: 'Old Arabic',
  period: [-500, 600],
  predecessors: ['PROTO_SEMITIC'],
  successors: ['CLASSICAL_ARABIC'],
}
```

---

### 8. English Chain (BROKEN)
```
EARLY_MODERN_ENGLISH (Line 1868)
    ↓ [successors: MODERN_ENGLISH] ❌ MISSING
```

**FIX**: Add MODERN_ENGLISH
```typescript
MODERN_ENGLISH: {
  id: 'MODERN_ENGLISH',
  name: 'Modern English',
  period: [1800, 2024],
  predecessors: ['EARLY_MODERN_ENGLISH'],
}
```

---

### 9. Aramaic Branch (BROKEN)
```
ARAMAIC (Line 277)
    ↓ [successors: SYRIAC, MANDAIC] ❌ BOTH MISSING
```

**FIX**: Add Aramaic descendants
```typescript
SYRIAC: {
  id: 'SYRIAC',
  name: 'Syriac',
  period: [100, 1200],
  predecessors: ['ARAMAIC'],
}

MANDAIC: {
  id: 'MANDAIC',
  name: 'Mandaic',
  period: [100, 2024],
  predecessors: ['ARAMAIC'],
}
```

---

### 10. Phoenician Branch (BROKEN)
```
PHOENICIAN (Line 829)
    ↓ [successors: PUNIC, HEBREW] ❌ BOTH MISSING
```

**FIX**: Add Punic and fix Hebrew reference
```typescript
PUNIC: {
  id: 'PUNIC',
  name: 'Punic',
  period: [-900, 300],
  predecessors: ['PHOENICIAN'],
}
```

**Also**: Update PHOENICIAN successors to use 'ANCIENT_HEBREW' instead of 'HEBREW'

---

### 11-15. Additional Critical Fixes

11. **MIDDLE_FRENCH** (1300-1600 CE) - Bridge OLD_FRENCH to modern French
12. **OLD_NORMAN_FRENCH** (1000-1300 CE) - For Middle English predecessors
13. **PROTO_TIBETO_BURMAN** (-4000 to -2000 BCE) - Major Sino-Tibetan branch
14. **MODERN_URDU** (1800-present) - For Mughal Urdu successors
15. **OLD_ANATOLIAN_TURKISH** (1000-1500 CE) - Bridge to Ottoman Turkish

---

## Ancient Languages Missing Predecessors

These should link to proto-languages:

| Language | Line | Should Link To |
|----------|------|----------------|
| Ancient Egyptian | 312 | PROTO_AFROASIATIC |
| Akkadian | 298 | PROTO_SEMITIC |
| Phoenician | 829 | PROTO_SEMITIC |
| Aramaic | 277 | PROTO_SEMITIC |
| Sanskrit | 333 | PROTO_INDO_IRANIAN |
| Berber | 2020 | PROTO_BERBER |
| Beja | 2171 | PROTO_CUSHITIC |

---

## Summary Statistics

- **Total Languages**: 199
- **Broken References**: 69 total
  - 12 broken predecessor refs
  - 57 broken successor refs
- **Missing Languages**: 61 unique IDs
- **Orphaned Ancient Languages**: 10

## Validation

After making fixes, run:
```bash
python3 /Users/benjaminbreen/code/august-6-uhs/analyze_languages.py
```

This will re-check all chains and confirm fixes.
