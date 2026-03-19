import { registerTopic } from '../TopicRegistry';
import { FourierAnalyse } from './FourierAnalyse';

registerTopic({
  id: 'fourier-analyse',
  title: 'Fourier-',
  titleAccent: 'Analyse',
  subtitle: 'Analyse, Synthese & Epizirkel',
  icon: '≈',
  description: 'Fourier-Analyse, Synthese und Epizirkel — periodische Signale in Schwingungen zerlegen und visualisieren.',
  component: FourierAnalyse,
});
