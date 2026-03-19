import React, { useState, useCallback } from 'react';
import { MathCanvas } from '../../shared/MathCanvas';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { NormalExercises } from './NormalExercises';

function normalPdf(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

// Numerical CDF via Simpson's rule
function normalCdf(x: number, mu: number, sigma: number): number {
  const lo = mu - 6 * sigma;
  const n = 200;
  const dx = (x - lo) / n;
  if (dx <= 0) return 0;
  let sum = normalPdf(lo, mu, sigma) + normalPdf(x, mu, sigma);
  for (let i = 1; i < n; i++) {
    sum += normalPdf(lo + i * dx, mu, sigma) * (i % 2 === 0 ? 2 : 4);
  }
  return Math.max(0, Math.min(1, (sum * dx) / 3));
}

export const Normalverteilung: React.FC = () => {
  const [sliderMu, setSliderMu] = useState(0);
  const [sliderSigma, setSliderSigma] = useState(10);
  const [sliderZ, setSliderZ] = useState(0);

  const mu = sliderMu / 10;
  const sigma = Math.max(0.1, sliderSigma / 10);
  const zVal = sliderZ / 10;
  const xVal = mu + zVal * sigma;

  const draw = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, mx: number, my: number) => {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement!.clientWidth;
    const h = Math.min(w * 0.55, 420);
    canvas.style.height = h + 'px';
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const margin = { left: 50, right: 20, top: 30, bottom: 40 };
    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;

    // Visible range: mu ± 4 sigma
    const xMin = mu - 4 * sigma;
    const xMax = mu + 4 * sigma;
    const yMax = normalPdf(mu, mu, sigma) * 1.2;

    const toX = (xv: number) => margin.left + (xv - xMin) / (xMax - xMin) * plotW;
    const toY = (yv: number) => margin.top + plotH * (1 - yv / yMax);

    // Grid
    ctx.strokeStyle = 'rgba(0,212,255,0.04)';
    ctx.lineWidth = 0.5;
    const step = sigma;
    for (let xv = Math.ceil(xMin / step) * step; xv <= xMax; xv += step) {
      const px = toX(xv);
      ctx.beginPath(); ctx.moveTo(px, margin.top); ctx.lineTo(px, toY(0)); ctx.stroke();

      ctx.font = '9px "Share Tech Mono", monospace';
      ctx.fillStyle = 'rgba(0,212,255,0.3)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(fmt(xv, 1), px, toY(0) + 4);
    }

    // Baseline
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(margin.left, toY(0)); ctx.lineTo(w - margin.right, toY(0)); ctx.stroke();

    // Fill area under curve up to z-value
    ctx.beginPath();
    const xStart = Math.max(xMin, mu - 4 * sigma);
    ctx.moveTo(toX(xStart), toY(0));
    const fillEnd = Math.min(xVal, xMax);
    const numSteps = 300;
    for (let i = 0; i <= numSteps; i++) {
      const t = i / numSteps;
      const xv = xStart + t * (fillEnd - xStart);
      ctx.lineTo(toX(xv), toY(normalPdf(xv, mu, sigma)));
    }
    ctx.lineTo(toX(fillEnd), toY(0));
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, margin.top, 0, toY(0));
    fillGrad.addColorStop(0, 'rgba(0,212,255,0.2)');
    fillGrad.addColorStop(1, 'rgba(0,212,255,0.02)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Bell curve
    ctx.beginPath();
    for (let i = 0; i <= numSteps; i++) {
      const t = i / numSteps;
      const xv = xMin + t * (xMax - xMin);
      const yv = normalPdf(xv, mu, sigma);
      const px = toX(xv);
      const py = toY(yv);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sigma bands: ±1σ, ±2σ, ±3σ
    const bandAlpha = [0.08, 0.04, 0.02];
    for (let s = 3; s >= 1; s--) {
      const l = toX(mu - s * sigma);
      const r = toX(mu + s * sigma);
      ctx.fillStyle = `rgba(255,170,0,${bandAlpha[s - 1]})`;
      ctx.fillRect(l, margin.top, r - l, plotH);

      // Labels
      if (s <= 2) {
        ctx.font = '9px "Share Tech Mono", monospace';
        ctx.fillStyle = 'rgba(255,170,0,0.4)';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(`${s}σ`, toX(mu + s * sigma), toY(0) + 16);
        ctx.fillText(`−${s}σ`, toX(mu - s * sigma), toY(0) + 16);
      }
    }

    // Mean line
    const muPx = toX(mu);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = C.orangeLabel;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(muPx, margin.top); ctx.lineTo(muPx, toY(0)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = C.orangeLabel;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('μ = ' + fmt(mu, 1), muPx, margin.top - 2);

    // z-value line
    const zPx = toX(xVal);
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(zPx, margin.top); ctx.lineTo(zPx, toY(0)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = '#00ff88';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('z = ' + fmt(zVal, 1), zPx, margin.top + 14);

    // Hover crosshair value
    if (mx >= margin.left && mx <= w - margin.right) {
      const xHov = xMin + (mx - margin.left) / plotW * (xMax - xMin);
      const yHov = normalPdf(xHov, mu, sigma);
      ctx.beginPath();
      ctx.arc(toX(xHov), toY(yHov), 3, 0, Math.PI * 2);
      ctx.fillStyle = '#00ff88';
      ctx.fill();
      const zHov = (xHov - mu) / sigma;
      return `x = ${fmt(xHov, 2)}  z = ${fmt(zHov, 2)}  f(x) = ${fmt(yHov, 4)}`;
    }
    return '';
  }, [mu, sigma, xVal, zVal]);

  const phi = normalCdf(xVal, mu, sigma);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Normal<em>verteilung</em></h1>
      <p className="subtitle">Gauß-Verteilung, z-Werte &amp; Sigma-Regeln</p>

      <MathCanvas draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Erwartungswert μ</span>
            <span className="ctrl-value cyan">{fmt(mu, 1)}</span>
          </div>
          <input type="range" min={-50} max={50} step={1} value={sliderMu}
            onChange={e => setSliderMu(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Standardabw. σ</span>
            <span className="ctrl-value cyan">{fmt(sigma, 1)}</span>
          </div>
          <input type="range" min={1} max={50} step={1} value={sliderSigma}
            onChange={e => setSliderSigma(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">z-Wert</span>
            <span className="ctrl-value lime">{fmt(zVal, 1)}</span>
          </div>
          <input type="range" min={-35} max={35} step={1} value={sliderZ}
            onChange={e => setSliderZ(Number(e.target.value))} />
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Φ(z) = P(X ≤ x)</div>
          <div className="value">{(phi * 100).toFixed(2)}%</div>
          <div className="detail">x = {fmt(xVal, 2)}, z = {fmt(zVal, 2)}</div>
        </div>
        <div className="info-card zero">
          <div className="label">68-95-99.7 Regel</div>
          <div className="value">±1σ: 68.27% &nbsp; ±2σ: 95.45%</div>
          <div className="detail">±3σ: 99.73% aller Werte</div>
        </div>
        <div className="info-card slope">
          <div className="label">Parameter</div>
          <div className="value">μ = {fmt(mu, 1)} &nbsp; σ = {fmt(sigma, 1)}</div>
          <div className="detail">σ² = {fmt(sigma * sigma, 2)} (Varianz)</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />Dichtefunktion f(x)</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Erwartungswert μ</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#00ff88', boxShadow: '0 0 8px rgba(0,255,136,0.4)' }} />z-Wert / P(X ≤ x)</div>
      </div>

      <div className="explanation">
        <h2>Erläuterung</h2>
        <p>
          Die <strong>Normalverteilung</strong> <M>{'X \\sim N(\\mu, \\sigma^2)'}</M> ist die wichtigste
          stetige Wahrscheinlichkeitsverteilung. Ihre Dichtefunktion ist die bekannte <em>Glockenkurve</em>:
        </p>
        <p>
          <M>{'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} \\cdot e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}'}</M>
        </p>
        <p>
          Der <strong>z-Wert</strong> (Standardisierung) ist <M>{'z = \\frac{x - \\mu}{\\sigma}'}</M>.
          Die Verteilungsfunktion <M>{'\\Phi(z) = P(X \\leq x)'}</M> gibt die Fläche unter der Kurve
          links vom markierten Wert an.
        </p>
        <p>
          <strong>Sigma-Regeln</strong>: Im Intervall μ ± 1σ liegen ca. 68.27% aller Werte,
          bei μ ± 2σ sind es 95.45% und bei μ ± 3σ ca. 99.73%.
        </p>
      </div>
      <NormalExercises />
    </>
  );
};
