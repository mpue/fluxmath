import React, { useState, useCallback } from 'react';
import { CoordinateSystem, Viewport } from '../../shared/CoordinateSystem';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { GrenzwerteExercises } from './GrenzwerteExercises';

type Example = 'sinc' | 'exp_growth' | 'rational' | 'discontinuous' | 'squeeze';

interface ExampleDef {
  label: string;
  fn: (x: number) => number;
  limitDesc: string;
  limitVal: string;
  detail: string;
}

const examples: Record<Example, ExampleDef> = {
  sinc: {
    label: 'sin(x)/x',
    fn: (x: number) => x === 0 ? 1 : Math.sin(x) / x,
    limitDesc: 'lim x\u21920',
    limitVal: '1',
    detail: 'Wichtiger Grenzwert: sin(x)/x \u2192 1 fuer x \u2192 0',
  },
  exp_growth: {
    label: '(1+1/n)^n',
    fn: (x: number) => x > 0.01 ? Math.pow(1 + 1 / x, x) : Math.E,
    limitDesc: 'lim n\u2192\u221E',
    limitVal: 'e \u2248 2.718',
    detail: 'Definition der Euler-Zahl: (1+1/n)^n \u2192 e',
  },
  rational: {
    label: '(x\u00B2-1)/(x-1)',
    fn: (x: number) => Math.abs(x - 1) < 0.001 ? 2 : (x * x - 1) / (x - 1),
    limitDesc: 'lim x\u21921',
    limitVal: '2',
    detail: 'Hebbare Luecke: (x\u00B2-1)/(x-1) = x+1 fuer x \u2260 1',
  },
  discontinuous: {
    label: '1/x',
    fn: (x: number) => Math.abs(x) < 0.01 ? (x >= 0 ? 100 : -100) : 1 / x,
    limitDesc: 'lim x\u21920',
    limitVal: '\u00B1\u221E (existiert nicht)',
    detail: 'Polstelle: linksseitiger \u2192 -\u221E, rechtsseitiger \u2192 +\u221E',
  },
  squeeze: {
    label: 'x\u00B7sin(1/x)',
    fn: (x: number) => Math.abs(x) < 0.001 ? 0 : x * Math.sin(1 / x),
    limitDesc: 'lim x\u21920',
    limitVal: '0',
    detail: 'Sandwich-Theorem: -|x| \u2264 x\u00B7sin(1/x) \u2264 |x| \u2192 0',
  },
};

export const Grenzwerte: React.FC = () => {
  const [example, setExample] = useState<Example>('sinc');
  const [showEnvelope, setShowEnvelope] = useState(true);

  const ex = examples[example];

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, my: number) => {
    const { toX, toY, xMin, xMax } = vp;

    // Main function
    ctx.strokeStyle = C.line;
    ctx.shadowColor = C.lineGlow;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    const step = (xMax - xMin) / 800;
    for (let x = xMin; x <= xMax; x += step) {
      const y = ex.fn(x);
      if (isFinite(y) && Math.abs(y) < 50) {
        if (!started) { ctx.moveTo(toX(x), toY(y)); started = true; }
        else ctx.lineTo(toX(x), toY(y));
      } else { started = false; }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Envelope / bounding for squeeze theorem
    if (showEnvelope && example === 'squeeze') {
      // Draw |x| and -|x|
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(0,255,136,0.4)';
      ctx.beginPath();
      ctx.moveTo(toX(xMin), toY(Math.abs(xMin)));
      for (let x = xMin; x <= xMax; x += step) ctx.lineTo(toX(x), toY(Math.abs(x)));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,34,68,0.4)';
      ctx.beginPath();
      ctx.moveTo(toX(xMin), toY(-Math.abs(xMin)));
      for (let x = xMin; x <= xMax; x += step) ctx.lineTo(toX(x), toY(-Math.abs(x)));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Limit approach visualization: epsilon band
    if (example === 'sinc') {
      const limitY = 1;
      const eps = 0.15;
      ctx.fillStyle = 'rgba(0,212,255,0.04)';
      ctx.fillRect(toX(xMin), toY(limitY + eps), toX(xMax) - toX(xMin), toY(limitY - eps) - toY(limitY + eps));
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(0,212,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(toX(xMin), toY(limitY + eps));
      ctx.lineTo(toX(xMax), toY(limitY + eps));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(toX(xMin), toY(limitY - eps));
      ctx.lineTo(toX(xMax), toY(limitY - eps));
      ctx.stroke();
      ctx.setLineDash([]);

      // Limit point dot
      ctx.fillStyle = C.orange;
      ctx.shadowColor = C.orangeGlow;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(toX(0), toY(1), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillStyle = C.orangeLabel;
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('lim = 1', toX(0) + 8, toY(1) - 4);
    }

    // For rational: show the "hole" at x=1
    if (example === 'rational') {
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(toX(1), toY(2), 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillStyle = C.orangeLabel;
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('Luecke (1|2)', toX(1) + 8, toY(2) - 4);
    }

    // For 1/x: show asymptote
    if (example === 'discontinuous') {
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = 'rgba(255,34,68,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(toX(0), 0);
      ctx.lineTo(toX(0), ctx.canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (mx >= 0 && my >= 0) {
      const xm = vp.toMathX(mx);
      const ym = ex.fn(xm);
      return 'x: ' + xm.toFixed(3) + (isFinite(ym) ? '   f(x): ' + ym.toFixed(4) : '   f(x): \u221E');
    }
    return '';
  }, [example, ex, showEnvelope]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Grenz<em>werte</em></h1>
      <p className="subtitle">Konvergenz, Stetigkeit &amp; wichtige Grenzwerte</p>

      <CoordinateSystem draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Beispiel</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px' }}>
            {(Object.keys(examples) as Example[]).map(id => (
              <button key={id} onClick={() => setExample(id)} style={{
                flex: '1 1 auto', padding: '8px 12px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '11px',
                background: id === example ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: id === example ? '#00d4ff' : '#2a5a70',
              }}>
                {examples[id].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {example === 'squeeze' && (
        <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
          <div className="ctrl">
            <label style={{ color: C.yint, fontFamily: '"Share Tech Mono", monospace', fontSize: '11px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showEnvelope} onChange={e => setShowEnvelope(e.target.checked)} /> Einhuellende \u00B1|x| anzeigen
            </label>
          </div>
        </div>
      )}

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Funktion</div>
          <div className="value">{ex.label}</div>
        </div>
        <div className="info-card slope">
          <div className="label">{ex.limitDesc}</div>
          <div className="value">{ex.limitVal}</div>
        </div>
        <div className="info-card zero">
          <div className="label">Detail</div>
          <div className="value" style={{ fontSize: '11px' }}>{ex.detail}</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />f(x)</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Grenzwert</div>
      </div>

      <div className="explanation">
        <h2>Erlaeuterung</h2>
        <p>
          Ein <strong>Grenzwert</strong> <M>{String.raw`\lim_{x \to a} f(x) = L`}</M> bedeutet:
          Fuer jedes <M>{String.raw`\varepsilon > 0`}</M> gibt es ein <M>{String.raw`\delta > 0`}</M>,
          sodass <M>{String.raw`|f(x) - L| < \varepsilon`}</M> fuer alle{' '}
          <M>{String.raw`0 < |x - a| < \delta`}</M> (<strong>Epsilon-Delta-Definition</strong>).
        </p>
        <p>
          Eine Funktion ist <strong>stetig</strong> in a, wenn <M>{String.raw`\lim_{x \to a} f(x) = f(a)`}</M>.
          <strong> Unstetigkeiten</strong> koennen als hebbare Luecken, Spruenge oder Polstellen auftreten.
        </p>
        <p>
          <strong>Wichtige Grenzwerte:</strong>
        </p>
        <ul>
          <li><M>{String.raw`\lim_{x \to 0} \frac{\sin x}{x} = 1`}</M></li>
          <li><M>{String.raw`\lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n = e`}</M></li>
          <li><M>{String.raw`\lim_{x \to 0} \frac{e^x - 1}{x} = 1`}</M></li>
        </ul>
        <p>
          Das <strong>Sandwich-Theorem</strong> (Einschliesssatz): Wenn <M>{String.raw`g(x) \leq f(x) \leq h(x)`}</M>{' '}
          und <M>{String.raw`\lim g(x) = \lim h(x) = L`}</M>, dann ist auch <M>{String.raw`\lim f(x) = L`}</M>.
        </p>
      </div>
      <GrenzwerteExercises />
    </>
  );
};
