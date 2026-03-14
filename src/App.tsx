import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TopicNav } from './components/TopicNav';
import { Home } from './pages/Home';
import { TopicPage } from './pages/TopicPage';

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

export const App: React.FC = () => {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
};
