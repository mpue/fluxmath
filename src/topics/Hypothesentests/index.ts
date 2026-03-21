import { registerTopic } from '../TopicRegistry';
import { Hypothesentests } from './Hypothesentests';

registerTopic({
  id: 'hypothesentests',
  title: 'Hypothesen',
  titleAccent: 'tests',
  subtitle: 'Signifikanz & Entscheidungsregeln',
  icon: '\u2714',
  description: 'Signifikanztests, Fehler 1. und 2. Art, Ablehnungsbereich, kritischer Wert',
  component: Hypothesentests,
});
