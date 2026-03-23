import { registerTopic } from '../../TopicRegistry';
import { Formelsammlung } from './Formelsammlung';

registerTopic({
  id: 'formelsammlung',
  title: 'Formel',
  titleAccent: 'sammlung',
  subtitle: 'Alle wichtigen Formeln auf einen Blick',
  icon: '📋',
  description: 'Kompakte Übersicht aller Formeln — von Grundlagen über Analysis und Lineare Algebra bis Stochastik.',
  component: Formelsammlung,
  category: 'Tools',
});
