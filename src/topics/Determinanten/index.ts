import { registerTopic } from '../TopicRegistry';
import { Determinanten } from './Determinanten';

registerTopic({
  id: 'determinanten',
  title: 'Determi',
  titleAccent: 'nanten',
  subtitle: 'Berechnung, Sarrus & geometrische Deutung',
  icon: '|A|',
  description: 'Determinanten berechnen und ihre geometrische Bedeutung verstehen.',
  component: Determinanten,
});
