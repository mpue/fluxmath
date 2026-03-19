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
      // ∫x^n dx with power rule, evaluate definite integral
      const n = randInt(1, 3);
      const a = randInt(0, 2);
      const b = randInt(a + 1, a + 3);
      const F = (x: number) => Math.pow(x, n + 1) / (n + 1);
      const val = Math.round((F(b) - F(a)) * 100) / 100;
      return {
        question: <>Berechne <M>{`\\int_{${a}}^{${b}} x^{${n}}\\,dx`}</M> (auf 2 Dezimalstellen).</>,
        answer: val,
        tolerance: 0.05,
        hint: `∫x^${n} dx = x^${n + 1}/${n + 1}, [${a},${b}] → ${b}^${n + 1}/${n + 1} - ${a}^${n + 1}/${n + 1} = ${val}`,
      };
    }
    case 1: {
      // ∫(ax + b)dx from c to d
      const a = randInt(1, 4);
      const bCoeff = randInt(-3, 3);
      const c = randInt(0, 2);
      const d = randInt(c + 1, c + 3);
      const val = a * (d * d - c * c) / 2 + bCoeff * (d - c);
      const rounded = Math.round(val * 100) / 100;
      return {
        question: <>Berechne <M>{`\\int_{${c}}^{${d}} (${a}x ${bCoeff >= 0 ? '+' : '-'} ${Math.abs(bCoeff)})\\,dx`}</M>.</>,
        answer: rounded,
        tolerance: 0.05,
        hint: `F(x) = ${a}/2·x² + ${bCoeff}x, F(${d}) - F(${c}) = ${rounded}`,
      };
    }
    case 2: {
      // Area under constant function
      const c = randInt(1, 5);
      const a = randInt(0, 3);
      const b = randInt(a + 1, a + 4);
      const val = c * (b - a);
      return {
        question: <>Berechne die Fläche unter <M>{`f(x) = ${c}`}</M> im Intervall <M>{`[${a}, ${b}]`}</M>.</>,
        answer: val,
        tolerance: 0.01,
        hint: `Fläche = ${c} · (${b} - ${a}) = ${val}`,
      };
    }
    case 3: {
      // Antiderivative identification: F'(x) = f(x)
      const n = randInt(2, 4);
      // F(x) = x^n → F'(x) = nx^(n-1), so f(x) = nx^(n-1), find the exponent in F(x)
      return {
        question: <>Welchen Exponenten hat die Stammfunktion von <M>{`f(x) = x^{${n}}`}</M>?</>,
        answer: n + 1,
        tolerance: 0.01,
        hint: `∫x^${n} dx = x^${n + 1}/${n + 1} + C → Exponent = ${n + 1}`,
      };
    }
    case 4: {
      // Negative area: integral of -c from a to b
      const c = randInt(1, 4);
      const a = randInt(0, 2);
      const b = randInt(a + 1, a + 3);
      const val = -c * (b - a);
      return {
        question: <>Berechne <M>{`\\int_{${a}}^{${b}} (-${c})\\,dx`}</M>. Ist das Ergebnis positiv oder negativ?</>,
        answer: val,
        tolerance: 0.01,
        hint: `∫(-${c})dx = -${c}x, [${a},${b}] → -${c}·${b} - (-${c}·${a}) = ${val}`,
      };
    }
    case 5:
    default: {
      // ∫e^x dx from 0 to a
      const a = randInt(1, 3);
      const val = Math.round((Math.exp(a) - 1) * 100) / 100;
      return {
        question: <>Berechne <M>{`\\int_0^{${a}} e^x\\,dx`}</M> (auf 2 Dezimalstellen).</>,
        answer: val,
        tolerance: 0.1,
        hint: `∫e^x dx = e^x, [0,${a}] → e^${a} - e^0 = ${(Math.exp(a)).toFixed(2)} - 1 = ${val}`,
      };
    }
  }
}

export const IntegralExercises: React.FC = () => {
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
