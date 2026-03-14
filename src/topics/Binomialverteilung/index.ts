import { registerTopic } from '../TopicRegistry';
import { Binomialverteilung } from './Binomialverteilung';

registerTopic({
  id: 'binomialverteilung',
  title: 'Binomial',
  titleAccent: 'verteilung',
  subtitle: 'Bernoulli & Wahrscheinlichkeiten',
  icon: '🎲',
  description: 'Bernoulli-Experimente, P(X=k), kumulierte Verteilung, Erwartungswert & Varianz',
  component: Binomialverteilung,
});
