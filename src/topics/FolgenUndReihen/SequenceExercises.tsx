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
  const type = randInt(0, 6);

  switch (type) {
    case 0: {
      // n-th term of arithmetic sequence
      const a1 = randInt(-3, 5);
      const d = randInt(-3, 3) || 1;
      const n = randInt(5, 15);
      const an = a1 + (n - 1) * d;
      return {
        question: <>Arithmetische Folge mit <M>{`a_1 = ${a1}`}</M>, <M>{`d = ${d}`}</M>. Berechne <M>{`a_{${n}}`}</M>.</>,
        answer: an,
        tolerance: 0.01,
        hint: `a_n = a₁ + (n-1)·d = ${a1} + ${n - 1}·${d} = ${an}`,
        unit: `a${n}`,
      };
    }
    case 1: {
      // Partial sum of arithmetic sequence
      const a1 = randInt(1, 5);
      const d = randInt(1, 3);
      const N = randInt(5, 10);
      const aN = a1 + (N - 1) * d;
      const S = N * (a1 + aN) / 2;
      return {
        question: <>Berechne die Partialsumme <M>{`S_{${N}}`}</M> der arithmetischen Folge mit <M>{`a_1 = ${a1}`}</M>, <M>{`d = ${d}`}</M>.</>,
        answer: S,
        tolerance: 0.01,
        hint: `S_N = N/2·(a₁ + a_N) = ${N}/2·(${a1} + ${aN}) = ${S}`,
        unit: 'S',
      };
    }
    case 2: {
      // n-th term of geometric sequence
      const a1 = randInt(1, 4);
      const r = [2, 3, 0.5][randInt(0, 2)];
      const n = randInt(3, 6);
      const an = Math.round(a1 * Math.pow(r, n - 1) * 100) / 100;
      return {
        question: <>Geometrische Folge mit <M>{`a_1 = ${a1}`}</M>, <M>{`r = ${r}`}</M>. Berechne <M>{`a_{${n}}`}</M>.</>,
        answer: an,
        tolerance: 0.05,
        hint: `a_n = a₁·r^(n-1) = ${a1}·${r}^${n - 1} = ${an}`,
        unit: `a${n}`,
      };
    }
    case 3: {
      // Infinite sum of geometric series |r| < 1
      const a1 = randInt(1, 5);
      const r = [0.5, 0.25, 0.1, 0.2][randInt(0, 3)];
      const S = a1 / (1 - r);
      return {
        question: <>Berechne <M>{'S_\\infty'}</M> der geometrischen Reihe mit <M>{`a_1 = ${a1}`}</M>, <M>{`r = ${r}`}</M> (auf 2 Dez.).</>,
        answer: Math.round(S * 100) / 100,
        tolerance: 0.05,
        hint: `S∞ = a₁/(1-r) = ${a1}/(1-${r}) = ${S.toFixed(2)}`,
        unit: 'S∞',
      };
    }
    case 4: {
      // Find d given two terms
      const a1 = randInt(-3, 5);
      const d = randInt(-3, 3) || 1;
      const n = randInt(5, 10);
      const an = a1 + (n - 1) * d;
      return {
        question: <>Arithmetische Folge: <M>{`a_1 = ${a1}`}</M>, <M>{`a_{${n}} = ${an}`}</M>. Bestimme d.</>,
        answer: d,
        tolerance: 0.01,
        hint: `d = (a_n - a₁)/(n-1) = (${an} - ${a1})/${n - 1} = ${d}`,
        unit: 'd',
      };
    }
    case 5: {
      // Fibonacci: which number?
      const fibs = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
      const idx = randInt(5, 10);
      return {
        question: <>Wie lautet die {idx + 1}. Fibonacci-Zahl? (F₁ = 1, F₂ = 1, F₃ = 2, …)</>,
        answer: fibs[idx],
        tolerance: 0.01,
        hint: `Fibonacci: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89 → F${idx + 1} = ${fibs[idx]}`,
      };
    }
    case 6:
    default: {
      // Does geometric series converge? (1=yes, 0=no)
      const r = [-1.5, -0.5, 0.5, 0.9, 1, 1.5, 2][randInt(0, 6)];
      const conv = Math.abs(r) < 1;
      return {
        question: <>Konvergiert die geometrische Reihe mit <M>{`r = ${r}`}</M>? (1 = ja, 0 = nein)</>,
        answer: conv ? 1 : 0,
        tolerance: 0.01,
        hint: `|r| = ${Math.abs(r)} ${conv ? '< 1 → konvergent' : '>= 1 → divergent'}`,
      };
    }
  }
}

export const SequenceExercises: React.FC = () => {
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
