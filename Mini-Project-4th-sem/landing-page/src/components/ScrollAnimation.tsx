"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const TOTAL_FRAMES = 240;

function getFrameSrc(index: number): string {
  const num = String(index + 1).padStart(3, "0");
  return `/sequence/ezgif-frame-${num}.jpg`;
}

// Text overlays that appear at specific scroll progress ranges
const OVERLAYS = [
  {
    start: 0.0,
    end: 0.12,
    title: "Self-Correcting Reasoning",
    subtitle: "in Large Language Models",
    desc: "Without Any Supervision",
  },
  {
    start: 0.15,
    end: 0.28,
    title: "The Problem",
    subtitle: "",
    desc: "LLMs often produce plausible but incorrect reasoning chains — and lack the ability to detect and fix their own mistakes.",
  },
  {
    start: 0.32,
    end: 0.45,
    title: "Why Self-Correction Matters",
    subtitle: "",
    desc: "Human experts naturally verify and revise their reasoning. Teaching LLMs to do the same could dramatically improve reliability.",
  },
  {
    start: 0.48,
    end: 0.62,
    title: "No External Labels Needed",
    subtitle: "",
    desc: "This approach enables models to learn self-correction from their own outputs — no human-annotated corrections or reward models required.",
  },
  {
    start: 0.65,
    end: 0.78,
    title: "Intrinsic Self-Verification",
    subtitle: "",
    desc: "The model generates multiple reasoning paths, cross-checks for consistency, and learns to prefer self-consistent answers over time.",
  },
  {
    start: 0.82,
    end: 0.95,
    title: "A New Paradigm",
    subtitle: "",
    desc: "Unsupervised self-correcting reasoning opens the door to autonomous, continuously improving AI systems.",
  },
];

export default function ScrollAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [inView, setInView] = useState(true);
  const frameIndexRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = imagesRef.current[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    // Only resize buffer when needed
    const bw = w * dpr;
    const bh = h * dpr;
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Cover-fit the image
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(w / iw, h / ih);
    const sw = iw * scale;
    const sh = ih * scale;
    const sx = (w - sw) / 2;
    const sy = (h - sh) / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, sx, sy, sw, sh);
  }, []);

  // Preload all images
  useEffect(() => {
    const images: HTMLImageElement[] = [];
    let loaded = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameSrc(i);
      img.onload = () => {
        loaded++;
        setLoadedCount(loaded);
        if (i === 0) drawFrame(0);
      };
      images.push(img);
    }

    imagesRef.current = images;
  }, [drawFrame]);

  // Scroll handler
  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const scrollableHeight = container.offsetHeight - window.innerHeight;
        if (scrollableHeight <= 0) return;

        const scrolled = -rect.top;
        const p = Math.min(Math.max(scrolled / scrollableHeight, 0), 1);
        setProgress(p);

        // Canvas is visible when the container overlaps the viewport
        setInView(rect.bottom > 0 && rect.top < window.innerHeight);

        const index = Math.min(
          Math.floor(p * TOTAL_FRAMES),
          TOTAL_FRAMES - 1
        );
        frameIndexRef.current = index;
        drawFrame(index);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [drawFrame]);

  // Redraw when images finish loading
  useEffect(() => {
    if (loadedCount >= 1) drawFrame(frameIndexRef.current);
  }, [loadedCount, drawFrame]);

  // Redraw on resize
  useEffect(() => {
    const onResize = () => drawFrame(frameIndexRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [drawFrame]);

  const isLoading = loadedCount < TOTAL_FRAMES;

  const getOverlayOpacity = (start: number, end: number) => {
    const fadeIn = 0.03;
    const fadeOut = 0.03;
    if (progress < start || progress > end) return 0;
    if (progress < start + fadeIn) return (progress - start) / fadeIn;
    if (progress > end - fadeOut) return (end - progress) / fadeOut;
    return 1;
  };

  return (
    <div ref={containerRef} className="relative" style={{ height: "600vh" }}>
      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/80 text-amber-300 px-4 py-2 rounded-full text-sm backdrop-blur-md border border-white/10">
          Loading frames… {Math.round((loadedCount / TOTAL_FRAMES) * 100)}%
        </div>
      )}

      {/* Fixed canvas – visible while scrolling through this container */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: inView ? "block" : "none",
          zIndex: 1,
        }}
      />

      {/* Text overlays */}
      {OVERLAYS.map((overlay, i) => {
        const opacity = getOverlayOpacity(overlay.start, overlay.end);
        const scale = 0.92 + opacity * 0.08;
        const blur = (1 - opacity) * 6;
        const yShift = (1 - opacity) * 20;
        return (
          <div
            key={i}
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
            style={{
              opacity,
              visibility: opacity > 0 ? "visible" : "hidden",
              zIndex: 2,
            }}
          >
            <div
              className="text-center px-6 max-w-3xl"
              style={{
                transform: `scale(${scale}) translateY(${yShift}px)`,
                filter: `blur(${blur}px)`,
                transition: "transform 0.15s ease-out, filter 0.15s ease-out",
              }}
            >
              <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/10 shadow-2xl shadow-sky-500/10">
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight shimmer-text">
                  {overlay.title}
                </h2>
                {overlay.subtitle && (
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-light bg-gradient-to-r from-amber-300 to-sky-400 bg-clip-text text-transparent mb-4">
                    {overlay.subtitle}
                  </h3>
                )}
                <p className="text-base md:text-lg lg:text-xl text-gray-200 leading-relaxed max-w-xl mx-auto">
                  {overlay.desc}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Scroll hint */}
      {progress < 0.05 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center gap-1" style={{ zIndex: 2 }}>
          <span className="text-amber-300/80 text-sm font-medium tracking-wide">Scroll to explore</span>
          <svg className="w-5 h-5 text-sky-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      )}
    </div>
  );
}
