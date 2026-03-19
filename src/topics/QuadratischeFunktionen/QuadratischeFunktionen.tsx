import React, { useState, useCallback } from 'react';
import { CoordinateSystem, Viewport } from '../../shared/CoordinateSystem';
import { drawPoint, C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { QuadraticExercises } from './QuadraticExercises';

export const QuadratischeFunktionen: React.FC = () => {
  const [sliderA, setSliderA] = useState(10);
  const [sliderB, setSliderB] = useState(0);
  const [sliderC, setSliderC] = useState(-20);

  const a = sliderA / 10;
  const b = sliderB / 10;
  const c = sliderC / 10;

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, my: number) => {
    const { toX, toY, w, h, unitPx } = vp;

    // Vertex
    const hVertex = Math.abs(a) > 0.001 ? -b / (2 * a) : 0;
    const kVertex = Math.abs(a) > 0.001 ? c - (b * b) / (4 * a) : c;

    // Axis of symmetry
    if (Math.abs(a) > 0.001) {
      const symPx = toX(hVertex);
      if (symPx > 0 && symPx < w) {
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = 'rgba(255,170,0,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(symPx, 0); ctx.lineTo(symPx, h); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '10px "Share Tech Mono", monospace';
        ctx.fillStyle = 'rgba(255,170,0,0.6)';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('x = ' + fmt(hVertex), symPx, 20);
      }
    }

    // Parabola
    ctx.shadowColor = C.lineGlow;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    const step = 0.05;
    for (let xVal = vp.xMin - 1; xVal <= vp.xMax + 1; xVal += step) {
      const yVal = a * xVal * xVal + b * xVal + c;
      const px = toX(xVal); const py = toY(yVal);
      if (!started) { ctx.moveTo(px, py); started = true; } else { ctx.lineTo(px, py); }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // y-intercept
    drawPoint(ctx, toX(0), toY(c), C.yint, C.yintGlow);
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = C.yintLabel;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('(0 | ' + fmt(c) + ')', toX(0) + 12, toY(c) + (a >= 0 ? 16 : -16));

    // Zeros
    if (Math.abs(a) > 0.001) {
      const disc = b * b - 4 * a * c;
      if (disc >= 0) {
        const sqrtDisc = Math.sqrt(disc);
        const x1 = (-b + sqrtDisc) / (2 * a);
        const x2 = (-b - sqrtDisc) / (2 * a);
        const zeros = disc < 0.001 ? [x1] : [x1, x2];
        for (const zx of zeros) {
          const zPx = toX(zx);
          if (zPx > -20 && zPx < w + 20) {
            drawPoint(ctx, zPx, toY(0), C.zero, C.zeroGlow);
            ctx.font = '11px "Share Tech Mono", monospace';
            ctx.fillStyle = C.zeroLabel;
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText('(' + fmt(zx) + ' | 0)', zPx, toY(0) + 12);
          }
        }
      }
    }

    // Vertex point
    if (Math.abs(a) > 0.001) {
      const vPx = toX(hVertex); const vPy = toY(kVertex);
      if (vPx > -20 && vPx < w + 20 && vPy > -20 && vPy < h + 20) {
        drawPoint(ctx, vPx, vPy, C.orange, C.orangeGlow, 8);
        ctx.font = '11px "Share Tech Mono", monospace';
        ctx.fillStyle = C.orangeLabel;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('S(' + fmt(hVertex) + ' | ' + fmt(kVertex) + ')', vPx + 12, vPy + (a > 0 ? 16 : -16));
      }
    }

    // Cursor snap
    if (mx >= 0) {
      const mathX = vp.toMathX(mx);
      const fVal = a * mathX * mathX + b * mathX + c;
      const snapY = toY(fVal);
      if (snapY > 0 && snapY < h) {
        ctx.beginPath(); ctx.arc(mx, snapY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,212,255,0.6)'; ctx.fill();
      }
      return 'x: ' + mathX.toFixed(1) + '   y: ' + vp.toMathY(my).toFixed(1) + '   f(x) = ' + fmt(fVal);
    }
    return '';
  }, [a, b, c]);

  // Equation display
  let equation: string;
  const parts: string[] = [];
  if (Math.abs(a) >= 0.001) {
    parts.push(fmt(a) + 'x\u00B2');
  }
  if (Math.abs(b) >= 0.001) {
    const sign = b > 0 && parts.length > 0 ? ' + ' : (b < 0 && parts.length > 0 ? ' \u2212 ' : '');
    parts.push(sign + (b < 0 && parts.length > 0 ? fmt(Math.abs(b)) : fmt(b)) + 'x');
  }
  if (Math.abs(c) >= 0.001 || parts.length === 0) {
    const sign = c > 0 && parts.length > 0 ? ' + ' : (c < 0 && parts.length > 0 ? ' \u2212 ' : '');
    parts.push(sign + (c < 0 && parts.length > 0 ? fmt(Math.abs(c)) : fmt(c)));
  }
  equation = 'f(x) = ' + parts.join('');

  // Discriminant
  const disc = b * b - 4 * a * c;

  // Vertex
  const hVertex = Math.abs(a) > 0.001 ? -b / (2 * a) : 0;
  const kVertex = Math.abs(a) > 0.001 ? c - (b * b) / (4 * a) : c;

  // Vertex form
  let vertexForm: string;
  if (Math.abs(a) < 0.001) {
    vertexForm = 'f(x) = ' + fmt(c) + ' (keine Parabel)';
  } else {
    const hSign = hVertex >= 0 ? ' \u2212 ' : ' + ';
    const hAbs = fmt(Math.abs(hVertex));
    const kSign = kVertex >= 0 ? ' + ' : ' \u2212 ';
    const kAbs = fmt(Math.abs(kVertex));
    vertexForm = fmt(a) + '(x' + hSign + hAbs + ')\u00B2' + kSign + kAbs;
  }

  // Zeros
  let zerosText: string;
  let zerosDetail: string;
  if (Math.abs(a) < 0.001) {
    // Linear or constant
    if (Math.abs(b) > 0.001) {
      const zx = -c / b;
      zerosText = 'x = ' + fmt(zx);
      zerosDetail = 'lineare Gleichung';
    } else {
      zerosText = Math.abs(c) < 0.001 ? 'alle x \u2208 \u211D' : 'keine';
      zerosDetail = 'konstante Funktion';
    }
  } else if (disc < -0.001) {
    zerosText = 'keine';
    zerosDetail = 'D = ' + fmt(disc) + ' < 0';
  } else if (disc < 0.001) {
    const x0 = -b / (2 * a);
    zerosText = 'x = ' + fmt(x0);
    zerosDetail = 'D = 0 (Doppelte Nullstelle)';
  } else {
    const sqrtD = Math.sqrt(disc);
    const x1 = (-b + sqrtD) / (2 * a);
    const x2 = (-b - sqrtD) / (2 * a);
    zerosText = 'x\u2081 = ' + fmt(x1) + '  x\u2082 = ' + fmt(x2);
    zerosDetail = 'D = ' + fmt(disc) + ' > 0';
  }

  // Opening direction
  let openingText: string;
  if (a > 0.001) openingText = 'nach oben ge\u00F6ffnet \u2229';
  else if (a < -0.001) openingText = 'nach unten ge\u00F6ffnet \u222A';
  else openingText = 'keine Parabel (a = 0)';

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Quadratische <em>Funktionen</em></h1>
      <p className="subtitle">Parabeln, Scheitel, Nullstellen &amp; Diskriminante</p>

      <CoordinateSystem draw={draw} showQuadrants />

      <div className="controls" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Öffnungsfaktor a</span>
            <span className="ctrl-value cyan">{fmt(a)}</span>
          </div>
          <input
            type="range"
            min={-30} max={30} step={1}
            value={sliderA}
            onChange={e => setSliderA(Number(e.target.value))}
          />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Linearfaktor b</span>
            <span className="ctrl-value amber">{fmt(b)}</span>
          </div>
          <input
            type="range"
            min={-40} max={40} step={1}
            value={sliderB}
            onChange={e => setSliderB(Number(e.target.value))}
          />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Absolutglied c</span>
            <span className="ctrl-value amber">{fmt(c)}</span>
          </div>
          <input
            type="range"
            min={-60} max={60} step={1}
            value={sliderC}
            onChange={e => setSliderC(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Funktionsgleichung</div>
          <div className="value">{equation}</div>
        </div>
        <div className="info-card zero">
          <div className="label">Nullstellen</div>
          <div className="value">{zerosText}</div>
          <div className="detail">{zerosDetail}</div>
        </div>
        <div className="info-card slope">
          <div className="label">Scheitel</div>
          <div className="value">S({fmt(hVertex)} | {fmt(kVertex)})</div>
          <div className="detail">{openingText}</div>
        </div>
      </div>

      <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="info-card eq">
          <div className="label">Scheitelform</div>
          <div className="value">{vertexForm}</div>
        </div>
        <div className="info-card slope">
          <div className="label">Diskriminante</div>
          <div className="value">D = {fmt(disc)}</div>
          <div className="detail">
            {disc > 0.001 ? '2 Nullstellen' : disc < -0.001 ? 'keine Nullstellen' : '1 Nullstelle (doppelt)'}
          </div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />Parabel f(x)</div>
        <div className="legend-item"><div className="legend-dot glow-red" />Nullstellen</div>
        <div className="legend-item"><div className="legend-dot glow-lime" />y-Achsenabschnitt</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Scheitel &amp; Symmetrieachse</div>
      </div>

      <div className="explanation">
        <h2>Erläuterung</h2>
        <p>
          Eine <strong>quadratische Funktion</strong> hat die allgemeine Form <M>{'f(x) = ax^2 + bx + c'}</M>.
          Ihr Graph ist eine <strong>Parabel</strong>. Der Parameter <strong>a</strong> bestimmt die Öffnungsrichtung
          und -weite: ist a &gt; 0, öffnet sie nach oben; ist a &lt; 0, nach unten. Je größer |a|, desto schmaler die Parabel.
        </p>
        <p>
          Der <strong>Scheitel</strong> (Vertex) ist der tiefste bzw. höchste Punkt der Parabel.
          Seine Koordinaten sind <M>{'S\\!\\left(-\\frac{b}{2a}\\,\\middle|\\, c - \\frac{b^2}{4a}\\right)'}</M>.
          Die <strong>Scheitelform</strong> lautet <M>{'f(x) = a(x - h)^2 + k'}</M>,
          wobei (h | k) der Scheitel ist.
        </p>
        <p>
          Die <strong>Nullstellen</strong> berechnet man mit der <strong>Diskriminante</strong>{' '}
                              <M>{'D = b^2 - 4ac'}</M>:
        </p>
        <p>
          Ist D &gt; 0 → zwei Nullstellen: <M>{'x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}'}</M>.
          Ist D = 0 → eine doppelte Nullstelle. Ist D &lt; 0 → keine reellen Nullstellen.
        </p>
        <p>
          Die <strong>Symmetrieachse</strong> verläuft senkrecht durch den Scheitel bei{' '}
                              <M>{'x = -\\frac{b}{2a}'}</M>. Jede Parabel ist achsensymmetrisch zu dieser Geraden.
        </p>
      </div>

      <QuadraticExercises />
    </>
  );
};
