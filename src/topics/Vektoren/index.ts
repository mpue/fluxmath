import { registerTopic } from '../TopicRegistry';
import { Vektoren } from './Vektoren';

registerTopic({
  id: 'vektoren',
  title: 'Vektor',
  titleAccent: 'rechnung',
  subtitle: 'Vektoren, Skalarprodukt & Winkel',
  icon: '\u20D7v',
  description: 'Vektoren addieren, subtrahieren, skalieren — Skalarprodukt, Projektion und Winkelberechnung inklusive.',
  component: Vektoren,
});
