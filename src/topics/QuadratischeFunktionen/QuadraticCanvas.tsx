import React, { useRef, useEffect, useCallback } from 'react';
import { drawQuadraticFunction } from './canvasRenderer';

interface CanvasProps {
  a: number;
  b: number;
  c: number;
  onDrag?: (newB: number, newC: number) => void;
}

function getCanvasLayout(canvas: HTMLCanvasElement) {
  const w = canvas.parentElement!.clientWidth;
  const h = Math.min(w * 0.68, 500);
  const cx = w / 2;
  const cy = h / 2;
  const unitPx = Math.min((w - 80) / 14, (h - 60) / 10);
  return { w, h, cx, cy, unitPx };
}

export const QuadraticCanvas: React.FC<CanvasProps> = ({ a, b, c, onDrag }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1, y: -1 });
  const mouseInfoRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const dragRef = useRef<{ dragging: boolean; startMathX: number; startMathY: number; startH: number; startK: number } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { mouseLabel } = drawQuadraticFunction(
      canvas, ctx, a, b, c, mouseRef.current.x, mouseRef.current.y
    );

    const infoEl = mouseInfoRef.current;
    if (infoEl) {
      if (mouseLabel) {
        infoEl.textContent = mouseLabel;
        infoEl.style.opacity = '1';
      } else {
        infoEl.style.opacity = '0';
      }
    }
  }, [a, b, c]);

  useEffect(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  const toMath = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { mx: 0, my: 0 };
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const scaleX = canvas.width / dpr / rect.width;
    const scaleY = canvas.height / dpr / rect.height;
    const px = (clientX - rect.left) * scaleX;
    const py = (clientY - rect.top) * scaleY;
    const { cx, cy, unitPx } = getCanvasLayout(canvas);
    return { mx: (px - cx) / unitPx, my: -(py - cy) / unitPx };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const scaleX = canvas.width / dpr / rect.width;
    const scaleY = canvas.height / dpr / rect.height;
    mouseRef.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };

    const drag = dragRef.current;
    if (drag?.dragging && onDrag && Math.abs(a) > 0.001) {
      const { mx, my } = toMath(e.clientX, e.clientY);
      const newH = drag.startH + (mx - drag.startMathX);
      const newK = drag.startK + (my - drag.startMathY);
      const newB = -2 * a * newH;
      const newC = a * newH * newH + newK;
      onDrag(newB, newC);
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [draw, a, onDrag, toMath]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (Math.abs(a) < 0.001) return;
    const { mx, my } = toMath(e.clientX, e.clientY);
    const hVertex = -b / (2 * a);
    const kVertex = c - (b * b) / (4 * a);
    dragRef.current = { dragging: true, startMathX: mx, startMathY: my, startH: hVertex, startK: kVertex };
  }, [a, b, c, toMath]);

  const handleMouseUp = useCallback(() => {
    if (dragRef.current) dragRef.current.dragging = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1, y: -1 };
    if (dragRef.current) dragRef.current.dragging = false;
    draw();
  }, [draw]);

  return (
    <div className="canvas-wrap">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: dragRef.current?.dragging ? 'grabbing' : 'crosshair' }}
      />
      <div className="mouse-info" ref={mouseInfoRef}>
        x: 0.0 &nbsp; y: 0.0
      </div>
    </div>
  );
};
