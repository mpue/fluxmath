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

function binom(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let r = 1;
  for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1);
  return Math.round(r);
}

function binomPdf(k: number, n: number, p: number): number {
  return binom(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

function generateTask(): Task {
  const type = randInt(0, 5);

  switch (type) {
    case 0: {
      // Binomial coefficient
      const n = randInt(4, 10);
      const k = randInt(1, Math.min(n - 1, 4));
      return {
        question: <>Berechne den Binomialkoeffizienten <M>{`\\binom{${n}}{${k}}`}</M>.</>,
        answer: binom(n, k),
        tolerance: 0.01,
        hint: `${n}! / (${k}!·${n - k}!) = ${binom(n, k)}`,
      };
    }
    case 1: {
      // Expected value
      const n = randInt(5, 20);
      const p = [0.1, 0.2, 0.25, 0.3, 0.4, 0.5][randInt(0, 5)];
      const mu = n * p;
      return {
        question: <>Berechne den Erwartungswert von <M>{`X \\sim B(${n},\\, ${p})`}</M>.</>,
        answer: mu,
        tolerance: 0.01,
        hint: `μ = n·p = ${n}·${p} = ${mu}`,
        unit: 'μ',
      };
    }
    case 2: {
      // Standard deviation
      const n = randInt(10, 30);
      const p = [0.2, 0.3, 0.4, 0.5][randInt(0, 3)];
      const sigma = Math.round(Math.sqrt(n * p * (1 - p)) * 100) / 100;
      return {
        question: <>Berechne die Standardabweichung von <M>{`X \\sim B(${n},\\, ${p})`}</M> (auf 2 Dezimalstellen).</>,
        answer: sigma,
        tolerance: 0.05,
        hint: `σ = √(n·p·(1-p)) = √(${n}·${p}·${1 - p}) ≈ ${sigma}`,
        unit: 'σ',
      };
    }
    case 3: {
      // P(X = k) in percent (rounded)
      const n = randInt(5, 10);
      const p = [0.2, 0.3, 0.4, 0.5][randInt(0, 3)];
      const k = randInt(1, Math.min(n, 4));
      const prob = Math.round(binomPdf(k, n, p) * 10000) / 100;
      return {
        question: <>Berechne <M>{`P(X = ${k})`}</M> für <M>{`X \\sim B(${n},\\, ${p})`}</M> in Prozent (auf 2 Dezimalstellen).</>,
        answer: prob,
        tolerance: 0.5,
        hint: `P(X=${k}) = C(${n},${k})·${p}^${k}·${(1 - p).toFixed(1)}^${n - k} ≈ ${prob}%`,
        unit: 'P',
      };
    }
    case 4: {
      // Number of trials given expected value
      const p = [0.1, 0.2, 0.25, 0.5][randInt(0, 3)];
      const n = randInt(5, 20);
      const mu = n * p;
      return {
        question: <>Bei <M>{`X \\sim B(n,\\, ${p})`}</M> ist <M>{`\\mu = ${mu}`}</M>. Bestimme n.</>,
        answer: n,
        tolerance: 0.01,
        hint: `n = μ/p = ${mu}/${p} = ${n}`,
        unit: 'n',
      };
    }
    case 5:
    default: {
      // Complement: P(X >= 1) = 1 - P(X=0)
      const n = randInt(3, 8);
      const p = [0.1, 0.2, 0.3, 0.4, 0.5][randInt(0, 4)];
      const p0 = Math.pow(1 - p, n);
      const result = Math.round((1 - p0) * 10000) / 100;
      return {
        question: <>Berechne <M>{`P(X \\geq 1)`}</M> für <M>{`X \\sim B(${n},\\, ${p})`}</M> in Prozent (auf 2 Dezimalstellen).</>,
        answer: result,
        tolerance: 0.5,
        hint: `P(X≥1) = 1 - P(X=0) = 1 - ${(1 - p).toFixed(1)}^${n} = 1 - ${p0.toFixed(4)} ≈ ${result}%`,
        unit: 'P',
      };
    }
  }
}

export const BinomialExercises: React.FC = () => {
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
