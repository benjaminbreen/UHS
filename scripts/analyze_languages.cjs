const fs = require('fs');

// Read the entire languages.ts file
const content = fs.readFileSync('/Users/benjaminbreen/code/august-6-uhs/constants/gameData/languages.ts', 'utf-8');

// Split into lines for line number tracking
const lines = content.split('\n');

// Extract all language definitions - they're in a Record<string, LanguageData> structure
const languagePattern = /(\w+):\s*\{[^}]*?id:\s*'([^']+)'[^}]*?name:\s*'([^']+)'[^}]*?family:\s*LANGUAGE_FAMILIES\.(\w+)|'([^']+)'[^}]*?period:\s*\[(-?\d+),\s*(-?\d+)\]/gs;

const languages = [];
const langMap = new Map();

// Parse the entire export const LANGUAGES object
const languagesMatch = content.match(/export const LANGUAGES: Record<string, LanguageData> = \{([\s\S]*)\};/);
if (!languagesMatch) {
  console.log('ERROR: Could not find LANGUAGES export');
  process.exit(1);
}

const languagesContent = languagesMatch[1];

// Split by language entries (each starts with an uppercase ID followed by colon)
const entries = languagesContent.split(/\n\s*([A-Z_][A-Z_0-9]*?):\s*\{/).filter(s => s.trim());

for (let i = 0; i < entries.length; i += 2) {
  if (i + 1 >= entries.length) break;

  const key = entries[i].trim();
  const body = entries[i + 1];

  // Extract fields
  const idMatch = body.match(/id:\s*'([^']+)'/);
  const nameMatch = body.match(/name:\s*'([^']+)'/);
  const familyMatch = body.match(/family:\s*(?:LANGUAGE_FAMILIES\.(\w+)|'([^']+)')/);
  const periodMatch = body.match(/period:\s*\[(-?\d+),\s*(-?\d+)\]/);
  const predecessorsMatch = body.match(/predecessors:\s*\[([^\]]*)\]/);
  const successorsMatch = body.match(/successors:\s*\[([^\]]*)\]/);

  if (!idMatch || !nameMatch || !familyMatch || !periodMatch) continue;

  const id = idMatch[1];
  const name = nameMatch[1];
  const family = familyMatch[1] || familyMatch[2];
  const startYear = parseInt(periodMatch[1]);
  const endYear = parseInt(periodMatch[2]);

  // Parse predecessors
  const predecessors = predecessorsMatch ?
    predecessorsMatch[1]
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''))
      .filter(s => s.length > 0) : [];

  // Parse successors
  const successors = successorsMatch ?
    successorsMatch[1]
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''))
      .filter(s => s.length > 0) : [];

  // Find line number
  const searchStr = `${key}: {`;
  const lineIndex = lines.findIndex(line => line.includes(searchStr));

  const lang = {
    key,
    id,
    name,
    family,
    startYear,
    endYear,
    predecessors,
    successors,
    lineNumber: lineIndex + 1
  };

  languages.push(lang);
  langMap.set(id, lang);
}

console.log(`\n=== ANALYSIS OF ${languages.length} LANGUAGES ===\n`);

// Build a set of all valid language IDs
const validIds = new Set(languages.map(l => l.id));

// Track issues
const issues = {
  missingPredecessors: [],
  missingSuccessors: [],
  majorLanguagesWithoutPredecessors: [],
  referencedButNotDefined: new Set()
};

// Check each language
languages.forEach(lang => {
  // Check predecessors
  lang.predecessors.forEach(predId => {
    if (!validIds.has(predId)) {
      issues.missingPredecessors.push({
        language: lang.name,
        id: lang.id,
        key: lang.key,
        missingPredecessor: predId,
        lineNumber: lang.lineNumber
      });
      issues.referencedButNotDefined.add(predId);
    }
  });

  // Check successors
  lang.successors.forEach(succId => {
    if (!validIds.has(succId)) {
      issues.missingSuccessors.push({
        language: lang.name,
        id: lang.id,
        key: lang.key,
        missingSuccessor: succId,
        lineNumber: lang.lineNumber
      });
      issues.referencedButNotDefined.add(succId);
    }
  });

  // Check for major attested languages without predecessors
  const isProtoLanguage = lang.name.startsWith('Proto-') || lang.name.includes('Proto ') || lang.key.startsWith('PROTO_');
  const isAncientOrClassical = lang.startYear < 500 && lang.startYear > -5000;
  const hasPredecessors = lang.predecessors.length > 0;

  if (!isProtoLanguage && isAncientOrClassical && !hasPredecessors) {
    // Filter for significant families
    const significantFamilies = ['INDO_EUROPEAN', 'SINO_TIBETAN', 'AFRO_ASIATIC', 'NIGER_CONGO', 'AUSTRONESIAN', 'JAPONIC', 'KOREANIC', 'DRAVIDIAN', 'TURKIC', 'MONGOLIC'];
    if (significantFamilies.includes(lang.family) || family.includes('Indo-European') || family.includes('Sino-Tibetan')) {
      issues.majorLanguagesWithoutPredecessors.push({
        language: lang.name,
        id: lang.id,
        key: lang.key,
        family: lang.family,
        startYear: lang.startYear,
        lineNumber: lang.lineNumber
      });
    }
  }
});

// Report findings
console.log('### 1. LANGUAGES REFERENCING NON-EXISTENT PREDECESSORS ###\n');
if (issues.missingPredecessors.length === 0) {
  console.log('✓ No broken predecessor references found.\n');
} else {
  issues.missingPredecessors
    .sort((a, b) => a.lineNumber - b.lineNumber)
    .forEach(issue => {
      console.log(`Line ${issue.lineNumber}: ${issue.language} (${issue.key})`);
      console.log(`  → References missing predecessor: "${issue.missingPredecessor}"\n`);
    });
}

console.log('### 2. LANGUAGES REFERENCING NON-EXISTENT SUCCESSORS ###\n');
if (issues.missingSuccessors.length === 0) {
  console.log('✓ No broken successor references found.\n');
} else {
  issues.missingSuccessors
    .sort((a, b) => a.lineNumber - b.lineNumber)
    .forEach(issue => {
      console.log(`Line ${issue.lineNumber}: ${issue.language} (${issue.key})`);
      console.log(`  → References missing successor: "${issue.missingSuccessor}"\n`);
    });
}

console.log('### 3. PROTO-LANGUAGES REFERENCED BUT NOT DEFINED ###\n');
if (issues.referencedButNotDefined.size === 0) {
  console.log('✓ All referenced proto-languages are defined.\n');
} else {
  const protoLanguages = Array.from(issues.referencedButNotDefined)
    .filter(id => id.includes('PROTO') || id.includes('proto'))
    .sort();

  const otherLanguages = Array.from(issues.referencedButNotDefined)
    .filter(id => !id.includes('PROTO') && !id.includes('proto'))
    .sort();

  if (protoLanguages.length > 0) {
    console.log('Proto-languages:');
    protoLanguages.forEach(id => {
      console.log(`  • ${id}`);
    });
    console.log();
  }

  if (otherLanguages.length > 0) {
    console.log('Other missing languages:');
    otherLanguages.forEach(id => {
      console.log(`  • ${id}`);
    });
    console.log();
  }
}

console.log('### 4. MAJOR ANCIENT/CLASSICAL LANGUAGES WITHOUT PREDECESSORS ###\n');
console.log('(These should likely link to proto-language ancestors)\n');
if (issues.majorLanguagesWithoutPredecessors.length === 0) {
  console.log('✓ All major ancient languages have predecessor links.\n');
} else {
  // Group by family
  const byFamily = {};
  issues.majorLanguagesWithoutPredecessors.forEach(lang => {
    if (!byFamily[lang.family]) byFamily[lang.family] = [];
    byFamily[lang.family].push(lang);
  });

  Object.keys(byFamily).sort().forEach(family => {
    console.log(`\n${family}:`);
    byFamily[family]
      .sort((a, b) => a.startYear - b.startYear)
      .forEach(lang => {
        console.log(`  Line ${lang.lineNumber}: ${lang.name} (${lang.key}) - starts ${lang.startYear}`);
      });
  });
  console.log();
}

console.log('\n### 5. SUMMARY STATISTICS ###\n');
console.log(`Total languages analyzed: ${languages.length}`);
console.log(`Broken predecessor references: ${issues.missingPredecessors.length}`);
console.log(`Broken successor references: ${issues.missingSuccessors.length}`);
console.log(`Undefined referenced languages: ${issues.referencedButNotDefined.size}`);
console.log(`Major languages without predecessors: ${issues.majorLanguagesWithoutPredecessors.length}`);

// Additional analysis: find orphaned branches
console.log('\n### 6. ADDITIONAL ANALYSIS ###\n');

// Proto-languages with no successors
const protoWithoutSuccessors = languages.filter(l =>
  (l.name.startsWith('Proto-') || l.key.startsWith('PROTO_')) &&
  l.successors.length === 0
);

if (protoWithoutSuccessors.length > 0) {
  console.log('Proto-languages with no successors (orphaned):');
  protoWithoutSuccessors.forEach(lang => {
    console.log(`  Line ${lang.lineNumber}: ${lang.name} (${lang.key})`);
  });
  console.log();
}

// Export detailed data for further analysis
const output = {
  totalLanguages: languages.length,
  issues,
  allLanguages: languages.sort((a, b) => a.name.localeCompare(b.name)),
  protoWithoutSuccessors
};

fs.writeFileSync('/Users/benjaminbreen/code/august-6-uhs/language_analysis.json', JSON.stringify(output, null, 2));
console.log('✓ Detailed analysis saved to language_analysis.json\n');
