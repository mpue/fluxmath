import React, { useState } from 'react';
import { Math as M } from '../../shared/Math';

interface Task { question: JSX.Element; answer: number; tolerance: number; hint: string }

function generateTask(type: number): Task {
  switch (type) {
    case 0: {
      // Rectangle integral
      const a = 1 + Math.floor(Math.random() * 2);
      const b = 1 + Math.floor(Math.random() * 2);
      // int_0^a int_0^b 1 dy dx = a*b
      return {
        question: <>Berechne <M>{String.raw`\int_0^{${a}}\int_0^{${b}} 1\,dy\,dx`}</M>.</>,
        answer: a * b, tolerance: 0.1,
        hint: `Integral von 1 = Flaeche = ${a} * ${b}`,
      };
    }
    case 1: {
      // int_0^1 int_0^1 (x+y) dy dx
      // = int_0^1 [xy + y^2/2]_0^1 dx = int_0^1 (x + 1/2) dx = 1/2 + 1/2 = 1
      return {
        question: <>Berechne <M>{String.raw`\int_0^1\int_0^1 (x+y)\,dy\,dx`}</M>.</>,
        answer: 1, tolerance: 0.01,
        hint: 'Inneres Integral: xy + y^2/2 von 0 bis 1 = x + 1/2',
      };
    }
    case 2: {
      // Circle area via integral
      const r = [1, 2, 3][Math.floor(Math.random() * 3)];
      return {
        question: <>Flaecheninhalt des Kreises mit Radius {r} (als Doppelintegral)? Runde auf 2 Dezimalen.</>,
        answer: Math.PI * r * r, tolerance: 0.1,
        hint: `A = pi * r^2 = pi * ${r}^2`,
      };
    }
    case 3: {
      // Triangle integral
      // int_0^1 int_0^(1-x) 1 dy dx = 1/2
      return {
        question: <>Berechne <M>{String.raw`\int_0^1\int_0^{1-x} 1\,dy\,dx`}</M>.</>,
        answer: 0.5, tolerance: 0.01,
        hint: 'int_0^1 (1-x) dx = [x - x^2/2]_0^1 = 1/2',
      };
    }
    default: {
      // Jacobian for polar coordinates
      // dA = r dr dtheta, what is the Jacobian?
      return {
        question: <>Wie lautet die Jacobi-Determinante fuer Polarkoordinaten <M>{String.raw`(r, \theta)`}</M>? (Wert bei r=2)</>,
        answer: 2, tolerance: 0.01,
        hint: 'J = r, also bei r=2: J=2',
      };
    }
  }
}

export const IntegralExercises2D: React.FC = () => {
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
