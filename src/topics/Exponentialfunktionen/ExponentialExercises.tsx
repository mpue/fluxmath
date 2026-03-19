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
      // Evaluate e^x for small x
      const x = randInt(-2, 3);
      const y = Math.round(Math.exp(x) * 100) / 100;
      return {
        question: <>Berechne <M>{`e^{${x}}`}</M> (auf 2 Dezimalstellen).</>,
        answer: y,
        tolerance: 0.05,
        hint: `e^${x} = ${y}`,
      };
    }
    case 1: {
      // Find y-intercept of a·e^(kx) + d
      const a = randInt(1, 4) * (Math.random() > 0.5 ? 1 : -1);
      const d = randInt(-3, 3);
      const yInt = a + d;
      return {
        question: <>Bestimme den y-Achsenabschnitt von <M>{`f(x) = ${a} \\cdot e^{x} ${d >= 0 ? '+' : '-'} ${Math.abs(d)}`}</M>.</>,
        answer: yInt,
        tolerance: 0.01,
        hint: `f(0) = ${a}·e⁰ + ${d} = ${a}·1 + ${d} = ${yInt}`,
        unit: 'f(0)',
      };
    }
    case 2: {
      // Asymptote of a·e^(kx) + d
      const a = randInt(1, 3);
      const d = randInt(-5, 5);
      return {
        question: <>Welche horizontale Asymptote hat <M>{`f(x) = ${a} \\cdot e^{x} ${d >= 0 ? '+' : '-'} ${Math.abs(d)}`}</M>?</>,
        answer: d,
        tolerance: 0.01,
        hint: `Für x → -∞ gilt e^x → 0, also f(x) → ${d}`,
        unit: 'y',
      };
    }
    case 3: {
      // Natural logarithm
      const vals = [1, 2, 3, 5, 10];
      const x = vals[randInt(0, 4)];
      const y = Math.round(Math.log(x) * 100) / 100;
      return {
        question: <>Berechne <M>{`\\ln(${x})`}</M> (auf 2 Dezimalstellen).</>,
        answer: y,
        tolerance: 0.05,
        hint: `ln(${x}) ≈ ${y}`,
      };
    }
    case 4: {
      // Growth/decay: is k>0 or k<0?
      const k = randInt(1, 5) * (Math.random() > 0.5 ? 1 : -1);
      const a = randInt(1, 4);
      return {
        question: <>Handelt es sich bei <M>{`f(x) = ${a} \\cdot e^{${k < 0 ? `${k}` : k}x}`}</M> um Wachstum (1) oder Zerfall (-1)?</>,
        answer: k > 0 ? 1 : -1,
        tolerance: 0.01,
        hint: `k = ${k} ${k > 0 ? '> 0 → exponentielles Wachstum' : '< 0 → exponentieller Zerfall'}`,
      };
    }
    case 5:
    default: {
      // Doubling time: solve 2 = e^(kt) → t = ln(2)/k
      const k = [0.1, 0.2, 0.5, 1, 2][randInt(0, 4)];
      const t = Math.round((Math.log(2) / k) * 100) / 100;
      return {
        question: <>Bei <M>{`f(t) = e^{${k}t}`}</M>: Nach welcher Zeit t hat sich der Wert verdoppelt? (auf 2 Dezimalstellen)</>,
        answer: t,
        tolerance: 0.05,
        hint: `2 = e^(${k}·t) → t = ln(2)/${k} ≈ ${t}`,
        unit: 't',
      };
    }
  }
}

export const ExponentialExercises: React.FC = () => {
  const [task, setTask] = useState<Task>(generateTask);
  const [input, setInput] = useState('');
  const [state, setState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const nextTask = useCallback(() => {
    setTask(generateTask());
    setInput('');
    setState('idle');
    setShowHint(false);
  }, []);

  const check = useCallback(() => {
    const val = parseFloat(input.replace(',', '.'));
    if (isNaN(val)) return;
    const isCorrect = Math.abs(val - task.answer) <= task.tolerance;
    setState(isCorrect ? 'correct' : 'wrong');
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
  }, [input, task]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { if (state === 'idle') check(); else nextTask(); }
  }, [state, check, nextTask]);

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
            onKeyDown={handleKey} placeholder="Antwort eingeben…" autoFocus />
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
