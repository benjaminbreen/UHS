/** Roman Italian paving reference; applying this to generated Rome streets is
 * an inference, not a reconstructed street survey. Rural paths remain dirt.
 * Reference: https://pompeiisites.org/wp-content/uploads/Pompei-ING-LR-link.pdf */
export const italyStreet = {
  bounds: [6, 36, 19, 48],
  from: -300,
  to: 500,
  material: "basalt",
  status: "inferred",
} as const;
