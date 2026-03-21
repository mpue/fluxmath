import React, { useState } from 'react';
import { Math as M } from '../../shared/Math';

interface Task { question: JSX.Element; answer: number; tolerance: number; hint: string }

function generateTask(type: number): Task {
  switch (type) {
    case 0: {
      // 2x2 system
      const a = 1 + Math.floor(Math.random() * 3);
      const b = 1 + Math.floor(Math.random() * 3);
      const x = 1 + Math.floor(Math.random() * 3);
      const y = 1 + Math.floor(Math.random() * 3);
      const r1 = a * x + b * y;
      const r2 = b * x + a * y;
      return {
        question: <><M>{String.raw`${a}x + ${b}y = ${r1}, \; ${b}x + ${a}y = ${r2}`}</M>. Was ist x?</>,
        answer: x, tolerance: 0.1,
        hint: `Subtrahiere die Gleichungen: (${a}-${b})x + (${b}-${a})y = ${r1 - r2}`,
      };
    }
    case 1: {
      // Rank determination
      const ranks: [string, number][] = [
        [String.raw`\begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix}`, 2],
        [String.raw`\begin{pmatrix} 1 & 2 \\ 2 & 4 \end{pmatrix}`, 1],
        [String.raw`\begin{pmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{pmatrix}`, 3],
        [String.raw`\begin{pmatrix} 0 & 0 \\ 0 & 0 \end{pmatrix}`, 0],
      ];
      const [tex, r] = ranks[Math.floor(Math.random() * ranks.length)];
      return {
        question: <>Bestimme den Rang der Matrix <M>{tex}</M>.</>,
        answer: r, tolerance: 0,
        hint: 'Rang = Anzahl der Nicht-Null-Zeilen in der Stufenform',
      };
    }
    case 2: {
      // Solution type: 1=eindeutig, 0=keine, -1=unendlich
      const cases: [string, number, string][] = [
        [String.raw`x + y = 3, \; 2x + 2y = 6`, -1, 'Abhaengig: unendlich viele'],
        [String.raw`x + y = 3, \; x + y = 5`, 0, 'Widerspruch: keine Loesung'],
        [String.raw`x + y = 3, \; x - y = 1`, 1, 'Eindeutig: x=2, y=1'],
      ];
      const [tex, ans, h] = cases[Math.floor(Math.random() * cases.length)];
      return {
        question: <>Loesungstyp von <M>{tex}</M>? (1=eindeutig, 0=keine, -1=unendlich)</>,
        answer: ans, tolerance: 0,
        hint: h,
      };
    }
    case 3: {
      // Back substitution: row echelon form
      // x + 2y = 5, y = 1 => x = 3
      const y = 1 + Math.floor(Math.random() * 3);
      const coeff = 1 + Math.floor(Math.random() * 3);
      const x = 1 + Math.floor(Math.random() * 4);
      const rhs = x + coeff * y;
      return {
        question: <>Stufenform: <M>{String.raw`x + ${coeff}y = ${rhs}`}</M> und <M>{String.raw`y = ${y}`}</M>. Was ist x?</>,
        answer: x, tolerance: 0.1,
        hint: `x = ${rhs} - ${coeff}*${y}`,
      };
    }
    default: {
      // Number of free variables
      // rang(A) = r, n variables => n-r free
      const n = 3;
      const r = [1, 2, 3][Math.floor(Math.random() * 3)];
      return {
        question: <>Ein 3x3-System hat Rang {r}. Wie viele freie Variablen?</>,
        answer: n - r, tolerance: 0,
        hint: `Freie Variablen = n - rang = ${n} - ${r}`,
      };
    }
  }
}

export const LGSExercises: React.FC = () => {
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
