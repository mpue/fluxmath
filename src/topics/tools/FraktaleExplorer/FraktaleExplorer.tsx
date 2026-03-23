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
uniform int   u_formula;     // 0 = standard, 1 = burning ship, 2 = tricorn, 3 = celtic
uniform vec2  u_center;      // float32 center (direct mode)
uniform vec2  u_juliaC;      // Julia c for direct mode
uniform vec2  u_viewOffset;  // shift from ref orbit center
uniform float u_hueShift;    // 0..360
uniform float u_saturation;  // 0..2
uniform float u_brightness;  // 0..2
uniform float u_contrast;    // 0..3

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0*d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 applyColorAdjust(vec3 col) {
  vec3 hsv = rgb2hsv(col);
  hsv.x = fract(hsv.x + u_hueShift / 360.0);
  hsv.y = clamp(hsv.y * u_saturation, 0.0, 1.0);
  hsv.z = clamp(hsv.z * u_brightness, 0.0, 1.0);
  vec3 rgb = hsv2rgb(hsv);
  rgb = clamp((rgb - 0.5) * u_contrast + 0.5, 0.0, 1.0);
  return rgb;
}

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
      float nr, ni;
      if (u_formula == 1) {
        float azr = abs(zr); float azi = abs(zi);
        nr = azr*azr - azi*azi + cr;
        ni = 2.0*azr*azi + ci;
      } else if (u_formula == 2) {
        nr = zr*zr - zi*zi + cr;
        ni = -(2.0*zr*zi) + ci;
      } else if (u_formula == 3) {
        nr = abs(zr*zr - zi*zi) + cr;
        ni = 2.0*zr*zi + ci;
      } else {
        nr = zr*zr - zi*zi + cr;
        ni = 2.0*zr*zi + ci;
      }
      zr = nr; zi = ni;
      float m2 = zr*zr + zi*zi;
      if (m2 > 256.0) {
        float log_zn = log(m2) * 0.5;
        float nu = log(log_zn / log(2.0)) / log(2.0);
        float s = float(i) + 1.0 - nu;
        float t = clamp(s / float(u_maxIter) * 4.0, 0.0, 1.0);
        gl_FragColor = vec4(applyColorAdjust(getPalette(t)), 1.0);
        return;
      }
    }
    gl_FragColor = vec4(applyColorAdjust(vec3(0.0)), 1.0);
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
      gl_FragColor = vec4(applyColorAdjust(getPalette(t)), 1.0);
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
        gl_FragColor = vec4(applyColorAdjust(getPalette(t)), 1.0);
        return;
      }
      float nr = zr*zr - zi*zi + pixel_cr;
      float ni = 2.0*zr*zi + pixel_ci;
      zr = nr; zi = ni;
      iter = iter + 1;
    }
  }

  gl_FragColor = vec4(applyColorAdjust(vec3(0.0)), 1.0);
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
      hueShift:   gl.getUniformLocation(prog, 'u_hueShift'),
      saturation: gl.getUniformLocation(prog, 'u_saturation'),
      brightness: gl.getUniformLocation(prog, 'u_brightness'),
      contrast:   gl.getUniformLocation(prog, 'u_contrast'),
      formula:    gl.getUniformLocation(prog, 'u_formula'),
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
   Buddhabrot CPU renderer
   ═══════════════════════════════════════════════════════ */
function buddhabrotPalette(t: number, pal: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t));
  switch (pal) {
    case 0: {
      const r = 9*(1-t)*t*t*t, g = 15*(1-t)*(1-t)*t*t, b = 8.5*(1-t)*(1-t)*(1-t)*t;
      return [Math.min(255,Math.floor(r*255)), Math.min(255,Math.floor(g*255)+40), Math.min(255,Math.floor(b*255)+80)];
    }
    case 1: return [Math.min(255,Math.floor(t*4*255)), Math.min(255,Math.floor(t*t*2*255)), Math.floor(t*0.235*255)];
    case 2: {
      const h = t*6, x = 1-Math.abs(h%2-1);
      let r=0,g=0,b=0;
      if(h<1){r=1;g=x;}else if(h<2){r=x;g=1;}else if(h<3){g=1;b=x;}
      else if(h<4){g=x;b=1;}else if(h<5){r=x;b=1;}else{r=1;b=x;}
      return [Math.floor(r*255),Math.floor(g*255),Math.floor(b*255)];
    }
    case 3: return [Math.floor(t*0.118*255), Math.floor((0.314+t*0.686)*255), Math.floor((0.471+t*0.529)*255)];
    case 4: { const v = Math.floor(t*255); return [v,v,v]; }
    case 5: {
      const a=[0.001,0,0.014],b2=[0.847,0.058,0.381],c=[0.986,0.635,0.033],d=[0.988,1,0.644];
      let rgb: number[];
      if(t<0.33)rgb=a.map((v,i)=>v+(b2[i]-v)*t/0.33);
      else if(t<0.66)rgb=b2.map((v,i)=>v+(c[i]-v)*(t-0.33)/0.33);
      else rgb=c.map((v,i)=>v+(d[i]-v)*(t-0.66)/0.34);
      return rgb.map(v=>Math.floor(Math.min(1,v)*255)) as [number,number,number];
    }
    default: {
      const a=[0.05,0,0.15],b2=[0,0.6,0.4],c=[0.1,1,0.5],d=[0.9,1,0.8];
      let rgb: number[];
      if(t<0.33)rgb=a.map((v,i)=>v+(b2[i]-v)*t/0.33);
      else if(t<0.66)rgb=b2.map((v,i)=>v+(c[i]-v)*(t-0.33)/0.33);
      else rgb=c.map((v,i)=>v+(d[i]-v)*(t-0.66)/0.34);
      return rgb.map(v=>Math.floor(Math.min(1,v)*255)) as [number,number,number];
    }
  }
}

const BuddhabrotVis: React.FC<{
  maxIter: number; palIdx: number; canvasSize: { w: number; h: number };
}> = ({ maxIter, palIdx, canvasSize }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const densityRef = useRef<Float32Array | null>(null);
  const [totalSamples, setTotalSamples] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef(false);
  const rafRef = useRef(0);

  const w = canvasSize.w, h = canvasSize.h;
  const aspect = w / h;
  const span = 3.5;
  const cx = -0.5, cy = 0;
  const halfSpanX = span * aspect / 2;
  const halfSpanY = span / 2;
  const xMin = cx - halfSpanX;
  const yMax = cy + halfSpanY;
  const totalX = span * aspect;
  const totalY = span;

  useEffect(() => {
    densityRef.current = new Float32Array(w * h);
    setTotalSamples(0);
    setIsRunning(false);
    abortRef.current = true;
  }, [w, h]);

  const renderDensity = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs || !densityRef.current) return;
    const ctx2d = cvs.getContext('2d');
    if (!ctx2d) return;
    const density = densityRef.current;
    const imgData = ctx2d.createImageData(w, h);
    let maxD = 0;
    for (let i = 0; i < density.length; i++) if (density[i] > maxD) maxD = density[i];
    if (maxD === 0) { ctx2d.putImageData(imgData, 0, 0); return; }
    const logMax = Math.log(maxD + 1);
    for (let i = 0; i < density.length; i++) {
      const t = Math.log(density[i] + 1) / logMax;
      const [r, g, b] = buddhabrotPalette(t, palIdx);
      imgData.data[i * 4] = r; imgData.data[i * 4 + 1] = g;
      imgData.data[i * 4 + 2] = b; imgData.data[i * 4 + 3] = 255;
    }
    ctx2d.putImageData(imgData, 0, 0);
    // HUD
    ctx2d.fillStyle = 'rgba(0,10,20,0.6)';
    ctx2d.fillRect(0, 0, w, 24);
    ctx2d.font = '11px "Share Tech Mono", monospace';
    ctx2d.fillStyle = '#00d4ff';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText(`Buddhabrot · CPU · ${w}×${h}   Samples: ${totalSamples.toLocaleString()}   Iter: ${maxIter}`, 8, 12);
  }, [w, h, palIdx, totalSamples, maxIter]);

  // Re-render when palette changes
  useEffect(() => {
    if (totalSamples > 0) renderDensity();
  }, [palIdx, renderDensity, totalSamples]);

  const runBatch = useCallback(() => {
    if (abortRef.current) return;
    const density = densityRef.current;
    if (!density) return;
    const BATCH = 50000;
    const mi = maxIter;

    for (let s = 0; s < BATCH; s++) {
      const cRe = Math.random() * 4 - 2;
      const cIm = Math.random() * 4 - 2;
      // Skip main cardioid + period-2 bulb
      const q = (cRe - 0.25) * (cRe - 0.25) + cIm * cIm;
      if (q * (q + (cRe - 0.25)) <= 0.25 * cIm * cIm) continue;
      if ((cRe + 1) * (cRe + 1) + cIm * cIm <= 0.0625) continue;

      let zr = 0, zi = 0, n = 0;
      let escaped = false;
      for (let i = 0; i < mi; i++) {
        const nr = zr * zr - zi * zi + cRe;
        zi = 2 * zr * zi + cIm;
        zr = nr;
        if (zr * zr + zi * zi > 4) { escaped = true; n = i + 1; break; }
      }
      if (!escaped) continue;

      // Replay orbit and accumulate into density buffer
      zr = 0; zi = 0;
      for (let i = 0; i < n; i++) {
        const nr = zr * zr - zi * zi + cRe;
        zi = 2 * zr * zi + cIm;
        zr = nr;
        const px = Math.floor((zr - xMin) / totalX * w);
        const py = Math.floor((yMax - zi) / totalY * h);
        if (px >= 0 && px < w && py >= 0 && py < h) density[py * w + px]++;
      }
    }

    setTotalSamples(prev => prev + BATCH);
    if (!abortRef.current) rafRef.current = requestAnimationFrame(runBatch);
  }, [w, h, maxIter, xMin, yMax, totalX, totalY]);

  useEffect(() => {
    if (isRunning) {
      abortRef.current = false;
      rafRef.current = requestAnimationFrame(runBatch);
    }
    return () => { abortRef.current = true; cancelAnimationFrame(rafRef.current); };
  }, [isRunning, runBatch]);

  const reset = useCallback(() => {
    abortRef.current = true;
    cancelAnimationFrame(rafRef.current);
    setIsRunning(false);
    densityRef.current = new Float32Array(w * h);
    setTotalSamples(0);
    const ctx2d = canvasRef.current?.getContext('2d');
    if (ctx2d) { ctx2d.fillStyle = '#000'; ctx2d.fillRect(0, 0, w, h); }
  }, [w, h]);

  return (
    <>
      <div className="controls" style={{ gridTemplateColumns: 'auto auto' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Rendering</span></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={`tab-btn ${isRunning ? 'active' : ''}`}
              onClick={() => setIsRunning(r => !r)}>
              {isRunning ? '⏸ Pause' : '▶ Start'}
            </button>
            <button className="tab-btn" onClick={reset}>↺ Reset</button>
          </div>
        </div>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Status</span></div>
          <div style={{ fontSize: 11, fontFamily: '"Share Tech Mono", monospace', color: 'var(--cyan)' }}>
            {totalSamples.toLocaleString()} Samples · {isRunning ? 'Läuft...' : 'Pausiert'}
          </div>
        </div>
      </div>
      <div className="canvas-wrap">
        <canvas ref={canvasRef} width={w} height={h}
          style={{ width: '100%', aspectRatio: '3/2', borderRadius: '4px',
            border: '1px solid rgba(0,212,255,0.1)', background: '#000' }} />
      </div>
      <div className="explanation">
        <h2>Buddhabrot</h2>
        <p>
          Das <strong>Buddhabrot</strong> (entdeckt von Melinda Green, 1993) visualisiert die <em>Trajektorien</em>
          aller Punkte, die aus der Mandelbrot-Menge <strong>entfliehen</strong>. Statt zu fragen „wie schnell entflieht c?",
          verfolgen wir den kompletten Orbit z₀ → z₁ → z₂ → … und zählen, wie oft jeder Pixel von einem Orbit
          durchlaufen wird. Das Ergebnis ist eine <strong>Dichteverteilung</strong>, die an eine
          meditierende Buddha-Figur erinnert.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: 12 }}>
          CPU-basiert · Progressives Rendering · Mehr Iterationen = feinere Strukturen (aber langsameres Sampling)
        </p>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */
type FractalType = 'mandelbrot' | 'julia' | 'burningship' | 'tricorn' | 'celtic' | 'buddhabrot';

const FRACTAL_CENTERS: Record<FractalType, [number, number]> = {
  mandelbrot: [-0.5, 0], julia: [0, 0],
  burningship: [-0.4, -0.5], tricorn: [-0.3, 0],
  celtic: [-0.5, 0], buddhabrot: [-0.5, 0],
};

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
  const [hueShift, setHueShift] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
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
  const [animSpeed, setAnimSpeed] = useState(30); // FPS playback
  const [animFrameCount, setAnimFrameCount] = useState(120);
  const [animReverse, setAnimReverse] = useState(false);

  // Offline render state
  const [renderProgress, setRenderProgress] = useState(-1); // -1=idle, 0..100=rendering
  const framesRef = useRef<ImageBitmap[]>([]);
  const [playIdx, setPlayIdx] = useState(-1); // -1=not playing
  const playRaf = useRef(0);
  const renderAbort = useRef(false);
  const autoZoomRef = useRef(0); // for Shift+Click smooth zoom animation

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
    const isMandel = fracArr !== 'julia';
    const formulaIdx = fracArr === 'burningship' ? 1 : fracArr === 'tricorn' ? 2 : fracArr === 'celtic' ? 3 : 0;
    const isDragging = dragRef.current.dragging;
    const useDirectMode = zoom < DIRECT_THRESHOLD || formulaIdx > 0;

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
    gl.uniform1i(uniforms.formula, formulaIdx);
    gl.uniform1i(uniforms.palette, palIdx);
    gl.uniform1f(uniforms.hueShift, hueShift);
    gl.uniform1f(uniforms.saturation, saturation / 100);
    gl.uniform1f(uniforms.brightness, brightness / 100);
    gl.uniform1f(uniforms.contrast, contrast / 100 * 2);

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
  }, [fracArr, maxIter, palIdx, juliaC, canvasSize, hueShift, saturation, brightness, contrast]);

  useEffect(() => { render(); }, [render]);

  // Offline render: pre-compute all frames
  const renderOffline = useCallback(async () => {
    if (!startWP || !endWP || !glRef.current) return;
    const g = glRef.current;
    const { gl, uniforms } = g;
    const cvs = canvasRef.current!;
    const w = cvs.width, h = cvs.height;
    const isMandel = fracArr !== 'julia';
    const formulaIdx = fracArr === 'burningship' ? 1 : fracArr === 'tricorn' ? 2 : fracArr === 'celtic' ? 3 : 0;
    const total = animFrameCount;

    // Free old frames
    framesRef.current.forEach(f => f.close());
    framesRef.current = [];
    setPlayIdx(-1);
    renderAbort.current = false;
    setRenderProgress(0);

    const logZoomA = Math.log(startWP.zoom);
    const logZoomB = Math.log(endWP.zoom);

    for (let f = 0; f < total; f++) {
      if (renderAbort.current) { setRenderProgress(-1); return; }

      const t = total <= 1 ? 0 : f / (total - 1);
      const s = t * t * (3 - 2 * t); // smoothstep

      const zoom = Math.exp(logZoomA + (logZoomB - logZoomA) * s);

      // Viewport-proportional center interpolation:
      // The offset from target must shrink with the viewport so the target
      // visually tracks towards screen center as we zoom in.
      // p = (z0/z - z0/z1) / (1 - z0/z1)  →  p=1 at start, p=0 at end
      let cRe: bigint, cIm: bigint;
      const zoomRatio = startWP.zoom / endWP.zoom;
      if (Math.abs(1 - zoomRatio) < 1e-6) {
        // Same zoom level → linear center interpolation
        const sFP = fpFrom(s);
        cRe = fpAdd(startWP.re, fpMul(fpSub(endWP.re, startWP.re), sFP));
        cIm = fpAdd(startWP.im, fpMul(fpSub(endWP.im, startWP.im), sFP));
      } else {
        const p = (startWP.zoom / zoom - zoomRatio) / (1 - zoomRatio);
        const pFP = fpFrom(Math.max(0, Math.min(1, p)));
        cRe = fpAdd(endWP.re, fpMul(fpSub(startWP.re, endWP.re), pFP));
        cIm = fpAdd(endWP.im, fpMul(fpSub(startWP.im, endWP.im), pFP));
      }

      const pixelSpan = 3 / zoom;
      const aspect = w / h;
      const useDirectMode = zoom < DIRECT_THRESHOLD || formulaIdx > 0;

      gl.viewport(0, 0, w, h);

      if (useDirectMode) {
        gl.uniform1i(uniforms.mode, 0);
        gl.uniform2f(uniforms.center, fpToFloat(cRe), fpToFloat(cIm));
        gl.uniform2f(uniforms.viewOffset, 0, 0);
      } else {
        gl.uniform1i(uniforms.mode, 1);
        const orbit = computeRefOrbit(
          cRe, cIm, maxIter, isMandel,
          isMandel ? undefined : fpFrom(juliaC.re),
          isMandel ? undefined : fpFrom(juliaC.im),
        );
        uploadOrbit(g, orbit);
        gl.uniform2f(uniforms.center, fpToFloat(cRe), fpToFloat(cIm));
        gl.uniform2f(uniforms.viewOffset, 0, 0);
        gl.uniform2f(uniforms.orbitSize, g.orbitTexW, g.orbitTexH);
        gl.uniform1i(uniforms.refLen, orbit.len);
      }

      gl.uniform2f(uniforms.resolution, w, h);
      gl.uniform1f(uniforms.pixelSpan, pixelSpan);
      gl.uniform1f(uniforms.aspect, aspect);
      gl.uniform1i(uniforms.maxIter, maxIter);
      gl.uniform1i(uniforms.fractal, isMandel ? 0 : 1);
      gl.uniform1i(uniforms.formula, formulaIdx);
      gl.uniform1i(uniforms.palette, palIdx);
      gl.uniform2f(uniforms.juliaC, juliaC.re, juliaC.im);
      gl.uniform1f(uniforms.hueShift, hueShift);
      gl.uniform1f(uniforms.saturation, saturation / 100);
      gl.uniform1f(uniforms.brightness, brightness / 100);
      gl.uniform1f(uniforms.contrast, contrast / 100 * 2);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.finish(); // ensure GPU is done

      // Capture frame
      const bmp = await createImageBitmap(cvs);
      framesRef.current.push(bmp);

      setRenderProgress(Math.round(((f + 1) / total) * 100));

      // Yield to UI thread every frame
      await new Promise(r => setTimeout(r, 0));
    }

    setRenderProgress(-1);
  }, [startWP, endWP, animFrameCount, fracArr, maxIter, palIdx, juliaC, canvasSize, hueShift, saturation, brightness, contrast]);

  // Playback loop
  useEffect(() => {
    if (playIdx < 0) return;
    const frames = framesRef.current;
    if (!frames.length) { setPlayIdx(-1); return; }
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx2d = cvs.getContext('2d');
    // Can't get 2d context if webgl is active — draw via HUD overlay instead
    const hud = hudRef.current;
    if (!hud) return;
    const hCtx = hud.getContext('2d');
    if (!hCtx) return;

    const interval = 1000 / animSpeed;
    let idx = animReverse ? frames.length - 1 : 0;
    let last = performance.now();

    const step = (now: number) => {
      if (now - last >= interval) {
        last = now;
        hCtx.clearRect(0, 0, hud.width, hud.height);
        hCtx.drawImage(frames[idx], 0, 0, hud.width, hud.height);
        // HUD bar
        hCtx.fillStyle = 'rgba(0,10,20,0.6)';
        hCtx.fillRect(0, 0, hud.width, 24);
        hCtx.font = '11px "Share Tech Mono", monospace';
        hCtx.fillStyle = '#00d4ff';
        hCtx.textBaseline = 'middle';
        hCtx.fillText(`▶ Frame ${idx + 1}/${frames.length}  |  ${animSpeed} FPS`, 8, 12);

        if (animReverse) { idx--; if (idx < 0) { setPlayIdx(-1); return; } }
        else { idx++; if (idx >= frames.length) { setPlayIdx(-1); return; } }
      }
      playRaf.current = requestAnimationFrame(step);
    };
    playRaf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(playRaf.current);
  }, [playIdx, animSpeed, animReverse]);

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
      if (e.shiftKey) {
        // ── Shift+Click: smooth auto-zoom to click position ──
        e.preventDefault();
        cancelAnimationFrame(autoZoomRef.current);
        const r = rect();
        const mx = (e.clientX - r.left) / r.width;
        const my = (e.clientY - r.top) / r.height;
        const aspect = cvs.width / cvs.height;
        const zoom = zoomRef.current;
        const pixelSpan = 3 / zoom;

        // Target world coordinate
        const targetRe = fpAdd(bigCenter.current.re, fpFrom((mx - 0.5) * pixelSpan * aspect));
        const targetIm = fpAdd(bigCenter.current.im, fpFrom((my - 0.5) * pixelSpan));
        const targetZoom = zoom * 8;

        const startRe = bigCenter.current.re;
        const startIm = bigCenter.current.im;
        const startZoom = zoom;
        const duration = 800;
        const startTime = performance.now();

        const step = (now: number) => {
          const t = Math.min((now - startTime) / duration, 1);
          const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          zoomRef.current = startZoom * Math.pow(targetZoom / startZoom, ease);
          bigCenter.current.re = fpAdd(startRe, fpMul(fpSub(targetRe, startRe), fpFrom(ease)));
          bigCenter.current.im = fpAdd(startIm, fpMul(fpSub(targetIm, startIm), fpFrom(ease)));
          kick();
          render();
          if (t < 1) autoZoomRef.current = requestAnimationFrame(step);
        };
        autoZoomRef.current = requestAnimationFrame(step);
        return;
      }
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
      const [cx, cy] = FRACTAL_CENTERS[fracArr] || [-0.5, 0];
      bigCenter.current = { re: fpFrom(cx), im: fpFrom(cy) };
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
      cancelAnimationFrame(autoZoomRef.current);
      cvs.removeEventListener('wheel', onWheel);
      cvs.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      cvs.removeEventListener('dblclick', onDbl);
    };
  }, [render, fracArr]);

  const switchFrac = (f: FractalType) => {
    setFrac(f);
    const [cx, cy] = FRACTAL_CENTERS[f];
    bigCenter.current = { re: fpFrom(cx), im: fpFrom(cy) };
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
      <p className="subtitle">Mandelbrot, Julia, Burning Ship, Tricorn, Celtic & Buddhabrot — GPU-beschleunigt</p>

      <div className="controls" style={{ gridTemplateColumns: 'auto auto auto auto auto' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Fraktal</span></div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([
              ['mandelbrot', 'Mandelbrot'], ['julia', 'Julia'],
              ['burningship', 'Burning Ship'], ['tricorn', 'Tricorn'],
              ['celtic', 'Celtic'], ['buddhabrot', 'Buddhabrot'],
            ] as [FractalType, string][]).map(([f, label]) => (
              <button key={f} className={`tab-btn ${fracArr === f ? 'active' : ''}`}
                onClick={() => switchFrac(f)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Iterationen</span>
            <span className="ctrl-value">{maxIter}</span>
          </div>
          <input type="range" min={30} max={50000} step={10} value={maxIter} onChange={e => setMaxIter(+e.target.value)} />
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
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Farbton</span>
            <span className="ctrl-value">{hueShift}°</span>
          </div>
          <input type="range" min={0} max={360} step={1} value={hueShift} onChange={e => setHueShift(+e.target.value)} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Sättigung</span>
            <span className="ctrl-value">{saturation}%</span>
          </div>
          <input type="range" min={0} max={200} step={1} value={saturation} onChange={e => setSaturation(+e.target.value)} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Helligkeit</span>
            <span className="ctrl-value">{brightness}%</span>
          </div>
          <input type="range" min={0} max={200} step={1} value={brightness} onChange={e => setBrightness(+e.target.value)} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Kontrast</span>
            <span className="ctrl-value">{contrast}%</span>
          </div>
          <input type="range" min={0} max={200} step={1} value={contrast} onChange={e => setContrast(+e.target.value)} />
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

      {/* Buddhabrot renderer */}
      {fracArr === 'buddhabrot' && (
        <BuddhabrotVis maxIter={maxIter} palIdx={palIdx} canvasSize={canvasSize} />
      )}

      {/* Animation controls */}
      {fracArr !== 'buddhabrot' && <div className="controls" style={{ gridTemplateColumns: 'auto auto auto auto auto' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Waypoints</span></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={`tab-btn${startWP ? ' active' : ''}`}
              disabled={renderProgress >= 0}
              onClick={() => {
                setStartWP({ re: bigCenter.current.re, im: bigCenter.current.im, zoom: zoomRef.current });
                framesRef.current.forEach(f => f.close());
                framesRef.current = [];
                setPlayIdx(-1);
              }}>
              📍 Start
            </button>
            <button className={`tab-btn${endWP ? ' active' : ''}`}
              disabled={renderProgress >= 0}
              onClick={() => {
                setEndWP({ re: bigCenter.current.re, im: bigCenter.current.im, zoom: zoomRef.current });
                framesRef.current.forEach(f => f.close());
                framesRef.current = [];
                setPlayIdx(-1);
              }}>
              🏁 Ziel
            </button>
          </div>
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Frames</span>
            <span className="ctrl-value">{animFrameCount}</span>
          </div>
          <input type="range" min={30} max={600} step={10} value={animFrameCount}
            disabled={renderProgress >= 0}
            onChange={e => setAnimFrameCount(+e.target.value)} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">FPS</span>
            <span className="ctrl-value">{animSpeed}</span>
          </div>
          <input type="range" min={5} max={60} step={1} value={animSpeed}
            onChange={e => setAnimSpeed(+e.target.value)} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Rendern / Abspielen</span></div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {renderProgress >= 0 ? (
              <button className="tab-btn active" onClick={() => { renderAbort.current = true; }}>
                ⏹ Abbrechen ({renderProgress}%)
              </button>
            ) : (
              <button className="tab-btn"
                disabled={!startWP || !endWP}
                onClick={renderOffline}>
                🎬 Rendern
              </button>
            )}
            <button className="tab-btn"
              disabled={framesRef.current.length === 0 || renderProgress >= 0}
              onClick={() => setPlayIdx(p => p >= 0 ? -1 : 0)}>
              {playIdx >= 0 ? '⏸ Stop' : '▶ Play'}
            </button>
            <button className={`tab-btn${animReverse ? ' active' : ''}`}
              disabled={framesRef.current.length === 0}
              onClick={() => setAnimReverse(r => !r)}>
              {animReverse ? '◀ Rückwärts' : '▶ Vorwärts'}
            </button>
          </div>
        </div>
        {(startWP || endWP || framesRef.current.length > 0) && (
          <div className="ctrl">
            <div className="ctrl-header"><span className="ctrl-label">Status</span></div>
            <div style={{ fontSize: 11, fontFamily: '"Share Tech Mono", monospace', color: 'var(--cyan)' }}>
              {startWP && <div>Start: {fmtZoom(startWP.zoom)}</div>}
              {endWP && <div>Ziel: {fmtZoom(endWP.zoom)}</div>}
              {framesRef.current.length > 0 && <div>{framesRef.current.length} Frames bereit</div>}
              {renderProgress >= 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ background: 'rgba(0,212,255,0.15)', borderRadius: 3, height: 6, width: '100%' }}>
                    <div style={{ background: 'var(--cyan)', borderRadius: 3, height: 6, width: `${renderProgress}%`, transition: 'width 0.2s' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>}

      <div className="canvas-wrap" style={{ position: 'relative', cursor: 'grab', display: fracArr === 'buddhabrot' ? 'none' : undefined }}>
        <canvas ref={canvasRef} width={canvasSize.w} height={canvasSize.h}
          style={{ width: '100%', aspectRatio: '3/2', borderRadius: '4px', border: '1px solid rgba(0,212,255,0.1)' }} />
        <canvas ref={hudRef} width={canvasSize.w} height={canvasSize.h}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', aspectRatio: '3/2', pointerEvents: 'none', borderRadius: '4px' }} />
      </div>

      {fracArr !== 'buddhabrot' && <div className="explanation">
        <h2>Fraktal-Typen</h2>
        <p>
          <strong>Mandelbrot</strong> — z<sub>n+1</sub> = z<sub>n</sub>² + c mit z₀ = 0. Verwendet Perturbation Theory
          für Deep-Zoom (bis ~10<sup>38</sup>x) mit 128-Bit BigInt Referenz-Orbits.
        </p>
        <p>
          <strong>Julia</strong> — z<sub>n+1</sub> = z<sub>n</sub>² + c, wobei c fest ist und z₀ über die Ebene variiert.
          Jeder Punkt der Mandelbrot-Menge erzeugt eine einzigartige Julia-Menge.
        </p>
        <p>
          <strong>Burning Ship</strong> — z<sub>n+1</sub> = (|Re(z<sub>n</sub>)| + i|Im(z<sub>n</sub>)|)² + c.
          Durch die Betragsbildung entsteht eine schiffsrumpf-ähnliche Form mit dramatischen Strukturen.
        </p>
        <p>
          <strong>Tricorn</strong> — z<sub>n+1</sub> = z̄<sub>n</sub>² + c
          (konjugiertes z). Auch als „Mandelbar" bekannt — erzeugt dreizackige Symmetrien.
        </p>
        <p>
          <strong>Celtic</strong> — z<sub>n+1</sub> = |Re(z<sub>n</sub>²)| + i·Im(z<sub>n</sub>²) + c.
          Die Betragsbildung auf den Realteil von z² erzeugt keltisch anmutende Muster.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: 12 }}>
          GPU + BigInt ⚡ · Scrollen = Zoom · Ziehen = Verschieben · Doppelklick = Reset ·
          Deep-Zoom (Perturbation) nur für Mandelbrot & Julia
        </p>
      </div>}
    </>
  );
};
