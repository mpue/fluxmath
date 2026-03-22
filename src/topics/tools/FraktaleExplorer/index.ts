import { registerTopic } from '../../TopicRegistry';
import { FraktaleExplorer } from './FraktaleExplorer';

registerTopic({
  id: 'fraktale-explorer',
  title: 'Fraktale',
  titleAccent: 'Explorer',
  subtitle: 'Mandelbrot- & Julia-Mengen interaktiv erkunden',
  description: 'Mandelbrot- & Julia-Mengen interaktiv erkunden',
  icon: '🌀',
  component: FraktaleExplorer,
  category: 'Tools',
});
