import { registerTopic } from '../TopicRegistry';
import { Grenzwerte } from './Grenzwerte';

registerTopic({
  id: 'grenzwerte',
  title: 'Grenz',
  titleAccent: 'werte',
  subtitle: 'Konvergenz, Stetigkeit & Epsilon-Delta',
  icon: '\u221E',
  description: 'Grenzwerte, Stetigkeit, Epsilon-Delta, Sandwich-Theorem, wichtige Standardgrenzwerte',
  component: Grenzwerte,
});
