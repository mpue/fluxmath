import React, { useState, useCallback } from 'react';
import { CoordinateSystem, Viewport } from '../../shared/CoordinateSystem';
import { C, fmt } from '../../shared/canvasUtils';

export const Vektoren: React.FC = () => {
  const [ax, setAx] = useState(30);
  const [ay, setAy] = useState(10);
  const [bx, setBx] = useState(10);
  const [by, setBy] = useState(30);
  const [op, setOp] = useState<'add' | 'sub' | 'scalar' | 'dot'>('add');
  const [scalar, setScalar] = useState(15);

  const va = { x: ax / 10, y: ay / 10 };
  const vb = { x: bx / 10, y: by / 10 };
  const s = scalar / 10;

  const lenA = Math.sqrt(va.x * va.x + va.y * va.y);
  const lenB = Math.sqrt(vb.x * vb.x + vb.y * vb.y);
  const dot = va.x * vb.x + va.y * vb.y;
  const angle = (lenA > 0.001 && lenB > 0.001) ? Math.acos(Math.max(-1, Math.min(1, dot / (lenA * lenB)))) * 180 / Math.PI : 0;

  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, glow: string, lw = 2.5) => {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;
    const ux = dx / len, uy = dy / len;
    const headLen = Math.min(14, len * 0.3);

    ctx.shadowColor = glow;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Arrowhead
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * headLen - uy * headLen * 0.35, y2 - uy * headLen + ux * headLen * 0.35);
    ctx.lineTo(x2 - ux * headLen + uy * headLen * 0.35, y2 - uy * headLen - ux * headLen * 0.35);
    ctx.closePath();
    ctx.fill();
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, my: number) => {
    const { toX, toY } = vp;

    const ox = toX(0), oy = toY(0);

    // Vector a (cyan)
    drawArrow(ctx, ox, oy, toX(va.x), toY(va.y), C.line, C.lineGlow);
    ctx.font = '13px "Orbitron", monospace';
    ctx.fillStyle = C.line;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('\u20D7a', toX(va.x) + 8, toY(va.y) - 8);

    // Vector b (lime)
    drawArrow(ctx, ox, oy, toX(vb.x), toY(vb.y), C.yint, C.yintGlow);
    ctx.fillStyle = C.yint;
    ctx.fillText('\u20D7b', toX(vb.x) + 8, toY(vb.y) - 8);

    // Result vector
    if (op === 'add') {
      const rx = va.x + vb.x, ry = va.y + vb.y;
      // Parallelogram
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(0,212,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(toX(va.x), toY(va.y));
      ctx.lineTo(toX(rx), toY(ry));
      ctx.lineTo(toX(vb.x), toY(vb.y));
      ctx.stroke();
      ctx.setLineDash([]);

      drawArrow(ctx, ox, oy, toX(rx), toY(ry), C.orange, C.orangeGlow, 3);
      ctx.fillStyle = C.orangeLabel;
      ctx.fillText('\u20D7a+\u20D7b', toX(rx) + 8, toY(ry) - 8);
    } else if (op === 'sub') {
      const rx = va.x - vb.x, ry = va.y - vb.y;
      // Show b shifted to tip of a
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255,34,68,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(toX(vb.x), toY(vb.y));
      ctx.lineTo(toX(va.x), toY(va.y));
      ctx.stroke();
      ctx.setLineDash([]);

      drawArrow(ctx, ox, oy, toX(rx), toY(ry), C.zero, C.zeroGlow, 3);
      ctx.fillStyle = C.zeroLabel;
      ctx.fillText('\u20D7a\u2212\u20D7b', toX(rx) + 8, toY(ry) - 8);
    } else if (op === 'scalar') {
      const rx = s * va.x, ry = s * va.y;
      drawArrow(ctx, ox, oy, toX(rx), toY(ry), C.orange, C.orangeGlow, 3);
      ctx.fillStyle = C.orangeLabel;
      ctx.fillText(fmt(s) + '·\u20D7a', toX(rx) + 8, toY(ry) - 8);
    } else {
      // Dot product: project b onto a
      if (lenA > 0.001) {
        const projLen = dot / lenA;
        const projX = (va.x / lenA) * projLen;
        const projY = (va.y / lenA) * projLen;

        // Projection line
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(255,170,0,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(toX(vb.x), toY(vb.y));
        ctx.lineTo(toX(projX), toY(projY));
        ctx.stroke();
        ctx.setLineDash([]);

        drawArrow(ctx, ox, oy, toX(projX), toY(projY), C.orange, C.orangeGlow, 3);
        ctx.fillStyle = C.orangeLabel;
        ctx.font = '11px "Share Tech Mono", monospace';
        ctx.fillText('proj = ' + fmt(projLen), toX(projX) + 8, toY(projY) + 16);

        // Angle arc
        const arcR = 30;
        const angA = Math.atan2(-va.y, va.x);
        const angB = Math.atan2(-vb.y, vb.x);
        ctx.strokeStyle = 'rgba(255,170,0,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ox, oy, arcR, Math.min(angA, angB), Math.max(angA, angB));
        ctx.stroke();
        ctx.font = '10px "Share Tech Mono", monospace';
        ctx.fillStyle = C.triLabel;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const midAng = (angA + angB) / 2;
        ctx.fillText(fmt(angle, 0) + '°', ox + Math.cos(midAng) * (arcR + 16), oy + Math.sin(midAng) * (arcR + 16));
      }
    }

    // Coordinate labels
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(0,212,255,0.5)';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(`a = (${fmt(va.x)} | ${fmt(va.y)})`, toX(va.x / 2) + 6, toY(va.y / 2) + 4);
    ctx.fillStyle = 'rgba(0,255,136,0.5)';
    ctx.fillText(`b = (${fmt(vb.x)} | ${fmt(vb.y)})`, toX(vb.x / 2) + 6, toY(vb.y / 2) + 4);

    if (mx >= 0 && my >= 0) {
      return 'x: ' + vp.toMathX(mx).toFixed(1) + '   y: ' + vp.toMathY(my).toFixed(1);
    }
    return '';
  }, [va, vb, op, s, dot, lenA, lenB, angle]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Vektor<em>rechnung</em></h1>
      <p className="subtitle">Vektoren, Operationen, Skalarprodukt &amp; Winkel</p>

      <CoordinateSystem draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Operation</span></div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {([
              ['add', 'Addition \u20D7a+\u20D7b'],
              ['sub', 'Subtraktion \u20D7a\u2212\u20D7b'],
              ['scalar', 'Skalarmultiplikation'],
              ['dot', 'Skalarprodukt'],
            ] as const).map(([id, label]) => (
              <button key={id} onClick={() => setOp(id)} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
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
          <div className="ctrl-header">
            <span className="ctrl-label">aₓ</span>
            <span className="ctrl-value cyan">{fmt(va.x)}</span>
          </div>
          <input type="range" min={-50} max={50} step={1} value={ax} onChange={e => setAx(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">aᵧ</span>
            <span className="ctrl-value cyan">{fmt(va.y)}</span>
          </div>
          <input type="range" min={-50} max={50} step={1} value={ay} onChange={e => setAy(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">bₓ</span>
            <span className="ctrl-value" style={{ color: '#00ff88' }}>{fmt(vb.x)}</span>
          </div>
          <input type="range" min={-50} max={50} step={1} value={bx} onChange={e => setBx(Number(e.target.value))} />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">bᵧ</span>
            <span className="ctrl-value" style={{ color: '#00ff88' }}>{fmt(vb.y)}</span>
          </div>
          <input type="range" min={-50} max={50} step={1} value={by} onChange={e => setBy(Number(e.target.value))} />
        </div>
      </div>

      {op === 'scalar' && (
        <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
          <div className="ctrl">
            <div className="ctrl-header">
              <span className="ctrl-label">Skalar s</span>
              <span className="ctrl-value amber">{fmt(s)}</span>
            </div>
            <input type="range" min={-30} max={30} step={1} value={scalar} onChange={e => setScalar(Number(e.target.value))} />
          </div>
        </div>
      )}

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Beträge</div>
          <div className="value">|\u20D7a| = {fmt(lenA, 2)} &nbsp; |\u20D7b| = {fmt(lenB, 2)}</div>
          <div className="detail">√(x² + y²)</div>
        </div>
        <div className="info-card slope">
          <div className="label">Skalarprodukt</div>
          <div className="value">\u20D7a · \u20D7b = {fmt(dot, 2)}</div>
          <div className="detail">{Math.abs(dot) < 0.1 ? 'orthogonal! ⊥' : dot > 0 ? 'spitzer Winkel' : 'stumpfer Winkel'}</div>
        </div>
        <div className="info-card zero">
          <div className="label">Winkel</div>
          <div className="value">\u2220 = {fmt(angle, 1)}°</div>
          <div className="detail">cos⁻¹(\u20D7a·\u20D7b / |\u20D7a|·|\u20D7b|)</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />Vektor \u20D7a</div>
        <div className="legend-item"><div className="legend-dot glow-lime" />Vektor \u20D7b</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Ergebnis</div>
      </div>

      <div className="explanation">
        <h2>Erläuterung</h2>
        <p>
          Ein <strong>Vektor</strong> beschreibt eine Verschiebung im Raum mit Richtung und Betrag.
          Der <strong>Betrag</strong> (Länge) ist <span className="formula">|\u20D7v| = √(vₓ² + vᵧ²)</span>.
        </p>
        <p>
          <strong>Addition</strong>: <span className="formula">\u20D7a + \u20D7b = (aₓ+bₓ | aᵧ+bᵧ)</span> — Parallelogrammregel.
          <strong> Subtraktion</strong>: <span className="formula">\u20D7a − \u20D7b</span> zeigt von der Spitze von \u20D7b zur Spitze von \u20D7a.
        </p>
        <p>
          Das <strong>Skalarprodukt</strong> <span className="formula">\u20D7a · \u20D7b = aₓbₓ + aᵧbᵧ = |\u20D7a|·|\u20D7b|·cos(φ)</span>{' '}
          liefert eine <strong>Zahl</strong> (keinen Vektor!). Ist es 0, stehen die Vektoren <strong>senkrecht</strong> aufeinander.
        </p>
        <p>
          Der <strong>Winkel</strong> zwischen zwei Vektoren ergibt sich aus{' '}
          <span className="formula">cos(φ) = (\u20D7a · \u20D7b) / (|\u20D7a| · |\u20D7b|)</span>.
          Im 3D-Raum kommen das <strong>Kreuzprodukt</strong> und Geraden/Ebenen-Gleichungen hinzu.
        </p>
      </div>
    </>
  );
};
