import React, { useState, useCallback } from 'react';
import { MathCanvas } from '../../shared/MathCanvas';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { HypothesisExercises } from './HypothesisExercises';

/* ── Binomial helpers ── */
function binomCoeff(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let r = 1;
  for (let i = 0; i < Math.min(k, n - k); i++) r = r * (n - i) / (i + 1);
  return Math.round(r);
}
function binomPdf(k: number, n: number, p: number): number {
  return binomCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}
function binomCdf(k: number, n: number, p: number): number {
  let s = 0;
  for (let i = 0; i <= k; i++) s += binomPdf(i, n, p);
  return s;
}

/* Critical value: smallest k such that P(X <= k) >= 1 - alpha (right-tail reject) */
function criticalRight(n: number, p0: number, alpha: number): number {
  for (let k = n; k >= 0; k--) {
    if (1 - binomCdf(k - 1, n, p0) <= alpha) return k;
  }
  return n + 1;
}
/* Critical value: largest k such that P(X <= k) <= alpha (left-tail reject) */
function criticalLeft(n: number, p0: number, alpha: number): number {
  for (let k = 0; k <= n; k++) {
    if (binomCdf(k, n, p0) <= alpha) continue;
    return k - 1;
  }
  return -1;
}

type TestSide = 'right' | 'left';

export const Hypothesentests: React.FC = () => {
  const [n, setN] = useState(40);
  const [sliderP0, setSliderP0] = useState(50);
  const [sliderAlpha, setSliderAlpha] = useState(5);
  const [side, setSide] = useState<TestSide>('right');

  const p0 = sliderP0 / 100;
  const alpha = sliderAlpha / 100;
  const mu = n * p0;
  const sigma = Math.sqrt(n * p0 * (1 - p0));
  const kCritRight = criticalRight(n, p0, alpha);
  const kCritLeft = criticalLeft(n, p0, alpha);
  const kCrit = side === 'right' ? kCritRight : kCritLeft;

  // Actual rejection probability (Fehler 1. Art)
  const actualAlpha = side === 'right'
    ? 1 - binomCdf(kCritRight - 1, n, p0)
    : binomCdf(Math.max(0, kCritLeft), n, p0);

  const draw = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, mx: number, my: number) => {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement!.clientWidth;
    const h = Math.min(w * 0.55, 400);
    canvas.style.height = h + 'px';
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const margin = { left: 50, right: 20, top: 20, bottom: 40 };
    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;

    let maxP = 0;
    for (let k = 0; k <= n; k++) maxP = Math.max(maxP, binomPdf(k, n, p0));
    maxP = Math.max(maxP, 0.01) * 1.15;

    const barW = Math.min(plotW / (n + 2), 30);
    const gap = Math.max(1, barW * 0.1);
    const totalBarW = (n + 1) * barW;
    const offsetX = margin.left + (plotW - totalBarW) / 2;

    const toX = (k: number) => offsetX + k * barW + barW / 2;
    const toY = (pv: number) => margin.top + plotH * (1 - pv / maxP);

    // Grid
    const numGrid = 5;
    for (let i = 0; i <= numGrid; i++) {
      const pv = (maxP / numGrid) * i;
      const y = toY(pv);
      ctx.strokeStyle = 'rgba(0,212,255,0.05)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(w - margin.right, y); ctx.stroke();
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillStyle = 'rgba(0,212,255,0.3)';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText((pv * 100).toFixed(1) + '%', margin.left - 6, y);
    }

    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(margin.left, toY(0)); ctx.lineTo(w - margin.right, toY(0)); ctx.stroke();

    // Hover detection
    let hoverK = -1;
    if (mx >= 0) {
      for (let k = 0; k <= n; k++) {
        const bx = toX(k) - barW / 2 + gap / 2;
        if (mx >= bx && mx <= bx + barW - gap) { hoverK = k; break; }
      }
    }

    // Bars
    for (let k = 0; k <= n; k++) {
      const prob = binomPdf(k, n, p0);
      const bx = toX(k) - barW / 2 + gap / 2;
      const bw = barW - gap;
      const by = toY(prob);
      const bh = toY(0) - by;

      const inReject = side === 'right' ? k >= kCritRight : k <= kCritLeft;
      const isHovered = k === hoverK;

      // Rejection region background
      if (inReject) {
        ctx.fillStyle = 'rgba(255,34,68,0.1)';
        ctx.fillRect(bx, margin.top, bw, plotH);
      }

      const grad = ctx.createLinearGradient(0, by, 0, toY(0));
      if (inReject) {
        grad.addColorStop(0, 'rgba(255,34,68,0.85)');
        grad.addColorStop(1, 'rgba(255,34,68,0.35)');
      } else if (isHovered) {
        grad.addColorStop(0, 'rgba(0,255,136,0.8)');
        grad.addColorStop(1, 'rgba(0,255,136,0.3)');
      } else {
        grad.addColorStop(0, 'rgba(0,212,255,0.5)');
        grad.addColorStop(1, 'rgba(0,212,255,0.15)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(bx, by, bw, bh);

      ctx.strokeStyle = inReject ? '#ff2244' : isHovered ? C.yint : 'rgba(0,212,255,0.3)';
      ctx.lineWidth = inReject || isHovered ? 1.5 : 0.5;
      ctx.strokeRect(bx, by, bw, bh);

      const labelEvery = n > 30 ? 5 : n > 15 ? 2 : 1;
      if (k % labelEvery === 0 || isHovered || (side === 'right' && k === kCritRight) || (side === 'left' && k === kCritLeft)) {
        ctx.font = '10px "Share Tech Mono", monospace';
        ctx.fillStyle = inReject ? '#ff2244' : 'rgba(0,212,255,0.4)';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(String(k), toX(k), toY(0) + 4);
      }

      if (isHovered && bh > 2) {
        ctx.font = '11px "Share Tech Mono", monospace';
        ctx.fillStyle = '#00ff88';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText((prob * 100).toFixed(2) + '%', toX(k), by - 4);
      }
    }

    // Critical value line
    if (kCrit >= 0 && kCrit <= n) {
      const cx = side === 'right'
        ? toX(kCritRight) - barW / 2
        : toX(kCritLeft) + barW / 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#ff2244';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, margin.top); ctx.lineTo(cx, toY(0)); ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.fillStyle = '#ff2244';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      const label = side === 'right' ? 'k = ' + kCritRight : 'k = ' + kCritLeft;
      ctx.fillText(label, cx, margin.top - 2);
    }

    // Mean marker
    const muPx = toX(mu);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = C.orangeLabel;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(muPx, margin.top); ctx.lineTo(muPx, toY(0)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = C.orangeLabel;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('\u03BC = ' + fmt(mu, 1), muPx, margin.top - 2);

    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(0,212,255,0.5)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('k (Anzahl Treffer)', margin.left + plotW / 2, toY(0) + 22);

    let infoLabel = '';
    if (hoverK >= 0) {
      infoLabel = 'k = ' + hoverK + '   P(X=' + hoverK + ') = ' + (binomPdf(hoverK, n, p0) * 100).toFixed(2) + '%';
    }
    return infoLabel;
  }, [n, p0, mu, kCritRight, kCritLeft, side]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Hypothesen<em>tests</em></h1>
      <p className="subtitle">Signifikanztest, Fehler 1. &amp; 2. Art, Ablehnungsbereich</p>

      <MathCanvas draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Testrichtung</span></div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {([
              ['right', 'Rechtsseitig (H1: p > p0)'],
              ['left', 'Linksseitig (H1: p < p0)'],
            ] as const).map(([id, label]) => (
              <button key={id} onClick={() => setSide(id)} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '10px',
                background: id === side ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: id === side ? '#00d4ff' : '#2a5a70',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="controls" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Stichprobe n</span>
            <span className="ctrl-value cyan">{n}</span>
          </div>
          <input type="range" min={10} max={100} step={1} value={n} onChange={e => setN(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">p0 (Nullhypothese)</span>
            <span className="ctrl-value cyan">{(p0 * 100).toFixed(0)}%</span>
          </div>
          <input type="range" min={5} max={95} step={1} value={sliderP0} onChange={e => setSliderP0(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Signifikanzniveau</span>
            <span className="ctrl-value amber">{alpha * 100}%</span>
          </div>
          <input type="range" min={1} max={20} step={1} value={sliderAlpha} onChange={e => setSliderAlpha(Number(e.target.value))} />
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Nullhypothese H0</div>
          <div className="value">
            {side === 'right' ? <M>{`p \\leq ${p0.toFixed(2)}`}</M> : <M>{`p \\geq ${p0.toFixed(2)}`}</M>}
          </div>
          <div className="detail">wird beibehalten, sofern kein Beweis dagegen</div>
        </div>
        <div className="info-card zero">
          <div className="label">Kritischer Wert</div>
          <div className="value">{side === 'right'
            ? (kCritRight <= n ? 'k = ' + kCritRight : 'kein Ablehnungsbereich')
            : (kCritLeft >= 0 ? 'k = ' + kCritLeft : 'kein Ablehnungsbereich')
          }</div>
          <div className="detail">
            {side === 'right'
              ? `Ablehnung wenn X >= ${kCritRight}`
              : `Ablehnung wenn X <= ${Math.max(0, kCritLeft)}`}
          </div>
        </div>
        <div className="info-card slope">
          <div className="label">Fehler 1. Art</div>
          <div className="value">{(actualAlpha * 100).toFixed(2)}%</div>
          <div className="detail">tats. Irrtumswahrscheinlichkeit (max {alpha * 100}%)</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />Verteilung unter H0</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#ff2244', boxShadow: '0 0 8px #ff2244' }} />Ablehnungsbereich</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Erwartungswert</div>
      </div>

      <div className="explanation">
        <h2>Erlaeuterung</h2>
        <p>
          Ein <strong>Hypothesentest</strong> prueft, ob eine Vermutung ueber einen Anteilswert p statistisch begruendet ist.
          Man formuliert eine <strong>Nullhypothese</strong> H0 (z.B. <M>{'p \\leq p_0'}</M>) und eine <strong>Alternativhypothese</strong> H1 (z.B. <M>{'p > p_0'}</M>).
        </p>
        <p>
          Die Testentscheidung basiert auf einer <strong>Stichprobe</strong> vom Umfang n. Die Testgroesse X zaehlt die Treffer
          und folgt unter H0 der Binomialverteilung <M>{'X \\sim B(n, p_0)'}</M>.
        </p>
        <p>
          Der <strong>Ablehnungsbereich</strong> (rot markiert) ist der Bereich, in dem H0 verworfen wird.
          Er wird so festgelegt, dass die <strong>Irrtumswahrscheinlichkeit</strong> (Fehler 1. Art)
          das Signifikanzniveau <M>{'\\alpha'}</M> nicht ueberschreitet.
        </p>
        <p>
          <strong>Fehler 1. Art</strong>: H0 wird verworfen, obwohl H0 wahr ist (Wahrscheinlichkeit max <M>{'\\alpha'}</M>).
          <strong> Fehler 2. Art</strong>: H0 wird beibehalten, obwohl H1 wahr ist.
          Durch Erhoehen von n kann man den Fehler 2. Art verringern.
        </p>
      </div>

      <HypothesisExercises />
    </>
  );
};
