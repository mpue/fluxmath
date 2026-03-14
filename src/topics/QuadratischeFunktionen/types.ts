export { CANVAS_COLORS } from '../LineareFunktionen/types';

export interface QuadraticColors {
  parabola: string;
  parabolaGlow: string;
  vertex: string;
  vertexGlow: string;
  vertexLabel: string;
  symmetry: string;
  symmetryLabel: string;
}

export const QUADRATIC_COLORS: QuadraticColors = {
  parabola: '#00d4ff',
  parabolaGlow: 'rgba(0,212,255,0.45)',
  vertex: '#ff8800',
  vertexGlow: 'rgba(255,136,0,0.5)',
  vertexLabel: 'rgba(255,136,0,0.9)',
  symmetry: 'rgba(255,170,0,0.25)',
  symmetryLabel: 'rgba(255,170,0,0.6)',
};
