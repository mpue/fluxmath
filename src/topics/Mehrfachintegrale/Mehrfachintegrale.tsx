import React, { useState, useCallback } from 'react';
import { MathCanvas } from '../../shared/MathCanvas';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { IntegralExercises2D } from './IntegralExercises2D';

type RegionId = 'rect' | 'circle' | 'triangle' | 'parabola';

const regions: Record<RegionId, {
  label: string;
  inside: (x: number, y: number) => boolean;
  xRange: [number, number];
  yLow: (x: number) => number;
  yHigh: (x: number) => number;
  integrand: (x: number, y: number) => number;
  exact: number;
  latex: string;
  boundsLatex: string;
}> = {
  rect: {
    label: 'Rechteck',
    inside: (x, y) => x >= 0 && x <= 2 && y >= 0 && y <= 1,
    xRange: [0, 2],
    yLow: () => 0, yHigh: () => 1,
    integrand: (x, y) => x + y,
    exact: 3,
    latex: String.raw`\iint_R (x+y)\,dA`,
    boundsLatex: String.raw`\int_0^2\int_0^1(x+y)\,dy\,dx = 3`,
  },
  circle: {
    label: 'Kreis',
    inside: (x, y) => x * x + y * y <= 1,
    xRange: [-1, 1],
    yLow: (x) => -Math.sqrt(Math.max(0, 1 - x * x)),
    yHigh: (x) => Math.sqrt(Math.max(0, 1 - x * x)),
    integrand: () => 1,
    exact: Math.PI,
    latex: String.raw`\iint_{x^2+y^2 \leq 1} 1\,dA`,
    boundsLatex: String.raw`\int_0^{2\pi}\int_0^1 r\,dr\,d\theta = \pi`,
  },
  triangle: {
    label: 'Dreieck',
    inside: (x, y) => x >= 0 && y >= 0 && x + y <= 1,
    xRange: [0, 1],
    yLow: () => 0, yHigh: (x) => 1 - x,
    integrand: () => 1,
    exact: 0.5,
    latex: String.raw`\iint_T 1\,dA`,
    boundsLatex: String.raw`\int_0^1\int_0^{1-x} 1\,dy\,dx = \frac{1}{2}`,
  },
  parabola: {
    label: 'Parabel',
    inside: (x, y) => x >= 0 && x <= 1 && y >= 0 && y <= x * x,
    xRange: [0, 1],
    yLow: () => 0, yHigh: (x) => x * x,
    integrand: (x, _y) => x,
    exact: 1 / 4,
    latex: String.raw`\int_0^1\int_0^{x^2} x\,dy\,dx`,
    boundsLatex: String.raw`\int_0^1 x \cdot x^2\,dx = \frac{1}{4}`,
  },
};

export const Mehrfachintegrale: React.FC = () => {
  const [regionId, setRegionId] = useState<RegionId>('rect');
  const [showMonte, setShowMonte] = useState(false);
  const [monteN, setMonteN] = useState(500);

  const region = regions[regionId];

  const draw = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, mx: number, my: number) => {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) / 6;

    // Grid
    ctx.strokeStyle = 'rgba(0,212,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath(); ctx.moveTo(toX(i), 0); ctx.lineTo(toX(i), h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, toY(i)); ctx.lineTo(w, toY(i)); ctx.stroke();
    }

    function toX(x: number) { return cx + x * scale; }
    function toY(y: number) { return cy - y * scale; }

    // Axes
    ctx.strokeStyle = 'rgba(0,212,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    ctx.fillStyle = 'rgba(0,212,255,0.5)';
    ctx.font = '10px "Share Tech Mono"';
    ctx.fillText('x', w - 14, cy - 4);
    ctx.fillText('y', cx + 4, 12);

    // Integration region (shaded)
    const res = 2;
    for (let px = 0; px < w; px += res) {
      for (let py = 0; py < h; py += res) {
        const x = (px - cx) / scale;
        const y = -(py - cy) / scale;
        if (region.inside(x, y)) {
          const v = region.integrand(x, y);
          const t = Math.min(1, Math.abs(v) * 0.3 + 0.15);
          ctx.fillStyle = `rgba(0,212,255,${t * 0.4})`;
          ctx.fillRect(px, py, res, res);
        }
      }
    }

    // Region boundary
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    ctx.shadowColor = C.orangeGlow;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    const [xLo, xHi] = region.xRange;
    const steps = 200;
    // top boundary
    for (let i = 0; i <= steps; i++) {
      const x = xLo + (xHi - xLo) * i / steps;
      const y = region.yHigh(x);
      if (i === 0) ctx.moveTo(toX(x), toY(y));
      else ctx.lineTo(toX(x), toY(y));
    }
    // bottom boundary (reverse)
    for (let i = steps; i >= 0; i--) {
      const x = xLo + (xHi - xLo) * i / steps;
      const y = region.yLow(x);
      ctx.lineTo(toX(x), toY(y));
    }
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Monte Carlo points
    if (showMonte) {
      const rng = (seed: number) => {
        let s = seed;
        return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
      };
      const rand = rng(42);
      let insideCount = 0;
      const bx = [Math.min(xLo, -1.5), Math.max(xHi, 1.5)];
      const by = [-1.5, 1.5];
      for (let i = 0; i < monteN; i++) {
        const x = bx[0] + rand() * (bx[1] - bx[0]);
        const y = by[0] + rand() * (by[1] - by[0]);
        const ins = region.inside(x, y);
        if (ins) insideCount++;
        ctx.fillStyle = ins ? 'rgba(0,255,128,0.5)' : 'rgba(255,34,68,0.2)';
        ctx.beginPath();
        ctx.arc(toX(x), toY(y), 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.font = '11px "Share Tech Mono"';
      const area = (bx[1] - bx[0]) * (by[1] - by[0]) * insideCount / monteN;
      ctx.fillText(`Monte Carlo: ${insideCount}/${monteN} -> A ~ ${area.toFixed(3)}`, 8, h - 8);
    }

    if (mx >= 0) {
      const x = (mx - cx) / scale;
      const y = -(my - cy) / scale;
      const ins = region.inside(x, y);
      const v = ins ? region.integrand(x, y) : 0;
      return `(${fmt(x)}, ${fmt(y)})  ${ins ? 'IN' : 'AUSSEN'}  f=${fmt(v, 2)}`;
    }
    return '';
  }, [regionId, showMonte, monteN]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Mehrfach<em>integrale</em></h1>
      <p className="subtitle">Doppelintegrale, Integrationsbereiche &amp; Fubini</p>

      <MathCanvas draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Integrationsbereich</span></div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {(Object.keys(regions) as RegionId[]).map(id => (
              <button key={id} onClick={() => setRegionId(id)} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '11px',
                background: id === regionId ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: id === regionId ? '#00d4ff' : '#2a5a70',
              }}>
                {regions[id].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="controls" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Monte Carlo</span></div>
          <button onClick={() => setShowMonte(m => !m)} style={{
            padding: '8px', border: 'none', cursor: 'pointer', width: '100%',
            fontFamily: '"Share Tech Mono", monospace', fontSize: '11px',
            background: showMonte ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
            color: showMonte ? '#00d4ff' : '#2a5a70',
          }}>
            {showMonte ? 'AN' : 'AUS'}
          </button>
        </div>
        {showMonte && (
          <div className="ctrl">
            <div className="ctrl-header">
              <span className="ctrl-label">Punkte</span>
              <span className="ctrl-value amber">{monteN}</span>
            </div>
            <input type="range" min={50} max={2000} step={50} value={monteN} onChange={e => setMonteN(Number(e.target.value))} />
          </div>
        )}
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Integral</div>
          <div className="value"><M>{region.latex}</M></div>
        </div>
        <div className="info-card slope">
          <div className="label">Berechnung</div>
          <div className="value"><M>{region.boundsLatex}</M></div>
        </div>
        <div className="info-card zero">
          <div className="label">Exakter Wert</div>
          <div className="value">{fmt(region.exact, 4)}</div>
        </div>
      </div>

      <div className="explanation">
        <h2>Erlaeuterung</h2>
        <p>
          Ein <strong>Doppelintegral</strong> <M>{String.raw`\iint_R f(x,y)\,dA`}</M> summiert die Werte von f ueber
          dem Bereich R. Fuer <M>f = 1</M> ergibt sich der Flaecheninhalt.
        </p>
        <p>
          <strong>Satz von Fubini:</strong> Ist f stetig auf R, kann das Doppelintegral als iteriertes Integral berechnet werden:{' '}
          <M>{String.raw`\int_a^b \int_{g(x)}^{h(x)} f(x,y)\,dy\,dx`}</M>.
        </p>
        <p>
          Bei <strong>Polarkoordinaten</strong> <M>{String.raw`x = r\cos\theta, \; y = r\sin\theta`}</M> wird{' '}
          <M>{String.raw`dA = r\,dr\,d\theta`}</M>. Ideal fuer kreisfoermige Bereiche.
        </p>
        <p>
          Die <strong>Monte-Carlo-Integration</strong> schaetzt das Integral durch Zufallsstichproben —
          je mehr Punkte, desto genauer die Approximation.
        </p>
      </div>
      <IntegralExercises2D />
    </>
  );
};
