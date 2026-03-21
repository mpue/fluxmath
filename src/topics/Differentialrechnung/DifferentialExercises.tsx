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
      // Power rule: (x^n)' at a point
      const n = randInt(2, 5);
      const x = randInt(-3, 3) || 1;
      const y = n * Math.pow(x, n - 1);
      return {
        question: <>Gegeben: <M>{`f(x) = x^{${n}}`}</M>. Berechne <M>{`f'(${x})`}</M>.</>,
        answer: y,
        tolerance: 0.01,
        hint: `f'(x) = ${n}x^${n - 1}, f'(${x}) = ${n}·(${x})^${n - 1} = ${y}`,
        unit: "f'(" + x + ")",
      };
    }
    case 1: {
      // Derivative of ax² + bx + c → find f'(x₀)
      const a = randInt(-3, 3) || 1;
      const b = randInt(-5, 5);
      const x = randInt(-3, 3);
      const fp = 2 * a * x + b;
      return {
        question: <>Gegeben: <M>{`f(x) = ${a}x^2 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x`}</M>. Berechne <M>{`f'(${x})`}</M>.</>,
        answer: fp,
        tolerance: 0.01,
        hint: `f'(x) = ${2 * a}x + ${b}, f'(${x}) = ${2 * a}·${x} + ${b} = ${fp}`,
        unit: "f'(" + x + ")",
      };
    }
    case 2: {
      // Where is f'(x) = 0? (extremum of ax² + bx + c)
      const a = randInt(1, 3) * (Math.random() > 0.5 ? 1 : -1);
      const b = randInt(-6, 6);
      const x0 = -b / (2 * a);
      return {
        question: <>Bestimme die Extremstelle von <M>{`f(x) = ${a}x^2 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x`}</M>.</>,
        answer: x0,
        tolerance: 0.1,
        hint: `f'(x) = ${2 * a}x + ${b} = 0 → x = ${-b}/${2 * a} = ${x0.toFixed(2)}`,
        unit: 'x₀',
      };
    }
    case 3: {
      // Is it a max or min? a > 0 → min (answer 1), a < 0 → max (answer -1)
      const a = randInt(1, 3) * (Math.random() > 0.5 ? 1 : -1);
      const b = randInt(-4, 4);
      const c = randInt(-3, 3);
      return {
        question: <>Hat <M>{`f(x) = ${a}x^2 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c)}`}</M> ein Minimum (1) oder Maximum (-1)?</>,
        answer: a > 0 ? 1 : -1,
        tolerance: 0.01,
        hint: `f''(x) = ${2 * a}. ${2 * a > 0 ? 'f\'\' > 0 → Minimum' : 'f\'\' < 0 → Maximum'}`,
      };
    }
    case 4: {
      // Tangent slope = derivative value
      const a = randInt(-2, 2) || 1;
      const b = randInt(-3, 3);
      const c = randInt(-3, 3);
      const x = randInt(-2, 2);
      const slope = 3 * a * x * x + 2 * b * x + c;
      return {
        question: <>Bestimme die Tangentensteigung von <M>{`f(x) = ${a}x^3 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x^2 ${c >= 0 ? '+' : '-'} ${Math.abs(c)}x`}</M> bei <M>{`x = ${x}`}</M>.</>,
        answer: slope,
        tolerance: 0.1,
        hint: `f'(x) = ${3 * a}x² + ${2 * b}x + ${c}, f'(${x}) = ${slope}`,
        unit: 'm',
      };
    }
    case 5:
    default: {
      // Derivative of e^x at a point
      const x = randInt(-2, 3);
      const y = Math.round(Math.exp(x) * 100) / 100;
      return {
        question: <>Gegeben: <M>{'f(x) = e^x'}</M>. Berechne <M>{`f'(${x})`}</M> (auf 2 Dezimalstellen).</>,
        answer: y,
        tolerance: 0.05,
        hint: `f'(x) = e^x, f'(${x}) = e^${x} ≈ ${y}`,
        unit: "f'(" + x + ")",
      };
    }
  }
}

export const DifferentialExercises: React.FC = () => {
  const [task, setTask] = useState<Task>(generateTask);
  const [input, setInput] = useState('');
  const [state, setState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const nextTask = useCallback(() => { setTask(generateTask()); setInput(''); setState('idle'); setShowHint(false); }, []);
  const check = useCallback(() => {
    const val = parseFloat(input.replace(',', '.'));
    if (isNaN(val)) return;
    setState(Math.abs(val - task.answer) <= task.tolerance ? 'correct' : 'wrong');
    setScore(s => ({ correct: s.correct + (Math.abs(val - task.answer) <= task.tolerance ? 1 : 0), total: s.total + 1 }));
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
            onKeyDown={handleKey} placeholder="Antwort eingeben…" />
          {state === 'idle'
            ? <button className="exercise-btn check" onClick={check}>Prüfen</button>
            : <button className="exercise-btn next" onClick={nextTask}>Nächste →</button>}
        </div>
        {state === 'correct' && <div className="exercise-feedback correct">✓ Richtig!</div>}
        {state === 'wrong' && <div className="exercise-feedback wrong">✗ Leider falsch — die richtige Antwort ist <strong>{task.answer % 1 === 0 ? task.answer : task.answer.toFixed(2)}</strong></div>}
        {state === 'idle' && <button className="exercise-hint-toggle" onClick={() => setShowHint(!showHint)}>{showHint ? 'Hinweis ausblenden' : '💡 Hinweis anzeigen'}</button>}
        {showHint && state === 'idle' && <div className="exercise-hint">{task.hint}</div>}
      </div>
    </div>
  );
};
