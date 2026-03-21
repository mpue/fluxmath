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
      // lim (x²-a²)/(x-a) = 2a
      const a = randInt(1, 6);
      return {
        question: <>Berechne <M>{`\\lim_{x \\to ${a}} \\frac{x^2 - ${a * a}}{x - ${a}}`}</M>.</>,
        answer: 2 * a,
        tolerance: 0.01,
        hint: `(x²-${a * a})/(x-${a}) = (x-${a})(x+${a})/(x-${a}) = x+${a}. Fuer x=${a}: ${2 * a}`,
      };
    }
    case 1: {
      // lim (ax+b)/(cx+d) for x→∞ = a/c
      const a = randInt(1, 5);
      const c = randInt(1, 5);
      const b = randInt(-5, 5);
      const d = randInt(-5, 5);
      const answer = Math.round((a / c) * 100) / 100;
      return {
        question: <>Berechne <M>{`\\lim_{x \\to \\infty} \\frac{${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}}{${c}x ${d >= 0 ? '+' : '-'} ${Math.abs(d)}}`}</M> (2 Dezimalstellen).</>,
        answer,
        tolerance: 0.05,
        hint: `Hoechste Potenz kuerzen: ${a}/${c} = ${answer}`,
      };
    }
    case 2: {
      // lim sin(x)/x = 1
      return {
        question: <>Berechne <M>{`\\lim_{x \\to 0} \\frac{\\sin(x)}{x}`}</M>.</>,
        answer: 1,
        tolerance: 0.01,
        hint: `Wichtiger Standardgrenzwert: sin(x)/x -> 1 fuer x -> 0`,
      };
    }
    case 3: {
      // Continuity check: piecewise f(x) = x² for x<2, ax for x≥2 -> a=?
      const x0 = randInt(1, 4);
      // f(x) = x² for x < x0, f(x) = a*x for x >= x0
      // Continuity: x0² = a*x0 -> a = x0
      return {
        question: <>Fuer welchen Wert von a ist <M>{`f(x) = \\begin{cases} x^2 & x < ${x0} \\\\ a \\cdot x & x \\geq ${x0} \\end{cases}`}</M> stetig?</>,
        answer: x0,
        tolerance: 0.01,
        hint: `Stetigkeit: lim von links = f(${x0}). ${x0}² = a*${x0}, also a = ${x0}`,
        unit: 'a',
      };
    }
    case 4: {
      // lim (1+1/n)^n for n→∞
      return {
        question: <>Berechne <M>{`\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n`}</M> (2 Dezimalstellen).</>,
        answer: 2.72,
        tolerance: 0.05,
        hint: `Definitition der Euler-Zahl: (1+1/n)^n -> e ≈ 2.718`,
      };
    }
    case 5:
    default: {
      // lim polynomial ratio with different degrees
      const a = randInt(1, 4);
      const b = randInt(1, 4);
      // lim x→∞ (ax²+1)/(bx²+3) = a/b
      const answer = Math.round((a / b) * 100) / 100;
      return {
        question: <>Berechne <M>{`\\lim_{x \\to \\infty} \\frac{${a}x^2 + 1}{${b}x^2 + 3}`}</M> (2 Dezimalstellen).</>,
        answer,
        tolerance: 0.05,
        hint: `Gleicher Grad im Zaehler und Nenner: ${a}/${b} = ${answer}`,
      };
    }
  }
}

export const GrenzwerteExercises: React.FC = () => {
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
