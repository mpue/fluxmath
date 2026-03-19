import React, { useState, useCallback } from 'react';
import { CoordinateSystem, Viewport } from '../../shared/CoordinateSystem';
import { drawCurve, C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';

const FUNCTIONS = [
  { id: 'poly', label: 'Polynom', desc: 'f(x) = x² − 2', F: 'F(x) = x³/3 − 2x + C' },
  { id: 'sin', label: 'Sinus', desc: 'f(x) = sin(x)', F: 'F(x) = −cos(x) + C' },
  { id: 'exp', label: 'e-Funktion', desc: 'f(x) = e^(−x²/2)', F: '(Gaußsche Glockenkurve)' },
  { id: 'lin', label: 'Linear', desc: 'f(x) = 2x + 1', F: 'F(x) = x² + x + C' },
] as const;

type FuncId = (typeof FUNCTIONS)[number]['id'];

const fnDefs: Record<FuncId, (x: number) => number> = {
  poly: x => x * x - 2,
  sin: x => Math.sin(x),
  exp: x => Math.exp(-x * x / 2),
  lin: x => 2 * x + 1,
};

function numericalIntegral(f: (x: number) => number, a: number, b: number, n = 200): number {
  if (Math.abs(b - a) < 0.0001) return 0;
  const h = (b - a) / n;
  let sum = (f(a) + f(b)) / 2;
  for (let i = 1; i < n; i++) sum += f(a + i * h);
  return sum * h;
}

export const Integralrechnung: React.FC = () => {
  const [funcId, setFuncId] = useState<FuncId>('poly');
  const [sliderA, setSliderA] = useState(-20);
  const [sliderB, setSliderB] = useState(20);

  const aVal = sliderA / 10;
  const bVal = sliderB / 10;
  const f = fnDefs[funcId];

  const integralValue = numericalIntegral(f, aVal, bVal);

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, my: number) => {
    const { toX, toY, w, h, unitPx, cx } = vp;

    // Filled area
    const pxA = toX(aVal);
    const pxB = toX(bVal);
    const realA = Math.min(aVal, bVal);
    const realB = Math.max(aVal, bVal);

    ctx.beginPath();
    ctx.moveTo(toX(realA), toY(0));
    const step = 0.02;
    for (let x = realA; x <= realB; x += step) {
      ctx.lineTo(toX(x), toY(f(x)));
    }
    ctx.lineTo(toX(realB), toY(f(realB)));
    ctx.lineTo(toX(realB), toY(0));
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, toY(3), 0, toY(-3));
    if (integralValue >= 0) {
      grad.addColorStop(0, 'rgba(0,212,255,0.15)');
      grad.addColorStop(1, 'rgba(0,255,136,0.08)');
    } else {
      grad.addColorStop(0, 'rgba(255,34,68,0.08)');
      grad.addColorStop(1, 'rgba(255,34,68,0.15)');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = integralValue >= 0 ? 'rgba(0,212,255,0.3)' : 'rgba(255,34,68,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Integration bounds
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = C.orangeLabel;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pxA, 0); ctx.lineTo(pxA, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pxB, 0); ctx.lineTo(pxB, h); ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '12px "Share Tech Mono", monospace';
    ctx.fillStyle = C.orangeLabel;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('a = ' + fmt(aVal), pxA, 18);
    ctx.fillText('b = ' + fmt(bVal), pxB, 18);

    drawCurve(ctx, vp, f, C.line, C.lineGlow);

    // Antiderivative (cumulative integral from left edge)
    const accumFn = (x: number) => numericalIntegral(f, 0, x, 100);
    drawCurve(ctx, vp, accumFn, C.yint, C.yintGlow, 1.5, 0.1);

    // Integral value label in the area
    const midX = (aVal + bVal) / 2;
    const midPx = toX(midX);
    const midFy = f(midX) / 2;
    const labelPy = toY(midFy);
    if (midPx > 20 && midPx < w - 20 && labelPy > 20 && labelPy < h - 20) {
      ctx.font = 'bold 14px "Orbitron", monospace';
      ctx.fillStyle = integralValue >= 0 ? 'rgba(0,212,255,0.8)' : 'rgba(255,34,68,0.8)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(fmt(integralValue, 2), midPx, labelPy);
    }

    if (mx >= 0) {
      const mathX = vp.toMathX(mx);
      const fVal = f(mathX);
      const snapY = toY(fVal);
      if (snapY > 0 && snapY < h) {
        ctx.beginPath(); ctx.arc(mx, snapY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,212,255,0.6)'; ctx.fill();
      }
      return 'x: ' + mathX.toFixed(1) + '   y: ' + vp.toMathY(my).toFixed(1) + '   f(x) = ' + fmt(fVal);
    }
    return '';
  }, [f, aVal, bVal, integralValue]);

  const funcInfo = FUNCTIONS.find(fn => fn.id === funcId)!;

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Integral<em>rechnung</em></h1>
      <p className="subtitle">Bestimmtes Integral, Flächenberechnung &amp; Stammfunktion</p>

      <CoordinateSystem draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Funktion</span></div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {FUNCTIONS.map(fn => (
              <button key={fn.id} onClick={() => setFuncId(fn.id)} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '11px',
                background: fn.id === funcId ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: fn.id === funcId ? '#00d4ff' : '#2a5a70',
              }}>
                {fn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="controls">
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Untere Grenze a</span>
            <span className="ctrl-value cyan">{fmt(aVal)}</span>
          </div>
          <input type="range" min={-40} max={40} step={1} value={sliderA}
            onChange={e => setSliderA(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Obere Grenze b</span>
            <span className="ctrl-value amber">{fmt(bVal)}</span>
          </div>
          <input type="range" min={-40} max={40} step={1} value={sliderB}
            onChange={e => setSliderB(Number(e.target.value))} />
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Bestimmtes Integral</div>
          <div className="value">∫ f(x) dx = {fmt(integralValue, 2)}</div>
          <div className="detail">von a = {fmt(aVal)} bis b = {fmt(bVal)}</div>
        </div>
        <div className="info-card slope">
          <div className="label">Funktion</div>
          <div className="value">{funcInfo.desc}</div>
          <div className="detail">{funcInfo.F}</div>
        </div>
        <div className="info-card zero">
          <div className="label">Fläche</div>
          <div className="value">|∫| = {fmt(Math.abs(integralValue), 2)}</div>
          <div className="detail">{integralValue >= 0 ? 'oberhalb der x-Achse' : 'unterhalb → negativ!'}</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />f(x)</div>
        <div className="legend-item"><div className="legend-dot glow-lime" />Stammfunktion F(x)</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Integrationsgrenzen</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: integralValue >= 0 ? '#00d4ff' : '#ff2244', boxShadow: '0 0 8px ' + (integralValue >= 0 ? '#00d4ff' : '#ff2244') }} />Fläche</div>
      </div>

      <div className="explanation">
        <h2>Erläuterung</h2>
        <p>
          Das <strong>bestimmte Integral</strong> <M>{'\\int_a^b f(x)\\,dx'}</M> berechnet den
          <strong> orientierten Fl\u00e4cheninhalt</strong> zwischen dem Graphen von f und der x-Achse im Intervall [a, b].
        </p>
        <p>
          Fl\u00e4chen <strong>oberhalb</strong> der x-Achse z\u00e4hlen positiv, Fl\u00e4chen <strong>unterhalb</strong> negativ.
          Der <strong>Hauptsatz der Differential- und Integralrechnung</strong> besagt:
          <M>{'\\int_a^b f(x)\\,dx = F(b) - F(a)'}</M>, wobei F eine Stammfunktion von f ist (F' = f).
        </p>
        <p>
          Wichtige <strong>Stammfunktionen</strong>:{' '}
          <M>{'\\int x^n\\,dx = \\frac{x^{n+1}}{n+1}'}</M>,{' '}
          <M>{'\\int e^x\\,dx = e^x'}</M>,{' '}
          <M>{'\\int \\sin(x)\\,dx = -\\cos(x)'}</M>,{' '}
          <M>{'\\int \\frac{1}{x}\\,dx = \\ln|x|'}</M>.
        </p>
        <p>
          Die grüne Kurve zeigt die <strong>Stammfunktion</strong> F(x) = ∫₀ˣ f(t) dt — ihre Steigung an jeder Stelle
          entspricht dem Funktionswert f(x).
        </p>
      </div>
    </>
  );
};
