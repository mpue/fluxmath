import { registerTopic } from '../TopicRegistry';
import { Matrizen } from './Matrizen';

registerTopic({
  id: 'matrizen',
  title: 'Matrizen',
  titleAccent: 'rechnung',
  subtitle: 'Determinante, Multiplikation & Transponierte',
  icon: '[M]',
  description: '2×2-Matrizen als lineare Abbildungen — Determinante, Addition, Multiplikation und Transponierte interaktiv erkunden.',
  component: Matrizen,
});
