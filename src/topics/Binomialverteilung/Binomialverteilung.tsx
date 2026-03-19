import React, { useState, useCallback } from 'react';
import { MathCanvas } from '../../shared/MathCanvas';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { BinomialExercises } from './BinomialExercises';

function binomCoeff(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < Math.min(k, n - k); i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.round(result);
}

function binomPdf(k: number, n: number, p: number): number {
  return binomCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

function binomCdf(k: number, n: number, p: number): number {
  let sum = 0;
  for (let i = 0; i <= k; i++) sum += binomPdf(i, n, p);
  return sum;
}

export const Binomialverteilung: React.FC = () => {
  const [n, setN] = useState(20);
  const [sliderP, setSliderP] = useState(50);
  const [kHighlight, setKHighlight] = useState(10);

  const p = sliderP / 100;
  const mu = n * p;
  const sigma = Math.sqrt(n * p * (1 - p));

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

    // Find max probability
    let maxP = 0;
    for (let k = 0; k <= n; k++) maxP = Math.max(maxP, binomPdf(k, n, p));
    maxP = Math.max(maxP, 0.01) * 1.15;

    const barW = Math.min(plotW / (n + 2), 30);
    const gap = Math.max(1, barW * 0.1);
    const totalBarW = (n + 1) * barW;
    const offsetX = margin.left + (plotW - totalBarW) / 2;

    const toX = (k: number) => offsetX + k * barW + barW / 2;
    const toY = (pv: number) => margin.top + plotH * (1 - pv / maxP);

    // Grid lines
    const numGridLines = 5;
    for (let i = 0; i <= numGridLines; i++) {
      const pv = (maxP / numGridLines) * i;
      const y = toY(pv);
      ctx.strokeStyle = 'rgba(0,212,255,0.05)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(w - margin.right, y); ctx.stroke();

      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillStyle = 'rgba(0,212,255,0.3)';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText((pv * 100).toFixed(1) + '%', margin.left - 6, y);
    }

    // Baseline
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
      const prob = binomPdf(k, n, p);
      const bx = toX(k) - barW / 2 + gap / 2;
      const bw = barW - gap;
      const by = toY(prob);
      const bh = toY(0) - by;

      const isHighlighted = k === kHighlight;
      const isHovered = k === hoverK;

      // CDF area (k <= kHighlight)
      if (k <= kHighlight) {
        ctx.fillStyle = 'rgba(0,212,255,0.08)';
        ctx.fillRect(bx, by, bw, bh);
      }

      // Bar
      const grad = ctx.createLinearGradient(0, by, 0, toY(0));
      if (isHighlighted) {
        grad.addColorStop(0, 'rgba(0,212,255,0.9)');
        grad.addColorStop(1, 'rgba(0,212,255,0.4)');
      } else if (isHovered) {
        grad.addColorStop(0, 'rgba(0,255,136,0.8)');
        grad.addColorStop(1, 'rgba(0,255,136,0.3)');
      } else {
        grad.addColorStop(0, 'rgba(0,212,255,0.5)');
        grad.addColorStop(1, 'rgba(0,212,255,0.15)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(bx, by, bw, bh);

      ctx.strokeStyle = isHighlighted ? C.line : isHovered ? C.yint : 'rgba(0,212,255,0.3)';
      ctx.lineWidth = isHighlighted || isHovered ? 1.5 : 0.5;
      ctx.strokeRect(bx, by, bw, bh);

      // k labels (show every N-th depending on n)
      const labelEvery = n > 30 ? 5 : n > 15 ? 2 : 1;
      if (k % labelEvery === 0 || isHighlighted || isHovered) {
        ctx.font = '10px "Share Tech Mono", monospace';
        ctx.fillStyle = isHighlighted ? C.line : 'rgba(0,212,255,0.4)';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(String(k), toX(k), toY(0) + 4);
      }

      // Probability on hover
      if (isHovered && bh > 2) {
        ctx.font = '11px "Share Tech Mono", monospace';
        ctx.fillStyle = '#00ff88';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText((prob * 100).toFixed(2) + '%', toX(k), by - 4);
      }
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

    // Sigma range
    const sig1L = toX(mu - sigma);
    const sig1R = toX(mu + sigma);
    ctx.fillStyle = 'rgba(255,170,0,0.04)';
    ctx.fillRect(sig1L, margin.top, sig1R - sig1L, plotH);

    // Axis label
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(0,212,255,0.5)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('k (Anzahl Treffer)', margin.left + plotW / 2, toY(0) + 22);

    let label = '';
    if (hoverK >= 0) {
      label = 'k = ' + hoverK + '   P(X=' + hoverK + ') = ' + (binomPdf(hoverK, n, p) * 100).toFixed(2) + '%';
    }
    return label;
  }, [n, p, mu, sigma, kHighlight]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Binomial<em>verteilung</em></h1>
      <p className="subtitle">Bernoulli-Experimente, Wahrscheinlichkeiten &amp; kumulierte Verteilung</p>

      <MathCanvas draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Versuche n</span>
            <span className="ctrl-value cyan">{n}</span>
          </div>
          <input type="range" min={1} max={50} step={1} value={n}
            onChange={e => { setN(Number(e.target.value)); setKHighlight(Math.min(kHighlight, Number(e.target.value))); }} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Trefferwahrsch. p</span>
            <span className="ctrl-value cyan">{(p * 100).toFixed(0)}%</span>
          </div>
          <input type="range" min={1} max={99} step={1} value={sliderP}
            onChange={e => setSliderP(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">k (Highlight)</span>
            <span className="ctrl-value amber">{kHighlight}</span>
          </div>
          <input type="range" min={0} max={n} step={1} value={kHighlight}
            onChange={e => setKHighlight(Number(e.target.value))} />
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">P(X = {kHighlight})</div>
          <div className="value">{(binomPdf(kHighlight, n, p) * 100).toFixed(2)}%</div>
          <div className="detail">Einzelwahrscheinlichkeit</div>
        </div>
        <div className="info-card zero">
          <div className="label">P(X ≤ {kHighlight})</div>
          <div className="value">{(binomCdf(kHighlight, n, p) * 100).toFixed(2)}%</div>
          <div className="detail">Kumulierte Wahrscheinlichkeit</div>
        </div>
        <div className="info-card slope">
          <div className="label">Erwartungswert &amp; Streuung</div>
          <div className="value">μ = {fmt(mu, 2)} &nbsp; σ = {fmt(sigma, 2)}</div>
          <div className="detail">μ = n·p &nbsp;&nbsp; σ = √(n·p·(1−p))</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />P(X = k)</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Erwartungswert μ</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: 'rgba(0,212,255,0.4)', boxShadow: '0 0 8px rgba(0,212,255,0.3)' }} />P(X ≤ k) Fläche</div>
      </div>

      <div className="explanation">
        <h2>Erläuterung</h2>
        <p>
          Die <strong>Binomialverteilung</strong> beschreibt die Anzahl der Treffer bei n unabhängigen Versuchen
          mit jeweils der Trefferwahrscheinlichkeit p. Man schreibt <M>{'X \\sim B(n, p)'}</M>.
        </p>
        <p>
          Die Wahrscheinlichkeit für genau k Treffer ist:{' '}
          <M>{'P(X = k) = \\binom{n}{k} \\cdot p^k \\cdot (1-p)^{n-k}'}</M>,
          wobei <M>{'\\binom{n}{k} = \\frac{n!}{k! \\cdot (n-k)!}'}</M> der Binomialkoeffizient ist.
        </p>
        <p>
          <strong>Erwartungswert</strong>: <M>{'\\mu = E(X) = n \\cdot p'}</M> — der im Mittel zu erwartende Wert.
          <strong> Standardabweichung</strong>: <M>{'\\sigma = \\sqrt{n \\cdot p \\cdot (1-p)}'}</M> — Maß für die Streuung.
        </p>
        <p>
          Die <strong>kumulierte Verteilung</strong> <M>{'P(X \\leq k)'}</M> gibt an, wie wahrscheinlich
          es ist, höchstens k Treffer zu erzielen. Sie wird durch die eingefärbte Fläche im Diagramm dargestellt.
        </p>
      </div>
      <BinomialExercises />
    </>
  );
};
