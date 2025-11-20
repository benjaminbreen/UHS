import React from 'react';
import { CulturalZone, HistoricalEra } from '../../types';
import { PrimarySourceMetadata } from '../../services/primarySourceService';

export interface DiscoveryTerminalProps {
    ruinName: string;
    era: HistoricalEra;
    culturalZone: CulturalZone;
    discoveredSources: PrimarySourceMetadata[];
    selectedSource: PrimarySourceMetadata | null;
    onSelectSource: (source: PrimarySourceMetadata) => void;
    onClose: () => void;
}

export const DiscoveryTerminal: React.FC<DiscoveryTerminalProps> = ({
    ruinName,
    era,
    culturalZone,
    discoveredSources,
    selectedSource,
    onSelectSource,
    onClose
}) => {
    return (
        <div className="absolute inset-0 flex items-center justify-center z-50"
             style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>
            <div className="w-full max-w-4xl h-5/6 flex flex-col p-6"
                 style={{
                     backgroundColor: '#0a0a0a',
                     border: '2px solid #00ff00',
                     boxShadow: '0 0 20px #00ff00',
                     fontFamily: 'Courier New, monospace'
                 }}>
                <div className="mb-4 flex justify-between items-start"
                     style={{ borderBottom: '2px solid #00ff00', paddingBottom: '10px' }}>
                    <div>
                        <h2 className="text-2xl font-bold" style={{ color: '#00ff00', textShadow: '0 0 10px #00ff00' }}>
                            ╔════════════════ HISTORICAL ARCHIVES ════════════════╗
                        </h2>
                        <div className="text-sm mt-2" style={{ color: '#00ff00' }}>
                            &gt; LOCATION: {ruinName} | ERA: {era} | ZONE: {culturalZone}
                        </div>
                        <div className="text-sm mt-1" style={{ color: '#00ff00' }}>
                            &gt; DOCUMENTS RECOVERED: {discoveredSources.length}
                            {discoveredSources.length > 0 && ' | STATUS: CATALOGUED'}
                        </div>
                    </div>
                    <button
                        className="text-green-400 hover:text-green-200 text-sm"
                        onClick={onClose}
                    >
                        [CLOSE]
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto mb-4">
                    {selectedSource ? (
                        <div className="space-y-4" style={{ color: '#00ff00' }}>
                            <div className="text-lg font-bold mb-2">
                                &gt; DOCUMENT: {selectedSource.title}
                            </div>
                            <div className="text-sm mb-2" style={{ color: '#00cc00' }}>
                                &gt; DATE: {selectedSource.date || 'Unknown'}
                                {selectedSource.author && ` | AUTHOR: ${selectedSource.author}`}
                                {selectedSource.language && ` | LANGUAGE: ${selectedSource.language}`}
                            </div>
                            <div className="border-l-2 pl-4 mt-4" style={{ borderColor: '#00ff00', color: '#00ff00' }}>
                                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
{selectedSource.content?.substring(0, 1000) || selectedSource.excerpt || 'Content unavailable...'}
{selectedSource.content && selectedSource.content.length > 1000 ? '\n\n[DOCUMENT CONTINUES - PRESS SPACE FOR MORE]' : ''}
                                </pre>
                            </div>
                            {selectedSource.keywords && (
                                <div className="mt-4 text-sm" style={{ color: '#00cc00' }}>
                                    &gt; KEYWORDS: {selectedSource.keywords.join(', ')}
                                </div>
                            )}
                            {selectedSource.metadata?.citations && (
                                <div className="mt-4 text-sm" style={{ color: '#00cc00' }}>
                                    &gt; CITATIONS: {selectedSource.metadata.citations.join(', ')}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center mt-10" style={{ color: '#00ff00' }}>
                            &gt; NO DOCUMENT SELECTED
                        </div>
                    )}
                </div>

                <div className="border-t-2 pt-4" style={{ borderColor: '#00ff00' }}>
                    <div className="text-sm mb-2" style={{ color: '#00ff00' }}>
                        &gt; AVAILABLE DOCUMENTS:
                    </div>
                    <div className="grid grid-cols-1 gap-1 mb-4">
                        {discoveredSources.length > 0 ? (
                            discoveredSources.map((source, idx) => (
                                <button
                                    key={source.id}
                                    onClick={() => onSelectSource(source)}
                                    className="text-left p-2 hover:bg-green-900 hover:bg-opacity-20 transition-colors"
                                    style={{
                                        color: selectedSource?.id === source.id ? '#00ff00' : '#008800',
                                        borderLeft: selectedSource?.id === source.id ? '3px solid #00ff00' : '3px solid transparent',
                                        paddingLeft: '10px'
                                    }}>
                                    [{idx + 1}] {source.title.substring(0, 60)}{source.title.length > 60 ? '...' : ''}
                                </button>
                            ))
                        ) : (
                            <div className="text-sm p-4 text-center" style={{ color: '#008800' }}>
                                No historical documents found in this location yet.
                                <br />
                                Continue exploring to discover primary sources.
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-sm mt-auto" style={{ color: '#00ff00', borderTop: '1px solid #00ff00', paddingTop: '10px' }}>
                    Click a document to read | [CLOSE] button to exit
                </div>
            </div>
        </div>
    );
};
