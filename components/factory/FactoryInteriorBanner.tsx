/**
 * components/factory/FactoryInteriorBanner.tsx
 * Beautiful pixel-art factory interior banner with animations
 * Canvas-based rendering with factory-specific machinery and atmospheric effects
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HistoricalEra, CulturalZone } from '../../types';
import { FactoryType } from '../../constants/gameData/factoryTypes';

interface FactoryInteriorBannerProps {
  factoryType: FactoryType;
  era: HistoricalEra;
  culturalZone: CulturalZone;
  factoryName: string;
  width: number;
  height: number;
  timeOfDay?: number; // 0-24
  shiftActive?: boolean;
}

/* ========================================================================== */
/* RNG and Utilities                                                          */
/* ========================================================================== */

class RNG {
  private s: number;
  constructor(seed: number) { this.s = (seed || 1) >>> 0; }
  next() {
    let x = this.s;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.s = x >>> 0;
    return (this.s & 0xffffffff) / 0x100000000;
  }
  int(min: number, max: number) { return Math.floor(min + this.next() * (max - min + 1)); }
  range(min: number, max: number) { return min + this.next() * (max - min); }
}

const clamp = (v: number, min = 0, max = 255) => Math.max(min, Math.min(max, v));

/* ========================================================================== */
/* Particle Systems                                                           */
/* ========================================================================== */

class Particle {
  x: number; y: number; vx: number; vy: number; life: number; maxLife: number;

  constructor(x: number, y: number, vx: number, vy: number, life: number) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }

  isDead() { return this.life <= 0; }
  getAlpha() { return this.life / this.maxLife; }
}

class SteamParticle extends Particle {
  size: number;

  constructor(x: number, y: number) {
    super(x, y, (Math.random() - 0.5) * 0.3, -0.3 - Math.random() * 0.5, 80 + Math.random() * 40);
    this.size = 4 + Math.random() * 4;
  }

  update() {
    super.update();
    this.size *= 1.015; // Grows as it rises
    this.vx += (Math.random() - 0.5) * 0.08; // Drifts
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.getAlpha() * 0.5;
    ctx.fillStyle = `rgba(240, 240, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(Math.floor(this.x), Math.floor(this.y), Math.floor(this.size), 0, Math.PI * 2);
    ctx.fill();
  }
}

class SparkParticle extends Particle {
  color: string;

  constructor(x: number, y: number, angle: number) {
    const speed = 2 + Math.random() * 3;
    super(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      15 + Math.random() * 15
    );
    const brightness = 200 + Math.floor(Math.random() * 55);
    this.color = `rgb(${brightness}, ${Math.floor(brightness * 0.6)}, 0)`;
  }

  update() {
    super.update();
    this.vy += 0.15; // Gravity
    this.vx *= 0.98; // Air resistance
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.getAlpha();
    ctx.fillStyle = this.color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(Math.floor(this.x), Math.floor(this.y), 2, 2);
    ctx.globalAlpha = 1;
  }
}

class SmokeParticle extends Particle {
  size: number;
  darkness: number;

  constructor(x: number, y: number, dark: boolean = false) {
    super(x, y, (Math.random() - 0.5) * 0.4, -0.2 - Math.random() * 0.3, 100 + Math.random() * 50);
    this.size = 6 + Math.random() * 6;
    this.darkness = dark ? 0.6 : 0.3;
  }

  update() {
    super.update();
    this.size *= 1.01;
    this.darkness *= 0.99; // Fades to lighter
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.getAlpha() * this.darkness;
    ctx.fillStyle = `rgba(60, 60, 70, ${alpha})`;
    ctx.beginPath();
    ctx.arc(Math.floor(this.x), Math.floor(this.y), Math.floor(this.size), 0, Math.PI * 2);
    ctx.fill();
  }
}

class DustParticle extends Particle {
  size: number;
  rotation: number;
  rotationSpeed: number;

  constructor(x: number, y: number) {
    super(x, y, (Math.random() - 0.5) * 0.1, Math.random() * 0.05, 200 + Math.random() * 100);
    this.size = 1 + Math.random() * 2;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.05;
  }

  update() {
    super.update();
    this.rotation += this.rotationSpeed;
    this.vx += (Math.random() - 0.5) * 0.02; // Gentle float
    this.vy += (Math.random() - 0.5) * 0.02;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = Math.min(this.getAlpha(), 0.4);
    ctx.fillStyle = `rgba(230, 230, 240, ${alpha})`;
    ctx.fillRect(Math.floor(this.x), Math.floor(this.y), 2, 2);
  }
}

/* ========================================================================== */
/* Main Component                                                             */
/* ========================================================================== */

export const FactoryInteriorBanner: React.FC<FactoryInteriorBannerProps> = ({
  factoryType,
  era,
  culturalZone,
  factoryName,
  width,
  height,
  timeOfDay = 12,
  shiftActive = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState(0);
  const particlesRef = useRef<Particle[]>([]);

  // Generate seed from factory name
  const seed = useMemo(() => {
    return factoryName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }, [factoryName]);

  const rng = useMemo(() => new RNG(seed), [seed]);

  // Ambient lighting based on time of day
  const ambientLight = useMemo(() => {
    if (timeOfDay >= 6 && timeOfDay < 18) return 1.0;
    if (timeOfDay >= 18 && timeOfDay < 20) return 0.7;
    return 0.5;
  }, [timeOfDay]);

  // Color palettes for each factory type
  const palette = useMemo(() => {
    const palettes: Record<string, any> = {
      textile_mill: {
        wall: '#8B7355', floor: '#6B5D4F', machine: '#4A4A4A',
        accent: '#CD853F', product: '#F5F5DC', belt: '#654321'
      },
      steel_mill: {
        wall: '#3A3A3A', floor: '#2A2A2A', machine: '#1A1A1A',
        accent: '#FF4500', product: '#C0C0C0', glow: '#FF6347'
      },
      sugar_plantation: {
        wall: '#8B4513', floor: '#654321', machine: '#D2691E',
        accent: '#CD853F', product: '#F5DEB3', fire: '#FF8C00'
      },
      cotton_plantation: {
        wall: '#A0826D', floor: '#8B7355', machine: '#6B5D4F',
        accent: '#8B4513', product: '#FFFAF0', wood: '#7B5D3A'
      },
      railway_workshop: {
        wall: '#5A4A3A', floor: '#4A3A2A', machine: '#2A2A2A',
        accent: '#8B4513', product: '#696969', metal: '#A1A1AA'
      },
      automobile_factory: {
        wall: '#E0E0E0', floor: '#B0B0B0', machine: '#404040',
        accent: '#FFD700', product: '#000080', paint: '#4169E1'
      },
      electronics_factory: {
        wall: '#F0F0F0', floor: '#D0D0D0', machine: '#505050',
        accent: '#00BFFF', product: '#32CD32', circuit: '#2E8B57'
      }
    };
    return palettes[factoryType.id] || palettes.textile_mill;
  }, [factoryType.id]);

  // Animation loop
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      setFrame(f => f + 1);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Render factory scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Factory-specific rendering
    switch (factoryType.id) {
      case 'textile_mill':
        renderTextileMill(ctx, width, height, frame, shiftActive, palette, ambientLight, particlesRef, rng);
        break;
      case 'steel_mill':
        renderSteelMill(ctx, width, height, frame, shiftActive, palette, ambientLight, particlesRef, rng);
        break;
      case 'sugar_plantation':
        renderSugarPlantation(ctx, width, height, frame, shiftActive, palette, ambientLight, particlesRef, rng);
        break;
      case 'cotton_plantation':
        renderCottonPlantation(ctx, width, height, frame, shiftActive, palette, ambientLight, particlesRef, rng);
        break;
      case 'railway_workshop':
        renderRailwayWorkshop(ctx, width, height, frame, shiftActive, palette, ambientLight, particlesRef, rng);
        break;
      case 'automobile_factory':
        renderAutomobileFactory(ctx, width, height, frame, shiftActive, palette, ambientLight, particlesRef, rng);
        break;
      case 'electronics_factory':
        renderElectronicsFactory(ctx, width, height, frame, shiftActive, palette, ambientLight, particlesRef, rng);
        break;
      default:
        renderGenericFactory(ctx, width, height, frame, shiftActive, palette, ambientLight, particlesRef, rng);
    }

    // Update and draw particles
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      if (particles[i].isDead()) {
        particles.splice(i, 1);
      } else {
        particles[i].draw(ctx);
      }
    }

    // Add lighting overlay
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${0.3 - ambientLight * 0.2})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${0.1 - ambientLight * 0.05})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

  }, [frame, width, height, factoryType.id, shiftActive, palette, ambientLight, rng]);

  return (
    <div className="relative w-full" style={{ height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Factory name overlay */}
      <div className="absolute top-3 left-3">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-amber-600/40">
          <div className="text-amber-400 font-bold text-sm">{factoryName}</div>
          <div className="text-slate-400 text-xs">{factoryType.name}</div>
        </div>
      </div>

      {/* Shift status indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700">
        <div className={`w-2 h-2 rounded-full ${shiftActive ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
        <span className="text-xs text-slate-300 font-mono">
          {shiftActive ? 'Shift Active' : 'Idle'}
        </span>
      </div>
    </div>
  );
};

/* ========================================================================== */
/* Factory-Specific Renderers                                                 */
/* ========================================================================== */

function renderTextileMill(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number,
  shiftActive: boolean,
  palette: any,
  ambientLight: number,
  particlesRef: React.MutableRefObject<Particle[]>,
  rng: RNG
) {
  // Background wall with windows
  ctx.fillStyle = palette.wall;
  ctx.globalAlpha = ambientLight * 0.9;
  ctx.fillRect(0, 0, width, height * 0.4);
  ctx.globalAlpha = 1;

  // Windows (if daytime)
  if (ambientLight > 0.7) {
    ctx.fillStyle = '#87CEEB';
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 5; i++) {
      const wx = width * 0.15 + i * (width * 0.15);
      ctx.fillRect(wx, height * 0.08, width * 0.08, height * 0.18);
    }
    ctx.globalAlpha = 1;
  }

  // Floor
  ctx.fillStyle = palette.floor;
  ctx.globalAlpha = ambientLight * 0.85;
  ctx.fillRect(0, height * 0.4, width, height * 0.6);
  ctx.globalAlpha = 1;

  // Power transmission shaft (overhead)
  const shaftY = height * 0.35;
  ctx.fillStyle = palette.machine;
  ctx.fillRect(width * 0.1, shaftY - 4, width * 0.8, 8);

  // Draw power looms
  const loomCount = 5;
  for (let i = 0; i < loomCount; i++) {
    const loomX = width * 0.12 + i * (width * 0.16);
    const loomY = height * 0.55;
    const loomW = width * 0.12;
    const loomH = height * 0.3;

    // Loom body
    ctx.fillStyle = palette.machine;
    ctx.fillRect(loomX, loomY, loomW, loomH);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(loomX, loomY, loomW, loomH);

    // Moving shuttle (if shift active)
    if (shiftActive) {
      const shuttleOffset = (Math.sin(frame * 0.15 + i) + 1) / 2; // 0 to 1
      const shuttleX = loomX + shuttleOffset * loomW * 0.8;
      ctx.fillStyle = palette.accent;
      ctx.fillRect(shuttleX, loomY + loomH * 0.4, loomW * 0.15, loomH * 0.1);

      // Belt connecting to shaft
      ctx.strokeStyle = palette.belt;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(loomX + loomW / 2, shaftY);
      ctx.lineTo(loomX + loomW / 2, loomY);
      ctx.stroke();

      // Occasional cotton lint particles
      if (frame % 30 === 0 && rng.next() < 0.3) {
        particlesRef.current.push(new DustParticle(loomX + rng.range(0, loomW), loomY));
      }
    }

    // Cloth output
    if (shiftActive) {
      ctx.fillStyle = palette.product;
      ctx.fillRect(loomX + loomW - 8, loomY + loomH - 15, 10, 15);
    }
  }

  // Workers (simple pixel art)
  if (shiftActive) {
    for (let i = 0; i < 4; i++) {
      const workerX = width * 0.2 + i * (width * 0.2);
      const workerY = height * 0.75;
      drawWorker(ctx, workerX, workerY, frame, i);
    }
  }
}

function renderSteelMill(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number,
  shiftActive: boolean,
  palette: any,
  ambientLight: number,
  particlesRef: React.MutableRefObject<Particle[]>,
  rng: RNG
) {
  // Dark industrial walls
  ctx.fillStyle = palette.wall;
  ctx.fillRect(0, 0, width, height * 0.4);

  // Dark floor
  ctx.fillStyle = palette.floor;
  ctx.fillRect(0, height * 0.4, width, height * 0.6);

  // Blast furnace
  const furnaceX = width * 0.15;
  const furnaceY = height * 0.2;
  const furnaceW = width * 0.15;
  const furnaceH = height * 0.6;

  ctx.fillStyle = palette.machine;
  ctx.fillRect(furnaceX, furnaceY, furnaceW, furnaceH);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.strokeRect(furnaceX, furnaceY, furnaceW, furnaceH);

  // Glowing furnace opening
  if (shiftActive) {
    const glowIntensity = 0.7 + Math.sin(frame * 0.05) * 0.3;
    const gradient = ctx.createRadialGradient(
      furnaceX + furnaceW / 2, furnaceY + furnaceH * 0.8,
      0,
      furnaceX + furnaceW / 2, furnaceY + furnaceH * 0.8,
      furnaceW * 0.8
    );
    gradient.addColorStop(0, `rgba(255, 150, 0, ${glowIntensity})`);
    gradient.addColorStop(0.5, `rgba(255, 80, 0, ${glowIntensity * 0.6})`);
    gradient.addColorStop(1, 'rgba(255, 40, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(furnaceX - 20, furnaceY, furnaceW + 40, furnaceH);

    // Smoke from chimney
    if (frame % 8 === 0) {
      particlesRef.current.push(new SmokeParticle(furnaceX + furnaceW / 2, furnaceY, true));
    }
  }

  // Ladles with molten metal
  const ladleX = width * 0.45;
  const ladleY = height * 0.5;
  const ladleW = width * 0.08;
  const ladleH = height * 0.15;

  // Suspended ladle
  ctx.strokeStyle = palette.machine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ladleX + ladleW / 2, height * 0.1);
  ctx.lineTo(ladleX + ladleW / 2, ladleY);
  ctx.stroke();

  // Ladle body
  ctx.fillStyle = palette.machine;
  ctx.beginPath();
  ctx.moveTo(ladleX, ladleY);
  ctx.lineTo(ladleX + ladleW, ladleY);
  ctx.lineTo(ladleX + ladleW * 0.9, ladleY + ladleH);
  ctx.lineTo(ladleX + ladleW * 0.1, ladleY + ladleH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Molten metal inside
  if (shiftActive) {
    ctx.fillStyle = palette.glow;
    ctx.beginPath();
    ctx.moveTo(ladleX + 4, ladleY + 8);
    ctx.lineTo(ladleX + ladleW - 4, ladleY + 8);
    ctx.lineTo(ladleX + ladleW * 0.85, ladleY + ladleH - 4);
    ctx.lineTo(ladleX + ladleW * 0.15, ladleY + ladleH - 4);
    ctx.closePath();
    ctx.fill();

    // Glow effect
    const glowGrad = ctx.createRadialGradient(
      ladleX + ladleW / 2, ladleY + ladleH / 2, 0,
      ladleX + ladleW / 2, ladleY + ladleH / 2, ladleW
    );
    glowGrad.addColorStop(0, 'rgba(255, 99, 71, 0.8)');
    glowGrad.addColorStop(1, 'rgba(255, 99, 71, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(ladleX - ladleW, ladleY - ladleH, ladleW * 3, ladleH * 3);
  }

  // Anvil with sparks
  const anvilX = width * 0.7;
  const anvilY = height * 0.7;
  ctx.fillStyle = palette.product;
  ctx.fillRect(anvilX, anvilY, width * 0.06, height * 0.15);
  ctx.fillRect(anvilX - 10, anvilY + height * 0.15, width * 0.06 + 20, height * 0.05);

  // Sparks from hammering
  if (shiftActive && frame % 20 === 0) {
    for (let i = 0; i < 8; i++) {
      const angle = -Math.PI / 3 + (Math.random() - 0.5) * Math.PI / 2;
      particlesRef.current.push(new SparkParticle(anvilX + width * 0.03, anvilY, angle));
    }
  }

  // Workers
  if (shiftActive) {
    drawWorker(ctx, furnaceX + furnaceW + 30, height * 0.75, frame, 0);
    drawWorker(ctx, anvilX - 30, height * 0.75, frame, 1);
    drawWorker(ctx, width * 0.55, height * 0.65, frame, 2);
  }
}

function renderSugarPlantation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number,
  shiftActive: boolean,
  palette: any,
  ambientLight: number,
  particlesRef: React.MutableRefObject<Particle[]>,
  rng: RNG
) {
  // Wooden structure
  ctx.fillStyle = palette.wall;
  ctx.globalAlpha = ambientLight * 0.9;
  ctx.fillRect(0, 0, width, height * 0.3);
  ctx.globalAlpha = 1;

  // Open sides (posts)
  ctx.fillStyle = palette.wall;
  for (let i = 0; i < 6; i++) {
    const postX = width * 0.1 + i * (width * 0.15);
    ctx.fillRect(postX, height * 0.3, 12, height * 0.7);
  }

  // Dirt floor
  ctx.fillStyle = palette.floor;
  ctx.fillRect(0, height * 0.4, width, height * 0.6);

  // Boiling cauldrons in a row
  const cauldronCount = 4;
  for (let i = 0; i < cauldronCount; i++) {
    const cauldronX = width * 0.15 + i * (width * 0.2);
    const cauldronY = height * 0.55;
    const cauldronW = width * 0.12;
    const cauldronH = height * 0.15;

    // Furnace underneath
    if (shiftActive) {
      ctx.fillStyle = palette.fire;
      const fireFlicker = 0.7 + Math.sin(frame * 0.1 + i) * 0.3;
      ctx.globalAlpha = fireFlicker;
      ctx.fillRect(cauldronX - 5, cauldronY + cauldronH, cauldronW + 10, height * 0.08);
      ctx.globalAlpha = 1;
    }

    // Cauldron
    ctx.fillStyle = palette.machine;
    ctx.beginPath();
    ctx.ellipse(cauldronX + cauldronW / 2, cauldronY + cauldronH, cauldronW / 2, cauldronH * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Boiling liquid
    if (shiftActive) {
      const liquidColor = i === 0 ? '#8B6914' : i === 1 ? '#A0724F' : i === 2 ? '#C8A882' : palette.product;
      ctx.fillStyle = liquidColor;
      ctx.beginPath();
      ctx.ellipse(cauldronX + cauldronW / 2, cauldronY + cauldronH * 0.7, cauldronW / 2.5, cauldronH * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Steam rising
      if (frame % 12 === i * 3) {
        particlesRef.current.push(new SteamParticle(cauldronX + cauldronW / 2, cauldronY + cauldronH * 0.5));
      }
    }
  }

  // Cane press on left
  const pressX = width * 0.05;
  const pressY = height * 0.5;
  ctx.fillStyle = palette.machine;
  ctx.fillRect(pressX, pressY, width * 0.08, height * 0.35);

  // Rollers
  for (let i = 0; i < 3; i++) {
    const rollerY = pressY + i * 30 + 20;
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.ellipse(pressX + width * 0.04, rollerY, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();
  }

  // Workers
  if (shiftActive) {
    for (let i = 0; i < 5; i++) {
      const workerX = width * 0.2 + i * (width * 0.18);
      drawWorker(ctx, workerX, height * 0.75, frame, i);
    }
  }
}

function renderCottonPlantation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number,
  shiftActive: boolean,
  palette: any,
  ambientLight: number,
  particlesRef: React.MutableRefObject<Particle[]>,
  rng: RNG
) {
  // Wooden gin house
  ctx.fillStyle = palette.wall;
  ctx.globalAlpha = ambientLight * 0.9;
  ctx.fillRect(0, 0, width, height * 0.35);
  ctx.globalAlpha = 1;

  // Floor
  ctx.fillStyle = palette.floor;
  ctx.fillRect(0, height * 0.4, width, height * 0.6);

  // Cotton gin machine
  const ginX = width * 0.4;
  const ginY = height * 0.45;
  const ginW = width * 0.25;
  const ginH = height * 0.35;

  ctx.fillStyle = palette.machine;
  ctx.fillRect(ginX, ginY, ginW, ginH);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(ginX, ginY, ginW, ginH);

  // Rotating cylinders
  if (shiftActive) {
    const rotation = (frame * 0.1) % (Math.PI * 2);
    for (let i = 0; i < 3; i++) {
      const cylX = ginX + ginW * 0.2 + i * ginW * 0.3;
      const cylY = ginY + ginH * 0.4;

      ctx.save();
      ctx.translate(cylX, cylY);
      ctx.rotate(rotation + i * 0.5);
      ctx.fillStyle = palette.accent;
      ctx.fillRect(-15, -25, 30, 50);

      // Teeth
      for (let t = 0; t < 6; t++) {
        ctx.fillStyle = palette.wood;
        ctx.fillRect(-18 + t * 6, -28, 4, 6);
        ctx.fillRect(-18 + t * 6, 22, 4, 6);
      }
      ctx.restore();
    }

    // Cotton lint particles
    if (frame % 10 === 0) {
      particlesRef.current.push(new DustParticle(ginX + rng.range(0, ginW), ginY));
    }
  }

  // Sorting table with cotton piles
  const tableX = width * 0.08;
  const tableY = height * 0.65;
  ctx.fillStyle = palette.wood;
  ctx.fillRect(tableX, tableY, width * 0.25, height * 0.12);

  // Cotton piles
  if (shiftActive) {
    for (let i = 0; i < 4; i++) {
      const pileX = tableX + 20 + i * 60;
      ctx.fillStyle = palette.product;
      ctx.beginPath();
      ctx.ellipse(pileX, tableY + 10, 25, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Bale press
  const pressX = width * 0.75;
  const pressY = height * 0.5;
  ctx.fillStyle = palette.machine;
  ctx.fillRect(pressX, pressY, width * 0.12, height * 0.4);

  // Compressed bale
  if (shiftActive) {
    ctx.fillStyle = palette.product;
    ctx.fillRect(pressX + 10, pressY + height * 0.25, width * 0.1, height * 0.12);
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(pressX + 10, pressY + height * 0.25, width * 0.1, height * 0.12);
  }

  // Workers
  if (shiftActive) {
    drawWorker(ctx, tableX + 50, height * 0.72, frame, 0);
    drawWorker(ctx, ginX - 40, height * 0.75, frame, 1);
    drawWorker(ctx, ginX + ginW + 20, height * 0.75, frame, 2);
    drawWorker(ctx, pressX - 30, height * 0.75, frame, 3);
  }
}

function renderRailwayWorkshop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number,
  shiftActive: boolean,
  palette: any,
  ambientLight: number,
  particlesRef: React.MutableRefObject<Particle[]>,
  rng: RNG
) {
  // Brick walls
  ctx.fillStyle = palette.wall;
  ctx.fillRect(0, 0, width, height * 0.35);

  // High arched windows
  if (ambientLight > 0.6) {
    ctx.fillStyle = '#87CEEB';
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 4; i++) {
      const wx = width * 0.2 + i * (width * 0.2);
      ctx.beginPath();
      ctx.arc(wx, height * 0.25, width * 0.06, Math.PI, 0);
      ctx.rect(wx - width * 0.06, height * 0.25, width * 0.12, height * 0.15);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Floor
  ctx.fillStyle = palette.floor;
  ctx.fillRect(0, height * 0.4, width, height * 0.6);

  // Locomotive under construction
  const locoX = width * 0.35;
  const locoY = height * 0.5;
  const locoW = width * 0.35;
  const locoH = height * 0.35;

  // Boiler
  ctx.fillStyle = palette.metal;
  ctx.beginPath();
  ctx.ellipse(locoX + locoW * 0.3, locoY + locoH * 0.4, locoW * 0.25, locoH * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Wheels
  const wheelPositions = [0.2, 0.5, 0.8];
  wheelPositions.forEach(pos => {
    const wheelX = locoX + locoW * pos;
    const wheelY = locoY + locoH;
    ctx.fillStyle = palette.machine;
    ctx.beginPath();
    ctx.arc(wheelX, wheelY, locoH * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Spokes
    if (shiftActive) {
      const rotation = (frame * 0.02) % (Math.PI * 2);
      ctx.save();
      ctx.translate(wheelX, wheelY);
      ctx.rotate(rotation);
      ctx.strokeStyle = palette.accent;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const angle = (i / 8) * Math.PI * 2;
        ctx.lineTo(Math.cos(angle) * locoH * 0.2, Math.sin(angle) * locoH * 0.2);
        ctx.stroke();
      }
      ctx.restore();
    }
  });

  // Overhead crane
  const craneX = width * 0.2;
  ctx.strokeStyle = palette.machine;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(craneX, 0);
  ctx.lineTo(craneX, height * 0.15);
  ctx.lineTo(width * 0.7, height * 0.15);
  ctx.stroke();

  // Hanging load
  if (shiftActive) {
    const hookX = width * 0.45 + Math.sin(frame * 0.02) * 30;
    ctx.strokeStyle = palette.machine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hookX, height * 0.15);
    ctx.lineTo(hookX, height * 0.35);
    ctx.stroke();

    // Load (pipe section)
    ctx.fillStyle = palette.product;
    ctx.fillRect(hookX - 25, height * 0.35, 50, 30);
  }

  // Forges with fire
  const forgeX1 = width * 0.08;
  const forgeX2 = width * 0.85;
  [forgeX1, forgeX2].forEach((forgeX, idx) => {
    const forgeY = height * 0.65;
    ctx.fillStyle = palette.machine;
    ctx.fillRect(forgeX, forgeY, width * 0.08, height * 0.2);

    if (shiftActive) {
      const fireFlicker = 0.7 + Math.sin(frame * 0.1 + idx) * 0.3;
      ctx.fillStyle = '#FF6600';
      ctx.globalAlpha = fireFlicker;
      ctx.fillRect(forgeX + 10, forgeY + 10, width * 0.06, height * 0.08);
      ctx.globalAlpha = 1;

      // Occasional sparks
      if (frame % 25 === idx * 12) {
        for (let i = 0; i < 5; i++) {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 3;
          particlesRef.current.push(new SparkParticle(forgeX + width * 0.04, forgeY + 20, angle));
        }
      }
    }
  });

  // Workers
  if (shiftActive) {
    drawWorker(ctx, locoX - 40, height * 0.75, frame, 0);
    drawWorker(ctx, locoX + locoW / 2, height * 0.75, frame, 1);
    drawWorker(ctx, forgeX1 - 20, height * 0.75, frame, 2);
    drawWorker(ctx, forgeX2 - 20, height * 0.75, frame, 3);
  }
}

function renderAutomobileFactory(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number,
  shiftActive: boolean,
  palette: any,
  ambientLight: number,
  particlesRef: React.MutableRefObject<Particle[]>,
  rng: RNG
) {
  // Clean white walls
  ctx.fillStyle = palette.wall;
  ctx.fillRect(0, 0, width, height * 0.35);

  // Large windows
  ctx.fillStyle = '#E0F7FF';
  ctx.globalAlpha = 0.8;
  for (let i = 0; i < 6; i++) {
    const wx = width * 0.1 + i * (width * 0.15);
    ctx.fillRect(wx, height * 0.08, width * 0.1, height * 0.2);
  }
  ctx.globalAlpha = 1;

  // Painted floor with markings
  ctx.fillStyle = palette.floor;
  ctx.fillRect(0, height * 0.4, width, height * 0.6);

  // Yellow safety lines
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(0, height * 0.52);
  ctx.lineTo(width, height * 0.52);
  ctx.stroke();
  ctx.setLineDash([]);

  // Assembly line conveyor
  const conveyorY = height * 0.52;
  const conveyorOffset = (frame * 1) % 40;

  // Conveyor belt pattern
  ctx.fillStyle = '#555';
  for (let i = -40; i < width + 40; i += 40) {
    ctx.fillRect(i - conveyorOffset, conveyorY - 3, 20, 6);
  }

  // Cars on assembly line
  if (shiftActive) {
    const carPositions = [0.2, 0.5, 0.8];
    carPositions.forEach((pos, idx) => {
      const carX = width * pos - (conveyorOffset / 40) * (width * 0.3);
      const carY = conveyorY + 10;

      // Car body (different stages)
      if (idx === 0) {
        // Chassis only
        ctx.fillStyle = palette.machine;
        ctx.fillRect(carX, carY + 20, 100, 20);
      } else if (idx === 1) {
        // With engine
        ctx.fillStyle = palette.machine;
        ctx.fillRect(carX, carY + 20, 100, 20);
        ctx.fillStyle = palette.product;
        ctx.fillRect(carX + 10, carY + 10, 40, 20);
      } else {
        // Painted body
        ctx.fillStyle = palette.paint;
        ctx.fillRect(carX, carY, 100, 40);
        ctx.fillRect(carX + 20, carY - 15, 60, 20);
        // Wheels
        ctx.fillStyle = palette.machine;
        ctx.beginPath();
        ctx.arc(carX + 25, carY + 40, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(carX + 75, carY + 40, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // Robot welders
  if (shiftActive) {
    const robot1X = width * 0.35;
    const robot2X = width * 0.65;
    [robot1X, robot2X].forEach((robotX, idx) => {
      const robotY = height * 0.45;

      // Robot arm
      ctx.strokeStyle = palette.machine;
      ctx.lineWidth = 8;
      const armAngle = Math.sin(frame * 0.05 + idx) * 0.3;
      ctx.save();
      ctx.translate(robotX, robotY);
      ctx.rotate(armAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 60);
      ctx.stroke();

      // Welding head
      ctx.fillStyle = palette.accent;
      ctx.fillRect(-8, 60, 16, 20);
      ctx.restore();

      // Welding sparks
      if (frame % 15 === idx * 7) {
        for (let i = 0; i < 6; i++) {
          const angle = (Math.random() - 0.5) * Math.PI;
          particlesRef.current.push(new SparkParticle(robotX, robotY + 70, angle));
        }
      }
    });
  }

  // Paint booth on right
  const boothX = width * 0.85;
  const boothY = height * 0.4;
  ctx.fillStyle = 'rgba(200, 200, 255, 0.3)';
  ctx.fillRect(boothX, boothY, width * 0.12, height * 0.5);
  ctx.strokeStyle = palette.machine;
  ctx.lineWidth = 2;
  ctx.strokeRect(boothX, boothY, width * 0.12, height * 0.5);

  // Workers
  if (shiftActive) {
    drawWorker(ctx, width * 0.25, height * 0.75, frame, 0);
    drawWorker(ctx, width * 0.55, height * 0.75, frame, 1);
    drawWorker(ctx, width * 0.75, height * 0.75, frame, 2);
  }
}

function renderElectronicsFactory(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number,
  shiftActive: boolean,
  palette: any,
  ambientLight: number,
  particlesRef: React.MutableRefObject<Particle[]>,
  rng: RNG
) {
  // Ultra-clean white walls
  ctx.fillStyle = palette.wall;
  ctx.fillRect(0, 0, width, height * 0.35);

  // Bright fluorescent lighting effect
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 5; i++) {
    const lightX = width * 0.15 + i * (width * 0.18);
    ctx.fillRect(lightX, 0, width * 0.08, height * 0.05);
  }
  ctx.globalAlpha = 1;

  // Clean floor
  ctx.fillStyle = palette.floor;
  ctx.fillRect(0, height * 0.4, width, height * 0.6);

  // PCB assembly line
  const lineY = height * 0.55;
  const conveyorOffset = (frame * 0.5) % 30;

  // Conveyor
  ctx.fillStyle = '#444';
  ctx.fillRect(0, lineY - 5, width, 10);

  // PCBs moving along
  if (shiftActive) {
    const pcbCount = 8;
    for (let i = 0; i < pcbCount; i++) {
      const pcbX = (width / pcbCount) * i - conveyorOffset + 30;
      if (pcbX > -50 && pcbX < width + 50) {
        // PCB board
        ctx.fillStyle = palette.circuit;
        ctx.fillRect(pcbX, lineY + 10, 40, 30);

        // Component traces
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 1;
        for (let t = 0; t < 4; t++) {
          ctx.beginPath();
          ctx.moveTo(pcbX + 5, lineY + 15 + t * 6);
          ctx.lineTo(pcbX + 35, lineY + 15 + t * 6);
          ctx.stroke();
        }

        // Components
        ctx.fillStyle = palette.machine;
        ctx.fillRect(pcbX + 8, lineY + 18, 6, 6);
        ctx.fillRect(pcbX + 20, lineY + 20, 8, 4);
        ctx.fillRect(pcbX + 26, lineY + 28, 6, 6);
      }
    }
  }

  // Soldering station
  const solderX = width * 0.35;
  const solderY = height * 0.48;
  ctx.fillStyle = palette.machine;
  ctx.fillRect(solderX, solderY, 60, 40);

  // Soldering iron
  if (shiftActive) {
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(solderX + 30, solderY);
    ctx.lineTo(solderX + 30, lineY + 15);
    ctx.stroke();

    // Glowing tip
    ctx.fillStyle = '#FFD700';
    ctx.globalAlpha = 0.8 + Math.sin(frame * 0.2) * 0.2;
    ctx.beginPath();
    ctx.arc(solderX + 30, lineY + 15, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Testing rig with screens
  const testX = width * 0.65;
  const testY = height * 0.45;
  ctx.fillStyle = palette.machine;
  ctx.fillRect(testX, testY, 100, 80);

  // Screen
  ctx.fillStyle = '#001100';
  ctx.fillRect(testX + 10, testY + 10, 80, 50);

  // Screen content (oscilloscope pattern)
  if (shiftActive) {
    ctx.strokeStyle = palette.product;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < 80; x++) {
      const y = 25 + Math.sin((x + frame) * 0.2) * 10;
      if (x === 0) {
        ctx.moveTo(testX + 10 + x, testY + 10 + y);
      } else {
        ctx.lineTo(testX + 10 + x, testY + 10 + y);
      }
    }
    ctx.stroke();
  }

  // LED indicators
  const ledColors = ['#00FF00', '#00FF00', '#FFFF00', '#FF0000'];
  ledColors.forEach((color, idx) => {
    const lit = shiftActive && (idx < 2 || (frame % 60 < 30 && idx === 2));
    ctx.fillStyle = lit ? color : '#333';
    ctx.beginPath();
    ctx.arc(testX + 20 + idx * 20, testY + 70, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Workers in clean suits
  if (shiftActive) {
    drawWorker(ctx, width * 0.3, height * 0.75, frame, 0, true);
    drawWorker(ctx, width * 0.6, height * 0.75, frame, 1, true);
    drawWorker(ctx, width * 0.8, height * 0.75, frame, 2, true);
  }
}

function renderGenericFactory(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number,
  shiftActive: boolean,
  palette: any,
  ambientLight: number,
  particlesRef: React.MutableRefObject<Particle[]>,
  rng: RNG
) {
  // Generic industrial interior
  ctx.fillStyle = '#6B6B6B';
  ctx.fillRect(0, 0, width, height * 0.4);
  ctx.fillStyle = '#555';
  ctx.fillRect(0, height * 0.4, width, height * 0.6);

  // Some basic machinery
  for (let i = 0; i < 4; i++) {
    const machX = width * 0.2 + i * (width * 0.2);
    const machY = height * 0.6;
    ctx.fillStyle = '#3A3A3A';
    ctx.fillRect(machX, machY, 60, 80);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(machX, machY, 60, 80);
  }

  if (shiftActive) {
    drawWorker(ctx, width * 0.3, height * 0.8, frame, 0);
    drawWorker(ctx, width * 0.6, height * 0.8, frame, 1);
  }
}

/* ========================================================================== */
/* Worker Drawing                                                             */
/* ========================================================================== */

function drawWorker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  index: number,
  cleanSuit: boolean = false
) {
  // Simple pixel-art worker
  const walkCycle = Math.floor((frame / 15 + index) % 4);
  const legOffset = walkCycle === 0 || walkCycle === 2 ? 0 : walkCycle === 1 ? 2 : -2;

  // Body
  ctx.fillStyle = cleanSuit ? '#FFFFFF' : '#4A4A4A';
  ctx.fillRect(x - 4, y - 20, 8, 12);

  // Head
  ctx.fillStyle = cleanSuit ? '#FFFFFF' : '#D2B48C';
  ctx.fillRect(x - 4, y - 24, 8, 6);

  // Legs (simple walk animation)
  ctx.fillStyle = cleanSuit ? '#FFFFFF' : '#2A2A2A';
  ctx.fillRect(x - 4, y - 8, 3, 8 + legOffset);
  ctx.fillRect(x + 1, y - 8, 3, 8 - legOffset);

  // Arms
  ctx.fillRect(x - 7, y - 18, 3, 8);
  ctx.fillRect(x + 4, y - 18, 3, 8);
}

export default FactoryInteriorBanner;
