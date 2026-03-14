import React, { useState, useCallback } from 'react';
import { MathCanvas } from '../../shared/MathCanvas';
import { setupCanvas, drawGrid, drawAxes, drawCurve, drawCrosshair, C, fmt } from '../../shared/canvasUtils';

export const TrigonometrischeFunktionen: React.FC = () => {
  const [sliderA, setSliderA] = useState(10);
  const [sliderB, setSliderB] = useState(10);
  const [sliderC, setSliderC] = useState(0);
  const [sliderD, setSliderD] = useState(0);
  const [funcType, setFuncType] = useState<'sin' | 'cos' | 'tan'>('sin');

  const a = sliderA / 10;
  const b = sliderB / 10;
  const c = sliderC / 10;
  const d = sliderD / 10;

  const baseFn = useCallback((x: number) => {
    const inner = b * x + c;
    if (funcType === 'sin') return Math.sin(inner);
    if (funcType === 'cos') return Math.cos(inner);
    return Math.tan(inner);
  }, [b, c, funcType]);

  const f = useCallback((x: number) => a * baseFn(x) + d, [a, baseFn, d]);

  const draw = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, mx: number, my: number) => {
    const layout = setupCanvas(canvas, ctx);
    drawGrid(ctx, layout);
    drawAxes(ctx, layout);
    const { w, h, toX, toY, unitPx } = layout;

    // Draw pi markers on x-axis
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(0,212,255,0.4)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let n = -4; n <= 4; n++) {
      if (n === 0) continue;
      const xPi = n * Math.PI;
      const px = toX(xPi);
      if (px > 10 && px < w - 10) {
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = 'rgba(0,212,255,0.08)';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
        ctx.setLineDash([]);
        const label = n === 1 ? '\u03C0' : n === -1 ? '-\u03C0' : n + '\u03C0';
        ctx.fillText(label, px, layout.cy + 18);
      }
    }

    // Draw main curve
    drawCurve(ctx, layout, f, C.line, C.lineGlow, 2.5, funcType === 'tan' ? 0.01 : 0.03);

    // Period markers
    if (Math.abs(b) > 0.001) {
      const period = 2 * Math.PI / Math.abs(b);
      if (period * unitPx > 20 && period * unitPx < w) {
        // Visualize one period starting from phase shift
        const phaseShift = -c / b;
        const x1 = toX(phaseShift);
        const x2 = toX(phaseShift + period);
        if (x1 > -50 && x2 < w + 50) {
          ctx.setLineDash([4, 3]);
          ctx.strokeStyle = 'rgba(255,170,0,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(x1, h); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x2, 0); ctx.lineTo(x2, h); ctx.stroke();
          ctx.setLineDash([]);

          // Period bracket
          const bracketY = 20;
          ctx.strokeStyle = C.tri;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x1, bracketY); ctx.lineTo(x1, bracketY + 8);
          ctx.moveTo(x1, bracketY + 4); ctx.lineTo(x2, bracketY + 4);
          ctx.moveTo(x2, bracketY); ctx.lineTo(x2, bracketY + 8);
          ctx.stroke();
          ctx.font = '10px "Share Tech Mono", monospace';
          ctx.fillStyle = C.triLabel;
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText('T = ' + fmt(period, 2), (x1 + x2) / 2, bracketY + 10);
        }
      }
    }

    // Amplitude lines
    if (funcType !== 'tan') {
      const ampMax = toY(a + d);
      const ampMin = toY(-a + d);
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = 'rgba(0,255,136,0.15)';
      ctx.lineWidth = 0.5;
      if (ampMax > 0 && ampMax < h) { ctx.beginPath(); ctx.moveTo(0, ampMax); ctx.lineTo(w, ampMax); ctx.stroke(); }
      if (ampMin > 0 && ampMin < h) { ctx.beginPath(); ctx.moveTo(0, ampMin); ctx.lineTo(w, ampMin); ctx.stroke(); }
      ctx.setLineDash([]);
    }

    const fMouse = mx >= 0 ? f((mx - layout.cx) / layout.unitPx) : undefined;
    return drawCrosshair(ctx, layout, mx, my, fMouse);
  }, [f, funcType, a, b, c, d]);

  // Equation string
  const fnName = funcType;
  let inner = '';
  if (Math.abs(b - 1) > 0.001 && Math.abs(b) > 0.001) inner += fmt(b);
  inner += 'x';
  if (c > 0.001) inner += ' + ' + fmt(c);
  else if (c < -0.001) inner += ' \u2212 ' + fmt(Math.abs(c));

  let eq = 'f(x) = ';
  if (Math.abs(a - 1) > 0.001 && Math.abs(a) > 0.001) eq += fmt(a) + '·';
  eq += fnName + '(' + inner + ')';
  if (d > 0.001) eq += ' + ' + fmt(d);
  else if (d < -0.001) eq += ' \u2212 ' + fmt(Math.abs(d));

  const period = Math.abs(b) > 0.001 ? 2 * Math.PI / Math.abs(b) : Infinity;
  const phaseShift = Math.abs(b) > 0.001 ? -c / b : 0;

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Trigonometrische <em>Funktionen</em></h1>
      <p className="subtitle">Sinus, Kosinus &amp; Tangens — Amplitude, Periode &amp; Phase</p>

      <MathCanvas draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Funktionstyp</span>
            <span className="ctrl-value cyan">{funcType}</span>
          </div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {(['sin', 'cos', 'tan'] as const).map(ft => (
              <button key={ft} onClick={() => setFuncType(ft)} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '12px',
                background: ft === funcType ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: ft === funcType ? '#00d4ff' : '#2a5a70',
                letterSpacing: '.1em',
              }}>
                {ft.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="controls" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Amplitude a</span>
            <span className="ctrl-value cyan">{fmt(a)}</span>
          </div>
          <input type="range" min={-30} max={30} step={1} value={sliderA}
            onChange={e => setSliderA(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Frequenz b</span>
            <span className="ctrl-value cyan">{fmt(b)}</span>
          </div>
          <input type="range" min={1} max={40} step={1} value={sliderB}
            onChange={e => setSliderB(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Phase c</span>
            <span className="ctrl-value amber">{fmt(c)}</span>
          </div>
          <input type="range" min={-31} max={31} step={1} value={sliderC}
            onChange={e => setSliderC(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Verschiebung d</span>
            <span className="ctrl-value amber">{fmt(d)}</span>
          </div>
          <input type="range" min={-40} max={40} step={1} value={sliderD}
            onChange={e => setSliderD(Number(e.target.value))} />
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Funktionsgleichung</div>
          <div className="value">{eq}</div>
        </div>
        <div className="info-card slope">
          <div className="label">Periode T</div>
          <div className="value">{period === Infinity ? '∞' : fmt(period, 2)}</div>
          <div className="detail">{Math.abs(b) > 0.001 ? 'T = 2\u03C0 / |b|' : ''}</div>
        </div>
        <div className="info-card zero">
          <div className="label">Phasenverschiebung</div>
          <div className="value">{fmt(phaseShift, 2)}</div>
          <div className="detail">{funcType !== 'tan' ? 'Amplitude: |a| = ' + fmt(Math.abs(a)) : 'Tangens: Polstellen'}</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />{funcType}(x)</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Periode</div>
        {funcType !== 'tan' && <div className="legend-item"><div className="legend-dot glow-lime" />Amplitude</div>}
      </div>

      <div className="explanation">
        <h2>Erläuterung</h2>
        <p>
          Die allgemeine Form ist <span className="formula">f(x) = a · {funcType}(bx + c) + d</span>.
          Die Parameter beeinflussen den Graphen systematisch:
        </p>
        <p>
          <strong>a</strong> = <strong>Amplitude</strong> (Streckung in y-Richtung).
          <strong> b</strong> = <strong>Frequenz</strong> (bestimmt die Periode T = 2π/|b|).
          <strong> c</strong> = <strong>Phasenverschiebung</strong> (Verschiebung in x-Richtung um −c/b).
          <strong> d</strong> = <strong>vertikale Verschiebung</strong>.
        </p>
        <p>
          Wichtige Werte: <span className="formula">sin(0) = 0, sin(π/2) = 1, cos(0) = 1, cos(π/2) = 0</span>.
          Die Beziehung <span className="formula">cos(x) = sin(x + π/2)</span> verbindet Sinus und Kosinus.
        </p>
        <p>
          Der <strong>Tangens</strong> hat Definitionslücken (Polstellen) bei <span className="formula">x = π/2 + n·π</span>
          und die Periode π statt 2π.
        </p>
      </div>
    </>
  );
};
