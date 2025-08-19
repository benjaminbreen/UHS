/**
 * AnimalCombatSprite - Enhanced animated, pixel-art style animal sprites for combat.
 * Supports all animal species from the game with charming pixel art aesthetic,
 * proper scale and facing direction. More detailed but still distinctly pixel art.
 */
import React from 'react';
import { AnimalEntity } from '../../types';

interface AnimalCombatSpriteProps {
  animal: AnimalEntity;
  animation: 'idle' | 'attacking' | 'damaged';
  size?: number;
  facing: 'left' | 'right';
}

// Pixel-perfect block component for crisp pixel art
const PixelBlock: React.FC<{ x: number, y: number, width?: number, height?: number, color: string }> = 
({ x, y, width = 1, height = 1, color }) => (
    <rect x={x * 2} y={y * 2} width={width * 2} height={height * 2} fill={color} shapeRendering="crispEdges" />
);

// Helper function for color darkening
const darken = (color: string, amount: number) => {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) - amt;
    const G = ((num >> 8) & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
                  (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
                  (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
};

// SMALL ANIMALS
const FoxSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#ea580c'; const shadow = '#9a3412'; const tail = '#fed7aa'; const eye = '#000000'; const noseTip = '#1f2937';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'} style={{ '--walk-distance': '25px', '--direction': 1 } as React.CSSProperties}>
            <PixelBlock x={4} y={18} width={6} height={4} color={color} />
            <PixelBlock x={5} y={17} width={4} height={2} color={tail} />
            <PixelBlock x={3} y={19} width={3} height={3} color={shadow} />
            <PixelBlock x={11} y={19} width={8} height={4} color={color} />
            <PixelBlock x={11} y={22} width={8} height={1} color={shadow} />
            <PixelBlock x={12} y={23} width={2} height={4} color={shadow} />
            <PixelBlock x={16} y={23} width={2} height={4} color={color} />
            <PixelBlock x={19} y={17} width={4} height={4} color={color} />
            <PixelBlock x={23} y={18} width={3} height={2} color={color} />
            <PixelBlock x={25} y={19} width={1} height={1} color={noseTip} />
            <PixelBlock x={21} y={18} width={1} height={1} color={eye} />
            <PixelBlock x={19} y={15} width={1} height={2} color={shadow} />
            <PixelBlock x={21} y={15} width={1} height={2} color={shadow} />
            <PixelBlock x={15} y={20} width={3} height={2} color={tail} />
        </g>
    );
};

const OwlSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#8B4513'; const wing = '#654321'; const eye = '#FFD700'; const beak = '#FFA500';
    
    return (
        <g className={animation === 'attacking' ? 'animate-strike' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={15} y={15} width={6} height={8} color={color} />
            <PixelBlock x={12} y={18} width={3} height={5} color={wing} />
            <PixelBlock x={21} y={18} width={3} height={5} color={wing} />
            <PixelBlock x={16} y={12} width={4} height={5} color={color} />
            <PixelBlock x={17} y={14} width={2} height={2} color={eye} />
            <PixelBlock x={18} y={16} width={1} height={1} color={beak} />
            <PixelBlock x={16} y={10} width={1} height={2} color={color} />
            <PixelBlock x={19} y={10} width={1} height={2} color={color} />
            <PixelBlock x={17} y={23} width={2} height={2} color={'#8B4513'} />
        </g>
    );
};

const ChickenSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#FFFFFF'; const comb = '#DC143C'; const beak = '#FFA500'; const leg = '#FFD700';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={14} y={18} width={6} height={5} color={color} />
            <PixelBlock x={15} y={17} width={4} height={1} color={'#F5F5F5'} />
            <PixelBlock x={15} y={23} width={2} height={3} color={leg} />
            <PixelBlock x={18} y={23} width={2} height={3} color={leg} />
            <PixelBlock x={20} y={15} width={3} height={4} color={color} />
            <PixelBlock x={22} y={17} width={1} height={1} color={'#000000'} />
            <PixelBlock x={23} y={18} width={1} height={1} color={beak} />
            <PixelBlock x={20} y={13} width={3} height={2} color={comb} />
            <PixelBlock x={12} y={19} width={2} height={3} color={'#F5F5F5'} />
        </g>
    );
};

const MonkeySprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#8B4513'; const face = '#D2691E'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={13} y={18} width={6} height={6} color={color} />
            <PixelBlock x={11} y={20} width={2} height={4} color={color} />
            <PixelBlock x={19} y={20} width={2} height={4} color={color} />
            <PixelBlock x={14} y={24} width={2} height={4} color={color} />
            <PixelBlock x={17} y={24} width={2} height={4} color={color} />
            <PixelBlock x={19} y={15} width={4} height={5} color={color} />
            <PixelBlock x={20} y={16} width={2} height={3} color={face} />
            <PixelBlock x={21} y={17} width={1} height={1} color={eye} />
            <PixelBlock x={6} y={19} width={7} height={2} color={color} />
            <PixelBlock x={14} y={13} width={1} height={2} color={color} />
            <PixelBlock x={17} y={13} width={1} height={2} color={color} />
        </g>
    );
};

const KoalaSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#808080'; const nose = '#000000'; const ear = '#696969';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={14} y={17} width={6} height={6} color={color} />
            <PixelBlock x={15} y={23} width={2} height={4} color={color} />
            <PixelBlock x={17} y={23} width={2} height={4} color={color} />
            <PixelBlock x={20} y={14} width={4} height={5} color={color} />
            <PixelBlock x={21} y={16} width={1} height={1} color={'#000000'} />
            <PixelBlock x={22} y={17} width={1} height={1} color={nose} />
            <PixelBlock x={19} y={12} width={2} height={2} color={ear} />
            <PixelBlock x={23} y={12} width={2} height={2} color={ear} />
            <PixelBlock x={11} y={19} width={3} height={3} color={color} />
            <PixelBlock x={20} y={19} width={3} height={3} color={color} />
        </g>
    );
};

// HUMAN-SIZED ANIMALS
const DeerSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#a16207'; const shadow = '#713f12'; const antler = '#92400e'; const eye = '#1f2937'; const white = '#f3f4f6';
    
    return (
        <g className={animation === 'attacking' ? 'animate-jump' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={10} y={16} width={12} height={6} color={color} />
            <PixelBlock x={10} y={21} width={12} height={1} color={shadow} />
            <PixelBlock x={11} y={22} width={2} height={8} color={shadow} />
            <PixelBlock x={19} y={22} width={2} height={8} color={color} />
            <PixelBlock x={22} y={13} width={4} height={6} color={color} />
            <PixelBlock x={26} y={10} width={4} height={5} color={color} />
            <PixelBlock x={27} y={12} width={1} height={1} color={eye} />
            <PixelBlock x={25} y={7} width={1} height={4} color={antler} />
            <PixelBlock x={28} y={7} width={1} height={4} color={antler} />
            <PixelBlock x={23} y={8} width={3} height={1} color={antler} />
            <PixelBlock x={28} y={8} width={3} height={1} color={antler} />
            <PixelBlock x={8} y={17} width={2} height={3} color={white} />
            <PixelBlock x={13} y={19} width={6} height={1} color={white} />
        </g>
    );
};

const WolfSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#6b7280'; const shadow = '#4b5563'; const eye = '#facc15'; const teeth = '#f3f4f6';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'} style={{ '--walk-distance': '40px', '--direction': 1 } as React.CSSProperties}>
            <PixelBlock x={4} y={19} width={6} height={3} color={shadow} />
            <PixelBlock x={5} y={18} width={4} height={2} color={color} />
            <PixelBlock x={11} y={18} width={10} height={6} color={color} />
            <PixelBlock x={11} y={23} width={10} height={1} color={shadow} />
            <PixelBlock x={12} y={24} width={3} height={6} color={shadow} />
            <PixelBlock x={17} y={24} width={3} height={6} color={color} />
            <PixelBlock x={21} y={16} width={6} height={6} color={color} />
            <PixelBlock x={27} y={18} width={4} height={3} color={color} />
            <PixelBlock x={23} y={17} width={1} height={1} color={eye} />
            <PixelBlock x={22} y={14} width={1} height={2} color={shadow} />
            <PixelBlock x={25} y={14} width={1} height={2} color={shadow} />
            {animation === 'attacking' && (
                <>
                    <PixelBlock x={29} y={20} width={1} height={2} color={teeth} />
                    <PixelBlock x={30} y={20} width={1} height={2} color={teeth} />
                </>
            )}
        </g>
    );
};

const BearSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#92400e'; const shadow = '#451a03'; const eye = '#000000'; const darkFur = '#713f12';
    
    return (
        <g className={animation === 'attacking' ? 'animate-strike' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={8} y={14} width={16} height={10} color={color} />
            <PixelBlock x={8} y={23} width={16} height={1} color={shadow} />
            <PixelBlock x={9} y={24} width={4} height={7} color={shadow} />
            <PixelBlock x={18} y={24} width={4} height={7} color={color} />
            <PixelBlock x={24} y={12} width={8} height={8} color={color} />
            <PixelBlock x={26} y={14} width={1} height={1} color={eye} />
            <PixelBlock x={29} y={14} width={1} height={1} color={eye} />
            <PixelBlock x={26} y={10} width={2} height={2} color={shadow} />
            <PixelBlock x={30} y={10} width={2} height={2} color={shadow} />
            <PixelBlock x={32} y={16} width={3} height={3} color={shadow} />
        </g>
    );
};

const BoarSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#713f12'; const shadow = '#451a03'; const tusk = '#f3f4f6'; const bristle = '#374151';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={9} y={17} width={12} height={6} color={color} />
            <PixelBlock x={9} y={22} width={12} height={1} color={shadow} />
            <PixelBlock x={10} y={23} width={3} height={5} color={shadow} />
            <PixelBlock x={17} y={23} width={3} height={5} color={color} />
            <PixelBlock x={21} y={15} width={5} height={5} color={color} />
            <PixelBlock x={26} y={17} width={4} height={3} color={color} />
            <PixelBlock x={29} y={19} width={1} height={2} color={tusk} />
            <PixelBlock x={30} y={20} width={1} height={2} color={tusk} />
            <PixelBlock x={10} y={14} width={10} height={3} color={bristle} />
            <PixelBlock x={23} y={16} width={1} height={1} color={'#dc2626'} />
            <PixelBlock x={7} y={19} width={2} height={3} color={shadow} />
        </g>
    );
};

const GoatSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#f3f4f6'; const shadow = '#6b7280'; const horn = '#374151';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={13} y={19} width={8} height={5} color={color} />
            <PixelBlock x={13} y={23} width={8} height={1} color={shadow} />
            <PixelBlock x={14} y={24} width={2} height={5} color={shadow} />
            <PixelBlock x={18} y={24} width={2} height={5} color={color} />
            <PixelBlock x={21} y={16} width={4} height={5} color={color} />
            <PixelBlock x={24} y={18} width={1} height={1} color={'#000000'} />
            <PixelBlock x={22} y={13} width={1} height={3} color={horn} />
            <PixelBlock x={24} y={13} width={1} height={3} color={horn} />
            <PixelBlock x={24} y={20} width={1} height={3} color={shadow} />
            <PixelBlock x={11} y={21} width={2} height={2} color={shadow} />
        </g>
    );
};

const WildHorseSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#8B4513'; const mane = '#654321'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={8} y={16} width={14} height={7} color={color} />
            <PixelBlock x={8} y={22} width={14} height={1} color={darken(color, 0.2)} />
            <PixelBlock x={9} y={23} width={3} height={7} color={darken(color, 0.2)} />
            <PixelBlock x={18} y={23} width={3} height={7} color={color} />
            <PixelBlock x={22} y={12} width={6} height={8} color={color} />
            <PixelBlock x={28} y={14} width={3} height={4} color={color} />
            <PixelBlock x={29} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={22} y={9} width={6} height={3} color={mane} />
            <PixelBlock x={21} y={12} width={1} height={4} color={mane} />
            <PixelBlock x={6} y={18} width={2} height={4} color={mane} />
        </g>
    );
};

const KangarooSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#CD853F'; const pouch = '#DEB887'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-jump' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={12} y={12} width={6} height={12} color={color} />
            <PixelBlock x={14} y={18} width={3} height={4} color={pouch} />
            <PixelBlock x={10} y={16} width={2} height={6} color={color} />
            <PixelBlock x={18} y={16} width={2} height={6} color={color} />
            <PixelBlock x={13} y={24} width={4} height={6} color={color} />
            <PixelBlock x={18} y={10} width={4} height={6} color={color} />
            <PixelBlock x={20} y={12} width={1} height={1} color={eye} />
            <PixelBlock x={17} y={8} width={1} height={2} color={color} />
            <PixelBlock x={20} y={8} width={1} height={2} color={color} />
            <PixelBlock x={8} y={20} width={4} height={2} color={color} />
        </g>
    );
};

// LARGE ANIMALS
const LionSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#d97706'; const mane = '#92400e'; const shadow = '#451a03'; const eye = '#facc15';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={3} y={19} width={7} height={3} color={color} />
            <PixelBlock x={1} y={18} width={3} height={3} color={mane} />
            <PixelBlock x={10} y={16} width={12} height={8} color={color} />
            <PixelBlock x={10} y={23} width={12} height={1} color={shadow} />
            <PixelBlock x={11} y={24} width={3} height={7} color={shadow} />
            <PixelBlock x={18} y={24} width={3} height={7} color={color} />
            <PixelBlock x={20} y={10} width={12} height={12} color={mane} />
            <PixelBlock x={22} y={14} width={8} height={6} color={color} />
            <PixelBlock x={24} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={27} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={29} y={18} width={2} height={1} color={shadow} />
        </g>
    );
};

const TigerSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#FF8C00'; const stripes = '#000000'; const eye = '#32CD32'; const shadow = '#B8860B';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={6} y={19} width={7} height={3} color={color} />
            <PixelBlock x={10} y={16} width={12} height={8} color={color} />
            <PixelBlock x={10} y={23} width={12} height={1} color={shadow} />
            <PixelBlock x={11} y={24} width={3} height={7} color={shadow} />
            <PixelBlock x={18} y={24} width={3} height={7} color={color} />
            <PixelBlock x={22} y={14} width={8} height={8} color={color} />
            <PixelBlock x={30} y={16} width={3} height={4} color={color} />
            <PixelBlock x={24} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={27} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={12} y={17} width={1} height={6} color={stripes} />
            <PixelBlock x={15} y={17} width={1} height={6} color={stripes} />
            <PixelBlock x={18} y={17} width={1} height={6} color={stripes} />
            <PixelBlock x={24} y={15} width={1} height={6} color={stripes} />
            <PixelBlock x={27} y={15} width={1} height={6} color={stripes} />
        </g>
    );
};

const LeopardSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#FFD700'; const spots = '#8B4513'; const eye = '#32CD32'; const shadow = '#DAA520';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={6} y={19} width={6} height={3} color={color} />
            <PixelBlock x={10} y={17} width={10} height={6} color={color} />
            <PixelBlock x={10} y={22} width={10} height={1} color={shadow} />
            <PixelBlock x={11} y={23} width={2} height={5} color={shadow} />
            <PixelBlock x={17} y={23} width={2} height={5} color={color} />
            <PixelBlock x={20} y={15} width={6} height={6} color={color} />
            <PixelBlock x={26} y={17} width={3} height={3} color={color} />
            <PixelBlock x={22} y={17} width={1} height={1} color={eye} />
            <PixelBlock x={12} y={18} width={1} height={1} color={spots} />
            <PixelBlock x={15} y={19} width={1} height={1} color={spots} />
            <PixelBlock x={17} y={18} width={1} height={1} color={spots} />
            <PixelBlock x={21} y={16} width={1} height={1} color={spots} />
            <PixelBlock x={24} y={17} width={1} height={1} color={spots} />
        </g>
    );
};

const CowSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#f3f4f6'; const spots = '#374151'; const shadow = '#6b7280'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={8} y={16} width={14} height={7} color={color} />
            <PixelBlock x={8} y={22} width={14} height={1} color={shadow} />
            <PixelBlock x={10} y={17} width={3} height={3} color={spots} />
            <PixelBlock x={16} y={18} width={3} height={2} color={spots} />
            <PixelBlock x={19} y={17} width={2} height={2} color={spots} />
            <PixelBlock x={9} y={23} width={3} height={6} color={shadow} />
            <PixelBlock x={17} y={23} width={3} height={6} color={color} />
            <PixelBlock x={22} y={14} width={6} height={5} color={color} />
            <PixelBlock x={24} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={23} y={12} width={1} height={2} color={shadow} />
            <PixelBlock x={26} y={12} width={1} height={2} color={shadow} />
            <PixelBlock x={13} y={21} width={4} height={2} color={'#fda4af'} />
            <PixelBlock x={6} y={18} width={2} height={5} color={shadow} />
        </g>
    );
};

const EagleSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#78716c'; const wing = '#44403c'; const beak = '#eab308'; const eye = '#dc2626';
    
    return (
        <g className={animation === 'attacking' ? 'animate-strike' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={16} y={16} width={6} height={8} color={color} />
            {animation === 'attacking' ? (
                <>
                    <PixelBlock x={6} y={17} width={10} height={5} color={wing} />
                    <PixelBlock x={22} y={17} width={10} height={5} color={wing} />
                </>
            ) : (
                <>
                    <PixelBlock x={12} y={18} width={4} height={6} color={wing} />
                    <PixelBlock x={22} y={18} width={4} height={6} color={wing} />
                </>
            )}
            <PixelBlock x={15} y={12} width={4} height={6} color={color} />
            <PixelBlock x={17} y={14} width={1} height={1} color={eye} />
            <PixelBlock x={19} y={15} width={3} height={2} color={beak} />
            <PixelBlock x={17} y={24} width={1} height={3} color={beak} />
            <PixelBlock x={19} y={24} width={1} height={3} color={beak} />
        </g>
    );
};

// VERY LARGE ANIMALS
const ElephantSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#6b7280'; const shadow = '#374151'; const tusk = '#f3f4f6';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={4} y={12} width={20} height={12} color={color} />
            <PixelBlock x={4} y={23} width={20} height={1} color={shadow} />
            <PixelBlock x={5} y={24} width={4} height={8} color={shadow} />
            <PixelBlock x={18} y={24} width={4} height={8} color={color} />
            <PixelBlock x={24} y={8} width={8} height={12} color={color} />
            {animation === 'attacking' ? (
                <PixelBlock x={32} y={16} width={6} height={4} color={color} />
            ) : (
                <PixelBlock x={30} y={18} width={3} height={8} color={color} />
            )}
            <PixelBlock x={29} y={14} width={1} height={4} color={tusk} />
            <PixelBlock x={31} y={14} width={1} height={4} color={tusk} />
            <PixelBlock x={23} y={6} width={6} height={8} color={shadow} />
            <PixelBlock x={29} y={8} width={4} height={6} color={shadow} />
            <PixelBlock x={26} y={12} width={1} height={1} color={'#000000'} />
            <PixelBlock x={2} y={18} width={2} height={6} color={shadow} />
        </g>
    );
};

const RhinocerosSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#696969'; const shadow = '#2F4F4F'; const horn = '#8B7355';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={6} y={14} width={16} height={10} color={color} />
            <PixelBlock x={6} y={23} width={16} height={1} color={shadow} />
            <PixelBlock x={7} y={24} width={4} height={7} color={shadow} />
            <PixelBlock x={17} y={24} width={4} height={7} color={color} />
            <PixelBlock x={22} y={10} width={8} height={10} color={color} />
            <PixelBlock x={30} y={14} width={3} height={4} color={color} />
            <PixelBlock x={31} y={12} width={1} height={2} color={horn} />
            <PixelBlock x={32} y={10} width={1} height={2} color={horn} />
            <PixelBlock x={25} y={13} width={1} height={1} color={'#000000'} />
            <PixelBlock x={4} y={18} width={2} height={4} color={shadow} />
        </g>
    );
};

const HippopotamusSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#708090'; const shadow = '#2F4F4F'; const tooth = '#FFFACD'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={6} y={16} width={18} height={8} color={color} />
            <PixelBlock x={6} y={23} width={18} height={1} color={shadow} />
            <PixelBlock x={7} y={24} width={4} height={6} color={shadow} />
            <PixelBlock x={18} y={24} width={4} height={6} color={color} />
            <PixelBlock x={24} y={12} width={8} height={8} color={color} />
            <PixelBlock x={32} y={16} width={4} height={4} color={color} />
            <PixelBlock x={26} y={15} width={1} height={1} color={eye} />
            <PixelBlock x={29} y={15} width={1} height={1} color={eye} />
            <PixelBlock x={34} y={18} width={1} height={2} color={tooth} />
            <PixelBlock x={35} y={19} width={1} height={2} color={tooth} />
            <PixelBlock x={25} y={10} width={2} height={2} color={shadow} />
            <PixelBlock x={29} y={10} width={2} height={2} color={shadow} />
        </g>
    );
};

const GiraffeSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#fbbf24'; const spots = '#92400e'; const shadow = '#d97706';
    
    return (
        <g className={animation === 'attacking' ? 'animate-strike' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={10} y={18} width={10} height={6} color={color} />
            <PixelBlock x={10} y={23} width={10} height={1} color={shadow} />
            <PixelBlock x={11} y={19} width={2} height={2} color={spots} />
            <PixelBlock x={15} y={20} width={2} height={2} color={spots} />
            <PixelBlock x={17} y={19} width={2} height={2} color={spots} />
            <PixelBlock x={20} y={4} width={4} height={16} color={color} />
            <PixelBlock x={21} y={6} width={1} height={1} color={spots} />
            <PixelBlock x={22} y={9} width={1} height={1} color={spots} />
            <PixelBlock x={21} y={12} width={1} height={1} color={spots} />
            <PixelBlock x={23} y={15} width={1} height={1} color={spots} />
            <PixelBlock x={24} y={2} width={4} height={6} color={color} />
            <PixelBlock x={25} y={4} width={1} height={1} color={spots} />
            <PixelBlock x={26} y={5} width={1} height={1} color={'#000000'} />
            <PixelBlock x={25} y={1} width={1} height={1} color={shadow} />
            <PixelBlock x={27} y={1} width={1} height={1} color={shadow} />
            <PixelBlock x={11} y={24} width={3} height={12} color={shadow} />
            <PixelBlock x={16} y={24} width={3} height={12} color={color} />
            <PixelBlock x={8} y={22} width={2} height={4} color={shadow} />
        </g>
    );
};

const ZebraSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#FFFFFF'; const stripes = '#000000'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={8} y={16} width={12} height={7} color={color} />
            <PixelBlock x={9} y={23} width={3} height={6} color={color} />
            <PixelBlock x={17} y={23} width={3} height={6} color={color} />
            <PixelBlock x={20} y={13} width={6} height={7} color={color} />
            <PixelBlock x={26} y={15} width={3} height={4} color={color} />
            <PixelBlock x={27} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={10} y={17} width={1} height={5} color={stripes} />
            <PixelBlock x={12} y={17} width={1} height={5} color={stripes} />
            <PixelBlock x={14} y={17} width={1} height={5} color={stripes} />
            <PixelBlock x={16} y={17} width={1} height={5} color={stripes} />
            <PixelBlock x={18} y={17} width={1} height={5} color={stripes} />
            <PixelBlock x={22} y={14} width={1} height={5} color={stripes} />
            <PixelBlock x={24} y={14} width={1} height={5} color={stripes} />
            <PixelBlock x={20} y={10} width={6} height={1} color={stripes} />
            <PixelBlock x={6} y={18} width={2} height={4} color={stripes} />
        </g>
    );
};

const GorillaSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#2F4F4F'; const chest = '#696969'; const eye = '#8B4513';
    
    return (
        <g className={animation === 'attacking' ? 'animate-strike' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={10} y={14} width={12} height={10} color={color} />
            <PixelBlock x={13} y={17} width={6} height={5} color={chest} />
            <PixelBlock x={8} y={18} width={4} height={8} color={color} />
            <PixelBlock x={22} y={18} width={4} height={8} color={color} />
            <PixelBlock x={11} y={24} width={3} height={6} color={color} />
            <PixelBlock x={16} y={24} width={3} height={6} color={color} />
            <PixelBlock x={22} y={10} width={8} height={8} color={color} />
            <PixelBlock x={24} y={13} width={1} height={1} color={eye} />
            <PixelBlock x={27} y={13} width={1} height={1} color={eye} />
            <PixelBlock x={26} y={15} width={2} height={2} color={'#8B4513'} />
            <PixelBlock x={21} y={8} width={2} height={2} color={color} />
            <PixelBlock x={28} y={8} width={2} height={2} color={color} />
        </g>
    );
};

const BisonSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#8B4513'; const mane = '#654321'; const shadow = '#5D4037'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={8} y={16} width={16} height={8} color={color} />
            <PixelBlock x={8} y={23} width={16} height={1} color={shadow} />
            <PixelBlock x={9} y={24} width={4} height={7} color={shadow} />
            <PixelBlock x={19} y={24} width={4} height={7} color={color} />
            <PixelBlock x={24} y={12} width={8} height={8} color={color} />
            <PixelBlock x={20} y={8} width={12} height={8} color={mane} />
            <PixelBlock x={26} y={15} width={1} height={1} color={eye} />
            <PixelBlock x={30} y={17} width={2} height={2} color={'#8B4513'} />
            <PixelBlock x={25} y={10} width={1} height={2} color={'#696969'} />
            <PixelBlock x={29} y={10} width={1} height={2} color={'#696969'} />
            <PixelBlock x={6} y={18} width={2} height={4} color={mane} />
        </g>
    );
};

const PandaSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#FFFFFF'; const black = '#000000'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={12} y={16} width={10} height={8} color={color} />
            <PixelBlock x={10} y={18} width={2} height={6} color={black} />
            <PixelBlock x={22} y={18} width={2} height={6} color={black} />
            <PixelBlock x={13} y={24} width={3} height={6} color={black} />
            <PixelBlock x={18} y={24} width={3} height={6} color={black} />
            <PixelBlock x={22} y={12} width={6} height={8} color={color} />
            <PixelBlock x={21} y={10} width={2} height={4} color={black} />
            <PixelBlock x={27} y={10} width={2} height={4} color={black} />
            <PixelBlock x={23} y={14} width={2} height={2} color={black} />
            <PixelBlock x={24} y={15} width={1} height={1} color={color} />
            <PixelBlock x={25} y={17} width={2} height={1} color={black} />
        </g>
    );
};

const MooseSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#92400e'; const shadow = '#451a03'; const antler = '#713f12';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={6} y={12} width={16} height={10} color={color} />
            <PixelBlock x={6} y={21} width={16} height={1} color={shadow} />
            <PixelBlock x={7} y={22} width={4} height={10} color={shadow} />
            <PixelBlock x={16} y={22} width={4} height={10} color={color} />
            <PixelBlock x={22} y={8} width={6} height={10} color={color} />
            <PixelBlock x={28} y={6} width={5} height={6} color={color} />
            <PixelBlock x={24} y={2} width={3} height={6} color={antler} />
            <PixelBlock x={29} y={2} width={3} height={6} color={antler} />
            <PixelBlock x={21} y={4} width={5} height={2} color={antler} />
            <PixelBlock x={30} y={4} width={5} height={2} color={antler} />
            <PixelBlock x={26} y={12} width={3} height={4} color={shadow} />
        </g>
    );
};

const CamelSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#d97706'; const shadow = '#92400e'; const hump = '#a16207';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={6} y={16} width={14} height={6} color={color} />
            <PixelBlock x={6} y={21} width={14} height={1} color={shadow} />
            <PixelBlock x={11} y={12} width={6} height={4} color={hump} />
            <PixelBlock x={20} y={8} width={4} height={10} color={color} />
            <PixelBlock x={24} y={6} width={5} height={4} color={color} />
            <PixelBlock x={26} y={7} width={1} height={1} color={'#000000'} />
            <PixelBlock x={7} y={22} width={3} height={10} color={shadow} />
            <PixelBlock x={16} y={22} width={3} height={10} color={color} />
            <PixelBlock x={4} y={18} width={2} height={4} color={shadow} />
        </g>
    );
};

// AQUATIC ANIMALS
const CrocodileSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#556B2F'; const belly = '#9ACD32'; const eye = '#FFD700'; const tooth = '#FFFFFF';
    
    return (
        <g className={animation === 'attacking' ? 'animate-strike' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={8} y={20} width={16} height={4} color={color} />
            <PixelBlock x={10} y={22} width={12} height={2} color={belly} />
            <PixelBlock x={24} y={18} width={8} height={4} color={color} />
            <PixelBlock x={32} y={19} width={4} height={2} color={color} />
            <PixelBlock x={26} y={19} width={1} height={1} color={eye} />
            <PixelBlock x={34} y={20} width={1} height={1} color={tooth} />
            <PixelBlock x={35} y={20} width={1} height={1} color={tooth} />
            <PixelBlock x={6} y={21} width={2} height={1} color={color} />
            <PixelBlock x={4} y={21} width={6} height={2} color={color} />
            <PixelBlock x={9} y={19} width={1} height={1} color={darken(color, 0.3)} />
            <PixelBlock x={13} y={19} width={1} height={1} color={darken(color, 0.3)} />
            <PixelBlock x={17} y={19} width={1} height={1} color={darken(color, 0.3)} />
            <PixelBlock x={21} y={19} width={1} height={1} color={darken(color, 0.3)} />
        </g>
    );
};

// REPTILES
const SnakeSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#16a34a'; const shadow = '#15803d'; const pattern = '#facc15'; const eye = '#dc2626';
    
    return (
        <g className={animation === 'attacking' ? 'animate-strike' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={10} y={24} width={3} height={3} color={color} />
            <PixelBlock x={13} y={22} width={3} height={3} color={color} />
            <PixelBlock x={16} y={20} width={3} height={3} color={color} />
            <PixelBlock x={19} y={18} width={3} height={3} color={color} />
            <PixelBlock x={22} y={20} width={3} height={3} color={color} />
            <PixelBlock x={25} y={22} width={3} height={3} color={color} />
            <PixelBlock x={11} y={24} width={1} height={1} color={pattern} />
            <PixelBlock x={17} y={21} width={1} height={1} color={pattern} />
            <PixelBlock x={23} y={21} width={1} height={1} color={pattern} />
            <PixelBlock x={26} y={23} width={1} height={1} color={pattern} />
            {animation === 'attacking' ? (
                <>
                    <PixelBlock x={25} y={15} width={4} height={3} color={color} />
                    <PixelBlock x={28} y={16} width={1} height={1} color={eye} />
                </>
            ) : (
                <>
                    <PixelBlock x={22} y={17} width={4} height={3} color={color} />
                    <PixelBlock x={25} y={18} width={1} height={1} color={eye} />
                </>
            )}
            <PixelBlock x={8} y={25} width={2} height={2} color={shadow} />
        </g>
    );
};

// ADDITIONAL SMALL ANIMALS
const SheepSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#FFFFFF'; const shadow = '#E5E5E5'; const face = '#FFB6C1'; const leg = '#4B4B4B';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={12} y={17} width={8} height={6} color={color} />
            <PixelBlock x={10} y={18} width={12} height={4} color={color} />
            <PixelBlock x={12} y={22} width={8} height={1} color={shadow} />
            <PixelBlock x={13} y={23} width={2} height={4} color={leg} />
            <PixelBlock x={17} y={23} width={2} height={4} color={leg} />
            <PixelBlock x={20} y={14} width={4} height={5} color={color} />
            <PixelBlock x={21} y={16} width={2} height={2} color={face} />
            <PixelBlock x={22} y={16} width={1} height={1} color={'#000000'} />
            <PixelBlock x={19} y={13} width={2} height={2} color={'#4B4B4B'} />
            <PixelBlock x={22} y={13} width={2} height={2} color={'#4B4B4B'} />
        </g>
    );
};

const LlamaSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#D2691E'; const shadow = '#A0522D'; const white = '#FFFFFF';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={12} y={15} width={7} height={7} color={color} />
            <PixelBlock x={12} y={21} width={7} height={1} color={shadow} />
            <PixelBlock x={13} y={22} width={2} height={8} color={color} />
            <PixelBlock x={17} y={22} width={2} height={8} color={color} />
            <PixelBlock x={19} y={10} width={3} height={8} color={color} />
            <PixelBlock x={22} y={8} width={4} height={5} color={color} />
            <PixelBlock x={23} y={10} width={1} height={1} color={'#000000'} />
            <PixelBlock x={14} y={17} width={3} height={2} color={white} />
            <PixelBlock x={21} y={5} width={1} height={3} color={color} />
            <PixelBlock x={24} y={5} width={1} height={3} color={color} />
        </g>
    );
};

const PenguinSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const black = '#000000'; const white = '#FFFFFF'; const beak = '#FFA500'; const feet = '#FF6347';
    
    return (
        <g className={animation === 'attacking' ? 'animate-waddle' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={14} y={14} width={6} height={8} color={black} />
            <PixelBlock x={15} y={16} width={4} height={5} color={white} />
            <PixelBlock x={11} y={18} width={3} height={3} color={black} />
            <PixelBlock x={20} y={18} width={3} height={3} color={black} />
            <PixelBlock x={15} y={22} width={2} height={4} color={black} />
            <PixelBlock x={17} y={22} width={2} height={4} color={black} />
            <PixelBlock x={14} y={26} width={3} height={1} color={feet} />
            <PixelBlock x={17} y={26} width={3} height={1} color={feet} />
            <PixelBlock x={20} y={15} width={1} height={1} color={beak} />
            <PixelBlock x={16} y={14} width={1} height={1} color={'#FFFFFF'} />
            <PixelBlock x={18} y={14} width={1} height={1} color={'#FFFFFF'} />
        </g>
    );
};

const RabbitSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#8B7355'; const white = '#FFFFFF'; const pink = '#FFB6C1'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-hop' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={14} y={19} width={5} height={5} color={color} />
            <PixelBlock x={15} y={24} width={2} height={3} color={color} />
            <PixelBlock x={17} y={24} width={2} height={3} color={color} />
            <PixelBlock x={19} y={17} width={3} height={4} color={color} />
            <PixelBlock x={20} y={18} width={1} height={1} color={eye} />
            <PixelBlock x={17} y={14} width={1} height={5} color={color} />
            <PixelBlock x={20} y={14} width={1} height={5} color={color} />
            <PixelBlock x={17} y={13} width={1} height={1} color={pink} />
            <PixelBlock x={20} y={13} width={1} height={1} color={pink} />
            <PixelBlock x={11} y={22} width={3} height={1} color={white} />
            <PixelBlock x={15} y={21} width={2} height={2} color={white} />
        </g>
    );
};

const SquirrelSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#8B4513'; const tail = '#A0522D'; const white = '#FFFFFF';
    
    return (
        <g className={animation === 'attacking' ? 'animate-scurry' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={15} y={20} width={4} height={4} color={color} />
            <PixelBlock x={16} y={24} width={2} height={3} color={color} />
            <PixelBlock x={19} y={18} width={3} height={3} color={color} />
            <PixelBlock x={20} y={19} width={1} height={1} color={'#000000'} />
            <PixelBlock x={11} y={16} width={4} height={6} color={tail} />
            <PixelBlock x={10} y={14} width={3} height={4} color={tail} />
            <PixelBlock x={16} y={21} width={2} height={1} color={white} />
            <PixelBlock x={13} y={20} width={2} height={2} color={color} />
        </g>
    );
};

const HedgehogSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const body = '#8B4513'; const spikes = '#4B4B4B'; const nose = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-roll' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={13} y={20} width={7} height={4} color={body} />
            <PixelBlock x={13} y={17} width={7} height={3} color={spikes} />
            <PixelBlock x={12} y={18} width={9} height={2} color={spikes} />
            <PixelBlock x={14} y={24} width={2} height={2} color={body} />
            <PixelBlock x={17} y={24} width={2} height={2} color={body} />
            <PixelBlock x={20} y={21} width={2} height={2} color={body} />
            <PixelBlock x={22} y={21} width={1} height={1} color={nose} />
            <PixelBlock x={20} y={20} width={1} height={1} color={'#000000'} />
            <PixelBlock x={11} y={19} width={1} height={1} color={spikes} />
            <PixelBlock x={21} y={19} width={1} height={1} color={spikes} />
        </g>
    );
};

const BatSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const body = '#4B4B4B'; const wing = '#2F2F2F'; const eye = '#FF0000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-flutter' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={15} y={18} width={3} height={4} color={body} />
            <PixelBlock x={8} y={17} width={7} height={3} color={wing} />
            <PixelBlock x={18} y={17} width={7} height={3} color={wing} />
            <PixelBlock x={16} y={17} width={1} height={1} color={eye} />
            <PixelBlock x={14} y={16} width={1} height={2} color={body} />
            <PixelBlock x={18} y={16} width={1} height={2} color={body} />
            <PixelBlock x={16} y={22} width={1} height={2} color={body} />
        </g>
    );
};

const OtterSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#654321'; const belly = '#D2691E'; const nose = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-swim' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={10} y={19} width={10} height={4} color={color} />
            <PixelBlock x={12} y={21} width={6} height={2} color={belly} />
            <PixelBlock x={11} y={23} width={2} height={3} color={color} />
            <PixelBlock x={17} y={23} width={2} height={3} color={color} />
            <PixelBlock x={20} y={18} width={4} height={3} color={color} />
            <PixelBlock x={23} y={19} width={1} height={1} color={nose} />
            <PixelBlock x={21} y={18} width={1} height={1} color={'#000000'} />
            <PixelBlock x={6} y={20} width={4} height={2} color={color} />
        </g>
    );
};

const PeacockSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const body = '#1E90FF'; const tail = '#00CED1'; const eye = '#FFD700'; const feet = '#FF6347';
    
    return (
        <g className={animation === 'attacking' ? 'animate-display' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={16} y={18} width={5} height={5} color={body} />
            <PixelBlock x={17} y={23} width={2} height={4} color={feet} />
            <PixelBlock x={21} y={16} width={3} height={3} color={body} />
            <PixelBlock x={23} y={17} width={1} height={1} color={'#000000'} />
            <PixelBlock x={10} y={14} width={12} height={4} color={tail} />
            <PixelBlock x={11} y={12} width={10} height={2} color={tail} />
            <PixelBlock x={13} y={11} width={1} height={1} color={eye} />
            <PixelBlock x={16} y={11} width={1} height={1} color={eye} />
            <PixelBlock x={19} y={11} width={1} height={1} color={eye} />
            <PixelBlock x={21} y={14} width={2} height={2} color={'#FFD700'} />
        </g>
    );
};

const TurkeySprite: React.FC<{ animation: string }> = ({ animation }) => {
    const body = '#8B4513'; const red = '#DC143C'; const tail = '#D2691E'; const feet = '#FFD700';
    
    return (
        <g className={animation === 'attacking' ? 'animate-strut' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={14} y={17} width={6} height={6} color={body} />
            <PixelBlock x={15} y={23} width={2} height={3} color={feet} />
            <PixelBlock x={17} y={23} width={2} height={3} color={feet} />
            <PixelBlock x={20} y={15} width={3} height={4} color={body} />
            <PixelBlock x={22} y={16} width={1} height={1} color={'#000000'} />
            <PixelBlock x={23} y={17} width={1} height={2} color={red} />
            <PixelBlock x={10} y={16} width={4} height={5} color={tail} />
            <PixelBlock x={9} y={17} width={2} height={3} color={tail} />
            <PixelBlock x={20} y={13} width={2} height={2} color={red} />
        </g>
    );
};

const ParrotSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const green = '#00FF00'; const red = '#FF0000'; const yellow = '#FFD700'; const beak = '#FFA500';
    
    return (
        <g className={animation === 'attacking' ? 'animate-flutter' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={15} y={16} width={4} height={6} color={green} />
            <PixelBlock x={13} y={18} width={2} height={3} color={red} />
            <PixelBlock x={19} y={18} width={2} height={3} color={yellow} />
            <PixelBlock x={16} y={22} width={2} height={3} color={green} />
            <PixelBlock x={19} y={14} width={3} height={3} color={green} />
            <PixelBlock x={21} y={15} width={1} height={1} color={'#000000'} />
            <PixelBlock x={22} y={16} width={1} height={1} color={beak} />
            <PixelBlock x={17} y={13} width={1} height={3} color={red} />
        </g>
    );
};

const SlothSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#8B7355'; const claw = '#4B4B4B'; const face = '#D2B48C';
    
    return (
        <g className={animation === 'attacking' ? 'animate-slow-swipe' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={13} y={14} width={7} height={7} color={color} />
            <PixelBlock x={11} y={16} width={3} height={8} color={color} />
            <PixelBlock x={19} y={16} width={3} height={8} color={color} />
            <PixelBlock x={10} y={24} width={2} height={1} color={claw} />
            <PixelBlock x={20} y={24} width={2} height={1} color={claw} />
            <PixelBlock x={14} y={12} width={5} height={3} color={face} />
            <PixelBlock x={15} y={13} width={1} height={1} color={'#000000'} />
            <PixelBlock x={17} y={13} width={1} height={1} color={'#000000'} />
            <PixelBlock x={14} y={21} width={2} height={6} color={color} />
            <PixelBlock x={17} y={21} width={2} height={6} color={color} />
        </g>
    );
};

const BadgerSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const black = '#000000'; const white = '#FFFFFF'; const gray = '#808080';
    
    return (
        <g className={animation === 'attacking' ? 'animate-charge' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={11} y={19} width={10} height={5} color={gray} />
            <PixelBlock x={11} y={17} width={10} height={2} color={white} />
            <PixelBlock x={11} y={16} width={10} height={1} color={black} />
            <PixelBlock x={12} y={24} width={2} height={3} color={gray} />
            <PixelBlock x={17} y={24} width={2} height={3} color={gray} />
            <PixelBlock x={21} y={18} width={3} height={3} color={gray} />
            <PixelBlock x={23} y={19} width={1} height={1} color={'#000000'} />
            <PixelBlock x={22} y={17} width={2} height={1} color={white} />
            <PixelBlock x={11} y={23} width={1} height={1} color={white} />
            <PixelBlock x={19} y={23} width={1} height={1} color={white} />
        </g>
    );
};

const LobsterSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const red = '#DC143C'; const darkRed = '#8B0000'; const claw = '#B22222';
    
    return (
        <g className={animation === 'attacking' ? 'animate-pinch' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={13} y={18} width={6} height={4} color={red} />
            <PixelBlock x={14} y={22} width={4} height={3} color={darkRed} />
            <PixelBlock x={10} y={17} width={3} height={3} color={claw} />
            <PixelBlock x={19} y={17} width={3} height={3} color={claw} />
            <PixelBlock x={9} y={16} width={2} height={2} color={claw} />
            <PixelBlock x={21} y={16} width={2} height={2} color={claw} />
            <PixelBlock x={15} y={17} width={2} height={1} color={'#000000'} />
            <PixelBlock x={12} y={21} width={2} height={1} color={darkRed} />
            <PixelBlock x={18} y={21} width={2} height={1} color={darkRed} />
            <PixelBlock x={14} y={25} width={1} height={2} color={red} />
            <PixelBlock x={17} y={25} width={1} height={2} color={red} />
        </g>
    );
};

const OctopusSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const purple = '#800080'; const darkPurple = '#4B0082'; const eye = '#FFD700';
    
    return (
        <g className={animation === 'attacking' ? 'animate-tentacle' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={14} y={15} width={6} height={6} color={purple} />
            <PixelBlock x={11} y={20} width={3} height={6} color={darkPurple} />
            <PixelBlock x={14} y={20} width={2} height={7} color={darkPurple} />
            <PixelBlock x={16} y={20} width={2} height={7} color={darkPurple} />
            <PixelBlock x={18} y={20} width={3} height={6} color={darkPurple} />
            <PixelBlock x={15} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={18} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={10} y={22} width={1} height={4} color={darkPurple} />
            <PixelBlock x={21} y={22} width={1} height={4} color={darkPurple} />
        </g>
    );
};

const ButterflySprite: React.FC<{ animation: string }> = ({ animation }) => {
    const body = '#000000'; const wing1 = '#FF69B4'; const wing2 = '#FFB6C1'; const dot = '#FFFFFF';
    
    return (
        <g className={animation === 'attacking' ? 'animate-flutter' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={16} y={18} width={1} height={3} color={body} />
            <PixelBlock x={11} y={16} width={5} height={4} color={wing1} />
            <PixelBlock x={17} y={16} width={5} height={4} color={wing1} />
            <PixelBlock x={10} y={17} width={3} height={2} color={wing2} />
            <PixelBlock x={20} y={17} width={3} height={2} color={wing2} />
            <PixelBlock x={12} y={17} width={1} height={1} color={dot} />
            <PixelBlock x={14} y={18} width={1} height={1} color={dot} />
            <PixelBlock x={18} y={18} width={1} height={1} color={dot} />
            <PixelBlock x={20} y={17} width={1} height={1} color={dot} />
        </g>
    );
};

const AnimalCombatSprite: React.FC<AnimalCombatSpriteProps> = ({ 
    animal, 
    animation, 
    size = 128,
    facing
}) => {
    const renderSprite = () => {
        switch(animal.baseId.toUpperCase()) {
            // Small Animals
            case 'FOX': return <FoxSprite animation={animation} />;
            case 'OWL': return <OwlSprite animation={animation} />;
            case 'CHICKEN': return <ChickenSprite animation={animation} />;
            case 'MONKEY': return <MonkeySprite animation={animation} />;
            case 'KOALA': return <KoalaSprite animation={animation} />;
            case 'SHEEP': return <SheepSprite animation={animation} />;
            case 'RABBIT': return <RabbitSprite animation={animation} />;
            case 'SQUIRREL': return <SquirrelSprite animation={animation} />;
            case 'HEDGEHOG': return <HedgehogSprite animation={animation} />;
            case 'BAT': return <BatSprite animation={animation} />;
            case 'OTTER': return <OtterSprite animation={animation} />;
            case 'PEACOCK': return <PeacockSprite animation={animation} />;
            case 'TURKEY': return <TurkeySprite animation={animation} />;
            case 'PARROT': return <ParrotSprite animation={animation} />;
            case 'SLOTH': return <SlothSprite animation={animation} />;
            case 'BADGER': return <BadgerSprite animation={animation} />;
            case 'BUTTERFLY': return <ButterflySprite animation={animation} />;
            case 'PENGUIN': return <PenguinSprite animation={animation} />;
            
            // Human-sized Animals
            case 'DEER': return <DeerSprite animation={animation} />;
            case 'WOLF': return <WolfSprite animation={animation} />;
            case 'BEAR': return <BearSprite animation={animation} />;
            case 'BOAR': return <BoarSprite animation={animation} />;
            case 'GOAT': return <GoatSprite animation={animation} />;
            case 'WILD_HORSE': return <WildHorseSprite animation={animation} />;
            case 'KANGAROO': return <KangarooSprite animation={animation} />;
            case 'LLAMA': return <LlamaSprite animation={animation} />;
            
            // Large Animals
            case 'LION': return <LionSprite animation={animation} />;
            case 'TIGER': return <TigerSprite animation={animation} />;
            case 'LEOPARD': return <LeopardSprite animation={animation} />;
            case 'COW': return <CowSprite animation={animation} />;
            case 'EAGLE': return <EagleSprite animation={animation} />;
            
            // Very Large Animals
            case 'ELEPHANT': return <ElephantSprite animation={animation} />;
            case 'RHINOCEROS': return <RhinocerosSprite animation={animation} />;
            case 'HIPPOPOTAMUS': return <HippopotamusSprite animation={animation} />;
            case 'GIRAFFE': return <GiraffeSprite animation={animation} />;
            case 'ZEBRA': return <ZebraSprite animation={animation} />;
            case 'GORILLA': return <GorillaSprite animation={animation} />;
            case 'BISON': return <BisonSprite animation={animation} />;
            case 'PANDA': return <PandaSprite animation={animation} />;
            case 'MOOSE': return <MooseSprite animation={animation} />;
            case 'CAMEL': return <CamelSprite animation={animation} />;
            
            // Aquatic Animals
            case 'CROCODILE': return <CrocodileSprite animation={animation} />;
            case 'LOBSTER': return <LobsterSprite animation={animation} />;
            case 'OCTOPUS': return <OctopusSprite animation={animation} />;
            
            // Reptiles
            case 'SNAKE': return <SnakeSprite animation={animation} />;
            
            // Default fallback
            default: return <WolfSprite animation={animation} />;
        }
    };

    return (
        <svg viewBox="0 0 80 80" width={size} height={size} style={{ imageRendering: 'pixelated' }}>
            <defs>
                <filter id="predatorGlow">
                    <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#dc2626" floodOpacity="0.3"/>
                </filter>
            </defs>
            <g style={{ 
                filter: animal.type === 'Predator' ? 'url(#predatorGlow)' : 'none',
                transform: facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
                transformOrigin: 'center'
            }}>
                {renderSprite()}
            </g>
        </svg>
    );
};

export default AnimalCombatSprite;