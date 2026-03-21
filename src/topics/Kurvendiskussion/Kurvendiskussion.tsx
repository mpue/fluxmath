import React, { useState, useCallback } from 'react';
import { CoordinateSystem, Viewport } from '../../shared/CoordinateSystem';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { KurvendiskussionExercises } from './KurvendiskussionExercises';

/* Polynomial: f(x) = a*x³ + b*x² + c*x + d */
export const Kurvendiskussion: React.FC = () => {
  const [ca, setCa] = useState(10);   // * 0.1
  const [cb, setCb] = useState(0);
  const [cc, setCc] = useState(-30);
  const [cd, setCd] = useState(0);
  const [showDeriv, setShowDeriv] = useState(true);
  const [show2nd, setShow2nd] = useState(false);

  const a = ca / 10;
  const b = cb / 10;
  const c = cc / 10;
  const d = cd / 10;

  const f = (x: number) => a * x * x * x + b * x * x + c * x + d;
  const f1 = (x: number) => 3 * a * x * x + 2 * b * x + c;    // f'
  const f2 = (x: number) => 6 * a * x + 2 * b;                 // f''

  // Find zeros of f' (quadratic: 3a*x² + 2b*x + c = 0)
  const disc = (2 * b) * (2 * b) - 4 * (3 * a) * c;
  const extrema: { x: number; y: number; type: string }[] = [];
  if (Math.abs(3 * a) > 0.001 && disc >= 0) {
    const sq = Math.sqrt(disc);
    const x1 = (-2 * b + sq) / (6 * a);
    const x2 = (-2 * b - sq) / (6 * a);
    const addExt = (xv: number) => {
      const yv = f(xv);
      const f2v = f2(xv);
      const type = f2v > 0.001 ? 'Minimum' : f2v < -0.001 ? 'Maximum' : 'Sattelpunkt';
      extrema.push({ x: xv, y: yv, type });
    };
    addExt(x1);
    if (Math.abs(x1 - x2) > 0.01) addExt(x2);
  }

  // Inflection: f''=0 => x = -2b/(6a) = -b/(3a)
  const inflection = Math.abs(a) > 0.001 ? -b / (3 * a) : null;
  const inflY = inflection !== null ? f(inflection) : 0;

  // Zeros via Newton's method (approximate)
  const zeros: number[] = [];
  for (let start = -10; start <= 10; start += 0.5) {
    let x = start;
    for (let i = 0; i < 30; i++) {
      const fv = f(x);
      const fd = f1(x);
      if (Math.abs(fd) < 1e-10) break;
      x = x - fv / fd;
    }
    if (Math.abs(f(x)) < 0.001 && x > -20 && x < 20) {
      if (!zeros.some(z => Math.abs(z - x) < 0.05)) zeros.push(x);
    }
  }
  zeros.sort((a2, b2) => a2 - b2);

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, my: number) => {
    const { toX, toY, xMin, xMax } = vp;
    const step = (xMax - xMin) / 600;

    // f(x)
    ctx.strokeStyle = C.line;
    ctx.shadowColor = C.lineGlow;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    for (let x = xMin; x <= xMax; x += step) {
      const y = f(x);
      if (Math.abs(y) < 50) {
        if (!started) { ctx.moveTo(toX(x), toY(y)); started = true; }
        else ctx.lineTo(toX(x), toY(y));
      } else { started = false; }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // f'(x)
    if (showDeriv) {
      ctx.strokeStyle = 'rgba(0,255,136,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      started = false;
      for (let x = xMin; x <= xMax; x += step) {
        const y = f1(x);
        if (Math.abs(y) < 50) {
          if (!started) { ctx.moveTo(toX(x), toY(y)); started = true; }
          else ctx.lineTo(toX(x), toY(y));
        } else { started = false; }
      }
      ctx.stroke();
    }

    // f''(x)
    if (show2nd) {
      ctx.strokeStyle = 'rgba(255,170,0,0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      started = false;
      for (let x = xMin; x <= xMax; x += step) {
        const y = f2(x);
        if (Math.abs(y) < 50) {
          if (!started) { ctx.moveTo(toX(x), toY(y)); started = true; }
          else ctx.lineTo(toX(x), toY(y));
        } else { started = false; }
      }
      ctx.stroke();
    }

    // Extrema
    extrema.forEach(e => {
      const color = e.type === 'Maximum' ? C.zero : e.type === 'Minimum' ? C.yint : C.orange;
      const glow = e.type === 'Maximum' ? C.zeroGlow : e.type === 'Minimum' ? C.yintGlow : C.orangeGlow;
      ctx.fillStyle = color;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(toX(e.x), toY(e.y), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillStyle = color;
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(`${e.type} (${fmt(e.x, 2)}|${fmt(e.y, 2)})`, toX(e.x) + 8, toY(e.y) - 4);
    });

    // Inflection point
    if (inflection !== null) {
      ctx.fillStyle = C.magenta;
      ctx.shadowColor = C.magentaGlow;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(toX(inflection), toY(inflY), 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillStyle = C.magentaLabel;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(`WP (${fmt(inflection, 2)}|${fmt(inflY, 2)})`, toX(inflection) + 8, toY(inflY) + 4);
    }

    // Zeros
    zeros.forEach(z => {
      ctx.strokeStyle = C.zero;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(toX(z), toY(0), 4, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Mouse crosshair info
    if (mx >= 0 && my >= 0) {
      const xm = vp.toMathX(mx);
      return `x: ${xm.toFixed(2)}   f: ${f(xm).toFixed(2)}   f': ${f1(xm).toFixed(2)}   f'': ${f2(xm).toFixed(2)}`;
    }
    return '';
  }, [f, f1, f2, showDeriv, show2nd, extrema, inflection, inflY, zeros]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Kurven<em>diskussion</em></h1>
      <p className="subtitle">Vollstaendige Funktionsuntersuchung: Extrema, Wendepunkte, Nullstellen</p>

      <CoordinateSystem draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">a (x\u00B3)</span>
            <span className="ctrl-value cyan">{fmt(a)}</span>
          </div>
          <input type="range" min={-30} max={30} step={1} value={ca} onChange={e => setCa(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">b (x\u00B2)</span>
            <span className="ctrl-value" style={{ color: '#00ff88' }}>{fmt(b)}</span>
          </div>
          <input type="range" min={-30} max={30} step={1} value={cb} onChange={e => setCb(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">c (x)</span>
            <span className="ctrl-value amber">{fmt(c)}</span>
          </div>
          <input type="range" min={-50} max={50} step={1} value={cc} onChange={e => setCc(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">d</span>
            <span className="ctrl-value" style={{ color: C.magenta }}>{fmt(d)}</span>
          </div>
          <input type="range" min={-50} max={50} step={1} value={cd} onChange={e => setCd(Number(e.target.value))} />
        </div>
      </div>

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{ color: C.yint, fontFamily: '"Share Tech Mono", monospace', fontSize: '11px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showDeriv} onChange={e => setShowDeriv(e.target.checked)} /> f'(x) anzeigen
            </label>
            <label style={{ color: C.orange, fontFamily: '"Share Tech Mono", monospace', fontSize: '11px', cursor: 'pointer' }}>
              <input type="checkbox" checked={show2nd} onChange={e => setShow2nd(e.target.checked)} /> f''(x) anzeigen
            </label>
          </div>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Funktion</div>
          <div className="value"><M>{`f(x) = ${a !== 0 ? `${fmt(a)}x^3` : ''} ${b > 0 ? '+' : ''} ${b !== 0 ? `${fmt(b)}x^2` : ''} ${c > 0 ? '+' : ''} ${c !== 0 ? `${fmt(c)}x` : ''} ${d > 0 ? '+' : ''} ${d !== 0 ? `${fmt(d)}` : ''}`}</M></div>
        </div>
        <div className="info-card slope">
          <div className="label">Extrema</div>
          <div className="value">{extrema.length === 0 ? 'keine' : extrema.map((e, i) =>
            <span key={i}>{e.type}: ({fmt(e.x, 2)}|{fmt(e.y, 2)}){i < extrema.length - 1 ? ' ; ' : ''}</span>
          )}</div>
        </div>
        <div className="info-card zero">
          <div className="label">Wendepunkt</div>
          <div className="value">{inflection !== null ? `(${fmt(inflection, 2)} | ${fmt(inflY, 2)})` : 'keiner'}</div>
          <div className="detail">f''(x) = 0</div>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Nullstellen</div>
          <div className="value">{zeros.length === 0 ? 'keine im Bereich' : zeros.map(z => fmt(z, 2)).join(' ; ')}</div>
        </div>
        <div className="info-card slope">
          <div className="label">y-Achsenabschnitt</div>
          <div className="value">f(0) = {fmt(d, 2)}</div>
        </div>
        <div className="info-card zero">
          <div className="label">Symmetrie</div>
          <div className="value">{Math.abs(a) < 0.01 && Math.abs(c) < 0.01 ? 'achsensymmetrisch' : Math.abs(b) < 0.01 && Math.abs(d) < 0.01 ? 'punktsymmetrisch' : 'keine'}</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />f(x)</div>
        {showDeriv && <div className="legend-item"><div className="legend-dot glow-lime" />f'(x)</div>}
        {show2nd && <div className="legend-item"><div className="legend-dot glow-amber" />f''(x)</div>}
        <div className="legend-item"><div className="legend-dot" style={{ background: C.magenta, boxShadow: `0 0 6px ${C.magentaGlow}` }} />Wendepunkt</div>
      </div>

      <div className="explanation">
        <h2>Erlaeuterung</h2>
        <p>
          Die <strong>Kurvendiskussion</strong> ist die systematische Untersuchung einer Funktion:
        </p>
        <ol>
          <li><strong>Definitionsbereich</strong>: Wo ist f definiert?</li>
          <li><strong>Symmetrie</strong>: Achsensymmetrie (<M>{String.raw`f(-x) = f(x)`}</M>) oder Punktsymmetrie (<M>{String.raw`f(-x) = -f(x)`}</M>)?</li>
          <li><strong>Nullstellen</strong>: <M>{String.raw`f(x) = 0`}</M></li>
          <li><strong>Extrema</strong>: <M>{String.raw`f'(x) = 0`}</M> und <M>{String.raw`f''(x) \neq 0`}</M>. Wenn <M>{String.raw`f''(x_0) > 0`}</M>: Minimum; wenn <M>{String.raw`f''(x_0) < 0`}</M>: Maximum.</li>
          <li><strong>Wendepunkte</strong>: <M>{String.raw`f''(x) = 0`}</M> und <M>{String.raw`f'''(x) \neq 0`}</M>. Hier aendert sich die Kruemmung.</li>
          <li><strong>Verhalten fuer</strong> <M>{String.raw`x \to \pm\infty`}</M></li>
        </ol>
        <p>
          Fuer <M>{String.raw`f(x) = ax^3 + bx^2 + cx + d`}</M> gilt:
          <M>{String.raw`\; f'(x) = 3ax^2 + 2bx + c`}</M> und <M>{String.raw`f''(x) = 6ax + 2b`}</M>.
        </p>
      </div>
      <KurvendiskussionExercises />
    </>
  );
};
