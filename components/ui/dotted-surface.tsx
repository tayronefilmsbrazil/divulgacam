'use client';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>;

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const COLS = 28;
    const ROWS = 16;
    const DOT = 2.5;

    // Cria canvas e cola no container
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    el.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    let animId = 0;
    let tick = 0;

    const resize = () => {
      const rect = el.getBoundingClientRect();
      canvas.width  = rect.width  || window.innerWidth;
      canvas.height = rect.height || 500;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gapX = canvas.width  / (COLS + 1);
      const gapY = canvas.height / (ROWS + 1);

      for (let c = 1; c <= COLS; c++) {
        for (let r = 1; r <= ROWS; r++) {
          const wave =
            Math.sin((c + tick) * 0.4) * 0.5 +
            Math.sin((r + tick) * 0.6) * 0.5;

          const alpha = 0.12 + Math.abs(wave) * 0.5;
          const radius = DOT * (0.6 + Math.abs(wave) * 0.8);

          ctx.beginPath();
          ctx.arc(c * gapX, r * gapY, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
          ctx.fill();
        }
      }

      tick += 0.04;
      animId = requestAnimationFrame(draw);
    };

    // Aguarda 1 frame para garantir que o layout está pronto
    requestAnimationFrame(() => {
      resize();
      draw();
    });

    const ro = new ResizeObserver(resize);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      if (canvas.parentNode === el) el.removeChild(canvas);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none absolute inset-0', className)}
      {...props}
    />
  );
}
