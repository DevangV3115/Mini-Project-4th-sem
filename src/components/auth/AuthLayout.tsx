"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
}

// Animated particle background + glass card wrapper (osmos.supply style)
export default function AuthLayout({ children }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Particles
    const PARTICLES: {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      o: number;
      color: string;
    }[] = [];
    const COUNT = 60;
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    for (let i = 0; i < COUNT; i++) {
      PARTICLES.push({
        x: Math.random() * W(),
        y: Math.random() * H(),
        r: Math.random() * 2.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        o: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.5 ? "245,158,11" : "56,189,248",
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, W(), H());

      // Draw connections
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = PARTICLES[i].x - PARTICLES[j].x;
          const dy = PARTICLES[i].y - PARTICLES[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(PARTICLES[i].x, PARTICLES[i].y);
            ctx.lineTo(PARTICLES[j].x, PARTICLES[j].y);
            ctx.strokeStyle = `rgba(148,163,184,${0.08 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of PARTICLES) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W()) p.vx *= -1;
        if (p.y < 0 || p.y > H()) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.o})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0a0e1a] overflow-hidden">
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        style={{ pointerEvents: "none" }}
      />

      {/* Ambient glow blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/[0.04] blur-[120px] auth-blob-1" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-sky-500/[0.05] blur-[120px] auth-blob-2" />
      <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-purple-500/[0.03] blur-[100px] auth-blob-3" />

      {/* Navigation back */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300 group"
      >
        <svg
          className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="text-sm font-medium">Back</span>
      </Link>

      {/* Logo */}
      <Link
        href="/"
        className="absolute top-6 right-6 z-20 logo-hover flex items-center gap-2"
      >
        <div className="logo-icon h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-sky-500 flex items-center justify-center text-white font-bold text-sm pulse-glow">
          SC
        </div>
        <span className="text-white font-semibold text-lg hidden sm:block">
          SelfCorrect<span className="text-sky-400">AI</span>
        </span>
      </Link>

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-md mx-4 auth-card-enter">
        <div className="auth-glass rounded-2xl p-8 md:p-10 border border-white/[0.08] shadow-2xl shadow-black/40">
          {children}
        </div>
      </div>
    </div>
  );
}
