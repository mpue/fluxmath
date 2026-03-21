import { registerTopic } from '../TopicRegistry';
import { Mehrfachintegrale } from './Mehrfachintegrale';

registerTopic({
  id: 'mehrfachintegrale',
  title: 'Mehrfach',
  titleAccent: 'integrale',
  subtitle: 'Doppelintegrale, Fubini & Polarkoordinaten',
  icon: '∬',
  description: 'Doppelintegrale ueber verschiedene Integrationsbereiche interaktiv berechnen.',
  component: Mehrfachintegrale,
});
