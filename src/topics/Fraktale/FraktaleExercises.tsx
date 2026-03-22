import React, { useState, useCallback } from 'react';
import { Math as M } from '../../shared/Math';
import { recordResult } from '../../shared/ProgressStore';

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

function iterate(cRe: number, cIm: number, z0Re: number, z0Im: number, maxIter: number): number {
  let zr = z0Re, zi = z0Im;
  for (let i = 0; i < maxIter; i++) {
    if (zr * zr + zi * zi > 4) return i;
    const nr = zr * zr - zi * zi + cRe;
    zi = 2 * zr * zi + cIm;
    zr = nr;
  }
  return maxIter;
}

function generateTask(): Task {
  const type = randInt(0, 6);

  switch (type) {
    case 0: {
      // z₁ = z₀² + c for simple values
      const c = [[-1, 0], [0, 1], [-0.5, 0.5], [0.25, 0], [-1, 0.5]][randInt(0, 4)];
      const z0 = [0, 0];
      // compute z₁ = 0² + c = c
      // compute z₂ = c² + c
      const z1Re = c[0], z1Im = c[1];
      const z2Re = z1Re * z1Re - z1Im * z1Im + c[0];
      const z2Im = 2 * z1Re * z1Im + c[1];
      const ans = Math.round(z2Re * 100) / 100;
      return {
        question: <>Für <M>{`c = ${c[0]} ${c[1] >= 0 ? '+' : '-'} ${Math.abs(c[1])}i`}</M> und <M>{'z_0 = 0'}</M>: Berechne <M>{'\\text{Re}(z_2)'}</M> (auf 2 Dezimalstellen).</>,
        answer: ans,
        tolerance: 0.05,
        hint: `z₁ = 0² + c = ${z1Re} + ${z1Im}i\nz₂ = z₁² + c = (${z1Re})² - (${z1Im})² + ${c[0]} + ...\nRe(z₂) = ${ans}`,
        unit: 'Re(z₂)',
      };
    }
    case 1: {
      // |z| after one iteration
      const cVals = [[0, 1], [-1, 0], [0.5, 0.5], [-0.5, -0.5]][randInt(0, 3)];
      const z1Re = cVals[0], z1Im = cVals[1]; // z₁ = 0 + c = c
      const mod = Math.round(Math.sqrt(z1Re * z1Re + z1Im * z1Im) * 100) / 100;
      return {
        question: <>Für <M>{`c = ${cVals[0]} ${cVals[1] >= 0 ? '+' : '-'} ${Math.abs(cVals[1])}i`}</M> und <M>{'z_0 = 0'}</M>: Wie groß ist <M>{'|z_1|'}</M>?</>,
        answer: mod,
        tolerance: 0.05,
        hint: `z₁ = 0² + c = c = ${z1Re} + ${z1Im}i\n|z₁| = √(${z1Re}² + ${z1Im}²) = ${mod}`,
        unit: '|z₁|',
      };
    }
    case 2: {
      // Does c belong to Mandelbrot set?
      // Pick c that clearly does or doesn't belong
      const cases = [
        { cRe: 0, cIm: 0, inSet: 1 },
        { cRe: -1, cIm: 0, inSet: 1 },
        { cRe: 0.3, cIm: 0, inSet: 1 },
        { cRe: 1, cIm: 0, inSet: 0 },
        { cRe: -2.1, cIm: 0, inSet: 0 },
        { cRe: 0, cIm: 1.5, inSet: 0 },
      ];
      const { cRe, cIm, inSet } = cases[randInt(0, cases.length - 1)];
      return {
        question: <>Gehört <M>{`c = ${cRe} ${cIm >= 0 ? '+' : '-'} ${Math.abs(cIm)}i`}</M> zur Mandelbrot-Menge? (1 = ja, 0 = nein)</>,
        answer: inSet,
        tolerance: 0.01,
        hint: `Iteriere z → z² + c ab z₀ = 0. ${inSet ? 'Die Folge bleibt beschränkt → c ∈ M' : 'Die Folge divergiert → c ∉ M'}`,
      };
    }
    case 3: {
      // Escape iteration count
      const cRe = 1, cIm = 0;
      // z₀=0, z₁=1, z₂=1+1=2, z₃=4+1=5 > 4 → escapes at n=3
      return {
        question: <>Für <M>{'c = 1'}</M> und <M>{'z_0 = 0'}</M>: Nach wie vielen Iterationen gilt <M>{'|z_n| > 2'}</M>?</>,
        answer: 3,
        tolerance: 0.01,
        hint: 'z₀ = 0 → z₁ = 0² + 1 = 1 → z₂ = 1 + 1 = 2 → z₃ = 4 + 1 = 5 → |5| > 2 ✓ → n = 3',
        unit: 'n',
      };
    }
    case 4: {
      // Fractal dimension of Koch curve
      return {
        question: <>Berechne die Hausdorff-Dimension der Koch-Kurve: <M>{'D = \\frac{\\ln 4}{\\ln 3}'}</M> (auf 3 Dezimalstellen).</>,
        answer: Math.round(Math.log(4) / Math.log(3) * 1000) / 1000,
        tolerance: 0.005,
        hint: `D = ln(4)/ln(3) = ${(Math.log(4) / Math.log(3)).toFixed(4)}`,
        unit: 'D',
      };
    }
    case 5: {
      // Sierpinski triangle dimension
      return {
        question: <>Berechne die Hausdorff-Dimension des Sierpinski-Dreiecks: <M>{'D = \\frac{\\ln 3}{\\ln 2}'}</M> (auf 3 Dezimalstellen).</>,
        answer: Math.round(Math.log(3) / Math.log(2) * 1000) / 1000,
        tolerance: 0.005,
        hint: `D = ln(3)/ln(2) = ${(Math.log(3) / Math.log(2)).toFixed(4)}`,
        unit: 'D',
      };
    }
    case 6:
    default: {
      // Escape radius question
      return {
        question: <>Ab welchem Betrag <M>{'|z_n|'}</M> gilt für die Mandelbrot-Iteration sicher, dass die Folge divergiert?</>,
        answer: 2,
        tolerance: 0.01,
        hint: 'Der Escape-Radius der Mandelbrot-Menge ist |z| > 2.',
        unit: '|z|',
      };
    }
  }
}

export const FraktaleExercises: React.FC = () => {
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
    const newScore = { correct: score.correct + (isCorrect ? 1 : 0), total: score.total + 1 };
    setScore(newScore);
    recordResult('fraktale', isCorrect ? 1 : 0, 1);
  }, [input, task, score]);
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
        {state === 'wrong' && <div className="exercise-feedback wrong">✗ Leider falsch — die richtige Antwort ist <strong>{task.answer % 1 === 0 ? task.answer : task.answer.toFixed(3)}</strong></div>}
        {state === 'idle' && <button className="exercise-hint-toggle" onClick={() => setShowHint(!showHint)}>{showHint ? 'Hinweis ausblenden' : '💡 Hinweis anzeigen'}</button>}
        {showHint && state === 'idle' && <div className="exercise-hint">{task.hint}</div>}
      </div>
    </div>
  );
};
