/**
 * components/symbols/LavaSymbolStatic.tsx
 * Static ASCII-style lava pattern with minimal animation for performance
 */
import React, { useMemo } from 'react';

interface LavaSymbolStaticProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const LavaSymbolStatic: React.FC<LavaSymbolStaticProps> = React.memo(
  ({ x, y, size, seed }) => {
    // Generate a static pattern based on position
    const pattern = useMemo(() => {
      