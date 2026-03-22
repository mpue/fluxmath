import React, { useState, useCallback } from 'react';
import { CoordinateSystem, Viewport } from '../../../shared/CoordinateSystem';
import { drawCurve, drawPoint, C, fmt } from '../../../shared/canvasUtils';

/* ── reuse math parser from Funktionsplotter ─────────── */
const MATH_FNS: Record<string, (x: number) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  sqrt: Math.sqrt, cbrt: Math.cbrt,
  abs: Math.abs, sign: Math.sign,
  ln: Math.log, log: Math.log10, log2: Math.log2,
  exp: Math.exp, floor: Math.floor, ceil: Math.ceil, round: Math.round,
};
const CONSTANTS: Record<string, number> = { pi: Math.PI, PI: Math.PI, e: Math.E, E: Math.E };

function tokenize(expr: string): string[] {
  const re = /(\d+\.?\d*(?:[eE][+-]?\d+)?|[a-zA-Z_]\w*|[+\-*/^(),|]|\s+)/g;
  const tokens: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(expr)) !== null) { const t = m[1].trim(); if (t) tokens.push(t); }
  return tokens;
}
type Expr = { type: 'num'; v: number } | { type: 'var' } | { type: 'un'; op: string; arg: Expr }
  | { type: 'bin'; op: string; l: Expr; r: Expr } | { type: 'call'; fn: string; arg: Expr };

class Parser {
  tokens: string[]; pos = 0;
  constructor(tokens: string[]) { this.tokens = tokens; }
  peek() { return this.tokens[this.pos] ?? ''; }
  next() { return this.tokens[this.pos++] ?? ''; }
  expect(t: string) { if (this.next() !== t) throw new Error(`Erwartet: ${t}`); }
  parse(): Expr { const e = this.expr(); if (this.pos < this.tokens.length) throw new Error('Unerwartet: ' + this.peek()); return e; }
  expr(): Expr { return this.addSub(); }
  addSub(): Expr { let l = this.mulDiv(); while (this.peek() === '+' || this.peek() === '-') { const op = this.next(); l = { type: 'bin', op, l, r: this.mulDiv() }; } return l; }
  mulDiv(): Expr {
    let l = this.unary();
    while (this.peek() === '*' || this.peek() === '/') { const op = this.next(); l = { type: 'bin', op, l, r: this.unary() }; }
    while (this.pos < this.tokens.length) { const p = this.peek(); if (p === '(' || /^[a-zA-Z_]/.test(p) || /^\d/.test(p)) { if ('+-*/^),'.includes(p)) break; l = { type: 'bin', op: '*', l, r: this.unary() }; } else break; }
    return l;
  }
  unary(): Expr { if (this.peek() === '-') { this.next(); return { type: 'un', op: '-', arg: this.power() }; } if (this.peek() === '+') this.next(); return this.power(); }
  power(): Expr { let l = this.atom(); if (this.peek() === '^') { this.next(); l = { type: 'bin', op: '^', l, r: this.unary() }; } return l; }
  atom(): Expr {
    const t = this.peek();
    if (/^\d/.test(t)) return { type: 'num', v: parseFloat(this.next()) };
    if (t === '(') { this.next(); const e = this.expr(); this.expect(')'); return e; }
    if (t === '|') { this.next(); const e = this.expr(); this.expect('|'); return { type: 'call', fn: 'abs', arg: e }; }
    if (/^[a-zA-Z_]/.test(t)) {
      const name = this.next();
      if (name === 'x' || name === 'X') return { type: 'var' };
      if (name in CONSTANTS) return { type: 'num', v: CONSTANTS[name] };
      if (name in MATH_FNS) { if (this.peek() === '(') { this.next(); const arg = this.expr(); this.expect(')'); return { type: 'call', fn: name, arg }; } return { type: 'call', fn: name, arg: this.power() }; }
      throw new Error(`Unbekannt: ${name}`);
    }
    throw new Error(`Unerwartet: ${t || 'Ende'}`);
  }
}
function evaluate(ast: Expr, x: number): number {
  switch (ast.type) {
    case 'num': return ast.v; case 'var': return x; case 'un': return -evaluate(ast.arg, x);
    case 'call': return MATH_FNS[ast.fn](evaluate(ast.arg, x));
    case 'bin': { const l = evaluate(ast.l, x), r = evaluate(ast.r, x);
      switch (ast.op) { case '+': return l + r; case '-': return l - r; case '*': return l * r; case '/': return l / r; case '^': return Math.pow(l, r); } }
  }
  return NaN;
}
function compileExpr(expr: string): ((x: number) => number) | string {
  try { const tokens = tokenize(expr); if (!tokens.length) return 'Leerer Ausdruck'; const ast = new Parser(tokens).parse(); return (x: number) => evaluate(ast, x); }
  catch (e: any) { return e.message || 'Parserfehler'; }
}

/* ── numerical analysis ──────────────────────────────── */
const H = 1e-6;
function numDeriv(f: (x: number) => number, x: number): number { return (f(x + H) - f(x - H)) / (2 * H); }
function numDeriv2(f: (x: number) => number, x: number): number { return (f(x + H) - 2 * f(x) + f(x - H)) / (H * H); }

function findRoots(g: (x: number) => number, xMin: number, xMax: number): number[] {
  const roots: number[] = [];
  const step = 0.02;
  let prev = g(xMin);
  for (let x = xMin + step; x <= xMax; x += step) {
    const cur = g(x);
    if (prev * cur < 0) {
      let lo = x - step, hi = x;
      for (let k = 0; k < 50; k++) { const mid = (lo + hi) / 2; if (g(lo) * g(mid) < 0) hi = mid; else lo = mid; }
      const r = (lo + hi) / 2;
      if (!roots.some(rr => Math.abs(rr - r) < 0.001)) roots.push(r);
    }
    prev = cur;
  }
  return roots.sort((a, b) => a - b);
}

interface AnalysisResult {
  zeros: number[];
  extrema: { x: number; y: number; type: 'max' | 'min' }[];
  inflections: { x: number; y: number }[];
  yIntercept: number;
  symmetry: 'gerade' | 'ungerade' | 'keine';
  monotoneIntervals: string[];
  concavityIntervals: string[];
}

function analyzeFunction(f: (x: number) => number, range = 15): AnalysisResult {
  const xMin = -range, xMax = range;

  // Zeros
  const zeros = findRoots(f, xMin, xMax);

  // Y-intercept
  const yIntercept = f(0);

  // Extrema: f'(x) = 0
  const fp = (x: number) => numDeriv(f, x);
  const criticals = findRoots(fp, xMin, xMax);
  const extrema = criticals.map(x => {
    const y = f(x);
    const d2 = numDeriv2(f, x);
    return { x, y, type: (d2 < -1e-4 ? 'max' : 'min') as 'max' | 'min' };
  }).filter(e => isFinite(e.y));

  // Inflections: f''(x) = 0
  const fpp = (x: number) => numDeriv2(f, x);
  const inflRoots = findRoots(fpp, xMin, xMax);
  const inflections = inflRoots
    .filter(x => {
      // verify sign change in f''
      const left = fpp(x - 0.05);
      const right = fpp(x + 0.05);
      return left * right < 0;
    })
    .map(x => ({ x, y: f(x) }))
    .filter(p => isFinite(p.y));

  // Symmetry check
  let sym: 'gerade' | 'ungerade' | 'keine' = 'keine';
  let isEven = true, isOdd = true;
  for (let x = 0.1; x <= 5; x += 0.3) {
    const fx = f(x), fmx = f(-x);
    if (Math.abs(fx - fmx) > 0.001) isEven = false;
    if (Math.abs(fx + fmx) > 0.001) isOdd = false;
  }
  if (isEven) sym = 'gerade';
  else if (isOdd) sym = 'ungerade';

  // Monotone intervals
  const monotoneIntervals: string[] = [];
  const testPoints = [-range, ...criticals, range];
  for (let i = 0; i < testPoints.length - 1; i++) {
    const mid = (testPoints[i] + testPoints[i + 1]) / 2;
    const d = fp(mid);
    const a = fmt(testPoints[i], 2);
    const b = fmt(testPoints[i + 1], 2);
    monotoneIntervals.push(`(${a}, ${b}): ${d > 0 ? '↑ steigend' : '↓ fallend'}`);
  }

  // Concavity intervals
  const concavityIntervals: string[] = [];
  const inflPoints = [-range, ...inflRoots, range];
  for (let i = 0; i < inflPoints.length - 1; i++) {
    const mid = (inflPoints[i] + inflPoints[i + 1]) / 2;
    const d2 = fpp(mid);
    const a = fmt(inflPoints[i], 2);
    const b = fmt(inflPoints[i + 1], 2);
    concavityIntervals.push(`(${a}, ${b}): ${d2 > 0 ? '∪ konvex' : '∩ konkav'}`);
  }

  return { zeros, extrema, inflections, yIntercept, symmetry: sym, monotoneIntervals, concavityIntervals };
}

/* ── Component ───────────────────────────────────────── */
export const KurvendiskussionTool: React.FC = () => {
  const [expr, setExpr] = useState('x^3 - 3x + 1');

  const compiled = compileExpr(expr);
  const fn = typeof compiled === 'function' ? compiled : null;
  const err = typeof compiled === 'string' ? compiled : null;

  const analysis = fn ? analyzeFunction(fn) : null;

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, my: number) => {
    if (!fn) return '';

    drawCurve(ctx, vp, fn, C.line, C.lineGlow);

    // Draw zeros
    if (analysis) {
      for (const z of analysis.zeros) {
        const px = vp.toX(z), py = vp.toY(0);
        if (px > -20 && px < vp.w + 20) {
          drawPoint(ctx, px, py, C.zero, C.zeroGlow);
          ctx.font = '10px "Share Tech Mono", monospace'; ctx.fillStyle = C.zeroLabel;
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText(`(${fmt(z, 2)}|0)`, px, py + 10);
        }
      }

      // Extrema
      for (const e of analysis.extrema) {
        const px = vp.toX(e.x), py = vp.toY(e.y);
        if (px > -20 && px < vp.w + 20 && py > -20 && py < vp.h + 20) {
          const color = e.type === 'max' ? C.orange : C.lime;
          const glow = e.type === 'max' ? C.orangeGlow : C.limeGlow;
          drawPoint(ctx, px, py, color, glow);
          ctx.font = '10px "Share Tech Mono", monospace'; ctx.fillStyle = color;
          ctx.textAlign = 'center'; ctx.textBaseline = e.type === 'max' ? 'bottom' : 'top';
          ctx.fillText(`${e.type === 'max' ? 'MAX' : 'MIN'} (${fmt(e.x, 2)}|${fmt(e.y, 2)})`, px, py + (e.type === 'max' ? -10 : 10));
        }
      }

      // Inflections
      for (const p of analysis.inflections) {
        const px = vp.toX(p.x), py = vp.toY(p.y);
        if (px > -20 && px < vp.w + 20 && py > -20 && py < vp.h + 20) {
          drawPoint(ctx, px, py, C.magenta, C.magentaGlow);
          ctx.font = '10px "Share Tech Mono", monospace'; ctx.fillStyle = C.magenta;
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.fillText(`WP (${fmt(p.x, 2)}|${fmt(p.y, 2)})`, px, py - 10);
        }
      }

      // Y-intercept
      const yPx = vp.toX(0), yPy = vp.toY(analysis.yIntercept);
      if (yPx > -20 && yPx < vp.w + 20 && yPy > -20 && yPy < vp.h + 20) {
        drawPoint(ctx, yPx, yPy, C.yint, C.yintGlow);
        ctx.font = '10px "Share Tech Mono", monospace'; ctx.fillStyle = C.yintLabel;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(`(0|${fmt(analysis.yIntercept, 2)})`, yPx + 10, yPy);
      }
    }

    // Derivative curve (faint)
    const fp = (x: number) => numDeriv(fn, x);
    ctx.setLineDash([4, 4]);
    drawCurve(ctx, vp, fp, 'rgba(255,170,0,0.4)', 'rgba(255,170,0,0.15)');
    ctx.setLineDash([]);

    if (mx >= 0) {
      const mathX = vp.toMathX(mx);
      const fVal = fn(mathX);
      const fPrime = numDeriv(fn, mathX);
      const snapY = vp.toY(fVal);
      if (snapY > 0 && snapY < vp.h) {
        ctx.beginPath(); ctx.arc(mx, snapY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,212,255,0.6)'; ctx.fill();
      }
      return `x: ${mathX.toFixed(2)}   f(x) = ${fmt(fVal, 3)}   f'(x) = ${fmt(fPrime, 3)}`;
    }
    return '';
  }, [fn, analysis]);

  return (
    <>
      <div className="header-eyebrow">Tools <span>// Kurvendiskussion</span></div>
      <h1>Kurven<em>diskussion</em></h1>
      <p className="subtitle">Funktion eingeben — automatische Analyse aller Eigenschaften</p>

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Funktion f(x)</span>
            {err && <span className="ctrl-value" style={{ color: '#ff4466', fontSize: 10 }}>{err}</span>}
          </div>
          <input
            type="text" value={expr} onChange={e => setExpr(e.target.value)}
            placeholder="z.B. x^3 - 3x + 1" spellCheck={false}
            style={{
              width: '100%', boxSizing: 'border-box' as const,
              background: 'rgba(0,212,255,0.03)',
              border: '1px solid ' + (err ? 'rgba(255,68,102,0.3)' : 'rgba(0,212,255,0.1)'),
              borderRadius: '2px', padding: '12px 14px', color: 'var(--text)',
              fontFamily: '"Share Tech Mono", monospace', fontSize: '14px',
              letterSpacing: '.04em', outline: 'none',
            }}
          />
        </div>
      </div>

      {fn && <CoordinateSystem draw={draw} />}

      {analysis && (
        <>
          <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="info-card zero">
              <div className="label">Nullstellen</div>
              {analysis.zeros.length === 0 ? <div className="detail">Keine im Bereich</div> :
                analysis.zeros.map((z, i) => <div key={i} className="value" style={{ fontSize: 14 }}>x{analysis.zeros.length > 1 ? '₁₂₃₄₅'[i] : ''} = {fmt(z, 4)}</div>)
              }
            </div>
            <div className="info-card slope">
              <div className="label">Extremstellen</div>
              {analysis.extrema.length === 0 ? <div className="detail">Keine gefunden</div> :
                analysis.extrema.map((e, i) => (
                  <div key={i} className="value" style={{ fontSize: 13 }}>
                    {e.type === 'max' ? '▲ Max' : '▼ Min'}: ({fmt(e.x, 3)} | {fmt(e.y, 3)})
                  </div>
                ))
              }
            </div>
            <div className="info-card eq">
              <div className="label">Wendepunkte</div>
              {analysis.inflections.length === 0 ? <div className="detail">Keine gefunden</div> :
                analysis.inflections.map((p, i) => (
                  <div key={i} className="value" style={{ fontSize: 13 }}>
                    WP: ({fmt(p.x, 3)} | {fmt(p.y, 3)})
                  </div>
                ))
              }
            </div>
          </div>

          <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="info-card eq">
              <div className="label">y-Achsenabschnitt</div>
              <div className="value">f(0) = {fmt(analysis.yIntercept, 4)}</div>
            </div>
            <div className="info-card slope">
              <div className="label">Symmetrie</div>
              <div className="value">{
                analysis.symmetry === 'gerade' ? 'Achsensymmetrisch (y-Achse)' :
                analysis.symmetry === 'ungerade' ? 'Punktsymmetrisch (Ursprung)' :
                'Keine erkennbare Symmetrie'
              }</div>
            </div>
            <div className="info-card zero">
              <div className="label">Monotonie</div>
              {analysis.monotoneIntervals.map((s, i) => <div key={i} className="detail">{s}</div>)}
            </div>
          </div>

          <div className="info-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="info-card eq">
              <div className="label">Krümmungsverhalten</div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 12 }}>
                {analysis.concavityIntervals.map((s, i) => <div key={i} className="detail">{s}</div>)}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />f(x)</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />f'(x) (gestrichelt)</div>
        <div className="legend-item"><div className="legend-dot glow-red" />Nullstellen</div>
        <div className="legend-item"><div className="legend-dot glow-lime" />Minima</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: C.orange, boxShadow: `0 0 8px ${C.orangeGlow}` }} />Maxima</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: C.magenta, boxShadow: `0 0 8px ${C.magentaGlow}` }} />Wendepunkte</div>
      </div>

      <div className="explanation">
        <h2>Automatische Kurvendiskussion</h2>
        <p>
          Gib eine beliebige Funktion ein. Das Tool berechnet automatisch:
          <strong> Nullstellen</strong>, <strong>Extrema</strong> (Hoch- und Tiefpunkte),
          <strong> Wendepunkte</strong>, <strong>Symmetrie</strong>, <strong>Monotonie</strong> und <strong>Krümmung</strong>.
        </p>
        <p>
          Die gestrichelte Kurve zeigt die <strong>Ableitung f'(x)</strong>. Alle Berechnungen erfolgen numerisch.
        </p>
      </div>
    </>
  );
};
