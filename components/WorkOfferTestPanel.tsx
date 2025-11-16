/**
 * Work Offer Test Panel - Dev tool for testing work offer generation
 * Integrated into Settings panel for debugging work offer quality and variety
 */

import React, { useState } from 'react';
import { X, Play, CheckCircle, XCircle, AlertTriangle, Briefcase, MapPin, Coins } from 'lucide-react';
import { generateWorkOffer } from '../services/workOfferService';
import { WorkOffer } from '../types/workOffer';
import { NpcEntity, PlayerCharacter, MapData } from '../types';

interface WorkOfferTestPanelProps {
    isOpen: boolean;
    onClose: () => void;
    playerCharacter?: PlayerCharacter;
    mapData?: MapData;
}

interface TestScenario {
    name: string;
    npc: Partial<NpcEntity>;
    structures: Array<{ name: string; structureType: string; x: number; y: number }>;
    animals: Array<{ speciesName: string; x: number; y: number }>;
    expectedTypes: string[];
    expectedItems: string[];
}

interface TestResult {
    scenario: string;
    offer: WorkOffer | null;
    passed: boolean;
    issues: string[];
    strengths: string[];
    taskType?: string;
    description?: string;
    payment?: number;
}

const WorkOfferTestPanel: React.FC<WorkOfferTestPanelProps> = ({
    isOpen,
    onClose,
    playerCharacter,
    mapData
}) => {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<TestResult[]>([]);
    const [currentTest, setCurrentTest] = useState<string>('');
    const [summary, setSummary] = useState<{
        total: number;
        passed: number;
        failed: number;
        taskTypeCounts: Record<string, number>;
    } | null>(null);
    const [useRealMapData, setUseRealMapData] = useState(true);
    const [numRandomTests, setNumRandomTests] = useState(10);

    const testScenarios: TestScenario[] = [
        {
            name: "Blacksmith with Iron Mine",
            npc: {
                id: 'test-blacksmith',
                name: 'Bjorn Ironhand',
                profession: 'Blacksmith',
                age: 45,
                gender: 'male',
                socialClass: 'Artisan',
                wealthLevel: 'comfortable',
                x: 50,
                y: 50
            },
            structures: [
                { name: 'Central Marketplace', structureType: 'MARKETPLACE', x: 55, y: 52 },
                { name: 'Iron Mine', structureType: 'MINE', x: 45, y: 55 },
                { name: "Bjorn's Smithy", structureType: 'WORKSHOP', x: 50, y: 51 }
            ],
            animals: [],
            expectedTypes: ['gather_resource', 'deliver_to_location', 'fetch_item'],
            expectedItems: ['iron', 'ore', 'coal', 'metal']
        },
        {
            name: "Guard with Dangerous Wolves",
            npc: {
                id: 'test-guard',
                name: 'Marcus Sentinel',
                profession: 'Town Guard',
                age: 32,
                gender: 'male',
                socialClass: 'Common',
                wealthLevel: 'modest',
                x: 60,
                y: 60
            },
            structures: [
                { name: 'Guard Barracks', structureType: 'MILITARY_BARRACKS', x: 61, y: 60 }
            ],
            animals: [
                { speciesName: 'Wolf', x: 70, y: 65 },
                { speciesName: 'Wolf', x: 72, y: 67 },
                { speciesName: 'Wolf', x: 68, y: 70 }
            ],
            expectedTypes: ['kill_animal', 'collect_animal_products'],
            expectedItems: ['wolf', 'hunt', 'protect']
        },
        {
            name: "Merchant at Marketplace",
            npc: {
                id: 'test-merchant',
                name: 'Zhang Wei',
                profession: 'Silk Merchant',
                age: 38,
                gender: 'male',
                socialClass: 'Merchant',
                wealthLevel: 'wealthy',
                x: 100,
                y: 100
            },
            structures: [
                { name: 'Silk Road Bazaar', structureType: 'MARKETPLACE', x: 100, y: 101 },
                { name: 'Caravanserai', structureType: 'INN', x: 105, y: 100 },
                { name: 'Western Market', structureType: 'MARKETPLACE', x: 110, y: 105 }
            ],
            animals: [],
            expectedTypes: ['buy_from_location', 'deliver_to_location'],
            expectedItems: ['silk', 'spices', 'tea', 'goods']
        },
        {
            name: "Scholar near Ruins",
            npc: {
                id: 'test-scholar',
                name: 'Hypatia',
                profession: 'Scholar',
                age: 42,
                gender: 'female',
                socialClass: 'Scholar',
                wealthLevel: 'comfortable',
                x: 80,
                y: 80
            },
            structures: [
                { name: 'Ancient Temple Ruins', structureType: 'RUINS', x: 75, y: 85 },
                { name: 'Library', structureType: 'LIBRARY', x: 82, y: 81 }
            ],
            animals: [],
            expectedTypes: ['explore_location', 'investigate_and_report', 'fetch_item'],
            expectedItems: ['artifact', 'scroll', 'document']
        },
        {
            name: "Tanner with Deer Nearby",
            npc: {
                id: 'test-tanner',
                name: 'Erik the Tanner',
                profession: 'Leather Tanner',
                age: 40,
                gender: 'male',
                socialClass: 'Artisan',
                wealthLevel: 'modest',
                x: 200,
                y: 200
            },
            structures: [
                { name: 'Tanning Workshop', structureType: 'WORKSHOP', x: 200, y: 201 }
            ],
            animals: [
                { speciesName: 'Deer', x: 210, y: 205 },
                { speciesName: 'Deer', x: 212, y: 208 },
                { speciesName: 'Deer', x: 215, y: 210 }
            ],
            expectedTypes: ['collect_animal_products', 'kill_animal'],
            expectedItems: ['hide', 'pelt', 'leather', 'skin']
        }
    ];

    // Generate random test scenarios using real map data
    const generateRandomScenarios = (count: number): TestScenario[] => {
        if (!mapData || !playerCharacter) return [];

        const scenarios: TestScenario[] = [];
        const professions = [
            { name: 'Blacksmith', class: 'Artisan', expectedTypes: ['gather_resource', 'deliver_to_location', 'fetch_item'], expectedItems: ['iron', 'ore', 'metal'] },
            { name: 'Town Guard', class: 'Common', expectedTypes: ['kill_animal', 'collect_animal_products'], expectedItems: ['wolf', 'hunt', 'protect'] },
            { name: 'Merchant', class: 'Merchant', expectedTypes: ['buy_from_location', 'deliver_to_location'], expectedItems: ['silk', 'goods', 'trade'] },
            { name: 'Scholar', class: 'Scholar', expectedTypes: ['explore_location', 'investigate_and_report'], expectedItems: ['artifact', 'document'] },
            { name: 'Farmer', class: 'Peasant', expectedTypes: ['gather_resource', 'deliver_to_location', 'kill_animal'], expectedItems: ['wheat', 'grain', 'pests'] },
            { name: 'Tanner', class: 'Artisan', expectedTypes: ['collect_animal_products', 'kill_animal', 'gather_resource'], expectedItems: ['hide', 'pelt', 'leather', 'bark', 'salt'] },
            { name: 'Potter', class: 'Artisan', expectedTypes: ['gather_resource', 'deliver_to_location'], expectedItems: ['clay', 'glaze'] },
            { name: 'Priest', class: 'Clergy', expectedTypes: ['deliver_to_location', 'fetch_item', 'debate_topic'], expectedItems: ['sacred', 'holy', 'offering'] },
            { name: 'Noble', class: 'Noble', expectedTypes: ['fetch_item', 'buy_from_location'], expectedItems: ['luxury', 'fine'] },
            { name: 'Scribe', class: 'Scholar', expectedTypes: ['investigate_and_report', 'source_analysis'], expectedItems: ['document', 'manuscript'] }
        ];

        // Get actual structures and animals from map
        const actualStructures = mapData.terrainStructures || [];
        const actualAnimals = mapData.animals || [];

        for (let i = 0; i < count; i++) {
            const prof = professions[Math.floor(Math.random() * professions.length)];

            // Random position on map
            const x = Math.floor(Math.random() * (mapData.width || 200));
            const y = Math.floor(Math.random() * (mapData.height || 200));

            // Find nearby structures (within 50 tiles)
            const nearbyStructures = actualStructures
                .filter(s => {
                    const dx = (s.x || 0) - x;
                    const dy = (s.y || 0) - y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    return dist <= 50;
                })
                .slice(0, 5) // Limit to 5 closest
                .map(s => ({
                    name: s.name || s.structureType || 'Unknown',
                    structureType: s.structureType || 'GENERIC',
                    x: s.x || 0,
                    y: s.y || 0
                }));

            // Find nearby animals (within 50 tiles)
            const nearbyAnimals = actualAnimals
                .filter(a => {
                    const dx = a.x - x;
                    const dy = a.y - y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    return dist <= 50;
                })
                .slice(0, 10) // Limit to 10 closest
                .map(a => ({
                    speciesName: a.speciesName || 'Unknown',
                    x: a.x,
                    y: a.y
                }));

            scenarios.push({
                name: `${prof.name} at (${x},${y}) [${nearbyStructures.length} structures, ${nearbyAnimals.length} animals]`,
                npc: {
                    id: `random-test-${i}`,
                    name: `Test ${prof.name} ${i}`,
                    profession: prof.name,
                    age: 20 + Math.floor(Math.random() * 40),
                    gender: Math.random() > 0.5 ? 'male' : 'female',
                    socialClass: prof.class as any,
                    wealthLevel: ['poor', 'modest', 'comfortable', 'wealthy'][Math.floor(Math.random() * 4)] as any,
                    x,
                    y
                },
                structures: nearbyStructures,
                animals: nearbyAnimals,
                expectedTypes: prof.expectedTypes,
                expectedItems: prof.expectedItems
            });
        }

        return scenarios;
    };

    const analyzeOffer = (offer: WorkOffer, scenario: TestScenario): { issues: string[]; strengths: string[]; passed: boolean } => {
        const issues: string[] = [];
        const strengths: string[] = [];

        const profession = scenario.npc.profession?.toLowerCase() || '';
        const description = offer.description.toLowerCase();
        const taskType = offer.taskType;

        // Check if task type matches expected
        const isExpectedType = scenario.expectedTypes.includes(taskType);
        if (!isExpectedType) {
            issues.push(`Unexpected task type "${taskType}" for ${scenario.npc.profession} (expected: ${scenario.expectedTypes.join(', ')})`);
        } else {
            strengths.push(`Task type "${taskType}" matches profession`);
        }

        // Profession-specific checks
        if (profession.includes('blacksmith')) {
            if (taskType === 'explore_location' && !description.includes('iron') && !description.includes('ore')) {
                issues.push('Blacksmith should want metal/ore, not generic exploration');
            }
            if (taskType === 'gather_resource' && (description.includes('iron') || description.includes('ore'))) {
                strengths.push('Blacksmith requesting metal resources - realistic');
            }
        }

        if (profession.includes('merchant')) {
            if (taskType === 'kill_animal') {
                issues.push('Merchant unlikely to hire for hunting');
            }
            if (taskType === 'buy_from_location' || taskType === 'deliver_to_location') {
                strengths.push('Merchant requesting commerce - realistic');
            }
        }

        if (profession.includes('guard')) {
            if (scenario.animals.length > 0 && taskType !== 'kill_animal' && taskType !== 'collect_animal_products') {
                issues.push('Guard with dangerous animals should prioritize hunting');
            }
            if (taskType === 'kill_animal') {
                strengths.push('Guard requesting hunting - realistic');
            }
        }

        if (profession.includes('tanner') || profession.includes('leather')) {
            if (scenario.animals.length > 0 && taskType !== 'collect_animal_products' && taskType !== 'kill_animal') {
                issues.push('Tanner with animals should want pelts/hides');
            }
            if (taskType === 'collect_animal_products' && (description.includes('hide') || description.includes('pelt'))) {
                strengths.push('Tanner requesting animal products - realistic');
            }
        }

        // Check if ruins are over-represented
        if (taskType === 'explore_location') {
            const hasRuins = scenario.structures.some(s =>
                s.structureType === 'RUINS' || s.name.toLowerCase().includes('ruin')
            );
            if (!hasRuins) {
                issues.push('Exploration quest but no ruins available');
            } else {
                strengths.push('Exploration quest with ruins available');
            }
        }

        // Check payment
        if (offer.payment < 5 || offer.payment > 50) {
            issues.push(`Payment ${offer.payment} outside expected 5-50 range`);
        }

        // Check if target exists
        if (offer.targetLocationName) {
            const exists = scenario.structures.some(s =>
                s.name.toLowerCase().includes(offer.targetLocationName!.toLowerCase())
            );
            if (!exists) {
                issues.push(`Target location "${offer.targetLocationName}" not in available structures`);
            } else {
                strengths.push(`Target location "${offer.targetLocationName}" exists`);
            }
        }

        if (offer.targetAnimal) {
            const exists = scenario.animals.some(a =>
                a.speciesName.toLowerCase() === offer.targetAnimal!.toLowerCase()
            );
            if (!exists) {
                issues.push(`Target animal "${offer.targetAnimal}" not available`);
            } else {
                strengths.push(`Target animal "${offer.targetAnimal}" available`);
            }
        }

        const passed = issues.length === 0;
        return { issues, strengths, passed };
    };

    const runTests = async () => {
        if (!playerCharacter || !mapData) {
            alert('Player character and map data required for testing');
            return;
        }

        setIsRunning(true);
        setResults([]);
        setSummary(null);

        const testResults: TestResult[] = [];
        const taskTypeCounts: Record<string, number> = {};
        let passed = 0;
        let failed = 0;

        // Choose scenarios: synthetic or random real-world
        const scenariosToTest = useRealMapData
            ? generateRandomScenarios(numRandomTests)
            : testScenarios;

        console.log(`[Work Offer Test] Running ${scenariosToTest.length} tests (${useRealMapData ? 'REAL MAP DATA' : 'SYNTHETIC'})`);

        for (const scenario of scenariosToTest) {
            setCurrentTest(scenario.name);

            try {
                // Create test NPC
                const testNpc: NpcEntity = {
                    ...scenario.npc,
                    id: scenario.npc.id!,
                    name: scenario.npc.name!,
                    profession: scenario.npc.profession!,
                    age: scenario.npc.age!,
                    gender: scenario.npc.gender!,
                    socialClass: scenario.npc.socialClass!,
                    wealthLevel: scenario.npc.wealthLevel as any,
                    x: scenario.npc.x!,
                    y: scenario.npc.y!,
                    memory: {
                        conversationHistory: [],
                        relationshipScore: 50,
                        lastInteraction: new Date(),
                        conversationCount: 0,
                        topicsDiscussed: new Set()
                    },
                    personality: {
                        openness: 50,
                        conscientiousness: 50,
                        extraversion: 50,
                        agreeableness: 50,
                        neuroticism: 50
                    }
                } as NpcEntity;

                // Log context being sent
                console.log(`[Work Offer Test] Testing: ${scenario.name}`);
                console.log(`  NPC: ${testNpc.profession} at (${testNpc.x}, ${testNpc.y})`);
                console.log(`  Structures: ${scenario.structures.length} (${scenario.structures.map(s => s.structureType).join(', ')})`);
                console.log(`  Animals: ${scenario.animals.length} (${scenario.animals.map(a => a.speciesName).join(', ')})`);

                const offer = await generateWorkOffer(
                    testNpc,
                    playerCharacter,
                    mapData,
                    scenario.structures as any[],
                    0, // gameTimeHours
                    { x: scenario.npc.x!, y: scenario.npc.y! },
                    scenario.animals as any[]
                );

                if (offer) {
                    console.log(`  → Generated: ${offer.taskType} - "${offer.description.substring(0, 100)}..."`);
                }

                if (offer) {
                    const analysis = analyzeOffer(offer, scenario);

                    taskTypeCounts[offer.taskType] = (taskTypeCounts[offer.taskType] || 0) + 1;

                    if (analysis.passed) {
                        passed++;
                    } else {
                        failed++;
                    }

                    testResults.push({
                        scenario: scenario.name,
                        offer,
                        passed: analysis.passed,
                        issues: analysis.issues,
                        strengths: analysis.strengths,
                        taskType: offer.taskType,
                        description: offer.description,
                        payment: offer.payment
                    });
                } else {
                    failed++;
                    testResults.push({
                        scenario: scenario.name,
                        offer: null,
                        passed: false,
                        issues: ['Failed to generate work offer (returned null)'],
                        strengths: []
                    });
                }

                // Small delay between tests
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error: any) {
                failed++;
                testResults.push({
                    scenario: scenario.name,
                    offer: null,
                    passed: false,
                    issues: [`Error: ${error.message}`],
                    strengths: []
                });
            }
        }

        setResults(testResults);
        setSummary({
            total: testResults.length,
            passed,
            failed,
            taskTypeCounts
        });
        setIsRunning(false);
        setCurrentTest('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[var(--surface-card-bg)] border border-[var(--border-normal)] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-normal)]">
                    <div className="flex items-center gap-3">
                        <Briefcase className="w-6 h-6 text-[var(--accent-primary)]" />
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">
                            Work Offer Test Suite
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--surface-hover-bg)] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--text-secondary)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Test Controls */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <button
                                onClick={runTests}
                                disabled={isRunning || !playerCharacter || !mapData}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                            >
                                <Play className="w-4 h-4" />
                                {isRunning ? 'Running Tests...' : 'Run Test Suite'}
                            </button>

                            {!playerCharacter || !mapData && (
                                <p className="text-sm text-yellow-400">
                                    ⚠️ Start a game first to enable testing
                                </p>
                            )}

                            {isRunning && currentTest && (
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Testing: {currentTest}
                                </p>
                            )}
                        </div>

                        {/* Test Mode Selection */}
                        <div className="bg-[var(--surface-muted-bg)] border border-[var(--border-normal)] rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={!useRealMapData}
                                        onChange={() => setUseRealMapData(false)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-[var(--text-primary)]">
                                        Synthetic Tests (5 handcrafted scenarios)
                                    </span>
                                </label>
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={useRealMapData}
                                        onChange={() => setUseRealMapData(true)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-[var(--text-primary)]">
                                        Real Map Data (randomized scenarios using actual structures/animals)
                                    </span>
                                </label>
                            </div>

                            {useRealMapData && (
                                <div className="ml-6 flex items-center gap-3">
                                    <label className="text-xs text-[var(--text-secondary)]">
                                        Number of tests:
                                    </label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="50"
                                        value={numRandomTests}
                                        onChange={(e) => setNumRandomTests(parseInt(e.target.value) || 10)}
                                        className="w-20 px-2 py-1 bg-[var(--surface-card-bg)] border border-[var(--border-normal)] rounded text-sm text-[var(--text-primary)]"
                                    />
                                    <span className="text-xs text-[var(--text-muted)]">
                                        (More tests = more edge cases found, but slower)
                                    </span>
                                </div>
                            )}

                            <div className="text-xs text-[var(--text-muted)] mt-2 p-2 bg-blue-900/10 border border-blue-600/20 rounded">
                                <strong className="text-blue-400">Real Map Data Mode:</strong> Tests NPCs at random positions with actual nearby structures/animals from your current map. This finds real-world edge cases like "Blacksmith with no workshop nearby" or "Guard in area with no animals to hunt."
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    {summary && (
                        <div className="bg-[var(--surface-muted-bg)] border border-[var(--border-normal)] rounded-lg p-4 space-y-4">
                            <h3 className="font-semibold text-[var(--text-primary)]">Test Summary</h3>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-[var(--surface-card-bg)] rounded p-3">
                                    <div className="text-sm text-[var(--text-secondary)]">Total Tests</div>
                                    <div className="text-2xl font-bold text-[var(--text-primary)]">{summary.total}</div>
                                </div>
                                <div className="bg-green-900/20 border border-green-600/30 rounded p-3">
                                    <div className="text-sm text-green-400">Passed</div>
                                    <div className="text-2xl font-bold text-green-300">{summary.passed}</div>
                                </div>
                                <div className="bg-red-900/20 border border-red-600/30 rounded p-3">
                                    <div className="text-sm text-red-400">Failed</div>
                                    <div className="text-2xl font-bold text-red-300">{summary.failed}</div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Task Type Distribution</h4>
                                <div className="space-y-1">
                                    {Object.entries(summary.taskTypeCounts)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([type, count]) => {
                                            const percentage = ((count / summary.total) * 100).toFixed(1);
                                            const isOverRepresented = count > summary.total * 0.5;
                                            return (
                                                <div key={type} className="flex items-center gap-2">
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <div className="w-32 text-sm text-[var(--text-secondary)]">{type}</div>
                                                        <div className="flex-1 bg-[var(--surface-track-bg)] rounded-full h-2">
                                                            <div
                                                                className={`h-full rounded-full ${isOverRepresented ? 'bg-yellow-500' : 'bg-[var(--accent-primary)]'}`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                        <div className="w-16 text-sm text-[var(--text-secondary)] text-right">
                                                            {count} ({percentage}%)
                                                        </div>
                                                    </div>
                                                    {isOverRepresented && (
                                                        <AlertTriangle className="w-4 h-4 text-yellow-500" title="Over-represented" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Test Results */}
                    {results.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-[var(--text-primary)]">Detailed Results</h3>
                            {results.map((result, index) => (
                                <div
                                    key={index}
                                    className={`border rounded-lg p-4 ${
                                        result.passed
                                            ? 'bg-green-900/10 border-green-600/30'
                                            : 'bg-red-900/10 border-red-600/30'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {result.passed ? (
                                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1 space-y-2">
                                            <div className="font-semibold text-[var(--text-primary)]">{result.scenario}</div>

                                            {result.offer && (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="px-2 py-0.5 bg-blue-900/30 border border-blue-600/30 rounded text-blue-300 text-xs font-medium">
                                                            {result.taskType}
                                                        </span>
                                                        <span className="text-[var(--text-secondary)]">|</span>
                                                        <Coins className="w-3 h-3 text-yellow-500" />
                                                        <span className="text-yellow-400 font-medium">{result.payment} coins</span>
                                                    </div>
                                                    <p className="text-sm text-[var(--text-secondary)] italic">
                                                        "{result.description}"
                                                    </p>
                                                </div>
                                            )}

                                            {result.strengths.length > 0 && (
                                                <div className="space-y-0.5">
                                                    {result.strengths.map((strength, i) => (
                                                        <div key={i} className="text-xs text-green-400">✓ {strength}</div>
                                                    ))}
                                                </div>
                                            )}

                                            {result.issues.length > 0 && (
                                                <div className="space-y-0.5">
                                                    {result.issues.map((issue, i) => (
                                                        <div key={i} className="text-xs text-red-400">✗ {issue}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkOfferTestPanel;
