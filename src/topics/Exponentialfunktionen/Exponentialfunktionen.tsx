import React, { useState, useCallback } from 'react';
import { CoordinateSystem, Viewport } from '../../shared/CoordinateSystem';
import { drawCurve, drawPoint, C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { ExponentialExercises } from './ExponentialExercises';

export const Exponentialfunktionen: React.FC = () => {
  const [sliderA, setSliderA] = useState(10);
  const [sliderK, setSliderK] = useState(10);
  const [sliderD, setSliderD] = useState(0);
  const [showLn, setShowLn] = useState(false);

  const a = sliderA / 10;
  const k = sliderK / 10;
  const d = sliderD / 10;

  const f = useCallback((x: number) => a * Math.exp(k * x) + d, [a, k, d]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, my: number) => {
    const { toX, toY, w, h } = vp;

    // Asymptote y = d
    const aPx = toY(d);
    if (aPx > 0 && aPx < h) {
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = 'rgba(255,170,0,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, aPx); ctx.lineTo(w, aPx); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillStyle = C.orangeLabel;
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('Asymptote y = ' + fmt(d), 8, aPx - 4);
    }

    drawCurve(ctx, vp, f, C.line, C.lineGlow);

    // ln curve
    if (showLn) {
      const lnFn = (x: number) => x > 0 ? Math.log(x) : NaN;
      drawCurve(ctx, vp, (x: number) => {
        const val = lnFn(x);
        return isNaN(val) ? -999 : val;
      }, C.magenta, C.magentaGlow, 2);
    }

    // y-intercept
    const yInt = f(0);
    const yPx = toY(yInt);
    if (yPx > -20 && yPx < h + 20) {
      drawPoint(ctx, toX(0), yPx, C.yint, C.yintGlow);
      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.fillStyle = C.yintLabel;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('(0 | ' + fmt(yInt) + ')', toX(0) + 12, yPx + 16);
    }

    // Zero: a*e^(kx) + d = 0 => e^(kx) = -d/a => kx = ln(-d/a)
    if (Math.abs(a) > 0.001 && Math.abs(k) > 0.001 && (-d / a) > 0) {
      const zx = Math.log(-d / a) / k;
      const zPx = toX(zx);
      if (zPx > -20 && zPx < w + 20) {
        drawPoint(ctx, zPx, toY(0), C.zero, C.zeroGlow);
        ctx.font = '11px "Share Tech Mono", monospace';
        ctx.fillStyle = C.zeroLabel;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('(' + fmt(zx) + ' | 0)', zPx, toY(0) + 12);
      }
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
  }, [f, d, showLn]);

  // Equation
  let eq = 'f(x) = ';
  if (Math.abs(a - 1) > 0.001) eq += fmt(a) + '·';
  eq += 'e';
  if (Math.abs(k - 1) > 0.001) eq += '^(' + fmt(k) + 'x)'; else eq += '^x';
  if (d > 0.001) eq += ' + ' + fmt(d);
  else if (d < -0.001) eq += ' \u2212 ' + fmt(Math.abs(d));

  const halfLife = Math.abs(k) > 0.001 ? Math.abs(Math.log(2) / k) : Infinity;

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Exponential<em>funktionen</em></h1>
      <p className="subtitle">Wachstum, Zerfall, Asymptoten &amp; Logarithmus</p>

      <CoordinateSystem draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Faktor a</span>
            <span className="ctrl-value cyan">{fmt(a)}</span>
          </div>
          <input type="range" min={-30} max={30} step={1} value={sliderA}
            onChange={e => setSliderA(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Wachstumsrate k</span>
            <span className="ctrl-value cyan">{fmt(k)}</span>
          </div>
          <input type="range" min={-20} max={20} step={1} value={sliderK}
            onChange={e => setSliderK(Number(e.target.value))} />
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

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
          onClick={() => setShowLn(!showLn)}>
          <span className="ctrl-label" style={{ color: showLn ? '#ff44cc' : undefined }}>
            {showLn ? '✓' : '○'} Natürlichen Logarithmus ln(x) einblenden
          </span>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Funktionsgleichung</div>
          <div className="value">{eq}</div>
        </div>
        <div className="info-card slope">
          <div className="label">Wachstum / Zerfall</div>
          <div className="value">{k > 0.001 ? 'Exponentielles Wachstum' : k < -0.001 ? 'Exponentieller Zerfall' : 'Konstant'}</div>
          <div className="detail">{Math.abs(k) > 0.001 ? (k > 0 ? 'Verdopplung' : 'Halbwertzeit') + ': ' + fmt(halfLife, 1) : ''}</div>
        </div>
        <div className="info-card zero">
          <div className="label">Asymptote</div>
          <div className="value">y = {fmt(d)}</div>
          <div className="detail">horizontale Asymptote</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />f(x) = a·e^(kx) + d</div>
        <div className="legend-item"><div className="legend-dot glow-red" />Nullstelle</div>
        <div className="legend-item"><div className="legend-dot glow-lime" />y-Achsenabschnitt</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Asymptote</div>
        {showLn && <div className="legend-item"><div className="legend-dot" style={{ background: '#ff44cc', boxShadow: '0 0 8px #ff44cc' }} />ln(x)</div>}
      </div>

      <div className="explanation">
        <h2>Erläuterung</h2>
        <p>
          Eine <strong>Exponentialfunktion</strong> hat die Form <M>{'f(x) = a \\cdot e^{kx} + d'}</M>.
          Die Eulersche Zahl <M>{'e \\approx 2{,}718'}</M> ist dabei die natürliche Basis.
        </p>
        <p>
          Ist <strong>k &gt; 0</strong>, wächst die Funktion exponentiell; bei <strong>k &lt; 0</strong> fällt sie (Zerfall).
          Die <strong>Verdopplungszeit</strong> (bzw. Halbwertszeit) beträgt <M>{'t = \\frac{\\ln 2}{|k|}'}</M>.
        </p>
        <p>
          Der Parameter <strong>d</strong> verschiebt die waagerechte <strong>Asymptote</strong> — für x → −∞ (bei k &gt; 0)
          nähert sich der Graph der Geraden y = d an, erreicht sie aber nie.
        </p>
        <p>
          Die <strong>Umkehrfunktion</strong> der Exponentialfunktion ist der <strong>natürliche Logarithmus</strong>{' '}
                              <M>{'\\ln(x)'}</M>. Es gilt: e^(ln(x)) = x und ln(e^x) = x.
        </p>
      </div>
      <ExponentialExercises />
    </>
  );
};
