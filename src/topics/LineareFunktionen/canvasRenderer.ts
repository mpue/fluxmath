import { CANVAS_COLORS as C } from './types';

function fmt(n: number): string {
  return Math.abs(n) < 0.001 ? '0' : n.toFixed(1);
}

export function drawLinearFunction(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  m: number,
  b: number,
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

  // Slope triangle
  if (Math.abs(m) > 0.01) {
    const tx = 0, ty = b;
    const x1 = toX(tx), y1 = toY(ty);
    const x2 = toX(tx + 1), y2 = toY(ty);
    const x3 = toX(tx + 1), y3 = toY(ty + m);

    ctx.fillStyle = C.triFill;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath();
    ctx.fill();

    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = C.tri;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = C.triLabel;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('\u0394x = 1', (x1 + x2) / 2, Math.max(y1, y2) + 5);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('\u0394y = ' + fmt(m), x2 + 8, (y2 + y3) / 2);
  }

  // Main line with glow
  const farLeft = (0 - cx) / unitPx;
  const farRight = (w - cx) / unitPx;

  ctx.shadowColor = C.lineGlow;
  ctx.shadowBlur = 18;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, toY(m * farLeft + b));
  ctx.lineTo(w, toY(m * farRight + b));
  ctx.stroke();
  ctx.shadowBlur = 0;

  // y-intercept point
  ctx.shadowColor = C.yintGlow;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(toX(0), toY(b), 7, 0, Math.PI * 2);
  ctx.fillStyle = C.yint;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = C.bg;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '11px "Share Tech Mono", monospace';
  ctx.fillStyle = C.yintLabel;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const yIntPx = toY(b);
  const yIntOff = (m >= 0) ? 16 : -16;
  ctx.fillText('(0 | ' + fmt(b) + ')', toX(0) + 12, yIntPx + yIntOff);

  // Zero point
  if (Math.abs(m) > 0.001) {
    const zx = -b / m;
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

  // Mouse crosshair
  let mouseLabel = '';
  if (mouseX >= 0 && mouseY >= 0) {
    const mx = (mouseX - cx) / unitPx;
    const my = -(mouseY - cy) / unitPx;
    mouseLabel = 'x: ' + mx.toFixed(1) + '   y: ' + my.toFixed(1) + '   f(x) = ' + fmt(m * mx + b);

    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = C.crosshair;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(mouseX, 0); ctx.lineTo(mouseX, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, mouseY); ctx.lineTo(w, mouseY); ctx.stroke();
    ctx.setLineDash([]);

    const cursorLineY = toY(m * mx + b);
    if (cursorLineY > 0 && cursorLineY < h) {
      ctx.beginPath();
      ctx.arc(mouseX, cursorLineY, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,212,255,0.6)';
      ctx.fill();
    }
  }

  return { mouseLabel };
}
