import React, { useState, useCallback, useRef } from 'react';
import { CoordinateSystem, Viewport } from '../../../shared/CoordinateSystem';
import { drawCurve, C, fmt } from '../../../shared/canvasUtils';

/* ── safe math parser ──────────────────────────────────── */
const MATH_FNS: Record<string, (x: number) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  sqrt: Math.sqrt, cbrt: Math.cbrt,
  abs: Math.abs, sign: Math.sign,
  ln: Math.log, log: Math.log10, log2: Math.log2,
  exp: Math.exp, floor: Math.floor, ceil: Math.ceil, round: Math.round,
};

const CONSTANTS: Record<string, number> = {
  pi: Math.PI, PI: Math.PI, e: Math.E, E: Math.E,
};

/** Tokenise a math expression into numbers, identifiers, operators, parens */
function tokenize(expr: string): string[] {
  const re = /(\d+\.?\d*(?:[eE][+-]?\d+)?|[a-zA-Z_]\w*|[+\-*/^(),|]|\s+)/g;
  const tokens: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(expr)) !== null) {
    const t = m[1].trim();
    if (t) tokens.push(t);
  }
  return tokens;
}

type Expr = { type: 'num'; v: number }
  | { type: 'var' }
  | { type: 'un'; op: string; arg: Expr }
  | { type: 'bin'; op: string; l: Expr; r: Expr }
  | { type: 'call'; fn: string; arg: Expr };

class Parser {
  tokens: string[];
  pos = 0;
  constructor(tokens: string[]) { this.tokens = tokens; }
  peek() { return this.tokens[this.pos] ?? ''; }
  next() { return this.tokens[this.pos++] ?? ''; }
  expect(t: string) { if (this.next() !== t) throw new Error(`Erwartet: ${t}`); }

  parse(): Expr {
    const e = this.expr();
    if (this.pos < this.tokens.length) throw new Error('Unerwartetes Zeichen: ' + this.peek());
    return e;
  }

  expr(): Expr { return this.addSub(); }

  addSub(): Expr {
    let l = this.mulDiv();
    while (this.peek() === '+' || this.peek() === '-') {
      const op = this.next();
      l = { type: 'bin', op, l, r: this.mulDiv() };
    }
    return l;
  }

  mulDiv(): Expr {
    let l = this.unary();
    while (this.peek() === '*' || this.peek() === '/') {
      const op = this.next();
      l = { type: 'bin', op, l, r: this.unary() };
    }
    // implicit multiplication: 2x, 2sin(x), etc.
    while (this.pos < this.tokens.length) {
      const p = this.peek();
      if (p === '(' || /^[a-zA-Z_]/.test(p) || /^\d/.test(p)) {
        // Check it's not an operator
        if (p === '+' || p === '-' || p === '*' || p === '/' || p === '^' || p === ')' || p === ',') break;
        l = { type: 'bin', op: '*', l, r: this.unary() };
      } else break;
    }
    return l;
  }

  unary(): Expr {
    if (this.peek() === '-') {
      this.next();
      return { type: 'un', op: '-', arg: this.power() };
    }
    if (this.peek() === '+') { this.next(); }
    return this.power();
  }

  power(): Expr {
    let l = this.atom();
    if (this.peek() === '^') {
      this.next();
      l = { type: 'bin', op: '^', l, r: this.unary() };
    }
    return l;
  }

  atom(): Expr {
    const t = this.peek();
    // number
    if (/^\d/.test(t)) {
      return { type: 'num', v: parseFloat(this.next()) };
    }
    // parenthesised
    if (t === '(') {
      this.next();
      const e = this.expr();
      this.expect(')');
      return e;
    }
    // |x| absolute value
    if (t === '|') {
      this.next();
      const e = this.expr();
      this.expect('|');
      return { type: 'call', fn: 'abs', arg: e };
    }
    // identifier: function call, constant, or variable
    if (/^[a-zA-Z_]/.test(t)) {
      const name = this.next();
      if (name === 'x' || name === 'X') return { type: 'var' };
      if (name in CONSTANTS) return { type: 'num', v: CONSTANTS[name] };
      if (name in MATH_FNS) {
        // allow fn(x) or fn x
        if (this.peek() === '(') {
          this.next();
          const arg = this.expr();
          this.expect(')');
          return { type: 'call', fn: name, arg };
        }
        return { type: 'call', fn: name, arg: this.power() };
      }
      throw new Error(`Unbekannt: ${name}`);
    }
    throw new Error(`Unerwartetes Zeichen: ${t || 'Ende'}`);
  }
}

function evaluate(ast: Expr, x: number): number {
  switch (ast.type) {
    case 'num': return ast.v;
    case 'var': return x;
    case 'un': return -evaluate(ast.arg, x);
    case 'call': return MATH_FNS[ast.fn](evaluate(ast.arg, x));
    case 'bin': {
      const l = evaluate(ast.l, x), r = evaluate(ast.r, x);
      switch (ast.op) {
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/': return l / r;
        case '^': return Math.pow(l, r);
      }
    }
  }
  return NaN;
}

function compileExpr(expr: string): ((x: number) => number) | string {
  try {
    const tokens = tokenize(expr);
    if (tokens.length === 0) return 'Leerer Ausdruck';
    const ast = new Parser(tokens).parse();
    return (x: number) => evaluate(ast, x);
  } catch (e: any) {
    return e.message || 'Parserfehler';
  }
}

/* ── colours per slot ─────────────────────────────────── */
const SLOT_COLORS = [
  { line: C.line, glow: C.lineGlow },
  { line: C.magenta, glow: C.magentaGlow },
  { line: C.orange, glow: C.orangeGlow },
  { line: C.lime, glow: C.limeGlow },
  { line: C.purple, glow: C.purpleGlow },
];

const SLOT_LABELS = ['f(x)', 'g(x)', 'h(x)', 'p(x)', 'q(x)'];

interface FnSlot {
  expr: string;
  color: { line: string; glow: string };
}

export const Funktionsplotter: React.FC = () => {
  const [slots, setSlots] = useState<FnSlot[]>([
    { expr: 'sin(x)', color: SLOT_COLORS[0] },
  ]);
  const compiledRef = useRef<((x: number) => number)[]>([]);

  // Compile all expressions
  const compiled: { fn: ((x: number) => number) | null; err: string | null }[] = slots.map(s => {
    if (!s.expr.trim()) return { fn: null, err: null };
    const result = compileExpr(s.expr);
    if (typeof result === 'string') return { fn: null, err: result };
    return { fn: result, err: null };
  });
  compiledRef.current = compiled.map(c => c.fn!).filter(Boolean);

  const setExpr = (idx: number, expr: string) => {
    setSlots(prev => {
      const n = [...prev];
      n[idx] = { ...n[idx], expr };
      return n;
    });
  };

  const addSlot = () => {
    if (slots.length >= 5) return;
    setSlots(prev => [...prev, { expr: '', color: SLOT_COLORS[prev.length % SLOT_COLORS.length] }]);
  };

  const removeSlot = (idx: number) => {
    if (slots.length <= 1) return;
    setSlots(prev => prev.filter((_, i) => i !== idx));
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, my: number) => {
    // Draw each compiled function
    for (let i = 0; i < compiled.length; i++) {
      const c = compiled[i];
      if (!c.fn) continue;
      drawCurve(ctx, vp, c.fn, slots[i].color.line, slots[i].color.glow);
    }

    // Crosshair info
    if (mx >= 0) {
      const mathX = vp.toMathX(mx);
      const parts: string[] = [`x: ${mathX.toFixed(2)}`];
      for (let i = 0; i < compiled.length; i++) {
        const c = compiled[i];
        if (!c.fn) continue;
        const val = c.fn(mathX);
        if (isFinite(val)) parts.push(`${SLOT_LABELS[i]}: ${fmt(val, 2)}`);
      }
      // Draw snap dots
      for (let i = 0; i < compiled.length; i++) {
        const c = compiled[i];
        if (!c.fn) continue;
        const val = c.fn(mathX);
        if (isFinite(val)) {
          const snapY = vp.toY(val);
          if (snapY > 0 && snapY < vp.h) {
            ctx.beginPath();
            ctx.arc(mx, snapY, 4, 0, Math.PI * 2);
            ctx.fillStyle = slots[i].color.line;
            ctx.shadowColor = slots[i].color.glow;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }
      return parts.join('   ');
    }
    return '';
  }, [compiled, slots]);

  return (
    <>
      <div className="header-eyebrow">Tools <span>// Funktionsplotter</span></div>
      <h1>Funktions<em>plotter</em></h1>
      <p className="subtitle">Beliebige Funktionen eingeben, visualisieren &amp; vergleichen</p>

      <CoordinateSystem draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        {slots.map((slot, idx) => (
          <div className="ctrl" key={idx} style={{ position: 'relative' }}>
            <div className="ctrl-header">
              <span className="ctrl-label" style={{ color: slot.color.line }}>
                {SLOT_LABELS[idx]}
              </span>
              {compiled[idx].err && (
                <span className="ctrl-value" style={{ color: '#ff4466', fontSize: '10px' }}>
                  {compiled[idx].err}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="text"
                value={slot.expr}
                onChange={e => setExpr(idx, e.target.value)}
                placeholder="z.B. x^2 + sin(x)"
                spellCheck={false}
                style={{
                  flex: 1,
                  background: 'rgba(0,212,255,0.03)',
                  border: '1px solid ' + (compiled[idx].err ? 'rgba(255,68,102,0.3)' : 'rgba(0,212,255,0.1)'),
                  borderRadius: '2px',
                  padding: '10px 14px',
                  color: 'var(--text)',
                  fontFamily: '"Share Tech Mono", monospace',
                  fontSize: '13px',
                  letterSpacing: '.04em',
                  outline: 'none',
                  transition: 'border-color .3s, box-shadow .3s',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = slot.color.line;
                  e.currentTarget.style.boxShadow = `0 0 12px ${slot.color.glow}`;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = compiled[idx].err ? 'rgba(255,68,102,0.3)' : 'rgba(0,212,255,0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {slots.length > 1 && (
                <button
                  onClick={() => removeSlot(idx)}
                  style={{
                    background: 'rgba(255,34,68,0.08)',
                    border: '1px solid rgba(255,34,68,0.2)',
                    borderRadius: '2px',
                    color: '#ff4466',
                    cursor: 'pointer',
                    fontFamily: '"Share Tech Mono", monospace',
                    fontSize: '14px',
                    padding: '8px 12px',
                    transition: 'background .2s',
                  }}
                  title="Funktion entfernen"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}

        {slots.length < 5 && (
          <button
            onClick={addSlot}
            style={{
              background: 'rgba(0,212,255,0.05)',
              border: '1px dashed rgba(0,212,255,0.2)',
              borderRadius: '2px',
              color: 'var(--cyan)',
              cursor: 'pointer',
              fontFamily: '"Share Tech Mono", monospace',
              fontSize: '11px',
              letterSpacing: '.1em',
              padding: '12px',
              marginTop: '4px',
              transition: 'background .2s, border-color .2s',
            }}
          >
            + FUNKTION HINZUFÜGEN
          </button>
        )}
      </div>

      <div className="legend">
        {slots.map((slot, idx) => (
          compiled[idx].fn && (
            <div className="legend-item" key={idx}>
              <div className="legend-dot" style={{ background: slot.color.line, boxShadow: `0 0 8px ${slot.color.glow}` }} />
              {SLOT_LABELS[idx]} = {slot.expr}
            </div>
          )
        ))}
      </div>

      <div className="explanation">
        <h2>Bedienung</h2>
        <p>
          Gib eine oder mehrere Funktionen ein. Unterstützte Operatoren: <code>+</code> <code>-</code> <code>*</code> <code>/</code> <code>^</code> (Potenz).
        </p>
        <p>
          Verfügbare Funktionen: <code>sin</code>, <code>cos</code>, <code>tan</code>,
          <code>sqrt</code>, <code>cbrt</code>, <code>abs</code>, <code>ln</code>, <code>log</code>,
          <code>exp</code>, <code>asin</code>, <code>acos</code>, <code>atan</code>,
          <code>sinh</code>, <code>cosh</code>, <code>tanh</code>, <code>floor</code>, <code>ceil</code>.
          Konstanten: <code>pi</code>, <code>e</code>.
        </p>
        <p>
          Beispiele: <code>x^3 - 2x + 1</code>, <code>sin(2pi*x)</code>, <code>e^(-x^2)</code>,
          <code>|x|</code>, <code>1/(1+e^(-x))</code>.
        </p>
      </div>
    </>
  );
};
