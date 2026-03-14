/** Shared canvas colors used across all topics */
export const C = {
  grid: 'rgba(0,212,255,0.03)',
  gridMajor: 'rgba(0,212,255,0.07)',
  axis: 'rgba(0,212,255,0.22)',
  axisLabel: 'rgba(0,212,255,0.3)',
  quadrant: 'rgba(0,212,255,0.06)',
  origin: 'rgba(0,212,255,0.15)',
  line: '#00d4ff',
  lineGlow: 'rgba(0,212,255,0.45)',
  zero: '#ff2244',
  zeroGlow: 'rgba(255,34,68,0.5)',
  zeroLabel: 'rgba(255,34,68,0.9)',
  yint: '#00ff88',
  yintGlow: 'rgba(0,255,136,0.5)',
  yintLabel: 'rgba(0,255,136,0.9)',
  tri: 'rgba(255,170,0,0.6)',
  triFill: 'rgba(255,170,0,0.06)',
  triLabel: 'rgba(255,170,0,0.85)',
  crosshair: 'rgba(0,212,255,0.08)',
  bg: '#010a0e',
  magenta: '#ff44cc',
  magentaGlow: 'rgba(255,68,204,0.5)',
  magentaLabel: 'rgba(255,68,204,0.9)',
  purple: '#aa44ff',
  purpleGlow: 'rgba(170,68,255,0.5)',
  purpleLabel: 'rgba(170,68,255,0.9)',
  orange: '#ff8800',
  orangeGlow: 'rgba(255,136,0,0.5)',
  orangeLabel: 'rgba(255,136,0,0.9)',
};

export function fmt(n: number, decimals = 1): string {
  return Math.abs(n) < 0.001 ? '0' : n.toFixed(decimals);
}

export interface CanvasLayout {
  w: number;
  h: number;
  cx: number;
  cy: number;
  unitPx: number;
  toX: (v: number) => number;
  toY: (v: number) => number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export function setupCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  heightRatio = 0.68,
  maxH = 500,
  xUnits = 14,
  yUnits = 10,
): CanvasLayout {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.parentElement!.clientWidth;
  const h = Math.min(w * heightRatio, maxH);
  canvas.style.height = h + 'px';
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = w / 2;
  const cy = h / 2;
  const unitPx = Math.min((w - 80) / xUnits, (h - 60) / yUnits);

  const toX = (v: number) => cx + v * unitPx;
  const toY = (v: number) => cy - v * unitPx;

  const xMin = Math.floor(-cx / unitPx) - 1;
  const xMax = Math.ceil(cx / unitPx) + 1;
  const yMin = Math.floor(-cy / unitPx) - 1;
  const yMax = Math.ceil(cy / unitPx) + 1;

  ctx.clearRect(0, 0, w, h);

  return { w, h, cx, cy, unitPx, toX, toY, xMin, xMax, yMin, yMax };
}

export function drawGrid(ctx: CanvasRenderingContext2D, layout: CanvasLayout): void {
  const { w, h, toX, toY, xMin, xMax, yMin, yMax } = layout;
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
}

export function drawAxes(ctx: CanvasRenderingContext2D, layout: CanvasLayout): void {
  const { w, h, cx, cy, toX, toY, xMin, xMax, yMin, yMax } = layout;

  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();

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

  ctx.fillStyle = 'rgba(0,212,255,0.5)';
  ctx.font = '500 13px "Exo 2", sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('x', w - 18, cy - 14);
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('y', cx + 14, 14);

  ctx.fillStyle = C.origin;
  ctx.font = '11px "Share Tech Mono", monospace';
  ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillText('0', cx - 6, cy + 4);
}

export function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  layout: CanvasLayout,
  mouseX: number,
  mouseY: number,
  fAtMouse?: number,
): string {
  if (mouseX < 0 || mouseY < 0) return '';
  const { w, h, cx, cy, unitPx, toY } = layout;
  const mx = (mouseX - cx) / unitPx;
  const my = -(mouseY - cy) / unitPx;

  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = C.crosshair;
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(mouseX, 0); ctx.lineTo(mouseX, h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, mouseY); ctx.lineTo(w, mouseY); ctx.stroke();
  ctx.setLineDash([]);

  if (fAtMouse !== undefined) {
    const cursorLineY = toY(fAtMouse);
    if (cursorLineY > 0 && cursorLineY < h) {
      ctx.beginPath();
      ctx.arc(mouseX, cursorLineY, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,212,255,0.6)';
      ctx.fill();
    }
    return 'x: ' + mx.toFixed(1) + '   y: ' + my.toFixed(1) + '   f(x) = ' + fmt(fAtMouse);
  }
  return 'x: ' + mx.toFixed(1) + '   y: ' + my.toFixed(1);
}

export function drawPoint(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  color: string,
  glowColor: string,
  radius = 7,
): void {
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = C.bg;
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** Draw a function curve by plotting point-by-point */
export function drawCurve(
  ctx: CanvasRenderingContext2D,
  layout: CanvasLayout,
  fn: (x: number) => number,
  color: string,
  glowColor: string,
  lineWidth = 2.5,
  step = 0.05,
): void {
  const { w, cx, unitPx, toX, toY } = layout;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 18;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();

  let started = false;
  const from = (0 - cx) / unitPx - 1;
  const to = (w - cx) / unitPx + 1;
  let prevY = 0;
  for (let xVal = from; xVal <= to; xVal += step) {
    const yVal = fn(xVal);
    const px = toX(xVal);
    const py = toY(yVal);
    // Break line if there's a huge jump (asymptote)
    if (started && Math.abs(py - prevY) > 2000) {
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px, py);
    } else if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
    prevY = py;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}
