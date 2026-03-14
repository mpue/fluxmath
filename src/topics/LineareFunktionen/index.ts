import { registerTopic } from '../TopicRegistry';
import { LineareFunktionen } from './LineareFunktionen';

registerTopic({
  id: 'lineare-funktionen',
  title: 'Lineare',
  titleAccent: 'Funktionen',
  subtitle: 'Geraden, Steigung & Nullstellen',
  icon: '\u2215',
  description: 'Interaktive Visualisierung linearer Funktionen f(x) = mx + b mit Steigungsdreieck, Nullstelle und y-Achsenabschnitt.',
  component: LineareFunktionen,
});
