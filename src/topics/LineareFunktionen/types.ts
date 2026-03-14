export interface CanvasColors {
  grid: string;
  gridMajor: string;
  axis: string;
  axisLabel: string;
  quadrant: string;
  origin: string;
  line: string;
  lineGlow: string;
  zero: string;
  zeroGlow: string;
  zeroLabel: string;
  yint: string;
  yintGlow: string;
  yintLabel: string;
  tri: string;
  triFill: string;
  triLabel: string;
  crosshair: string;
  bg: string;
}

export const CANVAS_COLORS: CanvasColors = {
  grid: 'rgba(0,212,255,0.03)',
  gridMajor: 'rgba(0,212,255,0.07)',
  axis: 'rgba(0,212,255,0.22)',
  axisLabel: 'rgba(0,212,255,0.3)',
  quadrant: 'rgba(0,212,255,0.06)',
  origin: 'rgba(0,212,255,0.15)',
  line: '#00d4ff',
  lineGlow: 'rgba(0,212,255,0.45)',
  zero: '#ff2244',
  zeroGlow: 'rgba(255,34,68,0.5)',
  zeroLabel: 'rgba(255,34,68,0.9)',
  yint: '#00ff88',
  yintGlow: 'rgba(0,255,136,0.5)',
  yintLabel: 'rgba(0,255,136,0.9)',
  tri: 'rgba(255,170,0,0.6)',
  triFill: 'rgba(255,170,0,0.06)',
  triLabel: 'rgba(255,170,0,0.85)',
  crosshair: 'rgba(0,212,255,0.08)',
  bg: '#010a0e',
};
