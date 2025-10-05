// SIMPLE SNES-STYLE ANIMAL RENDERING - Ultra minimal pixel art
// This is a backup/reference for simpler animal rendering

const drawAnimal = (animal: any) => {
  const scale = animal.isBaby ? 0.6 : 1.0;

  if (animal.type === 'chicken') {
    const pecking = Math.sin(slowTick * 0.1 + animal.phase) > 0.6;
    return (
      <g key={animal.id} transform={`translate(${animal.x}, ${animal.y}) scale(${scale})`}>
        <ellipse cx={0} cy={1} rx={2} ry={1} fill="#000" opacity={0.2} />
        <ellipse cx={0} cy={pecking ? 0 : -1} rx={2} ry={2} fill="#FFF" />
        <circle cx={1} cy={pecking ? -1 : -2} r={1} fill="#FFF" />
        <rect x={2} y={pecking ? -1 : -2} width={1} height={1} fill="#F44" />
      </g>
    );
  }

  if (animal.type === 'cow') {
    return (
      <g key={animal.id} transform={`translate(${animal.x}, ${animal.y}) scale(${scale})`}>
        <ellipse cx={0} cy={2} rx={4} ry={1.5} fill="#000" opacity={0.15} />
        <ellipse cx={0} cy={-1} rx={4} ry={3} fill="#8B4513" />
        <ellipse cx={-3} cy={-1} rx={2} ry={1.5} fill="#8B4513" />
        <rect x={-4} y={-2} width={1} height={2} fill="#DDD" />
      </g>
    );
  }

  if (animal.type === 'horse') {
    return (
      <g key={animal.id} transform={`translate(${animal.x}, ${animal.y}) scale(${scale})`}>
        <ellipse cx={0} cy={2} rx={5} ry={1.5} fill="#000" opacity={0.15} />
        <ellipse cx={0} cy={0} rx={5} ry={4} fill="#654321" />
        <ellipse cx={-4} cy={-3} rx={2} ry={2} fill="#654321" />
        <rect x={-5} y={-2} width={2} height={3} fill="#654321" />
      </g>
    );
  }

  // Default simple shape for other animals
  return (
    <g key={animal.id} transform={`translate(${animal.x}, ${animal.y}) scale(${scale})`}>
      <ellipse cx={0} cy={1} rx={3} ry={2} fill="#888" />
    </g>
  );
};
