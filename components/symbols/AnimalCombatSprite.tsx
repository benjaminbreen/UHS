/**
 * AnimalCombatSprite - Enhanced animated, pixel-art style animal sprites for combat.
 * Supports all animal species from the game with charming pixel art aesthetic,
 * proper scale and facing direction. More detailed but still distinctly pixel art.
 *
 * Now with PNG image support - checks for actual animal images first, falls back to pixel art.
 */
import React, { useState, useEffect } from 'react';
import { AnimalEntity } from '../../types';
import { ANIMAL_DATA } from '../../constants';

interface AnimalCombatSpriteProps {
  animal: AnimalEntity;
  animation: 'idle' | 'attacking' | 'damaged' | 'attack' | 'special' | 'fleeing';
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
    const white = '#ffffff';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'} style={{ '--walk-distance': '25px', '--direction': 1 } as React.CSSProperties}>
            {/* Tail - more fluffy */}
            <PixelBlock x={3} y={18} width={7} height={5} color={color} />
            <PixelBlock x={4} y={17} width={5} height={3} color={tail} />
            <PixelBlock x={5} y={16} width={3} height={2} color={white} />
            <PixelBlock x={2} y={19} width={4} height={4} color={shadow} />
            
            {/* Body - more defined */}
            <PixelBlock x={10} y={18} width={10} height={6} color={color} />
            <PixelBlock x={11} y={17} width={8} height={1} color={tail} />
            <PixelBlock x={10} y={23} width={10} height={1} color={shadow} />
            
            {/* Front legs with paws */}
            <PixelBlock x={11} y={23} width={3} height={5} color={shadow} />
            <PixelBlock x={10} y={27} width={4} height={2} color={noseTip} />
            
            {/* Back legs with paws */}
            <PixelBlock x={16} y={23} width={3} height={5} color={color} />
            <PixelBlock x={15} y={27} width={4} height={2} color={noseTip} />
            
            {/* Head - more fox-like */}
            <PixelBlock x={19} y={16} width={5} height={5} color={color} />
            <PixelBlock x={24} y={17} width={3} height={3} color={color} />
            <PixelBlock x={26} y={18} width={2} height={1} color={noseTip} />
            <PixelBlock x={21} y={18} width={1} height={1} color={eye} />
            <PixelBlock x={21} y={19} width={3} height={1} color={white} />
            
            {/* Ears - pointed */}
            <PixelBlock x={19} y={14} width={2} height={3} color={color} />
            <PixelBlock x={22} y={14} width={2} height={3} color={color} />
            <PixelBlock x={19} y={15} width={1} height={1} color={shadow} />
            <PixelBlock x={22} y={15} width={1} height={1} color={shadow} />
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
    const white = '#FFFFFF'; const feather = '#F5F5F5'; const comb = '#DC143C'; 
    const beak = '#FFA500'; const leg = '#FFD700'; const wattle = '#FF6B6B';
    const eye = '#000000'; const shadow = '#E0E0E0';
    
    return (
        <g className={animation === 'attacking' ? 'animate-peck' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-chicken-bob'}>
            {/* Tail feathers */}
            <PixelBlock x={10} y={17} width={3} height={4} color={feather} />
            <PixelBlock x={11} y={16} width={2} height={2} color={white} />
            <PixelBlock x={9} y={18} width={2} height={2} color={shadow} />
            
            {/* Body - plump and round */}
            <PixelBlock x={13} y={17} width={8} height={7} color={white} />
            <PixelBlock x={14} y={16} width={6} height={2} color={feather} />
            <PixelBlock x={13} y={23} width={8} height={1} color={shadow} />
            
            {/* Wing detail */}
            <PixelBlock x={12} y={19} width={3} height={3} color={feather} />
            <PixelBlock x={19} y={19} width={3} height={3} color={feather} />
            <PixelBlock x={14} y={20} width={5} height={1} color={shadow} />
            
            {/* Legs with claws */}
            <PixelBlock x={15} y={23} width={1} height={4} color={leg} />
            <PixelBlock x={14} y={26} width={3} height={1} color={'#FFA500'} />
            <PixelBlock x={14} y={27} width={1} height={1} color={'#FF8C00'} />
            <PixelBlock x={16} y={27} width={1} height={1} color={'#FF8C00'} />
            
            <PixelBlock x={18} y={23} width={1} height={4} color={leg} />
            <PixelBlock x={17} y={26} width={3} height={1} color={'#FFA500'} />
            <PixelBlock x={17} y={27} width={1} height={1} color={'#FF8C00'} />
            <PixelBlock x={19} y={27} width={1} height={1} color={'#FF8C00'} />
            
            {/* Head and neck */}
            <PixelBlock x={20} y={14} width={5} height={5} color={white} />
            <PixelBlock x={21} y={13} width={3} height={2} color={feather} />
            
            {/* Comb */}
            <PixelBlock x={20} y={11} width={4} height={3} color={comb} />
            <PixelBlock x={21} y={10} width={2} height={2} color={'#FF1493'} />
            
            {/* Face details */}
            <PixelBlock x={22} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={25} y={16} width={2} height={2} color={beak} />
            <PixelBlock x={23} y={18} width={2} height={2} color={wattle} />
            
            {animation === 'attacking' && (
                <>
                    {/* Pecking beak open */}
                    <PixelBlock x={26} y={17} width={1} height={1} color={'#FF4500'} />
                </>
            )}
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
            
            {/* Enhanced two-layer shadow system */}
            {/* Ground contact shadow - directly under hooves */}
            <ellipse cx={18} cy={30} rx={10} ry={2} fill="rgba(0,0,0,0.4)" />
            {/* Ambient shadow - larger, softer */}
            <ellipse cx={18} cy={31} rx={12} ry={3} fill="rgba(0,0,0,0.2)" />
        </g>
    );
};

const WolfSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#6b7280'; const shadow = '#4b5563'; const eye = '#facc15'; const teeth = '#f3f4f6';
    const darkFur = '#374151';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'} style={{ '--walk-distance': '40px', '--direction': 1 } as React.CSSProperties}>
            {/* Tail - bushy */}
            <PixelBlock x={2} y={18} width={8} height={5} color={shadow} />
            <PixelBlock x={3} y={17} width={6} height={4} color={color} />
            <PixelBlock x={4} y={19} width={4} height={2} color={darkFur} />
            
            {/* Body - muscular */}
            <PixelBlock x={10} y={16} width={12} height={8} color={color} />
            <PixelBlock x={11} y={15} width={10} height={2} color={darkFur} />
            <PixelBlock x={10} y={23} width={12} height={1} color={shadow} />
            
            {/* Front legs - strong */}
            <PixelBlock x={11} y={23} width={4} height={7} color={shadow} />
            <PixelBlock x={12} y={22} width={2} height={1} color={color} />
            <PixelBlock x={10} y={29} width={5} height={2} color={darkFur} />
            
            {/* Back legs */}
            <PixelBlock x={17} y={23} width={4} height={7} color={color} />
            <PixelBlock x={18} y={22} width={2} height={1} color={darkFur} />
            <PixelBlock x={16} y={29} width={5} height={2} color={darkFur} />
            
            {/* Head - wolf-like with snout */}
            <PixelBlock x={21} y={15} width={7} height={7} color={color} />
            <PixelBlock x={28} y={17} width={4} height={4} color={color} />
            <PixelBlock x={31} y={18} width={2} height={2} color={darkFur} />
            <PixelBlock x={23} y={17} width={1} height={1} color={eye} />
            <PixelBlock x={25} y={17} width={1} height={1} color={'#000000'} />
            
            {/* Ears - alert */}
            <PixelBlock x={22} y={13} width={2} height={3} color={shadow} />
            <PixelBlock x={25} y={13} width={2} height={3} color={shadow} />
            <PixelBlock x={22} y={14} width={1} height={1} color={color} />
            <PixelBlock x={25} y={14} width={1} height={1} color={color} />
            
            {animation === 'attacking' && (
                <>
                    <PixelBlock x={31} y={20} width={2} height={1} color={teeth} />
                    <PixelBlock x={32} y={19} width={1} height={2} color={teeth} />
                    <PixelBlock x={30} y={21} width={3} height={1} color={'#dc2626'} />
                </>
            )}
        </g>
    );
};

const BearSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const bearBrown = '#8B4513';
    const darkFur = '#654321';
    const lightBrown = '#A0522D';
    const blackNose = '#000000';
    const eyeColor = '#2F1B14';
    const clawColor = '#F5F5DC';
    const shadowColor = '#5D4037';
    
    const isAttacking = animation === 'attacking' || animation === 'special';
    
    return (
        <g className={isAttacking ? 'animate-bear-swipe' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            {/* Massive bear body */}
            <PixelBlock x={8} y={16} width={18} height={12} color={bearBrown} />
            <PixelBlock x={9} y={17} width={16} height={10} color={lightBrown} />
            <PixelBlock x={10} y={18} width={14} height={3} color={darkFur} />
            
            {/* Large bear head */}
            <PixelBlock x={22} y={8} width={12} height={12} color={bearBrown} />
            <PixelBlock x={23} y={9} width={10} height={10} color={lightBrown} />
            
            {/* Distinctive bear snout */}
            <PixelBlock x={34} y={13} width={5} height={4} color={lightBrown} />
            <PixelBlock x={36} y={14} width={3} height={2} color={darkFur} />
            <PixelBlock x={37} y={14.5} width={1} height={1} color={blackNose} />
            
            {/* Small bear eyes */}
            <PixelBlock x={25} y={12} width={1.5} height={1.5} color={eyeColor} />
            <PixelBlock x={29} y={12} width={1.5} height={1.5} color={eyeColor} />
            <PixelBlock x={25.3} y={12.3} width={0.8} height={0.8} color={'#000000'} />
            <PixelBlock x={29.3} y={12.3} width={0.8} height={0.8} color={'#000000'} />
            
            {/* Round bear ears */}
            <PixelBlock x={24} y={6} width={4} height={4} color={bearBrown} />
            <PixelBlock x={30} y={6} width={4} height={4} color={bearBrown} />
            <PixelBlock x={25} y={7} width={2} height={2} color={darkFur} />
            <PixelBlock x={31} y={7} width={2} height={2} color={darkFur} />
            
            {/* Thick powerful legs */}
            <PixelBlock x={10} y={28} width={5} height={8} color={bearBrown} />
            <PixelBlock x={11} y={29} width={3} height={6} color={lightBrown} />
            <PixelBlock x={9} y={35} width={7} height={2} color={shadowColor} />
            <PixelBlock x={10} y={36} width={5} height={1} color={clawColor} />
            
            <PixelBlock x={19} y={28} width={5} height={8} color={bearBrown} />
            <PixelBlock x={20} y={29} width={3} height={6} color={lightBrown} />
            <PixelBlock x={18} y={35} width={7} height={2} color={shadowColor} />
            <PixelBlock x={19} y={36} width={5} height={1} color={clawColor} />
            
            {/* Front legs with dynamic attacking position */}
            {isAttacking ? (
                <>
                    {/* Raised attacking paw */}
                    <PixelBlock x={34} y={10} width={6} height={8} color={bearBrown} />
                    <PixelBlock x={35} y={11} width={4} height={6} color={lightBrown} />
                    <PixelBlock x={40} y={8} width={3} height={4} color={bearBrown} />
                    {/* Extended claws */}
                    <PixelBlock x={41} y={6} width={1} height={4} color={clawColor} />
                    <PixelBlock x={39} y={7} width={1} height={3} color={clawColor} />
                    <PixelBlock x={37} y={8} width={1} height={3} color={clawColor} />
                    
                    {/* Action lines */}
                    <PixelBlock x={42} y={9} width={2} height={0.5} color={'#ffff00'} />
                    <PixelBlock x={43} y={10} width={3} height={0.5} color={'#ffff00'} />
                </>
            ) : (
                <>
                    {/* Normal front legs */}
                    <PixelBlock x={12} y={28} width={4} height={8} color={bearBrown} />
                    <PixelBlock x={21} y={28} width={4} height={8} color={bearBrown} />
                    <PixelBlock x={13} y={29} width={2} height={6} color={lightBrown} />
                    <PixelBlock x={22} y={29} width={2} height={6} color={lightBrown} />
                </>
            )}
            
            {/* Stubby bear tail */}
            <PixelBlock x={4} y={20} width={4} height={3} color={bearBrown} />
            <PixelBlock x={5} y={21} width={2} height={1} color={darkFur} />
            
            {/* Attack effects */}
            {isAttacking && (
                <>
                    <PixelBlock x={40} y={12} width={1} height={1} color={'#ff6600'} />
                    <PixelBlock x={38} y={11} width={1} height={1} color={'#ff6600'} />
                </>
            )}
            
            {/* Bear shadow */}
            <ellipse cx={20} cy={38} rx={16} ry={3} fill="rgba(0,0,0,0.4)" />
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
    const bodyColor = '#D2691E';
    const darkColor = '#A0522D';
    const lightColor = '#F4A460';
    const pouchColor = '#DEB887';
    const eyeColor = '#000000';
    const noseColor = '#8B4513';
    const earInner = '#FFB6C1';
    const shadowColor = '#8B4513';
    
    const isPunching = animation === 'attacking' || animation === 'special';
    
    return (
        <g className={isPunching ? 'animate-kangaroo-punch' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            {/* Enhanced Body with Realistic Proportions */}
            
            {/* Main torso - upright posture */}
            <PixelBlock x={15} y={10} width={6} height={14} color={bodyColor} />
            <PixelBlock x={16} y={11} width={4} height={12} color={lightColor} />
            
            {/* Distinctive pouch with detail */}
            <PixelBlock x={16} y={18} width={4} height={5} color={pouchColor} />
            <PixelBlock x={17} y={19} width={2} height={3} color={darkColor} />
            
            {/* Enhanced head with proper kangaroo features */}
            <PixelBlock x={17} y={6} width={6} height={6} color={bodyColor} />
            <PixelBlock x={18} y={7} width={4} height={4} color={lightColor} />
            
            {/* Long snout */}
            <PixelBlock x={23} y={8} width={3} height={2} color={bodyColor} />
            <PixelBlock x={25} y={8.5} width={1} height={1} color={noseColor} />
            
            {/* Large distinctive ears */}
            <PixelBlock x={16} y={4} width={2} height={4} color={bodyColor} />
            <PixelBlock x={16.5} y={4.5} width={1} height={3} color={earInner} />
            <PixelBlock x={21} y={4} width={2} height={4} color={bodyColor} />
            <PixelBlock x={21.5} y={4.5} width={1} height={3} color={earInner} />
            
            {/* Enhanced eye with more detail */}
            <PixelBlock x={19} y={8} width={1.5} height={1.5} color={eyeColor} />
            <PixelBlock x={19.3} y={8.2} width={0.5} height={0.5} color={'#ffffff'} />
            
            {/* Small arms - kangaroos have small front limbs */}
            {isPunching ? (
                <>
                    <PixelBlock x={12} y={12} width={3} height={2} color={bodyColor} />
                    <PixelBlock x={10} y={13} width={2} height={2} color={bodyColor} />
                    <PixelBlock x={8} y={14} width={2} height={1} color={darkColor} />
                </>
            ) : (
                <>
                    <PixelBlock x={13} y={14} width={2} height={4} color={bodyColor} />
                    <PixelBlock x={21} y={14} width={2} height={4} color={bodyColor} />
                </>
            )}
            
            {/* Powerful hind legs - kangaroo's signature feature */}
            <PixelBlock x={13} y={24} width={3} height={8} color={bodyColor} />
            <PixelBlock x={18} y={24} width={3} height={8} color={bodyColor} />
            <PixelBlock x={14} y={25} width={1} height={6} color={lightColor} />
            <PixelBlock x={19} y={25} width={1} height={6} color={lightColor} />
            
            {/* Large feet */}
            <PixelBlock x={10} y={32} width={6} height={2} color={darkColor} />
            <PixelBlock x={18} y={32} width={6} height={2} color={darkColor} />
            
            {/* Muscular thigh definition */}
            <PixelBlock x={14} y={26} width={2} height={4} color={darkColor} />
            <PixelBlock x={18} y={26} width={2} height={4} color={darkColor} />
            
            {/* Distinctive tail - thick at base, tapers */}
            <PixelBlock x={6} y={20} width={8} height={3} color={bodyColor} />
            <PixelBlock x={4} y={22} width={6} height={2} color={bodyColor} />
            <PixelBlock x={2} y={24} width={4} height={2} color={darkColor} />
            
            {/* Tail tip touching ground for support */}
            <PixelBlock x={1} y={26} width={2} height={2} color={shadowColor} />
            
            {/* Combat effects for punch attack */}
            {isPunching && (
                <>
                    {/* Action lines */}
                    <PixelBlock x={6} y={13} width={2} height={0.5} color={'#ffff00'} />
                    <PixelBlock x={5} y={14} width={3} height={0.5} color={'#ffff00'} />
                    <PixelBlock x={4} y={15} width={4} height={0.5} color={'#ffff00'} />
                    
                    {/* Impact effect */}
                    <PixelBlock x={7} y={15} width={1} height={1} color={'#ff6600'} />
                    <PixelBlock x={6} y={14} width={1} height={1} color={'#ff6600'} />
                </>
            )}
            
            {/* Enhanced two-layer shadow system */}
            {/* Ground contact shadow - directly under feet */}
            <ellipse cx={18} cy={32} rx={8} ry={2} fill="rgba(0,0,0,0.4)" />
            {/* Ambient shadow - larger, softer */}
            <ellipse cx={18} cy={33} rx={10} ry={3} fill="rgba(0,0,0,0.2)" />
        </g>
    );
};

// LARGE ANIMALS
const LionSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const lionBody = '#D2691E';
    const lionMane = '#8B4513';
    const lionManeDark = '#654321';
    const lionMuzzle = '#CD853F';
    const eyeColor = '#FFD700';
    const noseColor = '#8B4513';
    const clawColor = '#F5F5DC';
    const shadowColor = '#A0522D';
    
    const isAttacking = animation === 'attacking' || animation === 'special';
    
    return (
        <g className={isAttacking ? 'animate-lion-pounce' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            {/* Magnificent Mane - Lion's signature feature */}
            <PixelBlock x={18} y={6} width={12} height={12} color={lionMane} />
            <PixelBlock x={16} y={8} width={16} height={8} color={lionManeDark} />
            <PixelBlock x={19} y={7} width={10} height={10} color={lionMane} />
            
            {/* Head with proper feline features */}
            <PixelBlock x={22} y={10} width={8} height={6} color={lionBody} />
            <PixelBlock x={23} y={11} width={6} height={4} color={lionMuzzle} />
            
            {/* Snout and nose */}
            <PixelBlock x={30} y={12} width={3} height={2} color={lionMuzzle} />
            <PixelBlock x={31} y={12.5} width={1} height={1} color={noseColor} />
            
            {/* Eyes with feline intensity */}
            <PixelBlock x={24} y={12} width={1.5} height={1.5} color={eyeColor} />
            <PixelBlock x={27} y={12} width={1.5} height={1.5} color={eyeColor} />
            <PixelBlock x={24.3} y={12.3} width={0.8} height={0.8} color={'#000000'} />
            <PixelBlock x={27.3} y={12.3} width={0.8} height={0.8} color={'#000000'} />
            
            {/* Powerful body */}
            <PixelBlock x={12} y={18} width={16} height={8} color={lionBody} />
            <PixelBlock x={13} y={19} width={14} height={6} color={lionMuzzle} />
            
            {/* Front legs with attacking motion */}
            {isAttacking ? (
                <>
                    {/* Pouncing front legs */}
                    <PixelBlock x={8} y={20} width={4} height={6} color={lionBody} />
                    <PixelBlock x={6} y={24} width={2} height={3} color={lionBody} />
                    <PixelBlock x={5} y={26} width={3} height={1} color={clawColor} />
                    
                    <PixelBlock x={28} y={18} width={4} height={8} color={lionBody} />
                    <PixelBlock x={30} y={25} width={3} height={1} color={clawColor} />
                </>
            ) : (
                <>
                    {/* Normal front legs */}
                    <PixelBlock x={14} y={26} width={3} height={6} color={lionBody} />
                    <PixelBlock x={24} y={26} width={3} height={6} color={lionBody} />
                    <PixelBlock x={14} y={31} width={3} height={1} color={shadowColor} />
                    <PixelBlock x={24} y={31} width={3} height={1} color={shadowColor} />
                </>
            )}
            
            {/* Back legs */}
            <PixelBlock x={16} y={26} width={3} height={6} color={lionBody} />
            <PixelBlock x={21} y={26} width={3} height={6} color={lionBody} />
            <PixelBlock x={16} y={31} width={3} height={1} color={shadowColor} />
            <PixelBlock x={21} y={31} width={3} height={1} color={shadowColor} />
            
            {/* Tail with tuft */}
            <PixelBlock x={4} y={20} width={8} height={2} color={lionBody} />
            <PixelBlock x={2} y={18} width={4} height={2} color={lionMane} />
            <PixelBlock x={1} y={16} width={3} height={2} color={lionManeDark} />
            
            {/* Combat effects for attack */}
            {isAttacking && (
                <>
                    <PixelBlock x={4} y={22} width={2} height={0.5} color={'#ffff00'} />
                    <PixelBlock x={3} y={23} width={3} height={0.5} color={'#ffff00'} />
                    <PixelBlock x={5} y={27} width={1} height={1} color={'#ff6600'} />
                </>
            )}
            
            {/* Realistic shadow */}
            <ellipse cx={20} cy={33} rx={12} ry={3} fill="rgba(0,0,0,0.3)" />
        </g>
    );
};

const TigerSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const tigerOrange = '#FF8C00';
    const tigerWhite = '#FFF8DC';
    const blackStripes = '#000000';
    const eyeColor = '#00CED1';
    const noseColor = '#FF69B4';
    const clawColor = '#F5F5DC';
    const shadowColor = '#CD853F';
    
    const isAttacking = animation === 'attacking' || animation === 'special';
    
    return (
        <g className={isAttacking ? 'animate-tiger-strike' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            {/* Head with tiger features */}
            <PixelBlock x={22} y={10} width={10} height={8} color={tigerOrange} />
            <PixelBlock x={23} y={11} width={8} height={6} color={tigerWhite} />
            
            {/* Distinctive tiger ears */}
            <PixelBlock x={22} y={8} width={3} height={3} color={tigerOrange} />
            <PixelBlock x={29} y={8} width={3} height={3} color={tigerOrange} />
            <PixelBlock x={22.5} y={8.5} width={2} height={2} color={tigerWhite} />
            <PixelBlock x={29.5} y={8.5} width={2} height={2} color={tigerWhite} />
            
            {/* Snout */}
            <PixelBlock x={32} y={13} width={3} height={3} color={tigerWhite} />
            <PixelBlock x={33} y={14} width={1} height={1} color={noseColor} />
            
            {/* Piercing tiger eyes */}
            <PixelBlock x={25} y={12} width={2} height={2} color={eyeColor} />
            <PixelBlock x={28} y={12} width={2} height={2} color={eyeColor} />
            <PixelBlock x={25.5} y={12.5} width={1} height={1} color={blackStripes} />
            <PixelBlock x={28.5} y={12.5} width={1} height={1} color={blackStripes} />
            
            {/* Powerful body */}
            <PixelBlock x={14} y={18} width={18} height={10} color={tigerOrange} />
            <PixelBlock x={15} y={19} width={16} height={8} color={tigerWhite} />
            
            {/* Signature tiger stripes */}
            <PixelBlock x={16} y={19} width={1} height={8} color={blackStripes} />
            <PixelBlock x={19} y={18} width={1} height={9} color={blackStripes} />
            <PixelBlock x={22} y={19} width={1} height={8} color={blackStripes} />
            <PixelBlock x={25} y={18} width={1} height={9} color={blackStripes} />
            <PixelBlock x={28} y={19} width={1} height={8} color={blackStripes} />
            
            {/* Head stripes */}
            <PixelBlock x={24} y={11} width={1} height={3} color={blackStripes} />
            <PixelBlock x={27} y={10} width={1} height={4} color={blackStripes} />
            <PixelBlock x={30} y={11} width={1} height={3} color={blackStripes} />
            
            {/* Front legs with striking motion */}
            {isAttacking ? (
                <>
                    {/* Striking front legs */}
                    <PixelBlock x={10} y={22} width={4} height={6} color={tigerOrange} />
                    <PixelBlock x={8} y={26} width={2} height={4} color={tigerOrange} />
                    <PixelBlock x={7} y={29} width={4} height={1} color={clawColor} />
                    
                    <PixelBlock x={32} y={20} width={4} height={8} color={tigerOrange} />
                    <PixelBlock x={34} y={27} width={3} height={1} color={clawColor} />
                </>
            ) : (
                <>
                    {/* Normal front legs */}
                    <PixelBlock x={16} y={28} width={3} height={6} color={tigerOrange} />
                    <PixelBlock x={26} y={28} width={3} height={6} color={tigerOrange} />
                    <PixelBlock x={16} y={33} width={3} height={1} color={shadowColor} />
                    <PixelBlock x={26} y={33} width={3} height={1} color={shadowColor} />
                </>
            )}
            
            {/* Back legs */}
            <PixelBlock x={18} y={28} width={3} height={6} color={tigerOrange} />
            <PixelBlock x={23} y={28} width={3} height={6} color={tigerOrange} />
            <PixelBlock x={18} y={33} width={3} height={1} color={shadowColor} />
            <PixelBlock x={23} y={33} width={3} height={1} color={shadowColor} />
            
            {/* Long powerful tail */}
            <PixelBlock x={6} y={22} width={8} height={2} color={tigerOrange} />
            <PixelBlock x={3} y={20} width={5} height={2} color={tigerOrange} />
            <PixelBlock x={1} y={18} width={4} height={2} color={tigerOrange} />
            {/* Tail stripes */}
            <PixelBlock x={4} y={21} width={1} height={1} color={blackStripes} />
            <PixelBlock x={7} y={21} width={1} height={1} color={blackStripes} />
            <PixelBlock x={2} y={19} width={1} height={1} color={blackStripes} />
            
            {/* Attack effects */}
            {isAttacking && (
                <>
                    <PixelBlock x={6} y={24} width={2} height={0.5} color={'#ffff00'} />
                    <PixelBlock x={5} y={25} width={3} height={0.5} color={'#ffff00'} />
                    <PixelBlock x={7} y={30} width={1} height={1} color={'#ff6600'} />
                </>
            )}
            
            {/* Enhanced two-layer shadow system */}
            {/* Ground contact shadow - directly under paws */}
            <ellipse cx={22} cy={32} rx={16} ry={3} fill="rgba(0,0,0,0.4)" />
            {/* Ambient shadow - larger, softer */}
            <ellipse cx={22} cy={33} rx={20} ry={5} fill="rgba(0,0,0,0.2)" />
        </g>
    );
};

const LeopardSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const leopardGold = '#FFD700';
    const leopardTan = '#DEB887';
    const leopardWhite = '#FFF8DC';
    const blackSpots = '#2F4F4F';
    const darkSpots = '#1C1C1C';
    const eyeColor = '#32CD32';
    const noseColor = '#FF69B4';
    const clawColor = '#F5F5DC';
    const shadowColor = '#BDB76B';
    
    const isAttacking = animation === 'attacking' || animation === 'special';
    
    return (
        <g className={isAttacking ? 'animate-leopard-pounce' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            {/* Head with leopard features */}
            <PixelBlock x={22} y={11} width={9} height={7} color={leopardGold} />
            <PixelBlock x={23} y={12} width={7} height={5} color={leopardTan} />
            
            {/* Rounded ears */}
            <PixelBlock x={22} y={9} width={2} height={3} color={leopardGold} />
            <PixelBlock x={29} y={9} width={2} height={3} color={leopardGold} />
            <PixelBlock x={22.5} y={9.5} width={1} height={2} color={leopardTan} />
            <PixelBlock x={29.5} y={9.5} width={1} height={2} color={leopardTan} />
            
            {/* Snout and nose */}
            <PixelBlock x={31} y={14} width={3} height={2} color={leopardWhite} />
            <PixelBlock x={32} y={15} width={1} height={1} color={noseColor} />
            
            {/* Green cat eyes */}
            <PixelBlock x={25} y={13} width={2} height={1} color={eyeColor} />
            <PixelBlock x={28} y={13} width={2} height={1} color={eyeColor} />
            <PixelBlock x={25.5} y={13} width={1} height={1} color={darkSpots} />
            <PixelBlock x={28.5} y={13} width={1} height={1} color={darkSpots} />
            
            {/* Sleek body */}
            <PixelBlock x={15} y={18} width={16} height={9} color={leopardGold} />
            <PixelBlock x={16} y={19} width={14} height={7} color={leopardTan} />
            <PixelBlock x={17} y={25} width={12} height={2} color={leopardWhite} />
            
            {/* Distinctive leopard rosette spots */}
            {/* Head spots */}
            <PixelBlock x={24} y={12} width={1} height={1} color={blackSpots} />
            <PixelBlock x={26} y={11} width={1} height={1} color={blackSpots} />
            <PixelBlock x={28} y={12} width={1} height={1} color={blackSpots} />
            
            {/* Body rosettes */}
            <PixelBlock x={17} y={19} width={2} height={1} color={blackSpots} />
            <PixelBlock x={16} y={20} width={1} height={1} color={blackSpots} />
            <PixelBlock x={19} y={20} width={1} height={1} color={blackSpots} />
            <PixelBlock x={17} y={21} width={2} height={1} color={blackSpots} />
            
            <PixelBlock x={21} y={20} width={2} height={1} color={blackSpots} />
            <PixelBlock x={20} y={21} width={1} height={1} color={blackSpots} />
            <PixelBlock x={23} y={21} width={1} height={1} color={blackSpots} />
            <PixelBlock x={21} y={22} width={2} height={1} color={blackSpots} />
            
            <PixelBlock x={25} y={19} width={2} height={1} color={blackSpots} />
            <PixelBlock x={24} y={20} width={1} height={1} color={blackSpots} />
            <PixelBlock x={27} y={20} width={1} height={1} color={blackSpots} />
            <PixelBlock x={25} y={21} width={2} height={1} color={blackSpots} />
            
            <PixelBlock x={28} y={22} width={2} height={1} color={blackSpots} />
            <PixelBlock x={27} y={23} width={1} height={1} color={blackSpots} />
            <PixelBlock x={30} y={23} width={1} height={1} color={blackSpots} />
            
            {/* Front legs with pouncing motion */}
            {isAttacking ? (
                <>
                    {/* Pouncing front legs extended */}
                    <PixelBlock x={11} y={20} width={4} height={7} color={leopardGold} />
                    <PixelBlock x={9} y={25} width={2} height={3} color={leopardGold} />
                    <PixelBlock x={8} y={27} width={4} height={1} color={clawColor} />
                    
                    <PixelBlock x={31} y={19} width={4} height={8} color={leopardGold} />
                    <PixelBlock x={33} y={26} width={3} height={1} color={clawColor} />
                </>
            ) : (
                <>
                    {/* Normal front legs */}
                    <PixelBlock x={17} y={27} width={3} height={5} color={leopardGold} />
                    <PixelBlock x={26} y={27} width={3} height={5} color={leopardGold} />
                    <PixelBlock x={17} y={31} width={3} height={1} color={shadowColor} />
                    <PixelBlock x={26} y={31} width={3} height={1} color={shadowColor} />
                </>
            )}
            
            {/* Back legs */}
            <PixelBlock x={19} y={27} width={3} height={5} color={leopardGold} />
            <PixelBlock x={23} y={27} width={3} height={5} color={leopardGold} />
            <PixelBlock x={19} y={31} width={3} height={1} color={shadowColor} />
            <PixelBlock x={23} y={31} width={3} height={1} color={shadowColor} />
            
            {/* Long flexible tail */}
            <PixelBlock x={6} y={21} width={9} height={2} color={leopardGold} />
            <PixelBlock x={3} y={19} width={5} height={2} color={leopardGold} />
            <PixelBlock x={1} y={17} width={4} height={2} color={leopardGold} />
            {/* Tail spots */}
            <PixelBlock x={4} y={20} width={1} height={1} color={blackSpots} />
            <PixelBlock x={7} y={20} width={1} height={1} color={blackSpots} />
            <PixelBlock x={10} y={22} width={1} height={1} color={blackSpots} />
            <PixelBlock x={2} y={18} width={1} height={1} color={blackSpots} />
            
            {/* Attack effects */}
            {isAttacking && (
                <>
                    <PixelBlock x={7} y={23} width={2} height={0.5} color={'#ffff00'} />
                    <PixelBlock x={6} y={24} width={3} height={0.5} color={'#ffff00'} />
                    <PixelBlock x={8} y={28} width={1} height={1} color={'#ff6600'} />
                </>
            )}
            
            {/* Enhanced two-layer shadow system */}
            {/* Ground contact shadow - directly under paws */}
            <ellipse cx={22} cy={31} rx={14} ry={2.5} fill="rgba(0,0,0,0.4)" />
            {/* Ambient shadow - larger, softer */}
            <ellipse cx={22} cy={32} rx={18} ry={4} fill="rgba(0,0,0,0.2)" />
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
    const eagleBrown = '#8B4513';
    const darkBrown = '#654321';
    const lightBrown = '#A0522D';
    const wingBlack = '#2F2F2F';
    const wingTip = '#1C1C1C';
    const beakYellow = '#FFD700';
    const beakBase = '#DAA520';
    const eyeColor = '#8B0000';
    const talonsBlack = '#1C1C1C';
    const whiteFeathers = '#F5F5DC';
    
    const isAttacking = animation === 'attacking' || animation === 'special';
    
    return (
        <g className={isAttacking ? 'animate-eagle-swoop' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            {/* Eagle head with distinctive features */}
            <PixelBlock x={18} y={12} width={6} height={6} color={eagleBrown} />
            <PixelBlock x={19} y={13} width={4} height={4} color={lightBrown} />
            
            {/* Head crest feathers */}
            <PixelBlock x={19} y={10} width={2} height={2} color={darkBrown} />
            <PixelBlock x={21} y={11} width={1} height={2} color={darkBrown} />
            
            {/* Piercing eagle eye */}
            <PixelBlock x={20} y={14} width={2} height={1} color={eyeColor} />
            <PixelBlock x={20.5} y={14} width={1} height={1} color={'#FFFFFF'} />
            
            {/* Sharp hooked beak */}
            <PixelBlock x={23} y={15} width={3} height={2} color={beakYellow} />
            <PixelBlock x={25} y={16} width={1} height={1} color={beakBase} />
            <PixelBlock x={23} y={16} width={2} height={1} color={beakBase} />
            
            {/* Eagle body */}
            <PixelBlock x={16} y={18} width={8} height={6} color={eagleBrown} />
            <PixelBlock x={17} y={19} width={6} height={4} color={lightBrown} />
            <PixelBlock x={18} y={21} width={4} height={2} color={whiteFeathers} />
            
            {/* Magnificent wings - dynamic based on attack */}
            {isAttacking ? (
                <>
                    {/* Wings spread wide for swooping attack */}
                    <PixelBlock x={4} y={16} width={12} height={4} color={wingBlack} />
                    <PixelBlock x={5} y={18} width={10} height={2} color={darkBrown} />
                    <PixelBlock x={2} y={17} width={4} height={2} color={wingTip} />
                    
                    <PixelBlock x={24} y={16} width={12} height={4} color={wingBlack} />
                    <PixelBlock x={25} y={18} width={10} height={2} color={darkBrown} />
                    <PixelBlock x={34} y={17} width={4} height={2} color={wingTip} />
                    
                    {/* Wing feather details */}
                    <PixelBlock x={3} y={18} width={1} height={1} color={whiteFeathers} />
                    <PixelBlock x={6} y={19} width={1} height={1} color={whiteFeathers} />
                    <PixelBlock x={30} y={19} width={1} height={1} color={whiteFeathers} />
                    <PixelBlock x={33} y={18} width={1} height={1} color={whiteFeathers} />
                </>
            ) : (
                <>
                    {/* Folded wings */}
                    <PixelBlock x={12} y={19} width={4} height={5} color={wingBlack} />
                    <PixelBlock x={13} y={20} width={2} height={3} color={darkBrown} />
                    
                    <PixelBlock x={24} y={19} width={4} height={5} color={wingBlack} />
                    <PixelBlock x={25} y={20} width={2} height={3} color={darkBrown} />
                    
                    {/* Wing tips */}
                    <PixelBlock x={11} y={21} width={2} height={2} color={wingTip} />
                    <PixelBlock x={27} y={21} width={2} height={2} color={wingTip} />
                </>
            )}
            
            {/* Powerful talons */}
            <PixelBlock x={18} y={24} width={2} height={3} color={talonsBlack} />
            <PixelBlock x={21} y={24} width={2} height={3} color={talonsBlack} />
            {/* Talon claws */}
            <PixelBlock x={17} y={26} width={1} height={2} color={talonsBlack} />
            <PixelBlock x={19} y={26} width={1} height={2} color={talonsBlack} />
            <PixelBlock x={21} y={26} width={1} height={2} color={talonsBlack} />
            <PixelBlock x={23} y={26} width={1} height={2} color={talonsBlack} />
            
            {/* Tail feathers */}
            <PixelBlock x={19} y={24} width={2} height={4} color={darkBrown} />
            <PixelBlock x={18} y={26} width={4} height={2} color={wingTip} />
            
            {/* Attack effects */}
            {isAttacking && (
                <>
                    <PixelBlock x={1} y={16} width={2} height={0.5} color={'#ffff00'} />
                    <PixelBlock x={37} y={16} width={2} height={0.5} color={'#ffff00'} />
                    <PixelBlock x={25} y={17} width={1} height={1} color={'#ff6600'} />
                </>
            )}
            
            {/* Enhanced two-layer shadow system */}
            {/* Ground contact shadow - directly under talons */}
            <ellipse cx={20} cy={28} rx={10} ry={2} fill="rgba(0,0,0,0.4)" />
            {/* Ambient shadow - larger, softer */}
            <ellipse cx={20} cy={29} rx={12} ry={3} fill="rgba(0,0,0,0.2)" />
        </g>
    );
};

// VERY LARGE ANIMALS
const ElephantSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const elephantGray = '#708090';
    const darkGray = '#2F4F4F';
    const lightGray = '#A9A9A9';
    const tuskWhite = '#F5F5DC';
    const eyeColor = '#8B4513';
    const shadowColor = '#696969';
    const pinkInside = '#FFB6C1';
    
    const isAttacking = animation === 'attacking' || animation === 'special';
    
    return (
        <g className={isAttacking ? 'animate-elephant-stomp' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            {/* Massive body - proper elephant proportions */}
            <PixelBlock x={8} y={16} width={22} height={12} color={elephantGray} />
            <PixelBlock x={9} y={17} width={20} height={10} color={lightGray} />
            <PixelBlock x={10} y={26} width={18} height={2} color={darkGray} />
            
            {/* Large elephant head */}
            <PixelBlock x={24} y={10} width={12} height={10} color={elephantGray} />
            <PixelBlock x={25} y={11} width={10} height={8} color={lightGray} />
            
            {/* Distinctive large ears */}
            <PixelBlock x={22} y={8} width={6} height={8} color={elephantGray} />
            <PixelBlock x={32} y={8} width={6} height={8} color={elephantGray} />
            <PixelBlock x={23} y={9} width={4} height={6} color={pinkInside} />
            <PixelBlock x={33} y={9} width={4} height={6} color={pinkInside} />
            
            {/* Intelligent eye */}
            <PixelBlock x={28} y={13} width={2} height={2} color={eyeColor} />
            <PixelBlock x={28.5} y={13.5} width={1} height={1} color={'#000000'} />
            
            {/* Magnificent ivory tusks */}
            <PixelBlock x={26} y={18} width={2} height={6} color={tuskWhite} />
            <PixelBlock x={30} y={18} width={2} height={6} color={tuskWhite} />
            <PixelBlock x={25} y={22} width={4} height={2} color={tuskWhite} />
            
            {/* Flexible trunk - animated position */}
            {isAttacking ? (
                <>
                    {/* Trunk swinging in attack */}
                    <PixelBlock x={36} y={15} width={3} height={2} color={elephantGray} />
                    <PixelBlock x={38} y={17} width={2} height={3} color={elephantGray} />
                    <PixelBlock x={39} y={20} width={3} height={2} color={elephantGray} />
                    <PixelBlock x={41} y={22} width={2} height={3} color={elephantGray} />
                    <PixelBlock x={42} y={25} width={3} height={2} color={elephantGray} />
                    {/* Trunk tip */}
                    <PixelBlock x={44} y={26} width={2} height={2} color={pinkInside} />
                </>
            ) : (
                <>
                    {/* Relaxed trunk hanging down */}
                    <PixelBlock x={34} y={20} width={3} height={2} color={elephantGray} />
                    <PixelBlock x={35} y={22} width={2} height={3} color={elephantGray} />
                    <PixelBlock x={34} y={25} width={3} height={2} color={elephantGray} />
                    <PixelBlock x={33} y={27} width={2} height={3} color={elephantGray} />
                    <PixelBlock x={32} y={30} width={3} height={2} color={elephantGray} />
                    {/* Trunk tip */}
                    <PixelBlock x={32.5} y={31} width={2} height={2} color={pinkInside} />
                </>
            )}
            
            {/* Powerful legs - tree trunk thick */}
            <PixelBlock x={10} y={28} width={4} height={8} color={elephantGray} />
            <PixelBlock x={15} y={28} width={4} height={8} color={elephantGray} />
            <PixelBlock x={20} y={28} width={4} height={8} color={elephantGray} />
            <PixelBlock x={25} y={28} width={4} height={8} color={elephantGray} />
            
            {/* Leg shadows and feet */}
            <PixelBlock x={10} y={35} width={4} height={2} color={shadowColor} />
            <PixelBlock x={15} y={35} width={4} height={2} color={shadowColor} />
            <PixelBlock x={20} y={35} width={4} height={2} color={shadowColor} />
            <PixelBlock x={25} y={35} width={4} height={2} color={shadowColor} />
            
            {/* Small tail */}
            <PixelBlock x={6} y={20} width={2} height={6} color={elephantGray} />
            <PixelBlock x={5} y={25} width={3} height={1} color={darkGray} />
            
            {/* Attack effects */}
            {isAttacking && (
                <>
                    <PixelBlock x={40} y={23} width={3} height={0.5} color={'#ffff00'} />
                    <PixelBlock x={42} y={24} width={2} height={0.5} color={'#ffff00'} />
                    <PixelBlock x={43} y={27} width={1} height={1} color={'#ff6600'} />
                </>
            )}
            
            {/* Enhanced two-layer shadow system - Extra large for massive elephant */}
            {/* Ground contact shadow - directly under feet */}
            <ellipse cx={20} cy={37} rx={20} ry={3} fill="rgba(0,0,0,0.4)" />
            {/* Ambient shadow - massive, softer */}
            <ellipse cx={20} cy={38} rx={25} ry={5} fill="rgba(0,0,0,0.2)" />
        </g>
    );
};

const RhinocerosSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const rhinoGray = '#708090';
    const darkGray = '#2F4F4F';
    const lightGray = '#A9A9A9';
    const hornColor = '#8B7355';
    const hornTip = '#654321';
    const eyeColor = '#8B4513';
    const shadowColor = '#696969';
    
    const isAttacking = animation === 'attacking' || animation === 'special';
    
    return (
        <g className={isAttacking ? 'animate-rhino-charge' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            {/* Massive rhino body */}
            <PixelBlock x={8} y={18} width={20} height={11} color={rhinoGray} />
            <PixelBlock x={9} y={19} width={18} height={9} color={lightGray} />
            <PixelBlock x={10} y={27} width={16} height={2} color={darkGray} />
            
            {/* Distinctive rhino head shape */}
            <PixelBlock x={24} y={12} width={10} height={8} color={rhinoGray} />
            <PixelBlock x={25} y={13} width={8} height={6} color={lightGray} />
            
            {/* Rhino snout */}
            <PixelBlock x={32} y={16} width={4} height={4} color={rhinoGray} />
            <PixelBlock x={33} y={17} width={2} height={2} color={lightGray} />
            
            {/* Small rhino eye */}
            <PixelBlock x={27} y={14} width={2} height={1} color={eyeColor} />
            <PixelBlock x={27.5} y={14} width={1} height={1} color={'#000000'} />
            
            {/* Iconic rhino horns */}
            <PixelBlock x={33} y={12} width={2} height={4} color={hornColor} />
            <PixelBlock x={33.5} y={10} width={1} height={2} color={hornTip} />
            <PixelBlock x={31} y={14} width={1} height={2} color={hornColor} />
            
            {/* Thick armored skin texture */}
            <PixelBlock x={12} y={20} width={1} height={1} color={darkGray} />
            <PixelBlock x={15} y={21} width={1} height={1} color={darkGray} />
            <PixelBlock x={18} y={20} width={1} height={1} color={darkGray} />
            <PixelBlock x={21} y={22} width={1} height={1} color={darkGray} />
            <PixelBlock x={24} y={21} width={1} height={1} color={darkGray} />
            
            {/* Powerful legs */}
            <PixelBlock x={10} y={29} width={4} height={7} color={rhinoGray} />
            <PixelBlock x={16} y={29} width={4} height={7} color={rhinoGray} />
            <PixelBlock x={20} y={29} width={4} height={7} color={rhinoGray} />
            <PixelBlock x={24} y={29} width={4} height={7} color={rhinoGray} />
            
            {/* Foot pads */}
            <PixelBlock x={10} y={35} width={4} height={2} color={shadowColor} />
            <PixelBlock x={16} y={35} width={4} height={2} color={shadowColor} />
            <PixelBlock x={20} y={35} width={4} height={2} color={shadowColor} />
            <PixelBlock x={24} y={35} width={4} height={2} color={shadowColor} />
            
            {/* Small ears */}
            <PixelBlock x={24} y={11} width={2} height={3} color={rhinoGray} />
            <PixelBlock x={30} y={11} width={2} height={3} color={rhinoGray} />
            
            {/* Short tail */}
            <PixelBlock x={6} y={22} width={2} height={4} color={rhinoGray} />
            <PixelBlock x={5} y={25} width={3} height={1} color={darkGray} />
            
            {/* Charging effect */}
            {isAttacking && (
                <>
                    <PixelBlock x={36} y={15} width={3} height={0.5} color={'#ffff00'} />
                    <PixelBlock x={37} y={16} width={2} height={0.5} color={'#ffff00'} />
                    <PixelBlock x={35} y={17} width={1} height={1} color={'#ff6600'} />
                    {/* Dust cloud */}
                    <PixelBlock x={6} y={30} width={2} height={1} color={'#D2B48C'} />
                    <PixelBlock x={7} y={32} width={3} height={1} color={'#D2B48C'} />
                </>
            )}
            
            {/* Enhanced two-layer shadow system - Large for heavy rhino */}
            {/* Ground contact shadow - directly under feet */}
            <ellipse cx={18} cy={37} rx={18} ry={3} fill="rgba(0,0,0,0.4)" />
            {/* Ambient shadow - larger, softer */}
            <ellipse cx={18} cy={38} rx={22} ry={5} fill="rgba(0,0,0,0.2)" />
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

// COMPANION ANIMALS
const DogSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#8B4513'; const shadow = '#654321'; const collar = '#DC143C'; const nose = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={10} y={18} width={10} height={6} color={color} />
            <PixelBlock x={10} y={23} width={10} height={1} color={shadow} />
            <PixelBlock x={11} y={24} width={3} height={5} color={shadow} />
            <PixelBlock x={16} y={24} width={3} height={5} color={color} />
            <PixelBlock x={20} y={16} width={6} height={5} color={color} />
            <PixelBlock x={26} y={17} width={3} height={3} color={color} />
            <PixelBlock x={28} y={18} width={1} height={1} color={nose} />
            <PixelBlock x={22} y={17} width={1} height={1} color={'#000000'} />
            <PixelBlock x={17} y={18} width={3} height={1} color={collar} />
            <PixelBlock x={20} y={14} width={1} height={2} color={shadow} />
            <PixelBlock x={23} y={14} width={1} height={2} color={shadow} />
            <PixelBlock x={7} y={20} width={3} height={2} color={color} />
            <PixelBlock x={6} y={21} width={1} height={4} color={color} />
        </g>
    );
};

const CatSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#4B4B4B'; const white = '#FFFFFF'; const eye = '#32CD32'; const nose = '#FFB6C1';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={13} y={19} width={7} height={5} color={color} />
            <PixelBlock x={13} y={23} width={7} height={1} color={darken(color, 0.2)} />
            <PixelBlock x={14} y={24} width={2} height={4} color={color} />
            <PixelBlock x={17} y={24} width={2} height={4} color={color} />
            <PixelBlock x={20} y={17} width={4} height={4} color={color} />
            <PixelBlock x={24} y={18} width={2} height={2} color={color} />
            <PixelBlock x={21} y={18} width={1} height={1} color={eye} />
            <PixelBlock x={23} y={18} width={1} height={1} color={eye} />
            <PixelBlock x={22} y={19} width={1} height={1} color={nose} />
            <PixelBlock x={20} y={15} width={1} height={2} color={color} />
            <PixelBlock x={23} y={15} width={1} height={2} color={color} />
            <PixelBlock x={8} y={21} width={5} height={1} color={color} />
            <PixelBlock x={7} y={20} width={1} height={3} color={color} />
            <PixelBlock x={15} y={21} width={3} height={1} color={white} />
        </g>
    );
};

const PigSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#FFB6C1'; const shadow = '#FF69B4'; const snout = '#FF1493'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={9} y={17} width={12} height={7} color={color} />
            <PixelBlock x={9} y={23} width={12} height={1} color={shadow} />
            <PixelBlock x={10} y={24} width={3} height={4} color={shadow} />
            <PixelBlock x={17} y={24} width={3} height={4} color={color} />
            <PixelBlock x={21} y={16} width={5} height={5} color={color} />
            <PixelBlock x={26} y={18} width={3} height={2} color={snout} />
            <PixelBlock x={27} y={18} width={1} height={1} color={'#000000'} />
            <PixelBlock x={27} y={19} width={1} height={1} color={'#000000'} />
            <PixelBlock x={23} y={17} width={1} height={1} color={eye} />
            <PixelBlock x={20} y={14} width={1} height={2} color={color} />
            <PixelBlock x={23} y={14} width={1} height={2} color={color} />
            <PixelBlock x={6} y={19} width={3} height={1} color={color} />
            <PixelBlock x={5} y={18} width={1} height={3} color={color} />
        </g>
    );
};

// REGIONAL PREDATORS
const JaguarSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#FFD700'; const spots = '#000000'; const shadow = '#DAA520'; const eye = '#32CD32';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={6} y={18} width={14} height={6} color={color} />
            <PixelBlock x={6} y={23} width={14} height={1} color={shadow} />
            <PixelBlock x={7} y={24} width={3} height={7} color={shadow} />
            <PixelBlock x={16} y={24} width={3} height={7} color={color} />
            <PixelBlock x={20} y={14} width={8} height={8} color={color} />
            <PixelBlock x={28} y={16} width={4} height={4} color={color} />
            <PixelBlock x={22} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={25} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={8} y={19} width={2} height={2} color={spots} />
            <PixelBlock x={12} y={18} width={2} height={2} color={spots} />
            <PixelBlock x={15} y={20} width={2} height={2} color={spots} />
            <PixelBlock x={22} y={15} width={1} height={1} color={spots} />
            <PixelBlock x={25} y={17} width={1} height={1} color={spots} />
            <PixelBlock x={26} y={15} width={1} height={1} color={spots} />
            <PixelBlock x={4} y={20} width={2} height={3} color={shadow} />
        </g>
    );
};

const PumaSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#D2691E'; const shadow = '#8B4513'; const eye = '#FFD700'; const nose = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={7} y={18} width={12} height={6} color={color} />
            <PixelBlock x={7} y={23} width={12} height={1} color={shadow} />
            <PixelBlock x={8} y={24} width={3} height={6} color={shadow} />
            <PixelBlock x={15} y={24} width={3} height={6} color={color} />
            <PixelBlock x={19} y={15} width={7} height={6} color={color} />
            <PixelBlock x={26} y={17} width={3} height={3} color={color} />
            <PixelBlock x={21} y={17} width={1} height={1} color={eye} />
            <PixelBlock x={24} y={17} width={1} height={1} color={eye} />
            <PixelBlock x={28} y={18} width={1} height={1} color={nose} />
            <PixelBlock x={5} y={20} width={2} height={3} color={shadow} />
            <PixelBlock x={19} y={13} width={1} height={2} color={color} />
            <PixelBlock x={23} y={13} width={1} height={2} color={color} />
        </g>
    );
};

const HyenaSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#8B7355'; const spots = '#4B4B4B'; const shadow = '#5D4E37'; const eye = '#FFD700';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={8} y={16} width={11} height={7} color={color} />
            <PixelBlock x={8} y={22} width={11} height={1} color={shadow} />
            <PixelBlock x={9} y={23} width={3} height={6} color={shadow} />
            <PixelBlock x={15} y={23} width={3} height={6} color={color} />
            <PixelBlock x={19} y={14} width={6} height={6} color={color} />
            <PixelBlock x={25} y={16} width={3} height={3} color={color} />
            <PixelBlock x={21} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={10} y={17} width={2} height={2} color={spots} />
            <PixelBlock x={13} y={18} width={2} height={2} color={spots} />
            <PixelBlock x={16} y={17} width={2} height={2} color={spots} />
            <PixelBlock x={6} y={18} width={2} height={4} color={shadow} />
            <PixelBlock x={7} y={15} width={4} height={3} color={color} />
        </g>
    );
};

const CheetahSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#FFD700'; const spots = '#000000'; const shadow = '#DAA520'; const eye = '#32CD32';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={7} y={18} width={11} height={5} color={color} />
            <PixelBlock x={7} y={22} width={11} height={1} color={shadow} />
            <PixelBlock x={8} y={23} width={2} height={7} color={shadow} />
            <PixelBlock x={15} y={23} width={2} height={7} color={color} />
            <PixelBlock x={18} y={15} width={7} height={5} color={color} />
            <PixelBlock x={25} y={17} width={3} height={2} color={color} />
            <PixelBlock x={20} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={23} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={9} y={19} width={1} height={1} color={spots} />
            <PixelBlock x={11} y={20} width={1} height={1} color={spots} />
            <PixelBlock x={13} y={19} width={1} height={1} color={spots} />
            <PixelBlock x={15} y={20} width={1} height={1} color={spots} />
            <PixelBlock x={20} y={17} width={1} height={2} color={'#000000'} />
            <PixelBlock x={23} y={17} width={1} height={2} color={'#000000'} />
            <PixelBlock x={5} y={20} width={2} height={3} color={shadow} />
        </g>
    );
};

// COMMON DOMESTICS
const DonkeySprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#808080'; const shadow = '#696969'; const eye = '#000000'; const muzzle = '#D3D3D3';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={8} y={16} width={12} height={7} color={color} />
            <PixelBlock x={8} y={22} width={12} height={1} color={shadow} />
            <PixelBlock x={9} y={23} width={3} height={7} color={shadow} />
            <PixelBlock x={16} y={23} width={3} height={7} color={color} />
            <PixelBlock x={20} y={13} width={5} height={7} color={color} />
            <PixelBlock x={25} y={15} width={3} height={3} color={color} />
            <PixelBlock x={27} y={16} width={2} height={2} color={muzzle} />
            <PixelBlock x={26} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={21} y={10} width={1} height={3} color={color} />
            <PixelBlock x={23} y={10} width={1} height={3} color={color} />
            <PixelBlock x={6} y={18} width={2} height={4} color={shadow} />
        </g>
    );
};

const MuleSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#8B4513'; const shadow = '#654321'; const eye = '#000000'; const muzzle = '#D2691E';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={7} y={15} width={13} height={8} color={color} />
            <PixelBlock x={7} y={22} width={13} height={1} color={shadow} />
            <PixelBlock x={8} y={23} width={3} height={8} color={shadow} />
            <PixelBlock x={16} y={23} width={3} height={8} color={color} />
            <PixelBlock x={20} y={12} width={6} height={8} color={color} />
            <PixelBlock x={26} y={14} width={3} height={4} color={color} />
            <PixelBlock x={28} y={15} width={2} height={2} color={muzzle} />
            <PixelBlock x={27} y={15} width={1} height={1} color={eye} />
            <PixelBlock x={21} y={9} width={1} height={3} color={color} />
            <PixelBlock x={24} y={9} width={1} height={3} color={color} />
            <PixelBlock x={5} y={17} width={2} height={5} color={shadow} />
        </g>
    );
};

const DuckSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#FFFFFF'; const beak = '#FFA500'; const feet = '#FF6347'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-waddle' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={13} y={18} width={6} height={5} color={color} />
            <PixelBlock x={14} y={23} width={2} height={3} color={feet} />
            <PixelBlock x={16} y={23} width={2} height={3} color={feet} />
            <PixelBlock x={19} y={16} width={4} height={4} color={color} />
            <PixelBlock x={23} y={17} width={2} height={2} color={beak} />
            <PixelBlock x={21} y={17} width={1} height={1} color={eye} />
            <PixelBlock x={11} y={19} width={2} height={3} color={'#E5E5E5'} />
            <PixelBlock x={10} y={20} width={1} height={2} color={'#E5E5E5'} />
        </g>
    );
};

// AFRICAN MEGAFAUNA
const WarthogSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#8B7355'; const shadow = '#5D4E37'; const tusk = '#F5F5DC'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={8} y={18} width={11} height={6} color={color} />
            <PixelBlock x={8} y={23} width={11} height={1} color={shadow} />
            <PixelBlock x={9} y={24} width={3} height={5} color={shadow} />
            <PixelBlock x={15} y={24} width={3} height={5} color={color} />
            <PixelBlock x={19} y={16} width={6} height={5} color={color} />
            <PixelBlock x={25} y={17} width={3} height={3} color={color} />
            <PixelBlock x={26} y={20} width={2} height={1} color={tusk} />
            <PixelBlock x={23} y={17} width={1} height={1} color={eye} />
            <PixelBlock x={19} y={14} width={2} height={2} color={color} />
            <PixelBlock x={5} y={19} width={3} height={2} color={shadow} />
        </g>
    );
};

const WildebeestSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#4B4B4B'; const shadow = '#2F2F2F'; const horn = '#D3D3D3'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={6} y={16} width={14} height={7} color={color} />
            <PixelBlock x={6} y={22} width={14} height={1} color={shadow} />
            <PixelBlock x={7} y={23} width={3} height={7} color={shadow} />
            <PixelBlock x={16} y={23} width={3} height={7} color={color} />
            <PixelBlock x={20} y={14} width={7} height={6} color={color} />
            <PixelBlock x={27} y={16} width={3} height={3} color={color} />
            <PixelBlock x={22} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={21} y={12} width={1} height={2} color={horn} />
            <PixelBlock x={24} y={12} width={1} height={2} color={horn} />
            <PixelBlock x={20} y={11} width={1} height={1} color={horn} />
            <PixelBlock x={25} y={11} width={1} height={1} color={horn} />
        </g>
    );
};

const BaboonSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#8B7355'; const face = '#FFB6C1'; const shadow = '#5D4E37'; const eye = '#000000';
    const snout = '#D4A5A5'; const darkFur = '#6B5D4F';
    
    return (
        <g className={animation === 'attacking' ? 'animate-primate-attack' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            {/* Body - more defined with hunched posture */}
            <PixelBlock x={8} y={16} width={12} height={8} color={color} />
            <PixelBlock x={9} y={15} width={10} height={2} color={darkFur} />
            <PixelBlock x={8} y={23} width={12} height={1} color={shadow} />
            
            {/* Muscular arms */}
            <PixelBlock x={5} y={17} width={4} height={6} color={color} />
            <PixelBlock x={4} y={22} width={5} height={2} color={darkFur} />
            <PixelBlock x={3} y={23} width={6} height={3} color={shadow} />
            <PixelBlock x={4} y={25} width={4} height={2} color={face} /> {/* Hand */}
            
            <PixelBlock x={19} y={17} width={4} height={6} color={color} />
            <PixelBlock x={18} y={22} width={5} height={2} color={darkFur} />
            <PixelBlock x={19} y={23} width={4} height={3} color={shadow} />
            <PixelBlock x={20} y={25} width={3} height={2} color={face} /> {/* Hand */}
            
            {/* Legs - more primate-like */}
            <PixelBlock x={10} y={23} width={3} height={5} color={shadow} />
            <PixelBlock x={9} y={27} width={4} height={2} color={darkFur} />
            
            <PixelBlock x={15} y={23} width={3} height={5} color={color} />
            <PixelBlock x={14} y={27} width={4} height={2} color={darkFur} />
            
            {/* Head with distinctive baboon features */}
            <PixelBlock x={20} y={13} width={7} height={7} color={color} />
            <PixelBlock x={27} y={14} width={4} height={5} color={face} /> {/* Snout */}
            <PixelBlock x={30} y={15} width={2} height={3} color={snout} />
            <PixelBlock x={22} y={15} width={1} height={1} color={eye} />
            <PixelBlock x={24} y={15} width={1} height={1} color={eye} />
            <PixelBlock x={29} y={16} width={1} height={1} color={'#000'} /> {/* Nostril */}
            
            {/* Distinctive baboon butt */}
            <PixelBlock x={6} y={20} width={3} height={3} color={'#FF69B4'} />
            
            {/* Tail */}
            <PixelBlock x={3} y={19} width={4} height={1} color={color} />
            <PixelBlock x={2} y={18} width={2} height={2} color={darkFur} />
            
            {animation === 'attacking' && (
                <>
                    {/* Open mouth with teeth */}
                    <PixelBlock x={28} y={17} width={3} height={1} color={'#FFFFFF'} />
                    <PixelBlock x={29} y={18} width={2} height={1} color={'#8B0000'} />
                </>
            )}
        </g>
    );
};

const AntelopeSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#D2691E'; const white = '#FFFFFF'; const shadow = '#8B4513'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={8} y={17} width={10} height={5} color={color} />
            <PixelBlock x={8} y={21} width={10} height={1} color={shadow} />
            <PixelBlock x={9} y={22} width={2} height={7} color={shadow} />
            <PixelBlock x={15} y={22} width={2} height={7} color={color} />
            <PixelBlock x={18} y={15} width={6} height={5} color={color} />
            <PixelBlock x={24} y={16} width={3} height={3} color={color} />
            <PixelBlock x={21} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={19} y={12} width={1} height={3} color={'#2F2F2F'} />
            <PixelBlock x={22} y={12} width={1} height={3} color={'#2F2F2F'} />
            <PixelBlock x={13} y={19} width={3} height={2} color={white} />
        </g>
    );
};

// ASIAN ANIMALS
const WaterBuffaloSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#2F2F2F'; const shadow = '#1A1A1A'; const horn = '#D3D3D3'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={5} y={15} width={15} height={8} color={color} />
            <PixelBlock x={5} y={22} width={15} height={1} color={shadow} />
            <PixelBlock x={6} y={23} width={3} height={8} color={shadow} />
            <PixelBlock x={16} y={23} width={3} height={8} color={color} />
            <PixelBlock x={20} y={13} width={8} height={7} color={color} />
            <PixelBlock x={28} y={15} width={3} height={4} color={color} />
            <PixelBlock x={23} y={15} width={1} height={1} color={eye} />
            <PixelBlock x={19} y={11} width={3} height={2} color={horn} />
            <PixelBlock x={25} y={11} width={3} height={2} color={horn} />
            <PixelBlock x={18} y={10} width={1} height={1} color={horn} />
            <PixelBlock x={28} y={10} width={1} height={1} color={horn} />
        </g>
    );
};

const YakSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#4B2F20'; const fur = '#8B4513'; const horn = '#F5F5DC'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={6} y={14} width={14} height={9} color={color} />
            <PixelBlock x={6} y={22} width={14} height={1} color={darken(color, 0.2)} />
            <PixelBlock x={7} y={23} width={3} height={8} color={fur} />
            <PixelBlock x={16} y={23} width={3} height={8} color={fur} />
            <PixelBlock x={20} y={12} width={7} height={8} color={color} />
            <PixelBlock x={27} y={14} width={3} height={4} color={color} />
            <PixelBlock x={22} y={14} width={1} height={1} color={eye} />
            <PixelBlock x={20} y={10} width={2} height={2} color={horn} />
            <PixelBlock x={24} y={10} width={2} height={2} color={horn} />
            <PixelBlock x={5} y={18} width={16} height={5} color={fur} />
        </g>
    );
};

const GaurSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#1A1A1A'; const shadow = '#000000'; const horn = '#FFFFFF'; const eye = '#8B4513';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={5} y={14} width={16} height={9} color={color} />
            <PixelBlock x={5} y={22} width={16} height={1} color={shadow} />
            <PixelBlock x={6} y={23} width={3} height={8} color={shadow} />
            <PixelBlock x={17} y={23} width={3} height={8} color={color} />
            <PixelBlock x={21} y={12} width={8} height={8} color={color} />
            <PixelBlock x={29} y={14} width={3} height={4} color={color} />
            <PixelBlock x={24} y={14} width={1} height={1} color={eye} />
            <PixelBlock x={22} y={10} width={2} height={2} color={horn} />
            <PixelBlock x={26} y={10} width={2} height={2} color={horn} />
        </g>
    );
};

const OrangutanSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#D2691E'; const shadow = '#8B4513'; const face = '#FFB6C1'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={9} y={16} width={10} height={7} color={color} />
            <PixelBlock x={9} y={22} width={10} height={1} color={shadow} />
            <PixelBlock x={10} y={23} width={3} height={5} color={color} />
            <PixelBlock x={15} y={23} width={3} height={5} color={color} />
            <PixelBlock x={19} y={14} width={6} height={6} color={color} />
            <PixelBlock x={21} y={15} width={3} height={3} color={face} />
            <PixelBlock x={22} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={5} y={17} width={4} height={5} color={color} />
            <PixelBlock x={19} y={17} width={4} height={5} color={color} />
            <PixelBlock x={11} y={13} width={4} height={3} color={color} />
        </g>
    );
};

const TapirSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#4B4B4B'; const white = '#FFFFFF'; const shadow = '#2F2F2F'; const nose = '#FFB6C1';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={8} y={17} width={12} height={6} color={color} />
            <PixelBlock x={8} y={22} width={12} height={1} color={shadow} />
            <PixelBlock x={9} y={23} width={3} height={6} color={shadow} />
            <PixelBlock x={16} y={23} width={3} height={6} color={color} />
            <PixelBlock x={20} y={16} width={5} height={5} color={color} />
            <PixelBlock x={25} y={17} width={3} height={2} color={nose} />
            <PixelBlock x={28} y={18} width={1} height={2} color={nose} />
            <PixelBlock x={22} y={17} width={1} height={1} color={'#000000'} />
            <PixelBlock x={13} y={18} width={4} height={2} color={white} />
        </g>
    );
};

// AMERICAN WILDLIFE
const CaribouSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#8B7355'; const white = '#F5F5DC'; const antler = '#D3D3D3'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={7} y={16} width={12} height={7} color={color} />
            <PixelBlock x={7} y={22} width={12} height={1} color={darken(color, 0.2)} />
            <PixelBlock x={8} y={23} width={3} height={7} color={darken(color, 0.2)} />
            <PixelBlock x={15} y={23} width={3} height={7} color={color} />
            <PixelBlock x={19} y={14} width={7} height={6} color={color} />
            <PixelBlock x={26} y={15} width={3} height={3} color={color} />
            <PixelBlock x={21} y={15} width={1} height={1} color={eye} />
            <PixelBlock x={18} y={10} width={1} height={4} color={antler} />
            <PixelBlock x={24} y={10} width={1} height={4} color={antler} />
            <PixelBlock x={16} y={9} width={5} height={1} color={antler} />
            <PixelBlock x={25} y={9} width={5} height={1} color={antler} />
            <PixelBlock x={12} y={20} width={4} height={2} color={white} />
        </g>
    );
};

const ElkSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#8B4513'; const shadow = '#654321'; const antler = '#D2B48C'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={6} y={15} width={13} height={8} color={color} />
            <PixelBlock x={6} y={22} width={13} height={1} color={shadow} />
            <PixelBlock x={7} y={23} width={3} height={8} color={shadow} />
            <PixelBlock x={15} y={23} width={3} height={8} color={color} />
            <PixelBlock x={19} y={13} width={7} height={7} color={color} />
            <PixelBlock x={26} y={14} width={3} height={4} color={color} />
            <PixelBlock x={21} y={14} width={1} height={1} color={eye} />
            <PixelBlock x={19} y={9} width={1} height={4} color={antler} />
            <PixelBlock x={23} y={9} width={1} height={4} color={antler} />
            <PixelBlock x={17} y={8} width={8} height={1} color={antler} />
            <PixelBlock x={16} y={10} width={1} height={1} color={antler} />
            <PixelBlock x={26} y={10} width={1} height={1} color={antler} />
        </g>
    );
};

const PeccarySprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#4B4B4B'; const shadow = '#2F2F2F'; const snout = '#FFB6C1'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={10} y={18} width={9} height={5} color={color} />
            <PixelBlock x={10} y={22} width={9} height={1} color={shadow} />
            <PixelBlock x={11} y={23} width={2} height={5} color={shadow} />
            <PixelBlock x={16} y={23} width={2} height={5} color={color} />
            <PixelBlock x={19} y={17} width={5} height={4} color={color} />
            <PixelBlock x={24} y={18} width={2} height={2} color={snout} />
            <PixelBlock x={21} y={18} width={1} height={1} color={eye} />
            <PixelBlock x={8} y={19} width={2} height={2} color={color} />
        </g>
    );
};

// ARCTIC SPECIALISTS
const MuskOxSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#4B2F20'; const fur = '#8B4513'; const horn = '#F5F5DC'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={5} y={14} width={16} height={9} color={color} />
            <PixelBlock x={5} y={22} width={16} height={1} color={darken(color, 0.3)} />
            <PixelBlock x={6} y={23} width={3} height={8} color={fur} />
            <PixelBlock x={17} y={23} width={3} height={8} color={fur} />
            <PixelBlock x={21} y={12} width={8} height={8} color={color} />
            <PixelBlock x={29} y={14} width={3} height={4} color={color} />
            <PixelBlock x={24} y={14} width={1} height={1} color={eye} />
            <PixelBlock x={20} y={10} width={3} height={2} color={horn} />
            <PixelBlock x={26} y={10} width={3} height={2} color={horn} />
            <PixelBlock x={19} y={11} width={1} height={1} color={horn} />
            <PixelBlock x={29} y={11} width={1} height={1} color={horn} />
            <PixelBlock x={4} y={17} width={18} height={6} color={fur} />
        </g>
    );
};

const WalrusSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#8B7355'; const shadow = '#5D4E37'; const tusk = '#FFFAF0'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-waddle' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={6} y={16} width={18} height={8} color={color} />
            <PixelBlock x={6} y={23} width={18} height={1} color={shadow} />
            <PixelBlock x={8} y={24} width={4} height={4} color={shadow} />
            <PixelBlock x={18} y={24} width={4} height={4} color={color} />
            <PixelBlock x={24} y={15} width={5} height={6} color={color} />
            <PixelBlock x={26} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={25} y={21} width={1} height={3} color={tusk} />
            <PixelBlock x={27} y={21} width={1} height={3} color={tusk} />
            <PixelBlock x={29} y={17} width={2} height={3} color={shadow} />
        </g>
    );
};

// MOUNTAIN SPECIALIST
const IbexSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#8B7355'; const white = '#F5F5DC'; const horn = '#4B4B4B'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={9} y={17} width={10} height={6} color={color} />
            <PixelBlock x={9} y={22} width={10} height={1} color={darken(color, 0.2)} />
            <PixelBlock x={10} y={23} width={2} height={7} color={darken(color, 0.2)} />
            <PixelBlock x={16} y={23} width={2} height={7} color={color} />
            <PixelBlock x={19} y={15} width={6} height={5} color={color} />
            <PixelBlock x={25} y={16} width={3} height={3} color={color} />
            <PixelBlock x={21} y={16} width={1} height={1} color={eye} />
            <PixelBlock x={20} y={11} width={1} height={4} color={horn} />
            <PixelBlock x={23} y={11} width={1} height={4} color={horn} />
            <PixelBlock x={19} y={10} width={1} height={1} color={horn} />
            <PixelBlock x={24} y={10} width={1} height={1} color={horn} />
            <PixelBlock x={14} y={20} width={3} height={2} color={white} />
        </g>
    );
};

// AQUATIC ANIMALS
const FishSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#4682B4'; const fin = '#87CEEB'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-swim' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={10} y={18} width={12} height={4} color={color} />
            <PixelBlock x={22} y={17} width={3} height={6} color={color} />
            <PixelBlock x={12} y={19} width={1} height={1} color={eye} />
            <PixelBlock x={8} y={17} width={2} height={6} color={fin} />
            <PixelBlock x={25} y={16} width={3} height={8} color={fin} />
            <PixelBlock x={14} y={16} width={2} height={1} color={fin} />
            <PixelBlock x={14} y={23} width={2} height={1} color={fin} />
        </g>
    );
};

const JellyfishSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#FFB6C1'; const tentacle = '#FF69B4';
    
    return (
        <g className={animation === 'attacking' ? 'animate-float' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <ellipse cx="16" cy="16" rx="6" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="16" cy="16" rx="4" ry="3" fill={color} opacity="0.5" />
            <PixelBlock x={12} y={20} width={1} height={6} color={tentacle} opacity="0.6" />
            <PixelBlock x={14} y={20} width={1} height={7} color={tentacle} opacity="0.6" />
            <PixelBlock x={16} y={20} width={1} height={8} color={tentacle} opacity="0.6" />
            <PixelBlock x={18} y={20} width={1} height={7} color={tentacle} opacity="0.6" />
            <PixelBlock x={20} y={20} width={1} height={6} color={tentacle} opacity="0.6" />
        </g>
    );
};

const WhaleSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#2F4F4F'; const white = '#F5F5DC'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-swim' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <ellipse cx="15" cy="18" rx="12" ry="6" fill={color} />
            <ellipse cx="15" cy="18" rx="11" ry="5" fill={darken(color, 0.1)} />
            <PixelBlock x={8} y={17} width={1} height={1} color={eye} />
            <PixelBlock x={10} y={22} width={10} height={2} color={white} />
            <PixelBlock x={26} y={16} width={4} height={5} color={color} />
            <PixelBlock x={2} y={16} width={3} height={5} color={color} />
            <PixelBlock x={14} y={12} width={1} height={3} color={'#87CEEB'} opacity="0.5" />
            <PixelBlock x={16} y={11} width={1} height={4} color={'#87CEEB'} opacity="0.5" />
        </g>
    );
};

const FlotsomSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const wood = '#8B4513'; const rope = '#D2B48C';
    
    return (
        <g className={animation === 'attacking' ? 'animate-float' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={8} y={18} width={15} height={2} color={wood} />
            <PixelBlock x={10} y={16} width={10} height={2} color={wood} />
            <PixelBlock x={12} y={20} width={6} height={2} color={wood} />
            <PixelBlock x={8} y={17} width={2} height={1} color={rope} />
            <PixelBlock x={20} y={19} width={2} height={1} color={rope} />
            <PixelBlock x={14} y={15} width={1} height={3} color={rope} />
        </g>
    );
};

// SPECIAL BIRD
const FlamingoSprite: React.FC<{ animation: string }> = ({ animation }) => {
    const color = '#FF69B4'; const leg = '#FFB6C1'; const beak = '#000000'; const eye = '#000000';
    
    return (
        <g className={animation === 'attacking' ? 'animate-walk-forward' : animation === 'damaged' ? 'animate-sprite-damaged' : 'animate-animal-idle'}>
            <PixelBlock x={14} y={14} width={7} height={8} color={color} />
            <PixelBlock x={21} y={12} width={4} height={4} color={color} />
            <PixelBlock x={25} y={13} width={2} height={2} color={beak} />
            <PixelBlock x={23} y={13} width={1} height={1} color={eye} />
            <PixelBlock x={16} y={22} width={1} height={8} color={leg} />
            <PixelBlock x={18} y={22} width={1} height={8} color={leg} />
            <PixelBlock x={11} y={16} width={3} height={4} color={color} />
            <PixelBlock x={10} y={17} width={1} height={2} color={color} />
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

// Cache for PNG availability checks to prevent repeated network requests
const pngAvailabilityCache = new Map<string, boolean>();

const AnimalCombatSprite: React.FC<AnimalCombatSpriteProps> = ({
    animal,
    animation,
    size = 128,
    facing
}) => {
    // PNG image detection state
    const [pngImagePath, setPngImagePath] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);

    // Check for PNG image on mount or when animal changes - with caching
    useEffect(() => {
        const filename = animal.baseId.toLowerCase();
        const cacheKey = filename;

        // Check cache first
        if (pngAvailabilityCache.has(cacheKey)) {
            const isAvailable = pngAvailabilityCache.get(cacheKey);
            if (isAvailable) {
                setPngImagePath(`/animals/${filename}.png`);
                setImageError(false);
            } else {
                setImageError(true);
                setPngImagePath(null);
            }
            return;
        }

        // Not in cache, check for image
        const path = `/animals/${filename}.png`;
        const img = new Image();
        img.onload = () => {
            pngAvailabilityCache.set(cacheKey, true);
            setPngImagePath(path);
            setImageError(false);
        };
        img.onerror = () => {
            pngAvailabilityCache.set(cacheKey, false);
            setImageError(true);
            setPngImagePath(null);
        };
        img.src = path;
    }, [animal.baseId]);

    // Get animation class based on animal type and animation state
    const getAnimationClass = () => {
        const animalType = animal.type?.toLowerCase() || 'domestic';
        const baseId = animal.baseId?.toUpperCase() || '';
        
        // Idle animations based on type
        if (animation === 'idle') {
            if (['LION', 'TIGER', 'LEOPARD', 'JAGUAR', 'CHEETAH', 'COUGAR'].includes(baseId)) return 'animate-prowl';
            if (['EAGLE', 'HAWK', 'OWL', 'VULTURE', 'FALCON'].includes(baseId)) return 'animate-soar';
            if (['ELEPHANT', 'RHINOCEROS', 'HIPPOPOTAMUS'].includes(baseId)) return 'animate-stampede';
            if (['SHARK', 'DOLPHIN', 'WHALE', 'ORCA'].includes(baseId)) return 'animate-swim-attack';
            if (['SNAKE', 'PYTHON', 'COBRA', 'VIPER'].includes(baseId)) return 'animate-slither';
            if (['WOLF', 'HYENA', 'WILD_DOG', 'COYOTE'].includes(baseId)) return 'animate-pack-circle';
            if (['GORILLA', 'CHIMPANZEE', 'ORANGUTAN', 'BABOON', 'MONKEY'].includes(baseId)) return 'animate-swing';
            return '';
        }
        
        // Attack animations
        if (animation === 'attacking' || animation === 'attack') {
            if (animalType === 'predator' || ['LION', 'TIGER', 'LEOPARD'].includes(baseId)) return 'animate-pounce';
            if (animalType === 'bird' || ['EAGLE', 'HAWK', 'OWL'].includes(baseId)) return 'animate-dive';
            if (animalType === 'large herbivore' || ['RHINOCEROS', 'ELEPHANT', 'BISON'].includes(baseId)) return 'animate-charge';
            if (animalType === 'aquatic' || ['SHARK', 'CROCODILE'].includes(baseId)) return 'animate-breach';
            if (animalType === 'venomous' || ['SNAKE', 'SPIDER'].includes(baseId)) return 'animate-strike';
            if (animalType === 'pack' || ['WOLF', 'HYENA'].includes(baseId)) return 'animate-howl';
            if (['GORILLA', 'BEAR'].includes(baseId)) return 'animate-pound';
            return 'animate-fury';
        }
        
        // Special attack animation
        if (animation === 'special') {
            return 'animate-fury';
        }
        
        // Damaged animation
        if (animation === 'damaged') {
            return 'animate-earthquake';
        }

        // Fleeing animation
        if (animation === 'fleeing') {
            if (animalType === 'bird' || ['EAGLE', 'HAWK', 'OWL'].includes(baseId)) return 'animate-fly-away';
            if (['DEER', 'RABBIT', 'HARE', 'ANTELOPE'].includes(baseId)) return 'animate-bound-away';
            if (['FISH', 'SHARK', 'DOLPHIN'].includes(baseId)) return 'animate-swim-away';
            return 'animate-run-away';
        }

        return '';
    };
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
            case 'DUCK': return <DuckSprite animation={animation} />;
            
            // Companion Animals
            case 'DOG': return <DogSprite animation={animation} />;
            case 'CAT': return <CatSprite animation={animation} />;
            case 'PIG': return <PigSprite animation={animation} />;
            
            // Human-sized Animals
            case 'DEER': return <DeerSprite animation={animation} />;
            case 'WOLF': return <WolfSprite animation={animation} />;
            case 'BEAR': return <BearSprite animation={animation} />;
            case 'BOAR': return <BoarSprite animation={animation} />;
            case 'GOAT': return <GoatSprite animation={animation} />;
            case 'WILD_HORSE': return <WildHorseSprite animation={animation} />;
            case 'KANGAROO': return <KangarooSprite animation={animation} />;
            case 'LLAMA': return <LlamaSprite animation={animation} />;
            case 'DONKEY': return <DonkeySprite animation={animation} />;
            case 'MULE': return <MuleSprite animation={animation} />;
            
            // Large Animals
            case 'LION': return <LionSprite animation={animation} />;
            case 'TIGER': return <TigerSprite animation={animation} />;
            case 'LEOPARD': return <LeopardSprite animation={animation} />;
            case 'COW': return <CowSprite animation={animation} />;
            case 'EAGLE': return <EagleSprite animation={animation} />;
            case 'JAGUAR': return <JaguarSprite animation={animation} />;
            case 'PUMA': return <PumaSprite animation={animation} />;
            case 'HYENA': return <HyenaSprite animation={animation} />;
            case 'CHEETAH': return <CheetahSprite animation={animation} />;
            
            // African Wildlife
            case 'WARTHOG': return <WarthogSprite animation={animation} />;
            case 'WILDEBEEST': return <WildebeestSprite animation={animation} />;
            case 'BABOON': return <BaboonSprite animation={animation} />;
            case 'ANTELOPE': return <AntelopeSprite animation={animation} />;
            
            // Asian Animals
            case 'WATER_BUFFALO': return <WaterBuffaloSprite animation={animation} />;
            case 'YAK': return <YakSprite animation={animation} />;
            case 'GAUR': return <GaurSprite animation={animation} />;
            case 'ORANGUTAN': return <OrangutanSprite animation={animation} />;
            case 'TAPIR': return <TapirSprite animation={animation} />;
            
            // American Wildlife
            case 'CARIBOU': return <CaribouSprite animation={animation} />;
            case 'ELK': return <ElkSprite animation={animation} />;
            case 'PECCARY': return <PeccarySprite animation={animation} />;
            
            // Arctic Specialists
            case 'MUSK_OX': return <MuskOxSprite animation={animation} />;
            case 'WALRUS': return <WalrusSprite animation={animation} />;
            
            // Mountain Specialist
            case 'IBEX': return <IbexSprite animation={animation} />;
            
            // Special Birds
            case 'FLAMINGO': return <FlamingoSprite animation={animation} />;
            
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
            case 'FISH': return <FishSprite animation={animation} />;
            case 'JELLYFISH': return <JellyfishSprite animation={animation} />;
            case 'WHALE': return <WhaleSprite animation={animation} />;
            case 'FLOTSAM': return <FlotsomSprite animation={animation} />;
            
            // Reptiles
            case 'SNAKE': return <SnakeSprite animation={animation} />;
            
            // Default fallback
            default: return <WolfSprite animation={animation} />;
        }
    };

    // Priority 1: If PNG image is available, use it
    if (pngImagePath && !imageError) {
        return (
            <div className={getAnimationClass()} style={{
                width: `${size}px`,
                height: `${size}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transformOrigin: 'center center'
            }}>
                <img
                    src={pngImagePath}
                    alt={animal.baseId}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        transform: facing === 'left' ? 'scaleX(1)' : 'scaleX(-1)',
                        filter: animal.type === 'Predator' ? 'drop-shadow(0 0 4px rgba(220, 38, 38, 0.5))' : 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))',
                        imageRendering: 'auto'
                    }}
                    onError={() => {
                        setImageError(true);
                        setPngImagePath(null);
                    }}
                />
            </div>
        );
    }

    // Priority 2: Fall back to emoji if available
    const animalData = ANIMAL_DATA[animal.baseId];
    const emoji = animalData?.emoji || animal.emoji;
    if (emoji) {
        return (
            <div className={getAnimationClass()} style={{
                width: `${size}px`,
                height: `${size}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transformOrigin: 'center center',
                transform: facing === 'left' ? 'scaleX(1)' : 'scaleX(-1)',
            }}>
                <span style={{
                    fontSize: `${size * 0.7}px`,
                    lineHeight: 1,
                    filter: animal.type === 'Predator' ? 'drop-shadow(0 0 4px rgba(220, 38, 38, 0.5))' : 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))',
                }}>
                    {emoji}
                </span>
            </div>
        );
    }

    // Priority 3: Final fallback to pixel art SVG
    return (
        <div className={getAnimationClass()} style={{
            width: `${size}px`,
            height: `${size}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transformOrigin: 'center center'
        }}>
            <svg viewBox="0 0 80 80" width={size} height={size} style={{ imageRendering: 'pixelated' }}>
                <defs>
                    <filter id="predatorGlow">
                        <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#dc2626" floodOpacity="0.3"/>
                    </filter>
                    <filter id="animal-outline" x="-20%" y="-20%" width="140%" height="140%">
                        <feMorphology in="SourceAlpha" result="dilated" operator="dilate" radius="0.3"/>
                        <feFlood floodColor="#1a1a1a" floodOpacity="0.4" result="outlineColor"/>
                        <feComposite in="outlineColor" in2="dilated" operator="in" result="outline"/>
                        <feMerge>
                            <feMergeNode in="outline"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <g style={{
                    filter: animal.type === 'Predator' ? 'url(#animal-outline) url(#predatorGlow)' : 'url(#animal-outline)',
                    transform: facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
                    transformOrigin: 'center'
                }}>
                    {renderSprite()}
                </g>
            </svg>
        </div>
    );
};

export default AnimalCombatSprite;