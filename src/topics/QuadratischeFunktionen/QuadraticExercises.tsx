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

function fmtEq(a: number, b: number, c: number): string {
  const parts: string[] = [];
  if (a === 1) parts.push('x^2');
  else if (a === -1) parts.push('-x^2');
  else parts.push(`${a}x^2`);
  if (b !== 0) parts.push((b > 0 ? ' + ' : ' - ') + (Math.abs(b) === 1 ? '' : `${Math.abs(b)}`) + 'x');
  if (c !== 0) parts.push((c > 0 ? ' + ' : ' - ') + `${Math.abs(c)}`);
  return parts.join('');
}

function generateTask(): Task {
  const type = randInt(0, 6);

  switch (type) {
    case 0: {
      // Calculate f(x) for a given x
      const a = randInt(-3, 3) || 1;
      const b = randInt(-4, 4);
      const c = randInt(-5, 5);
      const x = randInt(-3, 3);
      const y = a * x * x + b * x + c;
      const eq = fmtEq(a, b, c);
      return {
        question: <>Gegeben: <M>{`f(x) = ${eq}`}</M>. Berechne <M>{`f(${x})`}</M>.</>,
        answer: y,
        tolerance: 0.01,
        hint: `f(${x}) = ${a}·(${x})² + ${b}·(${x}) + ${c} = ${a * x * x} + ${b * x} + ${c} = ${y}`,
      };
    }
    case 1: {
      // Find the discriminant
      const a = randInt(-3, 3) || 1;
      const b = randInt(-5, 5);
      const c = randInt(-5, 5);
      const D = b * b - 4 * a * c;
      const eq = fmtEq(a, b, c);
      return {
        question: <>Berechne die Diskriminante D von <M>{`f(x) = ${eq}`}</M>.</>,
        answer: D,
        tolerance: 0.01,
        hint: `D = b² - 4ac = (${b})² - 4·(${a})·(${c}) = ${b * b} - ${4 * a * c} = ${D}`,
        unit: 'D',
      };
    }
    case 2: {
      // Find the vertex x-coordinate
      const a = randInt(1, 3) * (Math.random() > 0.5 ? 1 : -1);
      const b = randInt(-6, 6);
      const c = randInt(-5, 5);
      const xv = -b / (2 * a);
      const eq = fmtEq(a, b, c);
      return {
        question: <>Bestimme die x-Koordinate des Scheitels von <M>{`f(x) = ${eq}`}</M>.</>,
        answer: xv,
        tolerance: 0.1,
        hint: `x_S = -b/(2a) = -(${b})/(2·${a}) = ${-b}/${2 * a} = ${xv.toFixed(2)}`,
        unit: 'xₛ',
      };
    }
    case 3: {
      // Find the vertex y-coordinate
      const a = randInt(1, 2) * (Math.random() > 0.5 ? 1 : -1);
      const h = randInt(-3, 3);
      const k = randInt(-5, 5);
      // f(x) = a(x-h)² + k → a·x² - 2ah·x + ah² + k
      const b = -2 * a * h;
      const c = a * h * h + k;
      const eq = fmtEq(a, b, c);
      return {
        question: <>Bestimme die y-Koordinate des Scheitels von <M>{`f(x) = ${eq}`}</M>.</>,
        answer: k,
        tolerance: 0.1,
        hint: `x_S = -b/(2a) = ${h}, y_S = f(${h}) = ${a}·(${h})² + ${b}·${h} + ${c} = ${k}`,
        unit: 'yₛ',
      };
    }
    case 4: {
      // Find zeros (give one, ensure nice discriminant)
      const x1 = randInt(-4, 0);
      const x2 = randInt(1, 5);
      const a = randInt(1, 2) * (Math.random() > 0.5 ? 1 : -1);
      // f(x) = a(x - x1)(x - x2) = a·x² - a(x1+x2)x + a·x1·x2
      const b = -a * (x1 + x2);
      const c = a * x1 * x2;
      const eq = fmtEq(a, b, c);
      return {
        question: <>Eine Nullstelle von <M>{`f(x) = ${eq}`}</M> ist <M>{`x_1 = ${x1}`}</M>. Bestimme <M>{'x_2'}</M>.</>,
        answer: x2,
        tolerance: 0.1,
        hint: `Ausklammern: f(x) = ${a}(x - ${x1})(x - ${x2}), also x₂ = ${x2}`,
        unit: 'x₂',
      };
    }
    case 5: {
      // How many zeros? (answer 0, 1, or 2)
      const variant = randInt(0, 2);
      let a: number, b: number, c: number;
      if (variant === 0) {
        // D > 0 → 2 zeros
        a = randInt(1, 2);
        b = randInt(3, 6);
        c = 0;
      } else if (variant === 1) {
        // D = 0 → 1 zero
        a = randInt(1, 3);
        const h = randInt(-3, 3);
        b = -2 * a * h;
        c = a * h * h;
      } else {
        // D < 0 → 0 zeros
        a = randInt(1, 3);
        b = 0;
        c = randInt(1, 5);
      }
      const D = b * b - 4 * a * c;
      const count = D > 0.001 ? 2 : D > -0.001 ? 1 : 0;
      const eq = fmtEq(a, b, c);
      return {
        question: <>Wie viele Nullstellen hat <M>{`f(x) = ${eq}`}</M>? (0, 1 oder 2)</>,
        answer: count,
        tolerance: 0.01,
        hint: `D = ${b}² - 4·${a}·${c} = ${D} → ${count} Nullstelle(n)`,
      };
    }
    case 6:
    default: {
      // Find c so the parabola passes through a point
      const a = randInt(1, 2) * (Math.random() > 0.5 ? 1 : -1);
      const b = randInt(-3, 3);
      const px = randInt(-3, 3) || 1;
      const c = randInt(-5, 5);
      const py = a * px * px + b * px + c;
      return {
        question: <>Die Parabel <M>{`f(x) = ${a === 1 ? '' : a === -1 ? '-' : a}x^2 ${b >= 0 ? '+' : '-'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x + c`}</M> geht durch <M>{`P(${px}|${py})`}</M>. Bestimme c.</>,
        answer: c,
        tolerance: 0.1,
        hint: `${py} = ${a}·(${px})² + ${b}·${px} + c → c = ${py} - ${a * px * px} - ${b * px} = ${c}`,
        unit: 'c',
      };
    }
  }
}

export const QuadraticExercises: React.FC = () => {
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
            autoFocus
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
