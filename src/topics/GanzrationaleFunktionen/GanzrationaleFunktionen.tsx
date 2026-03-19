import React, { useState, useCallback } from 'react';
import { CoordinateSystem, Viewport } from '../../shared/CoordinateSystem';
import { drawCurve, drawPoint, C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';

export const GanzrationaleFunktionen: React.FC = () => {
  const [degree, setDegree] = useState(3);
  const [coeffs, setCoeffs] = useState([0, 0, -30, 10]); // c0..c3 as slider*10

  const realCoeffs = coeffs.map(v => v / 10);

  const evalPoly = useCallback((x: number) => {
    let y = 0;
    for (let i = 0; i < realCoeffs.length; i++) y += realCoeffs[i] * Math.pow(x, i);
    return y;
  }, [realCoeffs]);

  const handleDegreeChange = (d: number) => {
    setDegree(d);
    const newC = Array.from({ length: d + 1 }, (_, i) => coeffs[i] ?? 0);
    // Ensure leading coefficient is non-zero default
    if (newC[d] === 0) newC[d] = 10;
    setCoeffs(newC);
  };

  const setCoeff = (idx: number, val: number) => {
    setCoeffs(prev => { const n = [...prev]; n[idx] = val; return n; });
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, my: number) => {
    const { toX, toY, w } = vp;

    drawCurve(ctx, vp, evalPoly, C.line, C.lineGlow);

    // y-intercept
    const yInt = evalPoly(0);
    drawPoint(ctx, toX(0), toY(yInt), C.yint, C.yintGlow);
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = C.yintLabel;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('(0 | ' + fmt(yInt) + ')', toX(0) + 12, toY(yInt) + 16);

    // Find zeros numerically via sign changes
    const step = 0.01;
    const xFrom = vp.xMin;
    const xTo = vp.xMax;
    let prev = evalPoly(xFrom);
    for (let x = xFrom + step; x <= xTo; x += step) {
      const cur = evalPoly(x);
      if (prev * cur < 0) {
        // Bisect
        let lo = x - step, hi = x;
        for (let k = 0; k < 30; k++) {
          const mid = (lo + hi) / 2;
          if (evalPoly(lo) * evalPoly(mid) < 0) hi = mid; else lo = mid;
        }
        const zx = (lo + hi) / 2;
        const zPx = toX(zx);
        if (zPx > -20 && zPx < w + 20) {
          drawPoint(ctx, zPx, toY(0), C.zero, C.zeroGlow);
          ctx.font = '11px "Share Tech Mono", monospace';
          ctx.fillStyle = C.zeroLabel;
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText('(' + fmt(zx) + ' | 0)', zPx, toY(0) + 12);
        }
      }
      prev = cur;
    }

    if (mx >= 0) {
      const mathX = vp.toMathX(mx);
      const fVal = evalPoly(mathX);
      const snapY = toY(fVal);
      if (snapY > 0 && snapY < vp.h) {
        ctx.beginPath(); ctx.arc(mx, snapY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,212,255,0.6)'; ctx.fill();
      }
      return 'x: ' + mathX.toFixed(1) + '   y: ' + vp.toMathY(my).toFixed(1) + '   f(x) = ' + fmt(fVal);
    }
    return '';
  }, [evalPoly]);

  const labels = ['c\u2080 (Konstante)', 'c\u2081 (linear)', 'c\u2082 (quadratisch)', 'c\u2083 (kubisch)', 'c\u2084 (Grad 4)', 'c\u2085 (Grad 5)'];

  // Build equation string
  const eqParts: string[] = [];
  for (let i = realCoeffs.length - 1; i >= 0; i--) {
    const v = realCoeffs[i];
    if (Math.abs(v) < 0.001) continue;
    let term = '';
    if (eqParts.length > 0) term += v > 0 ? ' + ' : ' \u2212 ';
    const absV = eqParts.length > 0 ? Math.abs(v) : v;
    if (i === 0) term += fmt(absV);
    else if (i === 1) term += (Math.abs(absV - 1) < 0.001 ? '' : Math.abs(absV + 1) < 0.001 ? '\u2212' : fmt(absV)) + 'x';
    else term += (Math.abs(absV - 1) < 0.001 ? '' : Math.abs(absV + 1) < 0.001 ? '\u2212' : fmt(absV)) + 'x' + (i === 2 ? '\u00B2' : i === 3 ? '\u00B3' : '\u2074');
    eqParts.push(term);
  }

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Ganzrationale <em>Funktionen</em></h1>
      <p className="subtitle">Polynome vom Grad 1 bis 5 — Nullstellen, Symmetrie &amp; Verhalten</p>

      <CoordinateSystem draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Grad des Polynoms</span>
            <span className="ctrl-value cyan">{degree}</span>
          </div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {[1, 2, 3, 4, 5].map(d => (
              <button
                key={d}
                onClick={() => handleDegreeChange(d)}
                style={{
                  flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                  fontFamily: '"Share Tech Mono", monospace', fontSize: '12px',
                  background: d === degree ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                  color: d === degree ? '#00d4ff' : '#2a5a70',
                  letterSpacing: '.1em',
                }}
              >
                GRAD {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="controls" style={{ gridTemplateColumns: degree > 3 ? '1fr 1fr 1fr' : `repeat(${degree + 1}, 1fr)` }}>
        {coeffs.map((val, idx) => (
          <div className="ctrl" key={idx}>
            <div className="ctrl-header">
              <span className="ctrl-label">{labels[idx]}</span>
              <span className={`ctrl-value ${idx === degree ? 'cyan' : 'amber'}`}>{fmt(val / 10)}</span>
            </div>
            <input type="range" min={-30} max={30} step={1} value={val}
              onChange={e => setCoeff(idx, Number(e.target.value))} />
          </div>
        ))}
      </div>

      <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="info-card eq">
          <div className="label">Funktionsgleichung</div>
          <div className="value">f(x) = {eqParts.join('') || '0'}</div>
        </div>
        <div className="info-card slope">
          <div className="label">Grad &amp; Verhalten</div>
          <div className="value">Grad {degree}</div>
          <div className="detail">
            {degree % 2 === 0
              ? (realCoeffs[degree] > 0 ? 'f(x) → +∞ für x → ±∞' : 'f(x) → −∞ für x → ±∞')
              : (realCoeffs[degree] > 0 ? 'f(x) → −∞ / +∞' : 'f(x) → +∞ / −∞')}
          </div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />Polynom f(x)</div>
        <div className="legend-item"><div className="legend-dot glow-red" />Nullstellen</div>
        <div className="legend-item"><div className="legend-dot glow-lime" />y-Achsenabschnitt</div>
      </div>

      <div className="explanation">
        <h2>Erläuterung</h2>
        <p>
          Eine <strong>ganzrationale Funktion</strong> (Polynom) vom Grad n hat die Form
          <M>{'f(x) = c_n x^n + c_{n-1} x^{n-1} + \\ldots + c_1 x + c_0'}</M>.
          Der <strong>Grad</strong> bestimmt die maximale Anzahl an Nullstellen und das Verhalten für x → ±∞.
        </p>
        <p>
          Bei <strong>geradem</strong> Grad streben beide Enden in die gleiche Richtung (nach oben wenn cₙ &gt; 0).
          Bei <strong>ungeradem</strong> Grad streben sie in entgegengesetzte Richtungen.
        </p>
        <p>
          Ein Polynom n-ten Grades hat <strong>maximal n Nullstellen</strong> und <strong>maximal n−1 Extremstellen</strong>.
          Spezialfälle: Grad 1 = lineare Funktion, Grad 2 = quadratische Funktion (Parabel).
        </p>
      </div>
    </>
  );
};
