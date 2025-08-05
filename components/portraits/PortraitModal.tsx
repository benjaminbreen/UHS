import React from 'react';
import { PlayerCharacter, NpcEntity } from '../../types';
import { ProceduralPortrait } from './index';

interface PortraitModalProps {
    character: PlayerCharacter | NpcEntity;
    onClose: () => void;
}

const DetailRow: React.FC<{ label: string; value: string | undefined | boolean }> = ({ label, value }) => (
    <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-700/50">
        <span className="text-slate-400 capitalize">{label.replace(/_/g, ' ')}:</span>
        <span className="font-semibold text-white capitalize">{String(value)?.replace(/_/g, ' ') || 'N/A'}</span>
    </div>
);

const PortraitModal: React.FC<PortraitModalProps> = ({ character, onClose }) => {
    const { appearance } = character;
    if (!appearance) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="ff-panel w-full max-w-4xl p-6 flex flex-col md:flex-row gap-8" onClick={e => e.stopPropagation()}>
                {/* Left Side: Portrait */}
                <div className="flex-shrink-0 w-full md:w-1/2 flex flex-col items-center">
                    <h3 className="text-2xl font-bold text-blue-300 mb-4 text-center">{character.name}</h3>
                    <div className="w-full max-w-xs md:max-w-full aspect-square bg-slate-900/50 rounded-lg border-2 border-slate-600/50 shadow-xl shadow-black/40">
                        <ProceduralPortrait character={character} size={512} />
                    </div>
                </div>

                {/* Right Side: Details */}
                <div className="flex-1 min-w-0 flex flex-col">
                    <h4 className="text-lg font-semibold text-amber-400 mb-3 border-b border-amber-500/30 pb-2">Appearance Data</h4>
                    <div className="flex-grow max-h-[60vh] md:max-h-full overflow-y-auto pr-3 scrollbar-thin space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
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
