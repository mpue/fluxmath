import React, { useState, useCallback } from 'react';
import { MathCanvas } from '../../shared/MathCanvas';
import { setupCanvas, drawGrid, drawAxes, drawCurve, drawCrosshair, drawPoint, C, fmt } from '../../shared/canvasUtils';

const FUNCTIONS = [
  { id: 'poly', label: 'Polynom', desc: 'f(x) = x³ − 3x' },
  { id: 'exp', label: 'e-Funktion', desc: 'f(x) = e^x' },
  { id: 'sin', label: 'Sinus', desc: 'f(x) = sin(x)' },
  { id: 'mixed', label: 'Gemischt', desc: 'f(x) = x·e^(−x²/2)' },
] as const;

type FuncId = (typeof FUNCTIONS)[number]['id'];

const funcs: Record<FuncId, { f: (x: number) => number; df: (x: number) => number; ddf: (x: number) => number }> = {
  poly: {
    f: x => x * x * x - 3 * x,
    df: x => 3 * x * x - 3,
    ddf: x => 6 * x,
  },
  exp: {
    f: x => Math.exp(x),
    df: x => Math.exp(x),
    ddf: x => Math.exp(x),
  },
  sin: {
    f: x => Math.sin(x),
    df: x => Math.cos(x),
    ddf: x => -Math.sin(x),
  },
  mixed: {
    f: x => x * Math.exp(-x * x / 2),
    df: x => (1 - x * x) * Math.exp(-x * x / 2),
    ddf: x => (x * x * x - 3 * x) * Math.exp(-x * x / 2),
  },
};

export const Differentialrechnung: React.FC = () => {
  const [funcId, setFuncId] = useState<FuncId>('poly');
  const [sliderX0, setSliderX0] = useState(10);
  const [showDf, setShowDf] = useState(true);
  const [showDdf, setShowDdf] = useState(false);

  const x0 = sliderX0 / 10;
  const { f, df, ddf } = funcs[funcId];

  const draw = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, mx: number, my: number) => {
    const layout = setupCanvas(canvas, ctx);
    drawGrid(ctx, layout);
    drawAxes(ctx, layout);
    const { toX, toY, w, h } = layout;

    // f(x)
    drawCurve(ctx, layout, f, C.line, C.lineGlow);

    // f'(x)
    if (showDf) {
      drawCurve(ctx, layout, df, C.magenta, C.magentaGlow, 2);
    }

    // f''(x)
    if (showDdf) {
      drawCurve(ctx, layout, ddf, C.purple, C.purpleGlow, 1.5);
    }

    // Tangent at x0
    const y0 = f(x0);
    const slope = df(x0);
    const tangentFn = (x: number) => slope * (x - x0) + y0;
    ctx.setLineDash([6, 4]);
    ctx.shadowColor = C.orangeGlow;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const tLeft = (0 - layout.cx) / layout.unitPx;
    const tRight = (w - layout.cx) / layout.unitPx;
    ctx.moveTo(0, toY(tangentFn(tLeft)));
    ctx.lineTo(w, toY(tangentFn(tRight)));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Point on curve
    const pPx = toX(x0);
    const pPy = toY(y0);
    if (pPx > -20 && pPx < w + 20 && pPy > -20 && pPy < h + 20) {
      drawPoint(ctx, pPx, pPy, C.orange, C.orangeGlow, 8);

      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.fillStyle = C.orangeLabel;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('(' + fmt(x0) + ' | ' + fmt(y0) + ')', pPx + 14, pPy - 14);
      ctx.fillText("m = f'(" + fmt(x0) + ') = ' + fmt(slope), pPx + 14, pPy + 2);
    }

    // Extrema/inflection indicators
    if (Math.abs(slope) < 0.15) {
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillStyle = 'rgba(0,255,136,0.8)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      const type = ddf(x0) > 0.05 ? 'MINIMUM' : ddf(x0) < -0.05 ? 'MAXIMUM' : 'WENDEPUNKT?';
      ctx.fillText(type, pPx, pPy - 18);
    }

    const fMouse = mx >= 0 ? f((mx - layout.cx) / layout.unitPx) : undefined;
    return drawCrosshair(ctx, layout, mx, my, fMouse);
  }, [f, df, ddf, x0, showDf, showDdf]);

  const y0 = f(x0);
  const slope = df(x0);
  const curvature = ddf(x0);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Differential<em>rechnung</em></h1>
      <p className="subtitle">Ableitungen, Tangenten, Extremstellen &amp; Wendepunkte</p>

      <MathCanvas draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Funktion wählen</span>
          </div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {FUNCTIONS.map(fn => (
              <button key={fn.id} onClick={() => setFuncId(fn.id)} style={{
                flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer',
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
            <span className="ctrl-label">Stelle x₀</span>
            <span className="ctrl-value cyan">{fmt(x0)}</span>
          </div>
          <input type="range" min={-40} max={40} step={1} value={sliderX0}
            onChange={e => setSliderX0(Number(e.target.value))} />
        </div>
        <div className="ctrl" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <span className="ctrl-label" style={{ cursor: 'pointer', color: showDf ? '#ff44cc' : undefined }}
            onClick={() => setShowDf(!showDf)}>
            {showDf ? '✓' : '○'} f'(x) anzeigen
          </span>
          <span className="ctrl-label" style={{ cursor: 'pointer', color: showDdf ? '#aa44ff' : undefined }}
            onClick={() => setShowDdf(!showDdf)}>
            {showDdf ? '✓' : '○'} f''(x) anzeigen
          </span>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Stelle x₀</div>
          <div className="value">f({fmt(x0)}) = {fmt(y0)}</div>
          <div className="detail">{FUNCTIONS.find(fn => fn.id === funcId)?.desc}</div>
        </div>
        <div className="info-card slope">
          <div className="label">1. Ableitung (Steigung)</div>
          <div className="value">f'({fmt(x0)}) = {fmt(slope)}</div>
          <div className="detail">
            {Math.abs(slope) < 0.1 ? 'Kandidat für Extremstelle!'
              : slope > 0 ? 'streng monoton steigend' : 'streng monoton fallend'}
          </div>
        </div>
        <div className="info-card zero">
          <div className="label">2. Ableitung (Krümmung)</div>
          <div className="value">f''({fmt(x0)}) = {fmt(curvature)}</div>
          <div className="detail">
            {curvature > 0.05 ? 'linksgekrümmt (konvex)' : curvature < -0.05 ? 'rechtsgekrümmt (konkav)' : 'Wendepunkt-Kandidat'}
          </div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />f(x)</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#ff8800', boxShadow: '0 0 8px #ff8800' }} />Tangente bei x₀</div>
        {showDf && <div className="legend-item"><div className="legend-dot" style={{ background: '#ff44cc', boxShadow: '0 0 8px #ff44cc' }} />f'(x)</div>}
        {showDdf && <div className="legend-item"><div className="legend-dot" style={{ background: '#aa44ff', boxShadow: '0 0 8px #aa44ff' }} />f''(x)</div>}
      </div>

      <div className="explanation">
        <h2>Erläuterung</h2>
        <p>
          Die <strong>Ableitung</strong> f'(x) gibt die <strong>momentane Änderungsrate</strong> (Steigung) an jeder Stelle an.
          Geometrisch ist f'(x₀) die Steigung der <strong>Tangente</strong> an den Graphen im Punkt (x₀ | f(x₀)).
        </p>
        <p>
          <strong>Extremstellen</strong>: Ist f'(x₀) = 0 und f''(x₀) &gt; 0, liegt ein <strong>lokales Minimum</strong> vor.
          Ist f'(x₀) = 0 und f''(x₀) &lt; 0, ein <strong>lokales Maximum</strong> (hinreichende Bedingung).
        </p>
        <p>
          <strong>Wendepunkte</strong>: Ist f''(x₀) = 0 und f'''(x₀) ≠ 0, wechselt die Krümmung — dies ist ein Wendepunkt.
          Hier ändert sich das Krümmungsverhalten von links- zu rechtsgekrümmt (oder umgekehrt).
        </p>
        <p>
          Wichtige <strong>Ableitungsregeln</strong>:{' '}
          <span className="formula">(xⁿ)' = n·xⁿ⁻¹</span>,{' '}
          <span className="formula">(eˣ)' = eˣ</span>,{' '}
          <span className="formula">(sin x)' = cos x</span>,{' '}
          <span className="formula">(cos x)' = −sin x</span>.{' '}
          Dazu Produkt-, Quotienten- und Kettenregel.
        </p>
      </div>
    </>
  );
};
