import { registerTopic } from '../TopicRegistry';
import { QuadratischeFunktionen } from './QuadratischeFunktionen';

registerTopic({
  id: 'quadratische-funktionen',
  title: 'Quadratische',
  titleAccent: 'Funktionen',
  subtitle: 'Parabeln, Scheitel & Nullstellen',
  icon: 'x\u00B2',
  description: 'Interaktive Visualisierung quadratischer Funktionen f(x) = ax² + bx + c mit Scheitelform, Diskriminante und Nullstellen.',
  component: QuadratischeFunktionen,
});
