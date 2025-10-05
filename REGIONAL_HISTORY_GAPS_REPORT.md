# Regional History Coverage Analysis

## Overview
The regional history files have good coverage for historical periods (post-1000 BCE to 1900s) but significant gaps in **PREHISTORY** entries, especially before -1000.

---

## CRITICAL GAPS BY CULTURAL ZONE

### 1. EUROPE (europe.ts)
**Strong Coverage**: 400 CE onward for all regions
**Missing Prehistory**:
- British Isles: Missing -600 to 399 CE (Romans through Anglo-Saxon transition)
- France: Missing -600 to 399 CE (Late Iron Age Gauls, Roman Gaul)
- Iberian Peninsula: Missing -600 to 399 CE (Late Carthaginian, Roman Hispania)
- Italy: Missing -600 to 399 CE (Etruscan height, early/middle Roman Republic)
- Germanic Lands: Missing -600 to 399 CE (Germanic tribes, Roman contact period)
- Balkans: Missing -600 to 399 CE (Thracian/Illyrian kingdoms, Roman conquest)
- Scandinavia: Missing -3000 to 599 CE (ALL prehistory and early medieval)
- **Greece/Aegean: COMPLETELY MISSING** (noted in comment at line 161)

### 2. MENA (mena.ts)
**Strong Coverage**: -3000 onward for most regions
**Missing**:
- All regions missing -600 to -101 BCE (critical Persian Empire period)
- Arabian Peninsula: Sparse for -3000 to 499 CE (only 2 entries)
- Caucasus: Missing -600 to -101 BCE

### 3. EAST ASIA (eastAsia.ts)
**Excellent Coverage**: -3000 onward for all regions
**Minor Gaps**:
- All regions have continuous century coverage
- Good prehistoric depth

### 4. SOUTH ASIA (southAsia.ts)
**Strong Coverage**: -3000 onward
**Minor Gaps**:
- Indus Valley: -600 missing
- Gangetic Plain: -600, -100 missing
- All regions: -600 to -101 BCE somewhat sparse

### 5. SUB-SAHARAN AFRICA (subSaharanAfrica.ts)
**Major Prehistoric Gaps**:
- Sahel: Missing -500 to -1 CE (500+ years!)
- Upper Guinea: Missing -600 to -1 CE (600 years!)
- Lower Guinea/Congo: Missing -200 to -1 CE (200 years!)
- Horn of Africa: Missing -1000 to -501 BCE
- East African Rift: Missing -1000 to -501 BCE

### 6. SOUTH AMERICA (southAmerica.ts)
**Major Prehistoric Gaps**:
- Andes North: Missing -600 to -301 BCE, -200 to -1 CE
- Andes South: Missing -600 to -301 BCE, -200 to -1 CE
- Amazon Basin: Missing -600 to -301 BCE, -200 to -1 CE
- Gran Chaco/Pampas: Missing -600 to -301 BCE, -200 to -1 CE
- Atlantic Coast: Missing -600 to -301 BCE, -200 to -1 CE

### 7. NORTH AMERICA (northAmerica.ts)
**Good Coverage with Some Gaps**:
- Pacific Coast: Missing -1000 to 1 CE (1000 years!)
- Southwest: Missing -500 to -1 CE (500 years!)
- Great Plains: Missing -1000 to -1 CE (1000 years!)
- Mississippi Valley: Missing -500 to -1 CE (500 years!)
- Northeastern Seaboard: Missing -500 to -1 CE (500 years!)
- Southeast: Missing -500 to -1 CE (500 years!)

### 8. OCEANIA (oceania.ts)
**Special Case - Many Regions Uninhabited in Prehistory**:
- Australia regions: Good coverage (-3000 onward where inhabited)
- New Zealand: Correctly empty until ~1300 CE
- New Guinea/Melanesia: Missing -600 to -1 CE
- Polynesia: Correctly sparse before -1000 BCE

---

## PRIORITY ADDITIONS NEEDED

### TIER 1 - CRITICAL (Most likely to show generic fallback text)
1. **Europe - Greece/Aegean** - COMPLETELY MISSING region
2. **Europe - Scandinavia** - Missing all prehistory (-3000 to 599 CE)
3. **Europe - All Regions** - Missing -600 to 399 CE (crucial Classical period)
4. **Sub-Saharan Africa** - Fill 500-1000 year gaps in all regions
5. **North America** - Fill 500-1000 year gaps in all regions
6. **South America** - Fill -600 to -1 BCE gaps

### TIER 2 - IMPORTANT (Gaps of 100-500 years)
1. **MENA - Arabian Peninsula** - Add prehistoric entries
2. **MENA - All Regions** - Fill -600 to -101 BCE (Persian period)
3. **South Asia** - Fill scattered -600 to -100 BCE gaps
4. **Oceania - New Guinea** - Add -600 to 0 CE entries

### TIER 3 - POLISH (Minor gaps, good fallback coverage)
1. **East Asia** - Already excellent
2. **North America - Modern period** - Add 1600-1800 missing entries
3. **South America - Modern period** - Add 1600-1800 missing centuries

---

## SPECIFIC MISSING ENTRIES BY CENTURY

### BCE Periods Most Affected:
- **-600 to -500**: Missing in Europe (all), MENA (some), South Asia (some), Africa (most), Americas (most)
- **-400 to -300**: Missing in Africa (all), Americas (most)
- **-200 to -100**: Missing in Africa (some), Americas (some), South Asia (some)
- **-100 to 0**: Missing in Africa (some), Americas (some)

### CE Periods Most Affected:
- **0 to 100**: Missing in Americas (most), Africa (some)
- **100 to 300**: Missing in Americas (some)
- **400 to 600**: Missing in Europe (Scandinavia only)

---

## RECOMMENDATIONS

### Immediate Actions:
1. **Add Greece/Aegean region to europe.ts** (8-10 entries from -1000 to 1900)
2. **Fill Scandinavia prehistory** (entries for -3000, -2000, -1000, -600, -300, 0, 100, 200, 300, 400, 500)
3. **Add Classical period to all European regions** (-600, -500, -400, -300, -200, -100, 0, 100, 200, 300)

### Next Priority:
4. **Fill Sub-Saharan Africa prehistoric gaps** (especially -500 to 0 CE for all regions)
5. **Fill North American prehistoric gaps** (especially -500 to 0 CE for all regions)
6. **Fill South American prehistoric gaps** (especially -400 to 0 CE for all regions)

### Long-term:
7. Ensure every region has AT MINIMUM one entry per:
   - Major prehistoric period (-3000, -2000, -1000)
   - Classical period (-500, 0, 500)
   - Medieval period (1000, 1200)
   - Early modern period (1500, 1600, 1700)
   - Modern period (1800, 1900, 2000)

---

## FALLBACK BEHAVIOR

When a specific regional entry is missing, the service falls back to:
1. Adjacent centuries (±100 years)
2. Other regions in same zone for that century
3. Era-level description from HISTORY_GUIDE_DATA

**Most common fallback triggers**: Prehistory queries (-3000 to 0 CE) in:
- Africa (all regions)
- Americas (all regions)
- Europe (Greece, Scandinavia, Classical period)
- Oceania (mainland SE Asia gap)

---

## ESTIMATED WORK

- **Europe - Critical gaps**: ~50 entries (Greece region + Classical period + Scandinavia)
- **Africa - Prehistoric gaps**: ~25 entries
- **Americas - Prehistoric gaps**: ~30 entries
- **Minor polish**: ~20 entries

**Total**: ~125 new entries needed for comprehensive coverage
**Estimated time**: 15-20 hours of historical research and writing
