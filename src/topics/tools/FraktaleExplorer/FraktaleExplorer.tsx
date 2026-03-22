import React, { useRef, useEffect, useState, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════
   Arbitrary-precision fixed-point arithmetic (BigInt)
   ═══════════════════════════════════════════════════════ */
const PREC = 128; // fractional bits → ~38 decimal digits
const PREC_N = BigInt(PREC);
const TWO52 = 4503599627370496; // 2^52

function fpFrom(x: number): bigint {
  if (x === 0) return 0n;
  const m = BigInt(Math.round(x * TWO52));
  return m << (PREC_N - 52n);
}

function fpToFloat(a: bigint): number {
  if (a === 0n) return 0;
  const neg = a < 0n;
  const abs = neg ? -a : a;
  const bits = abs.toString(2).length;
  if (bits <= 53) {
    const v = Number(abs) / Math.pow(2, PREC);
    return neg ? -v : v;
  }
  const shift = bits - 53;
  const top = Number(abs >> BigInt(shift));
  const v = top * Math.pow(2, shift - PREC);
  return neg ? -v : v;
}

function fpMul(a: bigint, b: bigint): bigint { return (a * b) >> PREC_N; }
function fpAdd(a: bigint, b: bigint): bigint { return a + b; }
function fpSub(a: bigint, b: bigint): bigint { return a - b; }

const DIRECT_THRESHOLD = 1e4; // below this zoom, use float32 direct iteration

/* ═══════════════════════════════════════════════════════
   Reference orbit computation (arbitrary precision)
   ═══════════════════════════════════════════════════════ */
interface RefOrbit {
  re: Float32Array;
  im: Float32Array;
  len: number;
}

function computeRefOrbit(
  cxBig: bigint, cyBig: bigint, maxIter: number,
  isMandelbrot: boolean, juliaCx?: bigint, juliaCy?: bigint,
): RefOrbit {
  const re = new Float32Array(maxIter + 1);
  const im = new Float32Array(maxIter + 1);
  let zr: bigint, zi: bigint, cr: bigint, ci: bigint;

  if (isMandelbrot) {
    zr = 0n; zi = 0n; cr = cxBig; ci = cyBig;
  } else {
    zr = cxBig; zi = cyBig; cr = juliaCx!; ci = juliaCy!;
  }

  let len = maxIter;
  for (let i = 0; i <= maxIter; i++) {
    const zrF = fpToFloat(zr);
    const ziF = fpToFloat(zi);
    re[i] = zrF;
    im[i] = ziF;
    if (zrF * zrF + ziF * ziF > 1e18) { len = i; break; }
    const zr2 = fpMul(zr, zr);
    const zi2 = fpMul(zi, zi);
    const zrzi = fpMul(zr, zi);
    zr = fpAdd(fpSub(zr2, zi2), cr);
    zi = fpAdd(fpAdd(zrzi, zrzi), ci);
  }
  return { re, im, len };
}

/* ═══════════════════════════════════════════════════════
   WebGL shaders
   ═══════════════════════════════════════════════════════ */
const VERT_SRC = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG_PERTURB = `
precision highp float;
uniform sampler2D u_orbit;    // reference orbit texture (RGBA float)
uniform vec2  u_orbitSize;    // texture width, height
uniform vec2  u_resolution;
uniform float u_pixelSpan;    // 3.0 / zoom
uniform float u_aspect;
uniform int   u_maxIter;
uniform int   u_refLen;       // length of reference orbit
uniform int   u_fractal;      // 0 = mandelbrot, 1 = julia
uniform int   u_palette;
uniform int   u_mode;        // 0 = direct, 1 = perturbation
uniform vec2  u_center;      // float32 center (direct mode)
uniform vec2  u_juliaC;      // Julia c for direct mode
uniform vec2  u_viewOffset;  // shift from ref orbit center

vec3 readOrbit(int n) {
  float idx = float(n);
  float tx = mod(idx, u_orbitSize.x);
  float ty = floor(idx / u_orbitSize.x);
  vec2 uv = vec2((tx + 0.5) / u_orbitSize.x, (ty + 0.5) / u_orbitSize.y);
  return texture2D(u_orbit, uv).rgb;
}

// ── palettes ──
vec3 palCyber(float t) {
  float r=9.0*(1.0-t)*t*t*t; float g=15.0*(1.0-t)*(1.0-t)*t*t;
  float b=8.5*(1.0-t)*(1.0-t)*(1.0-t)*t;
  return vec3(min(1.0,r),min(1.0,g+0.157),min(1.0,b+0.314));
}
vec3 palFlamme(float t) { return vec3(min(1.0,t*4.0),min(1.0,t*t*2.0),t*0.235); }
vec3 palNeon(float t) {
  float h=t*6.0; float c=1.0; float x=c*(1.0-abs(mod(h,2.0)-1.0));
  vec3 rgb;
  if(h<1.0) rgb=vec3(c,x,0.0); else if(h<2.0) rgb=vec3(x,c,0.0);
  else if(h<3.0) rgb=vec3(0.0,c,x); else if(h<4.0) rgb=vec3(0.0,x,c);
  else if(h<5.0) rgb=vec3(x,0.0,c); else rgb=vec3(c,0.0,x);
  return rgb;
}
vec3 palOzean(float t) { return vec3(t*0.118,0.314+t*0.686,0.471+t*0.529); }
vec3 palMono(float t) { return vec3(t); }
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

  if (u_mode == 0) {
    // ── Direct float32 iteration (low zoom) ──
    float px_re = u_center.x + (uv.x - 0.5) * u_pixelSpan * u_aspect;
    float px_im = u_center.y + (0.5 - uv.y) * u_pixelSpan;
    float zr, zi, cr, ci;
    if (u_fractal == 0) {
      zr = 0.0; zi = 0.0; cr = px_re; ci = px_im;
    } else {
      zr = px_re; zi = px_im; cr = u_juliaC.x; ci = u_juliaC.y;
    }
    for (int i = 0; i < 10000; i++) {
      if (i >= u_maxIter) break;
      float nr = zr*zr - zi*zi + cr;
      float ni = 2.0*zr*zi + ci;
      zr = nr; zi = ni;
      float m2 = zr*zr + zi*zi;
      if (m2 > 256.0) {
        float log_zn = log(m2) * 0.5;
        float nu = log(log_zn / log(2.0)) / log(2.0);
        float s = float(i) + 1.0 - nu;
        float t = clamp(s / float(u_maxIter) * 4.0, 0.0, 1.0);
        gl_FragColor = vec4(getPalette(t), 1.0);
        return;
      }
    }
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // ── Perturbation mode (high zoom) ──
  float dc_re = (uv.x - 0.5) * u_pixelSpan * u_aspect + u_viewOffset.x;
  float dc_im = (0.5 - uv.y) * u_pixelSpan + u_viewOffset.y;

  // δ_0 = 0 for Mandelbrot (z_0 = 0 for all pixels), δ_0 = δc for Julia
  float dr = (u_fractal == 0) ? 0.0 : dc_re;
  float di = (u_fractal == 0) ? 0.0 : dc_im;

  // Absolute c for this pixel (for direct fallback)
  float pixel_cr = u_center.x + dc_re;
  float pixel_ci = u_center.y + dc_im;
  if (u_fractal == 1) { pixel_cr = u_juliaC.x; pixel_ci = u_juliaC.y; }

  int iter = 0;
  bool glitched = false;
  float fallback_zr = 0.0;
  float fallback_zi = 0.0;

  for (int i = 0; i < 10000; i++) {
    if (i >= u_maxIter || i >= u_refLen) break;

    vec3 ref = readOrbit(i);
    float Zr = ref.x;
    float Zi = ref.y;

    // Full z = Z + δ
    float fr = Zr + dr;
    float fi = Zi + di;
    float mag2 = fr*fr + fi*fi;

    if (mag2 > 256.0) {
      // Smooth coloring
      float log_zn = log(mag2) * 0.5;
      float nu = log(log_zn / log(2.0)) / log(2.0);
      float s = float(i) + 1.0 - nu;
      float t = clamp(s / float(u_maxIter) * 4.0, 0.0, 1.0);
      gl_FragColor = vec4(getPalette(t), 1.0);
      return;
    }

    // Perturbation recurrence:
    // Mandelbrot: δ_{n+1} = 2·Z_n·δ_n + δ_n² + δc
    // Julia:      δ_{n+1} = 2·Z_n·δ_n + δ_n²
    float ndr = 2.0*(Zr*dr - Zi*di) + dr*dr - di*di;
    float ndi = 2.0*(Zr*di + Zi*dr) + 2.0*dr*di;
    if (u_fractal == 0) { ndr += dc_re; ndi += dc_im; }
    dr = ndr;
    di = ndi;

    // Glitch detection: if |δ|² > |Z_{n+1}|², perturbation is unreliable.
    // Fall back to direct float32 iteration from full z value.
    float d2 = dr*dr + di*di;
    float Z2 = Zr*Zr + Zi*Zi;
    if (d2 > Z2 && Z2 > 1e-6) {
      // Recover full z_{n+1} = Z_{n+1} + δ_{n+1}
      // Z_{n+1} is stored at orbit[i+1] if available
      if (i + 1 < u_refLen) {
        vec3 refN = readOrbit(i + 1);
        fallback_zr = refN.x + dr;
        fallback_zi = refN.y + di;
      } else {
        // Use Z_n-based full z: iterate fr,fi one step
        fallback_zr = fr*fr - fi*fi;
        fallback_zi = 2.0*fr*fi;
        if (u_fractal == 0) { fallback_zr += pixel_cr; fallback_zi += pixel_ci; }
      }
      iter = i + 1;
      glitched = true;
      break;
    }

    iter = i + 1;
  }

  // Direct float32 fallback — either glitch or reference orbit exhausted
  if ((glitched || iter >= u_refLen) && iter < u_maxIter) {
    float zr, zi;
    if (glitched) {
      zr = fallback_zr;
      zi = fallback_zi;
    } else {
      vec3 refAt = readOrbit(u_refLen);
      zr = refAt.x + dr;
      zi = refAt.y + di;
    }
    for (int j = 0; j < 10000; j++) {
      if (iter >= u_maxIter) break;
      float m2 = zr*zr + zi*zi;
      if (m2 > 256.0) {
        float log_zn = log(m2) * 0.5;
        float nu = log(log_zn / log(2.0)) / log(2.0);
        float s = float(iter) + 1.0 - nu;
        float t = clamp(s / float(u_maxIter) * 4.0, 0.0, 1.0);
        gl_FragColor = vec4(getPalette(t), 1.0);
        return;
      }
      float nr = zr*zr - zi*zi + pixel_cr;
      float ni = 2.0*zr*zi + pixel_ci;
      zr = nr; zi = ni;
      iter = iter + 1;
    }
  }

  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

const PALETTE_NAMES = ['Cyber', 'Flamme', 'Neon', 'Ozean', 'Mono', 'Inferno', 'Aurora'];

/* ═══════════════════════════════════════════════════════
   WebGL initialisation with orbit texture
   ═══════════════════════════════════════════════════════ */
interface GLCtx {
  gl: WebGLRenderingContext;
  orbitTex: WebGLTexture;
  orbitTexW: number;
  orbitTexH: number;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

function initGL(canvas: HTMLCanvasElement): GLCtx | null {
  const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: true });
  if (!gl) return null;

  const floatExt = gl.getExtension('OES_texture_float');
  if (!floatExt) { console.error('OES_texture_float not available'); return null; }

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
  const fs = compile(gl.FRAGMENT_SHADER, FRAG_PERTURB);
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

  // Orbit texture
  const orbitTex = gl.createTexture()!;
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, orbitTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(prog, 'u_orbit'), 0);

  return {
    gl, orbitTex, orbitTexW: 0, orbitTexH: 0,
    uniforms: {
      resolution: gl.getUniformLocation(prog, 'u_resolution'),
      orbitSize:  gl.getUniformLocation(prog, 'u_orbitSize'),
      pixelSpan:  gl.getUniformLocation(prog, 'u_pixelSpan'),
      aspect:     gl.getUniformLocation(prog, 'u_aspect'),
      maxIter:    gl.getUniformLocation(prog, 'u_maxIter'),
      refLen:     gl.getUniformLocation(prog, 'u_refLen'),
      fractal:    gl.getUniformLocation(prog, 'u_fractal'),
      palette:    gl.getUniformLocation(prog, 'u_palette'),
      mode:       gl.getUniformLocation(prog, 'u_mode'),
      center:     gl.getUniformLocation(prog, 'u_center'),
      juliaC:     gl.getUniformLocation(prog, 'u_juliaC'),
      viewOffset: gl.getUniformLocation(prog, 'u_viewOffset'),
    },
  };
}

function uploadOrbit(ctx: GLCtx, orbit: RefOrbit) {
  const { gl, orbitTex } = ctx;
  const n = orbit.len + 1;
  const texW = Math.min(n, 2048);
  const texH = Math.ceil(n / texW);
  const total = texW * texH;
  const data = new Float32Array(total * 4);
  for (let i = 0; i < n; i++) {
    data[i * 4]     = orbit.re[i];
    data[i * 4 + 1] = orbit.im[i];
    data[i * 4 + 2] = 0;
    data[i * 4 + 3] = 0;
  }
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, orbitTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texW, texH, 0, gl.RGBA, gl.FLOAT, data);
  ctx.orbitTexW = texW;
  ctx.orbitTexH = texH;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */
type FractalType = 'mandelbrot' | 'julia';

function fmtZoom(z: number): string {
  if (z < 1e6) return z.toFixed(1) + 'x';
  return z.toExponential(2) + 'x';
}

export const FraktaleExplorer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<GLCtx | null>(null);
  const hudRef = useRef<HTMLCanvasElement>(null);
  const [fracArr, setFrac] = useState<FractalType>('mandelbrot');
  const [maxIter, setMaxIter] = useState(300);
  const [palIdx, setPalIdx] = useState(0);
  const [juliaC, setJuliaC] = useState({ re: -0.7, im: 0.27015 });
  const [qualityScale, setQualityScale] = useState(100);
  const [gpuOk, setGpuOk] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ w: 900, h: 600 });

  // High-precision center (BigInt fixed-point) + float64 zoom
  const bigCenter = useRef({ re: fpFrom(-0.5), im: fpFrom(0) });
  const zoomRef = useRef(1);
  const dragRef = useRef({
    dragging: false, sx: 0, sy: 0,
    scxBig: 0n, scyBig: 0n,
  });
  const orbitRef = useRef<RefOrbit | null>(null);
  const refCenterRef = useRef({ re: 0n, im: 0n });
  const [, forceRender] = useState(0);
  const kick = () => forceRender(n => n + 1);

  // Animation waypoints & state
  interface Waypoint { re: bigint; im: bigint; zoom: number; }
  const [startWP, setStartWP] = useState<Waypoint | null>(null);
  const [endWP, setEndWP] = useState<Waypoint | null>(null);
  const [animSpeed, setAnimSpeed] = useState(50);  // 1-100
  const [animPlaying, setAnimPlaying] = useState(false);
  const [animReverse, setAnimReverse] = useState(false);
  const animT = useRef(0);           // progress 0..1
  const animRaf = useRef(0);

  // Track display size
  useEffect(() => {
    const wrap = canvasRef.current?.parentElement;
    if (!wrap) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const scale = (qualityScale / 100) * dpr;
      const w = Math.round(rect.width * scale);
      const h = Math.round(rect.width * (600 / 900) * scale);
      setCanvasSize(prev => (prev.w === w && prev.h === h) ? prev : { w, h });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [qualityScale]);

  // Init WebGL
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
    const zoom = zoomRef.current;
    const pixelSpan = 3 / zoom;
    const aspect = w / h;
    const bc = bigCenter.current;
    const isMandel = fracArr === 'mandelbrot';
    const isDragging = dragRef.current.dragging;
    const useDirectMode = zoom < DIRECT_THRESHOLD;

    // Always set center + juliaC (needed for direct mode AND perturbation fallback)
    const rcF = useDirectMode
      ? { re: fpToFloat(bc.re), im: fpToFloat(bc.im) }
      : { re: fpToFloat(refCenterRef.current.re), im: fpToFloat(refCenterRef.current.im) };
    gl.uniform2f(uniforms.center, rcF.re, rcF.im);
    gl.uniform2f(uniforms.juliaC, juliaC.re, juliaC.im);

    if (useDirectMode) {
      gl.uniform1i(uniforms.mode, 0);
      gl.uniform2f(uniforms.viewOffset, 0, 0);
    } else {
      gl.uniform1i(uniforms.mode, 1);
      if (!isDragging || !orbitRef.current) {
        const orbit = computeRefOrbit(
          bc.re, bc.im, maxIter, isMandel,
          isMandel ? undefined : fpFrom(juliaC.re),
          isMandel ? undefined : fpFrom(juliaC.im),
        );
        uploadOrbit(g, orbit);
        orbitRef.current = orbit;
        refCenterRef.current = { re: bc.re, im: bc.im };
        gl.uniform2f(uniforms.viewOffset, 0, 0);
      } else {
        const rc = refCenterRef.current;
        gl.uniform2f(uniforms.viewOffset,
          fpToFloat(fpSub(bc.re, rc.re)),
          fpToFloat(fpSub(bc.im, rc.im)));
      }
    }

    gl.uniform2f(uniforms.resolution, w, h);
    gl.uniform2f(uniforms.orbitSize, g.orbitTexW, g.orbitTexH);
    gl.uniform1f(uniforms.pixelSpan, pixelSpan);
    gl.uniform1f(uniforms.aspect, aspect);
    gl.uniform1i(uniforms.maxIter, maxIter);
    gl.uniform1i(uniforms.refLen, orbitRef.current ? orbitRef.current.len : 0);
    gl.uniform1i(uniforms.fractal, isMandel ? 0 : 1);
    gl.uniform1i(uniforms.palette, palIdx);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // HUD
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
        const cxF = fpToFloat(bc.re);
        const cyF = fpToFloat(bc.im);
        const modeLabel = useDirectMode ? 'Direct' : 'Perturbation';
        const orbitLen = orbitRef.current ? orbitRef.current.len : 0;
        ctx2.fillText(
          `GPU ⚡ ${modeLabel}  ${w}×${h}   Zoom: ${fmtZoom(zoom)}   Center: (${cxF.toExponential(8)}, ${cyF.toExponential(8)})   Iter: ${maxIter}  Orbit: ${orbitLen}`,
          8, 12,
        );
      }
    }
  }, [fracArr, maxIter, palIdx, juliaC, canvasSize]);

  useEffect(() => { render(); }, [render]);

  // Animation loop
  useEffect(() => {
    if (!animPlaying || !startWP || !endWP) return;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      // Speed maps 1..100 → duration ~30s..0.5s (log scale)
      const duration = 30 * Math.pow(0.5 / 30, animSpeed / 100);
      const inc = dt / duration;
      animT.current += animReverse ? -inc : inc;
      if (animT.current >= 1) { animT.current = 1; setAnimPlaying(false); }
      if (animT.current <= 0) { animT.current = 0; setAnimPlaying(false); }
      const t = animT.current;

      // Smooth ease (smoothstep)
      const s = t * t * (3 - 2 * t);

      // Interpolate zoom logarithmically
      const logStart = Math.log(startWP.zoom);
      const logEnd = Math.log(endWP.zoom);
      zoomRef.current = Math.exp(logStart + (logEnd - logStart) * s);

      // Interpolate center in float64 then convert to BigInt
      const startRe = fpToFloat(startWP.re);
      const startIm = fpToFloat(startWP.im);
      const endRe = fpToFloat(endWP.re);
      const endIm = fpToFloat(endWP.im);
      bigCenter.current.re = fpFrom(startRe + (endRe - startRe) * s);
      bigCenter.current.im = fpFrom(startIm + (endIm - startIm) * s);

      orbitRef.current = null; // force fresh orbit
      render();
      kick();
      if (animPlaying) animRaf.current = requestAnimationFrame(step);
    };
    animRaf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRaf.current);
  }, [animPlaying, animReverse, animSpeed, startWP, endWP, render]);

  // Event handlers with BigInt center
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const rect = () => cvs.getBoundingClientRect();

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = rect();
      const mx = (e.clientX - r.left) / r.width;
      const my = (e.clientY - r.top) / r.height;
      const aspect = cvs.width / cvs.height;
      const zoom = zoomRef.current;
      const pixelSpan = 3 / zoom;
      const factor = e.deltaY < 0 ? 1.3 : 1 / 1.3;

      // World position of mouse (BigInt precision)
      const wxOff = fpFrom((mx - 0.5) * pixelSpan * aspect);
      const wyOff = fpFrom((my - 0.5) * pixelSpan);
      const wx = fpAdd(bigCenter.current.re, wxOff);
      const wy = fpAdd(bigCenter.current.im, wyOff);

      zoomRef.current = zoom * factor;
      const newPixelSpan = 3 / zoomRef.current;

      bigCenter.current.re = fpSub(wx, fpFrom((mx - 0.5) * newPixelSpan * aspect));
      bigCenter.current.im = fpSub(wy, fpFrom((my - 0.5) * newPixelSpan));
      kick();
      render();
    };

    const onDown = (e: MouseEvent) => {
      dragRef.current = {
        dragging: true, sx: e.clientX, sy: e.clientY,
        scxBig: bigCenter.current.re, scyBig: bigCenter.current.im,
      };
    };
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d.dragging) return;
      const r = rect();
      const aspect = cvs.width / cvs.height;
      const pixelSpan = 3 / zoomRef.current;
      const dx = (e.clientX - d.sx) / r.width * pixelSpan * aspect;
      const dy = (e.clientY - d.sy) / r.height * pixelSpan;
      bigCenter.current.re = fpSub(d.scxBig, fpFrom(dx));
      bigCenter.current.im = fpSub(d.scyBig, fpFrom(dy));
      kick();
      render();
    };
    const onUp = () => {
      if (dragRef.current.dragging) {
        dragRef.current.dragging = false;
        render();
      }
    };
    const onDbl = () => {
      bigCenter.current = {
        re: fpFrom(fracArr === 'mandelbrot' ? -0.5 : 0),
        im: fpFrom(0),
      };
      zoomRef.current = 1;
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
    bigCenter.current = { re: fpFrom(f === 'mandelbrot' ? -0.5 : 0), im: fpFrom(0) };
    zoomRef.current = 1;
    orbitRef.current = null;
    kick();
  };

  if (!gpuOk) {
    return (
      <>
        <div className="header-eyebrow">Tools <span>// Fraktale-Explorer</span></div>
        <h1>Fraktale<em>Explorer</em></h1>
        <p className="subtitle" style={{ color: '#ff4444' }}>
          WebGL mit OES_texture_float wird benötigt. Bitte verwende einen aktuellen Browser mit GPU-Unterstützung.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="header-eyebrow">Tools <span>// Fraktale-Explorer</span></div>
      <h1>Fraktale<em>Explorer</em></h1>
      <p className="subtitle">Mandelbrot- & Julia-Mengen — Perturbation Theory, unbegrenzter Zoom</p>

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
          <input type="range" min={30} max={10000} step={10} value={maxIter} onChange={e => setMaxIter(+e.target.value)} />
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

      {/* Animation controls */}
      <div className="controls" style={{ gridTemplateColumns: 'auto auto auto auto' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Waypoints</span></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={`tab-btn${startWP ? ' active' : ''}`}
              onClick={() => {
                setStartWP({ re: bigCenter.current.re, im: bigCenter.current.im, zoom: zoomRef.current });
                setAnimPlaying(false);
                animT.current = 0;
              }}>
              📍 Start
            </button>
            <button className={`tab-btn${endWP ? ' active' : ''}`}
              onClick={() => {
                setEndWP({ re: bigCenter.current.re, im: bigCenter.current.im, zoom: zoomRef.current });
                setAnimPlaying(false);
                animT.current = 1;
              }}>
              🏁 Ziel
            </button>
          </div>
        </div>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Animation</span></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="tab-btn"
              disabled={!startWP || !endWP}
              onClick={() => {
                if (!startWP || !endWP) return;
                if (!animPlaying) {
                  if (animReverse && animT.current <= 0) animT.current = 1;
                  if (!animReverse && animT.current >= 1) animT.current = 0;
                }
                setAnimPlaying(p => !p);
              }}>
              {animPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button className={`tab-btn${animReverse ? ' active' : ''}`}
              disabled={!startWP || !endWP}
              onClick={() => setAnimReverse(r => !r)}>
              {animReverse ? '◀ Rückwärts' : '▶ Vorwärts'}
            </button>
            <button className="tab-btn"
              disabled={!startWP || !endWP}
              onClick={() => {
                setAnimPlaying(false);
                animT.current = 0;
                if (startWP) {
                  bigCenter.current = { re: startWP.re, im: startWP.im };
                  zoomRef.current = startWP.zoom;
                  orbitRef.current = null;
                  kick(); render();
                }
              }}>
              ⏮ Reset
            </button>
          </div>
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Geschwindigkeit</span>
            <span className="ctrl-value">{animSpeed}%</span>
          </div>
          <input type="range" min={1} max={100} step={1} value={animSpeed}
            onChange={e => setAnimSpeed(+e.target.value)} />
        </div>
        {(startWP || endWP) && (
          <div className="ctrl">
            <div className="ctrl-header"><span className="ctrl-label">Status</span></div>
            <div style={{ fontSize: 11, fontFamily: '"Share Tech Mono", monospace', color: 'var(--cyan)' }}>
              {startWP && <div>Start: {fmtZoom(startWP.zoom)}</div>}
              {endWP && <div>Ziel: {fmtZoom(endWP.zoom)}</div>}
              <div>Progress: {(animT.current * 100).toFixed(0)}%</div>
            </div>
          </div>
        )}
      </div>

      <div className="canvas-wrap" style={{ position: 'relative', cursor: 'grab' }}>
        <canvas ref={canvasRef} width={canvasSize.w} height={canvasSize.h}
          style={{ width: '100%', aspectRatio: '3/2', borderRadius: '4px', border: '1px solid rgba(0,212,255,0.1)' }} />
        <canvas ref={hudRef} width={canvasSize.w} height={canvasSize.h}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', aspectRatio: '3/2', pointerEvents: 'none', borderRadius: '4px' }} />
      </div>

      <div className="explanation">
        <h2>Perturbation Theory</h2>
        <p>
          Dieser Explorer verwendet <strong>Perturbation Theory</strong> — ein Referenz-Orbit wird am Bildmittelpunkt
          in beliebiger Präzision (128-Bit BigInt) berechnet. Die GPU berechnet pro Pixel nur die winzige Abweichung
          (δ) vom Referenz-Orbit in float32. Dadurch sind <strong>Zooms bis ~10<sup>38</sup></strong> möglich,
          ohne Präzisionsverlust.
        </p>
        <p>
          <strong>Julia-Mengen</strong> verwenden dieselbe Technik mit dem Referenz-Orbit am Bildzentrum.
          Benutze die Regler, um verschiedene Julia-Mengen zu entdecken!
        </p>
        <p style={{ color: 'var(--muted)', fontSize: 12 }}>
          GPU + BigInt ⚡ · Scrollen = Zoom (zum Mauszeiger) · Ziehen = Verschieben · Doppelklick = Reset
        </p>
      </div>
    </>
  );
};
