import React, { useState, useCallback } from 'react';
import { CoordinateSystem, Viewport } from '../../shared/CoordinateSystem';
import { drawCurve, C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { DGLExercises } from './DGLExercises';

type DGLId = 'exp' | 'logistic' | 'harmonic' | 'linear';

const dgls: Record<DGLId, {
  label: string;
  slope: (x: number, y: number) => number;
  solution: (x: number, c: number) => number;
  latex: string;
  solLatex: string;
  paramLabel: string;
}> = {
  exp: {
    label: "y' = y",
    slope: (_x, y) => y,
    solution: (x, c) => c * Math.exp(x),
    latex: String.raw`y' = y`,
    solLatex: String.raw`y(x) = C \cdot e^x`,
    paramLabel: 'C (Anfangswert)',
  },
  logistic: {
    label: "y' = y(1-y)",
    slope: (_x, y) => y * (1 - y),
    solution: (x, c) => { const ec = c * Math.exp(x); return ec / (1 + ec); },
    latex: String.raw`y' = y(1 - y)`,
    solLatex: String.raw`y(x) = \frac{Ce^x}{1 + Ce^x}`,
    paramLabel: 'C',
  },
  harmonic: {
    label: "y' = -x/y",
    slope: (x, y) => Math.abs(y) < 0.01 ? NaN : -x / y,
    solution: (x, c) => { const r2 = c * c - x * x; return r2 > 0 ? Math.sqrt(r2) : NaN; },
    latex: String.raw`y' = -\frac{x}{y}`,
    solLatex: String.raw`x^2 + y^2 = C^2 \text{ (Kreise)}`,
    paramLabel: 'Radius C',
  },
  linear: {
    label: "y' = -2xy",
    slope: (x, y) => -2 * x * y,
    solution: (x, c) => c * Math.exp(-x * x),
    latex: String.raw`y' = -2xy`,
    solLatex: String.raw`y(x) = C \cdot e^{-x^2}`,
    paramLabel: 'C',
  },
};

export const Differentialgleichungen: React.FC = () => {
  const [dglId, setDglId] = useState<DGLId>('exp');
  const [param, setParam] = useState(1);
  const [showField, setShowField] = useState(true);

  const dgl = dgls[dglId];

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, _my: number) => {
    const { toX, toY, xMin, xMax, yMin, yMax, unitPx, zoom } = vp;

    // Direction field
    if (showField) {
      const spacing = Math.max(0.4, 1 / zoom);
      const len = spacing * 0.35;
      ctx.lineWidth = 1;
      for (let x = Math.ceil(xMin / spacing) * spacing; x <= xMax; x += spacing) {
        for (let y = Math.ceil(yMin / spacing) * spacing; y <= yMax; y += spacing) {
          const s = dgl.slope(x, y);
          if (!isFinite(s)) continue;
          const angle = Math.atan(s);
          const dx = len * Math.cos(angle);
          const dy = len * Math.sin(angle);
          const mag = Math.min(Math.abs(s), 5) / 5;
          ctx.strokeStyle = `rgba(0,212,255,${0.15 + mag * 0.35})`;
          ctx.beginPath();
          ctx.moveTo(toX(x - dx), toY(y - dy));
          ctx.lineTo(toX(x + dx), toY(y + dy));
          ctx.stroke();
        }
      }
    }

    // Solution curve
    drawCurve(ctx, vp, x => dgl.solution(x, param), C.orange, C.orangeGlow, 2.5);

    // Additional solution curves (fainter)
    const extras = [-2, -1, -0.5, 0.5, 2, 3];
    for (const c of extras) {
      if (Math.abs(c - param) < 0.1) continue;
      ctx.globalAlpha = 0.2;
      drawCurve(ctx, vp, x => dgl.solution(x, c), C.line, C.lineGlow, 1);
      ctx.globalAlpha = 1;
    }

    if (mx >= 0) {
      const xm = vp.toMathX(mx);
      const yVal = dgl.solution(xm, param);
      const slope = dgl.slope(xm, yVal);
      return `x: ${fmt(xm)}  y: ${fmt(yVal)}  y': ${fmt(slope)}`;
    }
    return '';
  }, [dglId, param, showField]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Gewoehnliche <em>DGL</em></h1>
      <p className="subtitle">Richtungsfelder, Loesungskurven &amp; Separationsansatz</p>

      <CoordinateSystem draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Differentialgleichung</span></div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {(Object.keys(dgls) as DGLId[]).map(id => (
              <button key={id} onClick={() => setDglId(id)} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '11px',
                background: id === dglId ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: id === dglId ? '#00d4ff' : '#2a5a70',
              }}>
                {dgls[id].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="controls" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">{dgl.paramLabel}</span>
            <span className="ctrl-value amber">{fmt(param)}</span>
          </div>
          <input type="range" min={-3} max={3} step={0.1} value={param} onChange={e => setParam(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Richtungsfeld</span></div>
          <button onClick={() => setShowField(f => !f)} style={{
            padding: '8px', border: 'none', cursor: 'pointer', width: '100%',
            fontFamily: '"Share Tech Mono", monospace', fontSize: '11px',
            background: showField ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
            color: showField ? '#00d4ff' : '#2a5a70',
          }}>
            {showField ? 'AN' : 'AUS'}
          </button>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">DGL</div>
          <div className="value"><M>{dgl.latex}</M></div>
        </div>
        <div className="info-card slope">
          <div className="label">Allgemeine Loesung</div>
          <div className="value"><M>{dgl.solLatex}</M></div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />Richtungsfeld</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Loesung (C={fmt(param)})</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#00d4ff', opacity: 0.3 }} />Weitere Loesungen</div>
      </div>

      <div className="explanation">
        <h2>Erlaeuterung</h2>
        <p>
          Eine <strong>gewoehnliche Differentialgleichung</strong> (DGL) beschreibt eine Beziehung zwischen
          einer Funktion und ihren Ableitungen: <M>{String.raw`y' = f(x, y)`}</M>.
        </p>
        <p>
          Das <strong>Richtungsfeld</strong> zeigt an jedem Punkt (x, y) die Steigung y' — die
          Loesungskurven folgen diesen kleinen Strichen wie ein Fluss.
        </p>
        <p>
          <strong>Separation der Variablen:</strong> Ist die DGL separierbar, <M>{String.raw`y' = g(x) \cdot h(y)`}</M>,
          so trennt man: <M>{String.raw`\int \frac{dy}{h(y)} = \int g(x)\,dx`}</M>.
        </p>
        <p>
          Die <strong>Integrationskonstante</strong> C bestimmt die Anfangsbedingung. Verschiedene C-Werte
          erzeugen verschiedene Loesungskurven — eine ganze <em>Kurvenschar</em>.
        </p>
      </div>
      <DGLExercises />
    </>
  );
};
