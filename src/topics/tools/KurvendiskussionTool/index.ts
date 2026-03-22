import { registerTopic } from '../../TopicRegistry';
import { KurvendiskussionTool } from './KurvendiskussionTool';

registerTopic({
  id: 'kurvendiskussion-tool',
  title: 'Kurven',
  titleAccent: 'diskussion',
  subtitle: 'Automatische Analyse aller Funktionseigenschaften',
  description: 'Automatische Nullstellen, Extrema, Wendepunkte & mehr',
  icon: '📈',
  component: KurvendiskussionTool,
  category: 'Tools',
});
