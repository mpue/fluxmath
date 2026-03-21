import { registerTopic } from '../TopicRegistry';
import { RationaleFunktionen } from './RationaleFunktionen';

registerTopic({
  id: 'rationale-funktionen',
  title: 'Rationale ',
  titleAccent: 'Funktionen',
  subtitle: 'Polstellen, Asymptoten & Definitionslücken',
  icon: '\u00F7',
  description: 'Gebrochen-rationale Funktionen interaktiv — Polstellen, Asymptoten, Nullstellen und Definitionslücken erkunden.',
  component: RationaleFunktionen,
});
