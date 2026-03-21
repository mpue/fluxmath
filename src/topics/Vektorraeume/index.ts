import { registerTopic } from '../TopicRegistry';
import { Vektorraeume } from './Vektorraeume';

registerTopic({
  id: 'vektorraeume',
  title: 'Vektorraeume',
  titleAccent: '& Abbildungen',
  subtitle: 'Kern, Bild, Basis & Dimensionsformel',
  icon: 'ℝⁿ',
  description: 'Vektorraeume, lineare Abbildungen und die Dimensionsformel interaktiv erkunden.',
  component: Vektorraeume,
});
