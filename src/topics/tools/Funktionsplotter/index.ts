import { registerTopic } from '../../TopicRegistry';
import { Funktionsplotter } from './Funktionsplotter';

registerTopic({
  id: 'funktionsplotter',
  title: 'Funktions',
  titleAccent: 'plotter',
  subtitle: 'Beliebige Funktionen plotten & vergleichen',
  icon: '📈',
  description: 'Gib beliebige Funktionen ein und visualisiere sie interaktiv — bis zu 5 Graphen gleichzeitig mit Zoom & Pan.',
  component: Funktionsplotter,
  category: 'Tools',
});
