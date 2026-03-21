import { registerTopic } from '../TopicRegistry';
import { LineareGleichungssysteme } from './LineareGleichungssysteme';

registerTopic({
  id: 'lineare-gleichungssysteme',
  title: 'Lineare',
  titleAccent: 'Gleichungssysteme',
  subtitle: 'Gauss-Elimination, Rang & Loesbarkeit',
  icon: 'Ax',
  description: 'Lineare Gleichungssysteme Schritt fuer Schritt mit dem Gauss-Verfahren loesen.',
  component: LineareGleichungssysteme,
});
