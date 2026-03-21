import React, { useState } from 'react';
import { Math as M } from '../../shared/Math';

interface Task { question: JSX.Element; answer: number; tolerance: number; hint: string }

function factorial(n: number): number { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; }

function generateTask(type: number): Task {
  switch (type) {
    case 0: {
      // Taylor coefficient of e^x
      const n = 2 + Math.floor(Math.random() * 5); // 2..6
      const coeff = 1 / factorial(n);
      return {
        question: <><M>{String.raw`e^x`}</M>: Wie lautet der Koeffizient <M>{String.raw`a_{${n}}`}</M> der Taylor-Reihe um 0? (Dezimalzahl)</>,
        answer: coeff, tolerance: 0.0005,
        hint: `a_n = 1/n! = 1/${factorial(n)}`,
      };
    }
    case 1: {
      // Value of Taylor polynomial
      const x = [0.5, 1, -0.5, 0.1][Math.floor(Math.random() * 4)];
      const n = 2 + Math.floor(Math.random() * 3);
      let s = 0, t = 1;
      for (let k = 0; k <= n; k++) { s += t; t *= x / (k + 1); }
      return {
        question: <>Berechne <M>{String.raw`T_{${n}}(${x})`}</M> fuer <M>e^x</M> um <M>x_0=0</M>.</>,
        answer: s, tolerance: 0.01,
        hint: `Summiere x^k/k! fuer k=0,...,${n}`,
      };
    }
    case 2: {
      // Convergence radius
      const funcs: [string, number][] = [
        [String.raw`\sum \frac{x^k}{k!}`, Infinity],
        [String.raw`\sum \frac{x^k}{k}`, 1],
        [String.raw`\sum k! \cdot x^k`, 0],
        [String.raw`\sum \frac{x^k}{2^k}`, 2],
        [String.raw`\sum \frac{x^k}{k^2}`, 1],
      ];
      const [tex, r] = funcs[Math.floor(Math.random() * funcs.length)];
      const rDisp = r === Infinity ? 999 : r;
      return {
        question: <>Bestimme den Konvergenzradius R der Reihe <M>{tex}</M>. (Fuer unendlich: 999)</>,
        answer: rDisp, tolerance: 0.01,
        hint: 'Verwende das Quotientenkriterium: R = lim |a_k / a_{k+1}|',
      };
    }
    case 3: {
      // sin Taylor
      const terms = 1 + Math.floor(Math.random() * 3); // 1..3
      const x = [Math.PI / 6, Math.PI / 4, Math.PI / 3][Math.floor(Math.random() * 3)];
      const xLabel = [String.raw`\pi/6`, String.raw`\pi/4`, String.raw`\pi/3`][[Math.PI / 6, Math.PI / 4, Math.PI / 3].indexOf(x)];
      let s = 0;
      for (let k = 0; k < terms; k++) {
        const exp = 2 * k + 1;
        s += (k % 2 === 0 ? 1 : -1) * Math.pow(x, exp) / factorial(exp);
      }
      return {
        question: <>Berechne die Taylor-Approximation von <M>{String.raw`\sin(${xLabel})`}</M> mit {terms} Term(en).</>,
        answer: s, tolerance: 0.01,
        hint: `sin(x) ~ x - x^3/6 + x^5/120 - ...`,
      };
    }
    default: {
      const n = 1 + Math.floor(Math.random() * 5);
      return {
        question: <>Was ist <M>{String.raw`${n}!`}</M>?</>,
        answer: factorial(n), tolerance: 0.1,
        hint: `n! = 1*2*...*n`,
      };
    }
  }
}

export const TaylorExercises: React.FC = () => {
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
