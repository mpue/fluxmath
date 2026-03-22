import React, { useRef, useEffect, useState, useCallback } from 'react';

/* ── WebGL Fractal Renderer (GPU-accelerated) ────────── */
const VERT_SRC = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG_SRC = `
precision highp float;
uniform vec2  u_resolution;
// Center as Double-Double: each axis split into 4 floats (a0+a1+a2+a3)
uniform vec4  u_cx;  // (hi0, lo0, hi1, lo1) for real
uniform vec4  u_cy;  // (hi0, lo0, hi1, lo1) for imag
uniform float u_zoom;
uniform int   u_maxIter;
uniform int   u_fractal;   // 0 = mandelbrot, 1 = julia
uniform vec2  u_juliaC;
uniform int   u_palette;

// ══════════════════════════════════════════════════════
// Double-Double arithmetic using pairs of floats (vec2)
// Each DD number = (hi, lo) where value ≈ hi + lo
// Total precision: ~44-48 mantissa bits (~14 decimal digits)
// ══════════════════════════════════════════════════════

// Error-free addition of two floats → (sum, error)
vec2 twoSum(float a, float b) {
  float s = a + b;
  float v = s - a;
  float e = (a - (s - v)) + (b - v);
  return vec2(s, e);
}

// DD + DD
vec2 dd_add(vec2 a, vec2 b) {
  vec2 s = twoSum(a.x, b.x);
  s.y += a.y + b.y;
  return twoSum(s.x, s.y);
}

// DD - DD
vec2 dd_sub(vec2 a, vec2 b) {
  return dd_add(a, vec2(-b.x, -b.y));
}

// Veltkamp split for exact product
vec2 vSplit(float a) {
  float c = 4097.0 * a;
  float hi = c - (c - a);
  return vec2(hi, a - hi);
}

// Error-free product of two floats → (product, error)
vec2 twoProd(float a, float b) {
  float p = a * b;
  vec2 sa = vSplit(a);
  vec2 sb = vSplit(b);
  float e = ((sa.x*sb.x - p) + sa.x*sb.y + sa.y*sb.x) + sa.y*sb.y;
  return vec2(p, e);
}

// DD * DD
vec2 dd_mul(vec2 a, vec2 b) {
  vec2 p = twoProd(a.x, b.x);
  p.y += a.x*b.y + a.y*b.x;
  return twoSum(p.x, p.y);
}

// DD from single float
vec2 dd_set(float a) { return vec2(a, 0.0); }

// DD from hi+lo pair (already split on CPU side)
vec2 dd_from(float hi, float lo) { return vec2(hi, lo); }

// DD > float comparison (approximate, for bailout)
bool dd_gt(vec2 a, float v) { return a.x > v; }

// ── palette functions ──
vec3 palCyber(float t) {
  float r = 9.0*(1.0-t)*t*t*t;
  float g = 15.0*(1.0-t)*(1.0-t)*t*t;
  float b = 8.5*(1.0-t)*(1.0-t)*(1.0-t)*t;
  return vec3(min(1.0,r), min(1.0,g+0.157), min(1.0,b+0.314));
}
vec3 palFlamme(float t) {
  return vec3(min(1.0,t*4.0), min(1.0,t*t*2.0), t*0.235);
}
vec3 palNeon(float t) {
  float h = t*6.0; float c = 1.0;
  float x = c*(1.0-abs(mod(h,2.0)-1.0));
  vec3 rgb;
  if      (h<1.0) rgb=vec3(c,x,0);
  else if (h<2.0) rgb=vec3(x,c,0);
  else if (h<3.0) rgb=vec3(0,c,x);
  else if (h<4.0) rgb=vec3(0,x,c);
  else if (h<5.0) rgb=vec3(x,0,c);
  else            rgb=vec3(c,0,x);
  return rgb;
}
vec3 palOzean(float t) { return vec3(t*0.118, 0.314+t*0.686, 0.471+t*0.529); }
vec3 palMono(float t)  { return vec3(t); }
vec3 palInferno(float t) {
  vec3 a=vec3(0.001,0.0,0.014); vec3 b=vec3(0.847,0.058,0.381);
  vec3 c2=vec3(0.986,0.635,0.033); vec3 d=vec3(0.988,1.0,0.644);
  if(t<0.33) return mix(a,b,t/0.33);
  if(t<0.66) return mix(b,c2,(t-0.33)/0.33);
  return mix(c2,d,(t-0.66)/0.34);
}
vec3 palAurora(float t) {
  vec3 a=vec3(0.05,0.0,0.15); vec3 b=vec3(0.0,0.6,0.4);
  vec3 c2=vec3(0.1,1.0,0.5); vec3 d=vec3(0.9,1.0,0.8);
  if(t<0.33) return mix(a,b,t/0.33);
  if(t<0.66) return mix(b,c2,(t-0.33)/0.33);
  return mix(c2,d,(t-0.66)/0.34);
}
vec3 getPalette(float t) {
  if(u_palette==0) return palCyber(t);
  if(u_palette==1) return palFlamme(t);
  if(u_palette==2) return palNeon(t);
  if(u_palette==3) return palOzean(t);
  if(u_palette==4) return palMono(t);
  if(u_palette==5) return palInferno(t);
  return palAurora(t);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  float pixelSpan = 3.0 / u_zoom;

  // Build pixel coordinate as DD using the 4-float center
  // re = cx + (uv.x - 0.5) * pixelSpan * aspect
  vec2 dd_cx = dd_add(dd_from(u_cx.x, u_cx.y), dd_from(u_cx.z, u_cx.w));
  vec2 dd_cy = dd_add(dd_from(u_cy.x, u_cy.y), dd_from(u_cy.z, u_cy.w));

  vec2 dd_offset_re = dd_set((uv.x - 0.5) * pixelSpan * aspect);
  vec2 dd_offset_im = dd_set((0.5 - uv.y) * pixelSpan);

  vec2 dd_re = dd_add(dd_cx, dd_offset_re);
  vec2 dd_im = dd_add(dd_cy, dd_offset_im);

  // Set up iteration
  vec2 dd_zr, dd_zi, dd_cr, dd_ci;
  if (u_fractal == 0) {
    dd_zr = dd_set(0.0); dd_zi = dd_set(0.0);
    dd_cr = dd_re; dd_ci = dd_im;
  } else {
    dd_zr = dd_re; dd_zi = dd_im;
    dd_cr = dd_set(u_juliaC.x); dd_ci = dd_set(u_juliaC.y);
  }

  int iter = 0;
  float mag2 = 0.0;
  for (int i = 0; i < 10000; i++) {
    if (i >= u_maxIter) break;
    vec2 dd_zr2 = dd_mul(dd_zr, dd_zr);
    vec2 dd_zi2 = dd_mul(dd_zi, dd_zi);
    // Bailout: |z|² > 256
    mag2 = dd_zr2.x + dd_zi2.x;
    if (mag2 > 256.0) break;
    // zi = 2·zr·zi + ci
    vec2 dd_zrzi = dd_mul(dd_zr, dd_zi);
    dd_zi = dd_add(dd_add(dd_zrzi, dd_zrzi), dd_ci);
    // zr = zr² - zi² + cr
    dd_zr = dd_add(dd_sub(dd_zr2, dd_zi2), dd_cr);
    iter++;
  }

  if (iter >= u_maxIter) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    float log_zn = log(mag2) * 0.5;
    float nu = log(log_zn / log(2.0)) / log(2.0);
    float smooth_iter = float(iter) + 1.0 - nu;
    float t = clamp(smooth_iter / float(u_maxIter) * 4.0, 0.0, 1.0);
    gl_FragColor = vec4(getPalette(t), 1.0);
  }
}
`;

const PALETTE_NAMES = ['Cyber', 'Flamme', 'Neon', 'Ozean', 'Mono', 'Inferno', 'Aurora'];

function initGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: true });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };

  const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vs || !fs) return null;

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  // Fullscreen quad
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  return {
    gl,
    uniforms: {
      resolution: gl.getUniformLocation(prog, 'u_resolution'),
      cx:         gl.getUniformLocation(prog, 'u_cx'),
      cy:         gl.getUniformLocation(prog, 'u_cy'),
      zoom:       gl.getUniformLocation(prog, 'u_zoom'),
      maxIter:    gl.getUniformLocation(prog, 'u_maxIter'),
      fractal:    gl.getUniformLocation(prog, 'u_fractal'),
      juliaC:     gl.getUniformLocation(prog, 'u_juliaC'),
      palette:    gl.getUniformLocation(prog, 'u_palette'),
    },
  };
}

/* ── Component ───────────────────────────────────────── */
type FractalType = 'mandelbrot' | 'julia';

export const FraktaleExplorer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<ReturnType<typeof initGL>>(null);
  const hudRef = useRef<HTMLCanvasElement>(null);
  const [fracArr, setFrac] = useState<FractalType>('mandelbrot');
  const [maxIter, setMaxIter] = useState(200);
  const [palIdx, setPalIdx] = useState(0);
  const [juliaC, setJuliaC] = useState({ re: -0.7, im: 0.27015 });
  const [qualityScale, setQualityScale] = useState(100); // percent of native DPR resolution
  const [gpuOk, setGpuOk] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ w: 900, h: 600 });

  // View state
  const viewRef = useRef({ cx: -0.5, cy: 0, zoom: 1 });
  const dragRef = useRef({ dragging: false, sx: 0, sy: 0, scx: 0, scy: 0 });
  const [, forceRender] = useState(0);
  const kick = () => forceRender(n => n + 1);

  // Track actual display size and adapt canvas resolution
  useEffect(() => {
    const wrap = canvasRef.current?.parentElement;
    if (!wrap) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const scale = (qualityScale / 100) * dpr;
      const w = Math.round(rect.width * scale);
      const h = Math.round(rect.width * (600 / 900) * scale); // keep 3:2 aspect
      setCanvasSize(prev => (prev.w === w && prev.h === h) ? prev : { w, h });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [qualityScale]);

  // (Re-)init WebGL when canvas pixel size changes
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = initGL(cvs);
    if (!ctx) { setGpuOk(false); return; }
    glRef.current = ctx;
  }, [canvasSize.w, canvasSize.h]);

  const render = useCallback(() => {
    const g = glRef.current;
    if (!g) return;
    const { gl, uniforms } = g;
    const cvs = canvasRef.current!;
    const w = cvs.width, h = cvs.height;
    gl.viewport(0, 0, w, h);
    const v = viewRef.current;

    gl.uniform2f(uniforms.resolution, w, h);
    // Split JS float64 center into 4 floats for Double-Double precision on GPU
    // value = hi0 + lo0  +  hi1 + lo1  (cascading split)
    const splitDD = (val: number): [number, number, number, number] => {
      const hi0 = Math.fround(val);
      const rem0 = val - hi0;
      const hi1 = Math.fround(rem0);
      const lo1 = rem0 - hi1;
      return [hi0, 0, hi1, lo1];
    };
    const cxDD = splitDD(v.cx);
    const cyDD = splitDD(v.cy);
    gl.uniform4f(uniforms.cx, cxDD[0], cxDD[1], cxDD[2], cxDD[3]);
    gl.uniform4f(uniforms.cy, cyDD[0], cyDD[1], cyDD[2], cyDD[3]);
    gl.uniform1f(uniforms.zoom, v.zoom);
    gl.uniform1i(uniforms.maxIter, maxIter);
    gl.uniform1i(uniforms.fractal, fracArr === 'mandelbrot' ? 0 : 1);
    gl.uniform2f(uniforms.juliaC, juliaC.re, juliaC.im);
    gl.uniform1i(uniforms.palette, palIdx);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // HUD overlay on separate 2d canvas
    const hud = hudRef.current;
    if (hud) {
      const ctx2 = hud.getContext('2d');
      if (ctx2) {
        ctx2.clearRect(0, 0, hud.width, hud.height);
        ctx2.fillStyle = 'rgba(0,10,20,0.6)';
        ctx2.fillRect(0, 0, hud.width, 24);
        ctx2.font = '11px "Share Tech Mono", monospace';
        ctx2.fillStyle = '#00d4ff';
        ctx2.textBaseline = 'middle';
        ctx2.fillText(
          `GPU ⚡  ${w}×${h}   Zoom: ${v.zoom.toFixed(1)}x   Center: (${v.cx.toFixed(6)}, ${v.cy.toFixed(6)})   Iter: ${maxIter}`,
          8, 12,
        );
      }
    }
  }, [fracArr, maxIter, palIdx, juliaC, canvasSize]);

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

  const switchFrac = (f: FractalType) => {
    setFrac(f);
    viewRef.current = { cx: f === 'mandelbrot' ? -0.5 : 0, cy: 0, zoom: 1 };
    kick();
  };

  if (!gpuOk) {
    return (
      <>
        <div className="header-eyebrow">Tools <span>// Fraktale-Explorer</span></div>
        <h1>Fraktale<em>Explorer</em></h1>
        <p className="subtitle" style={{ color: '#ff4444' }}>
          WebGL wird von diesem Browser nicht unterstützt. Bitte verwende einen aktuellen Browser mit GPU-Unterstützung.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="header-eyebrow">Tools <span>// Fraktale-Explorer</span></div>
      <h1>Fraktale<em>Explorer</em></h1>
      <p className="subtitle">Mandelbrot- & Julia-Mengen — GPU-beschleunigt in Echtzeit</p>

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
          <input type="range" min={30} max={5000} step={10} value={maxIter} onChange={e => setMaxIter(+e.target.value)} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Qualität</span>
            <span className="ctrl-value">{qualityScale}% ({canvasSize.w}×{canvasSize.h})</span>
          </div>
          <input type="range" min={25} max={200} step={25} value={qualityScale} onChange={e => setQualityScale(+e.target.value)} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Palette</span></div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
            {PALETTE_NAMES.map((p, i) => (
              <button key={p} className={`tab-btn ${palIdx === i ? 'active' : ''}`}
                onClick={() => setPalIdx(i)}>
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
        <canvas ref={canvasRef} width={canvasSize.w} height={canvasSize.h}
          style={{ width: '100%', aspectRatio: '3/2', borderRadius: '4px', border: '1px solid rgba(0,212,255,0.1)' }} />
        <canvas ref={hudRef} width={canvasSize.w} height={canvasSize.h}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', aspectRatio: '3/2', pointerEvents: 'none', borderRadius: '4px' }} />
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
          GPU-beschleunigt ⚡ · Scrollen = Zoom (zum Mauszeiger) · Ziehen = Verschieben · Doppelklick = Reset
        </p>
      </div>
    </>
  );
};
