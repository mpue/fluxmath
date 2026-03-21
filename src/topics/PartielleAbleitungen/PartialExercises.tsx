import React, { useState } from 'react';
import { Math as M } from '../../shared/Math';

interface Task { question: JSX.Element; answer: number; tolerance: number; hint: string }

function generateTask(type: number): Task {
  switch (type) {
    case 0: {
      // Partial derivative f = ax^2 + bxy + cy^2
      const a = 1 + Math.floor(Math.random() * 3);
      const b = 1 + Math.floor(Math.random() * 3);
      const c = 1 + Math.floor(Math.random() * 3);
      const x0 = 1 + Math.floor(Math.random() * 3);
      const y0 = 1 + Math.floor(Math.random() * 3);
      const fx = 2 * a * x0 + b * y0;
      return {
        question: <><M>{String.raw`f(x,y) = ${a}x^2 + ${b}xy + ${c}y^2`}</M>. Berechne <M>{String.raw`f_x(${x0}, ${y0})`}</M>.</>,
        answer: fx, tolerance: 0.1,
        hint: `f_x = ${2 * a}x + ${b}y = ${2 * a}*${x0} + ${b}*${y0}`,
      };
    }
    case 1: {
      // Partial derivative fy
      const a = 1 + Math.floor(Math.random() * 3);
      const b = 1 + Math.floor(Math.random() * 3);
      const c = 1 + Math.floor(Math.random() * 3);
      const x0 = 1 + Math.floor(Math.random() * 3);
      const y0 = 1 + Math.floor(Math.random() * 3);
      const fy = b * x0 + 2 * c * y0;
      return {
        question: <><M>{String.raw`f(x,y) = ${a}x^2 + ${b}xy + ${c}y^2`}</M>. Berechne <M>{String.raw`f_y(${x0}, ${y0})`}</M>.</>,
        answer: fy, tolerance: 0.1,
        hint: `f_y = ${b}x + ${2 * c}y = ${b}*${x0} + ${2 * c}*${y0}`,
      };
    }
    case 2: {
      // Gradient magnitude
      const x0 = [1, 2, -1][Math.floor(Math.random() * 3)];
      const y0 = [1, 2, -1][Math.floor(Math.random() * 3)];
      // f = x^2 + y^2, grad = (2x, 2y)
      const gx = 2 * x0;
      const gy = 2 * y0;
      const mag = Math.sqrt(gx * gx + gy * gy);
      return {
        question: <><M>{String.raw`f = x^2 + y^2`}</M>. Berechne <M>{String.raw`|\nabla f(${x0}, ${y0})|`}</M>.</>,
        answer: mag, tolerance: 0.1,
        hint: `grad = (${gx}, ${gy}), |grad| = sqrt(${gx}^2 + ${gy}^2)`,
      };
    }
    case 3: {
      // Critical point classification
      // f = x^2 + y^2 -> minimum (1)
      // f = x^2 - y^2 -> saddle (0)
      // f = -(x^2+y^2) -> maximum (-1)
      const cases: [string, number, string][] = [
        [String.raw`x^2 + y^2`, 1, 'fxx*fyy - fxy^2 > 0, fxx > 0: Minimum'],
        [String.raw`x^2 - y^2`, 0, 'fxx*fyy - fxy^2 < 0: Sattelpunkt'],
        [String.raw`-(x^2 + y^2)`, -1, 'fxx*fyy - fxy^2 > 0, fxx < 0: Maximum'],
      ];
      const [tex, ans, h] = cases[Math.floor(Math.random() * cases.length)];
      return {
        question: <><M>{String.raw`f = ${tex}`}</M> hat einen kritischen Punkt bei (0,0). Typ? (1=Min, 0=Sattel, -1=Max)</>,
        answer: ans, tolerance: 0,
        hint: h,
      };
    }
    default: {
      // Directional derivative
      const x0 = 1, y0 = 1;
      const gx = 2 * x0, gy = 2 * y0; // f=x^2+y^2
      // Direction (1,0)
      const dirs: [number, number, string][] = [[1, 0, '(1,0)'], [0, 1, '(0,1)'], [1/Math.sqrt(2), 1/Math.sqrt(2), String.raw`\frac{1}{\sqrt{2}}(1,1)`]];
      const [vx, vy, vstr] = dirs[Math.floor(Math.random() * dirs.length)];
      const dd = gx * vx + gy * vy;
      return {
        question: <><M>{String.raw`f = x^2+y^2`}</M>. Richtungsableitung bei (1,1) in Richtung <M>{vstr}</M>?</>,
        answer: dd, tolerance: 0.1,
        hint: `D_v f = grad f * v = (${gx},${gy}) * v`,
      };
    }
  }
}

export const PartialExercises: React.FC = () => {
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
