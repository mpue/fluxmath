import { registerTopic } from '../../TopicRegistry';
import { MatrixRechner } from './MatrixRechner';

registerTopic({
  id: 'matrix-rechner',
  title: 'Matrix',
  titleAccent: 'rechner',
  subtitle: 'Matrizen eingeben & berechnen',
  icon: '🧮',
  description: 'Addition, Multiplikation, Determinante, Inverse, Transponierte, Rang, Spur und Potenz — bis 5×5.',
  component: MatrixRechner,
  category: 'Tools',
});
