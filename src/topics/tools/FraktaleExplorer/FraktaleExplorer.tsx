import React, { useRef, useEffect, useState, useCallback } from 'react';

/* ── colour palettes ─────────────────────────────────── */
const palettes: Record<string, (t: number) => [number, number, number]> = {
  Cyber: (t) => {
    const r = Math.floor(9 * (1 - t) * t * t * t * 255);
    const g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
    const b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);
    return [Math.min(255, r), Math.min(255, g + 40), Math.min(255, b + 80)];
  },
  Flamme: (t) => {
    const r = Math.min(255, Math.floor(t * 4 * 255));
    const g = Math.min(255, Math.floor(t * t * 2 * 255));
    const b = Math.floor(t * 60);
    return [r, g, b];
  },
  Neon: (t) => {
    const h = t * 360;
    const s = 1, l = 0.5;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return [Math.floor((r + m) * 255), Math.floor((g + m) * 255), Math.floor((b + m) * 255)];
  },
  Ozean: (t) => [
    Math.floor(t * 30),
    Math.floor(80 + t * 175),
    Math.floor(120 + t * 135),
  ],
  Mono: (t) => {
    const v = Math.floor(t * 255);
    return [v, v, v];
  },
};

/* ── fractal computation ─────────────────────────────── */
function computeMandelbrot(
  imgData: ImageData, w: number, h: number,
  cx: number, cy: number, zoom: number, maxIter: number,
  palette: (t: number) => [number, number, number],
) {
  const data = imgData.data;
  const aspect = w / h;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const x0 = cx + (px / w - 0.5) * (3 / zoom) * aspect;
      const y0 = cy + (py / h - 0.5) * (3 / zoom);
      let x = 0, y = 0, iter = 0;
      while (x * x + y * y <= 4 && iter < maxIter) {
        const xt = x * x - y * y + x0;
        y = 2 * x * y + y0;
        x = xt;
        iter++;
      }
      const idx = (py * w + px) * 4;
      if (iter === maxIter) { data[idx] = 0; data[idx + 1] = 0; data[idx + 2] = 0; }
      else {
        // smooth coloring
        const log_zn = Math.log(x * x + y * y) / 2;
        const nu = Math.log(log_zn / Math.LN2) / Math.LN2;
        const smooth = (iter + 1 - nu) / maxIter;
        const [r, g, b] = palette(Math.max(0, Math.min(1, smooth * 4)));
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b;
      }
      data[idx + 3] = 255;
    }
  }
}

function computeJulia(
  imgData: ImageData, w: number, h: number,
  cx: number, cy: number, zoom: number, maxIter: number,
  jcx: number, jcy: number,
  palette: (t: number) => [number, number, number],
) {
  const data = imgData.data;
  const aspect = w / h;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      let x = cx + (px / w - 0.5) * (3 / zoom) * aspect;
      let y = cy + (py / h - 0.5) * (3 / zoom);
      let iter = 0;
      while (x * x + y * y <= 4 && iter < maxIter) {
        const xt = x * x - y * y + jcx;
        y = 2 * x * y + jcy;
        x = xt;
        iter++;
      }
      const idx = (py * w + px) * 4;
      if (iter === maxIter) { data[idx] = 0; data[idx + 1] = 0; data[idx + 2] = 0; }
      else {
        const log_zn = Math.log(x * x + y * y) / 2;
        const nu = Math.log(log_zn / Math.LN2) / Math.LN2;
        const smooth = (iter + 1 - nu) / maxIter;
        const [r, g, b] = palette(Math.max(0, Math.min(1, smooth * 4)));
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b;
      }
      data[idx + 3] = 255;
    }
  }
}

/* ── Component ───────────────────────────────────────── */
type FractalType = 'mandelbrot' | 'julia';

export const FraktaleExplorer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fracArr, setFrac] = useState<FractalType>('mandelbrot');
  const [maxIter, setMaxIter] = useState(120);
  const [palName, setPalName] = useState('Cyber');
  const [juliaC, setJuliaC] = useState({ re: -0.7, im: 0.27015 });

  // View state
  const viewRef = useRef({ cx: -0.5, cy: 0, zoom: 1 });
  const dragRef = useRef({ dragging: false, sx: 0, sy: 0, scx: 0, scy: 0 });
  const [, forceRender] = useState(0);
  const kick = () => forceRender(n => n + 1);

  const render = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    const w = cvs.width, h = cvs.height;
    const imgData = ctx.createImageData(w, h);
    const { cx, cy, zoom } = viewRef.current;
    const pal = palettes[palName] || palettes.Cyber;

    if (fracArr === 'mandelbrot') {
      computeMandelbrot(imgData, w, h, cx, cy, zoom, maxIter, pal);
    } else {
      computeJulia(imgData, w, h, cx, cy, zoom, maxIter, juliaC.re, juliaC.im, pal);
    }
    ctx.putImageData(imgData, 0, 0);

    // HUD overlay
    ctx.fillStyle = 'rgba(0,10,20,0.6)';
    ctx.fillRect(0, 0, w, 24);
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = '#00d4ff';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Zoom: ${zoom.toFixed(1)}x   Center: (${cx.toFixed(6)}, ${cy.toFixed(6)})   Iter: ${maxIter}`, 8, 12);
  }, [fracArr, maxIter, palName, juliaC]);

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
      // Zoom towards mouse position
      const wx = v.cx + (mx - 0.5) * (3 / v.zoom) * aspect;
      const wy = v.cy + (my - 0.5) * (3 / v.zoom);
      v.zoom *= factor;
      v.cx = wx - (mx - 0.5) * (3 / v.zoom) * aspect;
      v.cy = wy - (my - 0.5) * (3 / v.zoom);
      kick();
      render();
    };

    const onDown = (e: MouseEvent) => {
      dragRef.current = { dragging: true, sx: e.clientX, sy: e.clientY, scx: viewRef.current.cx, scy: viewRef.current.cy };
    };
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d.dragging) return;
      const r = rect();
      const v = viewRef.current;
      const aspect = cvs.width / cvs.height;
      const dx = (e.clientX - d.sx) / r.width * (3 / v.zoom) * aspect;
      const dy = (e.clientY - d.sy) / r.height * (3 / v.zoom);
      v.cx = d.scx - dx;
      v.cy = d.scy - dy;
      kick();
      render();
    };
    const onUp = () => { dragRef.current.dragging = false; };
    const onDbl = () => {
      viewRef.current = { cx: fracArr === 'mandelbrot' ? -0.5 : 0, cy: 0, zoom: 1 };
      kick();
      render();
    };

    cvs.addEventListener('wheel', onWheel, { passive: false });
    cvs.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    cvs.addEventListener('dblclick', onDbl);

    return () => {
      cvs.removeEventListener('wheel', onWheel);
      cvs.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      cvs.removeEventListener('dblclick', onDbl);
    };
  }, [render, fracArr]);

  // Switch fractal type
  const switchFrac = (f: FractalType) => {
    setFrac(f);
    viewRef.current = { cx: f === 'mandelbrot' ? -0.5 : 0, cy: 0, zoom: 1 };
    kick();
  };

  return (
    <>
      <div className="header-eyebrow">Tools <span>// Fraktale-Explorer</span></div>
      <h1>Fraktale<em>Explorer</em></h1>
      <p className="subtitle">Mandelbrot- & Julia-Mengen — unendliche Selbstähnlichkeit entdecken</p>

      <div className="controls" style={{ gridTemplateColumns: 'auto auto auto auto auto' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Fraktal</span></div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['mandelbrot', 'julia'] as FractalType[]).map(f => (
              <button key={f} className={`tab-btn ${fracArr === f ? 'active' : ''}`}
                onClick={() => switchFrac(f)}>
                {f === 'mandelbrot' ? 'Mandelbrot' : 'Julia'}
              </button>
            ))}
          </div>
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Iterationen</span>
            <span className="ctrl-value">{maxIter}</span>
          </div>
          <input type="range" min={30} max={500} step={10} value={maxIter} onChange={e => setMaxIter(+e.target.value)} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Palette</span></div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
            {Object.keys(palettes).map(p => (
              <button key={p} className={`tab-btn ${palName === p ? 'active' : ''}`}
                onClick={() => setPalName(p)} style={{ fontSize: 11, padding: '3px 8px' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
        {fracArr === 'julia' && (
          <>
            <div className="ctrl">
              <div className="ctrl-header">
                <span className="ctrl-label">c (Re)</span>
                <span className="ctrl-value">{juliaC.re.toFixed(3)}</span>
              </div>
              <input type="range" min={-2} max={2} step={0.001} value={juliaC.re}
                onChange={e => setJuliaC(c => ({ ...c, re: +e.target.value }))} />
            </div>
            <div className="ctrl">
              <div className="ctrl-header">
                <span className="ctrl-label">c (Im)</span>
                <span className="ctrl-value">{juliaC.im.toFixed(3)}</span>
              </div>
              <input type="range" min={-2} max={2} step={0.001} value={juliaC.im}
                onChange={e => setJuliaC(c => ({ ...c, im: +e.target.value }))} />
            </div>
          </>
        )}
      </div>

      <div className="canvas-wrap" style={{ position: 'relative', cursor: 'grab' }}>
        <canvas ref={canvasRef} width={900} height={600}
          style={{ width: '100%', height: 'auto', borderRadius: '4px', border: '1px solid rgba(0,212,255,0.1)' }} />
      </div>

      <div className="explanation">
        <h2>Was sind Fraktale?</h2>
        <p>
          Fraktale sind geometrische Strukturen mit <strong>Selbstähnlichkeit</strong> — sie sehen auf jeder Vergrößerungsstufe
          ähnlich aus. Die <strong>Mandelbrot-Menge</strong> entsteht durch die Iteration z → z² + c, wobei die schwarzen Bereiche
          Punkte markieren, die nicht divergieren.
        </p>
        <p>
          <strong>Julia-Mengen</strong> verwenden dieselbe Formel, aber mit festem c — jeder c-Wert erzeugt eine einzigartige Menge.
          Benutze die Regler, um verschiedene Julia-Mengen zu entdecken!
        </p>
        <p style={{ color: 'var(--muted)', fontSize: 12 }}>
          Scrollen = Zoom (zum Mauszeiger) · Ziehen = Verschieben · Doppelklick = Reset
        </p>
      </div>
    </>
  );
};
