import React, { useState, useCallback } from 'react';
import { MathCanvas } from '../../shared/MathCanvas';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { WahrscheinlichkeitExercises } from './WahrscheinlichkeitExercises';

/* ── Tree-diagram drawing ── */
interface TreeNode {
  label: string;
  p: number;
  children?: TreeNode[];
}

export const Wahrscheinlichkeit: React.FC = () => {
  const [pA, setPa] = useState(40);  // P(A) in %
  const [pBgivenA, setPBgA] = useState(60);  // P(B|A) in %
  const [pBgivenNotA, setPBgNA] = useState(20);  // P(B|not A) in %
  const [mode, setMode] = useState<'tree' | 'bayes' | 'total'>('tree');

  const pa = pA / 100;
  const pna = 1 - pa;
  const pba = pBgivenA / 100;
  const pnba = 1 - pba;
  const pbna = pBgivenNotA / 100;
  const pnbna = 1 - pbna;

  // Total probability P(B) = P(B|A)*P(A) + P(B|not A)*P(not A)
  const pB = pba * pa + pbna * pna;
  const pNotB = 1 - pB;

  // Bayes: P(A|B) = P(B|A)*P(A) / P(B)
  const pAgivenB = pB > 0.001 ? (pba * pa) / pB : 0;

  // Joint probabilities
  const pAB = pa * pba;
  const pANotB = pa * pnba;
  const pNotAB = pna * pbna;
  const pNotANotB = pna * pnbna;

  const draw = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, mx: number, my: number): string => {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    if (mode === 'tree') {
      // Draw probability tree
      const startX = 60;
      const midX = w * 0.4;
      const endX = w * 0.78;
      const cy = h / 2;
      const spread1 = h * 0.3;
      const spread2 = h * 0.12;

      // Root
      ctx.fillStyle = C.line;
      ctx.beginPath();
      ctx.arc(startX, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Level 1: A and not A
      const y1a = cy - spread1;
      const y1na = cy + spread1;

      const drawBranch = (x1: number, y1: number, x2: number, y2: number, prob: number, color: string, glow: string) => {
        ctx.strokeStyle = color;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 6;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Probability label
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2 - 10;
        ctx.font = '12px "Share Tech Mono", monospace';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText((prob * 100).toFixed(0) + '%', mx, my);
      };

      const drawNode = (x: number, y: number, label: string, color: string) => {
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.font = '13px "Orbitron", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + 10, y);
      };

      // A branch
      drawBranch(startX, cy, midX, y1a, pa, C.line, C.lineGlow);
      drawNode(midX, y1a, 'A', C.line);
      // not A branch
      drawBranch(startX, cy, midX, y1na, pna, C.zero, C.zeroGlow);
      drawNode(midX, y1na, '\u00ACA', C.zero);

      // Level 2 from A: B|A and not B|A
      drawBranch(midX, y1a, endX, y1a - spread2, pba, C.yint, C.yintGlow);
      drawNode(endX, y1a - spread2, 'B', C.yint);
      drawBranch(midX, y1a, endX, y1a + spread2, pnba, C.orange, C.orangeGlow);
      drawNode(endX, y1a + spread2, '\u00ACB', C.orange);

      // Level 2 from not A: B|not A and not B|not A
      drawBranch(midX, y1na, endX, y1na - spread2, pbna, C.yint, C.yintGlow);
      drawNode(endX, y1na - spread2, 'B', C.yint);
      drawBranch(midX, y1na, endX, y1na + spread2, pnbna, C.orange, C.orangeGlow);
      drawNode(endX, y1na + spread2, '\u00ACB', C.orange);

      // Joint probabilities at the end
      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,255,136,0.7)';
      ctx.fillText(`P(A\u2229B) = ${(pAB * 100).toFixed(1)}%`, endX + 40, y1a - spread2);
      ctx.fillStyle = 'rgba(255,136,0,0.7)';
      ctx.fillText(`P(A\u2229\u00ACB) = ${(pANotB * 100).toFixed(1)}%`, endX + 40, y1a + spread2);
      ctx.fillStyle = 'rgba(0,255,136,0.7)';
      ctx.fillText(`P(\u00ACA\u2229B) = ${(pNotAB * 100).toFixed(1)}%`, endX + 40, y1na - spread2);
      ctx.fillStyle = 'rgba(255,136,0,0.7)';
      ctx.fillText(`P(\u00ACA\u2229\u00ACB) = ${(pNotANotB * 100).toFixed(1)}%`, endX + 40, y1na + spread2);
    } else {
      // Bar visualization: P(B), P(A|B)
      const barW = w * 0.15;
      const maxH = h * 0.7;
      const baseY = h * 0.85;
      const gap = w * 0.06;
      const startX = w * 0.1;

      const bars = [
        { label: 'P(A)', value: pa, color: C.line, glow: C.lineGlow },
        { label: 'P(B)', value: pB, color: C.yint, glow: C.yintGlow },
        { label: mode === 'bayes' ? 'P(A|B)' : 'P(B|A)', value: mode === 'bayes' ? pAgivenB : pba, color: C.orange, glow: C.orangeGlow },
        { label: mode === 'bayes' ? 'P(\u00ACA|B)' : 'P(B|\u00ACA)', value: mode === 'bayes' ? (1 - pAgivenB) : pbna, color: C.magenta, glow: C.magentaGlow },
      ];

      bars.forEach((bar, i) => {
        const x = startX + i * (barW + gap);
        const barH = bar.value * maxH;

        ctx.fillStyle = bar.color.replace(')', ',0.15)').replace('rgb', 'rgba');
        ctx.shadowColor = bar.glow;
        ctx.shadowBlur = 8;
        ctx.fillRect(x, baseY - barH, barW, barH);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = bar.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, baseY - barH, barW, barH);

        ctx.font = '12px "Orbitron", monospace';
        ctx.fillStyle = bar.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(bar.label, x + barW / 2, baseY + 20);

        ctx.font = '13px "Share Tech Mono", monospace';
        ctx.textBaseline = 'bottom';
        ctx.fillText((bar.value * 100).toFixed(1) + '%', x + barW / 2, baseY - barH - 6);
      });
    }
    return '';
  }, [mode, pa, pna, pba, pnba, pbna, pnbna, pB, pAgivenB, pAB, pANotB, pNotAB, pNotANotB]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Wahrscheinlich<em>keit</em></h1>
      <p className="subtitle">Baumdiagramme, bedingte Wahrscheinlichkeit &amp; Satz von Bayes</p>

      <MathCanvas draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Darstellung</span></div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {([
              ['tree', 'Baumdiagramm'],
              ['total', 'Totale Wahrscheinlichkeit'],
              ['bayes', 'Satz von Bayes'],
            ] as const).map(([id, label]) => (
              <button key={id} onClick={() => setMode(id)} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '11px',
                background: id === mode ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: id === mode ? '#00d4ff' : '#2a5a70',
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
            <span className="ctrl-label">P(A)</span>
            <span className="ctrl-value cyan">{pA}%</span>
          </div>
          <input type="range" min={1} max={99} step={1} value={pA} onChange={e => setPa(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">P(B|A)</span>
            <span className="ctrl-value" style={{ color: '#00ff88' }}>{pBgivenA}%</span>
          </div>
          <input type="range" min={1} max={99} step={1} value={pBgivenA} onChange={e => setPBgA(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">P(B|\u00ACA)</span>
            <span className="ctrl-value amber">{pBgivenNotA}%</span>
          </div>
          <input type="range" min={1} max={99} step={1} value={pBgivenNotA} onChange={e => setPBgNA(Number(e.target.value))} />
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Totale Wahrscheinlichkeit</div>
          <div className="value">P(B) = {(pB * 100).toFixed(1)}%</div>
          <div className="detail">P(B|A)·P(A) + P(B|\u00ACA)·P(\u00ACA)</div>
        </div>
        <div className="info-card slope">
          <div className="label">Satz von Bayes</div>
          <div className="value">P(A|B) = {(pAgivenB * 100).toFixed(1)}%</div>
          <div className="detail">P(B|A)·P(A) / P(B)</div>
        </div>
        <div className="info-card zero">
          <div className="label">Gemeinsame W.</div>
          <div className="value">P(A\u2229B) = {(pAB * 100).toFixed(1)}%</div>
          <div className="detail">P(B|A) · P(A)</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />Ereignis A</div>
        <div className="legend-item"><div className="legend-dot glow-lime" />Ereignis B</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Bedingte W.</div>
      </div>

      <div className="explanation">
        <h2>Erlaeuterung</h2>
        <p>
          Die <strong>bedingte Wahrscheinlichkeit</strong> <M>{String.raw`P(B|A) = \frac{P(A \cap B)}{P(A)}`}</M> beschreibt
          die Wahrscheinlichkeit fuer B, wenn A bereits eingetreten ist.
        </p>
        <p>
          Im <strong>Baumdiagramm</strong> werden mehrstufige Zufallsexperimente dargestellt.
          Die <strong>Pfadregeln</strong> lauten: Multiplikationsregel (entlang eines Pfades multiplizieren)
          und Additionsregel (parallele Pfade addieren).
        </p>
        <p>
          Der <strong>Satz von der totalen Wahrscheinlichkeit</strong>:{' '}
          <M>{String.raw`P(B) = P(B|A) \cdot P(A) + P(B|\overline{A}) \cdot P(\overline{A})`}</M>
        </p>
        <p>
          Der <strong>Satz von Bayes</strong> erlaubt das "Umdrehen" bedingter Wahrscheinlichkeiten:{' '}
          <M>{String.raw`P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}`}</M>.
          Er ist z.B. in der medizinischen Diagnostik zentral: Wie wahrscheinlich ist eine Krankheit
          bei positivem Test?
        </p>
      </div>
      <WahrscheinlichkeitExercises />
    </>
  );
};
