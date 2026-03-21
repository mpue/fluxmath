import { registerTopic } from '../TopicRegistry';
import { GanzrationaleFunktionen } from './GanzrationaleFunktionen';

registerTopic({
  id: 'ganzrationale-funktionen',
  title: 'Ganzrationale',
  titleAccent: 'Funktionen',
  subtitle: 'Polynome, Grad & Verhalten',
  icon: 'xⁿ',
  description: 'Polynome vom Grad 1–5 mit einstellbaren Koeffizienten, Nullstellensuche und Endverhalten.',
  component: GanzrationaleFunktionen,
});
