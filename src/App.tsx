import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { TopicNav } from './components/TopicNav';
import { MusicPlayer } from './components/MusicPlayer';
import { SfxPanel } from './components/SfxPanel';
import { Home } from './pages/Home';
import { TopicPage } from './pages/TopicPage';
import { audioEngine } from './shared/AudioEngine';

// Register all topics — add new imports here to extend the app
import './topics/LineareFunktionen';
import './topics/QuadratischeFunktionen';
import './topics/GanzrationaleFunktionen';
import './topics/Exponentialfunktionen';
import './topics/TrigonometrischeFunktionen';
import './topics/Differentialrechnung';
import './topics/Integralrechnung';
import './topics/Vektoren';
import './topics/Binomialverteilung';
import './topics/Normalverteilung';
import './topics/FourierAnalyse';
import './topics/KomplexeZahlen';
import './topics/FolgenUndReihen';
import './topics/Matrizen';
import './topics/RationaleFunktionen';
import './topics/Hypothesentests';
import './topics/GeradenEbenen';
import './topics/Wahrscheinlichkeit';
import './topics/Logarithmusfunktionen';
import './topics/Grenzwerte';
import './topics/Kurvendiskussion';
import './topics/Potenzreihen';
import './topics/Differentialgleichungen';
import './topics/PartielleAbleitungen';
import './topics/Mehrfachintegrale';
import './topics/LineareGleichungssysteme';
import './topics/Determinanten';
import './topics/Eigenwerte';
import './topics/Vektorraeume';

// Tools
import './topics/tools/Funktionsplotter';
import './topics/tools/MatrixRechner';

/** Plays slide_in / slide_out on route changes, click SFX on button taps */
const SfxTriggers: React.FC = () => {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  // Route-change SFX
  useEffect(() => {
    const prev = prevPath.current;
    const cur = location.pathname;
    prevPath.current = cur;

    if (prev === cur) return;
    if (cur.startsWith('/topic/')) {
      audioEngine.sfxPlay('in');
    } else if (cur === '/' && prev.startsWith('/topic/')) {
      audioEngine.sfxPlay('out');
    }
  }, [location.pathname]);

  // Global hover SFX — fires on any <button> / <a> except inside the audio panels
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const el = target.closest('button, a');
      if (!el) return;
      if (el.closest('#player') || el.closest('#sfxp')) return;
      audioEngine.sfxPlay('click');
    };
    document.addEventListener('mouseenter', handler, true);
    return () => document.removeEventListener('mouseenter', handler, true);
  }, []);

  return null;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <SfxTriggers />
      <div className="bg-grid" />
      <div className="scan-beam" />
      <div className="hud-tl" />
      <div className="hud-tr" />
      <div className="hud-bl" />
      <div className="hud-br" />

      <div className="app">
        <TopicNav />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/topic/:topicId" element={<TopicPage />} />
        </Routes>
      </div>

      <div className="hud-status">
        <span className="pulse-dot" />
        SYSTEM AKTIV // FLUXMATH v1.0
      </div>

      <MusicPlayer />
      <SfxPanel />
    </BrowserRouter>
  );
};
