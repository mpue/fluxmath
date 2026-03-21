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
      // Determinant of 2x2
      const a = randInt(-4, 4), b = randInt(-4, 4);
      const c = randInt(-4, 4), d = randInt(-4, 4);
      const det = a * d - b * c;
      return {
        question: <>Berechne <M>{`\\det\\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}`}</M>.</>,
        answer: det,
        tolerance: 0.01,
        hint: `det = ${a}·${d} - ${b}·${c} = ${a * d} - ${b * c} = ${det}`,
      };
    }
    case 1: {
      // Matrix addition: one element
      const a = randInt(-5, 5), b = randInt(-5, 5);
      const c = randInt(-5, 5), d = randInt(-5, 5);
      const pos = randInt(0, 3);
      const labels = ['(1,1)', '(1,2)', '(2,1)', '(2,2)'];
      const vals = [a + c, a + d, b + c, b + d]; // Incorrect — need proper addition
      const a11 = randInt(-4, 4), a12 = randInt(-4, 4);
      const a21 = randInt(-4, 4), a22 = randInt(-4, 4);
      const b11 = randInt(-4, 4), b12 = randInt(-4, 4);
      const b21 = randInt(-4, 4), b22 = randInt(-4, 4);
      const sums = [a11 + b11, a12 + b12, a21 + b21, a22 + b22];
      const idx = randInt(0, 3);
      const posLabels = ['(1,1)', '(1,2)', '(2,1)', '(2,2)'];
      return {
        question: <>Berechne das Element {posLabels[idx]} von{' '}
          <M>{`\\begin{pmatrix} ${a11} & ${a12} \\\\ ${a21} & ${a22} \\end{pmatrix} + \\begin{pmatrix} ${b11} & ${b12} \\\\ ${b21} & ${b22} \\end{pmatrix}`}</M>.</>,
        answer: sums[idx],
        tolerance: 0.01,
        hint: `Element ${posLabels[idx]}: ${[a11, a12, a21, a22][idx]} + ${[b11, b12, b21, b22][idx]} = ${sums[idx]}`,
      };
    }
    case 2: {
      // Matrix multiplication: one element
      const a11 = randInt(-3, 3), a12 = randInt(-3, 3);
      const a21 = randInt(-3, 3), a22 = randInt(-3, 3);
      const b11 = randInt(-3, 3), b12 = randInt(-3, 3);
      const b21 = randInt(-3, 3), b22 = randInt(-3, 3);
      const prods = [
        a11 * b11 + a12 * b21, a11 * b12 + a12 * b22,
        a21 * b11 + a22 * b21, a21 * b12 + a22 * b22,
      ];
      const idx = randInt(0, 3);
      const posLabels = ['(1,1)', '(1,2)', '(2,1)', '(2,2)'];
      return {
        question: <>Berechne das Element {posLabels[idx]} von{' '}
          <M>{`\\begin{pmatrix} ${a11} & ${a12} \\\\ ${a21} & ${a22} \\end{pmatrix} \\cdot \\begin{pmatrix} ${b11} & ${b12} \\\\ ${b21} & ${b22} \\end{pmatrix}`}</M>.</>,
        answer: prods[idx],
        tolerance: 0.01,
        hint: `Zeile · Spalte = ${prods[idx]}`,
      };
    }
    case 3: {
      // Transpose element
      const a11 = randInt(-5, 5), a12 = randInt(-5, 5);
      const a21 = randInt(-5, 5), a22 = randInt(-5, 5);
      const tElems = [a11, a21, a12, a22]; // transposed
      const idx = randInt(0, 3);
      const posLabels = ['(1,1)', '(1,2)', '(2,1)', '(2,2)'];
      return {
        question: <>Welchen Wert hat das Element {posLabels[idx]} der transponierten Matrix{' '}
          <M>{`\\begin{pmatrix} ${a11} & ${a12} \\\\ ${a21} & ${a22} \\end{pmatrix}^T`}</M>?</>,
        answer: tElems[idx],
        tolerance: 0.01,
        hint: `Aᵀ = (${a11}, ${a21} | ${a12}, ${a22}), Element ${posLabels[idx]} = ${tElems[idx]}`,
      };
    }
    case 4: {
      // Trace
      const a11 = randInt(-5, 5), a22 = randInt(-5, 5);
      const a12 = randInt(-5, 5), a21 = randInt(-5, 5);
      return {
        question: <>Berechne die Spur von <M>{`\\begin{pmatrix} ${a11} & ${a12} \\\\ ${a21} & ${a22} \\end{pmatrix}`}</M>.</>,
        answer: a11 + a22,
        tolerance: 0.01,
        hint: `Spur = a₁₁ + a₂₂ = ${a11} + ${a22} = ${a11 + a22}`,
      };
    }
    case 5: {
      // Is matrix invertible? (det != 0 → 1, else 0)
      const inv = Math.random() > 0.4;
      let a11: number, a12: number, a21: number, a22: number;
      if (inv) {
        a11 = randInt(1, 4); a12 = randInt(-3, 3);
        a21 = randInt(-3, 3); a22 = randInt(1, 4);
        if (a11 * a22 - a12 * a21 === 0) a22 += 1;
      } else {
        a11 = randInt(1, 3); a12 = randInt(1, 3);
        const k = randInt(1, 3);
        a21 = a11 * k; a22 = a12 * k;
      }
      const det = a11 * a22 - a12 * a21;
      return {
        question: <>Ist <M>{`\\begin{pmatrix} ${a11} & ${a12} \\\\ ${a21} & ${a22} \\end{pmatrix}`}</M> invertierbar? (1 = ja, 0 = nein)</>,
        answer: det !== 0 ? 1 : 0,
        tolerance: 0.01,
        hint: `det = ${a11}·${a22} - ${a12}·${a21} = ${det}. ${det !== 0 ? 'det ≠ 0 → invertierbar' : 'det = 0 → nicht invertierbar'}`,
      };
    }
    case 6:
    default: {
      // Scalar multiplication
      const s = randInt(-3, 3) || 1;
      const a11 = randInt(-4, 4), a12 = randInt(-4, 4);
      const a21 = randInt(-4, 4), a22 = randInt(-4, 4);
      const idx = randInt(0, 3);
      const posLabels = ['(1,1)', '(1,2)', '(2,1)', '(2,2)'];
      const elems = [a11, a12, a21, a22];
      return {
        question: <>Berechne das Element {posLabels[idx]} von{' '}
          <M>{`${s} \\cdot \\begin{pmatrix} ${a11} & ${a12} \\\\ ${a21} & ${a22} \\end{pmatrix}`}</M>.</>,
        answer: s * elems[idx],
        tolerance: 0.01,
        hint: `${s} · ${elems[idx]} = ${s * elems[idx]}`,
      };
    }
  }
}

export const MatrixExercises: React.FC = () => {
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
