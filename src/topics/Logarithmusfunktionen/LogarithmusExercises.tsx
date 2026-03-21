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
      // log_b(b^k) = k
      const b = [2, 3, 5, 10][randInt(0, 3)];
      const k = randInt(-3, 5);
      return {
        question: <>Berechne <M>{`\\log_{${b}}(${b}^{${k}})`}</M>.</>,
        answer: k,
        tolerance: 0.01,
        hint: `log_b(b^k) = k, also log_${b}(${b}^${k}) = ${k}`,
      };
    }
    case 1: {
      // log_b(x) where x = b^k for known k
      const b = [2, 3, 10][randInt(0, 2)];
      const k = randInt(1, 4);
      const x = Math.pow(b, k);
      return {
        question: <>Berechne <M>{`\\log_{${b}}(${x})`}</M>.</>,
        answer: k,
        tolerance: 0.01,
        hint: `${b}^${k} = ${x}, also log_${b}(${x}) = ${k}`,
      };
    }
    case 2: {
      // ln(e^k) = k
      const k = randInt(-3, 5);
      return {
        question: <>Berechne <M>{`\\ln(e^{${k}})`}</M>.</>,
        answer: k,
        tolerance: 0.01,
        hint: `ln(e^k) = k, also ln(e^${k}) = ${k}`,
      };
    }
    case 3: {
      // Product rule: log(a*b) = log(a) + log(b) -> compute
      const b = 10;
      const a1 = [10, 100, 1000][randInt(0, 2)];
      const a2 = [10, 100, 1000][randInt(0, 2)];
      const answer = Math.log10(a1) + Math.log10(a2);
      return {
        question: <>Berechne <M>{`\\log_{10}(${a1}) + \\log_{10}(${a2})`}</M>. (Tipp: Produktregel)</>,
        answer,
        tolerance: 0.01,
        hint: `log(${a1}) + log(${a2}) = log(${a1}*${a2}) = log(${a1 * a2}) = ${answer}`,
      };
    }
    case 4: {
      // Power rule: log(a^r) = r*log(a)
      const a = [2, 3, 10][randInt(0, 2)];
      const r = randInt(2, 5);
      const answer = Math.round(r * Math.log10(a) * 100) / 100;
      return {
        question: <>Berechne <M>{`\\log_{10}(${a}^{${r}})`}</M> (2 Dezimalstellen).</>,
        answer,
        tolerance: 0.05,
        hint: `log(${a}^${r}) = ${r} * log(${a}) = ${r} * ${Math.log10(a).toFixed(3)} = ${answer}`,
      };
    }
    case 5:
    default: {
      // Solve b^x = c for x
      const b = [2, 3, 5][randInt(0, 2)];
      const x = randInt(1, 4);
      const c = Math.pow(b, x);
      return {
        question: <>Loese <M>{`${b}^x = ${c}`}</M> nach x auf.</>,
        answer: x,
        tolerance: 0.01,
        hint: `x = log_${b}(${c}) = ${x}`,
        unit: 'x',
      };
    }
  }
}

export const LogarithmusExercises: React.FC = () => {
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
