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

function binomCoeff(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let r = 1;
  for (let i = 0; i < Math.min(k, n - k); i++) r = r * (n - i) / (i + 1);
  return Math.round(r);
}

function binomPdf(k: number, n: number, p: number): number {
  return binomCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

function binomCdf(k: number, n: number, p: number): number {
  let s = 0;
  for (let i = 0; i <= k; i++) s += binomPdf(i, n, p);
  return s;
}

function generateTask(): Task {
  const type = randInt(0, 5);
  switch (type) {
    case 0: {
      // Expected value under H0
      const n = randInt(20, 80);
      const p0 = [0.1, 0.2, 0.25, 0.3, 0.4, 0.5][randInt(0, 5)];
      const mu = n * p0;
      return {
        question: <>Bei einem Hypothesentest ist <M>{`n = ${n}`}</M> und <M>{`p_0 = ${p0}`}</M>. Berechne den Erwartungswert unter H0.</>,
        answer: mu,
        tolerance: 0.01,
        hint: `E(X) = n * p0 = ${n} * ${p0} = ${mu}`,
        unit: 'E(X)',
      };
    }
    case 1: {
      // Standard deviation under H0
      const n = randInt(20, 50);
      const p0 = [0.2, 0.3, 0.4, 0.5][randInt(0, 3)];
      const sigma = Math.round(Math.sqrt(n * p0 * (1 - p0)) * 100) / 100;
      return {
        question: <>Berechne die Standardabweichung unter H0 fuer <M>{`n = ${n},\\, p_0 = ${p0}`}</M> (2 Dezimalstellen).</>,
        answer: sigma,
        tolerance: 0.05,
        hint: `sigma = sqrt(n*p0*(1-p0)) = sqrt(${n}*${p0}*${(1 - p0).toFixed(1)}) = ${sigma}`,
        unit: '\u03C3',
      };
    }
    case 2: {
      // Determine H0 and H1 direction: "p is higher than 0.3" -> right-sided, answer=1; left-sided answer=0
      const p0 = [0.2, 0.3, 0.4, 0.5][randInt(0, 3)];
      const isRight = Math.random() > 0.5;
      const claim = isRight
        ? `Der Anteil ist groesser als ${(p0 * 100).toFixed(0)}%.`
        : `Der Anteil ist kleiner als ${(p0 * 100).toFixed(0)}%.`;
      return {
        question: <>Behauptung: {claim} Ist der Test rechts- (1) oder linksseitig (0)?</>,
        answer: isRight ? 1 : 0,
        tolerance: 0.01,
        hint: isRight
          ? `"groesser" -> H1: p > p0 -> rechtsseitiger Test (1)`
          : `"kleiner" -> H1: p < p0 -> linksseitiger Test (0)`,
      };
    }
    case 3: {
      // P(X = 0) for small n (complement rule basis)
      const n = randInt(3, 8);
      const p0 = [0.1, 0.2, 0.3][randInt(0, 2)];
      const pVal = Math.round(Math.pow(1 - p0, n) * 10000) / 100;
      return {
        question: <>Berechne <M>{`P(X = 0)`}</M> in % fuer <M>{`X \\sim B(${n},\\, ${p0})`}</M> (2 Dezimalstellen).</>,
        answer: pVal,
        tolerance: 0.5,
        hint: `P(X=0) = (1-${p0})^${n} = ${(1 - p0).toFixed(1)}^${n} = ${pVal}%`,
        unit: 'P',
      };
    }
    case 4: {
      // Critical value for right-sided test
      const n = randInt(15, 30);
      const p0 = [0.3, 0.4, 0.5][randInt(0, 2)];
      const alpha = 0.05;
      let kCrit = n + 1;
      for (let k = n; k >= 0; k--) {
        if (1 - binomCdf(k - 1, n, p0) <= alpha) { kCrit = k; break; }
      }
      return {
        question: <>Bestimme den kritischen Wert k fuer einen rechtsseitigen Test mit <M>{`n=${n},\\, p_0=${p0},\\, \\alpha = 5\\%`}</M>. Ab welchem k wird H0 abgelehnt?</>,
        answer: kCrit,
        tolerance: 0.01,
        hint: `Suche das kleinste k, sodass P(X >= k) <= 0.05. Ergebnis: k = ${kCrit}`,
        unit: 'k',
      };
    }
    case 5:
    default: {
      // Actual alpha (Fehler 1. Art) given critical value
      const n = randInt(15, 25);
      const p0 = [0.3, 0.4, 0.5][randInt(0, 2)];
      // Find a reasonable critical value
      let kCrit = n + 1;
      for (let k = n; k >= 0; k--) {
        if (1 - binomCdf(k - 1, n, p0) <= 0.05) { kCrit = k; break; }
      }
      const actualAlpha = Math.round((1 - binomCdf(kCrit - 1, n, p0)) * 10000) / 100;
      return {
        question: <>Berechne die tatsaechliche Irrtumswahrscheinlichkeit (Fehler 1. Art) in % fuer <M>{`n=${n},\\, p_0=${p0}`}</M> wenn H0 ab <M>{`X \\geq ${kCrit}`}</M> abgelehnt wird (2 Dezimalstellen).</>,
        answer: actualAlpha,
        tolerance: 0.5,
        hint: `P(X >= ${kCrit}) = 1 - P(X <= ${kCrit - 1}) = ${actualAlpha}%`,
        unit: '\u03B1',
      };
    }
  }
}

export const HypothesisExercises: React.FC = () => {
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
