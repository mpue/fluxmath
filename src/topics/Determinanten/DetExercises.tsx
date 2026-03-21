import React, { useState } from 'react';
import { Math as M } from '../../shared/Math';

interface Task { question: JSX.Element; answer: number; tolerance: number; hint: string }

function generateTask(type: number): Task {
  switch (type) {
    case 0: {
      // 2x2 det
      const a = -3 + Math.floor(Math.random() * 7);
      const b = -3 + Math.floor(Math.random() * 7);
      const c = -3 + Math.floor(Math.random() * 7);
      const d = -3 + Math.floor(Math.random() * 7);
      return {
        question: <>Berechne <M>{String.raw`\det\begin{pmatrix} ${a} & ${b} \\ ${c} & ${d} \end{pmatrix}`}</M>.</>,
        answer: a * d - b * c, tolerance: 0.1,
        hint: `det = ${a}*${d} - ${b}*${c} = ${a * d - b * c}`,
      };
    }
    case 1: {
      // 3x3 det (simple)
      // det of diagonal matrix
      const d1 = 1 + Math.floor(Math.random() * 3);
      const d2 = 1 + Math.floor(Math.random() * 3);
      const d3 = 1 + Math.floor(Math.random() * 3);
      return {
        question: <>Determinante der Diagonalmatrix <M>{String.raw`\text{diag}(${d1}, ${d2}, ${d3})`}</M>?</>,
        answer: d1 * d2 * d3, tolerance: 0.1,
        hint: `Produkt der Diagonalelemente: ${d1}*${d2}*${d3}`,
      };
    }
    case 2: {
      // Property: det(kA) for 2x2
      const k = 2 + Math.floor(Math.random() * 3);
      const det = 1 + Math.floor(Math.random() * 5);
      return {
        question: <>Wenn <M>{String.raw`\det(A) = ${det}`}</M> fuer eine 2x2-Matrix, was ist <M>{String.raw`\det(${k}A)`}</M>?</>,
        answer: k * k * det, tolerance: 0.1,
        hint: `det(kA) = k^n * det(A) = ${k}^2 * ${det} = ${k * k * det}`,
      };
    }
    case 3: {
      // Invertible?
      const cases: [string, number, number][] = [
        [String.raw`\begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}`, -2, 1],
        [String.raw`\begin{pmatrix} 1 & 2 \\ 2 & 4 \end{pmatrix}`, 0, 0],
        [String.raw`\begin{pmatrix} 3 & 1 \\ 1 & 3 \end{pmatrix}`, 8, 1],
      ];
      const [tex, det, inv] = cases[Math.floor(Math.random() * cases.length)];
      return {
        question: <>Ist <M>{tex}</M> invertierbar? (1=ja, 0=nein) [det={det}]</>,
        answer: inv, tolerance: 0,
        hint: `det = ${det}, invertierbar gdw det != 0`,
      };
    }
    default: {
      // Sarrus rule 3x3
      // Simple upper triangular
      const a = 1 + Math.floor(Math.random() * 3);
      const b = 1 + Math.floor(Math.random() * 3);
      const c = 1 + Math.floor(Math.random() * 3);
      return {
        question: <>Determinante: <M>{String.raw`\begin{pmatrix} ${a} & * & * \\ 0 & ${b} & * \\ 0 & 0 & ${c} \end{pmatrix}`}</M> (obere Dreiecksmatrix)</>,
        answer: a * b * c, tolerance: 0.1,
        hint: `Dreiecksmatrix: det = Produkt der Diagonale = ${a}*${b}*${c}`,
      };
    }
  }
}

export const DetExercises: React.FC = () => {
  const [task, setTask] = useState<Task>(() => generateTask(Math.floor(Math.random() * 5)));
  const [input, setInput] = useState('');
  const [state, setState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const check = () => {
    const val = parseFloat(input.replace(',', '.'));
    if (isNaN(val)) return;
    const ok = Math.abs(val - task.answer) <= task.tolerance;
    setState(ok ? 'correct' : 'wrong');
    setScore(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
  };

  const next = () => {
    setTask(generateTask(Math.floor(Math.random() * 5)));
    setInput(''); setState('idle'); setShowHint(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { if (state === 'idle') check(); else next(); }
  };

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
          <input className={`exercise-input ${state}`} type="text" inputMode="decimal" value={input}
            onChange={e => { setInput(e.target.value); if (state !== 'idle') setState('idle'); }}
            onKeyDown={handleKey} placeholder="Antwort eingeben..." />
          {state === 'idle'
            ? <button className="exercise-btn check" onClick={check}>Pruefen</button>
            : <button className="exercise-btn next" onClick={next}>Naechste &rarr;</button>}
        </div>
        {state === 'correct' && <div className="exercise-feedback correct">Richtig!</div>}
        {state === 'wrong' && <div className="exercise-feedback wrong">Leider falsch — die richtige Antwort ist <strong>{task.answer % 1 === 0 ? task.answer : task.answer.toFixed(2)}</strong></div>}
        {state === 'idle' && <button className="exercise-hint-toggle" onClick={() => setShowHint(!showHint)}>{showHint ? 'Hinweis ausblenden' : 'Hinweis anzeigen'}</button>}
        {showHint && state === 'idle' && <div className="exercise-hint">{task.hint}</div>}
      </div>
    </div>
  );
};
