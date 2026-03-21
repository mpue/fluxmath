import { registerTopic } from '../TopicRegistry';
import { Logarithmusfunktionen } from './Logarithmusfunktionen';

registerTopic({
  id: 'logarithmusfunktionen',
  title: 'Logarithmus',
  titleAccent: 'funktionen',
  subtitle: 'ln, log & Umkehrung von Exponentialfunktionen',
  icon: '\u2113',
  description: 'Logarithmus, Rechengesetze, Basisumrechnung, Graphen & Gleichungen',
  component: Logarithmusfunktionen,
});
