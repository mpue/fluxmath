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
  const type = randInt(0, 4);

  switch (type) {
    case 0: {
      // DC component = a₀ (average value)
      const signals = [
        { name: 'Rechteck', a0: 0 },
        { name: 'Sägezahn', a0: 0 },
        { name: 'Dreieck', a0: 0 },
      ];
      const s = signals[randInt(0, 2)];
      return {
        question: <>Welchen DC-Anteil (a₀) hat ein symmetrisches {s.name}signal?</>,
        answer: s.a0,
        tolerance: 0.01,
        hint: `Symmetrische periodische Signale mit gleichen positiven und negativen Anteilen haben a₀ = 0`,
      };
    }
    case 1: {
      // Number of harmonics for good approximation
      // Fourier series of square wave: only odd harmonics
      // Which harmonics appear? Answer: 1 for odd, 0 for "all"
      return {
        question: <>Welche Harmonischen (n) treten in der Fourierreihe eines Rechtecksignals auf? (1 = nur ungerade, 2 = alle)</>,
        answer: 1,
        tolerance: 0.01,
        hint: `Beim Rechtecksignal sind alle geraden Koeffizienten = 0, es treten nur ungerade Harmonische auf (n = 1, 3, 5, …)`,
      };
    }
    case 2: {
      // Frequency of n-th harmonic given fundamental frequency
      const f0 = [1, 2, 5, 10, 50][randInt(0, 4)];
      const n = randInt(2, 8);
      return {
        question: <>Die Grundfrequenz ist <M>{`f_0 = ${f0}\\,\\text{Hz}`}</M>. Welche Frequenz hat die {n}. Harmonische?</>,
        answer: n * f0,
        tolerance: 0.01,
        hint: `f_n = n · f₀ = ${n} · ${f0} = ${n * f0} Hz`,
        unit: 'f',
      };
    }
    case 3: {
      // Period from frequency
      const f = [1, 2, 4, 5, 10, 50][randInt(0, 5)];
      const T = 1 / f;
      return {
        question: <>Berechne die Periode T bei einer Frequenz von <M>{`f = ${f}\\,\\text{Hz}`}</M>.</>,
        answer: T,
        tolerance: 0.001,
        hint: `T = 1/f = 1/${f} = ${T}`,
        unit: 'T',
      };
    }
    case 4:
    default: {
      // Angular frequency from frequency
      const f = [1, 2, 5, 10][randInt(0, 3)];
      const omega = Math.round(2 * Math.PI * f * 100) / 100;
      return {
        question: <>Berechne die Kreisfrequenz ω bei <M>{`f = ${f}\\,\\text{Hz}`}</M> (auf 2 Dezimalstellen).</>,
        answer: omega,
        tolerance: 0.1,
        hint: `ω = 2πf = 2π·${f} ≈ ${omega}`,
        unit: 'ω',
      };
    }
  }
}

export const FourierExercises: React.FC = () => {
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
