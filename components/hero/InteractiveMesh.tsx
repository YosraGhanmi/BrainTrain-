'use client';

import { useEffect, useRef, useState } from 'react';

export default function InteractiveMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Dot grid settings
    const dotSize = 0.7;
    const spacing = 26;
    const glowRadius = 50;

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;

      // Draw dots
      for (let x = 0; x < canvas.width + spacing; x += spacing) {
        for (let y = 0; y < canvas.height + spacing; y += spacing) {
          const dx = x - mouseX;
          const dy = y - mouseY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const proximity = Math.max(0, 1 - distance / glowRadius);
          const eased = proximity * proximity;

          const radius = dotSize + eased * 1.4;
          const alpha = 0.12 + eased * 0.88;

          // Interpolate dot color from neutral ink to a vivid accent blue
          const r = Math.round(11 + (61 - 11) * eased);
          const g = Math.round(12 + (140 - 12) * eased);
          const b = Math.round(16 + (255 - 16) * eased);

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Faint, tight ambient wash around the cursor
      const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, glowRadius * 0.9);
      gradient.addColorStop(0, 'rgba(61, 140, 255, 0.22)');
      gradient.addColorStop(1, 'rgba(61, 140, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(
        mouseX - glowRadius * 0.9,
        mouseY - glowRadius * 0.9,
        glowRadius * 1.8,
        glowRadius * 1.8
      );

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isClient]);

  if (!isClient) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: 'transparent' }}
    />
  );
}
