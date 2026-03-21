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
      // Vector length
      const x = randInt(-4, 4);
      const y = randInt(-4, 4);
      const len = Math.round(Math.sqrt(x * x + y * y) * 100) / 100;
      return {
        question: <>Berechne den Betrag von <M>{`\\vec{a} = \\binom{${x}}{${y}}`}</M> (auf 2 Dezimalstellen).</>,
        answer: len,
        tolerance: 0.05,
        hint: `|a⃗| = √(${x}² + ${y}²) = √${x * x + y * y} ≈ ${len}`,
      };
    }
    case 1: {
      // Dot product
      const ax = randInt(-4, 4), ay = randInt(-4, 4);
      const bx = randInt(-4, 4), by = randInt(-4, 4);
      const dot = ax * bx + ay * by;
      return {
        question: <>Berechne das Skalarprodukt von <M>{`\\vec{a} = \\binom{${ax}}{${ay}}`}</M> und <M>{`\\vec{b} = \\binom{${bx}}{${by}}`}</M>.</>,
        answer: dot,
        tolerance: 0.01,
        hint: `a⃗·b⃗ = ${ax}·${bx} + ${ay}·${by} = ${ax * bx} + ${ay * by} = ${dot}`,
      };
    }
    case 2: {
      // Vector addition: x-component
      const ax = randInt(-5, 5), bx = randInt(-5, 5);
      const ay = randInt(-5, 5), by = randInt(-5, 5);
      const rx = ax + bx;
      return {
        question: <>Berechne die x-Komponente von <M>{`\\vec{a} + \\vec{b}`}</M> mit <M>{`\\vec{a} = \\binom{${ax}}{${ay}}`}</M>, <M>{`\\vec{b} = \\binom{${bx}}{${by}}`}</M>.</>,
        answer: rx,
        tolerance: 0.01,
        hint: `x-Komponente: ${ax} + ${bx} = ${rx}`,
      };
    }
    case 3: {
      // Are vectors orthogonal? (1=yes, 0=no)
      const ortho = Math.random() > 0.5;
      let ax: number, ay: number, bx: number, by: number;
      if (ortho) {
        ax = randInt(1, 4);
        ay = randInt(1, 4);
        bx = -ay;
        by = ax;
      } else {
        ax = randInt(1, 4);
        ay = randInt(1, 4);
        bx = randInt(1, 4);
        by = randInt(1, 4);
        if (ax * bx + ay * by === 0) by += 1;
      }
      const dot = ax * bx + ay * by;
      return {
        question: <>Stehen <M>{`\\vec{a} = \\binom{${ax}}{${ay}}`}</M> und <M>{`\\vec{b} = \\binom{${bx}}{${by}}`}</M> senkrecht? (1 = ja, 0 = nein)</>,
        answer: dot === 0 ? 1 : 0,
        tolerance: 0.01,
        hint: `a⃗·b⃗ = ${dot}. ${dot === 0 ? 'Skalarprodukt = 0 → senkrecht!' : 'Skalarprodukt ≠ 0 → nicht senkrecht'}`,
      };
    }
    case 4: {
      // Scalar multiplication: y-component
      const s = randInt(-3, 3) || 1;
      const x = randInt(-4, 4);
      const y = randInt(-4, 4);
      return {
        question: <>Berechne die y-Komponente von <M>{`${s} \\cdot \\binom{${x}}{${y}}`}</M>.</>,
        answer: s * y,
        tolerance: 0.01,
        hint: `${s} · ${y} = ${s * y}`,
      };
    }
    case 5:
    default: {
      // Angle between vectors
      const ax = randInt(1, 4), ay = 0;
      const bx = randInt(0, 3), by = randInt(1, 4);
      const dot = ax * bx + ay * by;
      const la = Math.sqrt(ax * ax + ay * ay);
      const lb = Math.sqrt(bx * bx + by * by);
      const angle = Math.round(Math.acos(dot / (la * lb)) * 180 / Math.PI * 10) / 10;
      return {
        question: <>Berechne den Winkel zwischen <M>{`\\vec{a} = \\binom{${ax}}{${ay}}`}</M> und <M>{`\\vec{b} = \\binom{${bx}}{${by}}`}</M> in Grad (1 Dezimalstelle).</>,
        answer: angle,
        tolerance: 0.5,
        hint: `cos(φ) = (a⃗·b⃗)/(|a⃗|·|b⃗|) = ${dot}/(${la.toFixed(2)}·${lb.toFixed(2)}) → φ ≈ ${angle}°`,
        unit: 'φ',
      };
    }
  }
}

export const VectorExercises: React.FC = () => {
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
