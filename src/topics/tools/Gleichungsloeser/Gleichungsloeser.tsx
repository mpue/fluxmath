import React, { useState, useCallback } from 'react';
import { CoordinateSystem, Viewport } from '../../../shared/CoordinateSystem';
import { drawCurve, drawPoint, C, fmt } from '../../../shared/canvasUtils';

/* ── Equation types ──────────────────────────────────── */
type EqType = 'linear' | 'quadratic' | 'cubic' | 'system2' | 'system3';

const TYPE_LABELS: Record<EqType, string> = {
  linear: 'Linear (ax + b = 0)',
  quadratic: 'Quadratisch (ax² + bx + c = 0)',
  cubic: 'Kubisch (ax³ + bx² + cx + d = 0)',
  system2: 'LGS 2×2',
  system3: 'LGS 3×3',
};

/* ── Solvers ─────────────────────────────────────────── */
function solveLinear(a: number, b: number): { solutions: string[]; steps: string[] } {
  const steps: string[] = [];
  steps.push(`Gleichung: ${fmt(a)}x + ${fmt(b)} = 0`);
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) < 1e-12) return { solutions: ['Unendlich viele Lösungen (0 = 0)'], steps };
    return { solutions: ['Keine Lösung (' + fmt(b) + ' ≠ 0)'], steps };
  }
  steps.push(`${fmt(a)}x = ${fmt(-b)}`);
  const x = -b / a;
  steps.push(`x = ${fmt(-b)} / ${fmt(a)} = ${fmt(x, 4)}`);
  return { solutions: [`x = ${fmt(x, 4)}`], steps };
}

function solveQuadratic(a: number, b: number, c: number): { solutions: string[]; steps: string[] } {
  const steps: string[] = [];
  steps.push(`Gleichung: ${fmt(a)}x² + ${fmt(b)}x + ${fmt(c)} = 0`);
  if (Math.abs(a) < 1e-12) return solveLinear(b, c);

  const disc = b * b - 4 * a * c;
  steps.push(`Diskriminante: D = b² − 4ac = ${fmt(b)}² − 4·${fmt(a)}·${fmt(c)} = ${fmt(disc, 4)}`);

  if (disc < -1e-12) {
    const re = -b / (2 * a);
    const im = Math.sqrt(-disc) / (2 * a);
    steps.push('D < 0 → Keine reellen Lösungen');
    steps.push(`Komplexe Lösungen: x = ${fmt(re, 4)} ± ${fmt(Math.abs(im), 4)}i`);
    return { solutions: [`x₁ = ${fmt(re, 4)} + ${fmt(Math.abs(im), 4)}i`, `x₂ = ${fmt(re, 4)} − ${fmt(Math.abs(im), 4)}i`], steps };
  }
  if (Math.abs(disc) < 1e-12) {
    const x = -b / (2 * a);
    steps.push('D = 0 → Eine doppelte Nullstelle');
    steps.push(`x = −b / (2a) = ${fmt(x, 4)}`);
    return { solutions: [`x = ${fmt(x, 4)} (doppelt)`], steps };
  }
  const sqrtD = Math.sqrt(disc);
  const x1 = (-b + sqrtD) / (2 * a);
  const x2 = (-b - sqrtD) / (2 * a);
  steps.push(`√D = ${fmt(sqrtD, 4)}`);
  steps.push(`x₁ = (−${fmt(b)} + ${fmt(sqrtD, 4)}) / (2·${fmt(a)}) = ${fmt(x1, 4)}`);
  steps.push(`x₂ = (−${fmt(b)} − ${fmt(sqrtD, 4)}) / (2·${fmt(a)}) = ${fmt(x2, 4)}`);
  return { solutions: [`x₁ = ${fmt(x1, 4)}`, `x₂ = ${fmt(x2, 4)}`], steps };
}

function solveCubic(a: number, b: number, c: number, d: number): { solutions: string[]; steps: string[] } {
  const steps: string[] = [];
  steps.push(`Gleichung: ${fmt(a)}x³ + ${fmt(b)}x² + ${fmt(c)}x + ${fmt(d)} = 0`);
  if (Math.abs(a) < 1e-12) return solveQuadratic(b, c, d);

  // Numerical approach: find roots via companion + Newton refinement
  const f = (x: number) => a * x * x * x + b * x * x + c * x + d;
  const fp = (x: number) => 3 * a * x * x + 2 * b * x + c;

  // Scan for sign changes in [-100, 100]
  const roots: number[] = [];
  const step = 0.05;
  let prev = f(-100);
  for (let x = -100 + step; x <= 100; x += step) {
    const cur = f(x);
    if (prev * cur < 0) {
      // Newton-Raphson from midpoint
      let r = x - step / 2;
      for (let k = 0; k < 50; k++) {
        const fv = f(r);
        const dv = fp(r);
        if (Math.abs(dv) < 1e-15) break;
        r -= fv / dv;
      }
      // Avoid duplicates
      if (!roots.some(rr => Math.abs(rr - r) < 1e-6)) roots.push(r);
    }
    prev = cur;
  }

  // Also check if f(0) ≈ 0
  if (Math.abs(f(0)) < 1e-10 && !roots.some(r => Math.abs(r) < 1e-6)) roots.push(0);

  roots.sort((a, b) => a - b);
  steps.push(`Numerische Suche: ${roots.length} reelle Nullstelle(n) gefunden`);
  const solutions = roots.map((r, i) => {
    steps.push(`x${roots.length > 1 ? '₁₂₃'[i] : ''} ≈ ${fmt(r, 6)} (f(${fmt(r, 4)}) = ${fmt(f(r), 8)})`);
    return `x${roots.length > 1 ? '₁₂₃'[i] : ''} = ${fmt(r, 4)}`;
  });

  if (roots.length === 0) {
    steps.push('Keine reellen Nullstellen im Intervall [−100, 100]');
    return { solutions: ['Keine reellen Lösungen gefunden'], steps };
  }
  return { solutions, steps };
}

function solveSystem2(
  a11: number, a12: number, b1: number,
  a21: number, a22: number, b2: number,
): { solutions: string[]; steps: string[] } {
  const steps: string[] = [];
  steps.push(`${fmt(a11)}x + ${fmt(a12)}y = ${fmt(b1)}`);
  steps.push(`${fmt(a21)}x + ${fmt(a22)}y = ${fmt(b2)}`);

  const det = a11 * a22 - a12 * a21;
  steps.push(`det(A) = ${fmt(a11)}·${fmt(a22)} − ${fmt(a12)}·${fmt(a21)} = ${fmt(det, 4)}`);

  if (Math.abs(det) < 1e-12) {
    return { solutions: ['System ist singulär (det = 0)'], steps };
  }

  const x = (b1 * a22 - b2 * a12) / det;
  const y = (a11 * b2 - a21 * b1) / det;
  steps.push(`x = (${fmt(b1)}·${fmt(a22)} − ${fmt(b2)}·${fmt(a12)}) / ${fmt(det, 4)} = ${fmt(x, 4)}`);
  steps.push(`y = (${fmt(a11)}·${fmt(b2)} − ${fmt(a21)}·${fmt(b1)}) / ${fmt(det, 4)} = ${fmt(y, 4)}`);

  return { solutions: [`x = ${fmt(x, 4)}`, `y = ${fmt(y, 4)}`], steps };
}

function solveSystem3(
  m: number[][],
  b: number[],
): { solutions: string[]; steps: string[] } {
  const steps: string[] = [];
  steps.push('Gleichungssystem:');
  const vars = ['x', 'y', 'z'];
  for (let i = 0; i < 3; i++) {
    steps.push(`  ${m[i].map((v, j) => `${fmt(v)}${vars[j]}`).join(' + ')} = ${fmt(b[i])}`);
  }

  // Cramer's rule
  const det3 = (m: number[][]): number =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

  const D = det3(m);
  steps.push(`det(A) = ${fmt(D, 4)}`);

  if (Math.abs(D) < 1e-12) {
    return { solutions: ['System ist singulär (det = 0)'], steps };
  }

  const replaceCol = (col: number): number[][] =>
    m.map((row, i) => row.map((v, j) => j === col ? b[i] : v));

  const results = [0, 1, 2].map(col => {
    const Dc = det3(replaceCol(col));
    const val = Dc / D;
    steps.push(`${vars[col]} = det(A${vars[col]}) / det(A) = ${fmt(Dc, 4)} / ${fmt(D, 4)} = ${fmt(val, 4)}`);
    return `${vars[col]} = ${fmt(val, 4)}`;
  });

  return { solutions: results, steps };
}

/* ── Component ───────────────────────────────────────── */
export const Gleichungsloeser: React.FC = () => {
  const [eqType, setEqType] = useState<EqType>('quadratic');

  // Coefficients
  const [coeffs, setCoeffs] = useState<number[]>([1, 0, -4, 0]); // a, b, c, d
  // System matrices
  const [sys2, setSys2] = useState([1, 2, 5, 3, -1, 4]); // a11,a12,b1, a21,a22,b2
  const [sys3, setSys3] = useState([
    2, 1, -1, 8,
    -3, -1, 2, -11,
    -2, 1, 2, -3,
  ]);

  const setC = (idx: number, val: number) => setCoeffs(p => { const n = [...p]; n[idx] = val; return n; });
  const setSys2V = (idx: number, val: string) => setSys2(p => { const n = [...p]; n[idx] = Number(val) || 0; return n; });
  const setSys3V = (idx: number, val: string) => setSys3(p => { const n = [...p]; n[idx] = Number(val) || 0; return n; });

  // Solve
  const result = (() => {
    switch (eqType) {
      case 'linear': return solveLinear(coeffs[0], coeffs[1]);
      case 'quadratic': return solveQuadratic(coeffs[0], coeffs[1], coeffs[2]);
      case 'cubic': return solveCubic(coeffs[0], coeffs[1], coeffs[2], coeffs[3]);
      case 'system2': return solveSystem2(sys2[0], sys2[1], sys2[2], sys2[3], sys2[4], sys2[5]);
      case 'system3': {
        const m = [[sys3[0], sys3[1], sys3[2]], [sys3[4], sys3[5], sys3[6]], [sys3[8], sys3[9], sys3[10]]];
        const b = [sys3[3], sys3[7], sys3[11]];
        return solveSystem3(m, b);
      }
    }
  })();

  // Draw function graph for polynomial types
  const evalFn = useCallback((x: number) => {
    switch (eqType) {
      case 'linear': return coeffs[0] * x + coeffs[1];
      case 'quadratic': return coeffs[0] * x * x + coeffs[1] * x + coeffs[2];
      case 'cubic': return coeffs[0] * x * x * x + coeffs[1] * x * x + coeffs[2] * x + coeffs[3];
      default: return 0;
    }
  }, [eqType, coeffs]);

  const showGraph = eqType === 'linear' || eqType === 'quadratic' || eqType === 'cubic';

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, my: number) => {
    drawCurve(ctx, vp, evalFn, C.line, C.lineGlow);

    // Draw zeros
    const zeros: number[] = [];
    const step = 0.01;
    let prev = evalFn(vp.xMin);
    for (let x = vp.xMin + step; x <= vp.xMax; x += step) {
      const cur = evalFn(x);
      if (prev * cur < 0) {
        let lo = x - step, hi = x;
        for (let k = 0; k < 30; k++) {
          const mid = (lo + hi) / 2;
          if (evalFn(lo) * evalFn(mid) < 0) hi = mid; else lo = mid;
        }
        zeros.push((lo + hi) / 2);
      }
      prev = cur;
    }
    for (const z of zeros) {
      drawPoint(ctx, vp.toX(z), vp.toY(0), C.zero, C.zeroGlow);
      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.fillStyle = C.zeroLabel;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(`(${fmt(z, 2)} | 0)`, vp.toX(z), vp.toY(0) + 12);
    }

    if (mx >= 0) {
      const mathX = vp.toMathX(mx);
      const fVal = evalFn(mathX);
      const snapY = vp.toY(fVal);
      if (snapY > 0 && snapY < vp.h) {
        ctx.beginPath(); ctx.arc(mx, snapY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,212,255,0.6)'; ctx.fill();
      }
      return `x: ${mathX.toFixed(2)}   f(x) = ${fmt(fVal, 3)}`;
    }
    return '';
  }, [evalFn]);

  const inputStyle: React.CSSProperties = {
    width: 60, textAlign: 'center',
    background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.1)',
    borderRadius: '2px', padding: '8px 4px', color: 'var(--text)',
    fontFamily: '"Share Tech Mono", monospace', fontSize: '13px', outline: 'none',
  };

  return (
    <>
      <div className="header-eyebrow">Tools <span>// Gleichungslöser</span></div>
      <h1>Gleichungs<em>löser</em></h1>
      <p className="subtitle">Gleichungen &amp; Systeme lösen — mit Lösungsweg</p>

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Gleichungstyp</span>
            <span className="ctrl-value cyan">{TYPE_LABELS[eqType].split(' (')[0]}</span>
          </div>
          <div style={{ display: 'flex', gap: '1px', flexWrap: 'wrap' }}>
            {(Object.keys(TYPE_LABELS) as EqType[]).map(t => (
              <button key={t} onClick={() => setEqType(t)} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer', minWidth: 80,
                fontFamily: '"Share Tech Mono", monospace', fontSize: '10px', letterSpacing: '.06em',
                background: t === eqType ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: t === eqType ? '#00d4ff' : '#2a5a70',
              }}>{TYPE_LABELS[t].split(' (')[0].toUpperCase()}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Polynomial inputs */}
      {(eqType === 'linear' || eqType === 'quadratic' || eqType === 'cubic') && (
        <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
          <div className="ctrl">
            <div className="ctrl-header">
              <span className="ctrl-label">Koeffizienten</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {eqType === 'cubic' && <>
                <input type="number" step="0.1" value={coeffs[0]} onChange={e => setC(0, Number(e.target.value))} style={inputStyle} />
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>x³ +</span>
                <input type="number" step="0.1" value={coeffs[1]} onChange={e => setC(1, Number(e.target.value))} style={inputStyle} />
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>x² +</span>
                <input type="number" step="0.1" value={coeffs[2]} onChange={e => setC(2, Number(e.target.value))} style={inputStyle} />
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>x +</span>
                <input type="number" step="0.1" value={coeffs[3]} onChange={e => setC(3, Number(e.target.value))} style={inputStyle} />
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>= 0</span>
              </>}
              {eqType === 'quadratic' && <>
                <input type="number" step="0.1" value={coeffs[0]} onChange={e => setC(0, Number(e.target.value))} style={inputStyle} />
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>x² +</span>
                <input type="number" step="0.1" value={coeffs[1]} onChange={e => setC(1, Number(e.target.value))} style={inputStyle} />
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>x +</span>
                <input type="number" step="0.1" value={coeffs[2]} onChange={e => setC(2, Number(e.target.value))} style={inputStyle} />
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>= 0</span>
              </>}
              {eqType === 'linear' && <>
                <input type="number" step="0.1" value={coeffs[0]} onChange={e => setC(0, Number(e.target.value))} style={inputStyle} />
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>x +</span>
                <input type="number" step="0.1" value={coeffs[1]} onChange={e => setC(1, Number(e.target.value))} style={inputStyle} />
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>= 0</span>
              </>}
            </div>
          </div>
        </div>
      )}

      {/* System 2x2 */}
      {eqType === 'system2' && (
        <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
          <div className="ctrl">
            <div className="ctrl-header"><span className="ctrl-label">Gleichungssystem 2×2</span></div>
            {[0, 1].map(row => (
              <div key={row} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <input type="number" value={sys2[row * 3]} onChange={e => setSys2V(row * 3, e.target.value)} style={inputStyle} />
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>x +</span>
                <input type="number" value={sys2[row * 3 + 1]} onChange={e => setSys2V(row * 3 + 1, e.target.value)} style={inputStyle} />
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>y =</span>
                <input type="number" value={sys2[row * 3 + 2]} onChange={e => setSys2V(row * 3 + 2, e.target.value)} style={inputStyle} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System 3x3 */}
      {eqType === 'system3' && (
        <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
          <div className="ctrl">
            <div className="ctrl-header"><span className="ctrl-label">Gleichungssystem 3×3</span></div>
            {[0, 1, 2].map(row => (
              <div key={row} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <input type="number" value={sys3[row * 4]} onChange={e => setSys3V(row * 4, e.target.value)} style={inputStyle} />
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>x +</span>
                <input type="number" value={sys3[row * 4 + 1]} onChange={e => setSys3V(row * 4 + 1, e.target.value)} style={inputStyle} />
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>y +</span>
                <input type="number" value={sys3[row * 4 + 2]} onChange={e => setSys3V(row * 4 + 2, e.target.value)} style={inputStyle} />
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>z =</span>
                <input type="number" value={sys3[row * 4 + 3]} onChange={e => setSys3V(row * 4 + 3, e.target.value)} style={inputStyle} />
              </div>
            ))}
          </div>
        </div>
      )}

      {showGraph && <CoordinateSystem draw={draw} />}

      {/* Results */}
      <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="info-card eq">
          <div className="label">Lösung</div>
          {result.solutions.map((s, i) => (
            <div key={i} className="value" style={{ fontSize: 16, marginBottom: 4 }}>{s}</div>
          ))}
        </div>
        <div className="info-card slope">
          <div className="label">Lösungsweg</div>
          {result.steps.map((s, i) => (
            <div key={i} className="detail" style={{ marginBottom: 2 }}>{s}</div>
          ))}
        </div>
      </div>

      <div className="explanation">
        <h2>Hinweise</h2>
        <p>
          Der Gleichungslöser unterstützt <strong>lineare</strong>, <strong>quadratische</strong> und <strong>kubische</strong> Gleichungen
          sowie <strong>lineare Gleichungssysteme</strong> (2×2 und 3×3).
        </p>
        <p>
          Quadratische Gleichungen werden mit der <strong>Mitternachtsformel</strong> (p-q-Formel) gelöst,
          kubische numerisch via Newton-Raphson. LGS werden per <strong>Cramer'scher Regel</strong> gelöst.
        </p>
      </div>
    </>
  );
};
