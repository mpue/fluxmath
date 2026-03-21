import { registerTopic } from '../TopicRegistry';
import { TrigonometrischeFunktionen } from './TrigonometrischeFunktionen';

registerTopic({
  id: 'trigonometrische-funktionen',
  title: 'Trigonometrische',
  titleAccent: 'Funktionen',
  subtitle: 'sin, cos, tan — Amplitude & Periode',
  icon: '\u007E',
  description: 'Sinus, Kosinus und Tangens mit Amplitude, Frequenz, Phasenverschiebung und Periodenvisualisierung.',
  component: TrigonometrischeFunktionen,
});
