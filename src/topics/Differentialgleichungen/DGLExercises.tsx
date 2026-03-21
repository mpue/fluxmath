import React, { useState } from 'react';
import { Math as M } from '../../shared/Math';

interface Task { question: JSX.Element; answer: number; tolerance: number; hint: string }

function generateTask(type: number): Task {
  switch (type) {
    case 0: {
      // Separation: y' = ky
      const k = [1, 2, -1, 3, -2][Math.floor(Math.random() * 5)];
      const y0 = [1, 2, 3][Math.floor(Math.random() * 3)];
      const x = 1;
      const ans = y0 * Math.exp(k * x);
      return {
        question: <>Loesung von <M>{String.raw`y' = ${k}y`}</M> mit <M>{String.raw`y(0) = ${y0}`}</M>. Was ist <M>y(1)</M>?</>,
        answer: ans, tolerance: 0.1,
        hint: `y = y0 * e^(k*x) = ${y0} * e^(${k})`,
      };
    }
    case 1: {
      // Type identification
      const types: [string, number][] = [
        [String.raw`y' = 3y`, 1],     // separierbar
        [String.raw`y' + 2y = x`, 2], // linear 1. Ordnung
        [String.raw`y' = xy^2`, 1],   // separierbar (Bernoulli)
        [String.raw`y'' + y = 0`, 3], // 2. Ordnung
      ];
      const [tex, t] = types[Math.floor(Math.random() * types.length)];
      return {
        question: <>Welche Ordnung hat die DGL <M>{tex}</M>? (1 oder 2)</>,
        answer: t === 3 ? 2 : 1, tolerance: 0,
        hint: 'Die Ordnung = hoechste vorkommende Ableitung',
      };
    }
    case 2: {
      // Linear DGL y' + ay = 0
      const a = [1, 2, 3, -1][Math.floor(Math.random() * 4)];
      const y0 = [1, 2, 5][Math.floor(Math.random() * 3)];
      const x = [1, 2, 0.5][Math.floor(Math.random() * 3)];
      const ans = y0 * Math.exp(-a * x);
      return {
        question: <><M>{String.raw`y' + ${a}y = 0`}</M>, <M>{String.raw`y(0) = ${y0}`}</M>. Berechne <M>{String.raw`y(${x})`}</M>.</>,
        answer: ans, tolerance: 0.1,
        hint: `Loesung: y = y0 * e^(-a*x) = ${y0} * e^(${-a}*${x})`,
      };
    }
    case 3: {
      // Euler method single step
      const h = 0.5;
      const x0 = 0;
      const y0 = 1;
      // y' = y, one step
      const slope = y0;
      const y1 = y0 + h * slope;
      return {
        question: <>Euler-Verfahren: <M>{String.raw`y' = y`}</M>, <M>{String.raw`y(0) = 1`}</M>, Schrittweite <M>h = 0.5</M>. Was ist <M>{String.raw`y_1`}</M>?</>,
        answer: y1, tolerance: 0.01,
        hint: `y1 = y0 + h * f(x0, y0) = 1 + 0.5 * 1 = ${y1}`,
      };
    }
    default: {
      // Solution verification
      const c = [1, 2, -1][Math.floor(Math.random() * 3)];
      const x = 1;
      const y = c * Math.exp(x);
      return {
        question: <>Ist <M>{String.raw`y = ${c}e^x`}</M> eine Loesung von <M>{String.raw`y' = y`}</M>? Berechne <M>{String.raw`y(1)`}</M>.</>,
        answer: y, tolerance: 0.1,
        hint: `y(1) = ${c} * e = ${(c * Math.E).toFixed(3)}`,
      };
    }
  }
}

export const DGLExercises: React.FC = () => {
  const [task, setTask] = useState<Task>(() => generateTask(Math.floor(Math.random() * 5)));
  const [input, setInput] = useState('');
  const [state, setState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const check = () => {
    const val = parseFloat(input.replace(',', '.'));
    if (isNaN(val)) return;
    const ok = Math.abs(val - task.answer) <= task.tolerance;
    setState(ok ? 'correct' : 'wrong');
    setScore(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
  };

  const next = () => {
    setTask(generateTask(Math.floor(Math.random() * 5)));
    setInput(''); setState('idle'); setShowHint(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { if (state === 'idle') check(); else next(); }
  };

  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className="exercises-section">
      <h2>Aufgaben</h2>
      <div className="exercise-score">
        <span className="score-label">Score</span>
        <span className="score-value">{score.correct}/{score.total}</span>
        {score.total > 0 && <span className="score-pct">{pct}%</span>}
      </div>
      <div className="exercise-card">
        <div className="exercise-question">{task.question}</div>
        <div className="exercise-input-row">
          <input className={`exercise-input ${state}`} type="text" inputMode="decimal" value={input}
            onChange={e => { setInput(e.target.value); if (state !== 'idle') setState('idle'); }}
            onKeyDown={handleKey} placeholder="Antwort eingeben..." />
          {state === 'idle'
            ? <button className="exercise-btn check" onClick={check}>Pruefen</button>
            : <button className="exercise-btn next" onClick={next}>Naechste &rarr;</button>}
        </div>
        {state === 'correct' && <div className="exercise-feedback correct">Richtig!</div>}
        {state === 'wrong' && <div className="exercise-feedback wrong">Leider falsch — die richtige Antwort ist <strong>{task.answer % 1 === 0 ? task.answer : task.answer.toFixed(2)}</strong></div>}
        {state === 'idle' && <button className="exercise-hint-toggle" onClick={() => setShowHint(!showHint)}>{showHint ? 'Hinweis ausblenden' : 'Hinweis anzeigen'}</button>}
        {showHint && state === 'idle' && <div className="exercise-hint">{task.hint}</div>}
      </div>
    </div>
  );
};
