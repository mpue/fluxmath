import { registerTopic } from '../TopicRegistry';
import { Differentialrechnung } from './Differentialrechnung';

registerTopic({
  id: 'differentialrechnung',
  title: 'Differential',
  titleAccent: 'rechnung',
  subtitle: 'Ableitungen & Tangenten',
  icon: "f'",
  description: 'Ableitungen visualisiert: Tangenten, f\'(x), f\'\'(x), Extremstellen und Wendepunkte interaktiv erkunden.',
  component: Differentialrechnung,
});
