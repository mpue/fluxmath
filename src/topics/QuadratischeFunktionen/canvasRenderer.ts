import { CANVAS_COLORS as C, QUADRATIC_COLORS as Q } from './types';

function fmt(n: number): string {
  return Math.abs(n) < 0.001 ? '0' : n.toFixed(1);
}

export function drawQuadraticFunction(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  a: number,
  b: number,
  c: number,
  mouseX: number,
  mouseY: number,
): { mouseLabel: string } {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.parentElement!.clientWidth;
  const h = Math.min(w * 0.68, 500);
  canvas.style.height = h + 'px';
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = w / 2;
  const cy = h / 2;
  const unitPx = Math.min((w - 80) / 14, (h - 60) / 10);

  const toX = (v: number) => cx + v * unitPx;
  const toY = (v: number) => cy - v * unitPx;

  ctx.clearRect(0, 0, w, h);

  const xMin = Math.floor(-cx / unitPx) - 1;
  const xMax = Math.ceil(cx / unitPx) + 1;
  const yMin = Math.floor(-cy / unitPx) - 1;
  const yMax = Math.ceil(cy / unitPx) + 1;

  // Grid
  for (let i = xMin; i <= xMax; i++) {
    if (i === 0) continue;
    const px = toX(i);
    ctx.strokeStyle = (i % 5 === 0) ? C.gridMajor : C.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
  }
  for (let i = yMin; i <= yMax; i++) {
    if (i === 0) continue;
    const py = toY(i);
    ctx.strokeStyle = (i % 5 === 0) ? C.gridMajor : C.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();

  // Axis tick labels
  ctx.font = '11px "Share Tech Mono", monospace';
  ctx.fillStyle = C.axisLabel;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let i = xMin; i <= xMax; i++) {
    if (i === 0) continue;
    if (i % 2 === 0) ctx.fillText(String(i), toX(i), cy + 5);
  }
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let i = yMin; i <= yMax; i++) {
    if (i === 0) continue;
    if (i % 2 === 0) ctx.fillText(String(i), cx - 7, toY(i));
  }

  // Axis names
  ctx.fillStyle = 'rgba(0,212,255,0.5)';
  ctx.font = '500 13px "Exo 2", sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('x', w - 18, cy - 14);
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('y', cx + 14, 14);

  // Origin
  ctx.fillStyle = C.origin;
  ctx.font = '11px "Share Tech Mono", monospace';
  ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillText('0', cx - 6, cy + 4);

  // Quadrant labels
  ctx.font = '500 12px "Orbitron", monospace';
  ctx.fillStyle = C.quadrant;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('I', cx + (w - cx) / 2, cy / 2);
  ctx.fillText('II', cx / 2, cy / 2);
  ctx.fillText('III', cx / 2, cy + (h - cy) / 2);
  ctx.fillText('IV', cx + (w - cx) / 2, cy + (h - cy) / 2);

  // Vertex
  const hVertex = Math.abs(a) > 0.001 ? -b / (2 * a) : 0;
  const kVertex = Math.abs(a) > 0.001 ? c - (b * b) / (4 * a) : c;

  // Axis of symmetry (dashed)
  if (Math.abs(a) > 0.001) {
    const symPx = toX(hVertex);
    if (symPx > 0 && symPx < w) {
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = Q.symmetry;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(symPx, 0); ctx.lineTo(symPx, h); ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillStyle = Q.symmetryLabel;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('x = ' + fmt(hVertex), symPx, 20);
    }
  }

  // Draw parabola (or horizontal line if a≈0)
  ctx.shadowColor = Q.parabolaGlow;
  ctx.shadowBlur = 18;
  ctx.strokeStyle = Q.parabola;
  ctx.lineWidth = 2.5;
  ctx.beginPath();

  const step = 0.05;
  let started = false;
  for (let xVal = (0 - cx) / unitPx - 1; xVal <= (w - cx) / unitPx + 1; xVal += step) {
    const yVal = a * xVal * xVal + b * xVal + c;
    const px = toX(xVal);
    const py = toY(yVal);
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // y-intercept point (0, c)
  ctx.shadowColor = C.yintGlow;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(toX(0), toY(c), 7, 0, Math.PI * 2);
  ctx.fillStyle = C.yint;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = C.bg;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '11px "Share Tech Mono", monospace';
  ctx.fillStyle = C.yintLabel;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('(0 | ' + fmt(c) + ')', toX(0) + 12, toY(c) + (a >= 0 ? 16 : -16));

  // Nullstellen
  if (Math.abs(a) > 0.001) {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const sqrtDisc = Math.sqrt(disc);
      const x1 = (-b + sqrtDisc) / (2 * a);
      const x2 = (-b - sqrtDisc) / (2 * a);
      const zeros = disc < 0.001 ? [x1] : [x1, x2];

      for (const zx of zeros) {
        const zPx = toX(zx);
        if (zPx > -20 && zPx < w + 20) {
          ctx.shadowColor = C.zeroGlow;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(zPx, toY(0), 7, 0, Math.PI * 2);
          ctx.fillStyle = C.zero;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = C.bg;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.font = '11px "Share Tech Mono", monospace';
          ctx.fillStyle = C.zeroLabel;
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText('(' + fmt(zx) + ' | 0)', zPx, toY(0) + 12);
        }
      }
    }
  }

  // Vertex point
  if (Math.abs(a) > 0.001) {
    const vPx = toX(hVertex);
    const vPy = toY(kVertex);
    if (vPx > -20 && vPx < w + 20 && vPy > -20 && vPy < h + 20) {
      ctx.shadowColor = Q.vertexGlow;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(vPx, vPy, 8, 0, Math.PI * 2);
      ctx.fillStyle = Q.vertex;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = C.bg;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.fillStyle = Q.vertexLabel;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const vOff = a > 0 ? 16 : -16;
      ctx.fillText('S(' + fmt(hVertex) + ' | ' + fmt(kVertex) + ')', vPx + 12, vPy + vOff);
    }
  }

  // Mouse crosshair
  let mouseLabel = '';
  if (mouseX >= 0 && mouseY >= 0) {
    const mx = (mouseX - cx) / unitPx;
    const my = -(mouseY - cy) / unitPx;
    const fmx = a * mx * mx + b * mx + c;
    mouseLabel = 'x: ' + mx.toFixed(1) + '   y: ' + my.toFixed(1) + '   f(x) = ' + fmt(fmx);

    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = C.crosshair;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(mouseX, 0); ctx.lineTo(mouseX, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, mouseY); ctx.lineTo(w, mouseY); ctx.stroke();
    ctx.setLineDash([]);

    const cursorLineY = toY(fmx);
    if (cursorLineY > 0 && cursorLineY < h) {
      ctx.beginPath();
      ctx.arc(mouseX, cursorLineY, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,212,255,0.6)';
      ctx.fill();
    }
  }

  return { mouseLabel };
}
