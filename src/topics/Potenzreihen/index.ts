import { registerTopic } from '../TopicRegistry';
import { Potenzreihen } from './Potenzreihen';

registerTopic({
  id: 'potenzreihen',
  title: 'Potenzreihen',
  titleAccent: '& Taylor',
  subtitle: 'Taylor-Entwicklung, Konvergenzradius & Approximation',
  icon: 'Tₙ',
  description: 'Potenzreihen, Taylor-Polynome und Konvergenzradius interaktiv entdecken.',
  component: Potenzreihen,
});
