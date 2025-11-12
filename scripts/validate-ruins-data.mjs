import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const dataDir = path.resolve(repoRoot, 'generation/ruins/data');
const sourcesDir = path.resolve(repoRoot, 'public/sources/metadata');

/** @typedef {{level: 'error' | 'warning', message: string}} ValidationIssue */
const issues = /** @type {ValidationIssue[]} */ ([]);

const loadJson = async relativePath => {
    const fullPath = path.resolve(repoRoot, relativePath);
    try {
        const raw = await readFile(fullPath, 'utf-8');
        return JSON.parse(raw);
    } catch (error) {
        issues.push({
            level: 'error',
            message: `Failed to read ${relativePath}: ${error.message}`
        });
        return [];
    }
};

const validateScripts = async () => {
    const scripts = await loadJson(path.relative(repoRoot, path.resolve(dataDir, 'scripts.json')));
    const ids = new Set();
    for (const script of scripts) {
        if (!script.id) {
            issues.push({ level: 'error', message: 'Script entry missing id' });
            continue;
        }
        if (ids.has(script.id)) {
            issues.push({ level: 'error', message: `Duplicate script id: ${script.id}` });
        } else {
            ids.add(script.id);
        }
        if (!Array.isArray(script.culturalZones) || script.culturalZones.length === 0) {
            issues.push({ level: 'warning', message: `Script ${script.id} missing culturalZones` });
        }
        if (!Array.isArray(script.eras) || script.eras.length === 0) {
            issues.push({ level: 'warning', message: `Script ${script.id} missing eras` });
        }
    }
    return { scripts };
};

const validatePrimarySourceRef = async (ownerId, ref) => {
    if (!ref?.shard || !ref?.sourceId) {
        issues.push({
            level: 'error',
            message: `Primary source reference on ${ownerId} must include shard and sourceId`
        });
        return;
    }
    const shardPath = path.resolve(sourcesDir, `${ref.shard}.json`);
    try {
        const raw = await readFile(shardPath, 'utf-8');
        const parsed = JSON.parse(raw);
        const match = parsed.sources?.some(source => source.id === ref.sourceId);
        if (!match) {
            issues.push({
                level: 'warning',
                message: `Source ${ref.sourceId} not found in shard ${ref.shard} (referenced by ${ownerId})`
            });
        }
    } catch (error) {
        issues.push({
            level: 'error',
            message: `Unable to read shard ${ref.shard} for ${ownerId}: ${error.message}`
        });
    }
};

const validateArtifacts = async () => {
    const artifacts = await loadJson(path.relative(repoRoot, path.resolve(dataDir, 'artifactTemplates.json')));
    const ids = new Set();
    for (const artifact of artifacts) {
        if (!artifact.id) {
            issues.push({ level: 'error', message: 'Artifact entry missing id' });
            continue;
        }
        if (ids.has(artifact.id)) {
            issues.push({ level: 'error', message: `Duplicate artifact id: ${artifact.id}` });
        } else {
            ids.add(artifact.id);
        }
        if (Array.isArray(artifact.primarySourceRefs)) {
            for (const ref of artifact.primarySourceRefs) {
                await validatePrimarySourceRef(artifact.id, ref);
            }
        }
    }
    return { artifacts };
};

const validateDiscoveries = async artifacts => {
    const discoveries = await loadJson(path.relative(repoRoot, path.resolve(dataDir, 'discoveryTemplates.json')));
    const artifactIds = new Set(artifacts.map(a => a.id));
    const ids = new Set();
    for (const template of discoveries) {
        if (!template.id) {
            issues.push({ level: 'error', message: 'Discovery template missing id' });
            continue;
        }
        if (ids.has(template.id)) {
            issues.push({ level: 'error', message: `Duplicate discovery template id: ${template.id}` });
        } else {
            ids.add(template.id);
        }
        (template.recommendedArtifacts || []).forEach(artifactId => {
            if (!artifactIds.has(artifactId)) {
                issues.push({
                    level: 'warning',
                    message: `Discovery ${template.id} references unknown artifact ${artifactId}`
                });
            }
        });
    }
};

const validateExpeditionCards = async () => {
    const cards = await loadJson(path.relative(repoRoot, path.resolve(dataDir, 'expeditionCards.json')));
    const ids = new Set();
    for (const card of cards) {
        if (!card.id) {
            issues.push({ level: 'error', message: 'Expedition card missing id' });
            continue;
        }
        if (ids.has(card.id)) {
            issues.push({ level: 'error', message: `Duplicate expedition card id: ${card.id}` });
        } else {
            ids.add(card.id);
        }
    }
};

const main = async () => {
    const { scripts } = await validateScripts();
    const { artifacts } = await validateArtifacts();
    await validateDiscoveries(artifacts);
    await validateExpeditionCards();

    const errorCount = issues.filter(issue => issue.level === 'error').length;
    const warningCount = issues.filter(issue => issue.level === 'warning').length;

    if (issues.length === 0) {
        console.log('✅ Ruins supplemental data passed validation.');
        console.log(`Scripts: ${scripts.length}, Artifacts: ${artifacts.length}`);
        return;
    }

    issues.forEach(issue => {
        const prefix = issue.level === 'error' ? '❌' : '⚠️';
        console.log(`${prefix} ${issue.message}`);
    });

    console.log(`\nSummary: ${errorCount} error(s), ${warningCount} warning(s).`);
    if (errorCount > 0) process.exitCode = 1;
};

main().catch(error => {
    console.error('Unexpected validation failure', error);
    process.exitCode = 1;
});
