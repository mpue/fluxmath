import React, { useState, useCallback } from 'react';
import { MathCanvas } from '../../shared/MathCanvas';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { MatrixExercises } from './MatrixExercises';

type Op = 'none' | 'add' | 'mult' | 'det' | 'transpose';

function det2(a: number[][]): number {
  return a[0][0] * a[1][1] - a[0][1] * a[1][0];
}

function matMul2(a: number[][], b: number[][]): number[][] {
  return [
    [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
    [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
  ];
}

function matAdd2(a: number[][], b: number[][]): number[][] {
  return [
    [a[0][0] + b[0][0], a[0][1] + b[0][1]],
    [a[1][0] + b[1][0], a[1][1] + b[1][1]],
  ];
}

function transpose2(a: number[][]): number[][] {
  return [[a[0][0], a[1][0]], [a[0][1], a[1][1]]];
}

export const Matrizen: React.FC = () => {
  const [a00, setA00] = useState(20); const [a01, setA01] = useState(10);
  const [a10, setA10] = useState(5);  const [a11, setA11] = useState(15);
  const [b00, setB00] = useState(10); const [b01, setB01] = useState(-5);
  const [b10, setB10] = useState(5);  const [b11, setB11] = useState(20);
  const [op, setOp] = useState<Op>('none');

  const A = [[a00 / 10, a01 / 10], [a10 / 10, a11 / 10]];
  const B = [[b00 / 10, b01 / 10], [b10 / 10, b11 / 10]];
  const detA = det2(A);
  const detB = det2(B);

  const result = op === 'add' ? matAdd2(A, B) :
                 op === 'mult' ? matMul2(A, B) :
                 op === 'transpose' ? transpose2(A) :
                 null;

  const draw = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, mx: number, my: number): string => {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement!.clientWidth;
    const h = Math.min(w * 0.55, 400);
    canvas.style.height = h + 'px';
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    const scale = Math.min(w, h) * 0.08;

    // Grid
    ctx.strokeStyle = '#0d2530';
    ctx.lineWidth = 0.5;
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * scale, 0); ctx.lineTo(cx + i * scale, h); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, cy + i * scale); ctx.lineTo(w, cy + i * scale); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#1a3a4a';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();

    // Draw unit square transformation by matrix A
    const unitSquare = [[0, 0], [1, 0], [1, 1], [0, 1]];

    // Transformed by A
    const transformedA = unitSquare.map(([x, y]) => [
      A[0][0] * x + A[0][1] * y,
      A[1][0] * x + A[1][1] * y,
    ]);

    // Unit square (faint)
    ctx.strokeStyle = '#2a5a70';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const [px, py] = unitSquare[i];
      const sx = cx + px * scale, sy = cy - py * scale;
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Transformed square
    ctx.fillStyle = 'rgba(0,212,255,0.08)';
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 2;
    ctx.shadowColor = C.cyan;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const [px, py] = transformedA[i];
      const sx = cx + px * scale, sy = cy - py * scale;
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Column vectors of A as arrows
    const drawArrow = (x: number, y: number, color: string, glow: string) => {
      const sx = cx, sy = cy;
      const ex = cx + x * scale, ey = cy - y * scale;
      const dx = ex - sx, dy = ey - sy;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 2) return;
      const ux = dx / len, uy = dy / len;
      const headLen = Math.min(12, len * 0.25);
      ctx.shadowColor = glow; ctx.shadowBlur = 10;
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = color; ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - ux * headLen - uy * headLen * 0.35, ey - uy * headLen + ux * headLen * 0.35);
      ctx.lineTo(ex - ux * headLen + uy * headLen * 0.35, ey - uy * headLen - ux * headLen * 0.35);
      ctx.closePath(); ctx.fill();
    };

    drawArrow(A[0][0], A[1][0], C.cyan, C.cyan);  // Column 1
    drawArrow(A[0][1], A[1][1], C.lime, C.lime);   // Column 2

    // If result, show result parallelogram
    if (result && (op === 'mult' || op === 'add')) {
      const trRes = unitSquare.map(([x, y]) => [
        result[0][0] * x + result[0][1] * y,
        result[1][0] * x + result[1][1] * y,
      ]);
      ctx.fillStyle = 'rgba(255,170,0,0.06)';
      ctx.strokeStyle = C.amber;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const [px, py] = trRes[i];
        const sx2 = cx + px * scale, sy2 = cy - py * scale;
        i === 0 ? ctx.moveTo(sx2, sy2) : ctx.lineTo(sx2, sy2);
      }
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Labels
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = C.cyan;
    ctx.fillText('e₁ → (' + fmt(A[0][0]) + ', ' + fmt(A[1][0]) + ')', cx + A[0][0] * scale + 5, cy - A[1][0] * scale - 8);
    ctx.fillStyle = C.lime;
    ctx.fillText('e₂ → (' + fmt(A[0][1]) + ', ' + fmt(A[1][1]) + ')', cx + A[0][1] * scale + 5, cy - A[1][1] * scale - 8);

    // Hover
    const gx = (mx - cx) / scale;
    const gy = -(my - cy) / scale;
    if (mx > 0 && my > 0) {
      return `x = ${fmt(gx, 1)}  y = ${fmt(gy, 1)}`;
    }
    return '';
  }, [A, B, op, result]);

  const fmtMat = (m: number[][]) => `(${fmt(m[0][0])}, ${fmt(m[0][1])} | ${fmt(m[1][0])}, ${fmt(m[1][1])})`;

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Matrizen<em>rechnung</em></h1>
      <p className="subtitle">2×2-Matrizen, Determinante, Multiplikation &amp; Transponierte</p>

      <MathCanvas draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Operation</span>
          </div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {([
              ['none', 'Matrix A'],
              ['add', 'A + B'],
              ['mult', 'A · B'],
              ['det', 'det(A)'],
              ['transpose', 'Aᵀ'],
            ] as const).map(([id, label]) => (
              <button key={id} onClick={() => setOp(id)} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '10px',
                background: id === op ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: id === op ? '#00d4ff' : '#2a5a70',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="controls" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">a₁₁</span>
            <span className="ctrl-value cyan">{fmt(A[0][0])}</span>
          </div>
          <input type="range" min={-30} max={30} step={1} value={a00}
            onChange={e => setA00(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">a₁₂</span>
            <span className="ctrl-value cyan">{fmt(A[0][1])}</span>
          </div>
          <input type="range" min={-30} max={30} step={1} value={a01}
            onChange={e => setA01(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">a₂₁</span>
            <span className="ctrl-value cyan">{fmt(A[1][0])}</span>
          </div>
          <input type="range" min={-30} max={30} step={1} value={a10}
            onChange={e => setA10(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">a₂₂</span>
            <span className="ctrl-value cyan">{fmt(A[1][1])}</span>
          </div>
          <input type="range" min={-30} max={30} step={1} value={a11}
            onChange={e => setA11(Number(e.target.value))} />
        </div>
      </div>

      {(op === 'add' || op === 'mult') && (
        <div className="controls" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
          <div className="ctrl">
            <div className="ctrl-header">
              <span className="ctrl-label">b₁₁</span>
              <span className="ctrl-value lime">{fmt(B[0][0])}</span>
            </div>
            <input type="range" min={-30} max={30} step={1} value={b00}
              onChange={e => setB00(Number(e.target.value))} />
          </div>
          <div className="ctrl">
            <div className="ctrl-header">
              <span className="ctrl-label">b₁₂</span>
              <span className="ctrl-value lime">{fmt(B[0][1])}</span>
            </div>
            <input type="range" min={-30} max={30} step={1} value={b01}
              onChange={e => setB01(Number(e.target.value))} />
          </div>
          <div className="ctrl">
            <div className="ctrl-header">
              <span className="ctrl-label">b₂₁</span>
              <span className="ctrl-value lime">{fmt(B[1][0])}</span>
            </div>
            <input type="range" min={-30} max={30} step={1} value={b10}
              onChange={e => setB10(Number(e.target.value))} />
          </div>
          <div className="ctrl">
            <div className="ctrl-header">
              <span className="ctrl-label">b₂₂</span>
              <span className="ctrl-value lime">{fmt(B[1][1])}</span>
            </div>
            <input type="range" min={-30} max={30} step={1} value={b11}
              onChange={e => setB11(Number(e.target.value))} />
          </div>
        </div>
      )}

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Determinante A</div>
          <div className="value">det(A) = {fmt(detA, 2)}</div>
          <div className="detail">{detA === 0 ? 'singulär (nicht invertierbar)' : detA > 0 ? 'orientierungserhaltend' : 'orientierungsumkehrend'}</div>
        </div>
        <div className="info-card slope">
          <div className="label">Matrix A</div>
          <div className="value">{fmtMat(A)}</div>
          <div className="detail">Spalten = Bilder der Einheitsvektoren</div>
        </div>
        <div className="info-card zero">
          <div className="label">{op === 'add' ? 'A + B' : op === 'mult' ? 'A · B' : op === 'transpose' ? 'Aᵀ' : 'det(B)'}</div>
          <div className="value">
            {result ? fmtMat(result) :
             op === 'det' ? `det(A) = ${fmt(detA, 2)}, det(B) = ${fmt(detB, 2)}` :
             fmtMat(A)}
          </div>
          <div className="detail">
            {op === 'mult' ? `det(A·B) = ${fmt(detA * detB, 2)}` :
             op === 'transpose' ? 'Zeilen ↔ Spalten' :
             op === 'det' ? `det(A)·det(B) = ${fmt(detA * detB, 2)}` :
             ''}
          </div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />Spalte 1 (e₁-Bild)</div>
        <div className="legend-item"><div className="legend-dot glow-lime" />Spalte 2 (e₂-Bild)</div>
        {result && <div className="legend-item"><div className="legend-dot glow-amber" />Ergebnis</div>}
      </div>

      <div className="explanation">
        <h2>Erläuterung</h2>
        <p>
          Eine <strong>Matrix</strong> ist ein rechteckiges Zahlenschema. Eine 2×2-Matrix{' '}
          <M>{'A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}'}</M>{' '}
          beschreibt eine <strong>lineare Abbildung</strong> der Ebene.
        </p>
        <p>
          Die <strong>Determinante</strong> <M>{'\\det(A) = ad - bc'}</M> gibt den Flächenfaktor der Abbildung an.
          Ist <M>{'\\det(A) = 0'}</M>, bildet A die Ebene auf eine Gerade oder einen Punkt ab (singulär).
        </p>
        <p>
          <strong>Matrixmultiplikation</strong>: <M>{'(A \\cdot B)_{ij} = \\sum_k A_{ik} B_{kj}'}</M> —
          Zeile von A · Spalte von B. Sie ist <strong>nicht kommutativ</strong>: A·B ≠ B·A im Allgemeinen.
        </p>
        <p>
          Die <strong>Transponierte</strong> <M>{'A^T'}</M> vertauscht Zeilen und Spalten.
          Es gilt: <M>{'(A \\cdot B)^T = B^T \\cdot A^T'}</M>.
        </p>
      </div>
      <MatrixExercises />
    </>
  );
};
