import React, { useState, useCallback } from 'react';
import { MathCanvas } from '../../shared/MathCanvas';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { LGSExercises } from './LGSExercises';

type SystemId = 'unique' | 'infinite' | 'none' | 'three';

interface LGS {
  label: string;
  matrix: number[][];     // augmented [A|b]
  rows: number;
  cols: number;           // columns including b
  description: string;
  latex: string;
}

const systems: Record<SystemId, LGS> = {
  unique: {
    label: 'Eindeutig',
    matrix: [[2, 1, 5], [1, -1, 1]],
    rows: 2, cols: 3,
    description: 'Eindeutige Loesung: x=2, y=1',
    latex: String.raw`\begin{cases} 2x + y = 5 \\ x - y = 1 \end{cases}`,
  },
  infinite: {
    label: 'Unendlich',
    matrix: [[1, 2, 3], [2, 4, 6]],
    rows: 2, cols: 3,
    description: 'Unendlich viele Loesungen (abhaengig)',
    latex: String.raw`\begin{cases} x + 2y = 3 \\ 2x + 4y = 6 \end{cases}`,
  },
  none: {
    label: 'Keine',
    matrix: [[1, 1, 2], [1, 1, 3]],
    rows: 2, cols: 3,
    description: 'Keine Loesung (widerspruchsfrei)',
    latex: String.raw`\begin{cases} x + y = 2 \\ x + y = 3 \end{cases}`,
  },
  three: {
    label: '3x3',
    matrix: [[1, 1, 1, 6], [0, 2, 1, 5], [1, 0, 2, 7]],
    rows: 3, cols: 4,
    description: 'Loesung: x=1, y=2, z=3',
    latex: String.raw`\begin{cases} x+y+z=6 \\ 2y+z=5 \\ x+2z=7 \end{cases}`,
  },
};

function gaussElim(mat: number[][]): number[][][] {
  const steps: number[][][] = [];
  const m = mat.map(r => [...r]);
  steps.push(m.map(r => [...r]));

  const rows = m.length;
  const cols = m[0].length;

  for (let col = 0; col < Math.min(rows, cols - 1); col++) {
    // Pivot
    let pivotRow = -1;
    for (let r = col; r < rows; r++) {
      if (Math.abs(m[r][col]) > 1e-10) { pivotRow = r; break; }
    }
    if (pivotRow === -1) continue;
    if (pivotRow !== col) {
      [m[col], m[pivotRow]] = [m[pivotRow], m[col]];
      steps.push(m.map(r => [...r]));
    }
    // Eliminate below
    for (let r = col + 1; r < rows; r++) {
      if (Math.abs(m[r][col]) < 1e-10) continue;
      const factor = m[r][col] / m[col][col];
      for (let c = col; c < cols; c++) {
        m[r][c] -= factor * m[col][c];
      }
      steps.push(m.map(r => [...r]));
    }
  }
  return steps;
}

export const LineareGleichungssysteme: React.FC = () => {
  const [sysId, setSysId] = useState<SystemId>('unique');
  const [step, setStep] = useState(0);

  const sys = systems[sysId];
  const steps = gaussElim(sys.matrix);
  const maxStep = steps.length - 1;
  const currentStep = Math.min(step, maxStep);
  const currentMatrix = steps[currentStep];

  const draw = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, mx: number, my: number) => {
    const w = canvas.width;
    const h = canvas.height;

    // Draw the augmented matrix
    const rows = currentMatrix.length;
    const cols = currentMatrix[0].length;
    const cellW = Math.min(80, (w - 80) / cols);
    const cellH = 40;
    const startX = (w - cols * cellW) / 2;
    const startY = (h - rows * cellH) / 2;

    // Brackets
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.shadowColor = C.lineGlow;
    ctx.shadowBlur = 6;
    // Left bracket
    const bx = startX - 12;
    ctx.beginPath();
    ctx.moveTo(bx + 8, startY - 8);
    ctx.lineTo(bx, startY - 8);
    ctx.lineTo(bx, startY + rows * cellH + 8);
    ctx.lineTo(bx + 8, startY + rows * cellH + 8);
    ctx.stroke();
    // Right bracket
    const rx = startX + cols * cellW + 12;
    ctx.beginPath();
    ctx.moveTo(rx - 8, startY - 8);
    ctx.lineTo(rx, startY - 8);
    ctx.lineTo(rx, startY + rows * cellH + 8);
    ctx.lineTo(rx - 8, startY + rows * cellH + 8);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Separator line before last column (b)
    const sepX = startX + (cols - 1) * cellW;
    ctx.strokeStyle = 'rgba(255,170,0,0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sepX, startY - 4);
    ctx.lineTo(sepX, startY + rows * cellH + 4);
    ctx.stroke();
    ctx.setLineDash([]);

    // Values
    ctx.font = '16px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = currentMatrix[r][c];
        const px = startX + c * cellW + cellW / 2;
        const py = startY + r * cellH + cellH / 2;

        // Highlight pivot
        const isPivot = r < cols - 1 && c === r && Math.abs(val) > 1e-10;
        if (isPivot) {
          ctx.fillStyle = 'rgba(0,212,255,0.08)';
          ctx.fillRect(startX + c * cellW, startY + r * cellH, cellW, cellH);
        }

        ctx.fillStyle = c === cols - 1 ? C.orange : (Math.abs(val) < 1e-10 ? 'rgba(0,212,255,0.2)' : C.line);
        ctx.fillText(Math.abs(val) < 1e-10 ? '0' : fmt(val, 2), px, py);
      }
    }

    // Step info
    ctx.fillStyle = 'rgba(0,212,255,0.5)';
    ctx.font = '11px "Share Tech Mono"';
    ctx.textAlign = 'left';
    ctx.fillText(`Schritt ${currentStep} / ${maxStep}`, 12, h - 12);

    // Title labels
    ctx.fillStyle = 'rgba(0,212,255,0.3)';
    ctx.textAlign = 'center';
    for (let c = 0; c < cols - 1; c++) {
      const labels = ['x', 'y', 'z', 'w'];
      ctx.fillText(labels[c] || `x${c + 1}`, startX + c * cellW + cellW / 2, startY - 16);
    }
    ctx.fillStyle = 'rgba(255,170,0,0.4)';
    ctx.fillText('b', startX + (cols - 1) * cellW + cellW / 2, startY - 16);

    return '';
  }, [currentMatrix, currentStep, maxStep]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Lineare <em>Gleichungssysteme</em></h1>
      <p className="subtitle">Gauss-Elimination, Rang &amp; Loesbarkeit</p>

      <MathCanvas draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">System</span></div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {(Object.keys(systems) as SystemId[]).map(id => (
              <button key={id} onClick={() => { setSysId(id); setStep(0); }} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '11px',
                background: id === sysId ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: id === sysId ? '#00d4ff' : '#2a5a70',
              }}>
                {systems[id].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Gauss-Schritt</span>
            <span className="ctrl-value amber">{currentStep} / {maxStep}</span>
          </div>
          <input type="range" min={0} max={maxStep} step={1} value={currentStep}
            onChange={e => setStep(Number(e.target.value))} />
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Gleichungssystem</div>
          <div className="value"><M>{sys.latex}</M></div>
        </div>
        <div className="info-card slope">
          <div className="label">Loesungstyp</div>
          <div className="value">{sys.description}</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />Koeffizienten A</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Rechte Seite b</div>
      </div>

      <div className="explanation">
        <h2>Erlaeuterung</h2>
        <p>
          Ein <strong>lineares Gleichungssystem</strong> <M>{String.raw`Ax = b`}</M> kann Null, eine oder
          unendlich viele Loesungen besitzen.
        </p>
        <p>
          Das <strong>Gauss-Verfahren</strong> bringt die erweiterte Matrix <M>{String.raw`[A|b]`}</M> auf
          Zeilenstufenform durch drei Operationen: Zeilentausch, Skalierung und Subtraktion eines Vielfachen.
        </p>
        <p>
          Der <strong>Rang</strong> der Matrix bestimmt die Loesbarkeit:{' '}
          <M>{String.raw`\text{rang}(A) = \text{rang}(A|b)`}</M> ist notwendig fuer Loesbarkeit.
          Ist <M>{String.raw`\text{rang}(A) < n`}</M>, gibt es freie Variablen.
        </p>
        <p>
          Die <strong>Rueckwaertssubstitution</strong> liefert aus der Stufenform die konkreten Loesungswerte.
        </p>
      </div>
      <LGSExercises />
    </>
  );
};
