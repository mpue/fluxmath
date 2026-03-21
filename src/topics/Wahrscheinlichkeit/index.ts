import { registerTopic } from '../TopicRegistry';
import { Wahrscheinlichkeit } from './Wahrscheinlichkeit';

registerTopic({
  id: 'wahrscheinlichkeit',
  title: 'Wahrscheinlich',
  titleAccent: 'keit',
  subtitle: 'Baumdiagramme, Bayes & bedingte W.',
  icon: '\u2684',
  description: 'Bedingte Wahrscheinlichkeit, Baumdiagramme, Pfadregeln, Satz von Bayes',
  component: Wahrscheinlichkeit,
});
