import React from 'react';
import { NpcEntity } from '../../types';

interface NpcIconProps {
  npc: NpcEntity;
  size: number;
  tileSize: number;
}

const NpcIcon: React.FC<NpcIconProps> = React.memo(({ npc, size, tileSize }) => {
  const { direction, walkFrame, gender } = npc;

  if (!npc.appearance) {
    // Render a fallback or loading state if appearance data is not ready
    return null; 
  }

  const { skinColor, hairColor, build, facialHair, footwear, headgear, height } = npc.appearance;
  const { primary: clothingColor, secondary: secondaryColor, accent: accentColor } = npc.appearance.palette;

  // FIX: Convert absolute height in cm to a relative scaling factor to prevent oversized sprites.
  // The sprite was designed around a baseline height. We scale the size of the sprite
  // relative to how much the character's height deviates from an average.
  const AVG_NPC_HEIGHT_CM = 170;
  // Clamp the scaling factor to a reasonable range (e.g., 0.8x to 1.3x) to prevent extreme sizes.
  const heightScale = Math.min(Math.max(height / AVG_NPC_HEIGHT_CM, 0.8), 1.3);
  
  const actualSize = size * heightScale;
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

  const isBroad = build === 'stocky' || build === 'imposing';
  const bodyWidth = isBroad ? p * 8 : p * 7;
  const shoulderWidth = isBroad ? p * 10 : p * 9;
  
  const renderPolishedSprite = () => {
    const elements: JSX.Element[] = [];
    const yOffset = -bodyBob;

    elements.push(<ellipse key="shadow" cx={0} cy={p * 11} rx={p * 3.5} ry={p} fill="rgba(0,0,0,0.35)" opacity={0.8} />);

    // Legs
    elements.push(
      <rect key="left-leg" x={-p * 2.5 + leftLegX} y={p * 7 + yOffset + leftLegY} width={p * 2.2} height={p * 4.5} fill={secondaryColor} rx={p * 0.3} />,
      <rect key="right-leg" x={p * 0.3 + rightLegX} y={p * 7 + yOffset + rightLegY} width={p * 2.2} height={p * 4.5} fill={secondaryColor} rx={p * 0.3} />
    );

    // Footwear
    if (footwear && footwear.name !== 'bare_feet' && footwear.name !== 'None') {
      const footColor = footwear.material.toLowerCase().includes('leather') || footwear.name.toLowerCase().includes('boots') ? '#654321' : '#8b4513';
      const footHeight = p * 1.5;
      elements.push(
        <rect key="left-foot" x={-p * 2.5 + leftLegX} y={p * (11.5 - footHeight / p) + yOffset + leftLegY} width={p * 2.2} height={footHeight} fill={footColor} rx={p * 0.2} />,
        <rect key="right-foot" x={p * 0.3 + rightLegX} y={p * (11.5 - footHeight / p) + yOffset + rightLegY} width={p * 2.2} height={footHeight} fill={footColor} rx={p * 0.2} />
      );
    }
    
    // Body Garment
    const topColor = clothingColor;
    elements.push(<rect key="tunic-top" x={-bodyWidth / 2} y={p * 3 + yOffset} width={bodyWidth} height={p * 8} fill={topColor} rx={p * 0.2} />);
    
    if (npc.wealthLevel === 'modest' || npc.wealthLevel === 'comfortable') {
      elements.push(<rect key="simple-trim" x={-bodyWidth / 2} y={p * 8.5 + yOffset} width={bodyWidth} height={p * 0.5} fill={accentColor} />);
    }

    // Belt
    const belt = npc.appearance.belt;
    if (belt && belt.name !== 'none' && belt.name !== 'None') {
      const beltY = p * 8 + yOffset;
      const beltColor = belt.material.toLowerCase().includes('gold') ? '#ffd700' : belt.material.toLowerCase().includes('leather') ? '#654321' : '#8b4513';
      elements.push(<rect key="belt" x={-bodyWidth / 2 - p * 0.5} y={beltY} width={bodyWidth + p} height={p * 1.2} fill={beltColor} rx={p * 0.2} />);
    }
    
    // Arms and Hands
    elements.push(
      <rect key="left-arm" x={-shoulderWidth / 2 - p * 1} y={p * 4 + yOffset + leftArmOffset} width={p * 2} height={p * 5} fill={skinColor} rx={p * 0.3} />,
      <rect key="right-arm" x={shoulderWidth / 2 - p} y={p * 4 + yOffset + rightArmOffset} width={p * 2} height={p * 5} fill={skinColor} rx={p * 0.3} />
    );
    
    // Head and Hair
    elements.push(<rect key="head" x={-p * 2.5} y={-p * 1 + yOffset} width={p * 5} height={p * 5} fill={skinColor} rx={p * 0.5} />);
    if (headgear && (headgear.name === 'None' || headgear.name === 'none')) {
      elements.push(<rect key="hair" x={-p * 3} y={-p * 1.5 + yOffset} width={p * 6} height={p * 2.5} fill={hairColor} rx={p * 0.3} />);
    } else {
        const hatColor = belt && (belt.name === 'none' || belt.name === 'None') ? '#a0522d' : belt?.material || '#a0522d';
        elements.push(<ellipse key="hat" cx={0} cy={-p * 1.5 + yOffset} rx={p * 3.5} ry={p * 1.5} fill={hatColor} />)
    }

    // Facial Features
    elements.push(
        <ellipse key="left-eye" cx={-p * 1} cy={p * 1 + yOffset} rx={p * 0.4} ry={p * 0.3} fill="#000" />,
        <ellipse key="right-eye" cx={p * 1} cy={p * 1 + yOffset} rx={p * 0.4} ry={p * 0.3} fill="#000" />
    );

    return elements;
  };
  
  // Check if NPC has a disease
  const hasDiseases = npc.diseaseHealth && npc.diseaseHealth.currentDiseases && npc.diseaseHealth.currentDiseases.length > 0;
  
  return (
    <g transform={`translate(${baseX}, ${baseY})`}>
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
        data-npc-disease={hasDiseases ? npc.diseaseHealth.currentDiseases[0].disease.name : ""}
      />
      
      <g transform={`scale(${direction === 'left' ? -1 : 1}, 1)`} style={{transformBox: 'fill-box', transformOrigin: 'center'}}>
        {renderPolishedSprite()}
      </g>
    </g>
  );
});

export default NpcIcon;