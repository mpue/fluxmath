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
      // Modulus of complex number
      const a = randInt(-5, 5);
      const b = randInt(-5, 5);
      const r = Math.round(Math.sqrt(a * a + b * b) * 100) / 100;
      return {
        question: <>Berechne <M>{`|${a} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}i|`}</M> (auf 2 Dezimalstellen).</>,
        answer: r,
        tolerance: 0.05,
        hint: `|z| = √(${a}² + ${b}²) = √${a * a + b * b} ≈ ${r}`,
      };
    }
    case 1: {
      // Real part of product
      const a1 = randInt(-3, 3), b1 = randInt(-3, 3);
      const a2 = randInt(-3, 3), b2 = randInt(-3, 3);
      const re = a1 * a2 - b1 * b2;
      return {
        question: <>Berechne den Realteil von <M>{`(${a1} ${b1 >= 0 ? '+' : '-'} ${Math.abs(b1)}i) \\cdot (${a2} ${b2 >= 0 ? '+' : '-'} ${Math.abs(b2)}i)`}</M>.</>,
        answer: re,
        tolerance: 0.01,
        hint: `Re = a₁a₂ - b₁b₂ = ${a1}·${a2} - ${b1}·${b2} = ${a1 * a2} - ${b1 * b2} = ${re}`,
        unit: 'Re',
      };
    }
    case 2: {
      // Imaginary part of product
      const a1 = randInt(-3, 3), b1 = randInt(-3, 3);
      const a2 = randInt(-3, 3), b2 = randInt(-3, 3);
      const im = a1 * b2 + b1 * a2;
      return {
        question: <>Berechne den Imaginärteil von <M>{`(${a1} ${b1 >= 0 ? '+' : '-'} ${Math.abs(b1)}i) \\cdot (${a2} ${b2 >= 0 ? '+' : '-'} ${Math.abs(b2)}i)`}</M>.</>,
        answer: im,
        tolerance: 0.01,
        hint: `Im = a₁b₂ + b₁a₂ = ${a1}·${b2} + ${b1}·${a2} = ${a1 * b2} + ${b1 * a2} = ${im}`,
        unit: 'Im',
      };
    }
    case 3: {
      // Conjugate: imaginary part of z̄
      const a = randInt(-5, 5);
      const b = randInt(-5, 5);
      return {
        question: <>Wie lautet der Imaginärteil der konjugiert komplexen Zahl <M>{`\\overline{${a} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}i}`}</M>?</>,
        answer: -b,
        tolerance: 0.01,
        hint: `z̄ = ${a} ${-b >= 0 ? '+' : '-'} ${Math.abs(b)}i → Im(z̄) = ${-b}`,
        unit: 'Im',
      };
    }
    case 4: {
      // z · z̄ = |z|²
      const a = randInt(-4, 4);
      const b = randInt(-4, 4);
      const zz = a * a + b * b;
      return {
        question: <>Berechne <M>{`z \\cdot \\bar{z}`}</M> für <M>{`z = ${a} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}i`}</M>.</>,
        answer: zz,
        tolerance: 0.01,
        hint: `z·z̄ = |z|² = ${a}² + ${b}² = ${zz}`,
      };
    }
    case 5:
    default: {
      // Argument (angle) in degrees
      const angles = [0, 45, 90, 135, 180];
      const deg = angles[randInt(0, 4)];
      const rad = deg * Math.PI / 180;
      const a = Math.round(Math.cos(rad) * 10) / 10;
      const b = Math.round(Math.sin(rad) * 10) / 10;
      const label = a === 0 && b === 0 ? '0' : `${a} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}i`;
      return {
        question: <>Bestimme das Argument (in Grad) von <M>{`z = ${label}`}</M>.</>,
        answer: deg,
        tolerance: 1,
        hint: `φ = arctan(${b}/${a}) = ${deg}°`,
        unit: 'φ',
      };
    }
  }
}

export const ComplexExercises: React.FC = () => {
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
