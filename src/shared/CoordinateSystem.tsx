import React, { useRef, useEffect, useCallback } from 'react';
import { C } from './canvasUtils';

/* ───────────────────────── Types ───────────────────────── */

export interface Viewport {
  w: number;
  h: number;
  cx: number;
  cy: number;
  unitPx: number;
  zoom: number;
  toX: (v: number) => number;
  toY: (v: number) => number;
  toMathX: (px: number) => number;
  toMathY: (py: number) => number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export type DrawFn = (
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  mouseX: number,
  mouseY: number,
) => string;

export interface DragPoint {
  id: string;
  x: number;
  y: number;
  color?: string;
  label?: string;
  radius?: number;
}

interface Props {
  draw: DrawFn;
  heightRatio?: number;
  maxHeight?: number;
  showQuadrants?: boolean;
  dragPoints?: DragPoint[];
  onDragPoint?: (id: string, x: number, y: number) => void;
}

/* ───────────────────────── Helpers ─────────────────────── */

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 100;

function niceStep(rough: number): number {
  if (rough <= 0) return 1;
  const exp = Math.floor(Math.log10(rough));
  const frac = rough / Math.pow(10, exp);
  let nice: number;
  if (frac <= 1.5) nice = 1;
  else if (frac <= 3.5) nice = 2;
  else if (frac <= 7.5) nice = 5;
  else nice = 10;
  return nice * Math.pow(10, exp);
}

function fmtLabel(v: number): string {
  const abs = Math.abs(v);
  if (abs < 1e-10) return '0';
  if (abs >= 1 && Math.abs(v - Math.round(v)) < 0.01) return String(Math.round(v));
  if (abs >= 0.1) return parseFloat(v.toFixed(1)).toString();
  return parseFloat(v.toFixed(2)).toString();
}

/* ──────────────────────── Component ───────────────────── */

export const CoordinateSystem: React.FC<Props> = ({
  draw,
  heightRatio = 0.68,
  maxHeight = 500,
  showQuadrants = false,
  dragPoints,
  onDragPoint,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1, y: -1 });
  const mouseInfoRef = useRef<HTMLDivElement>(null);
  const zoomInfoRef = useRef<HTMLDivElement>(null);
  const resetBtnRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef(0);

  // Pan / zoom stored in refs to avoid re‑renders
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const dragRef = useRef({
    active: false, startX: 0, startY: 0, panX: 0, panY: 0,
  });
  const pointDragRef = useRef({ active: false, id: '' });
  const hoverPointRef = useRef('');
  const dragPointsRef = useRef(dragPoints);
  dragPointsRef.current = dragPoints;
  const onDragPointRef = useRef(onDragPoint);
  onDragPointRef.current = onDragPoint;

  /* ── Viewport factory ─────────────────────────────────── */

  const makeViewport = useCallback((w: number, h: number): Viewport => {
    const baseUnitPx = Math.min((w - 80) / 14, (h - 60) / 10);
    const zoom = zoomRef.current;
    const unitPx = baseUnitPx * zoom;
    const px = panRef.current.x;
    const py = panRef.current.y;
    const cx = w / 2 - px * unitPx;
    const cy = h / 2 + py * unitPx;
    return {
      w, h, cx, cy, unitPx, zoom,
      toX: (v: number) => cx + v * unitPx,
      toY: (v: number) => cy - v * unitPx,
      toMathX: (screenX: number) => (screenX - cx) / unitPx,
      toMathY: (screenY: number) => -(screenY - cy) / unitPx,
      xMin: -cx / unitPx,
      xMax: (w - cx) / unitPx,
      yMin: -(h - cy) / unitPx,
      yMax: cy / unitPx,
    };
  }, []);

  /* ── Render frame ──────────────────────────────────────── */

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement!.clientWidth;
    const h = Math.min(w * heightRatio, maxHeight);
    canvas.style.height = h + 'px';
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const vp = makeViewport(w, h);

    /* ── Grid (adaptive) ──────────────────────────────── */
    const roughStep = 70 / vp.unitPx;
    const step = niceStep(roughStep);
    const frac = step / Math.pow(10, Math.floor(Math.log10(step)));
    const majorFactor = Math.abs(frac - 5) < 0.01 ? 2 : 5;

    const isMajor = (v: number) =>
      Math.abs(
        Math.round(v / (step * majorFactor)) * (step * majorFactor) - v,
      ) < step * 0.01;

    // Vertical
    for (
      let v = Math.floor(vp.xMin / step) * step;
      v <= Math.ceil(vp.xMax / step) * step;
      v += step
    ) {
      if (Math.abs(v) < step * 0.01) continue;
      const px = vp.toX(v);
      ctx.strokeStyle = isMajor(v) ? C.gridMajor : C.grid;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
    }
    // Horizontal
    for (
      let v = Math.floor(vp.yMin / step) * step;
      v <= Math.ceil(vp.yMax / step) * step;
      v += step
    ) {
      if (Math.abs(v) < step * 0.01) continue;
      const py = vp.toY(v);
      ctx.strokeStyle = isMajor(v) ? C.gridMajor : C.grid;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
    }

    /* ── Axes ─────────────────────────────────────────── */
    if (vp.cy >= 0 && vp.cy <= h) {
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, vp.cy);
      ctx.lineTo(w, vp.cy);
      ctx.stroke();
    }
    if (vp.cx >= 0 && vp.cx <= w) {
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(vp.cx, 0);
      ctx.lineTo(vp.cx, h);
      ctx.stroke();
    }

    // Tick labels
    const labelStep = step * majorFactor;
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = C.axisLabel;

    if (vp.cy >= -20 && vp.cy <= h + 20) {
      const ly = Math.max(5, Math.min(h - 16, vp.cy + 5));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (
        let v = Math.ceil(vp.xMin / labelStep) * labelStep;
        v <= vp.xMax;
        v += labelStep
      ) {
        if (Math.abs(v) < labelStep * 0.01) continue;
        const px = vp.toX(v);
        if (px > 30 && px < w - 10) ctx.fillText(fmtLabel(v), px, ly);
      }
    }
    if (vp.cx >= -20 && vp.cx <= w + 20) {
      const lx = Math.max(35, Math.min(w - 5, vp.cx - 7));
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (
        let v = Math.ceil(vp.yMin / labelStep) * labelStep;
        v <= vp.yMax;
        v += labelStep
      ) {
        if (Math.abs(v) < labelStep * 0.01) continue;
        const py = vp.toY(v);
        if (py > 10 && py < h - 10) ctx.fillText(fmtLabel(v), lx, py);
      }
    }

    // Axis name letters
    ctx.fillStyle = 'rgba(0,212,255,0.5)';
    ctx.font = '500 13px "Exo 2", sans-serif';
    if (vp.cy >= 0 && vp.cy <= h) {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('x', w - 18, Math.max(14, Math.min(h - 14, vp.cy - 14)));
    }
    if (vp.cx >= 0 && vp.cx <= w) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        'y',
        Math.max(14, Math.min(w - 14, vp.cx + 14)),
        14,
      );
    }

    // Origin "0"
    if (vp.cx > 10 && vp.cx < w - 10 && vp.cy > 10 && vp.cy < h - 10) {
      ctx.fillStyle = C.origin;
      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('0', vp.cx - 6, vp.cy + 4);
    }

    // Quadrant labels
    if (
      showQuadrants &&
      vp.cx > 50 && vp.cx < w - 50 &&
      vp.cy > 50 && vp.cy < h - 50
    ) {
      ctx.font = '500 12px "Orbitron", monospace';
      ctx.fillStyle = C.quadrant;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('I', vp.cx + (w - vp.cx) / 2, vp.cy / 2);
      ctx.fillText('II', vp.cx / 2, vp.cy / 2);
      ctx.fillText('III', vp.cx / 2, vp.cy + (h - vp.cy) / 2);
      ctx.fillText('IV', vp.cx + (w - vp.cx) / 2, vp.cy + (h - vp.cy) / 2);
    }

    /* ── User draw callback ───────────────────────────── */
    const mouseLabel = draw(ctx, vp, mouseRef.current.x, mouseRef.current.y);

    /* ── Crosshair ────────────────────────────────────── */
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    if (mx >= 0 && my >= 0 && !dragRef.current.active && !pointDragRef.current.active) {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = C.crosshair;
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, my); ctx.lineTo(w, my); ctx.stroke();
      ctx.setLineDash([]);
    }

    /* ── Drag points ──────────────────────────────────── */
    const dps = dragPointsRef.current;
    if (dps && dps.length > 0) {
      const activeId = pointDragRef.current.active ? pointDragRef.current.id : '';
      const hoverId = hoverPointRef.current;
      for (const pt of dps) {
        const sx = vp.toX(pt.x);
        const sy = vp.toY(pt.y);
        if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;
        const color = pt.color || C.orange;
        const isActive = pt.id === activeId || pt.id === hoverId;
        const r = isActive ? 8 : 6;
        ctx.shadowColor = color;
        ctx.shadowBlur = isActive ? 16 : 8;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.stroke();
        if (pt.label) {
          ctx.fillStyle = color;
          ctx.font = '11px "Share Tech Mono", monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(pt.label, sx + r + 4, sy - r);
        }
      }
    }

    /* ── Mouse info ───────────────────────────────────── */
    const infoEl = mouseInfoRef.current;
    if (infoEl) {
      if (mouseLabel) {
        infoEl.textContent = mouseLabel;
        infoEl.style.opacity = '1';
      } else if (mx >= 0 && my >= 0) {
        infoEl.textContent =
          'x: ' + vp.toMathX(mx).toFixed(2) +
          '   y: ' + vp.toMathY(my).toFixed(2);
        infoEl.style.opacity = '1';
      } else {
        infoEl.style.opacity = '0';
      }
    }

    /* ── Zoom / reset UI ──────────────────────────────── */
    const z = zoomRef.current;
    const p = panRef.current;
    const isDefault =
      Math.abs(z - 1) < 0.01 &&
      Math.abs(p.x) < 0.01 &&
      Math.abs(p.y) < 0.01;

    if (zoomInfoRef.current) {
      zoomInfoRef.current.textContent = Math.round(z * 100) + '%';
      zoomInfoRef.current.style.opacity = isDefault ? '0' : '0.7';
    }
    if (resetBtnRef.current) {
      resetBtnRef.current.style.display = isDefault ? 'none' : 'block';
    }
  }, [draw, heightRatio, maxHeight, makeViewport, showQuadrants]);

  // Keep a mutable ref so the native wheel handler always sees the latest
  const renderRef = useRef(renderFrame);
  useEffect(() => {
    renderRef.current = renderFrame;
  });

  const scheduleRender = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => renderRef.current());
  }, []);

  /* ── Initial render + resize ───────────────────────── */
  useEffect(() => {
    renderFrame();
    const onResize = () => renderRef.current();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [renderFrame]);

  /* ── Wheel zoom (native listener, non‑passive) ────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const sx = (e.clientX - rect.left) * canvas.width / dpr / rect.width;
      const sy = (e.clientY - rect.top) * canvas.height / dpr / rect.height;

      const w = canvas.parentElement!.clientWidth;
      const h = Math.min(w * heightRatio, maxHeight);
      const baseUnitPx = Math.min((w - 80) / 14, (h - 60) / 10);

      const oldZoom = zoomRef.current;
      const oldUnitPx = baseUnitPx * oldZoom;

      const factor = Math.pow(0.999, e.deltaY);
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom * factor));
      const newUnitPx = baseUnitPx * newZoom;

      // Keep the math position under cursor stable
      const cx = w / 2 - panRef.current.x * oldUnitPx;
      const cy = h / 2 + panRef.current.y * oldUnitPx;
      const mathX = (sx - cx) / oldUnitPx;
      const mathY = -(sy - cy) / oldUnitPx;

      panRef.current = {
        x: mathX - (sx - w / 2) / newUnitPx,
        y: mathY + (sy - h / 2) / newUnitPx,
      };
      zoomRef.current = newZoom;

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => renderRef.current());
    };

    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, [heightRatio, maxHeight]);

  /* ── Helpers ────────────────────────────────────────── */

  const toCanvasCoords = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      return {
        x: (e.clientX - rect.left) * canvas.width / dpr / rect.width,
        y: (e.clientY - rect.top) * canvas.height / dpr / rect.height,
      };
    }, [],
  );

  /* ── Mouse handlers ─────────────────────────────────── */

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      const c = toCanvasCoords(e);

      // Check drag points first
      const dps = dragPointsRef.current;
      if (dps && onDragPointRef.current) {
        const canvas = canvasRef.current!;
        const w = canvas.parentElement!.clientWidth;
        const h = Math.min(w * heightRatio, maxHeight);
        const vp = makeViewport(w, h);
        for (const pt of dps) {
          const dx = c.x - vp.toX(pt.x);
          const dy = c.y - vp.toY(pt.y);
          const hitR = pt.radius || 14;
          if (dx * dx + dy * dy <= hitR * hitR) {
            pointDragRef.current = { active: true, id: pt.id };
            if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
            e.preventDefault();
            return;
          }
        }
      }

      dragRef.current = {
        active: true,
        startX: c.x,
        startY: c.y,
        panX: panRef.current.x,
        panY: panRef.current.y,
      };
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
      e.preventDefault();
    }, [toCanvasCoords, heightRatio, maxHeight, makeViewport],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const coords = toCanvasCoords(e);
      mouseRef.current = coords;

      // Point dragging
      if (pointDragRef.current.active && onDragPointRef.current) {
        const canvas = canvasRef.current!;
        const w = canvas.parentElement!.clientWidth;
        const h = Math.min(w * heightRatio, maxHeight);
        const vp = makeViewport(w, h);
        onDragPointRef.current(pointDragRef.current.id, vp.toMathX(coords.x), vp.toMathY(coords.y));
        scheduleRender();
        return;
      }

      // Pan dragging
      const d = dragRef.current;
      if (d.active) {
        const canvas = canvasRef.current!;
        const w = canvas.parentElement!.clientWidth;
        const h = Math.min(w * heightRatio, maxHeight);
        const baseUnitPx = Math.min((w - 80) / 14, (h - 60) / 10);
        const unitPx = baseUnitPx * zoomRef.current;
        panRef.current = {
          x: d.panX - (coords.x - d.startX) / unitPx,
          y: d.panY + (coords.y - d.startY) / unitPx,
        };
      }

      // Hover detection for drag points
      const dps = dragPointsRef.current;
      if (dps && !dragRef.current.active) {
        const canvas = canvasRef.current!;
        const w = canvas.parentElement!.clientWidth;
        const h = Math.min(w * heightRatio, maxHeight);
        const vp = makeViewport(w, h);
        let found = '';
        for (const pt of dps) {
          const dx = coords.x - vp.toX(pt.x);
          const dy = coords.y - vp.toY(pt.y);
          const hitR = pt.radius || 14;
          if (dx * dx + dy * dy <= hitR * hitR) { found = pt.id; break; }
        }
        hoverPointRef.current = found;
        if (canvas) canvas.style.cursor = found ? 'pointer' : 'grab';
      }

      scheduleRender();
    }, [toCanvasCoords, scheduleRender, heightRatio, maxHeight, makeViewport],
  );

  const handleMouseUp = useCallback(() => {
    pointDragRef.current = { active: false, id: '' };
    dragRef.current.active = false;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1, y: -1 };
    pointDragRef.current = { active: false, id: '' };
    hoverPointRef.current = '';
    dragRef.current.active = false;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
    scheduleRender();
  }, [scheduleRender]);

  const handleDoubleClick = useCallback(() => {
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    scheduleRender();
  }, [scheduleRender]);

  const handleReset = useCallback(() => {
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    scheduleRender();
  }, [scheduleRender]);

  /* ── Touch events (native, non-passive) ─────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const getCoords = (t: Touch) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      return {
        x: (t.clientX - rect.left) * canvas.width / dpr / rect.width,
        y: (t.clientY - rect.top) * canvas.height / dpr / rect.height,
      };
    };
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const c = getCoords(e.touches[0]);
      mouseRef.current = c;
      const dps = dragPointsRef.current;
      if (dps && onDragPointRef.current) {
        const w = canvas.parentElement!.clientWidth;
        const h = Math.min(w * heightRatio, maxHeight);
        const vp = makeViewport(w, h);
        for (const pt of dps) {
          const dx = c.x - vp.toX(pt.x);
          const dy = c.y - vp.toY(pt.y);
          const hitR = (pt.radius || 14) * 1.5;
          if (dx * dx + dy * dy <= hitR * hitR) {
            e.preventDefault();
            pointDragRef.current = { active: true, id: pt.id };
            return;
          }
        }
      }
      dragRef.current = {
        active: true, startX: c.x, startY: c.y,
        panX: panRef.current.x, panY: panRef.current.y,
      };
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const c = getCoords(e.touches[0]);
      mouseRef.current = c;
      if (pointDragRef.current.active && onDragPointRef.current) {
        e.preventDefault();
        const w = canvas.parentElement!.clientWidth;
        const h = Math.min(w * heightRatio, maxHeight);
        const vp = makeViewport(w, h);
        onDragPointRef.current(pointDragRef.current.id, vp.toMathX(c.x), vp.toMathY(c.y));
        scheduleRender();
        return;
      }
      const d = dragRef.current;
      if (d.active) {
        e.preventDefault();
        const w = canvas.parentElement!.clientWidth;
        const h = Math.min(w * heightRatio, maxHeight);
        const baseUnitPx = Math.min((w - 80) / 14, (h - 60) / 10);
        const unitPx = baseUnitPx * zoomRef.current;
        panRef.current = {
          x: d.panX - (c.x - d.startX) / unitPx,
          y: d.panY + (c.y - d.startY) / unitPx,
        };
        scheduleRender();
      }
    };
    const onEnd = () => {
      pointDragRef.current = { active: false, id: '' };
      dragRef.current.active = false;
      mouseRef.current = { x: -1, y: -1 };
      scheduleRender();
    };
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onEnd);
    canvas.addEventListener('touchcancel', onEnd);
    return () => {
      canvas.removeEventListener('touchstart', onStart);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onEnd);
      canvas.removeEventListener('touchcancel', onEnd);
    };
  }, [heightRatio, maxHeight, makeViewport, scheduleRender]);

  /* ── JSX ────────────────────────────────────────────── */

  return (
    <div className="canvas-wrap" style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        onContextMenu={e => e.preventDefault()}
        style={{ cursor: 'grab' }}
      />
      <div className="mouse-info" ref={mouseInfoRef}>
        x: 0.0 &nbsp; y: 0.0
      </div>
      <div
        ref={zoomInfoRef}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          fontFamily: '"Share Tech Mono", monospace',
          fontSize: '10px',
          color: '#00d4ff',
          opacity: 0,
          pointerEvents: 'none',
          letterSpacing: '.05em',
        }}
      />
      <button
        ref={resetBtnRef}
        onClick={handleReset}
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          display: 'none',
          background: 'rgba(0,212,255,0.08)',
          border: '1px solid rgba(0,212,255,0.2)',
          color: '#00d4ff',
          fontFamily: '"Share Tech Mono", monospace',
          fontSize: '10px',
          padding: '3px 10px',
          cursor: 'pointer',
          letterSpacing: '.08em',
        }}
      >
        RESET
      </button>
      <button
        onClick={() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const link = document.createElement('a');
          link.download = 'fluxmath-graph.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        }}
        style={{
          position: 'absolute',
          top: 8,
          left: 80,
          background: 'rgba(0,212,255,0.08)',
          border: '1px solid rgba(0,212,255,0.2)',
          color: '#00d4ff',
          fontFamily: '"Share Tech Mono", monospace',
          fontSize: '10px',
          padding: '3px 10px',
          cursor: 'pointer',
          letterSpacing: '.08em',
        }}
      >
        PNG ↓
      </button>
    </div>
  );
};
