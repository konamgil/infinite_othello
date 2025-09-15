import React, { useRef, useEffect } from 'react';

interface CosmicGuardianProps {
  className?: string;
}

interface Particle {
  x: number; y: number; r: number; alpha: number; phase: number;
}

export function CosmicGuardian({ className = '' }: CosmicGuardianProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Particle[] = [];
    const numParticles = 7;

    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      return { width, height };
    };

    const { width, height } = resizeCanvas();

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 50,
        y: height / 2 + (Math.random() - 0.5) * 50,
        r: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.5,
        phase: Math.random() * Math.PI
      });
    }

    const animate = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Animate particles
      particles.forEach(p => {
        p.phase += 0.01;
        p.x += Math.sin(p.phase) * 0.1;
        p.y += Math.cos(p.phase * 0.7) * 0.1;
      });

      // Draw connections
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }

      // Draw particles (stars)
      particles.forEach(p => {
        const pulse = Math.sin(p.phase * 2) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * pulse + 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(221, 214, 254, ${p.alpha * pulse + 0.2})`;
        ctx.shadowColor = '#c4b5fd';
        ctx.shadowBlur = 10 * pulse;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(animate);
    };

    animate(0);

    window.addEventListener('resize', resizeCanvas);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}
