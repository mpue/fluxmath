import { registerTopic } from '../TopicRegistry';
import { Differentialgleichungen } from './Differentialgleichungen';

registerTopic({
  id: 'differentialgleichungen',
  title: 'Differentialgleichungen',
  titleAccent: '(ODE)',
  subtitle: 'Richtungsfelder, Separation & Loesungskurven',
  icon: "y'",
  description: 'Gewoehnliche Differentialgleichungen mit Richtungsfeldern interaktiv loesen.',
  component: Differentialgleichungen,
});
