import { registerTopic } from '../TopicRegistry';
import { PartielleAbleitungen } from './PartielleAbleitungen';

registerTopic({
  id: 'partielle-ableitungen',
  title: 'Partielle',
  titleAccent: 'Ableitungen',
  subtitle: 'Gradient, Hesse-Matrix & Richtungsableitung',
  icon: '∂',
  description: 'Partielle Ableitungen, Gradient und Hoehenlinien interaktiv erkunden.',
  component: PartielleAbleitungen,
});
