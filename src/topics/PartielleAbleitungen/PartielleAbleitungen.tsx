import React, { useState, useCallback } from 'react';
import { MathCanvas } from '../../shared/MathCanvas';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { PartialExercises } from './PartialExercises';

type FuncId = 'paraboloid' | 'saddle' | 'gauss' | 'ripple';

const funcs: Record<FuncId, {
  label: string;
  f: (x: number, y: number) => number;
  fx: (x: number, y: number) => number;
  fy: (x: number, y: number) => number;
  latex: string;
  gradLatex: string;
}> = {
  paraboloid: {
    label: 'x^2 + y^2',
    f: (x, y) => x * x + y * y,
    fx: (x, _y) => 2 * x,
    fy: (_x, y) => 2 * y,
    latex: String.raw`f(x,y) = x^2 + y^2`,
    gradLatex: String.raw`\nabla f = (2x, 2y)`,
  },
  saddle: {
    label: 'x^2 - y^2',
    f: (x, y) => x * x - y * y,
    fx: (x, _y) => 2 * x,
    fy: (_x, y) => -2 * y,
    latex: String.raw`f(x,y) = x^2 - y^2`,
    gradLatex: String.raw`\nabla f = (2x, -2y)`,
  },
  gauss: {
    label: 'Gauss',
    f: (x, y) => Math.exp(-(x * x + y * y)),
    fx: (x, y) => -2 * x * Math.exp(-(x * x + y * y)),
    fy: (x, y) => -2 * y * Math.exp(-(x * x + y * y)),
    latex: String.raw`f(x,y) = e^{-(x^2+y^2)}`,
    gradLatex: String.raw`\nabla f = (-2xe^{-r^2}, -2ye^{-r^2})`,
  },
  ripple: {
    label: 'sin(r)',
    f: (x, y) => { const r = Math.sqrt(x * x + y * y); return r < 0.01 ? 1 : Math.sin(r) / r; },
    fx: (x, y) => {
      const r2 = x * x + y * y; const r = Math.sqrt(r2);
      if (r < 0.01) return 0;
      return x * (r * Math.cos(r) - Math.sin(r)) / (r2 * r);
    },
    fy: (x, y) => {
      const r2 = x * x + y * y; const r = Math.sqrt(r2);
      if (r < 0.01) return 0;
      return y * (r * Math.cos(r) - Math.sin(r)) / (r2 * r);
    },
    latex: String.raw`f(x,y) = \frac{\sin(\sqrt{x^2+y^2})}{\sqrt{x^2+y^2}}`,
    gradLatex: String.raw`\nabla f = \text{(numerisch)}`,
  },
};

function heatColor(t: number): string {
  // t in [0,1] -> blue to cyan to green to yellow to red
  t = Math.max(0, Math.min(1, t));
  if (t < 0.25) { const s = t / 0.25; return `rgb(0, ${Math.round(s * 200)}, ${Math.round(200 - s * 50)})`; }
  if (t < 0.5) { const s = (t - 0.25) / 0.25; return `rgb(0, ${Math.round(200 + s * 55)}, ${Math.round(150 - s * 150)})`; }
  if (t < 0.75) { const s = (t - 0.5) / 0.25; return `rgb(${Math.round(s * 255)}, 255, 0)`; }
  const s = (t - 0.75) / 0.25;
  return `rgb(255, ${Math.round(255 - s * 200)}, 0)`;
}

export const PartielleAbleitungen: React.FC = () => {
  const [funcId, setFuncId] = useState<FuncId>('paraboloid');
  const [showGrad, setShowGrad] = useState(true);

  const fn = funcs[funcId];

  const draw = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, mx: number, my: number) => {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) / 8; // 4 units per half

    // Compute function range for normalization
    let fMin = Infinity, fMax = -Infinity;
    const res = 4;
    for (let px = 0; px < w; px += res) {
      for (let py = 0; py < h; py += res) {
        const x = (px - cx) / scale;
        const y = -(py - cy) / scale;
        const v = fn.f(x, y);
        if (isFinite(v)) { fMin = Math.min(fMin, v); fMax = Math.max(fMax, v); }
      }
    }
    if (fMax - fMin < 0.001) fMax = fMin + 1;

    // Heat map
    for (let px = 0; px < w; px += res) {
      for (let py = 0; py < h; py += res) {
        const x = (px - cx) / scale;
        const y = -(py - cy) / scale;
        const v = fn.f(x, y);
        const t = (v - fMin) / (fMax - fMin);
        ctx.fillStyle = heatColor(t);
        ctx.globalAlpha = 0.6;
        ctx.fillRect(px, py, res, res);
      }
    }
    ctx.globalAlpha = 1;

    // Contour lines
    const levels = 12;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 0.8;
    for (let l = 0; l <= levels; l++) {
      const target = fMin + (fMax - fMin) * l / levels;
      // March along horizontal scanlines
      for (let py = 0; py < h; py += res) {
        for (let px = 0; px < w - res; px += res) {
          const x1 = (px - cx) / scale, y1 = -(py - cy) / scale;
          const x2 = (px + res - cx) / scale;
          const v1 = fn.f(x1, y1), v2 = fn.f(x2, y1);
          if ((v1 - target) * (v2 - target) < 0) {
            const frac = (target - v1) / (v2 - v1);
            const ix = px + frac * res;
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(ix - 0.5, py - 0.5, 1, 1);
          }
        }
      }
    }

    // Axes
    ctx.strokeStyle = 'rgba(0,212,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    ctx.fillStyle = 'rgba(0,212,255,0.5)';
    ctx.font = '10px "Share Tech Mono"';
    ctx.fillText('x', w - 14, cy - 4);
    ctx.fillText('y', cx + 4, 12);

    // Gradient arrows
    if (showGrad) {
      const spacing = Math.max(30, 40);
      ctx.strokeStyle = C.orange;
      ctx.fillStyle = C.orange;
      for (let px = spacing; px < w; px += spacing) {
        for (let py = spacing; py < h; py += spacing) {
          const x = (px - cx) / scale;
          const y = -(py - cy) / scale;
          const gx = fn.fx(x, y);
          const gy = fn.fy(x, y);
          const mag = Math.sqrt(gx * gx + gy * gy);
          if (mag < 0.01) continue;
          const len = Math.min(mag * scale * 0.15, spacing * 0.4);
          const dx = (gx / mag) * len;
          const dy = -(gy / mag) * len; // flip y
          ctx.globalAlpha = Math.min(1, mag * 0.5 + 0.2);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + dx, py + dy);
          ctx.stroke();
          // arrowhead
          const angle = Math.atan2(dy, dx);
          ctx.beginPath();
          ctx.moveTo(px + dx, py + dy);
          ctx.lineTo(px + dx - 4 * Math.cos(angle - 0.5), py + dy - 4 * Math.sin(angle - 0.5));
          ctx.lineTo(px + dx - 4 * Math.cos(angle + 0.5), py + dy - 4 * Math.sin(angle + 0.5));
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    // Mouse info
    if (mx >= 0) {
      const x = (mx - cx) / scale;
      const y = -(my - cy) / scale;
      const v = fn.f(x, y);
      const gx = fn.fx(x, y);
      const gy = fn.fy(x, y);
      const mag = Math.sqrt(gx * gx + gy * gy);

      // Crosshair
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, my); ctx.lineTo(w, my); ctx.stroke();

      return `(${fmt(x)}, ${fmt(y)})  f=${fmt(v, 2)}  grad=(${fmt(gx, 2)}, ${fmt(gy, 2)})  |grad|=${fmt(mag, 2)}`;
    }
    return '';
  }, [funcId, showGrad]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Partielle <em>Ableitungen</em></h1>
      <p className="subtitle">Gradient, Hesse-Matrix &amp; Richtungsableitung</p>

      <MathCanvas draw={draw} />

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
          <div className="ctrl-header"><span className="ctrl-label">Gradient-Pfeile</span></div>
          <button onClick={() => setShowGrad(g => !g)} style={{
            padding: '8px', border: 'none', cursor: 'pointer', width: '100%',
            fontFamily: '"Share Tech Mono", monospace', fontSize: '11px',
            background: showGrad ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
            color: showGrad ? '#00d4ff' : '#2a5a70',
          }}>
            {showGrad ? 'AN' : 'AUS'}
          </button>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Funktion</div>
          <div className="value"><M>{fn.latex}</M></div>
        </div>
        <div className="info-card slope">
          <div className="label">Gradient</div>
          <div className="value"><M>{fn.gradLatex}</M></div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot" style={{ background: 'rgb(0,200,150)' }} />Niedrige Werte</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: 'rgb(255,200,0)' }} />Hohe Werte</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Gradient</div>
      </div>

      <div className="explanation">
        <h2>Erlaeuterung</h2>
        <p>
          Die <strong>partielle Ableitung</strong> <M>{String.raw`\frac{\partial f}{\partial x}`}</M> misst die
          Aenderungsrate von f in x-Richtung bei festem y. Analog fuer <M>{String.raw`\frac{\partial f}{\partial y}`}</M>.
        </p>
        <p>
          Der <strong>Gradient</strong> <M>{String.raw`\nabla f = \left(\frac{\partial f}{\partial x}, \frac{\partial f}{\partial y}\right)`}</M>{' '}
          zeigt in die Richtung des staerksten Anstiegs. Seine Laenge ist die maximale Steigung.
        </p>
        <p>
          Die <strong>Richtungsableitung</strong> in Richtung eines Einheitsvektors <M>{String.raw`\vec{v}`}</M> ist{' '}
          <M>{String.raw`D_{\vec{v}}f = \nabla f \cdot \vec{v}`}</M>. Die Hoehenlinien (Konturen) stehen
          senkrecht auf dem Gradienten.
        </p>
        <p>
          Die <strong>Hesse-Matrix</strong> sammelt die zweiten partiellen Ableitungen und bestimmt,
          ob ein kritischer Punkt ein Minimum, Maximum oder Sattelpunkt ist.
        </p>
      </div>
      <PartialExercises />
    </>
  );
};
