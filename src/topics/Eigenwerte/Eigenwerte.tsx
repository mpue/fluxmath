import React, { useState, useCallback } from 'react';
import { MathCanvas } from '../../shared/MathCanvas';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { EigenExercises } from './EigenExercises';

type MatId = 'diag' | 'shear' | 'rotation' | 'sym';

const matrices: Record<MatId, {
  label: string;
  a: number; b: number; c: number; d: number;
  latex: string;
}> = {
  diag: { label: 'Diagonal', a: 2, b: 0, c: 0, d: 1, latex: String.raw`\begin{pmatrix} 2 & 0 \\ 0 & 1 \end{pmatrix}` },
  shear: { label: 'Scherung', a: 1, b: 1, c: 0, d: 2, latex: String.raw`\begin{pmatrix} 1 & 1 \\ 0 & 2 \end{pmatrix}` },
  rotation: { label: 'Streckdrehung', a: 1, b: -1, c: 1, d: 1, latex: String.raw`\begin{pmatrix} 1 & -1 \\ 1 & 1 \end{pmatrix}` },
  sym: { label: 'Symmetrisch', a: 3, b: 1, c: 1, d: 3, latex: String.raw`\begin{pmatrix} 3 & 1 \\ 1 & 3 \end{pmatrix}` },
};

function eigenvalues2x2(a: number, b: number, c: number, d: number): [number, number] | null {
  const trace = a + d;
  const det = a * d - b * c;
  const disc = trace * trace - 4 * det;
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  return [(trace + sq) / 2, (trace - sq) / 2];
}

function eigenvector(a: number, b: number, c: number, d: number, lambda: number): [number, number] {
  // (A - lambda*I)v = 0
  const a1 = a - lambda;
  const b1 = b;
  if (Math.abs(b1) > 1e-10) return [-b1, a1];
  if (Math.abs(a1) > 1e-10) return [0, 1];
  return [1, 0];
}

export const Eigenwerte: React.FC = () => {
  const [matId, setMatId] = useState<MatId>('diag');

  const mat = matrices[matId];
  const { a, b, c, d } = mat;
  const evals = eigenvalues2x2(a, b, c, d);
  const trace = a + d;
  const det = a * d - b * c;

  const draw = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, mx: number, my: number) => {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) / 8;

    function toX(x: number) { return cx + x * scale; }
    function toY(y: number) { return cy - y * scale; }

    // Grid
    ctx.strokeStyle = 'rgba(0,212,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(toX(i), 0); ctx.lineTo(toX(i), h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, toY(i)); ctx.lineTo(w, toY(i)); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(0,212,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();

    // Show transformation of unit circle
    ctx.strokeStyle = 'rgba(0,212,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, scale, 0, Math.PI * 2);
    ctx.stroke();

    // Transformed circle (ellipse)
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.shadowColor = C.lineGlow;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.02) {
      const vx = Math.cos(t);
      const vy = Math.sin(t);
      const tx = a * vx + b * vy;
      const ty = c * vx + d * vy;
      if (t === 0) ctx.moveTo(toX(tx), toY(ty));
      else ctx.lineTo(toX(tx), toY(ty));
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw eigenvectors (if real eigenvalues exist)
    if (evals) {
      const colors: [string, string][] = [[C.orange, C.orangeGlow], [C.magenta, C.magentaGlow]];
      for (let i = 0; i < 2; i++) {
        const lam = evals[i];
        const [ex, ey] = eigenvector(a, b, c, d, lam);
        const len = Math.sqrt(ex * ex + ey * ey);
        if (len < 1e-10) continue;
        const nx = ex / len;
        const ny = ey / len;

        // Original eigenvector
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = colors[i][0];
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(toX(-nx * 3), toY(-ny * 3));
        ctx.lineTo(toX(nx * 3), toY(ny * 3));
        ctx.stroke();
        ctx.setLineDash([]);

        // Transformed eigenvector (scaled by lambda)
        ctx.strokeStyle = colors[i][0];
        ctx.shadowColor = colors[i][1];
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(toX(0), toY(0));
        ctx.lineTo(toX(nx * lam), toY(ny * lam));
        ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(-ny * lam * scale, nx * lam * scale);
        ctx.fillStyle = colors[i][0];
        ctx.beginPath();
        ctx.moveTo(toX(nx * lam), toY(ny * lam));
        ctx.lineTo(toX(nx * lam) - 10 * Math.cos(angle - 0.4), toY(ny * lam) + 10 * Math.sin(angle - 0.4));
        ctx.lineTo(toX(nx * lam) - 10 * Math.cos(angle + 0.4), toY(ny * lam) + 10 * Math.sin(angle + 0.4));
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = '11px "Share Tech Mono"';
        ctx.fillStyle = colors[i][0];
        ctx.textAlign = 'left';
        ctx.fillText(`l${i + 1}=${fmt(lam, 2)}`, toX(nx * lam) + 8, toY(ny * lam) - 4);
      }
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '12px "Share Tech Mono"';
      ctx.textAlign = 'center';
      ctx.fillText('Komplexe Eigenwerte - keine reellen Eigenrichtungen', cx, 20);
    }

    // Origin
    ctx.fillStyle = C.yint;
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();

    if (mx >= 0) {
      const xm = (mx - cx) / scale;
      const ym = -(my - cy) / scale;
      const tx = a * xm + b * ym;
      const ty = c * xm + d * ym;
      return `v=(${fmt(xm)},${fmt(ym)})  Av=(${fmt(tx)},${fmt(ty)})`;
    }
    return '';
  }, [a, b, c, d, evals]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Eigenwerte &amp; <em>Eigenvektoren</em></h1>
      <p className="subtitle">Charakteristisches Polynom, Eigenraeume &amp; Diagonalisierung</p>

      <MathCanvas draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Matrix</span></div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {(Object.keys(matrices) as MatId[]).map(id => (
              <button key={id} onClick={() => setMatId(id)} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '11px',
                background: id === matId ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: id === matId ? '#00d4ff' : '#2a5a70',
              }}>
                {matrices[id].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Matrix</div>
          <div className="value"><M>{mat.latex}</M></div>
        </div>
        <div className="info-card slope">
          <div className="label">Char. Polynom</div>
          <div className="value"><M>{String.raw`\lambda^2 - ${fmt(trace)}\lambda + ${fmt(det)} = 0`}</M></div>
        </div>
        <div className="info-card zero">
          <div className="label">Eigenwerte</div>
          <div className="value">
            {evals
              ? <><M>{String.raw`\lambda_1 = ${fmt(evals[0], 2)}`}</M>, <M>{String.raw`\lambda_2 = ${fmt(evals[1], 2)}`}</M></>
              : 'Komplex'
            }
          </div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot" style={{ background: 'rgba(0,212,255,0.2)' }} />Einheitskreis</div>
        <div className="legend-item"><div className="legend-dot glow-cyan" />Transformiertes Bild</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Eigenvektor 1</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#ff22aa' }} />Eigenvektor 2</div>
      </div>

      <div className="explanation">
        <h2>Erlaeuterung</h2>
        <p>
          Ein <strong>Eigenwert</strong> <M>{String.raw`\lambda`}</M> einer Matrix A erfuellt{' '}
          <M>{String.raw`Av = \lambda v`}</M> fuer einen Eigenvektor <M>{String.raw`v \neq 0`}</M>.
          Der Eigenvektor wird nur gestreckt, nicht gedreht.
        </p>
        <p>
          Das <strong>charakteristische Polynom</strong> <M>{String.raw`\det(A - \lambda I) = 0`}</M> liefert
          die Eigenwerte. Fuer 2x2: <M>{String.raw`\lambda^2 - \text{tr}(A)\lambda + \det(A) = 0`}</M>.
        </p>
        <p>
          Der <strong>Eigenraum</strong> zu <M>{String.raw`\lambda`}</M> ist{' '}
          <M>{String.raw`\text{Ker}(A - \lambda I)`}</M> — alle Vektoren, die zu diesem Eigenwert gehoeren.
        </p>
        <p>
          Ist A <strong>diagonalisierbar</strong>, existiert eine Basis aus Eigenvektoren:{' '}
          <M>{String.raw`A = PDP^{-1}`}</M>, wobei D die Eigenwerte auf der Diagonale hat.
        </p>
      </div>
      <EigenExercises />
    </>
  );
};
