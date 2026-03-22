import { registerTopic } from '../TopicRegistry';
import { Fraktale } from './Fraktale';

registerTopic({
  id: 'fraktale',
  title: 'Fraktale ',
  titleAccent: 'Geometrie',
  subtitle: 'Mandelbrot, Julia & Selbstähnlichkeit',
  icon: '🌀',
  description: 'Iteration in der komplexen Ebene — Mandelbrot-Menge, Julia-Mengen, Escape-Radius und fraktale Dimension interaktiv erkunden.',
  component: Fraktale,
});
