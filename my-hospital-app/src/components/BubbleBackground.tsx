'use client';

import { useEffect, useRef } from 'react';

export default function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<
    { x: number; y: number; vx: number; vy: number; size: number; color: string }[]
  >([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numParticles = 400; // denser network
    const maxVelocity = 0.6; // smoother floating movement
    const connectThreshold = 90; // tighter proximity connecting lines
    const closeConnect = 70; // secondary layer for strong inner links

    const setCanvasSize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    setCanvasSize();

    // Blue–teal gradient palette
    const palette = [
      'rgba(56,189,248,0.85)',  // cyan glow
      'rgba(45,212,191,0.85)',  // teal glow
      'rgba(125,211,252,0.8)',  // sky glow
      'rgba(147,197,253,0.7)',  // light blue
    ];

    // Generate particles
    if (particles.current.length === 0) {
      for (let i = 0; i < numParticles; i++) {
        particles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * maxVelocity,
          vy: (Math.random() - 0.5) * maxVelocity,
          size: Math.random() * 1 + 0.5, // smaller dots
          color: palette[Math.floor(Math.random() * palette.length)],
        });
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // draw all particles
      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;

        // bounce slightly on edges
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // add natural drift
        p.vx += (Math.random() - 0.5) * 0.01;
        p.vy += (Math.random() - 0.5) * 0.01;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
      }

      // connect nearby particles
      for (let i = 0; i < particles.current.length; i++) {
        for (let j = i + 1; j < particles.current.length; j++) {
          const a = particles.current[i];
          const b = particles.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectThreshold) {
            const alpha = 1 - dist / connectThreshold;
            ctx.beginPath();

            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, a.color);
            grad.addColorStop(1, b.color);

            ctx.strokeStyle =
              dist < closeConnect
                ? `rgba(56,189,248,${alpha * 0.7})`
                : `rgba(45,212,191,${alpha * 0.3})`;
            ctx.lineWidth = dist < closeConnect ? 0.9 : 0.4;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener('resize', setCanvasSize);
    return () => window.removeEventListener('resize', setCanvasSize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0 opacity-95 pointer-events-none"
    />
  );
}
