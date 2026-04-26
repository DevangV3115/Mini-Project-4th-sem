"use client";

import { useState, useEffect } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-[100] backdrop-blur-md border-b transition-all duration-500 ${
        scrolled
          ? "bg-slate-900/90 border-white/10 shadow-lg shadow-black/20"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="#" className="logo-hover flex items-center gap-2 group">
            <div className="logo-icon h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-sky-500 flex items-center justify-center text-white font-bold text-sm pulse-glow">
              SC
            </div>
            <span className="text-white font-semibold text-lg hidden sm:block">
              <span className="group-hover:text-amber-300 transition-colors duration-300">SelfCorrect</span>
              <span className="text-sky-400 group-hover:text-sky-300 transition-colors duration-300">AI</span>
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-300">
            <a href="#features" className="nav-link hover:text-white transition-colors duration-300">Features</a>
            <a href="#research" className="nav-link hover:text-white transition-colors duration-300">Research</a>
            <a href="#trust" className="nav-link hover:text-white transition-colors duration-300">Why Trust Us</a>
            <a href="#testimonials" className="nav-link hover:text-white transition-colors duration-300">Testimonials</a>
            <a href="#faq" className="nav-link hover:text-white transition-colors duration-300">FAQ</a>
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button className="outline-btn px-4 py-2 text-sm text-gray-200 border border-white/20 rounded-lg">
              Log In
            </button>
            <button className="glow-btn px-4 py-2 text-sm text-white bg-gradient-to-r from-amber-500 to-sky-500 rounded-lg font-medium shadow-lg shadow-sky-500/20 relative overflow-hidden">
              <span className="relative z-10">Sign Up</span>
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ transform: menuOpen ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-400 ease-out ${
          menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-slate-900/95 backdrop-blur-md border-t border-white/10 px-4 pb-4 space-y-2">
          <a href="#features" className="block py-2 text-gray-300 hover:text-white hover:pl-2 transition-all text-sm">Features</a>
          <a href="#research" className="block py-2 text-gray-300 hover:text-white hover:pl-2 transition-all text-sm">Research</a>
          <a href="#trust" className="block py-2 text-gray-300 hover:text-white hover:pl-2 transition-all text-sm">Why Trust Us</a>
          <a href="#testimonials" className="block py-2 text-gray-300 hover:text-white hover:pl-2 transition-all text-sm">Testimonials</a>
          <a href="#faq" className="block py-2 text-gray-300 hover:text-white hover:pl-2 transition-all text-sm">FAQ</a>
          <div className="flex gap-3 pt-2">
            <button className="flex-1 px-4 py-2 text-sm text-gray-200 border border-white/20 rounded-lg outline-btn">
              Log In
            </button>
            <button className="flex-1 px-4 py-2 text-sm text-white bg-gradient-to-r from-amber-500 to-sky-500 rounded-lg font-medium glow-btn relative overflow-hidden">
              <span className="relative z-10">Sign Up</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
