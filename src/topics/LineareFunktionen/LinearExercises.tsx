import React, { useState, useCallback, useMemo } from 'react';
import { Math as M } from '../../shared/Math';

/* ─── Task Generator ─── */
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
      // Given m and b, calculate f(x) for a specific x
      const m = randInt(-5, 5);
      const b = randInt(-8, 8);
      const x = randInt(-5, 5);
      const y = m * x + b;
      return {
        question: <>Gegeben: <M>{`f(x) = ${m}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`}</M>. Berechne <M>{`f(${x})`}</M>.</>,
        answer: y,
        tolerance: 0.01,
        hint: `f(${x}) = ${m} · ${x} + ${b} = ${y}`,
      };
    }
    case 1: {
      // Find the zero point
      const m = randInt(1, 5) * (Math.random() > 0.5 ? 1 : -1);
      const b = randInt(-6, 6);
      const zero = -b / m;
      return {
        question: <>Bestimme die Nullstelle von <M>{`f(x) = ${m}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`}</M>.</>,
        answer: zero,
        tolerance: 0.1,
        hint: `0 = ${m}x + ${b}  →  x = ${(-b)}/${m} = ${zero.toFixed(2)}`,
        unit: 'x₀',
      };
    }
    case 2: {
      // Calculate slope between two points
      const x1 = randInt(-4, 0);
      const x2 = randInt(1, 5);
      const y1 = randInt(-6, 6);
      const y2 = randInt(-6, 6);
      const m = (y2 - y1) / (x2 - x1);
      return {
        question: <>Berechne die Steigung m der Geraden durch <M>{`P_1(${x1}|${y1})`}</M> und <M>{`P_2(${x2}|${y2})`}</M>.</>,
        answer: m,
        tolerance: 0.1,
        hint: `m = (${y2} - ${y1}) / (${x2} - ${x1}) = ${(y2 - y1)} / ${(x2 - x1)} = ${m.toFixed(2)}`,
        unit: 'm',
      };
    }
    case 3: {
      // Find y-intercept given slope and a point
      const m = randInt(-4, 4);
      const px = randInt(1, 5) * (Math.random() > 0.5 ? 1 : -1);
      const b = randInt(-6, 6);
      const py = m * px + b;
      return {
        question: <>Eine Gerade hat die Steigung <M>{`m = ${m}`}</M> und geht durch <M>{`P(${px}|${py})`}</M>. Bestimme b.</>,
        answer: b,
        tolerance: 0.01,
        hint: `b = y - m·x = ${py} - ${m}·${px} = ${py} - ${m * px} = ${b}`,
        unit: 'b',
      };
    }
    case 4: {
      // Determine full equation from two points
      const x1 = randInt(-3, 0);
      const x2 = randInt(1, 4);
      const y1 = randInt(-5, 5);
      const y2 = randInt(-5, 5);
      const m = (y2 - y1) / (x2 - x1);
      const b = y1 - m * x1;
      return {
        question: <>Bestimme den y-Achsenabschnitt b der Geraden durch <M>{`P_1(${x1}|${y1})`}</M> und <M>{`P_2(${x2}|${y2})`}</M>.</>,
        answer: b,
        tolerance: 0.1,
        hint: `m = ${m.toFixed(2)}, b = ${y1} - ${m.toFixed(2)}·${x1} = ${b.toFixed(2)}`,
        unit: 'b',
      };
    }
    case 5:
    default: {
      // Parallel line: same slope, through given point
      const m = randInt(-3, 3);
      const b1 = randInt(-5, 5);
      const px = randInt(1, 4) * (Math.random() > 0.5 ? 1 : -1);
      const py = randInt(-5, 5);
      const b2 = py - m * px;
      return {
        question: <>Gegeben: <M>{`g(x) = ${m}x ${b1 >= 0 ? '+' : '-'} ${Math.abs(b1)}`}</M>. Bestimme b der parallelen Geraden durch <M>{`P(${px}|${py})`}</M>.</>,
        answer: b2,
        tolerance: 0.1,
        hint: `Parallele → gleiche Steigung m = ${m}. b = ${py} - ${m}·${px} = ${b2}`,
        unit: 'b',
      };
    }
  }
}

/* ─── Exercise Component ─── */
export const LinearExercises: React.FC = () => {
  const [task, setTask] = useState<Task>(generateTask);
  const [input, setInput] = useState('');
  const [state, setState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const nextTask = useCallback(() => {
    setTask(generateTask());
    setInput('');
    setState('idle');
    setShowHint(false);
  }, []);

  const check = useCallback(() => {
    const val = parseFloat(input.replace(',', '.'));
    if (isNaN(val)) return;
    const isCorrect = Math.abs(val - task.answer) <= task.tolerance;
    setState(isCorrect ? 'correct' : 'wrong');
    setScore(s => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
  }, [input, task]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (state === 'idle') check();
      else nextTask();
    }
  }, [state, check, nextTask]);

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
          <input
            className={`exercise-input ${state}`}
            type="text"
            inputMode="decimal"
            value={input}
            onChange={e => { setInput(e.target.value); if (state !== 'idle') setState('idle'); }}
            onKeyDown={handleKey}
            placeholder="Antwort eingeben…"
          />
          {state === 'idle' ? (
            <button className="exercise-btn check" onClick={check}>Prüfen</button>
          ) : (
            <button className="exercise-btn next" onClick={nextTask}>Nächste →</button>
          )}
        </div>

        {state === 'correct' && (
          <div className="exercise-feedback correct">✓ Richtig!</div>
        )}
        {state === 'wrong' && (
          <div className="exercise-feedback wrong">
            ✗ Leider falsch — die richtige Antwort ist <strong>{task.answer % 1 === 0 ? task.answer : task.answer.toFixed(2)}</strong>
          </div>
        )}

        {state === 'idle' && (
          <button className="exercise-hint-toggle" onClick={() => setShowHint(!showHint)}>
            {showHint ? 'Hinweis ausblenden' : '💡 Hinweis anzeigen'}
          </button>
        )}
        {showHint && state === 'idle' && (
          <div className="exercise-hint">{task.hint}</div>
        )}
      </div>
    </div>
  );
};
