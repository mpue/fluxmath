import React, { useRef, useEffect, useCallback } from 'react';

interface Props {
  draw: (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    mouseX: number,
    mouseY: number,
  ) => string; // returns mouseLabel
}

export const MathCanvas: React.FC<Props> = ({ draw }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1, y: -1 });
  const mouseInfoRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mouseLabel = draw(canvas, ctx, mouseRef.current.x, mouseRef.current.y);

    const infoEl = mouseInfoRef.current;
    if (infoEl) {
      if (mouseLabel) {
        infoEl.textContent = mouseLabel;
        infoEl.style.opacity = '1';
      } else {
        infoEl.style.opacity = '0';
      }
    }
  }, [draw]);

  useEffect(() => {
    render();
    const onResize = () => render();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [render]);

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
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(render);
  }, [render]);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1, y: -1 };
    render();
  }, [render]);

  return (
    <div className="canvas-wrap">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <div className="mouse-info" ref={mouseInfoRef}>
        x: 0.0 &nbsp; y: 0.0
      </div>
    </div>
  );
};
