import { registerTopic } from '../TopicRegistry';
import { Integralrechnung } from './Integralrechnung';

registerTopic({
  id: 'integralrechnung',
  title: 'Integral',
  titleAccent: 'rechnung',
  subtitle: 'Flächen & Stammfunktionen',
  icon: '∫',
  description: 'Bestimmtes Integral als orientierte Fläche, Stammfunktionen und der Hauptsatz der Analysis visualisiert.',
  component: Integralrechnung,
});
