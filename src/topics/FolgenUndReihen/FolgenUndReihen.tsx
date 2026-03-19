import React, { useState, useCallback } from 'react';
import { MathCanvas } from '../../shared/MathCanvas';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { SequenceExercises } from './SequenceExercises';

type SeqType = 'arithmetic' | 'geometric' | 'harmonic' | 'fibonacci';

function seqValue(type: SeqType, n: number, a1: number, d: number, r: number): number {
  switch (type) {
    case 'arithmetic': return a1 + (n - 1) * d;
    case 'geometric': return a1 * Math.pow(r, n - 1);
    case 'harmonic': return 1 / n;
    case 'fibonacci': {
      let a = 0, b = 1;
      for (let i = 2; i <= n; i++) { const t = a + b; a = b; b = t; }
      return n <= 1 ? (n === 0 ? 0 : 1) : b;
    }
  }
}

function partialSum(type: SeqType, N: number, a1: number, d: number, r: number): number {
  let s = 0;
  for (let i = 1; i <= N; i++) s += seqValue(type, i, a1, d, r);
  return s;
}

export const FolgenUndReihen: React.FC = () => {
  const [seqType, setSeqType] = useState<SeqType>('arithmetic');
  const [sliderA1, setSliderA1] = useState(10);
  const [sliderD, setSliderD] = useState(5);
  const [sliderR, setSliderR] = useState(15);
  const [sliderN, setSliderN] = useState(15);

  const a1 = sliderA1 / 10;
  const d = sliderD / 10;
  const r = sliderR / 10;
  const N = sliderN;

  const draw = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, mx: number, my: number): string => {
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

    // Compute values
    const vals: number[] = [];
    for (let i = 1; i <= N; i++) vals.push(seqValue(seqType, i, a1, d, r));

    const partials: number[] = [];
    let cumSum = 0;
    for (const v of vals) { cumSum += v; partials.push(cumSum); }

    const allVals = [...vals, ...partials];
    let minV = Math.min(0, ...allVals);
    let maxV = Math.max(1, ...allVals);
    const pad = (maxV - minV) * 0.1 || 1;
    minV -= pad; maxV += pad;

    const toX = (i: number) => margin.left + ((i - 0.5) / N) * plotW;
    const toY = (v: number) => margin.top + plotH - ((v - minV) / (maxV - minV)) * plotH;
    const barW = Math.max(2, plotW / N * 0.35);

    // Axes
    ctx.strokeStyle = '#1a3a4a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, h - margin.bottom);
    ctx.lineTo(w - margin.right, h - margin.bottom);
    ctx.stroke();

    // Zero line
    if (minV < 0 && maxV > 0) {
      const y0 = toY(0);
      ctx.strokeStyle = '#1a3a4a';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(margin.left, y0);
      ctx.lineTo(w - margin.right, y0);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Y-axis labels
    ctx.fillStyle = '#2a5a70';
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.textAlign = 'right';
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const v = minV + (maxV - minV) * (i / ySteps);
      const y = toY(v);
      ctx.fillText(fmt(v, 1), margin.left - 6, y + 3);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(N / 10));
    for (let i = 1; i <= N; i += step) {
      ctx.fillText(String(i), toX(i), h - margin.bottom + 15);
    }

    // Partial sums as filled area
    ctx.fillStyle = 'rgba(0,212,255,0.06)';
    ctx.beginPath();
    ctx.moveTo(toX(1), toY(0));
    for (let i = 0; i < partials.length; i++) {
      ctx.lineTo(toX(i + 1), toY(partials[i]));
    }
    ctx.lineTo(toX(partials.length), toY(0));
    ctx.closePath();
    ctx.fill();

    // Partial sum line
    ctx.strokeStyle = C.lime;
    ctx.lineWidth = 2;
    ctx.shadowColor = C.lime;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < partials.length; i++) {
      const px = toX(i + 1);
      const py = toY(partials[i]);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Sequence bars
    let hoveredIdx = -1;
    for (let i = 0; i < vals.length; i++) {
      const cx = toX(i + 1);
      const cy = toY(vals[i]);
      const y0 = toY(0);

      if (Math.abs(mx - cx) < barW) hoveredIdx = i;

      ctx.fillStyle = hoveredIdx === i ? '#00d4ff' : 'rgba(0,212,255,0.5)';
      ctx.shadowColor = C.cyan;
      ctx.shadowBlur = hoveredIdx === i ? 12 : 4;
      const barTop = Math.min(cy, y0);
      const barH = Math.abs(cy - y0);
      ctx.fillRect(cx - barW / 2, barTop, barW, barH);
      ctx.shadowBlur = 0;

      // Dot at top
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = C.cyan;
      ctx.fill();
    }

    // Hover label
    if (hoveredIdx >= 0) {
      return `n = ${hoveredIdx + 1}   aₙ = ${fmt(vals[hoveredIdx], 3)}   Sₙ = ${fmt(partials[hoveredIdx], 3)}`;
    }
    return '';
  }, [seqType, a1, d, r, N]);

  const sN = partialSum(seqType, N, a1, d, r);
  const aN = seqValue(seqType, N, a1, d, r);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Folgen und <em>Reihen</em></h1>
      <p className="subtitle">Arithmetische &amp; geometrische Folgen, Partialsummen &amp; Konvergenz</p>

      <MathCanvas draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Folgentyp</span>
          </div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {([
              ['arithmetic', 'Arithmetisch'],
              ['geometric', 'Geometrisch'],
              ['harmonic', 'Harmonisch'],
              ['fibonacci', 'Fibonacci'],
            ] as const).map(([id, label]) => (
              <button key={id} onClick={() => setSeqType(id)} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '10px',
                background: id === seqType ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: id === seqType ? '#00d4ff' : '#2a5a70',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="controls" style={{ gridTemplateColumns: seqType === 'harmonic' || seqType === 'fibonacci' ? '1fr' : '1fr 1fr 1fr' }}>
        {seqType !== 'harmonic' && seqType !== 'fibonacci' && (
          <div className="ctrl">
            <div className="ctrl-header">
              <span className="ctrl-label">Startwert a₁</span>
              <span className="ctrl-value cyan">{fmt(a1)}</span>
            </div>
            <input type="range" min={-30} max={30} step={1} value={sliderA1}
              onChange={e => setSliderA1(Number(e.target.value))} />
          </div>
        )}
        {seqType === 'arithmetic' && (
          <div className="ctrl">
            <div className="ctrl-header">
              <span className="ctrl-label">Differenz d</span>
              <span className="ctrl-value cyan">{fmt(d)}</span>
            </div>
            <input type="range" min={-20} max={20} step={1} value={sliderD}
              onChange={e => setSliderD(Number(e.target.value))} />
          </div>
        )}
        {seqType === 'geometric' && (
          <div className="ctrl">
            <div className="ctrl-header">
              <span className="ctrl-label">Quotient r</span>
              <span className="ctrl-value cyan">{fmt(r)}</span>
            </div>
            <input type="range" min={-20} max={20} step={1} value={sliderR}
              onChange={e => setSliderR(Number(e.target.value))} />
          </div>
        )}
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Anzahl Glieder N</span>
            <span className="ctrl-value amber">{N}</span>
          </div>
          <input type="range" min={2} max={40} step={1} value={sliderN}
            onChange={e => setSliderN(Number(e.target.value))} />
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">aₙ (letztes Glied)</div>
          <div className="value">{fmt(aN, 4)}</div>
          <div className="detail">n = {N}</div>
        </div>
        <div className="info-card slope">
          <div className="label">Partialsumme Sₙ</div>
          <div className="value">{fmt(sN, 4)}</div>
          <div className="detail">Σ der ersten {N} Glieder</div>
        </div>
        <div className="info-card zero">
          <div className="label">Konvergenz</div>
          <div className="value">
            {seqType === 'arithmetic' ? (d === 0 ? `→ ${fmt(a1)}` : 'divergent') :
             seqType === 'geometric' ? (Math.abs(r) < 1 ? `→ ${fmt(a1 / (1 - r), 3)}` : Math.abs(r) === 1 ? (r === 1 ? 'divergent' : 'alternierend') : 'divergent') :
             seqType === 'harmonic' ? 'aₙ → 0 (Reihe div.)' :
             'divergent'}
          </div>
          <div className="detail">
            {seqType === 'geometric' && Math.abs(r) < 1 ? `S∞ = a₁/(1-r) = ${fmt(a1 / (1 - r), 3)}` : 'Grenzwert der Reihe'}
          </div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />Folgenglieder aₙ</div>
        <div className="legend-item"><div className="legend-dot glow-lime" />Partialsumme Sₙ</div>
      </div>

      <div className="explanation">
        <h2>Erläuterung</h2>
        <p>
          Eine <strong>Folge</strong> ist eine geordnete Liste von Zahlen <M>{'(a_n)_{n \\geq 1}'}</M>.
          Eine <strong>Reihe</strong> ist die Summe der Folgenglieder: <M>{'S_N = \\sum_{n=1}^{N} a_n'}</M>.
        </p>
        <p>
          <strong>Arithmetische Folge</strong>: <M>{'a_n = a_1 + (n-1) \\cdot d'}</M> — konstante Differenz d.
          Die Partialsumme ist <M>{'S_N = \\frac{N}{2}(a_1 + a_N)'}</M>.
        </p>
        <p>
          <strong>Geometrische Folge</strong>: <M>{'a_n = a_1 \\cdot r^{n-1}'}</M> — konstanter Quotient r.
          Für <M>{'|r| < 1'}</M> konvergiert die Reihe: <M>{'S_\\infty = \\frac{a_1}{1 - r}'}</M>.
        </p>
        <p>
          Die <strong>harmonische Reihe</strong> <M>{'\\sum \\frac{1}{n}'}</M> divergiert, obwohl die Glieder gegen 0 gehen —
          ein berühmtes Beispiel dafür, dass aₙ → 0 nicht hinreichend für Konvergenz ist.
        </p>
      </div>
      <SequenceExercises />
    </>
  );
};
