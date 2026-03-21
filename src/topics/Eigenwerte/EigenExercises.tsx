import React, { useState } from 'react';
import { Math as M } from '../../shared/Math';

interface Task { question: JSX.Element; answer: number; tolerance: number; hint: string }

function generateTask(type: number): Task {
  switch (type) {
    case 0: {
      // Eigenvalues of diagonal matrix
      const d1 = 1 + Math.floor(Math.random() * 4);
      const d2 = 1 + Math.floor(Math.random() * 4);
      return {
        question: <>Eigenwerte von <M>{String.raw`\begin{pmatrix} ${d1} & 0 \\ 0 & ${d2} \end{pmatrix}`}</M>? Gib den groesseren an.</>,
        answer: Math.max(d1, d2), tolerance: 0.1,
        hint: `Diagonalmatrix: Eigenwerte = Diagonalelemente: ${d1}, ${d2}`,
      };
    }
    case 1: {
      // Trace = sum of eigenvalues
      const a = 1 + Math.floor(Math.random() * 4);
      const d = 1 + Math.floor(Math.random() * 4);
      return {
        question: <><M>{String.raw`A = \begin{pmatrix} ${a} & * \\ * & ${d} \end{pmatrix}`}</M>. Summe der Eigenwerte?</>,
        answer: a + d, tolerance: 0.1,
        hint: `Spur(A) = Summe der Eigenwerte = ${a} + ${d}`,
      };
    }
    case 2: {
      // Determinant = product of eigenvalues
      const l1 = 1 + Math.floor(Math.random() * 3);
      const l2 = 1 + Math.floor(Math.random() * 3);
      return {
        question: <>Eigenwerte <M>{String.raw`\lambda_1=${l1}, \lambda_2=${l2}`}</M>. Was ist <M>{String.raw`\det(A)`}</M>?</>,
        answer: l1 * l2, tolerance: 0.1,
        hint: `det(A) = Produkt der Eigenwerte = ${l1} * ${l2}`,
      };
    }
    case 3: {
      // Characteristic polynomial
      const a = 2, b = 1, c = 1, d = 2;
      // lambda^2 - 4*lambda + 3 = 0 => lambda = 1, 3
      return {
        question: <><M>{String.raw`A = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}`}</M>. Groesserer Eigenwert?</>,
        answer: 3, tolerance: 0.1,
        hint: 'lambda^2 - 4*lambda + 3 = 0, also lambda = 1 oder 3',
      };
    }
    default: {
      // Is diagonalizable?
      const cases: [string, number, string][] = [
        [String.raw`\begin{pmatrix} 2 & 0 \\ 0 & 3 \end{pmatrix}`, 1, 'Bereits diagonal!'],
        [String.raw`\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}`, 0, 'Doppelter EW 1, Eigenraum dim 1 < 2'],
        [String.raw`\begin{pmatrix} 3 & 1 \\ 1 & 3 \end{pmatrix}`, 1, 'Symmetrisch => immer diagonalisierbar'],
      ];
      const [tex, ans, h] = cases[Math.floor(Math.random() * cases.length)];
      return {
        question: <>Ist <M>{tex}</M> diagonalisierbar? (1=ja, 0=nein)</>,
        answer: ans, tolerance: 0,
        hint: h,
      };
    }
  }
}

export const EigenExercises: React.FC = () => {
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
