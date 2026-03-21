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
      // Joint probability P(A ∩ B) = P(B|A) * P(A)
      const pA = randInt(10, 80) / 100;
      const pBgA = randInt(10, 90) / 100;
      const answer = Math.round(pA * pBgA * 10000) / 100;
      return {
        question: <>Berechne <M>{`P(A \\cap B)`}</M> in % wenn <M>{`P(A) = ${(pA * 100).toFixed(0)}\\%`}</M> und <M>{`P(B|A) = ${(pBgA * 100).toFixed(0)}\\%`}</M> (2 Dezimalstellen).</>,
        answer,
        tolerance: 0.5,
        hint: `P(A ∩ B) = P(B|A) * P(A) = ${(pBgA * 100).toFixed(0)}% * ${(pA * 100).toFixed(0)}% = ${answer}%`,
        unit: 'P',
      };
    }
    case 1: {
      // Total probability P(B)
      const pA = randInt(20, 70) / 100;
      const pBgA = randInt(30, 90) / 100;
      const pBgNA = randInt(5, 40) / 100;
      const pB = pA * pBgA + (1 - pA) * pBgNA;
      const answer = Math.round(pB * 10000) / 100;
      return {
        question: <>Berechne P(B) in % mit dem Satz der totalen Wahrscheinlichkeit: <M>{`P(A)=${(pA * 100).toFixed(0)}\\%,\\; P(B|A)=${(pBgA * 100).toFixed(0)}\\%,\\; P(B|\\overline{A})=${(pBgNA * 100).toFixed(0)}\\%`}</M> (2 Dezimalstellen).</>,
        answer,
        tolerance: 0.5,
        hint: `P(B) = ${(pBgA * 100).toFixed(0)}%*${(pA * 100).toFixed(0)}% + ${(pBgNA * 100).toFixed(0)}%*${((1 - pA) * 100).toFixed(0)}% = ${answer}%`,
        unit: 'P(B)',
      };
    }
    case 2: {
      // Bayes: P(A|B)
      const pA = randInt(10, 50) / 100;
      const pBgA = randInt(50, 95) / 100;
      const pBgNA = randInt(5, 30) / 100;
      const pB = pA * pBgA + (1 - pA) * pBgNA;
      const pAgB = (pBgA * pA) / pB;
      const answer = Math.round(pAgB * 10000) / 100;
      return {
        question: <>Berechne <M>{`P(A|B)`}</M> in % mit dem Satz von Bayes: <M>{`P(A)=${(pA * 100).toFixed(0)}\\%,\\; P(B|A)=${(pBgA * 100).toFixed(0)}\\%,\\; P(B|\\overline{A})=${(pBgNA * 100).toFixed(0)}\\%`}</M> (2 Dezimalstellen).</>,
        answer,
        tolerance: 0.5,
        hint: `P(B) = ${(pB * 100).toFixed(1)}%, P(A|B) = P(B|A)*P(A)/P(B) = ${answer}%`,
        unit: 'P(A|B)',
      };
    }
    case 3: {
      // Complement P(not A) given P(A)
      const pA = randInt(5, 95);
      return {
        question: <>Wie gross ist <M>{`P(\\overline{A})`}</M> in %, wenn <M>{`P(A) = ${pA}\\%`}</M>?</>,
        answer: 100 - pA,
        tolerance: 0.01,
        hint: `P(not A) = 1 - P(A) = 100% - ${pA}% = ${100 - pA}%`,
        unit: 'P',
      };
    }
    case 4: {
      // Independent events: P(A ∩ B) = P(A)*P(B)?
      const pA = randInt(20, 60) / 100;
      const pB = randInt(20, 60) / 100;
      const pAB = Math.round(pA * pB * 10000) / 100;
      return {
        question: <>Zwei unabhaengige Ereignisse: <M>{`P(A)=${(pA * 100).toFixed(0)}\\%,\\; P(B)=${(pB * 100).toFixed(0)}\\%`}</M>. Berechne <M>{`P(A \\cap B)`}</M> in % (2 Dezimalstellen).</>,
        answer: pAB,
        tolerance: 0.5,
        hint: `Bei Unabhaengigkeit: P(A ∩ B) = P(A)*P(B) = ${(pA * 100).toFixed(0)}%*${(pB * 100).toFixed(0)}% = ${pAB}%`,
        unit: 'P',
      };
    }
    case 5:
    default: {
      // Path probability from tree diagram
      const p1 = randInt(20, 80) / 100;
      const p2 = randInt(20, 80) / 100;
      const p3 = randInt(20, 80) / 100;
      const result = Math.round(p1 * p2 * p3 * 10000) / 100;
      return {
        question: <>Ein dreistufiger Pfad im Baumdiagramm hat die Wahrscheinlichkeiten <M>{`${(p1 * 100).toFixed(0)}\\%,\\; ${(p2 * 100).toFixed(0)}\\%,\\; ${(p3 * 100).toFixed(0)}\\%`}</M>. Berechne die Pfadwahrscheinlichkeit in % (2 Dezimalstellen).</>,
        answer: result,
        tolerance: 0.5,
        hint: `Multiplikationsregel: ${(p1 * 100).toFixed(0)}% * ${(p2 * 100).toFixed(0)}% * ${(p3 * 100).toFixed(0)}% = ${result}%`,
        unit: 'P',
      };
    }
  }
}

export const WahrscheinlichkeitExercises: React.FC = () => {
  const [task, setTask] = useState<Task>(generateTask);
  const [input, setInput] = useState('');
  const [state, setState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const nextTask = useCallback(() => { setTask(generateTask()); setInput(''); setState('idle'); setShowHint(false); }, []);
  const check = useCallback(() => {
    const val = parseFloat(input.replace(',', '.'));
    if (isNaN(val)) return;
    const ok = Math.abs(val - task.answer) <= task.tolerance;
    setState(ok ? 'correct' : 'wrong');
    setScore(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
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
            onKeyDown={handleKey} placeholder="Antwort eingeben..." />
          {state === 'idle'
            ? <button className="exercise-btn check" onClick={check}>Pruefen</button>
            : <button className="exercise-btn next" onClick={nextTask}>Naechste &rarr;</button>}
        </div>
        {state === 'correct' && <div className="exercise-feedback correct">Richtig!</div>}
        {state === 'wrong' && <div className="exercise-feedback wrong">Leider falsch — die richtige Antwort ist <strong>{task.answer % 1 === 0 ? task.answer : task.answer.toFixed(2)}</strong></div>}
        {state === 'idle' && <button className="exercise-hint-toggle" onClick={() => setShowHint(!showHint)}>{showHint ? 'Hinweis ausblenden' : 'Hinweis anzeigen'}</button>}
        {showHint && state === 'idle' && <div className="exercise-hint">{task.hint}</div>}
      </div>
    </div>
  );
};
