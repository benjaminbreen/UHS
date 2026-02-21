import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

type KeyPattern = RegExp;

const findDuplicateKeys = (filePath: string, pattern: KeyPattern): string[] => {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const lines = fs.readFileSync(absolutePath, 'utf8').split('\n');

  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const line of lines) {
    const match = line.match(pattern);
    if (!match) continue;

    const key = match[1] ?? match[2];
    if (!key) continue;

    if (seen.has(key)) {
      duplicates.add(key);
    } else {
      seen.add(key);
    }
  }

  return Array.from(duplicates).sort();
};

describe('data key integrity', () => {
  it('item definitions have no duplicate base keys', () => {
    const duplicates = findDuplicateKeys(
      'constants/gameData/itemDefinitions.ts',
      /^\s*([A-Z0-9_]+)\s*:\s*\{/
    );

    expect(duplicates).toEqual([]);
  });

  it('starting packages have no duplicate profession keys', () => {
    const duplicates = findDuplicateKeys(
      'constants/characterData/startingPackages.ts',
      /^\s*'([^']+)'\s*:\s*\{/
    );

    expect(duplicates).toEqual([]);
  });

  it('faction icon map has no duplicate faction keys', () => {
    const duplicates = findDuplicateKeys(
      'constants/gameData/factionIcons.ts',
      /^\s*(?:'([^']+)'|"([^"]+)")\s*:\s*\{/
    );

    expect(duplicates).toEqual([]);
  });
});
