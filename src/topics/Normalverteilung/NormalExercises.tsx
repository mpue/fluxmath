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
      // z-value calculation
      const mu = randInt(40, 80);
      const sigma = randInt(3, 12);
      const x = mu + randInt(-2, 2) * sigma;
      const z = (x - mu) / sigma;
      return {
        question: <>Bei <M>{`\\mu = ${mu}`}</M> und <M>{`\\sigma = ${sigma}`}</M>: Berechne den z-Wert für <M>{`x = ${x}`}</M>.</>,
        answer: z,
        tolerance: 0.01,
        hint: `z = (x - μ)/σ = (${x} - ${mu})/${sigma} = ${z}`,
        unit: 'z',
      };
    }
    case 1: {
      // x from z-value
      const mu = randInt(50, 100);
      const sigma = randInt(5, 15);
      const z = [-2, -1, 0, 1, 2][randInt(0, 4)];
      const x = mu + z * sigma;
      return {
        question: <>Bei <M>{`\\mu = ${mu}`}</M>, <M>{`\\sigma = ${sigma}`}</M>: Welchem x entspricht <M>{`z = ${z}`}</M>?</>,
        answer: x,
        tolerance: 0.01,
        hint: `x = μ + z·σ = ${mu} + ${z}·${sigma} = ${x}`,
        unit: 'x',
      };
    }
    case 2: {
      // 68-95-99.7 rule: what percentage within ±kσ?
      const k = randInt(1, 3);
      const pct = k === 1 ? 68.27 : k === 2 ? 95.45 : 99.73;
      return {
        question: <>Wie viel Prozent aller Werte liegen im Intervall <M>{`\\mu \\pm ${k}\\sigma`}</M>? (auf 2 Dezimalstellen)</>,
        answer: pct,
        tolerance: 0.1,
        hint: `Sigma-Regel: μ ± ${k}σ → ${pct}%`,
        unit: '%',
      };
    }
    case 3: {
      // Variance from standard deviation
      const sigma = randInt(2, 10);
      return {
        question: <>Wie groß ist die Varianz, wenn <M>{`\\sigma = ${sigma}`}</M>?</>,
        answer: sigma * sigma,
        tolerance: 0.01,
        hint: `σ² = ${sigma}² = ${sigma * sigma}`,
        unit: 'σ²',
      };
    }
    case 4: {
      // Standard deviation from variance
      const sigma = randInt(2, 8);
      const variance = sigma * sigma;
      return {
        question: <>Berechne die Standardabweichung bei einer Varianz von <M>{`\\sigma^2 = ${variance}`}</M>.</>,
        answer: sigma,
        tolerance: 0.01,
        hint: `σ = √${variance} = ${sigma}`,
        unit: 'σ',
      };
    }
    case 5:
    default: {
      // Is a value within 2σ range? (1=yes, 0=no)
      const mu = randInt(50, 80);
      const sigma = randInt(3, 10);
      const within = Math.random() > 0.4;
      const x = within
        ? mu + randInt(-2 * sigma, 2 * sigma)
        : mu + (Math.random() > 0.5 ? 1 : -1) * (2 * sigma + randInt(1, sigma));
      const isWithin = Math.abs(x - mu) <= 2 * sigma;
      return {
        question: <>Bei <M>{`\\mu = ${mu}`}</M>, <M>{`\\sigma = ${sigma}`}</M>: Liegt <M>{`x = ${x}`}</M> im 2σ-Intervall? (1 = ja, 0 = nein)</>,
        answer: isWithin ? 1 : 0,
        tolerance: 0.01,
        hint: `2σ-Intervall: [${mu - 2 * sigma}, ${mu + 2 * sigma}]. x = ${x} → ${isWithin ? 'ja' : 'nein'}`,
      };
    }
  }
}

export const NormalExercises: React.FC = () => {
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
