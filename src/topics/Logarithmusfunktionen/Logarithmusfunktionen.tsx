import React, { useState, useCallback } from 'react';
import { CoordinateSystem, Viewport } from '../../shared/CoordinateSystem';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { LogarithmusExercises } from './LogarithmusExercises';

export const Logarithmusfunktionen: React.FC = () => {
  const [base, setBase] = useState(27);  // base/10 => e.g. 2.7 ≈ e
  const [showExp, setShowExp] = useState(true);
  const [showLn, setShowLn] = useState(true);
  const [vShift, setVShift] = useState(0);
  const [hShift, setHShift] = useState(0);

  const b = base / 10;
  const vs = vShift / 10;
  const hs = hShift / 10;

  const logB = (x: number) => Math.log(x) / Math.log(b);

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, my: number) => {
    const { toX, toY, xMin, xMax } = vp;

    // Asymptote x = hs
    if (hs > xMin && hs < xMax) {
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = 'rgba(255,34,68,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(toX(hs), 0);
      ctx.lineTo(toX(hs), ctx.canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillStyle = C.zeroLabel;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Asymptote x=' + fmt(hs), toX(hs) + 4, 10);
    }

    // Exponential: b^x (reference)
    if (showExp && b > 0.1) {
      ctx.strokeStyle = 'rgba(0,255,136,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      const step = (xMax - xMin) / 400;
      for (let x = xMin; x <= xMax; x += step) {
        const y = Math.pow(b, x);
        if (y > -20 && y < 20) {
          if (!started) { ctx.moveTo(toX(x), toY(y)); started = true; }
          else ctx.lineTo(toX(x), toY(y));
        } else { started = false; }
      }
      ctx.stroke();
    }

    // y = x (mirror line)
    if (showExp) {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(toX(xMin), toY(xMin));
      ctx.lineTo(toX(xMax), toY(xMax));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Log function: log_b(x - hs) + vs
    if (showLn && b > 0.1 && b !== 1) {
      ctx.strokeStyle = C.line;
      ctx.shadowColor = C.lineGlow;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;
      const step = (xMax - xMin) / 600;
      for (let x = xMin; x <= xMax; x += step) {
        const arg = x - hs;
        if (arg <= 0) { started = false; continue; }
        const y = logB(arg) + vs;
        if (y > -20 && y < 20) {
          if (!started) { ctx.moveTo(toX(x), toY(y)); started = true; }
          else ctx.lineTo(toX(x), toY(y));
        } else { started = false; }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Zero crossing: log_b(x - hs) + vs = 0 => x = b^(-vs) + hs
    if (b > 0.1 && b !== 1) {
      const xZero = Math.pow(b, -vs) + hs;
      if (xZero > xMin && xZero < xMax) {
        ctx.fillStyle = C.zero;
        ctx.shadowColor = C.zeroGlow;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(toX(xZero), toY(0), 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.font = '10px "Share Tech Mono", monospace';
        ctx.fillStyle = C.zeroLabel;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('(' + fmt(xZero, 2) + ' | 0)', toX(xZero) + 8, toY(0) + 4);
      }
    }

    // Mouse position info
    if (mx >= 0 && my >= 0) {
      const xm = vp.toMathX(mx);
      const arg = xm - hs;
      const ym = arg > 0 && b > 0.1 && b !== 1 ? logB(arg) + vs : NaN;
      return 'x: ' + xm.toFixed(2) + (isNaN(ym) ? '' : '   y: ' + ym.toFixed(2));
    }
    return '';
  }, [b, vs, hs, showExp, showLn]);

  const isNatural = Math.abs(b - Math.E) < 0.15;
  const baseLabel = isNatural ? 'e' : fmt(b);
  const funcName = isNatural ? 'ln' : `log_{${fmt(b)}}`;

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Logarithmus<em>funktionen</em></h1>
      <p className="subtitle">Umkehrung der Exponentialfunktion, Rechengesetze &amp; Graphen</p>

      <CoordinateSystem draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Basis b</span>
            <span className="ctrl-value cyan">{isNatural ? 'e \u2248 2.7' : fmt(b)}</span>
          </div>
          <input type="range" min={2} max={100} step={1} value={base} onChange={e => setBase(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Anzeige</span></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label style={{ color: '#00ff88', fontFamily: '"Share Tech Mono", monospace', fontSize: '11px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showExp} onChange={e => setShowExp(e.target.checked)} /> b^x
            </label>
            <label style={{ color: C.line, fontFamily: '"Share Tech Mono", monospace', fontSize: '11px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showLn} onChange={e => setShowLn(e.target.checked)} /> log
            </label>
          </div>
        </div>
      </div>

      <div className="controls" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Verschiebung vertikal</span>
            <span className="ctrl-value amber">{fmt(vs)}</span>
          </div>
          <input type="range" min={-30} max={30} step={1} value={vShift} onChange={e => setVShift(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Verschiebung horizontal</span>
            <span className="ctrl-value" style={{ color: C.zero }}>{fmt(hs)}</span>
          </div>
          <input type="range" min={-30} max={30} step={1} value={hShift} onChange={e => setHShift(Number(e.target.value))} />
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Funktionsgleichung</div>
          <div className="value"><M>{`f(x) = ${funcName}(x ${hs >= 0 ? '-' : '+'} ${fmt(Math.abs(hs))}) ${vs >= 0 ? '+' : '-'} ${fmt(Math.abs(vs))}`}</M></div>
        </div>
        <div className="info-card slope">
          <div className="label">Definitionsbereich</div>
          <div className="value">D = ({fmt(hs)} ; +\u221E)</div>
          <div className="detail">Argument muss &gt; 0 sein</div>
        </div>
        <div className="info-card zero">
          <div className="label">Nullstelle</div>
          <div className="value">x = {b > 0.1 && b !== 1 ? fmt(Math.pow(b, -vs) + hs, 2) : '—'}</div>
          <div className="detail">{funcName}(x{hs !== 0 ? (hs > 0 ? `-${fmt(hs)}` : `+${fmt(-hs)}`) : ''}) = {fmt(-vs)}</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />{funcName}(x)</div>
        {showExp && <div className="legend-item"><div className="legend-dot glow-lime" />{baseLabel}^x</div>}
        <div className="legend-item"><div className="legend-dot" style={{ background: C.zero, boxShadow: `0 0 6px ${C.zeroGlow}` }} />Nullstelle / Asymptote</div>
      </div>

      <div className="explanation">
        <h2>Erlaeuterung</h2>
        <p>
          Die <strong>Logarithmusfunktion</strong> <M>{String.raw`f(x) = \log_b(x)`}</M> ist die{' '}
          <strong>Umkehrfunktion</strong> der Exponentialfunktion <M>{String.raw`g(x) = b^x`}</M>.
          Es gilt: <M>{String.raw`\log_b(x) = y \iff b^y = x`}</M>.
        </p>
        <p>
          <strong>Rechengesetze:</strong>
        </p>
        <ul>
          <li><M>{String.raw`\log_b(u \cdot v) = \log_b(u) + \log_b(v)`}</M></li>
          <li><M>{String.raw`\log_b\!\left(\frac{u}{v}\right) = \log_b(u) - \log_b(v)`}</M></li>
          <li><M>{String.raw`\log_b(u^r) = r \cdot \log_b(u)`}</M></li>
          <li><M>{String.raw`\log_b(b) = 1, \quad \log_b(1) = 0`}</M></li>
        </ul>
        <p>
          Die <strong>Basisumrechnung</strong> lautet{' '}
          <M>{String.raw`\log_b(x) = \frac{\ln(x)}{\ln(b)}`}</M>.
          Der <strong>natuerliche Logarithmus</strong> <M>{String.raw`\ln(x) = \log_e(x)`}</M>{' '}
          hat die Ableitung <M>{String.raw`\frac{d}{dx}\ln(x) = \frac{1}{x}`}</M>.
        </p>
      </div>
      <LogarithmusExercises />
    </>
  );
};
