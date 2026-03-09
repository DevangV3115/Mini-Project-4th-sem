"use client";

import { useRef, ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function GlowButton({ children, className = "" }: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    btn.style.setProperty("--glow-x", `${x}px`);
    btn.style.setProperty("--glow-y", `${y}px`);
  };

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      className={`glow-btn relative overflow-hidden ${className}`}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}
