'use client';

import { useEffect, useRef } from 'react';

const GLYPHS = 'アィウェオカキクケコサシスセソタチツテトナニヌネノ01<>/{}[]$#@%&*+=?;';

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let animationId: number;
    let columns = 0;
    let drops: number[] = [];
    const fontSize = 14;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));
    };
    resize();
    window.addEventListener('resize', resize);

    let lastTime = 0;
    const FRAME_INTERVAL = 55; // ms per glyph step — keeps it slow + cheap

    const draw = (time: number) => {
      animationId = window.requestAnimationFrame(draw);
      if (time - lastTime < FRAME_INTERVAL) return;
      lastTime = time;

      ctx.fillStyle = 'rgba(3, 7, 18, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i += 1) {
        const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // leading glyph brighter
        ctx.fillStyle = Math.random() > 0.975 ? 'rgba(167, 243, 208, 0.9)' : 'rgba(16, 185, 129, 0.35)';
        ctx.fillText(glyph, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = Math.floor(Math.random() * -30);
        }
        drops[i] += 1;
      }
    };

    animationId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.22]"
      aria-hidden="true"
    />
  );
}
