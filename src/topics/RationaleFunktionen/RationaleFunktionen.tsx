import React, { useState, useCallback } from 'react';
import { CoordinateSystem, Viewport } from '../../shared/CoordinateSystem';
import { drawCurve, drawPoint, C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { RationalExercises } from './RationalExercises';

export const RationaleFunktionen: React.FC = () => {
  const [sliderA, setSliderA] = useState(10);
  const [sliderB, setSliderB] = useState(0);
  const [sliderC, setSliderC] = useState(-10);
  const [sliderD, setSliderD] = useState(0);

  // f(x) = (ax + b) / (cx + d)  — simplest non-trivial rational function
  const a = sliderA / 10;
  const b = sliderB / 10;
  const c = sliderC / 10;
  const d = sliderD / 10;

  // Vertical asymptote: cx + d = 0  →  x = -d/c  (if c ≠ 0)
  const hasVA = Math.abs(c) > 0.001;
  const va = hasVA ? -d / c : NaN;

  // Horizontal asymptote: a/c  (if c ≠ 0)
  const ha = hasVA ? a / c : NaN;

  // Null: ax + b = 0  →  x = -b/a  (if a ≠ 0 and not cancelled by denominator)
  const hasZero = Math.abs(a) > 0.001;
  const zero = hasZero ? -b / a : NaN;
  const zeroValid = hasZero && hasVA && Math.abs(zero - va) > 0.01;

  // y-intercept: f(0) = b/d  (if d ≠ 0)
  const hasYInt = Math.abs(d) > 0.001;
  const yInt = hasYInt ? b / d : NaN;

  const f = (x: number) => {
    const denom = c * x + d;
    if (Math.abs(denom) < 1e-8) return NaN;
    return (a * x + b) / denom;
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, my: number): string => {
    const { toX, toY, w, h } = vp;

    // Draw vertical asymptote
    if (hasVA) {
      const sx = toX(va);
      if (sx > 0 && sx < w) {
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = 'rgba(255,34,68,0.5)';
        ctx.lineWidth = 1;
        ctx.shadowColor = C.zero;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, h);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
        ctx.font = '10px "Share Tech Mono", monospace';
        ctx.fillStyle = C.zeroLabel;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('x = ' + fmt(va, 2), sx + 4, 8);
      }
    }

    // Draw horizontal asymptote
    if (hasVA) {
      const sy = toY(ha);
      if (sy > 0 && sy < h) {
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = 'rgba(255,170,0,0.4)';
        ctx.lineWidth = 1;
        ctx.shadowColor = C.orange;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(w, sy);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
        ctx.font = '10px "Share Tech Mono", monospace';
        ctx.fillStyle = C.orangeLabel;
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('y = ' + fmt(ha, 2), 8, sy - 4);
      }
    }

    // Draw function — split at vertical asymptote to avoid connecting across it
    if (hasVA) {
      drawCurve(ctx, vp, (x: number) => x > va - 0.05 ? NaN : f(x), C.line, C.lineGlow);
      drawCurve(ctx, vp, (x: number) => x < va + 0.05 ? NaN : f(x), C.line, C.lineGlow);
    } else {
      drawCurve(ctx, vp, f, C.line, C.lineGlow);
    }

    // Zero
    if (zeroValid) {
      const zPx = toX(zero);
      const zPy = toY(0);
      if (zPx > -20 && zPx < w + 20) {
        drawPoint(ctx, zPx, zPy, C.yint, C.yintGlow);
        ctx.font = '11px "Share Tech Mono", monospace';
        ctx.fillStyle = C.yintLabel;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('(' + fmt(zero, 2) + ' | 0)', zPx, zPy + 12);
      }
    }

    // y-intercept
    if (hasYInt) {
      const yPx = toY(yInt);
      if (yPx > -20 && yPx < h + 20) {
        drawPoint(ctx, toX(0), yPx, C.yint, C.yintGlow);
        ctx.font = '11px "Share Tech Mono", monospace';
        ctx.fillStyle = C.yintLabel;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('(0 | ' + fmt(yInt, 2) + ')', toX(0) + 12, yPx);
      }
    }

    // Mouse label
    if (mx >= 0) {
      const mathX = vp.toMathX(mx);
      const fVal = f(mathX);
      if (isFinite(fVal)) {
        const snapY = toY(fVal);
        if (snapY > 0 && snapY < h) {
          ctx.beginPath(); ctx.arc(mx, snapY, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,212,255,0.6)'; ctx.fill();
        }
        return 'x: ' + mathX.toFixed(1) + '   y: ' + vp.toMathY(my).toFixed(1) + '   f(x) = ' + fmt(fVal, 2);
      }
    }
    return '';
  }, [a, b, c, d, va, ha, hasVA, hasYInt, yInt, zero, zeroValid, f]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Rationale <em>Funktionen</em></h1>
      <p className="subtitle">Polstellen, Asymptoten, Nullstellen &amp; Definitionslücken</p>

      <CoordinateSystem draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Zähler a</span>
            <span className="ctrl-value cyan">{fmt(a)}</span>
          </div>
          <input type="range" min={-30} max={30} step={1} value={sliderA}
            onChange={e => setSliderA(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Zähler b</span>
            <span className="ctrl-value cyan">{fmt(b)}</span>
          </div>
          <input type="range" min={-30} max={30} step={1} value={sliderB}
            onChange={e => setSliderB(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Nenner c</span>
            <span className="ctrl-value amber">{fmt(c)}</span>
          </div>
          <input type="range" min={-30} max={30} step={1} value={sliderC}
            onChange={e => setSliderC(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Nenner d</span>
            <span className="ctrl-value amber">{fmt(d)}</span>
          </div>
          <input type="range" min={-30} max={30} step={1} value={sliderD}
            onChange={e => setSliderD(Number(e.target.value))} />
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Funktionsgleichung</div>
          <div className="value">f(x) = ({fmt(a)}x {b >= 0 ? '+' : '−'} {fmt(Math.abs(b))}) / ({fmt(c)}x {d >= 0 ? '+' : '−'} {fmt(Math.abs(d))})</div>
          <div className="detail">Zählergrad = Nennergrad = 1</div>
        </div>
        <div className="info-card slope">
          <div className="label">Asymptoten</div>
          <div className="value">
            {hasVA ? `x = ${fmt(va, 2)} (vertikal)` : 'keine vertikale'}
            {' · '}
            {hasVA ? `y = ${fmt(ha, 2)} (horizontal)` : 'keine horizontale'}
          </div>
          <div className="detail">Polstelle &amp; Grenzwert für x → ±∞</div>
        </div>
        <div className="info-card zero">
          <div className="label">Nullstelle &amp; y-Achse</div>
          <div className="value">
            {zeroValid ? `x₀ = ${fmt(zero, 2)}` : 'keine NS'}
            {' · '}
            {hasYInt ? `f(0) = ${fmt(yInt, 2)}` : 'nicht def.'}
          </div>
          <div className="detail">{zeroValid ? 'Zähler = 0' : ''} {hasYInt ? '| x = 0' : ''}</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />f(x)</div>
        <div className="legend-item"><div className="legend-dot glow-red" />Polstelle (vert. Asymptote)</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Horiz. Asymptote</div>
        <div className="legend-item"><div className="legend-dot glow-lime" />Nullstelle / y-Achsenabschnitt</div>
      </div>

      <div className="explanation">
        <h2>Erläuterung</h2>
        <p>
          Eine <strong>rationale Funktion</strong> ist ein Quotient zweier Polynome:{' '}
          <M>{'f(x) = \\frac{p(x)}{q(x)}'}</M>. Die einfachste Form ist die <strong>gebrochen-lineare Funktion</strong>{' '}
          <M>{'f(x) = \\frac{ax + b}{cx + d}'}</M>.
        </p>
        <p>
          <strong>Definitionslücken</strong> entstehen, wo der Nenner null wird: <M>{'q(x) = 0'}</M>.
          Dort hat die Funktion eine <strong>Polstelle</strong> (senkrechte Asymptote) — der Graph
          „schießt" gegen ±∞.
        </p>
        <p>
          Die <strong>horizontale Asymptote</strong> ergibt sich aus dem Grenzwert für <M>{'x \\to \\pm\\infty'}</M>.
          Bei gleichen Graden von Zähler und Nenner ist das <M>{'y = \\frac{a}{c}'}</M> (Quotient der Leitkoeffizienten).
        </p>
        <p>
          <strong>Nullstellen</strong> liegen dort, wo der Zähler null wird (und der Nenner ≠ 0).
          Der <strong>y-Achsenabschnitt</strong> ist <M>{'f(0) = \\frac{b}{d}'}</M>, sofern d ≠ 0.
        </p>
      </div>
      <RationalExercises />
    </>
  );
};
