import React, { useState, useCallback } from 'react';
import { CoordinateSystem, Viewport } from '../../shared/CoordinateSystem';
import { drawPoint, C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';

export const LineareFunktionen: React.FC = () => {
  const [sliderM, setSliderM] = useState(10);
  const [sliderB, setSliderB] = useState(20);

  const m = sliderM / 10;
  const b = sliderB / 10;

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, my: number) => {
    const { toX, toY, w, h } = vp;

    // Slope triangle
    if (Math.abs(m) > 0.01) {
      const tx = 0, ty = b;
      const x1 = toX(tx), y1 = toY(ty);
      const x2 = toX(tx + 1), y2 = toY(ty);
      const x3 = toX(tx + 1), y3 = toY(ty + m);

      ctx.fillStyle = C.triFill;
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath();
      ctx.fill();

      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = C.tri;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.fillStyle = C.triLabel;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('\u0394x = 1', (x1 + x2) / 2, Math.max(y1, y2) + 5);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('\u0394y = ' + fmt(m), x2 + 8, (y2 + y3) / 2);
    }

    // Main line with glow
    const farLeft = vp.xMin - 1;
    const farRight = vp.xMax + 1;
    ctx.shadowColor = C.lineGlow;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(toX(farLeft), toY(m * farLeft + b));
    ctx.lineTo(toX(farRight), toY(m * farRight + b));
    ctx.stroke();
    ctx.shadowBlur = 0;

    // y-intercept point
    drawPoint(ctx, toX(0), toY(b), C.yint, C.yintGlow);
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = C.yintLabel;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const yIntOff = (m >= 0) ? 16 : -16;
    ctx.fillText('(0 | ' + fmt(b) + ')', toX(0) + 12, toY(b) + yIntOff);

    // Zero point
    if (Math.abs(m) > 0.001) {
      const zx = -b / m;
      const zPx = toX(zx);
      if (zPx > -20 && zPx < w + 20) {
        drawPoint(ctx, zPx, toY(0), C.zero, C.zeroGlow);
        ctx.font = '11px "Share Tech Mono", monospace';
        ctx.fillStyle = C.zeroLabel;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('(' + fmt(zx) + ' | 0)', zPx, toY(0) + 12);
      }
    }

    // Cursor snap
    if (mx >= 0) {
      const mathX = vp.toMathX(mx);
      const fVal = m * mathX + b;
      const snapY = toY(fVal);
      if (snapY > 0 && snapY < h) {
        ctx.beginPath();
        ctx.arc(mx, snapY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,212,255,0.6)';
        ctx.fill();
      }
      return 'x: ' + mathX.toFixed(1) + '   y: ' + vp.toMathY(my).toFixed(1) + '   f(x) = ' + fmt(fVal);
    }
    return '';
  }, [m, b]);

  // Equation display
  let equation: string;
  const bSign = b >= 0 ? ' + ' : ' \u2212 ';
  const bAbs = fmt(Math.abs(b));
  if (Math.abs(m) < 0.001) {
    equation = 'f(x) = ' + fmt(b);
  } else if (Math.abs(b) < 0.001) {
    equation = 'f(x) = ' + fmt(m) + 'x';
  } else {
    equation = 'f(x) = ' + fmt(m) + 'x' + bSign + bAbs;
  }

  // Zero point
  let zeroVal: string;
  let zeroDetail: string;
  if (Math.abs(m) < 0.001) {
    zeroVal = b === 0 ? 'alle x \u2208 \u211D' : 'keine';
    zeroDetail = b === 0 ? 'Gerade liegt auf x-Achse' : 'parallel zur x-Achse';
  } else {
    const zx = -b / m;
    zeroVal = 'x\u2080 = ' + fmt(zx);
    zeroDetail = 'f(' + fmt(zx) + ') = 0';
  }

  // Slope info
  let slopeDetail: string;
  if (m > 0.001) slopeDetail = 'steigend \u2197';
  else if (m < -0.001) slopeDetail = 'fallend \u2198';
  else slopeDetail = 'horizontal \u2192';

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Lineare <em>Funktionen</em></h1>
      <p className="subtitle">Geraden, Steigung &amp; Nullstellen im 4-Quadranten-Koordinatensystem</p>

      <CoordinateSystem draw={draw} showQuadrants />

      <div className="controls">
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Steigung m</span>
            <span className="ctrl-value cyan">{fmt(m)}</span>
          </div>
          <input
            type="range"
            min={-40} max={40} step={1}
            value={sliderM}
            onChange={e => setSliderM(Number(e.target.value))}
          />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">y-Achsenabschnitt b</span>
            <span className="ctrl-value amber">{fmt(b)}</span>
          </div>
          <input
            type="range"
            min={-60} max={60} step={1}
            value={sliderB}
            onChange={e => setSliderB(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Funktionsgleichung</div>
          <div className="value">{equation}</div>
        </div>
        <div className="info-card zero">
          <div className="label">Nullstelle</div>
          <div className="value">{zeroVal}</div>
          <div className="detail">{zeroDetail}</div>
        </div>
        <div className="info-card slope">
          <div className="label">Steigung</div>
          <div className="value">m = {fmt(m)}</div>
          <div className="detail">{slopeDetail}</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />Gerade f(x)</div>
        <div className="legend-item"><div className="legend-dot glow-red" />Nullstelle</div>
        <div className="legend-item"><div className="legend-dot glow-lime" />y-Achsenabschnitt</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Steigungsdreieck</div>
      </div>

      <div className="explanation">
        <h2>Erläuterung</h2>
        <p>
          Eine <strong>lineare Funktion</strong> hat die Form <M>{'f(x) = m \\cdot x + b'}</M>.
          Der Parameter <strong>m</strong> ist die <strong>Steigung</strong> — er bestimmt, wie steil die Gerade verläuft.
          Ist m &gt; 0, steigt die Gerade; ist m &lt; 0, fällt sie; bei m = 0 verläuft sie horizontal.
        </p>
        <p>
          Der Parameter <strong>b</strong> ist der <strong>y-Achsenabschnitt</strong> — der Punkt, an dem die Gerade
          die y-Achse schneidet, also <M>{'(0 \\mid b)'}</M>.
        </p>
        <p>
          Die <strong>Nullstelle</strong> ist der x-Wert, bei dem <M>{'f(x) = 0'}</M> gilt.
          Durch Umstellen erhält man <M>{'x_0 = \\frac{-b}{m}'}</M> (sofern m ≠ 0).
          Das ist der Schnittpunkt der Geraden mit der x-Achse.
        </p>
        <p>
          Das <strong>Steigungsdreieck</strong> (gestrichelt) veranschaulicht die Steigung:
          Bei einer horizontalen Änderung von 1 ändert sich y um genau m.
        </p>
      </div>
    </>
  );
};
