import React from 'react';
import { PlayerCharacter, NpcEntity } from '../../types';
import { ProceduralPortrait } from './index';

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
    if (!appearance) return null;

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
                    <div className="w-full aspect-square bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border-2 border-slate-700/50 shadow-xl shadow-black/40 overflow-hidden flex items-center justify-center">
                        <div className="w-full h-full transform scale-110">
                            <ProceduralPortrait character={character} size={500} />
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortraitModal;
