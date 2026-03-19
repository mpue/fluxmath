import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MathCanvas } from '../../shared/MathCanvas';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';

/* ─── Signal presets ─── */
type SignalType = 'square' | 'sawtooth' | 'triangle' | 'pulse';

function signalFn(type: SignalType, t: number): number {
  const p = ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); // [0, 2π)
  switch (type) {
    case 'square':
      return p < Math.PI ? 1 : -1;
    case 'sawtooth':
      return 1 - p / Math.PI; // ranges [1 .. -1]
    case 'triangle':
      return p < Math.PI ? -1 + 2 * p / Math.PI : 3 - 2 * p / Math.PI;
    case 'pulse':
      return p < Math.PI / 2 ? 1 : -1;
  }
}

/** Compute Fourier coefficients (a_n, b_n) via numerical integration */
function computeCoefficients(type: SignalType, N: number): { a: number[]; b: number[] } {
  const steps = 512;
  const dt = (2 * Math.PI) / steps;
  const a: number[] = new Array(N + 1).fill(0);
  const b: number[] = new Array(N + 1).fill(0);

  for (let s = 0; s < steps; s++) {
    const t = s * dt;
    const val = signalFn(type, t);
    for (let n = 0; n <= N; n++) {
      a[n] += val * Math.cos(n * t) * dt;
      b[n] += val * Math.sin(n * t) * dt;
    }
  }
  for (let n = 0; n <= N; n++) {
    a[n] /= Math.PI;
    b[n] /= Math.PI;
  }
  a[0] /= 2; // a0 / 2
  return { a, b };
}

/** Reconstruct signal from coefficients at point t */
function reconstruct(a: number[], b: number[], t: number, N: number): number {
  let sum = a[0]; // a0/2 already divided
  for (let n = 1; n <= N; n++) {
    sum += a[n] * Math.cos(n * t) + b[n] * Math.sin(n * t);
  }
  return sum;
}

/* ─── Tab type ─── */
type Tab = 'analyse' | 'synthese' | 'epizirkel';

const TAB_LABELS: Record<Tab, string> = {
  analyse: 'Analyse',
  synthese: 'Synthese',
  epizirkel: 'Epizirkel',
};

/* ═══════════════════════ COMPONENT ═══════════════════════ */

export const FourierAnalyse: React.FC = () => {
  const [tab, setTab] = useState<Tab>('analyse');
  const [signal, setSignal] = useState<SignalType>('square');
  const [harmonics, setHarmonics] = useState(5);
  const [showOriginal, setShowOriginal] = useState(true);

  // Epicycle animation
  const [epicycleSpeed, setEpicycleSpeed] = useState(10);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const lastFrameRef = useRef(0);

  const maxN = 30;
  const coeffs = computeCoefficients(signal, maxN);
  const N = Math.min(harmonics, maxN);

  /* ─── ANALYSE draw ─── */
  const drawAnalyse = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, mx: number, my: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.parentElement!.clientWidth;
      const h = Math.min(w * 0.55, 440);
      canvas.style.height = h + 'px';
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const m = { left: 55, right: 20, top: 30, bottom: 45 };
      const pw = w - m.left - m.right;
      const ph = h - m.top - m.bottom;

      const xMin = 0, xMax = 2 * Math.PI;
      const yMin = -1.5, yMax = 1.5;
      const sx = (v: number) => m.left + ((v - xMin) / (xMax - xMin)) * pw;
      const sy = (v: number) => m.top + ((yMax - v) / (yMax - yMin)) * ph;

      // Grid
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 6; i++) {
        const xv = (i / 6) * 2 * Math.PI;
        const px = sx(xv);
        ctx.beginPath(); ctx.moveTo(px, m.top); ctx.lineTo(px, m.top + ph); ctx.stroke();
      }
      for (let v = -1.5; v <= 1.5; v += 0.5) {
        const py = sy(v);
        ctx.beginPath(); ctx.moveTo(m.left, py); ctx.lineTo(m.left + pw, py); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(m.left, sy(0)); ctx.lineTo(m.left + pw, sy(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx(0), m.top); ctx.lineTo(sx(0), m.top + ph); ctx.stroke();

      // Axis labels
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillStyle = C.axisLabel;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const piLabels = ['0', 'π/3', '2π/3', 'π', '4π/3', '5π/3', '2π'];
      for (let i = 0; i <= 6; i++) {
        ctx.fillText(piLabels[i], sx((i / 6) * 2 * Math.PI), sy(0) + 6);
      }
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (let v = -1; v <= 1; v += 0.5) {
        if (Math.abs(v) < 0.01) continue;
        ctx.fillText(v.toFixed(1), m.left - 6, sy(v));
      }

      // Original signal
      if (showOriginal) {
        ctx.strokeStyle = 'rgba(255,68,204,0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        let started = false;
        for (let px = 0; px <= pw; px += 1) {
          const t = xMin + (px / pw) * (xMax - xMin);
          const v = signalFn(signal, t);
          const pyVal = sy(v);
          if (!started) { ctx.moveTo(m.left + px, pyVal); started = true; }
          else ctx.lineTo(m.left + px, pyVal);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Fourier reconstruction
      ctx.shadowColor = C.lineGlow;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started2 = false;
      for (let px = 0; px <= pw; px += 1) {
        const t = xMin + (px / pw) * (xMax - xMin);
        const v = reconstruct(coeffs.a, coeffs.b, t, N);
        const pyVal = sy(v);
        if (!started2) { ctx.moveTo(m.left + px, pyVal); started2 = true; }
        else ctx.lineTo(m.left + px, pyVal);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Mouse tracking
      if (mx >= m.left && mx <= m.left + pw && my >= m.top && my <= m.top + ph) {
        const t = xMin + ((mx - m.left) / pw) * (xMax - xMin);
        const orig = signalFn(signal, t);
        const approx = reconstruct(coeffs.a, coeffs.b, t, N);

        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = 'rgba(0,212,255,0.15)';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(mx, m.top); ctx.lineTo(mx, m.top + ph); ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath(); ctx.arc(mx, sy(approx), 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,212,255,0.7)'; ctx.fill();

        return `t: ${fmt(t, 2)}   Original: ${fmt(orig, 3)}   Reconstruction: ${fmt(approx, 3)}`;
      }
      return '';
    },
    [coeffs, N, signal, showOriginal],
  );

  /* ─── SYNTHESE draw ─── */
  const drawSynthese = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, mx: number, my: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.parentElement!.clientWidth;
      const h = Math.min(w * 0.65, 500);
      canvas.style.height = h + 'px';
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Top half: spectrum (bar chart of amplitudes)
      const specH = h * 0.35;
      const waveH = h * 0.55;
      const gap = h * 0.1;

      const barW = Math.max(6, Math.min(30, (w - 80) / (maxN + 1)));
      const specLeft = 55;
      const specTop = 10;

      // Spectrum background
      ctx.fillStyle = 'rgba(0,212,255,0.02)';
      ctx.fillRect(specLeft, specTop, (maxN + 1) * barW + 10, specH);

      // Compute amplitudes
      const amps: number[] = [];
      let ampMax = 0;
      for (let n = 0; n <= maxN; n++) {
        const amp = Math.sqrt(coeffs.a[n] * coeffs.a[n] + coeffs.b[n] * coeffs.b[n]);
        amps.push(amp);
        if (amp > ampMax) ampMax = amp;
      }
      if (ampMax < 0.001) ampMax = 1;

      // Draw bars
      for (let n = 0; n <= maxN; n++) {
        const bh = (amps[n] / ampMax) * (specH - 20);
        const bx = specLeft + n * barW + 2;
        const by = specTop + specH - 10 - bh;

        const active = n <= N;
        ctx.fillStyle = active
          ? n === 0 ? 'rgba(0,255,136,0.6)' : 'rgba(0,212,255,0.5)'
          : 'rgba(0,212,255,0.08)';
        ctx.fillRect(bx, by, barW - 4, bh);

        if (barW > 12) {
          ctx.font = '8px "Share Tech Mono", monospace';
          ctx.fillStyle = active ? 'rgba(0,212,255,0.7)' : 'rgba(0,212,255,0.2)';
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText(String(n), bx + (barW - 4) / 2, specTop + specH - 6);
        }
      }

      // Spectrum label
      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.fillStyle = C.axisLabel;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('Spektrum |cₙ|', specLeft, specTop - 1);
      ctx.textAlign = 'right';
      ctx.fillText(`N = ${N}`, w - 20, specTop);

      // Wave area
      const waveTop = specTop + specH + gap;
      const m = { left: 55, right: 20 };
      const pw = w - m.left - m.right;
      const xMin = 0, xMax = 2 * Math.PI;
      const yMin = -1.6, yMax = 1.6;
      const sx = (v: number) => m.left + ((v - xMin) / (xMax - xMin)) * pw;
      const sy = (v: number) => waveTop + ((yMax - v) / (yMax - yMin)) * waveH;

      // Grid
      ctx.strokeStyle = C.grid; ctx.lineWidth = 0.5;
      for (let v = -1.5; v <= 1.5; v += 0.5) {
        const py = sy(v);
        ctx.beginPath(); ctx.moveTo(m.left, py); ctx.lineTo(m.left + pw, py); ctx.stroke();
      }
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(m.left, sy(0)); ctx.lineTo(m.left + pw, sy(0)); ctx.stroke();

      // Draw individual harmonics
      const harmonicColors = [
        'rgba(0,255,136,0.3)',  // n=0 green
        'rgba(255,170,0,0.25)',
        'rgba(255,68,204,0.2)',
        'rgba(170,68,255,0.2)',
        'rgba(0,212,255,0.15)',
      ];

      for (let n = 1; n <= Math.min(N, 5); n++) {
        ctx.strokeStyle = harmonicColors[n % harmonicColors.length];
        ctx.lineWidth = 1;
        ctx.beginPath();
        let started = false;
        for (let px = 0; px <= pw; px += 2) {
          const t = xMin + (px / pw) * (xMax - xMin);
          const v = coeffs.a[n] * Math.cos(n * t) + coeffs.b[n] * Math.sin(n * t);
          const py = sy(v);
          if (!started) { ctx.moveTo(m.left + px, py); started = true; }
          else ctx.lineTo(m.left + px, py);
        }
        ctx.stroke();
      }

      // Original
      if (showOriginal) {
        ctx.strokeStyle = 'rgba(255,68,204,0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        let s = false;
        for (let px = 0; px <= pw; px++) {
          const t = xMin + (px / pw) * (xMax - xMin);
          const v = signalFn(signal, t);
          const py = sy(v);
          if (!s) { ctx.moveTo(m.left + px, py); s = true; }
          else ctx.lineTo(m.left + px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Reconstruction
      ctx.shadowColor = C.lineGlow;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let s2 = false;
      for (let px = 0; px <= pw; px++) {
        const t = xMin + (px / pw) * (xMax - xMin);
        const v = reconstruct(coeffs.a, coeffs.b, t, N);
        const py = sy(v);
        if (!s2) { ctx.moveTo(m.left + px, py); s2 = true; }
        else ctx.lineTo(m.left + px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Axis labels
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillStyle = C.axisLabel;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const piLabels = ['0', 'π', '2π'];
      for (let i = 0; i <= 2; i++) {
        ctx.fillText(piLabels[i], sx(i * Math.PI), sy(0) + 5);
      }

      if (mx >= m.left && mx <= m.left + pw && my >= waveTop && my <= waveTop + waveH) {
        const t = xMin + ((mx - m.left) / pw) * (xMax - xMin);
        const approx = reconstruct(coeffs.a, coeffs.b, t, N);
        return `t: ${fmt(t, 2)}   f(t) ≈ ${fmt(approx, 3)}   N = ${N}`;
      }
      return '';
    },
    [coeffs, N, signal, showOriginal],
  );

  /* ─── EPICYCLE draw (animated) ─── */
  const drawEpicycle = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, _mx: number, _my: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.parentElement!.clientWidth;
      const h = Math.min(w * 0.65, 520);
      canvas.style.height = h + 'px';
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const t = timeRef.current;

      // Build circles: each harmonic → (amplitude, frequency, phase)
      const circles: { amp: number; freq: number; phase: number }[] = [];
      for (let n = 1; n <= N; n++) {
        const an = coeffs.a[n];
        const bn = coeffs.b[n];
        const amp = Math.sqrt(an * an + bn * bn);
        if (amp < 1e-6) continue;
        const phase = Math.atan2(-bn, an); // phase to match cos+sin decomposition correctly
        circles.push({ amp, freq: n, phase });
      }
      // Sort by amplitude descending for visual clarity
      circles.sort((a, b) => b.amp - a.amp);

      // Epicycle center
      const epicenterX = w * 0.3;
      const epicenterY = h * 0.5;
      const scale = Math.min(w * 0.18, h * 0.3);

      // Draw circles chain
      let cx = epicenterX;
      let cy = epicenterY;

      // DC offset
      const dc = coeffs.a[0];
      cy -= dc * scale;

      for (let i = 0; i < circles.length; i++) {
        const { amp, freq, phase } = circles[i];
        const r = amp * scale;
        const angle = freq * t + phase;

        // Circle outline
        ctx.strokeStyle = `rgba(0,212,255,${0.08 + 0.04 * Math.min(i, 5)})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // Radius line
        const nx = cx + r * Math.cos(angle);
        const ny = cy - r * Math.sin(angle);

        ctx.strokeStyle = `rgba(0,212,255,${0.2 + 0.06 * Math.min(i, 5)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        // Small dot at joint
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,212,255,0.4)';
        ctx.fill();

        cx = nx;
        cy = ny;
      }

      // Tip dot (bright)
      ctx.shadowColor = C.lineGlow;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = C.line;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Add point to trail
      trailRef.current.push({ x: cx, y: cy });
      const maxTrailLen = 800;
      if (trailRef.current.length > maxTrailLen) {
        trailRef.current = trailRef.current.slice(-maxTrailLen);
      }

      // Draw wave on right side connected to tip
      const waveLeft = w * 0.55;
      const waveRight = w - 20;
      const waveW = waveRight - waveLeft;

      // Connection line from tip to wave start
      ctx.strokeStyle = 'rgba(255,170,0,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      const waveY0 = cy; // y-value of tip = starting y of wave
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(waveLeft, waveY0);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw the reconstructed wave scrolling
      ctx.shadowColor = C.lineGlow;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      for (let px = 0; px <= waveW; px += 1) {
        const tWave = t - (px / waveW) * 2 * Math.PI;
        const v = reconstruct(coeffs.a, coeffs.b, tWave, N);
        const py = epicenterY - v * scale - dc * scale + dc * scale; // centered
        const pyFinal = epicenterY - v * scale;
        if (!started) { ctx.moveTo(waveLeft + px, pyFinal); started = true; }
        else ctx.lineTo(waveLeft + px, pyFinal);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Original signal on wave area (faint)
      if (showOriginal) {
        ctx.strokeStyle = 'rgba(255,68,204,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        let s = false;
        for (let px = 0; px <= waveW; px += 2) {
          const tWave = t - (px / waveW) * 2 * Math.PI;
          const v = signalFn(signal, tWave);
          const py = epicenterY - v * scale;
          if (!s) { ctx.moveTo(waveLeft + px, py); s = true; }
          else ctx.lineTo(waveLeft + px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw trail from epicycle tip (behind the circles)
      if (trailRef.current.length > 2) {
        ctx.strokeStyle = 'rgba(0,212,255,0.18)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const trail = trailRef.current;
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          // Only draw trail points that are near the epicircle area
          if (trail[i].x < w * 0.5) {
            ctx.lineTo(trail[i].x, trail[i].y);
          } else {
            ctx.moveTo(trail[i].x, trail[i].y);
          }
        }
        ctx.stroke();
      }

      // Labels
      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.fillStyle = C.axisLabel;
      ctx.textAlign = 'center';
      ctx.fillText('Epizirkel', epicenterX, 15);
      ctx.fillText('Signal', waveLeft + waveW / 2, 15);

      // Circle count label
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillStyle = 'rgba(0,212,255,0.4)';
      ctx.textAlign = 'left';
      ctx.fillText(`${circles.length} Kreise`, 10, h - 10);

      return `t: ${fmt(t, 2)}   Kreise: ${circles.length}`;
    },
    [coeffs, N, signal, showOriginal],
  );

  // Animation loop for epicycle tab
  useEffect(() => {
    if (tab !== 'epizirkel') {
      cancelAnimationFrame(animRef.current);
      return;
    }

    trailRef.current = [];
    lastFrameRef.current = 0;

    const loop = (timestamp: number) => {
      if (lastFrameRef.current === 0) lastFrameRef.current = timestamp;
      const dt = (timestamp - lastFrameRef.current) / 1000;
      lastFrameRef.current = timestamp;
      timeRef.current += dt * epicycleSpeed * 0.3;

      // Force re-render by reading the canvas
      const canvasEl = document.querySelector('.canvas-wrap canvas') as HTMLCanvasElement | null;
      if (canvasEl) {
        const ctx = canvasEl.getContext('2d');
        if (ctx) {
          drawEpicycle(canvasEl, ctx, -1, -1);
        }
      }
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [tab, drawEpicycle, epicycleSpeed]);

  const activeDraw = tab === 'analyse' ? drawAnalyse : tab === 'synthese' ? drawSynthese : drawEpicycle;

  // Coefficients table data (for info)
  const visCoeffs: { n: number; an: string; bn: string; amp: string }[] = [];
  for (let n = 0; n <= Math.min(N, 10); n++) {
    visCoeffs.push({
      n,
      an: fmt(coeffs.a[n], 4),
      bn: fmt(coeffs.b[n], 4),
      amp: fmt(Math.sqrt(coeffs.a[n] ** 2 + coeffs.b[n] ** 2), 4),
    });
  }

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Fourier-<em>Analyse</em></h1>
      <p className="subtitle">Analyse, Synthese &amp; Epizirkel — Signale in Schwingungen zerlegen</p>

      {/* Tab switch */}
      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Modus</span>
            <span className="ctrl-value cyan">{TAB_LABELS[tab]}</span>
          </div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {(['analyse', 'synthese', 'epizirkel'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); trailRef.current = []; timeRef.current = 0; }} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '12px',
                background: t === tab ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: t === tab ? '#00d4ff' : '#2a5a70',
                letterSpacing: '.1em',
              }}>
                {TAB_LABELS[t].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <MathCanvas draw={activeDraw} />

      {/* Controls */}
      <div className="controls" style={{ gridTemplateColumns: tab === 'epizirkel' ? '1fr 1fr 1fr' : '1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Signalform</span>
            <span className="ctrl-value cyan">{signal}</span>
          </div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {(['square', 'sawtooth', 'triangle', 'pulse'] as const).map(s => (
              <button key={s} onClick={() => { setSignal(s); trailRef.current = []; }} style={{
                flex: 1, padding: '6px 2px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '10px',
                background: s === signal ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: s === signal ? '#00d4ff' : '#2a5a70',
                letterSpacing: '.05em',
              }}>
                {s === 'square' ? 'RECHTECK' : s === 'sawtooth' ? 'SÄGEZAHN' : s === 'triangle' ? 'DREIECK' : 'PULS'}
              </button>
            ))}
          </div>
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Harmonische N</span>
            <span className="ctrl-value amber">{N}</span>
          </div>
          <input type="range" min={1} max={maxN} step={1} value={harmonics}
            onChange={e => { setHarmonics(Number(e.target.value)); trailRef.current = []; }} />
        </div>
        {tab === 'epizirkel' && (
          <div className="ctrl">
            <div className="ctrl-header">
              <span className="ctrl-label">Geschwindigkeit</span>
              <span className="ctrl-value cyan">{fmt(epicycleSpeed / 10, 1)}×</span>
            </div>
            <input type="range" min={1} max={40} step={1} value={epicycleSpeed}
              onChange={e => setEpicycleSpeed(Number(e.target.value))} />
          </div>
        )}
      </div>

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Original anzeigen</span>
            <span className="ctrl-value" style={{ color: showOriginal ? '#00ff88' : '#2a5a70' }}>
              {showOriginal ? 'AN' : 'AUS'}
            </span>
          </div>
          <button onClick={() => setShowOriginal(!showOriginal)} style={{
            width: '100%', padding: '6px', border: 'none', cursor: 'pointer',
            fontFamily: '"Share Tech Mono", monospace', fontSize: '11px',
            background: showOriginal ? 'rgba(0,255,136,0.1)' : 'rgba(0,212,255,0.03)',
            color: showOriginal ? '#00ff88' : '#2a5a70',
            letterSpacing: '.1em',
          }}>
            {showOriginal ? 'ORIGINAL AUSBLENDEN' : 'ORIGINAL EINBLENDEN'}
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Fourier-Reihe</div>
          <div className="value" style={{ fontSize: '13px' }}>
            f(t) ≈ a₀/2 + Σ [aₙ·cos(nt) + bₙ·sin(nt)]
          </div>
        </div>
        <div className="info-card slope">
          <div className="label">Harmonische</div>
          <div className="value">{N}</div>
          <div className="detail">von max. {maxN}</div>
        </div>
        <div className="info-card zero">
          <div className="label">DC-Offset a₀/2</div>
          <div className="value">{fmt(coeffs.a[0], 4)}</div>
          <div className="detail">Mittelwert des Signals</div>
        </div>
      </div>

      {/* Coefficients table */}
      {tab !== 'epizirkel' && (
        <div className="info-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="info-card" style={{ padding: '12px 16px' }}>
            <div className="label" style={{ marginBottom: 8 }}>Koeffizienten (erste {Math.min(N, 10) + 1})</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '2px 12px',
              fontFamily: '"Share Tech Mono", monospace',
              fontSize: '11px',
            }}>
              <span style={{ color: '#2a5a70' }}>n</span>
              <span style={{ color: '#2a5a70' }}>aₙ</span>
              <span style={{ color: '#2a5a70' }}>bₙ</span>
              <span style={{ color: '#2a5a70' }}>|cₙ|</span>
              {visCoeffs.map(c => (
                <React.Fragment key={c.n}>
                  <span style={{ color: '#00d4ff' }}>{c.n}</span>
                  <span style={{ color: 'rgba(0,255,136,0.7)' }}>{c.an}</span>
                  <span style={{ color: 'rgba(255,170,0,0.7)' }}>{c.bn}</span>
                  <span style={{ color: 'rgba(255,68,204,0.7)' }}>{c.amp}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />Fourier-Approximation</div>
        {showOriginal && <div className="legend-item"><div className="legend-dot glow-magenta" />Originalsignal</div>}
        {tab === 'synthese' && <div className="legend-item"><div className="legend-dot glow-amber" />Einzelharmonische</div>}
        {tab === 'epizirkel' && <div className="legend-item"><div className="legend-dot glow-amber" />Verbindungslinie</div>}
      </div>

      <div className="explanation">
        <h2>Erläuterung</h2>
        {tab === 'analyse' && (
          <>
            <p>
              Die <strong>Fourier-Analyse</strong> zerlegt ein periodisches Signal in eine Summe von
              Sinus- und Kosinusfunktionen. Jede Frequenzkomponente hat eine <strong>Amplitude</strong> und
              eine <strong>Phase</strong>.
            </p>
            <p>
              Die Koeffizienten berechnen sich als:
              <M>{'a_n = \\frac{1}{\\pi} \\int_0^{2\\pi} f(t) \\cdot \\cos(nt)\\,dt'}</M> und
              <M>{'b_n = \\frac{1}{\\pi} \\int_0^{2\\pi} f(t) \\cdot \\sin(nt)\\,dt'}</M>.
            </p>
            <p>
              Mit steigender Zahl N der Harmonischen nähert sich die Rekonstruktion dem Originalsignal.
              An Unstetigkeitsstellen zeigt sich das <strong>Gibbssche Phänomen</strong> — eine Überschwingung
              von ca. 9%, die auch bei N → ∞ nicht verschwindet.
            </p>
          </>
        )}
        {tab === 'synthese' && (
          <>
            <p>
              Die <strong>Fourier-Synthese</strong> baut ein Signal aus seinen Frequenzkomponenten auf.
              Das Spektrum (oben) zeigt die Amplitude jeder Harmonischen. Die aktiven Terme
              werden aufsummiert zur Approximation (unten).
            </p>
            <p>
              Ein <strong>Rechtecksignal</strong> benötigt nur ungerade Harmonische (1, 3, 5, …) mit
              Amplituden proportional zu 1/n. Ein <strong>Sägezahnsignal</strong> nutzt alle Harmonischen
              mit Amplituden ~ 1/n.
            </p>
          </>
        )}
        {tab === 'epizirkel' && (
          <>
            <p>
              Der <strong>Fourier-Epizirkel</strong> visualisiert die Fourierreihe als rotierende Kreise.
              Jede Harmonische wird durch einen Kreis mit dem Radius = Amplitude und der
              Drehgeschwindigkeit = Frequenz dargestellt.
            </p>
            <p>
              Die Spitze des letzten Kreises zeichnet das approximierte Signal. Historisch geht diese
              Idee auf <strong>Ptolemäus</strong> zurück, der Planetenbahnen durch Epizyklen beschrieb —
              im Grunde eine frühe Fourier-Zerlegung!
            </p>
            <p>
              Je mehr Kreise (Harmonische) verwendet werden, desto genauer wird die Annäherung
              an das Originalsignal.
            </p>
          </>
        )}
      </div>
    </>
  );
};
