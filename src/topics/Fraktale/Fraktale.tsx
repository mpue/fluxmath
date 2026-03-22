import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Math as M } from '../../shared/Math';
import { FraktaleExercises } from './FraktaleExercises';

/* ── Helpers ─────────────────────────────────────────── */
const PALETTES = {
  cyber: (t: number): [number, number, number] => {
    const r = Math.floor(9 * (1 - t) * t * t * t * 255);
    const g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
    const b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);
    return [Math.min(255, r), Math.min(255, g + 40), Math.min(255, b + 80)];
  },
};

/* ── Tab: Iteration visualizer ───────────────────────── */
const IterationVis: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cRe, setCRe] = useState(-0.5);
  const [cIm, setCIm] = useState(0.6);
  const [z0Re, setZ0Re] = useState(0);
  const [z0Im, setZ0Im] = useState(0);
  const [maxIter, setMaxIter] = useState(20);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    const w = cvs.width, h = cvs.height;
    const scale = Math.min(w, h) / 5; // 1 math unit = scale px
    const ox = w / 2, oy = h / 2;

    ctx.fillStyle = '#010a0e';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(0,212,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let v = -3; v <= 3; v++) {
      ctx.beginPath(); ctx.moveTo(ox + v * scale, 0); ctx.lineTo(ox + v * scale, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, oy + v * scale); ctx.lineTo(w, oy + v * scale); ctx.stroke();
    }
    // Axes
    ctx.strokeStyle = 'rgba(0,212,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();

    // Escape circle
    ctx.strokeStyle = 'rgba(255,68,102,0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(ox, oy, 2 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(255,68,102,0.4)';
    ctx.textAlign = 'left';
    ctx.fillText('|z| = 2', ox + 2 * scale + 4, oy - 4);

    // Iterate z → z² + c
    const points: { x: number; y: number }[] = [];
    let zr = z0Re, zi = z0Im;
    for (let i = 0; i <= maxIter; i++) {
      points.push({ x: zr, y: zi });
      if (zr * zr + zi * zi > 100) break;
      const nr = zr * zr - zi * zi + cRe;
      zi = 2 * zr * zi + cIm;
      zr = nr;
    }

    // Draw path
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const px = ox + points[i].x * scale;
      const py = oy - points[i].y * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(0,212,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw points
    for (let i = 0; i < points.length; i++) {
      const px = ox + points[i].x * scale;
      const py = oy - points[i].y * scale;
      const t = i / Math.max(1, points.length - 1);
      const r = 3 + (1 - t) * 3;

      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      if (i === 0) {
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = 'rgba(0,255,136,0.6)'; ctx.shadowBlur = 10;
      } else {
        const alpha = 0.3 + 0.7 * (1 - t);
        ctx.fillStyle = `rgba(0,212,255,${alpha})`;
        ctx.shadowColor = 'rgba(0,212,255,0.3)'; ctx.shadowBlur = 6;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label first few
      if (i < 6 || i === points.length - 1) {
        ctx.font = '9px "Share Tech Mono", monospace';
        ctx.fillStyle = 'rgba(0,212,255,0.6)';
        ctx.textAlign = 'left';
        ctx.fillText(`z${subscript(i)}`, px + r + 3, py - 2);
      }
    }

    // c marker
    const cpx = ox + cRe * scale, cpy = oy - cIm * scale;
    ctx.beginPath(); ctx.arc(cpx, cpy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ff8800';
    ctx.shadowColor = 'rgba(255,136,0,0.6)'; ctx.shadowBlur = 12;
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.font = '11px "Orbitron", monospace';
    ctx.fillStyle = '#ff8800';
    ctx.textAlign = 'left';
    ctx.fillText('c', cpx + 8, cpy - 4);

    // HUD
    ctx.fillStyle = 'rgba(0,10,20,0.7)';
    ctx.fillRect(0, h - 22, w, 22);
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillStyle = '#00d4ff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const escaped = points.length <= maxIter;
    const status = escaped ? `Escape nach ${points.length - 1} Schritten` : `Gebunden nach ${maxIter} Iterationen`;
    ctx.fillText(`c = ${cRe.toFixed(2)} + ${cIm.toFixed(2)}i   z₀ = ${z0Re.toFixed(1)} + ${z0Im.toFixed(1)}i   ${status}`, 8, h - 10);
  }, [cRe, cIm, z0Re, z0Im, maxIter]);

  return (
    <>
      <div className="canvas-wrap">
        <canvas ref={canvasRef} width={700} height={500}
          style={{ width: '100%', height: 'auto', borderRadius: 4, border: '1px solid rgba(0,212,255,0.1)' }} />
      </div>
      <div className="controls" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Re(c)</span><span className="ctrl-value cyan">{cRe.toFixed(2)}</span></div>
          <input type="range" min={-2} max={1} step={0.01} value={cRe} onChange={e => setCRe(+e.target.value)} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Im(c)</span><span className="ctrl-value cyan">{cIm.toFixed(2)}</span></div>
          <input type="range" min={-1.5} max={1.5} step={0.01} value={cIm} onChange={e => setCIm(+e.target.value)} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Re(z₀)</span><span className="ctrl-value" style={{ color: '#00ff88' }}>{z0Re.toFixed(1)}</span></div>
          <input type="range" min={-2} max={2} step={0.1} value={z0Re} onChange={e => setZ0Re(+e.target.value)} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Im(z₀)</span><span className="ctrl-value" style={{ color: '#00ff88' }}>{z0Im.toFixed(1)}</span></div>
          <input type="range" min={-2} max={2} step={0.1} value={z0Im} onChange={e => setZ0Im(+e.target.value)} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Max Iter</span><span className="ctrl-value">{maxIter}</span></div>
          <input type="range" min={3} max={80} step={1} value={maxIter} onChange={e => setMaxIter(+e.target.value)} />
        </div>
      </div>
    </>
  );
};

/* ── Tab: Mandelbrot mini-renderer ───────────────────── */
const MandelbrotVis: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [iter, setIter] = useState(80);
  const viewRef = useRef({ cx: -0.5, cy: 0, zoom: 1 });
  const dragRef = useRef({ dragging: false, sx: 0, sy: 0, scx: 0, scy: 0 });
  const [hoverInfo, setHoverInfo] = useState('');
  const [, forceRender] = useState(0);

  const render = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    const w = cvs.width, h = cvs.height;
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    const { cx, cy, zoom } = viewRef.current;
    const aspect = w / h;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const x0 = cx + (px / w - 0.5) * (3 / zoom) * aspect;
        const y0 = cy + (py / h - 0.5) * (3 / zoom);
        let x = 0, y = 0, i = 0;
        while (x * x + y * y <= 4 && i < iter) {
          const xt = x * x - y * y + x0;
          y = 2 * x * y + y0;
          x = xt;
          i++;
        }
        const idx = (py * w + px) * 4;
        if (i === iter) { data[idx] = 0; data[idx + 1] = 0; data[idx + 2] = 0; }
        else {
          const log_zn = Math.log(x * x + y * y) / 2;
          const nu = Math.log(log_zn / Math.LN2) / Math.LN2;
          const smooth = (i + 1 - nu) / iter;
          const [r, g, b] = PALETTES.cyber(Math.max(0, Math.min(1, smooth * 4)));
          data[idx] = r; data[idx + 1] = g; data[idx + 2] = b;
        }
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Region labels
    ctx.fillStyle = 'rgba(0,10,20,0.6)';
    ctx.fillRect(0, 0, w, 22);
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillStyle = '#00d4ff';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Zoom: ${zoom.toFixed(1)}x   Iter: ${iter}   Mitte: (${cx.toFixed(4)}, ${cy.toFixed(4)})`, 8, 11);
  }, [iter]);

  useEffect(() => { render(); }, [render]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const rect = () => cvs.getBoundingClientRect();

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = rect();
      const mx = (e.clientX - r.left) / r.width;
      const my = (e.clientY - r.top) / r.height;
      const v = viewRef.current;
      const aspect = cvs.width / cvs.height;
      const factor = e.deltaY < 0 ? 1.3 : 1 / 1.3;
      const wx = v.cx + (mx - 0.5) * (3 / v.zoom) * aspect;
      const wy = v.cy + (my - 0.5) * (3 / v.zoom);
      v.zoom *= factor;
      v.cx = wx - (mx - 0.5) * (3 / v.zoom) * aspect;
      v.cy = wy - (my - 0.5) * (3 / v.zoom);
      forceRender(n => n + 1);
      render();
    };
    const onDown = (e: MouseEvent) => {
      dragRef.current = { dragging: true, sx: e.clientX, sy: e.clientY, scx: viewRef.current.cx, scy: viewRef.current.cy };
    };
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d.dragging) {
        // hover info
        const r = rect();
        const mx = (e.clientX - r.left) / r.width;
        const my = (e.clientY - r.top) / r.height;
        const v = viewRef.current;
        const aspect = cvs.width / cvs.height;
        const re = v.cx + (mx - 0.5) * (3 / v.zoom) * aspect;
        const im = v.cy + (my - 0.5) * (3 / v.zoom);
        setHoverInfo(`c = ${re.toFixed(4)} + ${im.toFixed(4)}i`);
        return;
      }
      const r = rect();
      const v = viewRef.current;
      const aspect = cvs.width / cvs.height;
      const dx = (e.clientX - d.sx) / r.width * (3 / v.zoom) * aspect;
      const dy = (e.clientY - d.sy) / r.height * (3 / v.zoom);
      v.cx = d.scx - dx;
      v.cy = d.scy - dy;
      forceRender(n => n + 1);
      render();
    };
    const onUp = () => { dragRef.current.dragging = false; };
    const onDbl = () => { viewRef.current = { cx: -0.5, cy: 0, zoom: 1 }; forceRender(n => n + 1); render(); };

    cvs.addEventListener('wheel', onWheel, { passive: false });
    cvs.addEventListener('mousedown', onDown);
    cvs.addEventListener('mousemove', onMove);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    cvs.addEventListener('dblclick', onDbl);
    return () => {
      cvs.removeEventListener('wheel', onWheel);
      cvs.removeEventListener('mousedown', onDown);
      cvs.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      cvs.removeEventListener('dblclick', onDbl);
    };
  }, [render]);

  return (
    <>
      <div className="canvas-wrap" style={{ position: 'relative', cursor: 'grab' }}>
        <canvas ref={canvasRef} width={800} height={500}
          style={{ width: '100%', height: 'auto', borderRadius: 4, border: '1px solid rgba(0,212,255,0.1)' }} />
      </div>
      {hoverInfo && <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{hoverInfo}</div>}
      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Iterationen</span><span className="ctrl-value">{iter}</span></div>
          <input type="range" min={10} max={300} step={5} value={iter} onChange={e => { setIter(+e.target.value); }} />
        </div>
      </div>
    </>
  );
};

/* ── subscript digits ────────────────────────────────── */
function subscript(n: number): string {
  const chars = '₀₁₂₃₄₅₆₇₈₉';
  return String(n).split('').map(d => chars[+d] || d).join('');
}

/* ── Main component ──────────────────────────────────── */
type Tab = 'iteration' | 'mandelbrot' | 'theorie';

export const Fraktale: React.FC = () => {
  const [tab, setTab] = useState<Tab>('iteration');

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Fraktale<em>Geometrie</em></h1>
      <p className="subtitle">Selbstähnlichkeit, Mandelbrot-Menge & Iteration in der komplexen Ebene</p>

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Ansicht</span></div>
          <div style={{ display: 'flex', gap: 1 }}>
            {([
              ['iteration', 'Iteration z → z² + c'],
              ['mandelbrot', 'Mandelbrot-Menge'],
              ['theorie', 'Theorie'],
            ] as [Tab, string][]).map(([id, label]) => (
              <button key={id} className={`tab-btn ${tab === id ? 'active' : ''}`}
                onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'iteration' && <IterationVis />}
      {tab === 'mandelbrot' && <MandelbrotVis />}

      {tab === 'theorie' && (
        <div className="explanation">
          <h2>Was sind Fraktale?</h2>
          <p>
            Fraktale sind geometrische Strukturen, die bei jeder Vergrößerungsstufe ähnliche Muster zeigen —
            sogenannte <strong>Selbstähnlichkeit</strong>. Der Begriff wurde 1975 von <strong>Benoît Mandelbrot</strong>
            geprägt (von lat. <em>fractus</em> = gebrochen).
          </p>

          <h2>Die Iterationsformel</h2>
          <p>
            Im Zentrum steht die einfache Rekursion in der komplexen Ebene:
          </p>
          <M display>{'z_{n+1} = z_n^2 + c'}</M>
          <p>
            Dabei ist <M>{'c \\in \\mathbb{C}'}</M> ein fester Parameter und <M>{'z_0'}</M> der Startwert.
            Die entscheidende Frage: <strong>Divergiert die Folge</strong> <M>{'(z_n)'}</M> oder bleibt sie beschränkt?
          </p>

          <h2>Die Mandelbrot-Menge</h2>
          <p>
            Die <strong>Mandelbrot-Menge</strong> <M>{'\\mathcal{M}'}</M> ist die Menge aller <M>{'c \\in \\mathbb{C}'}</M>,
            für die die Folge mit <M>{'z_0 = 0'}</M> <strong>nicht divergiert</strong>:
          </p>
          <M display>{'\\mathcal{M} = \\{ c \\in \\mathbb{C} \\mid \\sup_{n} |z_n| < \\infty,\\ z_0 = 0,\\ z_{n+1} = z_n^2 + c \\}'}</M>
          <p>
            Es lässt sich zeigen: Sobald <M>{'|z_n| > 2'}</M>, divergiert die Folge garantiert (Escape-Radius).
            Die Farbe jedes Punktes kodiert, <strong>wie schnell</strong> er divergiert.
          </p>

          <h2>Julia-Mengen</h2>
          <p>
            Fixiert man <M>{'c'}</M> und variiert stattdessen den Startwert <M>{'z_0'}</M>, erhält man eine
            <strong> Julia-Menge</strong> <M>{'J_c'}</M>. Jeder Punkt <M>{'c'}</M> in der komplexen Ebene
            erzeugt eine einzigartige Julia-Menge:
          </p>
          <M display>{'J_c = \\{ z_0 \\in \\mathbb{C} \\mid \\sup_{n} |z_n| < \\infty \\}'}</M>
          <p>
            <strong>Zusammenhang:</strong> Liegt <M>{'c'}</M> innerhalb der Mandelbrot-Menge, ist die zugehörige
            Julia-Menge zusammenhängend. Liegt <M>{'c'}</M> außerhalb, zerfällt sie in eine
            <strong> Cantor-Menge</strong> (total unzusammenhängende Staubwolke).
          </p>

          <h2>Fraktale Dimension</h2>
          <p>
            Fraktale haben eine <strong>nicht-ganzzahlige Dimension</strong>. Die Mandelbrot-Menge hat die
            Hausdorff-Dimension <M>{'D_H = 2'}</M>, aber ihr <strong>Rand</strong> hat:
          </p>
          <M display>{'\dim_H(\partial \mathcal{M}) = 2'}</M>
          <p>
            Das heißt, der Rand ist so komplex, dass er „flächenfüllend" ist — obwohl er eine Kurve ist!
            Andere Fraktale wie die <strong>Koch-Kurve</strong> haben Dimension <M>{'\\frac{\\ln 4}{\\ln 3} \\approx 1.2619'}</M>,
            also mehr als eine Linie, aber weniger als eine Fläche.
          </p>

          <h2>Berühmte Fraktale</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Share Tech Mono", monospace', fontSize: 12, color: 'var(--text)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.15)' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: '#00d4ff' }}>Fraktal</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: '#00d4ff' }}>Dimension</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: '#00d4ff' }}>Konstruktion</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Cantor-Menge', 'ln2/ln3 ≈ 0.631', 'Mittleres Drittel entfernen'],
                ['Koch-Kurve', 'ln4/ln3 ≈ 1.262', 'Seite durch Dreieck ersetzen'],
                ['Sierpinski-Dreieck', 'ln3/ln2 ≈ 1.585', 'Mittleres Dreieck entfernen'],
                ['Mandelbrot-Rand', '2', 'z → z² + c Iteration'],
                ['Menger-Schwamm', 'ln20/ln3 ≈ 2.727', '3D-Sierpinski'],
              ].map(([name, dim, desc], i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
                  <td style={{ padding: '5px 8px' }}>{name}</td>
                  <td style={{ padding: '5px 8px', color: '#00ff88' }}>{dim}</td>
                  <td style={{ padding: '5px 8px', color: 'var(--muted)' }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Anwendungen</h2>
          <p>
            Fraktale sind nicht nur mathematisch faszinierend — sie modellieren reale Phänomene:
            <strong> Küstenlinien</strong>, <strong>Blutgefäße</strong>, <strong>Baumstrukturen</strong>,
            <strong> Blitze</strong>, <strong>Gebirge</strong> und <strong>Wolken</strong>. In der Informatik
            dienen sie zur <strong>Datenkompression</strong> (fraktale Bildkompression) und
            <strong> Antennenkonstruktion</strong> (fraktale Antennen).
          </p>
        </div>
      )}

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Iteration</div>
          <div className="value" style={{ fontSize: 14 }}>z<sub>n+1</sub> = z<sub>n</sub>² + c</div>
          <div className="detail">Die zentrale Rekursionsformel</div>
        </div>
        <div className="info-card slope">
          <div className="label">Escape-Radius</div>
          <div className="value">|z| {'>'} 2 → ∞</div>
          <div className="detail">Divergenz-Kriterium</div>
        </div>
        <div className="info-card zero">
          <div className="label">Mandelbrot</div>
          <div className="value" style={{ fontSize: 13 }}>z₀ = 0, c variiert</div>
          <div className="detail">Schwarze Punkte = gebunden</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-lime" />Startwert z₀</div>
        <div className="legend-item"><div className="legend-dot glow-cyan" />Iterationspfad</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Parameter c</div>
        <div className="legend-item"><div className="legend-dot glow-red" />Escape-Radius</div>
      </div>

      <div className="explanation">
        <h2>Bedienung</h2>
        <p>
          <strong>Iteration:</strong> Verändere <M>{'c'}</M> und <M>{'z_0'}</M> mit den Reglern und beobachte, wie die
          Folge konvergiert oder divergiert. Die Punkte zeigen die einzelnen Iterationsschritte.
        </p>
        <p>
          <strong>Mandelbrot:</strong> Scrolle zum Zoomen (zum Mauszeiger), ziehe zum Verschieben, Doppelklick für Reset.
          Erhöhe die Iterationen für feinere Details bei hoher Vergrößerung.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: 12 }}>
          Tipp: Nutze den <strong>Fraktale-Explorer</strong> in den Tools für erweiterte Optionen mit Julia-Mengen und mehr Farbpaletten!
        </p>
      </div>

      <FraktaleExercises />
    </>
  );
};
