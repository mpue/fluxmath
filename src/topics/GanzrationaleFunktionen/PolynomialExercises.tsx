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

function fmtPoly(coeffs: number[]): string {
  const parts: string[] = [];
  for (let i = coeffs.length - 1; i >= 0; i--) {
    const v = coeffs[i];
    if (Math.abs(v) < 0.001) continue;
    let sign = '';
    if (parts.length > 0) sign = v > 0 ? ' + ' : ' - ';
    else if (v < 0) sign = '-';
    const av = Math.abs(v);
    let term = '';
    if (i === 0) term = `${av}`;
    else if (i === 1) term = (av === 1 ? '' : `${av}`) + 'x';
    else term = (av === 1 ? '' : `${av}`) + 'x^{' + i + '}';
    parts.push(sign + term);
  }
  return parts.join('') || '0';
}

function evalPoly(coeffs: number[], x: number): number {
  let y = 0;
  for (let i = 0; i < coeffs.length; i++) y += coeffs[i] * Math.pow(x, i);
  return y;
}

function generateTask(): Task {
  const type = randInt(0, 6);

  switch (type) {
    case 0: {
      // Evaluate f(x) for a cubic
      const c0 = randInt(-3, 3);
      const c1 = randInt(-2, 2);
      const c2 = randInt(-2, 2);
      const c3 = randInt(-2, 2) || 1;
      const x = randInt(-2, 2);
      const coeffs = [c0, c1, c2, c3];
      const y = evalPoly(coeffs, x);
      return {
        question: <>Gegeben: <M>{`f(x) = ${fmtPoly(coeffs)}`}</M>. Berechne <M>{`f(${x})`}</M>.</>,
        answer: y,
        tolerance: 0.01,
        hint: `f(${x}) = ${c3}·(${x})³ + ${c2}·(${x})² + ${c1}·(${x}) + ${c0} = ${y}`,
      };
    }
    case 1: {
      // Degree of a polynomial
      const deg = randInt(2, 5);
      const coeffs = Array.from({ length: deg + 1 }, (_, i) =>
        i === deg ? (randInt(1, 3) * (Math.random() > 0.5 ? 1 : -1)) : randInt(-3, 3)
      );
      return {
        question: <>Welchen Grad hat das Polynom <M>{`f(x) = ${fmtPoly(coeffs)}`}</M>?</>,
        answer: deg,
        tolerance: 0.01,
        hint: `Der höchste Exponent von x ist ${deg}, also ist der Grad ${deg}.`,
      };
    }
    case 2: {
      // y-intercept = c0
      const deg = randInt(2, 4);
      const coeffs = Array.from({ length: deg + 1 }, (_, i) =>
        i === deg ? (randInt(1, 2) * (Math.random() > 0.5 ? 1 : -1)) : randInt(-5, 5)
      );
      return {
        question: <>Bestimme den y-Achsenabschnitt von <M>{`f(x) = ${fmtPoly(coeffs)}`}</M>.</>,
        answer: coeffs[0],
        tolerance: 0.01,
        hint: `f(0) = ${coeffs[0]} (alle x-Terme fallen weg)`,
        unit: 'f(0)',
      };
    }
    case 3: {
      // Max number of zeros for given degree
      const deg = randInt(2, 5);
      const coeffs = Array.from({ length: deg + 1 }, (_, i) =>
        i === deg ? (randInt(1, 2) * (Math.random() > 0.5 ? 1 : -1)) : randInt(-3, 3)
      );
      return {
        question: <>Wie viele Nullstellen kann <M>{`f(x) = ${fmtPoly(coeffs)}`}</M> maximal haben?</>,
        answer: deg,
        tolerance: 0.01,
        hint: `Ein Polynom vom Grad ${deg} hat maximal ${deg} Nullstellen.`,
      };
    }
    case 4: {
      // End behavior: f(x) → ? for x → +∞
      // Answer: 1 for +∞, -1 for -∞
      const deg = randInt(2, 5);
      const leading = randInt(1, 3) * (Math.random() > 0.5 ? 1 : -1);
      const coeffs = Array.from({ length: deg + 1 }, (_, i) =>
        i === deg ? leading : randInt(-3, 3)
      );
      const answer = leading > 0 ? 1 : -1;
      return {
        question: <>Für <M>{`f(x) = ${fmtPoly(coeffs)}`}</M>: Was ist das Vorzeichen von f(x) für x → +∞? (1 = positiv, -1 = negativ)</>,
        answer,
        tolerance: 0.01,
        hint: `Führender Koeffizient ${leading} ${leading > 0 ? '> 0' : '< 0'}, Grad ${deg} ${deg % 2 === 0 ? '(gerade)' : '(ungerade)'} → f(x) → ${answer > 0 ? '+∞' : '-∞'}`,
      };
    }
    case 5: {
      // Given zeros, find constant term
      // f(x) = a(x - r1)(x - r2)(x - r3), find f(0) = a·(-r1)·(-r2)·(-r3)
      const r1 = randInt(-3, -1);
      const r2 = randInt(1, 3);
      const r3 = randInt(-2, 2) || 1;
      const a = randInt(1, 2) * (Math.random() > 0.5 ? 1 : -1);
      const c0 = a * (-r1) * (-r2) * (-r3);
      return {
        question: <>Ein kubisches Polynom mit Leitkoeffizient <M>{`a = ${a}`}</M> hat die Nullstellen <M>{`x_1 = ${r1}`}</M>, <M>{`x_2 = ${r2}`}</M>, <M>{`x_3 = ${r3}`}</M>. Berechne den y-Achsenabschnitt.</>,
        answer: c0,
        tolerance: 0.1,
        hint: `f(0) = ${a}·(0 - ${r1})·(0 - ${r2})·(0 - ${r3}) = ${a}·${-r1}·${-r2}·${-r3} = ${c0}`,
        unit: 'f(0)',
      };
    }
    case 6:
    default: {
      // Symmetry: even function → point symmetric around y-axis?
      // Create polynomial with only even or odd powers
      const isEven = Math.random() > 0.5;
      let coeffs: number[];
      let eq: string;
      if (isEven) {
        // f(x) = ax⁴ + bx² + c
        const a4 = randInt(1, 2) * (Math.random() > 0.5 ? 1 : -1);
        const a2 = randInt(-3, 3);
        const a0 = randInt(-3, 3);
        coeffs = [a0, 0, a2, 0, a4];
        eq = fmtPoly(coeffs);
      } else {
        // f(x) = ax³ + bx
        const a3 = randInt(1, 2) * (Math.random() > 0.5 ? 1 : -1);
        const a1 = randInt(-3, 3);
        coeffs = [0, a1, 0, a3];
        eq = fmtPoly(coeffs);
      }
      // Answer: 1 for achsensymmetrisch (even), 2 for punktsymmetrisch (odd)
      return {
        question: <>Ist <M>{`f(x) = ${eq}`}</M> achsensymmetrisch (1) oder punktsymmetrisch (2) zum Ursprung?</>,
        answer: isEven ? 1 : 2,
        tolerance: 0.01,
        hint: isEven
          ? 'Nur gerade Exponenten → f(-x) = f(x) → achsensymmetrisch zur y-Achse'
          : 'Nur ungerade Exponenten → f(-x) = -f(x) → punktsymmetrisch zum Ursprung',
      };
    }
  }
}

export const PolynomialExercises: React.FC = () => {
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
