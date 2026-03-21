import { registerTopic } from '../TopicRegistry';
import { Eigenwerte } from './Eigenwerte';

registerTopic({
  id: 'eigenwerte',
  title: 'Eigenwerte',
  titleAccent: '& Eigenvektoren',
  subtitle: 'Charakteristisches Polynom & Diagonalisierung',
  icon: 'λ',
  description: 'Eigenwerte und Eigenvektoren berechnen und ihre geometrische Wirkung sehen.',
  component: Eigenwerte,
});
