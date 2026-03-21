import { registerTopic } from '../TopicRegistry';
import { GeradenEbenen } from './GeradenEbenen';

registerTopic({
  id: 'geradenebenen',
  title: 'Geraden &',
  titleAccent: 'Ebenen',
  subtitle: 'Analytische Geometrie im 3D-Raum',
  icon: '\u25B3',
  description: 'Parameterform, Normalenform, Lagebeziehungen, Abstand Punkt-Ebene',
  component: GeradenEbenen,
});
