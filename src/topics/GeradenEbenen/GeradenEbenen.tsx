import React, { useState, useCallback } from 'react';
import { CoordinateSystem, Viewport } from '../../shared/CoordinateSystem';
import { C, fmt } from '../../shared/canvasUtils';
import { Math as M } from '../../shared/Math';
import { GeradenEbenenExercises } from './GeradenEbenenExercises';

/* ── 3D → 2D projection (isometric-like) ── */
function project(x: number, y: number, z: number): [number, number] {
  // x-axis points right-down, y-axis points right, z-axis points up
  const px = 0.5 * x + y;
  const py = -0.35 * x + z;
  return [px, py];
}

export const GeradenEbenen: React.FC = () => {
  const [mode, setMode] = useState<'gerade' | 'ebene' | 'lage'>('gerade');

  // Gerade: P + t*v
  const [px, setPx] = useState(10);
  const [py, setPy] = useState(5);
  const [pz, setPz] = useState(5);
  const [vx, setVx] = useState(10);
  const [vy, setVy] = useState(5);
  const [vz, setVz] = useState(-5);

  // Ebene: Q + s*u + t*w  or  n·(x - Q) = 0
  const [qx, setQx] = useState(0);
  const [qy, setQy] = useState(0);
  const [qz, setQz] = useState(20);
  const [nx, setNx] = useState(0);
  const [ny, setNy] = useState(0);
  const [nz, setNz] = useState(10);

  // Derived
  const P = { x: px / 10, y: py / 10, z: pz / 10 };
  const V = { x: vx / 10, y: vy / 10, z: vz / 10 };
  const Q = { x: qx / 10, y: qy / 10, z: qz / 10 };
  const N = { x: nx / 10, y: ny / 10, z: nz / 10 };
  const nLen = Math.sqrt(N.x * N.x + N.y * N.y + N.z * N.z);

  // Plane equation: n·x = d
  const dPlane = N.x * Q.x + N.y * Q.y + N.z * Q.z;

  // Distance point P to plane
  const distPtoPlane = nLen > 0.001 ? Math.abs(N.x * P.x + N.y * P.y + N.z * P.z - dPlane) / nLen : 0;

  // Line-plane intersection parameter t
  const dotNV = N.x * V.x + N.y * V.y + N.z * V.z;
  const hasIntersection = Math.abs(dotNV) > 0.001;
  const tIntersect = hasIntersection ? (dPlane - (N.x * P.x + N.y * P.y + N.z * P.z)) / dotNV : 0;
  const intersection = hasIntersection ? {
    x: P.x + tIntersect * V.x,
    y: P.y + tIntersect * V.y,
    z: P.z + tIntersect * V.z,
  } : null;

  const drawArrow3D = (ctx: CanvasRenderingContext2D, vp: Viewport,
    fx: number, fy: number, fz: number,
    tx: number, ty: number, tz: number,
    color: string, glow: string, lw = 2) => {
    const [sx, sy] = project(fx, fy, fz);
    const [ex, ey] = project(tx, ty, tz);
    const x1 = vp.toX(sx), y1 = vp.toY(sy);
    const x2 = vp.toX(ex), y2 = vp.toY(ey);
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;
    const ux = dx / len, uy = dy / len;
    const headLen = Math.min(12, len * 0.25);

    ctx.shadowColor = glow;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * headLen - uy * headLen * 0.35, y2 - uy * headLen + ux * headLen * 0.35);
    ctx.lineTo(x2 - ux * headLen + uy * headLen * 0.35, y2 - uy * headLen - ux * headLen * 0.35);
    ctx.closePath();
    ctx.fill();
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, vp: Viewport, mx: number, my: number) => {
    // Draw 3D axes
    drawArrow3D(ctx, vp, 0, 0, 0, 4, 0, 0, 'rgba(255,34,68,0.5)', 'rgba(255,34,68,0.3)', 1.5);
    drawArrow3D(ctx, vp, 0, 0, 0, 0, 4, 0, 'rgba(0,255,136,0.5)', 'rgba(0,255,136,0.3)', 1.5);
    drawArrow3D(ctx, vp, 0, 0, 0, 0, 0, 4, 'rgba(0,212,255,0.5)', 'rgba(0,212,255,0.3)', 1.5);

    // Axis labels
    const [lxx, lxy] = project(4.3, 0, 0);
    const [lyx, lyy] = project(0, 4.3, 0);
    const [lzx, lzy] = project(0, 0, 4.3);
    ctx.font = '12px "Orbitron", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,34,68,0.7)';
    ctx.fillText('x', vp.toX(lxx), vp.toY(lxy));
    ctx.fillStyle = 'rgba(0,255,136,0.7)';
    ctx.fillText('y', vp.toX(lyx), vp.toY(lyy));
    ctx.fillStyle = 'rgba(0,212,255,0.7)';
    ctx.fillText('z', vp.toX(lzx), vp.toY(lzy));

    if (mode === 'gerade' || mode === 'lage') {
      // Draw line: P + t*V for t in [-3, 3]
      const steps = 40;
      ctx.beginPath();
      ctx.strokeStyle = C.line;
      ctx.shadowColor = C.lineGlow;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      for (let i = 0; i <= steps; i++) {
        const t = -3 + (6 * i / steps);
        const lx = P.x + t * V.x;
        const ly = P.y + t * V.y;
        const lz = P.z + t * V.z;
        const [sx, sy] = project(lx, ly, lz);
        if (i === 0) ctx.moveTo(vp.toX(sx), vp.toY(sy));
        else ctx.lineTo(vp.toX(sx), vp.toY(sy));
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Point P
      const [ppx, ppy] = project(P.x, P.y, P.z);
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(vp.toX(ppx), vp.toY(ppy), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.fillStyle = C.orangeLabel;
      ctx.textAlign = 'left';
      ctx.fillText('P', vp.toX(ppx) + 8, vp.toY(ppy) - 8);

      // Direction vector arrow from P
      drawArrow3D(ctx, vp, P.x, P.y, P.z, P.x + V.x, P.y + V.y, P.z + V.z, C.magenta, C.magentaGlow, 2);
      const [vtx, vty] = project(P.x + V.x, P.y + V.y, P.z + V.z);
      ctx.fillStyle = C.magentaLabel;
      ctx.fillText('v', vp.toX(vtx) + 8, vp.toY(vty) - 8);
    }

    if (mode === 'ebene' || mode === 'lage') {
      // Visualize plane as semi-transparent quad (approximate)
      if (nLen > 0.001) {
        // Build two tangent vectors on the plane
        let u1 = { x: 1, y: 0, z: 0 };
        if (Math.abs(N.x) > Math.abs(N.y)) {
          u1 = { x: -N.z / nLen, y: 0, z: N.x / nLen };
        } else {
          u1 = { x: 0, y: N.z / nLen, z: -N.y / nLen };
        }
        const u1Len = Math.sqrt(u1.x * u1.x + u1.y * u1.y + u1.z * u1.z);
        u1 = { x: u1.x / u1Len, y: u1.y / u1Len, z: u1.z / u1Len };
        // cross product N x u1
        const u2 = {
          x: (N.y * u1.z - N.z * u1.y) / nLen,
          y: (N.z * u1.x - N.x * u1.z) / nLen,
          z: (N.x * u1.y - N.y * u1.x) / nLen,
        };

        const size = 3;
        const corners = [[-size, -size], [size, -size], [size, size], [-size, size]].map(([s, t]) => {
          const cx = Q.x + s * u1.x + t * u2.x;
          const cy = Q.y + s * u1.y + t * u2.y;
          const cz = Q.z + s * u1.z + t * u2.z;
          const [px2, py2] = project(cx, cy, cz);
          return [vp.toX(px2), vp.toY(py2)] as const;
        });

        ctx.fillStyle = 'rgba(0,212,255,0.06)';
        ctx.strokeStyle = 'rgba(0,212,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(corners[0][0], corners[0][1]);
        for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i][0], corners[i][1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Normal vector from Q
        drawArrow3D(ctx, vp, Q.x, Q.y, Q.z, Q.x + N.x / nLen * 1.5, Q.y + N.y / nLen * 1.5, Q.z + N.z / nLen * 1.5,
          C.yint, C.yintGlow, 2);
        const [ntx, nty] = project(Q.x + N.x / nLen * 1.8, Q.y + N.y / nLen * 1.8, Q.z + N.z / nLen * 1.8);
        ctx.fillStyle = C.yintLabel;
        ctx.font = '11px "Share Tech Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('n', vp.toX(ntx) + 4, vp.toY(nty) - 4);

        // Point Q on plane
        const [qpx, qpy] = project(Q.x, Q.y, Q.z);
        ctx.fillStyle = C.yint;
        ctx.beginPath();
        ctx.arc(vp.toX(qpx), vp.toY(qpy), 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Intersection point if in "lage" mode
      if (mode === 'lage' && intersection) {
        const [ix, iy] = project(intersection.x, intersection.y, intersection.z);
        ctx.fillStyle = C.zero;
        ctx.shadowColor = C.zeroGlow;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(vp.toX(ix), vp.toY(iy), 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = C.zeroLabel;
        ctx.font = '11px "Share Tech Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('S', vp.toX(ix) + 8, vp.toY(iy) - 8);
      }
    }

    if (mx >= 0 && my >= 0) {
      return 'x: ' + vp.toMathX(mx).toFixed(1) + '   y: ' + vp.toMathY(my).toFixed(1);
    }
    return '';
  }, [mode, P, V, Q, N, nLen, dPlane, intersection]);

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Geraden &amp; <em>Ebenen</em></h1>
      <p className="subtitle">Parameterform, Normalenform, Lagebeziehungen im Raum</p>

      <CoordinateSystem draw={draw} />

      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header"><span className="ctrl-label">Ansicht</span></div>
          <div style={{ display: 'flex', gap: '1px' }}>
            {([
              ['gerade', 'Gerade'],
              ['ebene', 'Ebene'],
              ['lage', 'Lagebeziehung'],
            ] as const).map(([id, label]) => (
              <button key={id} onClick={() => setMode(id)} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace', fontSize: '11px',
                background: id === mode ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                color: id === mode ? '#00d4ff' : '#2a5a70',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(mode === 'gerade' || mode === 'lage') && (
        <div className="controls" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="ctrl">
            <div className="ctrl-header"><span className="ctrl-label">Stuetzpunkt P</span></div>
          </div>
          <div className="ctrl" />
          <div className="ctrl">
            <div className="ctrl-header"><span className="ctrl-label">Richtung v</span></div>
          </div>
          {[
            ['Px', px, setPx, C.orangeLabel],
            ['Py', py, setPy, C.orangeLabel],
            ['Pz', pz, setPz, C.orangeLabel],
          ].map(([label, val, set, col]) => (
            <div className="ctrl" key={label as string}>
              <div className="ctrl-header">
                <span className="ctrl-label">{label as string}</span>
                <span className="ctrl-value" style={{ color: col as string }}>{fmt((val as number) / 10)}</span>
              </div>
              <input type="range" min={-30} max={30} step={1} value={val as number}
                onChange={e => (set as (n: number) => void)(Number(e.target.value))} />
            </div>
          ))}
          {[
            ['vx', vx, setVx, C.magentaLabel],
            ['vy', vy, setVy, C.magentaLabel],
            ['vz', vz, setVz, C.magentaLabel],
          ].map(([label, val, set, col]) => (
            <div className="ctrl" key={label as string}>
              <div className="ctrl-header">
                <span className="ctrl-label">{label as string}</span>
                <span className="ctrl-value" style={{ color: col as string }}>{fmt((val as number) / 10)}</span>
              </div>
              <input type="range" min={-30} max={30} step={1} value={val as number}
                onChange={e => (set as (n: number) => void)(Number(e.target.value))} />
            </div>
          ))}
        </div>
      )}

      {(mode === 'ebene' || mode === 'lage') && (
        <div className="controls" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="ctrl">
            <div className="ctrl-header"><span className="ctrl-label">Aufpunkt Q</span></div>
          </div>
          <div className="ctrl" />
          <div className="ctrl">
            <div className="ctrl-header"><span className="ctrl-label">Normale n</span></div>
          </div>
          {[
            ['Qx', qx, setQx, C.yintLabel],
            ['Qy', qy, setQy, C.yintLabel],
            ['Qz', qz, setQz, C.yintLabel],
          ].map(([label, val, set, col]) => (
            <div className="ctrl" key={label as string}>
              <div className="ctrl-header">
                <span className="ctrl-label">{label as string}</span>
                <span className="ctrl-value" style={{ color: col as string }}>{fmt((val as number) / 10)}</span>
              </div>
              <input type="range" min={-30} max={30} step={1} value={val as number}
                onChange={e => (set as (n: number) => void)(Number(e.target.value))} />
            </div>
          ))}
          {[
            ['nx', nx, setNx, C.yintLabel],
            ['ny', ny, setNy, C.yintLabel],
            ['nz', nz, setNz, C.yintLabel],
          ].map(([label, val, set, col]) => (
            <div className="ctrl" key={label as string}>
              <div className="ctrl-header">
                <span className="ctrl-label">{label as string}</span>
                <span className="ctrl-value" style={{ color: col as string }}>{fmt((val as number) / 10)}</span>
              </div>
              <input type="range" min={-30} max={30} step={1} value={val as number}
                onChange={e => (set as (n: number) => void)(Number(e.target.value))} />
            </div>
          ))}
        </div>
      )}

      <div className="info-grid">
        {(mode === 'gerade' || mode === 'lage') && (
          <div className="info-card eq">
            <div className="label">Geradengleichung</div>
            <div className="value"><M>{`g: \\vec{x} = \\begin{pmatrix}${fmt(P.x)}\\\\${fmt(P.y)}\\\\${fmt(P.z)}\\end{pmatrix} + t \\cdot \\begin{pmatrix}${fmt(V.x)}\\\\${fmt(V.y)}\\\\${fmt(V.z)}\\end{pmatrix}`}</M></div>
          </div>
        )}
        {(mode === 'ebene' || mode === 'lage') && (
          <div className="info-card slope">
            <div className="label">Ebene (Normalenform)</div>
            <div className="value"><M>{`E: ${nLen > 0.001 ? `${fmt(N.x)}x ${N.y >= 0 ? '+' : '-'} ${fmt(Math.abs(N.y))}y ${N.z >= 0 ? '+' : '-'} ${fmt(Math.abs(N.z))}z = ${fmt(dPlane)}` : '\\text{(Normalenvektor = 0)}'}`}</M></div>
          </div>
        )}
        {mode === 'lage' && (
          <div className="info-card zero">
            <div className="label">Lagebeziehung</div>
            <div className="value">
              {!hasIntersection
                ? (Math.abs(distPtoPlane) < 0.05 ? 'Gerade liegt in der Ebene' : `Parallel — Abstand: ${fmt(distPtoPlane, 2)}`)
                : <>Schnittpunkt S = ({fmt(intersection!.x)}, {fmt(intersection!.y)}, {fmt(intersection!.z)}) bei t = {fmt(tIntersect, 2)}</>
              }
            </div>
          </div>
        )}
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />Gerade g</div>
        <div className="legend-item"><div className="legend-dot glow-lime" />Ebene E / Normale</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Stuetzpunkt P</div>
        {mode === 'lage' && <div className="legend-item"><div className="legend-dot" style={{ background: C.zero, boxShadow: `0 0 6px ${C.zeroGlow}` }} />Schnittpunkt S</div>}
      </div>

      <div className="explanation">
        <h2>Erlaeuterung</h2>
        <p>
          Eine <strong>Gerade im Raum</strong> wird durch einen Stuetzpunkt und einen Richtungsvektor beschrieben:
          <M>{String.raw`g: \vec{x} = \vec{p} + t \cdot \vec{v}, \quad t \in \mathbb{R}`}</M>
        </p>
        <p>
          Eine <strong>Ebene</strong> kann in <strong>Parameterform</strong>{' '}
          <M>{String.raw`E: \vec{x} = \vec{q} + s \cdot \vec{u} + t \cdot \vec{w}`}</M> oder in
          <strong> Normalenform</strong> <M>{String.raw`E: \vec{n} \cdot (\vec{x} - \vec{q}) = 0`}</M>{' '}
          angegeben werden. Der Normalenvektor steht senkrecht auf der Ebene.
        </p>
        <p>
          Fuer die <strong>Lagebeziehung Gerade/Ebene</strong> setzt man die Geradengleichung in die Ebenengleichung ein.
          Ergibt sich ein eindeutiges t, gibt es einen <strong>Schnittpunkt</strong>.
          Ist <M>{String.raw`\vec{n} \cdot \vec{v} = 0`}</M>, verlaeuft die Gerade <strong>parallel</strong> zur Ebene
          (oder liegt in ihr, falls der Stuetzpunkt die Ebenengleichung erfuellt).
        </p>
        <p>
          Der <strong>Abstand eines Punktes P</strong> zur Ebene ist{' '}
          <M>{String.raw`d = \frac{|\vec{n} \cdot \vec{p} - d|}{|\vec{n}|}`}</M> (Hesse'sche Normalform).
        </p>
      </div>
      <GeradenEbenenExercises />
    </>
  );
};
