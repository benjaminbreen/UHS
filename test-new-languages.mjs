import { getLanguageForCharacter, LANGUAGES } from './constants/gameData/languages.ts';

console.log('Testing all new languages and regional mappings\n');
console.log('='.repeat(80));

const tests = [
  // West African Kingdoms
  { name: 'Ghana Empire - SONINKE', zone: 'SUB_SAHARAN_AFRICAN', year: 800, region: 'Ghana Empire', area: 'Wagadou', expected: 'SONINKE' },
  { name: 'Mali Empire - MANDINKA', zone: 'SUB_SAHARAN_AFRICAN', year: 1350, region: 'Upper Niger', area: 'Mali Empire', expected: 'MANDINKA' },
  { name: 'Songhai Empire - SONGHAI', zone: 'SUB_SAHARAN_AFRICAN', year: 1500, region: 'Songhai Empire', area: 'Gao Empire', expected: 'SONGHAI' },

  // Southeast Asian Mainland
  { name: 'Khmer Empire - KHMER', zone: 'SOUTH_ASIAN', year: 1100, region: 'Tonle Sap', area: 'Angkor', expected: 'KHMER' },
  { name: 'Mon Kingdoms - MON', zone: 'SOUTH_ASIAN', year: 900, region: 'Lower Burma', area: 'Pegu', expected: 'MON' },
  { name: 'Pagan Kingdom - BURMESE', zone: 'SOUTH_ASIAN', year: 1200, region: 'Burma Empire', area: 'Pagan Kingdom', expected: 'BURMESE' },
  { name: 'Ayutthaya - THAI', zone: 'SOUTH_ASIAN', year: 1600, region: 'Chao Phraya', area: 'Ayutthaya', expected: 'THAI' },

  // Pre-Columbian Caribbean
  { name: 'Greater Antilles - TAINO', zone: 'NORTH_AMERICAN_PRE_COLUMBIAN', year: 1000, region: 'Greater Antilles', area: 'Hispaniola', expected: 'TAINO' },
  { name: 'Greater Antilles Ancient - PROTO_ARAWAKAN', zone: 'SOUTH_AMERICAN', year: -1000, region: 'Greater Antilles', area: 'Cuba', expected: 'PROTO_ARAWAKAN' },
  { name: 'Lesser Antilles - PROTO_CARIBAN', zone: 'SOUTH_AMERICAN', year: -500, region: 'Lesser Antilles', area: 'Windward Islands', expected: 'PROTO_CARIBAN' },
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  const language = getLanguageForCharacter(
    test.zone,
    test.year,
    test.region,
    test.area
  );

  const yearDisplay = test.year < 0 ? `${Math.abs(test.year)} BCE` : `${test.year} CE`;
  const success = language?.id === test.expected;

  if (success) {
    console.log(`\n✅ PASSED: ${test.name}`);
    console.log(`   Year: ${yearDisplay}, Region: ${test.region} / ${test.area}`);
    console.log(`   Got: ${language.name} (${language.nativeName})`);
    passed++;
  } else {
    console.log(`\n❌ FAILED: ${test.name}`);
    console.log(`   Year: ${yearDisplay}, Region: ${test.region} / ${test.area}`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got: ${language ? `${language.id} (${language.name})` : 'null'}`);
    failed++;
  }
}

// Test proto-language nativeNames
console.log('\n' + '='.repeat(80));
console.log('\nTesting proto-language nativeNames (should not be undefined):\n');

const protoLanguages = [
  'PROTO_ALGONQUIAN',
  'PROTO_SIOUAN',
  'PROTO_PAMA_NYUNGAN',
  'PROTO_AUSTRONESIAN',
  'PROTO_POLYNESIAN',
  'PROTO_ARAWAKAN',
  'PROTO_CARIBAN',
];

let protoTestsPassed = 0;
let protoTestsFailed = 0;

for (const langId of protoLanguages) {
  const lang = LANGUAGES[langId];
  if (lang && lang.nativeName && lang.nativeName !== 'undefined') {
    console.log(`✅ ${langId}: "${lang.nativeName}"`);
    protoTestsPassed++;
  } else {
    console.log(`❌ ${langId}: Missing or undefined nativeName`);
    protoTestsFailed++;
  }
}

// Summary
console.log('\n' + '='.repeat(80));
console.log('\n📊 TEST SUMMARY:');
console.log(`Regional Mappings: ${passed} passed, ${failed} failed`);
console.log(`Proto NativeNames: ${protoTestsPassed} passed, ${protoTestsFailed} failed`);

const totalPassed = passed + protoTestsPassed;
const totalFailed = failed + protoTestsFailed;
console.log(`\nOVERALL: ${totalPassed}/${totalPassed + totalFailed} tests passed`);

if (totalFailed === 0) {
  console.log('\n🎉 All tests passed!');
} else {
  console.log(`\n⚠️  ${totalFailed} test(s) failed`);
}
