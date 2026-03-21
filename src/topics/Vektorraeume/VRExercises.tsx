import React, { useState } from 'react';
import { Math as M } from '../../shared/Math';

interface Task { question: JSX.Element; answer: number; tolerance: number; hint: string }

function generateTask(type: number): Task {
  switch (type) {
    case 0: {
      // Dimension formula
      const dimV = [2, 3, 4][Math.floor(Math.random() * 3)];
      const dimKer = Math.floor(Math.random() * dimV);
      const dimIm = dimV - dimKer;
      return {
        question: <><M>{String.raw`f: \mathbb{R}^{${dimV}} \to \mathbb{R}^m`}</M> mit dim(Ker) = {dimKer}. Was ist dim(Im)?</>,
        answer: dimIm, tolerance: 0,
        hint: `Dimensionsformel: dim(Ker) + dim(Im) = dim(V) = ${dimV}`,
      };
    }
    case 1: {
      // Linear independence
      // Are (1,2) and (2,4) linearly independent?
      const cases: [string, number, string][] = [
        [String.raw`(1,2), (2,4)`, 0, 'Abhaengig: (2,4) = 2*(1,2)'],
        [String.raw`(1,0), (0,1)`, 1, 'Unabhaengig: Standardbasis'],
        [String.raw`(1,1), (1,-1)`, 1, 'Unabhaengig: det != 0'],
        [String.raw`(3,6), (1,2)`, 0, 'Abhaengig: (3,6) = 3*(1,2)'],
      ];
      const [tex, ans, h] = cases[Math.floor(Math.random() * cases.length)];
      return {
        question: <>Sind <M>{tex}</M> linear unabhaengig? (1=ja, 0=nein)</>,
        answer: ans, tolerance: 0,
        hint: h,
      };
    }
    case 2: {
      // Rank of matrix
      const mats: [string, number][] = [
        [String.raw`\begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix}`, 2],
        [String.raw`\begin{pmatrix} 1 & 2 \\ 2 & 4 \end{pmatrix}`, 1],
        [String.raw`\begin{pmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 0 \end{pmatrix}`, 2],
      ];
      const [tex, r] = mats[Math.floor(Math.random() * mats.length)];
      return {
        question: <>Rang von <M>{tex}</M>?</>,
        answer: r, tolerance: 0,
        hint: `Rang = dim(Bild) = Anzahl linear unabhaengiger Spalten`,
      };
    }
    case 3: {
      // Kernel dimension from rank
      const n = 3;
      const r = [1, 2, 3][Math.floor(Math.random() * 3)];
      return {
        question: <>Eine 3x3-Matrix hat Rang {r}. Dimension des Kerns?</>,
        answer: n - r, tolerance: 0,
        hint: `dim(Ker) = n - rang = ${n} - ${r} = ${n - r}`,
      };
    }
    default: {
      // Is it a subspace?
      const cases: [string, number, string][] = [
        [String.raw`\{(x,y) : x + y = 0\}`, 1, 'Gerade durch Ursprung: Unterraum'],
        [String.raw`\{(x,y) : x + y = 1\}`, 0, 'Geht nicht durch 0: kein Unterraum'],
        [String.raw`\{(x,y) : x \geq 0\}`, 0, 'Nicht abgeschlossen unter Skalarmultiplikation'],
        [String.raw`\{(x,0) : x \in \mathbb{R}\}`, 1, 'x-Achse: Unterraum'],
      ];
      const [tex, ans, h] = cases[Math.floor(Math.random() * cases.length)];
      return {
        question: <>Ist <M>{tex}</M> ein Unterraum von <M>{String.raw`\mathbb{R}^2`}</M>? (1=ja, 0=nein)</>,
        answer: ans, tolerance: 0,
        hint: h,
      };
    }
  }
}

export const VRExercises: React.FC = () => {
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
