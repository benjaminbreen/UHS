import React from 'react';
import { ContextualManuscript, TranslationPuzzle } from '../../services/contextualManuscriptService';

export interface TranslationResult {
    success: boolean;
    accuracy: number;
    feedback: string;
}

export interface TranslationLabProps {
    manuscript: ContextualManuscript;
    puzzle: TranslationPuzzle;
    guesses: string[];
    result: TranslationResult | null;
    onSelectWord: (word: string) => void;
    onClear: () => void;
    onSubmit: () => void;
    onClose: () => void;
}

export const TranslationLab: React.FC<TranslationLabProps> = ({
    manuscript,
    puzzle,
    guesses,
    result,
    onSelectWord,
    onClear,
    onSubmit,
    onClose
}) => {
    return (
        <div className="absolute inset-0 flex items-center justify-center z-50"
             style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>
            <div className="w-full max-w-6xl h-5/6 flex flex-col p-6"
                 style={{
                     backgroundColor: '#0a0a0a',
                     border: '2px solid #00ccff',
                     boxShadow: '0 0 20px #0099cc',
                     fontFamily: 'Courier New, monospace'
                 }}>
                <div className="mb-4" style={{ borderBottom: '2px solid #00ccff', paddingBottom: '10px' }}>
                    <div className="text-center mb-2">
                        <div className="text-3xl font-bold" style={{ color: '#00ffff', textShadow: '0 0 15px #00ccff' }}>
                            ╔══════════════════════════════════════════════════════╗
                        </div>
                        <div className="text-2xl font-bold my-2" style={{ color: '#00ffff', textShadow: '0 0 10px #00ccff' }}>
                            ANCIENT SCRIPT DECODER
                        </div>
                        <div className="text-3xl font-bold" style={{ color: '#00ffff', textShadow: '0 0 15px #00ccff' }}>
                            ╚══════════════════════════════════════════════════════╝
                        </div>
                    </div>
                    <div className="text-sm mt-3" style={{ color: '#00ccff' }}>
                        &gt; MANUSCRIPT: {manuscript.title}
                        {manuscript.date && ` | DATE: ${manuscript.date}`}
                        {` | SCRIPT: ${manuscript.scriptType.toUpperCase()}`}
                    </div>
                    <div className="text-sm mt-1" style={{ color: '#00ccff' }}>
                        &gt; MATERIAL: {manuscript.materialType || 'unknown'} |
                        CONDITION: {manuscript.preservationState || 'unknown'} |
                        DIFFICULTY: {manuscript.translationDifficulty?.toUpperCase()}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto mb-4">
                    {!result ? (
                        <div className="space-y-6">
                            {puzzle.scriptVisual && (
                                <div style={{ color: '#00ffff' }}>
                                    <div className="text-lg font-bold mb-3" style={{ color: '#00ffff' }}>
                                        ═══ ORIGINAL SCRIPT ═══
                                    </div>
                                    <div className="border-2 p-4 bg-gray-900 bg-opacity-50" style={{ borderColor: '#00ccff' }}>
                                        {puzzle.scriptVisual.map((line, idx) => (
                                            <div key={idx} className="text-center font-mono text-sm" style={{ color: '#00ddff' }}>
                                                {line}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ color: '#00ffff' }}>
                                <div className="text-lg font-bold mb-3" style={{ color: '#00ffff' }}>
                                    ═══ SCRIPT CHARACTERS ═══
                                </div>
                                <div className="border-l-2 pl-4 py-2" style={{ borderColor: '#00ccff', backgroundColor: 'rgba(0, 204, 255, 0.1)' }}>
                                    <div className="text-2xl font-bold text-center" style={{ color: '#00eeff', letterSpacing: '8px' }}>
                                        {puzzle.originalScript.join('  ')}
                                    </div>
                                </div>
                            </div>

                            <div style={{ color: '#00ffff' }}>
                                <div className="text-lg font-bold mb-3" style={{ color: '#00ffff' }}>
                                    ═══ PARTIAL TRANSLATION ═══
                                </div>
                                <div className="border-l-2 pl-4" style={{ borderColor: '#00ccff', color: '#00ddff' }}>
                                    <p className="text-base leading-relaxed">
                                        {puzzle.partialTranslation.join(' ')}
                                    </p>
                                </div>
                            </div>

                            <div style={{ color: '#00ffff' }}>
                                <div className="text-lg font-bold mb-3" style={{ color: '#00ffff' }}>
                                    ═══ WORD BANK ═══
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {puzzle.wordBank.map((word, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onSelectWord(word)}
                                            className="p-3 rounded transition-all text-center font-semibold"
                                            style={{
                                                border: '2px solid #00ccff',
                                                backgroundColor: guesses.includes(word)
                                                    ? 'rgba(0, 204, 255, 0.3)'
                                                    : 'rgba(0, 204, 255, 0.1)',
                                                color: '#00eeff'
                                            }}>
                                            {word}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {guesses.length > 0 && (
                                <div style={{ color: '#00ffff' }}>
                                    <div className="text-lg font-bold mb-3" style={{ color: '#00ffff' }}>
                                        ═══ YOUR TRANSLATION ═══
                                    </div>
                                    <div className="border-l-2 pl-4 py-2" style={{ borderColor: '#00ccff', backgroundColor: 'rgba(0, 255, 0, 0.1)' }}>
                                        <p className="text-base leading-relaxed" style={{ color: '#00ff88' }}>
                                            {guesses.join(' ')}
                                        </p>
                                    </div>
                                    <div className="mt-3 flex gap-3">
                                        <button
                                            onClick={onClear}
                                            className="px-4 py-2 rounded"
                                            style={{
                                                backgroundColor: '#cc6600',
                                                color: '#000',
                                                fontWeight: 'bold'
                                            }}>
                                            CLEAR
                                        </button>
                                        {guesses.length === puzzle.correctSolution.length && (
                                            <button
                                                onClick={onSubmit}
                                                className="px-6 py-2 rounded"
                                                style={{
                                                    backgroundColor: '#00ccff',
                                                    color: '#000',
                                                    fontWeight: 'bold'
                                                }}>
                                                SUBMIT TRANSLATION
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {manuscript.decodingHints && manuscript.decodingHints.length > 0 && (
                                <div className="mt-6 p-4 rounded" style={{
                                    backgroundColor: 'rgba(0, 204, 255, 0.1)',
                                    border: '1px solid #00ccff'
                                }}>
                                    <div className="text-sm font-bold mb-2" style={{ color: '#00ffff' }}>
                                        📖 DECODING HINTS
                                    </div>
                                    {manuscript.decodingHints.map((hint, idx) => (
                                        <div key={idx} className="text-xs mt-1" style={{ color: '#00ddff' }}>
                                            • {hint}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div style={{ color: '#00ffff' }}>
                                <div className="text-lg font-bold mb-3" style={{ color: '#00ffff' }}>
                                    ═══ TRANSLATION RESULT ═══
                                </div>
                                <div className="border-l-2 pl-4 py-4" style={{
                                    borderColor: result.success ? '#00ff00' : '#ff6600',
                                    backgroundColor: result.success ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 102, 0, 0.1)'
                                }}>
                                    <div className="text-xl font-bold mb-2" style={{
                                        color: result.success ? '#00ff88' : '#ffaa44'
                                    }}>
                                        {result.success ? '✓ SUCCESS' : '✗ PARTIAL/FAILED'}
                                    </div>
                                    <div className="text-base mb-3" style={{ color: '#00ddff' }}>
                                        Accuracy: {result.accuracy.toFixed(1)}%
                                    </div>
                                    <p className="text-base leading-relaxed" style={{ color: '#00eeff' }}>
                                        {result.feedback}
                                    </p>
                                </div>
                            </div>

                            {result.success && manuscript.content && (
                                <div style={{ color: '#00ffff' }}>
                                    <div className="text-lg font-bold mb-3" style={{ color: '#00ffff' }}>
                                        ═══ DECODED TEXT ═══
                                    </div>
                                    <div className="border-l-2 pl-4 py-3" style={{ borderColor: '#00ff00', backgroundColor: 'rgba(0, 255, 0, 0.1)' }}>
                                        <p className="text-base leading-relaxed" style={{ color: '#00ff88' }}>
                                            {manuscript.content}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {result.success && manuscript.historicalContext && (
                                <div className="mt-6 p-4 rounded" style={{
                                    backgroundColor: 'rgba(0, 255, 0, 0.1)',
                                    border: '1px solid #00ff00'
                                }}>
                                    <div className="text-sm font-bold mb-2" style={{ color: '#00ff88' }}>
                                        🏛️ HISTORICAL SIGNIFICANCE
                                    </div>
                                    <div className="text-xs" style={{ color: '#00ffaa' }}>
                                        {manuscript.historicalContext}
                                    </div>
                                </div>
                            )}

                            <div className="text-center mt-8">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 rounded"
                                    style={{
                                        backgroundColor: '#00ccff',
                                        color: '#000',
                                        fontWeight: 'bold',
                                        fontSize: '16px'
                                    }}>
                                    RETURN TO EXPLORATION
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {!result && (
                    <div className="text-sm border-t-2 pt-3" style={{ color: '#00ccff', borderColor: '#00ccff' }}>
                        <div className="text-center">
                            [CLICK WORDS] Add to translation | [CLEAR] Reset | [SUBMIT] Check translation | [T/ESC] Close decoder
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
