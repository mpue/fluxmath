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
      // Point on line at parameter t
      const px = randInt(-3, 3), py = randInt(-3, 3), pz = randInt(-3, 3);
      const vx = randInt(-3, 3) || 1, vy = randInt(-3, 3), vz = randInt(-3, 3);
      const t = randInt(-2, 3);
      const comp = ['x', 'y', 'z'][randInt(0, 2)];
      const vals = [px + t * vx, py + t * vy, pz + t * vz];
      const answer = vals[comp === 'x' ? 0 : comp === 'y' ? 1 : 2];
      return {
        question: <>Gerade <M>{`g: \\vec{x} = \\begin{pmatrix}${px}\\\\${py}\\\\${pz}\\end{pmatrix} + t \\cdot \\begin{pmatrix}${vx}\\\\${vy}\\\\${vz}\\end{pmatrix}`}</M>. Welchen Wert hat die <strong>{comp}</strong>-Koordinate fuer <M>{`t = ${t}`}</M>?</>,
        answer,
        tolerance: 0.01,
        hint: `${comp} = ${comp === 'x' ? px : comp === 'y' ? py : pz} + ${t} * ${comp === 'x' ? vx : comp === 'y' ? vy : vz} = ${answer}`,
      };
    }
    case 1: {
      // Plane equation: compute d from n and Q
      const nx = randInt(-3, 3) || 1, ny = randInt(-3, 3), nz = randInt(-3, 3);
      const qx = randInt(-2, 2), qy = randInt(-2, 2), qz = randInt(-2, 2);
      const d = nx * qx + ny * qy + nz * qz;
      return {
        question: <>Ebene mit Normalenvektor <M>{`\\vec{n} = \\begin{pmatrix}${nx}\\\\${ny}\\\\${nz}\\end{pmatrix}`}</M> durch <M>{`Q(${qx}|${qy}|${qz})`}</M>. Berechne d in der Gleichung <M>{`\\vec{n} \\cdot \\vec{x} = d`}</M>.</>,
        answer: d,
        tolerance: 0.01,
        hint: `d = n * Q = ${nx}*${qx} + ${ny}*${qy} + ${nz}*${qz} = ${d}`,
        unit: 'd',
      };
    }
    case 2: {
      // Distance point to plane
      const nx = randInt(1, 3), ny = 0, nz = 0;
      const d = randInt(-5, 5);
      const px = randInt(-4, 4), py = randInt(-2, 2), pz = randInt(-2, 2);
      const dist = Math.abs(nx * px + ny * py + nz * pz - d) / Math.sqrt(nx * nx + ny * ny + nz * nz);
      const answer = Math.round(dist * 100) / 100;
      return {
        question: <>Berechne den Abstand von <M>{`P(${px}|${py}|${pz})`}</M> zur Ebene <M>{`${nx}x ${ny >= 0 ? '+' : '-'} ${Math.abs(ny)}y ${nz >= 0 ? '+' : '-'} ${Math.abs(nz)}z = ${d}`}</M> (2 Dezimalstellen).</>,
        answer,
        tolerance: 0.05,
        hint: `d = |${nx}*${px} + ${ny}*${py} + ${nz}*${pz} - ${d}| / sqrt(${nx}^2 + ${ny}^2 + ${nz}^2) = ${answer}`,
        unit: 'd',
      };
    }
    case 3: {
      // Check if point lies on line (find t from x-component, verify)
      const px = randInt(-2, 2), py = randInt(-2, 2), pz = randInt(-2, 2);
      const vx = randInt(1, 3), vy = randInt(-2, 2), vz = randInt(-2, 2);
      const t = randInt(-2, 3);
      const testX = px + t * vx, testY = py + t * vy, testZ = pz + t * vz;
      // Randomly break one coordinate sometimes
      const onLine = Math.random() > 0.4;
      const badZ = onLine ? testZ : testZ + randInt(1, 3);
      return {
        question: <>Liegt <M>{`R(${testX}|${testY}|${badZ})`}</M> auf der Geraden <M>{`g: \\vec{x} = \\begin{pmatrix}${px}\\\\${py}\\\\${pz}\\end{pmatrix} + t \\cdot \\begin{pmatrix}${vx}\\\\${vy}\\\\${vz}\\end{pmatrix}`}</M>? Antwort: 1 = ja, 0 = nein.</>,
        answer: onLine ? 1 : 0,
        tolerance: 0.01,
        hint: onLine
          ? `Fuer t=${t}: (${testX}, ${testY}, ${badZ}) stimmt in allen Koordinaten.`
          : `Aus x: t=${t}, dann z muesste ${testZ} sein, ist aber ${badZ}.`,
      };
    }
    case 4: {
      // Dot product n*v to check parallelism
      const nx = randInt(-3, 3) || 1, ny = randInt(-3, 3), nz = randInt(-3, 3);
      const vx = randInt(-3, 3) || 1, vy = randInt(-3, 3), vz = randInt(-3, 3);
      const dot = nx * vx + ny * vy + nz * vz;
      return {
        question: <>Berechne <M>{`\\vec{n} \\cdot \\vec{v}`}</M> fuer <M>{`\\vec{n} = \\begin{pmatrix}${nx}\\\\${ny}\\\\${nz}\\end{pmatrix}`}</M> und <M>{`\\vec{v} = \\begin{pmatrix}${vx}\\\\${vy}\\\\${vz}\\end{pmatrix}`}</M>. Ist das Ergebnis 0, ist die Gerade parallel zur Ebene.</>,
        answer: dot,
        tolerance: 0.01,
        hint: `n*v = ${nx}*${vx} + ${ny}*${vy} + ${nz}*${vz} = ${dot}`,
      };
    }
    case 5:
    default: {
      // Find intersection parameter
      const px = randInt(-2, 2), py = randInt(-2, 2), pz = randInt(-2, 2);
      const vx = randInt(1, 2), vy = randInt(-2, 2), vz = randInt(1, 2);
      const nx = randInt(1, 3), ny = 0, nz = 0;
      const d = randInt(-5, 5);
      const dotNV = nx * vx + ny * vy + nz * vz;
      if (Math.abs(dotNV) < 0.01) {
        return {
          question: <>Berechne <M>{`\\vec{n} \\cdot \\vec{v}`}</M> fuer <M>{`\\vec{n}=(${nx},${ny},${nz})`}</M> und <M>{`\\vec{v}=(${vx},${vy},${vz})`}</M>.</>,
          answer: dotNV,
          tolerance: 0.01,
          hint: `n*v = ${dotNV}`,
        };
      }
      const t = (d - (nx * px + ny * py + nz * pz)) / dotNV;
      const answer = Math.round(t * 100) / 100;
      return {
        question: <>Gerade <M>{`\\vec{x}=(${px},${py},${pz})^T + t(${vx},${vy},${vz})^T`}</M>, Ebene <M>{`${nx}x = ${d}`}</M>. Berechne den Schnittparameter t (2 Dezimalstellen).</>,
        answer,
        tolerance: 0.05,
        hint: `t = (${d} - (${nx}*${px})) / (${nx}*${vx}) = ${answer}`,
        unit: 't',
      };
    }
  }
}

export const GeradenEbenenExercises: React.FC = () => {
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
