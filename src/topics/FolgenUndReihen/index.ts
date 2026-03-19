import { registerTopic } from '../TopicRegistry';
import { FolgenUndReihen } from './FolgenUndReihen';

registerTopic({
  id: 'folgen-und-reihen',
  title: 'Folgen und ',
  titleAccent: 'Reihen',
  subtitle: 'Arithmetische & geometrische Folgen, Konvergenz',
  icon: 'Σ',
  description: 'Arithmetische, geometrische, harmonische Folgen und Fibonacci — Partialsummen und Konvergenz interaktiv erkunden.',
  component: FolgenUndReihen,
});
