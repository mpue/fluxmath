import React, { useState, useCallback } from 'react';
import { CoordinateSystem, Viewport, DragPoint } from '../../shared/CoordinateSystem';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { ComplexExercises } from './ComplexExercises';

type Op = 'add' | 'sub' | 'mul' | 'div' | 'conjugate' | 'polar';

export const KomplexeZahlen: React.FC = () => {
  const [ar, setAr] = useState(30);
  const [ai, setAi] = useState(20);
  const [br, setBr] = useState(-20);
  const [bi, setBi] = useState(15);
  const [op, setOp] = useState<Op>('add');

  const a = { re: ar / 10, im: ai / 10 };
  const b = { re: br / 10, im: bi / 10 };

  const dragPts: DragPoint[] = [
    { id: 'z1', x: a.re, y: a.im, color: C.line, label: 'z\u2081' },
    { id: 'z2', x: b.re, y: b.im, color: C.yint, label: 'z\u2082' },
  ];

  const handleDrag = useCallback((id: string, x: number, y: number) => {
    const cl = (v: number) => Math.max(-50, Math.min(50, Math.round(v * 10)));
    if (id === 'z1') { setAr(cl(x)); setAi(cl(y)); }
    if (id === 'z2') { setBr(cl(x)); setBi(cl(y)); }
  }, []);

  // Operations
  const sum = { re: a.re + b.re, im: a.im + b.im };
  const diff = { re: a.re - b.re, im: a.im - b.im };
  const mul = { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
  const denom = b.re * b.re + b.im * b.im;
  const div = denom > 0.0001
    ? { re: (a.re * b.re + a.im * b.im) / denom, im: (a.im * b.re - a.re * b.im) / denom }
    : { re: 0, im: 0 };
  const conj = { re: a.re, im: -a.im };

  const absA = Math.sqrt(a.re * a.re + a.im * a.im);
  const absB = Math.sqrt(b.re * b.re + b.im * b.im);
  const argA = Math.atan2(a.im, a.re);
  const argB = Math.atan2(b.im, b.re);

  const getResult = (): { re: number; im: number } => {
    switch (op) {
      case 'add': return sum;
      case 'sub': return diff;
      case 'mul': return mul;
      case 'div': return div;
      case 'conjugate': return conj;
      case 'polar': return a;
    }
  };

  const result = getResult();
  const absR = Math.sqrt(result.re * result.re + result.im * result.im);
  const argR = Math.atan2(result.im, result.re);

  const fmtComplex = (re: number, im: number) => {
    const r = fmt(re, 2);
    const i = fmt(Math.abs(im), 2);
    if (Math.abs(im) < 0.01) return r;
    if (Math.abs(re) < 0.01) return (im < 0 ? '-' : '') + i + 'i';
    return r + (im >= 0 ? ' + ' : ' − ') + i + 'i';
  };

  const drawPoint = (
    ctx: CanvasRenderingContext2D, x: number, y: number,
    color: string, glow: string, r = 5,
  ) => {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 14;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  const drawDashed = (
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number, x2: number, y2: number,
    color: string,
  ) => {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number, x2: number, y2: number,
    color: string, glow: string, lw = 2,
  ) => {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, my: number) => {
    const { toX, toY } = vp;
    const ox = toX(0), oy = toY(0);

    // z₁ = a (cyan)
    const ax = toX(a.re), ay = toY(a.im);
    drawLine(ctx, ox, oy, ax, ay, C.line, C.lineGlow);
    drawDashed(ctx, ax, ay, ax, oy, 'rgba(0,212,255,0.15)');
    drawDashed(ctx, ax, ay, ox, ay, 'rgba(0,212,255,0.15)');
    drawPoint(ctx, ax, ay, C.line, C.lineGlow);
    ctx.font = '13px "Orbitron", monospace';
    ctx.fillStyle = C.line;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('z₁', ax + 10, ay - 10);

    // z₂ = b (lime) — skip for conjugate/polar
    if (op !== 'conjugate' && op !== 'polar') {
      const bpx = toX(b.re), bpy = toY(b.im);
      drawLine(ctx, ox, oy, bpx, bpy, C.yint, C.yintGlow);
      drawDashed(ctx, bpx, bpy, bpx, oy, 'rgba(0,255,136,0.15)');
      drawDashed(ctx, bpx, bpy, ox, bpy, 'rgba(0,255,136,0.15)');
      drawPoint(ctx, bpx, bpy, C.yint, C.yintGlow);
      ctx.fillStyle = C.yint;
      ctx.fillText('z₂', bpx + 10, bpy - 10);
    }

    // Result (orange / magenta)
    const rx = toX(result.re), ry = toY(result.im);
    const rCol = op === 'conjugate' ? C.magenta : C.orange;
    const rGlow = op === 'conjugate' ? C.magentaGlow : C.orangeGlow;
    const rLabel = op === 'conjugate' ? C.magentaLabel : C.orangeLabel;

    drawLine(ctx, ox, oy, rx, ry, rCol, rGlow, 2.5);
    drawDashed(ctx, rx, ry, rx, oy, rCol.replace(')', ',0.15)').replace('rgb', 'rgba'));
    drawDashed(ctx, rx, ry, ox, ry, rCol.replace(')', ',0.15)').replace('rgb', 'rgba'));
    drawPoint(ctx, rx, ry, rCol, rGlow, 6);

    const labels: Record<Op, string> = {
      add: 'z₁+z₂', sub: 'z₁−z₂', mul: 'z₁·z₂', div: 'z₁/z₂',
      conjugate: 'z̄₁', polar: 'z₁',
    };
    ctx.fillStyle = rLabel;
    ctx.fillText(labels[op], rx + 10, ry - 10);

    // Polar: draw angle arc + |z| label
    if (op === 'polar') {
      const arcR = Math.min(40, absA * vp.unitPx * 0.5);
      if (absA > 0.01 && arcR > 5) {
        ctx.strokeStyle = 'rgba(255,170,0,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const startAng = 0;
        const endAng = -argA; // canvas y is flipped
        if (argA >= 0) {
          ctx.arc(ox, oy, arcR, -Math.abs(argA), 0);
        } else {
          ctx.arc(ox, oy, arcR, 0, Math.abs(argA));
        }
        ctx.stroke();

        const midAng = -argA / 2;
        ctx.font = '10px "Share Tech Mono", monospace';
        ctx.fillStyle = C.triLabel;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          fmt(argA * 180 / Math.PI, 1) + '°',
          ox + Math.cos(midAng) * (arcR + 18),
          oy + Math.sin(midAng) * (arcR + 18),
        );

        // |z| label along the line
        const mx2 = (ox + ax) / 2, my2 = (oy + ay) / 2;
        ctx.font = '10px "Share Tech Mono", monospace';
        ctx.fillStyle = 'rgba(0,212,255,0.6)';
        ctx.fillText('|z| = ' + fmt(absA, 2), mx2 + 10, my2 - 10);
      }
    }

    // Conjugate: draw mirror line
    if (op === 'conjugate') {
      ctx.setLineDash([2, 6]);
      ctx.strokeStyle = 'rgba(255,68,204,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(rx, ry);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Multiplication: show angle addition visually
    if (op === 'mul' && absA > 0.01 && absB > 0.01) {
      const arcR = 25;
      ctx.strokeStyle = 'rgba(255,136,0,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const sA = -argA, sR = -argR;
      ctx.arc(ox, oy, arcR, Math.min(sA, sR), Math.max(sA, sR));
      ctx.stroke();
    }

    if (mx >= 0 && my >= 0) {
      return 'Re: ' + vp.toMathX(mx).toFixed(2) + '   Im: ' + vp.toMathY(my).toFixed(2);
    }
    return '';
  }, [a, b, result, op, absA, absB, argA, argR]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Komplexe <em>Zahlen</em></h1>
      <p className="subtitle">Gaußsche Zahlenebene, Operationen &amp; Polarform</p>

      <CoordinateSystem draw={draw} dragPoints={dragPts} onDragPoint={handleDrag} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Operation</span></div>
          <div style={{ display: 'flex', gap: '1px', flexWrap: 'wrap' }}>
            {([
              ['add', 'Addition'],
              ['sub', 'Subtraktion'],
              ['mul', 'Multiplikation'],
              ['div', 'Division'],
              ['conjugate', 'Konjugation'],
              ['polar', 'Polarform'],
            ] as const).map(([id, label]) => (
              <button key={id} onClick={() => setOp(id)} style={{
                flex: 1, minWidth: '90px', padding: '8px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '10px',
                background: id === op ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: id === op ? '#00d4ff' : '#2a5a70',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="controls" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Re(z₁)</span><span className="ctrl-value cyan">{fmt(a.re)}</span></div>
          <input type="range" min={-50} max={50} step={1} value={ar} onChange={e => setAr(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Im(z₁)</span><span className="ctrl-value cyan">{fmt(a.im)}</span></div>
          <input type="range" min={-50} max={50} step={1} value={ai} onChange={e => setAi(Number(e.target.value))} />
        </div>
        {op !== 'conjugate' && op !== 'polar' && (
          <>
            <div className="ctrl">
              <div className="ctrl-header"><span className="ctrl-label">Re(z₂)</span><span className="ctrl-value" style={{ color: '#00ff88' }}>{fmt(b.re)}</span></div>
              <input type="range" min={-50} max={50} step={1} value={br} onChange={e => setBr(Number(e.target.value))} />
            </div>
            <div className="ctrl">
              <div className="ctrl-header"><span className="ctrl-label">Im(z₂)</span><span className="ctrl-value" style={{ color: '#00ff88' }}>{fmt(b.im)}</span></div>
              <input type="range" min={-50} max={50} step={1} value={bi} onChange={e => setBi(Number(e.target.value))} />
            </div>
          </>
        )}
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">z₁</div>
          <div className="value">{fmtComplex(a.re, a.im)}</div>
          <div className="detail">|z₁| = {fmt(absA, 2)} &nbsp; φ = {fmt(argA * 180 / Math.PI, 1)}°</div>
        </div>
        {op !== 'conjugate' && op !== 'polar' && (
          <div className="info-card slope">
            <div className="label">z₂</div>
            <div className="value">{fmtComplex(b.re, b.im)}</div>
            <div className="detail">|z₂| = {fmt(absB, 2)} &nbsp; φ = {fmt(argB * 180 / Math.PI, 1)}°</div>
          </div>
        )}
        <div className="info-card zero">
          <div className="label">Ergebnis</div>
          <div className="value">{fmtComplex(result.re, result.im)}</div>
          <div className="detail">|z| = {fmt(absR, 2)} &nbsp; φ = {fmt(argR * 180 / Math.PI, 1)}°</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />z₁</div>
        {op !== 'conjugate' && op !== 'polar' && (
          <div className="legend-item"><div className="legend-dot glow-lime" />z₂</div>
        )}
        <div className="legend-item"><div className="legend-dot glow-amber" />Ergebnis</div>
      </div>

      <div className="explanation">
        <h2>Erläuterung</h2>
        <p>Eine <strong>komplexe Zahl</strong> hat die Form <M>{'z = a + bi'}</M>, wobei <M>{'a'}</M> der <strong>Realteil</strong>,{' '}
          <M>{'b'}</M> der <strong>Imaginärteil</strong> und <M>{'i = \\sqrt{-1}'}</M> die <strong>imaginäre Einheit</strong> ist.</p>

        <p>In der <strong>Gaußschen Zahlenebene</strong> wird <M>{'a'}</M> auf der horizontalen (Re) und <M>{'b'}</M> auf
          der vertikalen (Im) Achse aufgetragen — jede komplexe Zahl entspricht einem Punkt in der Ebene.</p>

        <p><strong>Betrag</strong> und <strong>Argument</strong>:{' '}
          <M>{'|z| = \\sqrt{a^2 + b^2}'}</M>, &nbsp;
          <M>{'\\varphi = \\arctan\\!\\left(\\frac{b}{a}\\right)'}</M>.
          Damit lässt sich jede komplexe Zahl in <strong>Polarform</strong> schreiben:{' '}
          <M>{'z = |z| \\cdot (\\cos\\varphi + i\\sin\\varphi) = |z| \\cdot e^{i\\varphi}'}</M>.</p>

        {op === 'add' && (
          <p><strong>Addition</strong>: <M>{'z_1 + z_2 = (a_1 + a_2) + (b_1 + b_2)\\,i'}</M> — geometrisch
            die <strong>Vektoraddition</strong> (Parallelogrammregel).</p>
        )}
        {op === 'sub' && (
          <p><strong>Subtraktion</strong>: <M>{'z_1 - z_2 = (a_1 - a_2) + (b_1 - b_2)\\,i'}</M> — Differenzvektor
            von z₂ nach z₁.</p>
        )}
        {op === 'mul' && (
          <p><strong>Multiplikation</strong>: In Polarform besonders elegant:{' '}
            <M>{'z_1 \\cdot z_2 = |z_1| \\cdot |z_2| \\cdot e^{i(\\varphi_1 + \\varphi_2)}'}</M> — die Beträge
            werden <strong>multipliziert</strong>, die Winkel <strong>addiert</strong>.</p>
        )}
        {op === 'div' && (
          <p><strong>Division</strong>: <M>{'\\frac{z_1}{z_2} = \\frac{|z_1|}{|z_2|} \\cdot e^{i(\\varphi_1 - \\varphi_2)}'}</M> — Beträge
            werden <strong>dividiert</strong>, Winkel <strong>subtrahiert</strong>.</p>
        )}
        {op === 'conjugate' && (
          <p><strong>Konjugation</strong>: <M>{'\\bar{z} = a - bi'}</M> — Spiegelung an der <strong>reellen Achse</strong>.
            Es gilt: <M>{'z \\cdot \\bar{z} = |z|^2'}</M>.</p>
        )}
        {op === 'polar' && (
          <p><strong>Euler-Formel</strong>: <M>{'e^{i\\varphi} = \\cos\\varphi + i\\sin\\varphi'}</M> — die Brücke zwischen
            Exponentialfunktion und Trigonometrie. Daraus folgt die berühmte{' '}
            <M>{'e^{i\\pi} + 1 = 0'}</M>.</p>
        )}
      </div>
      <ComplexExercises />
    </>
  );
};
