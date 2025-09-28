import React, { useState } from 'react';
import { PlayerCharacter, NpcEntity } from '../../types';
import { ProceduralPortrait } from './index';
import AnimatedPortrait from './AnimatedPortrait';

interface PortraitModalProps {
    character: PlayerCharacter | NpcEntity;
    onClose: () => void;
}

const DetailRow: React.FC<{ label: string; value: string | undefined | boolean }> = ({ label, value }) => (
    <div className="flex justify-between items-center text-sm py-2 px-2 rounded hover:bg-slate-800/30 transition-colors">
        <span className="text-slate-400 capitalize">{label.replace(/_/g, ' ')}:</span>
        <span className="font-semibold text-white capitalize text-right">{String(value)?.replace(/_/g, ' ') || 'N/A'}</span>
    </div>
);

const PortraitModal: React.FC<PortraitModalProps> = ({ character, onClose }) => {
    const { appearance } = character;
    const [temporaryExpression, setTemporaryExpression] = useState<'smile' | 'surprise' | null>(null);
    const [clickCount, setClickCount] = useState(0);
    
    if (!appearance) return null;
    
    // Play a nice click sound effect using Web Audio API
    const playClickSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const now = audioContext.currentTime;
            
            // Create a short, pleasant click sound
            // Main click - a quick sine wave burst
            const clickOsc = audioContext.createOscillator();
            const clickGain = audioContext.createGain();
            
            clickOsc.connect(clickGain);
            clickGain.connect(audioContext.destination);
            
            // Use a higher frequency for a "lighter" click
            clickOsc.frequency.value = 800; // High pitched click
            clickOsc.type = 'sine';
            
            // Quick attack and decay for crisp click
            clickGain.gain.setValueAtTime(0, now);
            clickGain.gain.linearRampToValueAtTime(0.3, now + 0.001); // Very quick attack
            clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05); // Quick decay
            
            clickOsc.start(now);
            clickOsc.stop(now + 0.05);
            
            // Add a subtle "pop" sound for depth
            const popOsc = audioContext.createOscillator();
            const popGain = audioContext.createGain();
            const popFilter = audioContext.createBiquadFilter();
            
            popOsc.connect(popFilter);
            popFilter.connect(popGain);
            popGain.connect(audioContext.destination);
            
            popOsc.frequency.value = 150; // Low frequency pop
            popOsc.type = 'triangle';
            popFilter.type = 'lowpass';
            popFilter.frequency.value = 200;
            
            popGain.gain.setValueAtTime(0, now);
            popGain.gain.linearRampToValueAtTime(0.15, now + 0.002);
            popGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
            
            popOsc.start(now);
            popOsc.stop(now + 0.03);
            
            // Add a tiny bit of white noise for texture
            const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.02, audioContext.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseData.length; i++) {
                noiseData[i] = (Math.random() - 0.5) * 0.1; // Very quiet white noise
            }
            
            const noiseSource = audioContext.createBufferSource();
            const noiseGain = audioContext.createGain();
            const noiseFilter = audioContext.createBiquadFilter();
            
            noiseSource.buffer = noiseBuffer;
            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(audioContext.destination);
            
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 2000;
            
            noiseGain.gain.setValueAtTime(0.05, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
            
            noiseSource.start(now);
            
        } catch (error) {
            console.log('Could not play click sound:', error);
        }
    };
    
    // Handle portrait click for testing smile animation
    const handlePortraitClick = () => {
        playClickSound(); // Play the click sound
        const expressions: Array<'smile' | 'surprise'> = ['smile', 'surprise'];
        const expression = expressions[clickCount % 2];
        setTemporaryExpression(expression);
        setClickCount(prev => prev + 1);
    };
    
    const handleExpressionComplete = () => {
        setTemporaryExpression(null);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-gradient-to-br from-slate-900/95 to-slate-950/95 rounded-2xl w-full max-w-4xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 border border-slate-700/50 shadow-2xl shadow-black/50" onClick={e => e.stopPropagation()}>
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-colors group"
                    aria-label="Close modal"
                >
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                {/* Left Side: Portrait */}
                <div className="flex-shrink-0 w-full md:w-1/2 flex flex-col">
                    <div className="mb-4 text-center md:text-left">
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">{character.name}</h3>
                        <p className="text-sm text-amber-400 capitalize">{'profession' in character ? (character as PlayerCharacter).profession : (character as NpcEntity).role}</p>
                    </div>
                    <div 
                        className="w-full aspect-square bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border-2 border-slate-700/50 shadow-xl shadow-black/40 overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-500/50 transition-colors group"
                        onClick={handlePortraitClick}
                        title="Click to test smile/surprise animation"
                    >
                        <div className="w-full h-full transform scale-110 relative">
                            <ProceduralPortrait 
                                character={character} 
                                size={500}
                                temporaryExpression={temporaryExpression}
                                onExpressionComplete={handleExpressionComplete}
                            />
                            {/* Visual hint for clickability */}
                            <div className="absolute bottom-2 right-2 bg-black/50 rounded-full px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-white">Click to test expression</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Details */}
                <div className="flex-1 min-w-0 flex flex-col">
                    <h4 className="text-lg font-semibold text-blue-400 mb-4 uppercase tracking-wider">Physical Attributes</h4>
                    <div className="flex-grow max-h-[60vh] md:max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
                        <div className="grid grid-cols-1 gap-1 bg-slate-800/30 rounded-lg p-3">
                            <DetailRow label="Build" value={appearance.build} />
                            <DetailRow label="Skin Tone" value={appearance.skinTone} />
                            <DetailRow label="Hair Color" value={appearance.hairColor} />
                            <DetailRow label="Eye Color" value={appearance.eyeColor} />
                            <DetailRow label="Face Shape" value={appearance.faceShape} />
                            <DetailRow label="Eye Shape" value={appearance.eyeShape} />
                            <DetailRow label="Nose Shape" value={appearance.noseShape} />
                            <DetailRow label="Jawline" value={appearance.jawline} />
                            <DetailRow label="Hairstyle" value={appearance.hairstyle} />
                            <DetailRow label="Hair Length" value={appearance.hairLength} />
                            <DetailRow label="Hair Texture" value={appearance.hairTexture} />
                            {appearance.facialHair && <DetailRow label="Facial Hair" value={appearance.facialHairStyle} />}
                            <DetailRow label="Ear Size Debug" value={`Visible ears at Y: ${Math.floor((appearance.faceShape === 'long' ? 28 : 24) * 0.35)}-${Math.floor((appearance.faceShape === 'long' ? 28 : 24) * 0.55)}`} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortraitModal;
