'use client';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';

type DottedSurfaceProps = Omit<React.ComponentProps<'canvas'>, 'ref'>;

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COLS = 24;
    const ROWS = 14;
    const DOT_RADIUS = 2;
    let animId = 0;
    let tick = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gapX = canvas.width  / (COLS + 1);
      const gapY = canvas.height / (ROWS + 1);

      for (let col = 1; col <= COLS; col++) {
        for (let row = 1; row <= ROWS; row++) {
          const wave =
            Math.sin((col + tick) * 0.4) * 0.5 +
            Math.sin((row + tick) * 0.6) * 0.5;

          const alpha = 0.15 + Math.abs(wave) * 0.45;
          const scale = 0.7 + Math.abs(wave) * 0.7;

          ctx.beginPath();
          ctx.arc(col * gapX, row * gapY, DOT_RADIUS * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
          ctx.fill();
        }
      }

      tick += 0.04;
      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      {...props}
    />
  );
}
