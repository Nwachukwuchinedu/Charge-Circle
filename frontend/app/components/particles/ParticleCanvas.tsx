'use client';

import { useRef, useEffect } from 'react';

interface ParticleCanvasProps {
  particleCount?: number;
  color?: string;
  mouseInteraction?: boolean;
  gridLines?: boolean;
  pulse?: boolean;
  className?: string;
}

export default function ParticleCanvas({
  particleCount = 60,
  color = 'rgba(99, 102, 241, 0.2)',
  mouseInteraction = false,
  gridLines = false,
  pulse = false,
  className = 'fixed inset-0 pointer-events-none z-0',
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let mouseX = -1000;
    let mouseY = -1000;
    let pulsePhase = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let onMouse: ((e: MouseEvent) => void) | null = null;
    if (mouseInteraction) {
      onMouse = (e: MouseEvent) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      };
      window.addEventListener('mousemove', onMouse);
    }

    const particles: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      if (gridLines) {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 60) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // Central pulse
      if (pulse) {
        pulsePhase += 0.02;
        const pulseRadius = 40 + Math.sin(pulsePhase) * 10;
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, pulseRadius * 3,
        );
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.04)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Mouse repulsion
        if (mouseInteraction) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const force = (120 - dist) / 120;
            p.x += dx * force * 0.03;
            p.y += dy * force * 0.03;
          }
        }

        // Wrap
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      // Connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const threshold = mouseInteraction ? 180 : 150;
          if (dist < threshold) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 * (1 - dist / threshold)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      if (mouseInteraction && onMouse) {
        window.removeEventListener('mousemove', onMouse);
      }
    };
  }, [particleCount, color, mouseInteraction, gridLines, pulse]);

  return <canvas ref={canvasRef} className={className} />;
}
