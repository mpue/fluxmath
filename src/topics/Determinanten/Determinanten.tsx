import React, { useState, useCallback } from 'react';
import { MathCanvas } from '../../shared/MathCanvas';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { DetExercises } from './DetExercises';

export const Determinanten: React.FC = () => {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(0);
  const [d, setD] = useState(2);

  const det = a * d - b * c;

  const draw = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, mx: number, my: number) => {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) / 8;

    function toX(x: number) { return cx + x * scale; }
    function toY(y: number) { return cy - y * scale; }

    // Grid
    ctx.strokeStyle = 'rgba(0,212,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(toX(i), 0); ctx.lineTo(toX(i), h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, toY(i)); ctx.lineTo(w, toY(i)); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(0,212,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();

    // Parallelogram formed by columns
    ctx.fillStyle = det >= 0 ? 'rgba(0,212,255,0.1)' : 'rgba(255,34,68,0.1)';
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(0));
    ctx.lineTo(toX(a), toY(c));
    ctx.lineTo(toX(a + b), toY(c + d));
    ctx.lineTo(toX(b), toY(d));
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = det >= 0 ? C.line : C.zero;
    ctx.lineWidth = 2;
    ctx.shadowColor = det >= 0 ? C.lineGlow : C.zeroGlow;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(0));
    ctx.lineTo(toX(a), toY(c));
    ctx.lineTo(toX(a + b), toY(c + d));
    ctx.lineTo(toX(b), toY(d));
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Column vectors (arrows)
    const drawArrow = (x: number, y: number, color: string, glow: string, label: string) => {
      ctx.strokeStyle = color;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 6;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(0));
      ctx.lineTo(toX(x), toY(y));
      ctx.stroke();
      // Arrowhead
      const angle = Math.atan2(-y * scale, x * scale);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(toX(x), toY(y));
      ctx.lineTo(toX(x) - 10 * Math.cos(angle - 0.4), toY(y) + 10 * Math.sin(angle - 0.4));
      ctx.lineTo(toX(x) - 10 * Math.cos(angle + 0.4), toY(y) + 10 * Math.sin(angle + 0.4));
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = '12px "Share Tech Mono"';
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.fillText(label, toX(x) + 6, toY(y) - 6);
    };

    drawArrow(a, c, C.orange, C.orangeGlow, `(${a},${c})`);
    drawArrow(b, d, C.magenta, C.magentaGlow, `(${b},${d})`);

    // Origin
    ctx.fillStyle = C.yint;
    ctx.shadowColor = C.yintGlow;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(toX(0), toY(0), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Det value display
    ctx.fillStyle = '#fff';
    ctx.font = '14px "Share Tech Mono"';
    ctx.textAlign = 'left';
    ctx.fillText(`det = ${fmt(det, 2)}`, 12, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px "Share Tech Mono"';
    ctx.fillText(`Flaeche = |det| = ${fmt(Math.abs(det), 2)}`, 12, 36);

    if (mx >= 0) {
      const xm = (mx - cx) / scale;
      const ym = -(my - cy) / scale;
      return `(${fmt(xm)}, ${fmt(ym)})`;
    }
    return '';
  }, [a, b, c, d, det]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Determi<em>nanten</em></h1>
      <p className="subtitle">Berechnung, geometrische Deutung &amp; Eigenschaften</p>

      <MathCanvas draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">a (Spalte 1, x)</span>
            <span className="ctrl-value amber">{a}</span>
          </div>
          <input type="range" min={-3} max={3} step={0.1} value={a} onChange={e => setA(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">b (Spalte 2, x)</span>
            <span className="ctrl-value amber">{b}</span>
          </div>
          <input type="range" min={-3} max={3} step={0.1} value={b} onChange={e => setB(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">c (Spalte 1, y)</span>
            <span className="ctrl-value amber">{c}</span>
          </div>
          <input type="range" min={-3} max={3} step={0.1} value={c} onChange={e => setC(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">d (Spalte 2, y)</span>
            <span className="ctrl-value amber">{d}</span>
          </div>
          <input type="range" min={-3} max={3} step={0.1} value={d} onChange={e => setD(Number(e.target.value))} />
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Matrix</div>
          <div className="value"><M>{String.raw`A = \begin{pmatrix} ${fmt(a)} & ${fmt(b)} \\ ${fmt(c)} & ${fmt(d)} \end{pmatrix}`}</M></div>
        </div>
        <div className="info-card slope">
          <div className="label">Determinante</div>
          <div className="value"><M>{String.raw`\det(A) = ad - bc = ${fmt(det, 2)}`}</M></div>
        </div>
        <div className="info-card zero">
          <div className="label">Flaeche</div>
          <div className="value">{fmt(Math.abs(det), 2)} FE</div>
          <div className="detail">{det > 0 ? 'Pos. Orientierung' : det < 0 ? 'Neg. Orientierung' : 'Singulaer!'}</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-amber" />1. Spaltenvektor (a, c)</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#ff22aa' }} />2. Spaltenvektor (b, d)</div>
        <div className="legend-item"><div className="legend-dot glow-cyan" />Parallelogramm</div>
      </div>

      <div className="explanation">
        <h2>Erlaeuterung</h2>
        <p>
          Die <strong>Determinante</strong> einer 2x2-Matrix ist <M>{String.raw`\det \begin{pmatrix} a & b \\ c & d \end{pmatrix} = ad - bc`}</M>.
        </p>
        <p>
          <strong>Geometrisch</strong> gibt <M>{String.raw`|\det(A)|`}</M> den Flaecheninhalt des Parallelogramms an,
          das von den Spaltenvektoren aufgespannt wird. Das Vorzeichen zeigt die Orientierung.
        </p>
        <p>
          <strong>Singularitaet:</strong> <M>{String.raw`\det(A) = 0`}</M> bedeutet, dass die Spaltenvektoren
          linear abhaengig sind — die Matrix ist nicht invertierbar.
        </p>
        <p>
          Fuer 3x3 verwende die <strong>Regel von Sarrus</strong> oder die <strong>Laplace-Entwicklung</strong>:{' '}
          <M>{String.raw`\det(A) = \sum_j (-1)^{i+j} a_{ij} \det(A_{ij})`}</M>.
        </p>
      </div>
      <DetExercises />
    </>
  );
};
