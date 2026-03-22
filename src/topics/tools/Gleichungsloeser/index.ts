import { registerTopic } from '../../TopicRegistry';
import { Gleichungsloeser } from './Gleichungsloeser';

registerTopic({
  id: 'gleichungsloeser',
  title: 'Gleichungs',
  titleAccent: 'löser',
  subtitle: 'Gleichungen & LGS mit Lösungsweg',
  icon: '🔣',
  description: 'Lineare, quadratische, kubische Gleichungen und Gleichungssysteme lösen — mit vollständigem Lösungsweg.',
  component: Gleichungsloeser,
  category: 'Tools',
});
