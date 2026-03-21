import React, { useState, useCallback } from 'react';
import { Math as M } from '../../shared/Math';

interface Task {
  question: React.ReactNode;
  answer: number;
  tolerance: number;
  hint: string;
  unit?: string;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTask(): Task {
  const type = randInt(0, 5);
  switch (type) {
    case 0: {
      // y-intercept: f(0) = d
      const a = randInt(-3, 3);
      const b = randInt(-4, 4);
      const c = randInt(-5, 5);
      const d = randInt(-5, 5);
      return {
        question: <>Berechne den y-Achsenabschnitt von <M>{`f(x) = ${a}x^3 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x^2 ${c >= 0 ? '+' : '-'} ${Math.abs(c)}x ${d >= 0 ? '+' : '-'} ${Math.abs(d)}`}</M>.</>,
        answer: d,
        tolerance: 0.01,
        hint: `f(0) = ${d}`,
        unit: 'f(0)',
      };
    }
    case 1: {
      // Derivative at a point
      const a = randInt(-2, 2) || 1;
      const b = randInt(-3, 3);
      const c = randInt(-4, 4);
      const x0 = randInt(-2, 2);
      const fPrime = 3 * a * x0 * x0 + 2 * b * x0 + c;
      return {
        question: <>Berechne f'({x0}) fuer <M>{`f(x) = ${a}x^3 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x^2 ${c >= 0 ? '+' : '-'} ${Math.abs(c)}x`}</M>.</>,
        answer: fPrime,
        tolerance: 0.01,
        hint: `f'(x) = ${3 * a}x² ${2 * b >= 0 ? '+' : '-'} ${Math.abs(2 * b)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c)}. f'(${x0}) = ${fPrime}`,
        unit: "f'",
      };
    }
    case 2: {
      // Second derivative at point (inflection test)
      const a = randInt(-2, 2) || 1;
      const b = randInt(-3, 3);
      const x0 = randInt(-2, 3);
      const f2 = 6 * a * x0 + 2 * b;
      return {
        question: <>Berechne f''({x0}) fuer <M>{`f(x) = ${a}x^3 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x^2`}</M>.</>,
        answer: f2,
        tolerance: 0.01,
        hint: `f''(x) = ${6 * a}x ${2 * b >= 0 ? '+' : '-'} ${Math.abs(2 * b)}. f''(${x0}) = ${f2}`,
        unit: "f''",
      };
    }
    case 3: {
      // Inflection point x-coordinate: f''(x) = 0 => x = -b/(3a)
      const a = randInt(1, 3);
      const b = randInt(-6, 6);
      const xw = Math.round((-b / (3 * a)) * 100) / 100;
      return {
        question: <>Bestimme die x-Koordinate des Wendepunkts von <M>{`f(x) = ${a}x^3 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x^2`}</M> (2 Dezimalstellen).</>,
        answer: xw,
        tolerance: 0.05,
        hint: `f''(x) = ${6 * a}x ${2 * b >= 0 ? '+' : '-'} ${Math.abs(2 * b)} = 0 => x = ${-2 * b}/${6 * a} = ${xw}`,
        unit: 'x_W',
      };
    }
    case 4: {
      // Symmetry: is f(-x) = f(x) (even) or f(-x) = -f(x) (odd)?
      // Give a function and ask: 1 = achsensymmetrisch, 2 = punktsymmetrisch, 0 = keine
      const variant = randInt(0, 2);
      if (variant === 0) {
        // even: only even powers
        const a = randInt(1, 3);
        const b = randInt(-4, 4);
        return {
          question: <>Welche Symmetrie hat <M>{`f(x) = ${a}x^4 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x^2`}</M>? (1=achsen, 2=punkt, 0=keine)</>,
          answer: 1,
          tolerance: 0.01,
          hint: `Nur gerade Exponenten -> f(-x) = f(x) -> achsensymmetrisch (1)`,
        };
      } else if (variant === 1) {
        // odd: only odd powers
        const a = randInt(1, 3);
        const c = randInt(-3, 3);
        return {
          question: <>Welche Symmetrie hat <M>{`f(x) = ${a}x^3 ${c >= 0 ? '+' : '-'} ${Math.abs(c)}x`}</M>? (1=achsen, 2=punkt, 0=keine)</>,
          answer: 2,
          tolerance: 0.01,
          hint: `Nur ungerade Exponenten -> f(-x) = -f(x) -> punktsymmetrisch (2)`,
        };
      } else {
        const a = randInt(1, 2);
        const b = randInt(1, 3);
        const c = randInt(-3, 3) || 1;
        return {
          question: <>Welche Symmetrie hat <M>{`f(x) = ${a}x^3 + ${b}x^2 ${c >= 0 ? '+' : '-'} ${Math.abs(c)}x`}</M>? (1=achsen, 2=punkt, 0=keine)</>,
          answer: 0,
          tolerance: 0.01,
          hint: `Gemischte Exponenten -> keine besondere Symmetrie (0)`,
        };
      }
    }
    case 5:
    default: {
      // Determine min or max from f' and f''
      const a = randInt(1, 2);
      const b = randInt(-4, 4);
      const c = -3 * a * 4 + 2 * b * (-2); // ensure real critical points at simple values
      // Just use f(x) = ax²+bx+c (quadratic for simplicity)
      const a2 = randInt(1, 3) * (Math.random() > 0.5 ? 1 : -1);
      const b2 = randInt(-6, 6);
      const xExt = Math.round((-b2 / (2 * a2)) * 100) / 100;
      const typeStr = a2 > 0 ? 'Minimum' : 'Maximum';
      return {
        question: <>Bestimme die x-Koordinate des Extremums von <M>{`f(x) = ${a2}x^2 ${b2 >= 0 ? '+' : '-'} ${Math.abs(b2)}x`}</M> und gib sie ein (2 Dezimalstellen). Es handelt sich um ein {typeStr}.</>,
        answer: xExt,
        tolerance: 0.05,
        hint: `f'(x) = ${2 * a2}x ${b2 >= 0 ? '+' : '-'} ${Math.abs(b2)} = 0 => x = ${-b2}/${2 * a2} = ${xExt}`,
        unit: 'x_E',
      };
    }
  }
}

export const KurvendiskussionExercises: React.FC = () => {
  const [task, setTask] = useState<Task>(generateTask);
  const [input, setInput] = useState('');
  const [state, setState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const nextTask = useCallback(() => { setTask(generateTask()); setInput(''); setState('idle'); setShowHint(false); }, []);
  const check = useCallback(() => {
    const val = parseFloat(input.replace(',', '.'));
    if (isNaN(val)) return;
    const ok = Math.abs(val - task.answer) <= task.tolerance;
    setState(ok ? 'correct' : 'wrong');
    setScore(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
  }, [input, task]);
  const handleKey = useCallback((e: React.KeyboardEvent) => { if (e.key === 'Enter') { if (state === 'idle') check(); else nextTask(); } }, [state, check, nextTask]);
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
          {task.unit && <span className="exercise-unit">{task.unit} =</span>}
          <input className={`exercise-input ${state}`} type="text" inputMode="decimal" value={input}
            onChange={e => { setInput(e.target.value); if (state !== 'idle') setState('idle'); }}
            onKeyDown={handleKey} placeholder="Antwort eingeben..." />
          {state === 'idle'
            ? <button className="exercise-btn check" onClick={check}>Pruefen</button>
            : <button className="exercise-btn next" onClick={nextTask}>Naechste &rarr;</button>}
        </div>
        {state === 'correct' && <div className="exercise-feedback correct">Richtig!</div>}
        {state === 'wrong' && <div className="exercise-feedback wrong">Leider falsch — die richtige Antwort ist <strong>{task.answer % 1 === 0 ? task.answer : task.answer.toFixed(2)}</strong></div>}
        {state === 'idle' && <button className="exercise-hint-toggle" onClick={() => setShowHint(!showHint)}>{showHint ? 'Hinweis ausblenden' : 'Hinweis anzeigen'}</button>}
        {showHint && state === 'idle' && <div className="exercise-hint">{task.hint}</div>}
      </div>
    </div>
  );
};
