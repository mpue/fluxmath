import React, { useState, useCallback } from 'react';
import { MathCanvas } from '../../shared/MathCanvas';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { VRExercises } from './VRExercises';

type MapId = 'proj' | 'mirror' | 'stretch' | 'zero_col';

const maps: Record<MapId, {
  label: string;
  a: number; b: number; c: number; d: number;
  latex: string;
  kernelDesc: string;
  imageDesc: string;
  dimKer: number;
  dimIm: number;
}> = {
  proj: {
    label: 'Projektion',
    a: 1, b: 0, c: 0, d: 0,
    latex: String.raw`\begin{pmatrix} 1 & 0 \\ 0 & 0 \end{pmatrix}`,
    kernelDesc: 'y-Achse (Span{(0,1)})',
    imageDesc: 'x-Achse (Span{(1,0)})',
    dimKer: 1, dimIm: 1,
  },
  mirror: {
    label: 'Spiegelung',
    a: 1, b: 0, c: 0, d: -1,
    latex: String.raw`\begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}`,
    kernelDesc: '{0} (nur Nullvektor)',
    imageDesc: 'Ganz R^2',
    dimKer: 0, dimIm: 2,
  },
  stretch: {
    label: 'Streckung',
    a: 2, b: 1, c: 0, d: 2,
    latex: String.raw`\begin{pmatrix} 2 & 1 \\ 0 & 2 \end{pmatrix}`,
    kernelDesc: '{0} (invertierbar)',
    imageDesc: 'Ganz R^2',
    dimKer: 0, dimIm: 2,
  },
  zero_col: {
    label: 'Rang 1',
    a: 1, b: 2, c: 1, d: 2,
    latex: String.raw`\begin{pmatrix} 1 & 2 \\ 1 & 2 \end{pmatrix}`,
    kernelDesc: 'Span{(-2,1)} (Gerade)',
    imageDesc: 'Span{(1,1)} (Gerade)',
    dimKer: 1, dimIm: 1,
  },
};

export const Vektorraeume: React.FC = () => {
  const [mapId, setMapId] = useState<MapId>('proj');

  const map = maps[mapId];
  const { a, b, c, d, dimKer, dimIm } = map;

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

    // Show transformation of grid points
    const gridN = 8;
    for (let i = -gridN; i <= gridN; i++) {
      for (let j = -gridN; j <= gridN; j++) {
        const x = i * 0.5;
        const y = j * 0.5;
        const tx = a * x + b * y;
        const ty = c * x + d * y;
        // Line from original to transformed
        ctx.strokeStyle = 'rgba(0,212,255,0.05)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(toX(x), toY(y));
        ctx.lineTo(toX(tx), toY(ty));
        ctx.stroke();
        // Transformed point
        ctx.fillStyle = 'rgba(0,212,255,0.2)';
        ctx.beginPath();
        ctx.arc(toX(tx), toY(ty), 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Kernel visualization  
    if (dimKer > 0) {
      // Find kernel direction: (A)v = 0
      // For 2x2: if det=0, kernel is non-trivial
      let kx = 0, ky = 0;
      if (Math.abs(a) > 1e-10 || Math.abs(c) > 1e-10) {
        kx = -b; ky = a; // from first row: ax + by = 0 => direction (-b, a)
        // verify with second row too
        if (Math.abs(c * kx + d * ky) > 0.1) {
          kx = d; ky = -c; // from second row
        }
      } else {
        kx = 1; ky = 0;
      }
      const kLen = Math.sqrt(kx * kx + ky * ky);
      if (kLen > 1e-10) {
        kx /= kLen; ky /= kLen;
        ctx.strokeStyle = C.zero;
        ctx.shadowColor = C.zeroGlow;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(toX(-kx * 4), toY(-ky * 4));
        ctx.lineTo(toX(kx * 4), toY(ky * 4));
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = C.zero;
        ctx.font = '11px "Share Tech Mono"';
        ctx.textAlign = 'left';
        ctx.fillText('Kern', toX(kx * 2.5) + 6, toY(ky * 2.5) - 4);
      }
    }

    // Image visualization
    if (dimIm === 1) {
      // Image is span of a column
      const ix = a, iy = c; // first column
      const iLen = Math.sqrt(ix * ix + iy * iy);
      if (iLen > 1e-10) {
        const nx = ix / iLen, ny = iy / iLen;
        ctx.strokeStyle = C.orange;
        ctx.shadowColor = C.orangeGlow;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(toX(-nx * 4), toY(-ny * 4));
        ctx.lineTo(toX(nx * 4), toY(ny * 4));
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = C.orange;
        ctx.font = '11px "Share Tech Mono"';
        ctx.textAlign = 'left';
        ctx.fillText('Bild', toX(nx * 2.5) + 6, toY(ny * 2.5) + 12);
      }
    }

    // Interactive: show where mouse point maps to
    if (mx >= 0) {
      const xm = (mx - cx) / scale;
      const ym = -(my - cy) / scale;
      const tx = a * xm + b * ym;
      const ty = c * xm + d * ym;

      // Original point
      ctx.fillStyle = C.yint;
      ctx.shadowColor = C.yintGlow;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(toX(xm), toY(ym), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Transformed point
      ctx.fillStyle = C.orange;
      ctx.shadowColor = C.orangeGlow;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(toX(tx), toY(ty), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Arrow from original to transformed
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(toX(xm), toY(ym));
      ctx.lineTo(toX(tx), toY(ty));
      ctx.stroke();
      ctx.setLineDash([]);

      return `v=(${fmt(xm)},${fmt(ym)})  Av=(${fmt(tx)},${fmt(ty)})`;
    }

    // Origin
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();

    return '';
  }, [a, b, c, d, dimKer, dimIm]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Vektorraeume &amp; <em>Lineare Abbildungen</em></h1>
      <p className="subtitle">Kern, Bild, Basis &amp; Dimensionsformel</p>

      <MathCanvas draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Abbildung</span></div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {(Object.keys(maps) as MapId[]).map(id => (
              <button key={id} onClick={() => setMapId(id)} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '11px',
                background: id === mapId ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: id === mapId ? '#00d4ff' : '#2a5a70',
              }}>
                {maps[id].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Matrix</div>
          <div className="value"><M>{map.latex}</M></div>
        </div>
        <div className="info-card slope">
          <div className="label">Kern</div>
          <div className="value">{map.kernelDesc}</div>
          <div className="detail">dim(Ker) = {dimKer}</div>
        </div>
        <div className="info-card zero">
          <div className="label">Bild</div>
          <div className="value">{map.imageDesc}</div>
          <div className="detail">dim(Im) = {dimIm}</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-red" />Kern (Nullraum)</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Bild (Image)</div>
        <div className="legend-item"><div className="legend-dot glow-lime" />Ausgangsvektor v</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Bildvektor Av</div>
      </div>

      <div className="explanation">
        <h2>Erlaeuterung</h2>
        <p>
          Ein <strong>Vektorraum</strong> V ist eine Menge mit Addition und Skalarmultiplikation.
          Eine <strong>Basis</strong> ist eine maximal linear unabhaengige, erzeugende Teilmenge —
          ihre Elementanzahl ist die <strong>Dimension</strong>.
        </p>
        <p>
          Eine <strong>lineare Abbildung</strong> <M>{String.raw`f: V \to W`}</M> erfuellt{' '}
          <M>{String.raw`f(\alpha v + \beta w) = \alpha f(v) + \beta f(w)`}</M>.
          Mit einer Basis laesst sie sich als Matrix schreiben.
        </p>
        <p>
          Der <strong>Kern</strong> <M>{String.raw`\text{Ker}(f) = \{v : f(v) = 0\}`}</M> enthaelt alle Vektoren,
          die auf Null abgebildet werden. Das <strong>Bild</strong>{' '}
          <M>{String.raw`\text{Im}(f) = \{f(v) : v \in V\}`}</M> enthaelt alle erreichbaren Vektoren.
        </p>
        <p>
          Die <strong>Dimensionsformel</strong>:{' '}
          <M>{String.raw`\dim(\text{Ker}(f)) + \dim(\text{Im}(f)) = \dim(V)`}</M>.
          Hier: dim(Ker) = {dimKer}, dim(Im) = {dimIm}, Summe = {dimKer + dimIm} = dim(R^2).
        </p>
      </div>
      <VRExercises />
    </>
  );
};
