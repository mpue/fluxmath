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

const specialAngles: { deg: number; rad: string; sin: number; cos: number }[] = [
  { deg: 0,   rad: '0',           sin: 0,   cos: 1 },
  { deg: 30,  rad: '\\frac{\\pi}{6}', sin: 0.5, cos: Math.sqrt(3)/2 },
  { deg: 45,  rad: '\\frac{\\pi}{4}', sin: Math.sqrt(2)/2, cos: Math.sqrt(2)/2 },
  { deg: 60,  rad: '\\frac{\\pi}{3}', sin: Math.sqrt(3)/2, cos: 0.5 },
  { deg: 90,  rad: '\\frac{\\pi}{2}', sin: 1, cos: 0 },
  { deg: 180, rad: '\\pi',        sin: 0,   cos: -1 },
  { deg: 270, rad: '\\frac{3\\pi}{2}', sin: -1, cos: 0 },
  { deg: 360, rad: '2\\pi',       sin: 0,   cos: 1 },
];

function generateTask(): Task {
  const type = randInt(0, 5);

  switch (type) {
    case 0: {
      // sin of special angle
      const a = specialAngles[randInt(0, 7)];
      return {
        question: <>Berechne <M>{`\\sin(${a.rad})`}</M> (auf 2 Dezimalstellen).</>,
        answer: Math.round(a.sin * 100) / 100,
        tolerance: 0.02,
        hint: `sin(${a.deg}°) = ${a.sin.toFixed(2)}`,
      };
    }
    case 1: {
      // cos of special angle
      const a = specialAngles[randInt(0, 7)];
      return {
        question: <>Berechne <M>{`\\cos(${a.rad})`}</M> (auf 2 Dezimalstellen).</>,
        answer: Math.round(a.cos * 100) / 100,
        tolerance: 0.02,
        hint: `cos(${a.deg}°) = ${a.cos.toFixed(2)}`,
      };
    }
    case 2: {
      // Period of a·sin(bx)
      const b = randInt(1, 6);
      const a = randInt(1, 4);
      const period = Math.round((2 * Math.PI / b) * 100) / 100;
      return {
        question: <>Bestimme die Periode von <M>{`f(x) = ${a}\\sin(${b}x)`}</M> (auf 2 Dezimalstellen).</>,
        answer: period,
        tolerance: 0.05,
        hint: `T = 2π/${b} ≈ ${period}`,
        unit: 'T',
      };
    }
    case 3: {
      // Amplitude of a·sin(bx + c)
      const a = randInt(1, 8) * (Math.random() > 0.5 ? 1 : -1);
      const b = randInt(1, 4);
      return {
        question: <>Welche Amplitude hat <M>{`f(x) = ${a}\\sin(${b}x)`}</M>?</>,
        answer: Math.abs(a),
        tolerance: 0.01,
        hint: `Amplitude = |a| = |${a}| = ${Math.abs(a)}`,
      };
    }
    case 4: {
      // Convert degrees to radians (result as multiple of π → give decimal)
      const degs = [30, 45, 60, 90, 120, 150, 180, 270, 360];
      const deg = degs[randInt(0, 8)];
      const rad = Math.round((deg * Math.PI / 180) * 100) / 100;
      return {
        question: <>Wandle {deg}° in Bogenmaß um (auf 2 Dezimalstellen).</>,
        answer: rad,
        tolerance: 0.05,
        hint: `${deg}° = ${deg}·π/180 ≈ ${rad}`,
      };
    }
    case 5:
    default: {
      // sin² + cos² = 1: given sin(α), find |cos(α)|
      const vals = [0.3, 0.4, 0.5, 0.6, 0.8];
      const sinA = vals[randInt(0, 4)];
      const cosA = Math.round(Math.sqrt(1 - sinA * sinA) * 100) / 100;
      return {
        question: <>Gegeben: <M>{`\\sin(\\alpha) = ${sinA}`}</M>. Berechne <M>{'|\\cos(\\alpha)|'}</M> (auf 2 Dezimalstellen).</>,
        answer: cosA,
        tolerance: 0.02,
        hint: `cos²(α) = 1 - sin²(α) = 1 - ${sinA}² = ${(1 - sinA * sinA).toFixed(2)}, |cos(α)| = ${cosA}`,
      };
    }
  }
}

export const TrigExercises: React.FC = () => {
  const [task, setTask] = useState<Task>(generateTask);
  const [input, setInput] = useState('');
  const [state, setState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const nextTask = useCallback(() => { setTask(generateTask()); setInput(''); setState('idle'); setShowHint(false); }, []);
  const check = useCallback(() => {
    const val = parseFloat(input.replace(',', '.'));
    if (isNaN(val)) return;
    const isCorrect = Math.abs(val - task.answer) <= task.tolerance;
    setState(isCorrect ? 'correct' : 'wrong');
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
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
