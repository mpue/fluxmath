import { registerTopic } from '../TopicRegistry';
import { Exponentialfunktionen } from './Exponentialfunktionen';

registerTopic({
  id: 'exponentialfunktionen',
  title: 'Exponential',
  titleAccent: 'funktionen',
  subtitle: 'Wachstum, Zerfall & Logarithmus',
  icon: 'eˣ',
  description: 'Exponentielles Wachstum und Zerfall mit e-Funktion, Asymptoten, Halbwertszeit und natürlichem Logarithmus.',
  component: Exponentialfunktionen,
});
