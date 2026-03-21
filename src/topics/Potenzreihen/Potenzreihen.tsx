import React, { useState, useCallback } from 'react';
import { CoordinateSystem, Viewport } from '../../shared/CoordinateSystem';
import { drawCurve, C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { TaylorExercises } from './TaylorExercises';

type FuncId = 'exp' | 'sin' | 'cos' | 'ln1x';

const funcs: Record<FuncId, {
  label: string;
  f: (x: number) => number;
  taylor: (x: number, n: number) => number;
  center: number;
  latex: string;
  radius: string;
}> = {
  exp: {
    label: 'e^x',
    f: x => Math.exp(x),
    taylor: (x, n) => { let s = 0, t = 1; for (let k = 0; k <= n; k++) { s += t; t *= x / (k + 1); } return s; },
    center: 0,
    latex: String.raw`e^x = \sum_{k=0}^{\infty} \frac{x^k}{k!}`,
    radius: String.raw`R = \infty`,
  },
  sin: {
    label: 'sin(x)',
    f: x => Math.sin(x),
    taylor: (x, n) => {
      let s = 0;
      for (let k = 0; k <= n; k++) {
        const exp = 2 * k + 1;
        let fac = 1; for (let i = 2; i <= exp; i++) fac *= i;
        s += (k % 2 === 0 ? 1 : -1) * Math.pow(x, exp) / fac;
      }
      return s;
    },
    center: 0,
    latex: String.raw`\sin(x) = \sum_{k=0}^{\infty} (-1)^k \frac{x^{2k+1}}{(2k+1)!}`,
    radius: String.raw`R = \infty`,
  },
  cos: {
    label: 'cos(x)',
    f: x => Math.cos(x),
    taylor: (x, n) => {
      let s = 0;
      for (let k = 0; k <= n; k++) {
        const exp = 2 * k;
        let fac = 1; for (let i = 2; i <= exp; i++) fac *= i;
        s += (k % 2 === 0 ? 1 : -1) * Math.pow(x, exp) / fac;
      }
      return s;
    },
    center: 0,
    latex: String.raw`\cos(x) = \sum_{k=0}^{\infty} (-1)^k \frac{x^{2k}}{(2k)!}`,
    radius: String.raw`R = \infty`,
  },
  ln1x: {
    label: 'ln(1+x)',
    f: x => Math.log(1 + x),
    taylor: (x, n) => {
      let s = 0;
      for (let k = 1; k <= n + 1; k++) {
        s += (k % 2 === 1 ? 1 : -1) * Math.pow(x, k) / k;
      }
      return s;
    },
    center: 0,
    latex: String.raw`\ln(1+x) = \sum_{k=1}^{\infty} (-1)^{k+1} \frac{x^k}{k}`,
    radius: String.raw`R = 1 \; (-1 < x \leq 1)`,
  },
};

export const Potenzreihen: React.FC = () => {
  const [funcId, setFuncId] = useState<FuncId>('exp');
  const [order, setOrder] = useState(3);

  const { f, taylor, center, latex, radius, label } = funcs[funcId];

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, my: number) => {
    // Original function
    drawCurve(ctx, vp, f, C.line, C.lineGlow, 2.5);

    // Taylor polynomial
    const tFn = (x: number) => taylor(x - center, order);
    drawCurve(ctx, vp, tFn, C.orange, C.orangeGlow, 2.5);

    // Error band (shaded area between curves)
    const { toX, toY, xMin, xMax, w } = vp;
    ctx.fillStyle = 'rgba(255,34,68,0.06)';
    ctx.beginPath();
    const step = (xMax - xMin) / 300;
    for (let x = xMin; x <= xMax; x += step) {
      const y1 = f(x);
      const y2 = tFn(x);
      if (Math.abs(y1) < 20 && Math.abs(y2) < 20) {
        ctx.lineTo(toX(x), toY(y1));
      }
    }
    for (let x = xMax; x >= xMin; x -= step) {
      const y2 = tFn(x);
      if (Math.abs(y2) < 20) {
        ctx.lineTo(toX(x), toY(y2));
      }
    }
    ctx.closePath();
    ctx.fill();

    // Development center point
    ctx.fillStyle = C.yint;
    ctx.shadowColor = C.yintGlow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(toX(center), toY(f(center)), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillStyle = C.yintLabel;
    ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText('Entwicklungspunkt', toX(center) + 8, toY(f(center)) - 6);

    if (mx >= 0) {
      const xm = vp.toMathX(mx);
      const fVal = f(xm);
      const tVal = tFn(xm);
      return `x: ${xm.toFixed(2)}   f(x): ${fVal.toFixed(3)}   T${order}(x): ${tVal.toFixed(3)}   Fehler: ${Math.abs(fVal - tVal).toFixed(4)}`;
    }
    return '';
  }, [f, taylor, center, order]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Potenzreihen &amp; <em>Taylor</em></h1>
      <p className="subtitle">Taylor-Entwicklung, Konvergenzradius &amp; Approximation</p>

      <CoordinateSystem draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Funktion</span></div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {(Object.keys(funcs) as FuncId[]).map(id => (
              <button key={id} onClick={() => setFuncId(id)} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '11px',
                background: id === funcId ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: id === funcId ? '#00d4ff' : '#2a5a70',
              }}>
                {funcs[id].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Ordnung des Taylor-Polynoms</span>
            <span className="ctrl-value amber">{order}</span>
          </div>
          <input type="range" min={0} max={15} step={1} value={order} onChange={e => setOrder(Number(e.target.value))} />
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Taylor-Reihe</div>
          <div className="value"><M>{latex}</M></div>
        </div>
        <div className="info-card slope">
          <div className="label">Konvergenzradius</div>
          <div className="value"><M>{radius}</M></div>
        </div>
        <div className="info-card zero">
          <div className="label">Aktuell</div>
          <div className="value">T<sub>{order}</sub>(x) um x = {center}</div>
          <div className="detail">{order + 1} Terme</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />{label} (exakt)</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Taylor T<sub>{order}</sub>(x)</div>
        <div className="legend-item"><div className="legend-dot glow-lime" />Entwicklungspunkt</div>
      </div>

      <div className="explanation">
        <h2>Erlaeuterung</h2>
        <p>
          Eine <strong>Potenzreihe</strong> ist eine unendliche Reihe der Form{' '}
          <M>{String.raw`\sum_{k=0}^{\infty} a_k (x - x_0)^k`}</M>.
          Sie konvergiert in einem Intervall um <M>x_0</M> mit dem <strong>Konvergenzradius</strong> R.
        </p>
        <p>
          Das <strong>Taylor-Polynom</strong> n-ter Ordnung approximiert eine Funktion f(x) um den Entwicklungspunkt <M>x_0</M>:{' '}
          <M>{String.raw`T_n(x) = \sum_{k=0}^{n} \frac{f^{(k)}(x_0)}{k!}(x - x_0)^k`}</M>
        </p>
        <p>
          Je hoeher die Ordnung n, desto besser die Approximation in der Naehe von <M>x_0</M>.
          Das <strong>Restglied</strong> nach Lagrange gibt eine Abschaetzung des Fehlers:{' '}
          <M>{String.raw`|R_n(x)| \leq \frac{M}{(n+1)!}|x-x_0|^{n+1}`}</M>.
        </p>
        <p>
          Fuer <M>e^x</M>, <M>{String.raw`\sin(x)`}</M> und <M>{String.raw`\cos(x)`}</M> ist <M>{String.raw`R = \infty`}</M> —
          die Reihe konvergiert ueberall. Bei <M>{String.raw`\ln(1+x)`}</M> ist <M>{String.raw`R = 1`}</M>.
        </p>
      </div>
      <TaylorExercises />
    </>
  );
};
