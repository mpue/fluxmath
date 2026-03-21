import { registerTopic } from '../TopicRegistry';
import { Kurvendiskussion } from './Kurvendiskussion';

registerTopic({
  id: 'kurvendiskussion',
  title: 'Kurven',
  titleAccent: 'diskussion',
  subtitle: 'Vollstaendige Funktionsuntersuchung',
  icon: '\u223F',
  description: 'Extrema, Wendepunkte, Nullstellen, Symmetrie, Kruemmung, Graph-Analyse',
  component: Kurvendiskussion,
});
