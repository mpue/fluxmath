import { registerTopic } from '../TopicRegistry';
import { GanzrationaleFunktionen } from './GanzrationaleFunktionen';

registerTopic({
  id: 'ganzrationale-funktionen',
  title: 'Ganzrationale',
  titleAccent: 'Funktionen',
  subtitle: 'Polynome, Grad & Verhalten',
  icon: '\u{1D465}\u207F',
  description: 'Polynome vom Grad 1–5 mit einstellbaren Koeffizienten, Nullstellensuche und Endverhalten.',
  component: GanzrationaleFunktionen,
});
