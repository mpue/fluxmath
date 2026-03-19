import { registerTopic } from '../TopicRegistry';
import { KomplexeZahlen } from './KomplexeZahlen';

registerTopic({
  id: 'komplexe-zahlen',
  title: 'Komplexe ',
  titleAccent: 'Zahlen',
  subtitle: 'Gaußsche Zahlenebene & Operationen',
  icon: 'ℂ',
  description: 'Komplexe Zahlen in der Gaußschen Ebene — Addition, Multiplikation, Konjugation und Polarform interaktiv erkunden.',
  component: KomplexeZahlen,
});
