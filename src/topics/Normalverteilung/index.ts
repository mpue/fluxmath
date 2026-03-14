import { registerTopic } from '../TopicRegistry';
import { Normalverteilung } from './Normalverteilung';

registerTopic({
  id: 'normalverteilung',
  title: 'Normal',
  titleAccent: 'verteilung',
  subtitle: 'Gauß & Sigma-Regeln',
  icon: '📈',
  description: 'Gauß-Verteilung, Dichtefunktion, z-Werte, Sigma-Regeln & Verteilungsfunktion',
  component: Normalverteilung,
});
