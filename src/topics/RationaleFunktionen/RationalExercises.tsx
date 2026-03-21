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
      // Vertical asymptote of (ax+b)/(cx+d)
      const c = randInt(1, 4) * (Math.random() > 0.5 ? 1 : -1);
      const d = randInt(-5, 5);
      const a = randInt(1, 3);
      const b = randInt(-4, 4);
      const va = Math.round((-d / c) * 100) / 100;
      return {
        question: <>Bestimme die Polstelle von <M>{`f(x) = \\frac{${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}}{${c}x ${d >= 0 ? '+' : '-'} ${Math.abs(d)}}`}</M> (auf 2 Dez.).</>,
        answer: va,
        tolerance: 0.05,
        hint: `Nenner = 0: ${c}x + ${d} = 0 → x = ${-d}/${c} = ${va}`,
        unit: 'x',
      };
    }
    case 1: {
      // Horizontal asymptote
      const a = randInt(1, 5) * (Math.random() > 0.5 ? 1 : -1);
      const c = randInt(1, 4) * (Math.random() > 0.5 ? 1 : -1);
      const b = randInt(-3, 3);
      const d = randInt(-3, 3);
      const ha = Math.round((a / c) * 100) / 100;
      return {
        question: <>Welche horizontale Asymptote hat <M>{`f(x) = \\frac{${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}}{${c}x ${d >= 0 ? '+' : '-'} ${Math.abs(d)}}`}</M>?</>,
        answer: ha,
        tolerance: 0.05,
        hint: `y = a/c = ${a}/${c} = ${ha}`,
        unit: 'y',
      };
    }
    case 2: {
      // Zero of (ax+b)/(cx+d)
      const a = randInt(1, 4) * (Math.random() > 0.5 ? 1 : -1);
      const b = randInt(-5, 5);
      const c = randInt(1, 3);
      const d = randInt(1, 5);
      const zero = Math.round((-b / a) * 100) / 100;
      return {
        question: <>Bestimme die Nullstelle von <M>{`f(x) = \\frac{${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}}{${c}x + ${d}}`}</M> (auf 2 Dez.).</>,
        answer: zero,
        tolerance: 0.05,
        hint: `Zähler = 0: ${a}x + ${b} = 0 → x = ${-b}/${a} = ${zero}`,
        unit: 'x₀',
      };
    }
    case 3: {
      // y-intercept f(0)
      const a = randInt(-3, 3);
      const b = randInt(-5, 5);
      const c = randInt(-3, 3);
      const d = randInt(1, 5) * (Math.random() > 0.5 ? 1 : -1);
      const yInt = Math.round((b / d) * 100) / 100;
      return {
        question: <>Berechne den y-Achsenabschnitt von <M>{`f(x) = \\frac{${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}}{${c}x ${d >= 0 ? '+' : '-'} ${Math.abs(d)}}`}</M> (auf 2 Dez.).</>,
        answer: yInt,
        tolerance: 0.05,
        hint: `f(0) = b/d = ${b}/${d} = ${yInt}`,
        unit: 'f(0)',
      };
    }
    case 4: {
      // Evaluate f(x) at a given point
      const a = randInt(1, 3);
      const b = randInt(-4, 4);
      const c = randInt(1, 2);
      const d = randInt(1, 5);
      const x = randInt(1, 4);
      const val = Math.round(((a * x + b) / (c * x + d)) * 100) / 100;
      return {
        question: <>Berechne <M>{`f(${x})`}</M> für <M>{`f(x) = \\frac{${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}}{${c}x + ${d}}`}</M> (auf 2 Dez.).</>,
        answer: val,
        tolerance: 0.05,
        hint: `f(${x}) = (${a}·${x} + ${b})/(${c}·${x} + ${d}) = ${a * x + b}/${c * x + d} = ${val}`,
        unit: `f(${x})`,
      };
    }
    case 5:
    default: {
      // Number of vertical asymptotes of (x)/(x²-a²) — has 2 poles
      const a = randInt(1, 4);
      return {
        question: <>Wie viele Polstellen hat <M>{`f(x) = \\frac{x}{x^2 - ${a * a}}`}</M>?</>,
        answer: 2,
        tolerance: 0.01,
        hint: `x² - ${a * a} = (x-${a})(x+${a}) = 0 → x = ±${a}, also 2 Polstellen`,
      };
    }
  }
}

export const RationalExercises: React.FC = () => {
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
