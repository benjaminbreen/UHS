import React from 'react';
import { NpcEntity } from '../../types';

interface NpcIconProps {
  npc: NpcEntity;
  size: number;
  tileSize: number;
  isInteriorMap?: boolean; // Flag to scale up for interior maps
}

// Helper function to adjust color brightness
const adjustColorBrightness = (color: string, percent: number): string => {
  const num = parseInt(color.replace("#",""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
};

const NpcIcon: React.FC<NpcIconProps> = React.memo(({ npc, size, tileSize, isInteriorMap = false }) => {
  const { direction, walkFrame, gender } = npc;

  if (!npc.appearance) {
    // Render a fallback or loading state if appearance data is not ready
    return null; 
  }

  const { skinColor, build, facialHair, footwear, headgear, height, hairLength, facialHairStyle, jewelry, garment, belt } = npc.appearance;
  const { primary: clothingColor, secondary: secondaryColor, accent: accentColor } = npc.appearance.palette;
  
  // Make elderly NPCs have gray hair (matching ProceduralPortrait behavior)
  const isElderly = npc.age >= 60;
  const hairColor = isElderly ? '#808080' : npc.appearance.hairColor;

  // Helper function to categorize headgear
  const categorizeHeadgear = (headgearItem: { name: string; material: string } | null) => {
    if (!headgearItem || headgearItem.name === 'None' || headgearItem.name === 'none') return null;
    
    const name = headgearItem.name.toLowerCase();
    
    // Hair ornaments and jewelry - should be small or invisible
    if (name.includes('passa') || name.includes('tikka') || name.includes('maang') || 
        name.includes('rakhdi') || name.includes('hairpin') || name.includes('hairpiece') ||
        name.includes('comb') || name.includes('flower') || name.includes('garland') ||
        name.includes('ornament') || name.includes('jewel')) {
      return 'ornament';
    }
    
    // Circlets and crowns - thin band
    if (name.includes('circlet') || name.includes('crown') || name.includes('tiara') ||
        name.includes('diadem') || name.includes('coronet')) {
      return 'circlet';
    }
    
    // Turbans - wrapped style
    if (name.includes('turban') || name.includes('pagri') || name.includes('safa')) {
      return 'turban';
    }
    
    // Helmets - metal covering
    if (name.includes('helmet')) {
      return 'helmet';
    }
    
    // Caps and simple hats
    if (name.includes('cap') || name.includes('beret') || name.includes('fez')) {
      return 'cap';
    }
    
    // Default hat shape
    return 'hat';
  };

  // Helper function to categorize garments
  const categorizeGarment = (garmentItem: { name: string; material: string } | null) => {
    if (!garmentItem) return 'tunic';
    
    const name = garmentItem.name.toLowerCase();
    
    // Dresses and gowns - flowing
    if (name.includes('dress') || name.includes('gown') || name.includes('saree') ||
        name.includes('cheongsam') || name.includes('qipao')) {
      return 'dress';
    }
    
    // Robes - loose and long
    if (name.includes('robe') || name.includes('caftan') || name.includes('abaya') ||
        name.includes('toga') || name.includes('kimono') || name.includes('djellaba')) {
      return 'robe';
    }
    
    // Skirts
    if (name.includes('skirt') || name.includes('kilt')) {
      return 'skirt';
    }
    
    // Pants and trousers
    if (name.includes('pants') || name.includes('trousers') || name.includes('breeches') ||
        name.includes('hose') || name.includes('leggings')) {
      return 'pants';
    }
    
    // Default tunic/shirt
    return 'tunic';
  };

  const isFemale = gender === 'Female';
  const headgearType = categorizeHeadgear(headgear);
  const garmentType = categorizeGarment(garment);

  // FIX: Convert absolute height in cm to a relative scaling factor to prevent oversized sprites.
  // The sprite was designed around a baseline height. We scale the size of the sprite
  // relative to how much the character's height deviates from an average.
  const AVG_NPC_HEIGHT_CM = isFemale ? 165 : 175;
  // Clamp the scaling factor to a reasonable range (e.g., 0.8x to 1.3x) to prevent extreme sizes.
  const heightScale = Math.min(Math.max(height / AVG_NPC_HEIGHT_CM, 0.8), 1.3);

  // Base size multiplier - make NPC icons 7-9px tall (slightly larger than original 6-8px)
  const BASE_SCALE = 1.1; // 1.1x makes 6-8px become ~7-9px

  const actualSize = size * heightScale * BASE_SCALE;
  const p = actualSize / 24;

  const walkSpeed = 0.09;
  const walkCycle = walkFrame * walkSpeed;
  
  const leftLegPhase = Math.sin(walkCycle);
  const rightLegPhase = Math.sin(walkCycle + Math.PI);
  
  const legSwingAmount = p * 1.4;
  const armSwingAmount = p * 0.9;
  const bodyBobAmount = p * 0.5;
  
  let leftLegX = 0, rightLegX = 0, leftLegY = 0, rightLegY = 0;
  let leftArmOffset = 0, rightArmOffset = 0;
  
  if (direction === 'right') {
    leftLegX = leftLegPhase * legSwingAmount;
    rightLegX = rightLegPhase * legSwingAmount;
    leftArmOffset = -leftLegPhase * armSwingAmount;
    rightArmOffset = -rightLegPhase * armSwingAmount;
  } else if (direction === 'left') {
    leftLegX = -leftLegPhase * legSwingAmount;
    rightLegX = -rightLegPhase * legSwingAmount;
    leftArmOffset = leftLegPhase * armSwingAmount;
    rightArmOffset = rightLegPhase * armSwingAmount;
  } else if (direction === 'down') {
    leftLegY = leftLegPhase * legSwingAmount * 0.6;
    rightLegY = rightLegPhase * legSwingAmount * 0.6;
    leftArmOffset = leftLegPhase * armSwingAmount * 0.7;
    rightArmOffset = rightLegPhase * armSwingAmount * 0.7;
  } else if (direction === 'up') {
    leftLegY = -leftLegPhase * legSwingAmount * 0.6;
    rightLegY = -rightLegPhase * legSwingAmount * 0.6;
    leftArmOffset = leftLegPhase * armSwingAmount * 0.7;
    rightArmOffset = rightLegPhase * armSwingAmount * 0.7;
  }
  
  const bodyBob = Math.abs(Math.sin(walkCycle * 2)) * bodyBobAmount;
  
  const baseX = tileSize / 2;
  const baseY = tileSize / 2;

  // Better body dimensions based on build and gender - reduced from gorilla-like proportions
  const isBroad = build === 'stocky' || build === 'imposing' || build === 'heavy';
  const isThin = build === 'slight' || build === 'tall';
  const isAthletic = build === 'athletic';
  
  // Gender-aware body proportions - more realistic and less hulking
  let bodyWidth = p * 5.5;  // Reduced from 7
  let shoulderWidth = p * 6.5;  // Reduced from 9
  let hipWidth = p * 5.5;  // Reduced from 7
  let waistWidth = p * 5;  // New: waist for hourglass shapes
  
  if (isFemale) {
    // Female proportions: narrower shoulders, wider hips, defined waist
    bodyWidth = isBroad ? p * 6 : isThin ? p * 4.5 : p * 5;
    shoulderWidth = isBroad ? p * 6 : isThin ? p * 5 : p * 5.5;  // Narrower shoulders
    hipWidth = isBroad ? p * 6.5 : isThin ? p * 5 : p * 5.5;  // Wider hips relative to shoulders
    waistWidth = isBroad ? p * 5.5 : isThin ? p * 4 : p * 4.5;  // Defined waist
  } else {
    // Male proportions: broader shoulders, narrower hips, less waist definition  
    bodyWidth = isBroad ? p * 6.5 : isThin ? p * 5 : p * 5.5;
    shoulderWidth = isBroad ? p * 7.5 : isThin ? p * 6 : p * 6.5;  // Broader shoulders
    hipWidth = isBroad ? p * 6 : isThin ? p * 4.5 : p * 5;  // Narrower hips
    waistWidth = bodyWidth;  // Less waist definition for men
  }
  
  if (isAthletic) {
    shoulderWidth *= 1.05;  // Slightly broader shoulders for athletic build
    bodyWidth *= 0.95;
    if (isFemale) {
      waistWidth *= 0.9;  // More defined waist for athletic women
    }
  }
  
  const renderPolishedSprite = () => {
    const elements: JSX.Element[] = [];
    const yOffset = -bodyBob;

    // Shadow under character
    elements.push(<ellipse key="shadow" cx={0} cy={p * 11} rx={p * 3.5} ry={p} fill="rgba(0,0,0,0.35)" opacity={0.8} />);

    // Render legs based on garment type
    const showLegs = garmentType !== 'dress' && garmentType !== 'robe';
    const legColor = garmentType === 'pants' ? clothingColor : skinColor;
    
    if (showLegs) {
      // Visible legs for pants/skirts/tunics - thinner and more proportional
      const legWidth = isFemale ? p * 1.8 : p * 2;
      elements.push(
        <rect key="left-leg" x={-p * 2 + leftLegX} y={p * 7 + yOffset + leftLegY} width={legWidth} height={p * 4.5} fill={legColor} rx={p * 0.3} />,
        <rect key="left-leg-highlight" x={-p * 2 + leftLegX} y={p * 7 + yOffset + leftLegY} width={legWidth * 0.3} height={p * 4.5} fill="rgba(255,255,255,0.1)" />,
        <rect key="right-leg" x={p * 0.2 + rightLegX} y={p * 7 + yOffset + rightLegY} width={legWidth} height={p * 4.5} fill={legColor} rx={p * 0.3} />,
        <rect key="right-leg-shadow" x={p * 0.2 + rightLegX + legWidth * 0.6} y={p * 7 + yOffset + rightLegY} width={legWidth * 0.3} height={p * 4.5} fill="rgba(0,0,0,0.1)" />
      );
    } else {
      // Hint of movement under dress/robe
      elements.push(
        <rect key="dress-movement" x={-hipWidth / 2 + leftLegX * 0.3} y={p * 9 + yOffset} width={hipWidth} height={p * 2.5} fill={clothingColor} rx={p * 0.5} />
      );
    }

    // Footwear - sized to match leg width
    if (footwear && footwear.name !== 'bare_feet' && footwear.name !== 'None') {
      const footColor = footwear.material.toLowerCase().includes('leather') || footwear.name.toLowerCase().includes('boots') ? '#654321' : '#8b4513';
      const footWidth = isFemale ? p * 1.8 : p * 2;
      elements.push(
        <rect key="left-foot" x={-p * 2 + leftLegX} y={p * 10.5 + yOffset + leftLegY} width={footWidth} height={p * 1} fill={footColor} rx={p * 0.2} />,
        <rect key="right-foot" x={p * 0.2 + rightLegX} y={p * 10.5 + yOffset + rightLegY} width={footWidth} height={p * 1} fill={footColor} rx={p * 0.2} />
      );
    }
    
    // Body/Torso with better shapes for different garment types
    const topColor = clothingColor;

    if (garmentType === 'dress' || garmentType === 'robe') {
      // Flowing garment - tapers from shoulders to hips with waist definition
      if (isFemale) {
        // Female dress with waist definition
        elements.push(
          <rect key="upper-dress" x={-shoulderWidth / 2} y={p * 3 + yOffset} width={shoulderWidth} height={p * 2} fill={topColor} rx={p * 0.2} />,
          <rect key="waist-dress" x={-waistWidth / 2} y={p * 5 + yOffset} width={waistWidth} height={p * 1.5} fill={topColor} rx={p * 0.2} />,
          <rect key="lower-dress" x={-hipWidth / 2} y={p * 6.5 + yOffset} width={hipWidth} height={p * 3} fill={topColor} rx={p * 0.2} />,
          // Shading for depth
          <rect key="dress-highlight" x={-shoulderWidth / 2} y={p * 3 + yOffset} width={shoulderWidth * 0.3} height={p * 6.5} fill="rgba(255,255,255,0.12)" />,
          <rect key="dress-shadow" x={hipWidth / 2 - hipWidth * 0.25} y={p * 4 + yOffset} width={hipWidth * 0.25} height={p * 5.5} fill="rgba(0,0,0,0.12)" />
        );
      } else {
        // Male robe - straighter lines
        elements.push(
          <rect key="upper-robe" x={-shoulderWidth / 2} y={p * 3 + yOffset} width={shoulderWidth} height={p * 3} fill={topColor} rx={p * 0.2} />,
          <rect key="lower-robe" x={-bodyWidth / 2} y={p * 6 + yOffset} width={bodyWidth} height={p * 3.5} fill={topColor} rx={p * 0.2} />,
          // Shading for depth
          <rect key="robe-highlight" x={-shoulderWidth / 2} y={p * 3 + yOffset} width={shoulderWidth * 0.3} height={p * 6.5} fill="rgba(255,255,255,0.12)" />,
          <rect key="robe-shadow" x={bodyWidth / 2 - bodyWidth * 0.25} y={p * 4 + yOffset} width={bodyWidth * 0.25} height={p * 5.5} fill="rgba(0,0,0,0.12)" />
        );
      }
    } else if (garmentType === 'skirt') {
      // Separate top and skirt with female proportions
      elements.push(
        <rect key="shirt-upper" x={-shoulderWidth / 2} y={p * 3 + yOffset} width={shoulderWidth} height={p * 2} fill={topColor} rx={p * 0.2} />,
        <rect key="shirt-waist" x={-waistWidth / 2} y={p * 5 + yOffset} width={waistWidth} height={p * 2} fill={topColor} rx={p * 0.2} />,
        <rect key="skirt" x={-hipWidth / 2} y={p * 7 + yOffset} width={hipWidth} height={p * 2.5} fill={secondaryColor} rx={p * 0.2} />,
        // Shading for depth
        <rect key="skirt-highlight" x={-shoulderWidth / 2} y={p * 3 + yOffset} width={shoulderWidth * 0.3} height={p * 6.5} fill="rgba(255,255,255,0.12)" />,
        <rect key="skirt-shadow" x={hipWidth / 2 - hipWidth * 0.25} y={p * 4 + yOffset} width={hipWidth * 0.25} height={p * 5.5} fill="rgba(0,0,0,0.12)" />
      );
    } else {
      // Tunic or shirt with pants - different shapes for male/female
      if (isFemale) {
        elements.push(
          <rect key="tunic-shoulders" x={-shoulderWidth / 2} y={p * 3 + yOffset} width={shoulderWidth} height={p * 2} fill={topColor} rx={p * 0.2} />,
          <rect key="tunic-waist" x={-waistWidth / 2} y={p * 5 + yOffset} width={waistWidth} height={p * 3} fill={topColor} rx={p * 0.2} />,
          // Shading for depth
          <rect key="tunic-highlight" x={-shoulderWidth / 2} y={p * 3 + yOffset} width={shoulderWidth * 0.3} height={p * 5} fill="rgba(255,255,255,0.12)" />,
          <rect key="tunic-shadow" x={waistWidth / 2 - waistWidth * 0.25} y={p * 4 + yOffset} width={waistWidth * 0.25} height={p * 4} fill="rgba(0,0,0,0.12)" />
        );
      } else {
        elements.push(
          <rect key="tunic-top" x={-shoulderWidth / 2} y={p * 3 + yOffset} width={shoulderWidth} height={p * 2.5} fill={topColor} rx={p * 0.2} />,
          <rect key="tunic-body" x={-bodyWidth / 2} y={p * 5.5 + yOffset} width={bodyWidth} height={p * 2.5} fill={topColor} rx={p * 0.2} />,
          // Shading for depth
          <rect key="tunic-highlight" x={-shoulderWidth / 2} y={p * 3 + yOffset} width={shoulderWidth * 0.3} height={p * 5} fill="rgba(255,255,255,0.12)" />,
          <rect key="tunic-shadow" x={bodyWidth / 2 - bodyWidth * 0.25} y={p * 4 + yOffset} width={bodyWidth * 0.25} height={p * 4} fill="rgba(0,0,0,0.12)" />
        );
      }
    }
    
    // Simple clothing patterns
    if (npc.wealthLevel === 'modest' || npc.wealthLevel === 'comfortable') {
      elements.push(<rect key="simple-trim" x={-bodyWidth / 2} y={p * 6.5 + yOffset} width={bodyWidth} height={p * 0.5} fill={accentColor} />);
    }
    if (garment && garment.material && garment.material.toLowerCase().includes('striped')) {
      elements.push(<rect key="stripe1" x={-bodyWidth / 2} y={p * 4 + yOffset} width={bodyWidth} height={p * 0.3} fill={accentColor} opacity={0.6} />);
      elements.push(<rect key="stripe2" x={-bodyWidth / 2} y={p * 5.5 + yOffset} width={bodyWidth} height={p * 0.3} fill={accentColor} opacity={0.6} />);
    }

    // Belt
    if (belt && belt.name !== 'none' && belt.name !== 'None') {
      const beltColor = belt.material.toLowerCase().includes('gold') ? '#ffd700' : belt.material.toLowerCase().includes('leather') ? '#654321' : '#8b4513';
      const beltY = garmentType === 'dress' || garmentType === 'robe' ? p * 5.8 : p * 6.8; // Higher on dresses
      elements.push(<rect key="belt" x={-bodyWidth / 2 - p * 0.5} y={beltY + yOffset} width={bodyWidth + p} height={p * 0.8} fill={beltColor} rx={p * 0.2} />);
    }
    
    // Arms with sleeves - upper arms covered by clothing
    const armWidth = isFemale ? p * 1.5 : p * 1.8;
    const sleeveLength = p * 2.5; // Halfway down the arm
    
    // Left arm - sleeve then skin
    elements.push(
      <rect key="left-sleeve" x={-shoulderWidth / 2 - p * 0.8} y={p * 3.5 + yOffset + leftArmOffset} width={armWidth} height={sleeveLength} fill={clothingColor} rx={p * 0.3} />,
      <rect key="left-sleeve-highlight" x={-shoulderWidth / 2 - p * 0.8} y={p * 3.5 + yOffset + leftArmOffset} width={armWidth * 0.3} height={sleeveLength} fill="rgba(255,255,255,0.1)" />,
      <rect key="left-forearm" x={-shoulderWidth / 2 - p * 0.8} y={p * 3.5 + sleeveLength + yOffset + leftArmOffset} width={armWidth} height={p * 2.5} fill={skinColor} rx={p * 0.3} />
    );

    // Right arm - sleeve then skin
    elements.push(
      <rect key="right-sleeve" x={shoulderWidth / 2 - p * 0.7} y={p * 3.5 + yOffset + rightArmOffset} width={armWidth} height={sleeveLength} fill={clothingColor} rx={p * 0.3} />,
      <rect key="right-sleeve-shadow" x={shoulderWidth / 2 - p * 0.7 + armWidth * 0.6} y={p * 3.5 + yOffset + rightArmOffset} width={armWidth * 0.3} height={sleeveLength} fill="rgba(0,0,0,0.1)" />,
      <rect key="right-forearm" x={shoulderWidth / 2 - p * 0.7} y={p * 3.5 + sleeveLength + yOffset + rightArmOffset} width={armWidth} height={p * 2.5} fill={skinColor} rx={p * 0.3} />
    );
    
    // Head and Neck - more refined with pixel art curves
    const headWidth = isFemale ? p * 3.8 : p * 4.2;
    const headHeight = isFemale ? p * 4 : p * 4.2;
    const neckWidth = isFemale ? p * 1.5 : p * 1.8;
    
    // Neck
    elements.push(<rect key="neck" x={-neckWidth / 2} y={p * 2 + yOffset} width={neckWidth} height={p * 1.5} fill={skinColor} />);
    
    // Head - use multiple rects to create rounded pixel art appearance
    // Main head block with rounded corners
    elements.push(<rect key="head-main" x={-headWidth / 2 + p * 0.3} y={-p * 1.2 + yOffset} width={headWidth - p * 0.6} height={headHeight - p * 0.6} fill={skinColor} rx={p * 0.8} />);
    
    // Corner pixels for rounding
    elements.push(
      // Top corners
      <rect key="head-top-left" x={-headWidth / 2 + p * 0.6} y={-p * 1.5 + yOffset} width={p * 0.6} height={p * 0.3} fill={skinColor} />,
      <rect key="head-top-right" x={headWidth / 2 - p * 1.2} y={-p * 1.5 + yOffset} width={p * 0.6} height={p * 0.3} fill={skinColor} />,
      // Bottom corners
      <rect key="head-bottom-left" x={-headWidth / 2 + p * 0.6} y={p * 2.2 + yOffset} width={p * 0.6} height={p * 0.3} fill={skinColor} />,
      <rect key="head-bottom-right" x={headWidth / 2 - p * 1.2} y={p * 2.2 + yOffset} width={p * 0.6} height={p * 0.3} fill={skinColor} />,
      // Side pixels
      <rect key="head-left" x={-headWidth / 2} y={-p * 0.9 + yOffset} width={p * 0.3} height={headHeight - p * 1.2} fill={skinColor} />,
      <rect key="head-right" x={headWidth / 2 - p * 0.3} y={-p * 0.9 + yOffset} width={p * 0.3} height={headHeight - p * 1.2} fill={skinColor} />
    );
    
    // Hair - simple shapes that show with headgear
    const hasHat = headgearType && headgearType !== 'ornament' && headgearType !== 'circlet';
    
    if (hairLength !== 'bald') {
      if (hairLength === 'very_short' || hairLength === 'short') {
        // Short hair - adjusted for new head position
        if (!hasHat) {
          elements.push(<rect key="hair" x={-headWidth / 2 - p * 0.2} y={-p * 2 + yOffset} width={headWidth + p * 0.4} height={p * 1.5} fill={hairColor} rx={p * 0.2} />);
        }
        // Small sideburns visible with hat
        if (hasHat) {
          elements.push(<rect key="hair-side-l" x={-headWidth / 2 - p * 0.3} y={-p * 1 + yOffset} width={p * 0.5} height={p * 1} fill={hairColor} />);
          elements.push(<rect key="hair-side-r" x={headWidth / 2 - p * 0.2} y={-p * 1 + yOffset} width={p * 0.5} height={p * 1} fill={hairColor} />);
        }
      } else if (hairLength === 'long' || hairLength === 'very_long') {
        // Long hair - adjusted for new head position
        if (!hasHat) {
          elements.push(<rect key="hair-top" x={-headWidth / 2 - p * 0.5} y={-p * 2 + yOffset} width={headWidth + p} height={p * 2.5} fill={hairColor} rx={p * 0.3} />);
        }
        // Hair flowing down sides (visible with or without hat)
        const longHairWidth = isFemale ? p * 1.2 : p * 1;
        elements.push(<rect key="hair-long-l" x={-headWidth / 2 - p * 0.5} y={p * 0.5 + yOffset} width={longHairWidth} height={p * 3} fill={hairColor} rx={p * 0.2} />);
        elements.push(<rect key="hair-long-r" x={headWidth / 2 - p * 0.5} y={p * 0.5 + yOffset} width={longHairWidth} height={p * 3} fill={hairColor} rx={p * 0.2} />);
      } else {
        // Medium hair (default) - adjusted for new head position
        if (!hasHat) {
          elements.push(<rect key="hair" x={-headWidth / 2 - p * 0.5} y={-p * 2 + yOffset} width={headWidth + p} height={p * 2.5} fill={hairColor} rx={p * 0.3} />);
        } else {
          // Hair visible at sides with hat
          elements.push(<rect key="hair-side-l" x={-headWidth / 2 - p * 0.5} y={-p * 1 + yOffset} width={p * 0.8} height={p * 2} fill={hairColor} rx={p * 0.2} />);
          elements.push(<rect key="hair-side-r" x={headWidth / 2 - p * 0.3} y={-p * 1 + yOffset} width={p * 0.8} height={p * 2} fill={hairColor} rx={p * 0.2} />);
        }
      }
    }
    
    // Headgear - render with pixel art detail
    if (headgearType) {
      const hatColor = headgear.material?.toLowerCase().includes('leather') ? '#8b4513' : 
                       headgear.material?.toLowerCase().includes('gold') ? '#ffd700' : 
                       secondaryColor;
      
      switch(headgearType) {
        case 'ornament':
          // Small jewel or flower - minimal visibility
          if (headgear.name.toLowerCase().includes('flower')) {
            // Small flower on side of head
            elements.push(<ellipse key="flower" cx={p * 2} cy={-p * 1 + yOffset} rx={p * 0.4} ry={p * 0.4} fill="#ff69b4" />);
          } else {
            // Small jewel on forehead
            elements.push(<rect key="jewel" x={-p * 0.3} y={-p * 0.7 + yOffset} width={p * 0.6} height={p * 0.4} fill="#dc143c" />);
          }
          break;
          
        case 'circlet':
          // Thin band with optional jewel
          elements.push(<rect key="circlet-band" x={-p * 2.3} y={-p * 1 + yOffset} width={p * 4.6} height={p * 0.3} fill={hatColor} />);
          if (npc.wealthLevel === 'wealthy' || npc.wealthLevel === 'noble') {
            elements.push(<rect key="circlet-jewel" x={-p * 0.3} y={-p * 1.2 + yOffset} width={p * 0.6} height={p * 0.4} fill="#dc143c" />);
          }
          break;
          
        case 'turban':
          // Wrapped turban shape with pixel detail
          elements.push(
            // Main turban body
            <rect key="turban-base" x={-p * 2.5} y={-p * 2 + yOffset} width={p * 5} height={p * 1.8} fill={hatColor} />,
            // Rounded top using pixels
            <rect key="turban-top1" x={-p * 2} y={-p * 2.5 + yOffset} width={p * 4} height={p * 0.5} fill={hatColor} />,
            <rect key="turban-top2" x={-p * 1.5} y={-p * 2.8 + yOffset} width={p * 3} height={p * 0.3} fill={hatColor} />,
            // Center jewel/ornament
            <rect key="turban-center" x={-p * 0.3} y={-p * 1.5 + yOffset} width={p * 0.6} height={p * 0.5} fill={accentColor} />
          );
          break;
          
        case 'helmet':
          // Metal helmet with pixel art curves
          elements.push(
            // Main helmet body
            <rect key="helmet-main" x={-p * 2.2} y={-p * 1.8 + yOffset} width={p * 4.4} height={p * 2} fill="#a1a1aa" />,
            // Rounded top
            <rect key="helmet-top1" x={-p * 2} y={-p * 2.3 + yOffset} width={p * 4} height={p * 0.5} fill="#a1a1aa" />,
            <rect key="helmet-top2" x={-p * 1.5} y={-p * 2.6 + yOffset} width={p * 3} height={p * 0.3} fill="#a1a1aa" />,
            // Shine/detail
            <rect key="helmet-shine" x={-p * 1.5} y={-p * 2 + yOffset} width={p * 0.8} height={p * 0.4} fill="#e5e7eb" />,
            // Nose guard
            <rect key="helmet-nose" x={-p * 0.2} y={p * 0.2 + yOffset} width={p * 0.4} height={p * 0.8} fill="#a1a1aa" />
          );
          break;
          
        case 'cap':
          // Simple cap with pixel art curves
          elements.push(
            // Main cap body
            <rect key="cap-main" x={-p * 2.2} y={-p * 1.5 + yOffset} width={p * 4.4} height={p * 1.2} fill={hatColor} />,
            // Rounded top
            <rect key="cap-top1" x={-p * 2} y={-p * 2 + yOffset} width={p * 4} height={p * 0.5} fill={hatColor} />,
            <rect key="cap-top2" x={-p * 1.5} y={-p * 2.3 + yOffset} width={p * 3} height={p * 0.3} fill={hatColor} />,
            // Brim/fold
            <rect key="cap-brim" x={-p * 2.3} y={-p * 0.5 + yOffset} width={p * 4.6} height={p * 0.2} fill="rgba(0,0,0,0.2)" />
          );
          break;
          
        case 'hat':
        default:
          // Hat with brim using pixel art style
          elements.push(
            // Crown
            <rect key="hat-crown-main" x={-p * 2} y={-p * 2 + yOffset} width={p * 4} height={p * 1.5} fill={hatColor} />,
            // Crown top pixels
            <rect key="hat-crown-top1" x={-p * 1.8} y={-p * 2.5 + yOffset} width={p * 3.6} height={p * 0.5} fill={hatColor} />,
            <rect key="hat-crown-top2" x={-p * 1.3} y={-p * 2.8 + yOffset} width={p * 2.6} height={p * 0.3} fill={hatColor} />,
            // Brim
            <rect key="hat-brim" x={-p * 3} y={-p * 0.5 + yOffset} width={p * 6} height={p * 0.25} fill={hatColor} />,
            // Band
            <rect key="hat-band" x={-p * 2} y={-p * 0.8 + yOffset} width={p * 4} height={p * 0.3} fill="rgba(0,0,0,0.3)" />
          );
          break;
      }
    }

    // Facial Features - simple pixel art style - adjusted for new head position
    // Eyes - improved with better shape and highlights
    elements.push(
      <ellipse key="left-eye" cx={-p * 0.8} cy={p * 0.5 + yOffset} rx={p * 0.45} ry={p * 0.55} fill="#2a2a2a" />,
      <ellipse key="right-eye" cx={p * 0.8} cy={p * 0.5 + yOffset} rx={p * 0.45} ry={p * 0.55} fill="#2a2a2a" />,
      <circle key="left-eye-highlight" cx={-p * 0.8} cy={p * 0.4 + yOffset} r={p * 0.15} fill="#fff" opacity={0.9} />,
      <circle key="right-eye-highlight" cx={p * 0.8} cy={p * 0.4 + yOffset} r={p * 0.15} fill="#fff" opacity={0.9} />
    );
    
    // Simple nose (just a small mark)
    elements.push(
      <rect key="nose" x={-p * 0.15} y={p * 1 + yOffset} width={p * 0.3} height={p * 0.3} fill="#000" opacity={0.2} />
    );
    
    // Simple mouth
    elements.push(
      <rect key="mouth" x={-p * 0.5} y={p * 1.6 + yOffset} width={p * 1} height={p * 0.15} fill="#000" opacity={0.3} />
    );
    
    // Facial hair - simple shapes - adjusted for new head position
    if (facialHair && gender === 'Male') {
      if (facialHairStyle === 'mustache' || facialHairStyle === 'full_beard') {
        elements.push(<rect key="mustache" x={-p * 1.2} y={p * 1.4 + yOffset} width={p * 2.4} height={p * 0.4} fill={hairColor} />);
      }
      if (facialHairStyle === 'goatee' || facialHairStyle === 'full_beard') {
        elements.push(<rect key="beard" x={-p * 0.8} y={p * 1.8 + yOffset} width={p * 1.6} height={p * 0.8} fill={hairColor} rx={p * 0.2} />);
      }
    }
    
    // Jewelry - adjusted for new proportions
    if (jewelry && jewelry.length > 0) {
      jewelry.forEach((item, idx) => {
        if (item.type === 'necklace') {
          const necklaceColor = item.material === 'gold' ? '#fcd34d' : '#e5e7eb';
          elements.push(<rect key={`necklace-${idx}`} x={-p * 0.8} y={p * 3 + yOffset} width={p * 1.6} height={p * 0.25} fill={necklaceColor} />);
        } else if (item.type === 'earrings') {
          const earringColor = item.material === 'gold' ? '#fcd34d' : '#e5e7eb';
          elements.push(<ellipse key={`earring-l-${idx}`} cx={-p * 2} cy={p * 1 + yOffset} rx={p * 0.25} ry={p * 0.25} fill={earringColor} />);
          elements.push(<ellipse key={`earring-r-${idx}`} cx={p * 2} cy={p * 1 + yOffset} rx={p * 0.25} ry={p * 0.25} fill={earringColor} />);
        }
      });
    }
    
    // Equipped weapon
    if (npc.equippedItems?.main_hand) {
      const weaponName = npc.equippedItems.main_hand.name.toLowerCase();
      if (weaponName.includes('sword') || weaponName.includes('blade')) {
        // Sword at side
        elements.push(<rect key="sword-blade" x={shoulderWidth / 2 + p * 1.5} y={p * 5 + yOffset} width={p * 0.5} height={p * 6} fill="#a1a1aa" />);
        elements.push(<rect key="sword-hilt" x={shoulderWidth / 2 + p * 1.2} y={p * 5 + yOffset} width={p * 1.2} height={p * 0.8} fill="#8b4513" />);
      } else if (weaponName.includes('axe')) {
        // Axe shape
        elements.push(<rect key="axe-handle" x={shoulderWidth / 2 + p * 1.5} y={p * 5 + yOffset} width={p * 0.4} height={p * 5} fill="#8b4513" />);
        elements.push(<rect key="axe-blade" x={shoulderWidth / 2 + p * 1} y={p * 4.5 + yOffset} width={p * 1.5} height={p * 1.5} fill="#a1a1aa" />);
      } else if (weaponName.includes('staff') || weaponName.includes('stick')) {
        // Staff/stick
        elements.push(<rect key="staff" x={shoulderWidth / 2 + p * 1.5} y={p * 3 + yOffset} width={p * 0.6} height={p * 8} fill="#8b4513" />);
      }
    }
    
    // Simple clothing pattern indicators
    if (garment && garment.material) {
      const material = garment.material.toLowerCase();
      if (material.includes('silk') || material.includes('fine')) {
        // Add a small shine dot for fine materials
        elements.push(<ellipse key="shine" cx={0} cy={p * 5 + yOffset} rx={p * 0.3} ry={p * 0.3} fill="rgba(255,255,255,0.5)" />);
      } else if (material.includes('striped')) {
        // Add stripe lines
        elements.push(<rect key="stripe1" x={-bodyWidth / 2} y={p * 4.5 + yOffset} width={bodyWidth} height={p * 0.3} fill={accentColor} opacity={0.7} />);
        elements.push(<rect key="stripe2" x={-bodyWidth / 2} y={p * 6 + yOffset} width={bodyWidth} height={p * 0.3} fill={accentColor} opacity={0.7} />);
      }
    }

    return elements;
  };
  
  // Check if NPC has a disease
  const hasDiseases = npc.health && npc.health.currentDiseases && npc.health.currentDiseases.length > 0;
  
  // Scale factor for interior maps - make icons 3x larger ONLY in interior maps (matching PlayerIcon)
  const ICON_SCALE = isInteriorMap ? 3 : 1;

  return (
    <g transform={`translate(${baseX}, ${baseY}) scale(${ICON_SCALE})`} style={{ shapeRendering: 'geometricPrecision' }}>
      {/* Disease indicator - greenish circle around sick NPCs */}
      {hasDiseases && (
        <circle
          cx={0}
          cy={0}
          r={actualSize * 0.8}
          fill="none"
          stroke="rgba(50, 200, 50, 0.4)"
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.7}
          className="animate-pulse"
        />
      )}
      
      {/* Tooltip trigger area - invisible rect for hover */}
      <rect
        x={-actualSize/2}
        y={-actualSize/2}
        width={actualSize}
        height={actualSize}
        fill="transparent"
        className="npc-hover-area"
        data-npc-id={npc.id}
        data-npc-name={npc.name}
        data-npc-age={npc.age}
        data-npc-gender={npc.gender}
        data-npc-profession={npc.profession}
        data-npc-class={npc.socialClass}
        data-npc-sick={hasDiseases ? "true" : "false"}
        data-npc-disease={hasDiseases ? npc.health.currentDiseases[0].disease.name : ""}
      />
      
      <g transform={`scale(${direction === 'left' ? -1 : 1}, 1)`} style={{transformBox: 'fill-box', transformOrigin: 'center'}}>
        {renderPolishedSprite()}
      </g>
    </g>
  );
});

export default NpcIcon;