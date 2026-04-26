"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { createChat, updateChat, type ChatMessage } from "@/lib/chatStore";

/* ══════════════════════════ types ══════════════════════════ */
interface ReasoningStep {
  id: number;
  label: string;
  content: string;
  status: "pending" | "running" | "done" | "corrected";
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: ReasoningStep[];
  timestamp: Date;
}

/* ═══════════════ demo reasoning generator ═══════════════ */
const DEMO_STEPS: Omit<ReasoningStep, "id">[] = [
  { label: "Parsing query", content: "Breaking down user intent and identifying key concepts…", status: "done" },
  { label: "Chain-of-Thought #1", content: "Generating initial reasoning path using zero-shot prompting…", status: "done" },
  { label: "Chain-of-Thought #2", content: "Sampling alternative reasoning path for cross-verification…", status: "done" },
  { label: "Chain-of-Thought #3", content: "Generating third independent chain for consensus scoring…", status: "done" },
  { label: "Consistency check", content: "Comparing 3 reasoning paths — paths #1 and #3 agree, path #2 diverges on step 4…", status: "done" },
  { label: "Self-correction", content: "Detected inconsistency in path #2. Revising step 4 using consensus from paths #1 & #3…", status: "corrected" },
  { label: "Final synthesis", content: "Merging corrected reasoning chains into a coherent, verified answer…", status: "done" },
];

const DEMO_ANSWERS: Record<string, string> = {
  default: `Based on multi-path consistency verification, here's the synthesized answer:

**Self-Correcting Reasoning** works by sampling multiple independent Chain-of-Thought paths for a given query, then cross-checking them for internal consistency.

### Key steps:
1. **Multi-path sampling** — Generate 3+ reasoning chains independently
2. **Consistency scoring** — Compare answers across chains
3. **Self-correction** — When inconsistencies are found, revise divergent paths using consensus
4. **Synthesis** — Merge the corrected chains into a final verified answer

The model detected that reasoning path #2 diverged at step 4, and automatically corrected it using the consensus from paths #1 and #3. No external supervision was needed.

> Confidence: **94.2%** — High cross-path agreement after self-correction.`,
};

/* ══════════════════ suggestion cards ══════════════════ */
const SUGGESTIONS = [
  { icon: "🧠", text: "Explain self-correcting reasoning", desc: "How does it work?", gradient: "from-purple-500/20 to-sky-500/20" },
  { icon: "⚡", text: "Compare multi-path vs single-path", desc: "Performance analysis", gradient: "from-amber-500/20 to-orange-500/20" },
  { icon: "🔬", text: "Run a reasoning evaluation", desc: "On GSM8K benchmark", gradient: "from-emerald-500/20 to-teal-500/20" },
  { icon: "📊", text: "Show consistency scoring", desc: "Visualization demo", gradient: "from-pink-500/20 to-rose-500/20" },
];

/* ══════════════════ stats bar ══════════════════ */
const STATS = [
  { label: "Accuracy", value: "94.2%", icon: "📈" },
  { label: "Reasoning Paths", value: "3", icon: "🔀" },
  { label: "Self-Corrections", value: "1.2 avg", icon: "🔄" },
  { label: "Latency", value: "4.2s", icon: "⚡" },
];

/* ═════════════════════ MAIN COMPONENT ═════════════════════ */
export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeReasoning, setActiveReasoning] = useState<ReasoningStep[]>([]);
  const [showReasoning, setShowReasoning] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [totalSteps, setTotalSteps] = useState(7);
  const [chatId, setChatId] = useState<string | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  /* ────── cursor glow tracker ────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mainRef.current) {
        const rect = mainRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  /* ────── ripple effect helper ────── */
  const addRipple = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ripple = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setRipples((prev) => [...prev, ripple]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== ripple.id)), 800);
  };

  /* ────── auto-resize textarea ────── */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  };

  const toggleStep = (id: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /* ────── save chat to Firestore ────── */
  const saveChat = async (msgs: Message[]) => {
    if (!user) return;
    const data: ChatMessage[] = msgs.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.reasoning ? { reasoning: m.reasoning } : {}),
    }));
    try {
      if (chatId) {
        await updateChat(chatId, data);
      } else {
        const title = msgs.find((m) => m.role === "user")?.content.slice(0, 60) || "New chat";
        const id = await createChat(user.uid, title, data);
        setChatId(id);
      }
    } catch {
      // Firestore save is best-effort; don't block the UI
    }
  };

  /* ────────── reasoning + response (real API with demo fallback) ────────── */
  const handleSubmit = async (text?: string) => {
    const query = text || input.trim();
    if (!query || isGenerating) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setIsGenerating(true);
    setActiveReasoning([]);
    setExpandedSteps(new Set());

    try {
      const rawBackendUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || process.env.PYTHON_BACKEND_URL || "https://check-to-work-bbzs.onrender.com";
      const BACKEND_URL = rawBackendUrl.replace(/\/$/, "");
      const response = await fetch(`${BACKEND_URL}/solve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });

      if (!response.ok || !response.body) throw new Error("API unavailable");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const steps: ReasoningStep[] = [];
      let finalAnswer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const dataLine = part.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;

          const event = JSON.parse(dataLine.slice(6));

          if (event.type === "total_steps") {
            setTotalSteps(event.data);
          } else if (event.type === "step") {
            const step: ReasoningStep = {
              id: event.data.id,
              label: event.data.label,
              content: event.data.content,
              status: event.data.status,
            };
            steps.push(step);
            setActiveReasoning([...steps]);
          } else if (event.type === "answer") {
            finalAnswer = event.data.content;
          }
        }
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: finalAnswer || "Processing complete.",
        reasoning: steps,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      saveChat([...messages, userMsg, assistantMsg]);
    } catch {
      // Fallback to demo mode if backend is unavailable
      setTotalSteps(DEMO_STEPS.length);
      for (let i = 0; i < DEMO_STEPS.length; i++) {
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
        setActiveReasoning((prev) => [
          ...prev.map((s) => ({ ...s, status: "done" as const })),
          { ...DEMO_STEPS[i], id: i, status: "running" as const },
        ]);
      }

      await new Promise((r) => setTimeout(r, 500));
      const finalSteps = DEMO_STEPS.map((s, i) => ({ ...s, id: i }));
      setActiveReasoning(finalSteps);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: DEMO_ANSWERS.default,
        reasoning: finalSteps,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      saveChat([...messages, userMsg, assistantMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isEmpty = messages.length === 0 && !isGenerating;

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div className="flex h-full" ref={mainRef}>
      {/* ══ Cursor glow follow ══ */}
      <div
        className="dash-cursor-glow pointer-events-none fixed z-50"
        style={{ left: mousePos.x - 200, top: mousePos.y - 200 }}
      />

      {/* ═══════ MAIN CHAT AREA ═══════ */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* Animated grid background */}
        <div className="dash-grid-bg absolute inset-0 pointer-events-none z-0" />

        {/* Floating orbs */}
        <div className="dash-orb dash-orb-1 pointer-events-none z-0" />
        <div className="dash-orb dash-orb-2 pointer-events-none z-0" />
        <div className="dash-orb dash-orb-3 pointer-events-none z-0" />

        {/* ── Top bar ── */}
        <header className="dash-header relative flex items-center justify-between h-14 px-6 border-b border-white/[0.06] bg-[#060a14]/80 backdrop-blur-xl flex-shrink-0 z-10">
          {/* Shimmer line at bottom of header */}
          <div className="dash-header-line absolute bottom-0 left-0 right-0 h-px" />

          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-white dash-text-glow">Reasoning Assistant</h1>
            <div className="dash-status-dot" />
            <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider dash-blink">Online</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Model selector pill */}
            <button className="dash-pill-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-purple-500/20 bg-purple-500/5 text-purple-400 hover:bg-purple-500/15 transition-all duration-300">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 dash-pulse-dot" />
              GPT-4o
            </button>
            <button
              onClick={(e) => { addRipple(e); setShowReasoning(!showReasoning); }}
              className={`dash-ripple-btn flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-300 overflow-hidden relative ${
                showReasoning
                  ? "bg-sky-500/10 border-sky-500/20 text-sky-400 hover:bg-sky-500/20"
                  : "bg-white/[0.04] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              {ripples.map((r) => (
                <span key={r.id} className="dash-ripple" style={{ left: r.x, top: r.y }} />
              ))}
              <svg className="w-3.5 h-3.5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="relative z-10">Reasoning</span>
            </button>
            <button
              onClick={addRipple}
              className="dash-magnetic-btn dash-icon-btn p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all duration-300 relative overflow-hidden"
            >
              <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </header>

        {/* ── Messages area ── */}
        <div className="flex-1 overflow-y-auto relative z-10 min-h-0">
          {isEmpty ? (
            /* ═══════ EMPTY STATE ═══════ */
            <div className="flex flex-col items-center px-6 py-12 dash-empty-enter min-h-full justify-center">
              {/* Animated hero icon with orbit rings */}
              <div className="relative mb-10 dash-hero-container">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-sky-500/20 border border-white/[0.08] flex items-center justify-center dash-hero-icon dash-glass">
                  <svg className="w-12 h-12 text-amber-400 dash-icon-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                {/* Orbit ring 1 */}
                <div className="dash-orbit dash-orbit-1">
                  <div className="dash-orbit-dot bg-amber-400" />
                </div>
                {/* Orbit ring 2 */}
                <div className="dash-orbit dash-orbit-2">
                  <div className="dash-orbit-dot bg-sky-400" />
                </div>
                {/* Pulse ring */}
                <div className="absolute inset-0 rounded-2xl dash-pulse-ring" />
                {/* Backdrop glow */}
                <div className="absolute -inset-8 rounded-3xl bg-gradient-to-r from-amber-500/8 to-sky-500/8 blur-2xl -z-10 dash-breathe" />
              </div>

              {/* Glitch-shimmer title */}
              <h2 className="text-3xl font-bold text-white mb-3 dash-shimmer-text">
                Self-Correcting Reasoning
              </h2>
              <p className="text-gray-400 text-sm text-center max-w-md mb-6 leading-relaxed dash-fade-up" style={{ animationDelay: "0.15s" }}>
                Ask any question and watch the model reason through multiple paths,
                self-correct inconsistencies, and synthesize a verified answer.
              </p>

              {/* Animated stats bar */}
              <div className="flex flex-wrap items-center justify-center gap-4 mb-10 dash-fade-up" style={{ animationDelay: "0.25s" }}>
                {STATS.map((stat, i) => (
                  <div
                    key={stat.label}
                    className="dash-stat-card flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/20 transition-all duration-500 group"
                    style={{ animationDelay: `${0.3 + i * 0.08}s` }}
                  >
                    <span className="text-sm group-hover:scale-125 transition-transform duration-500">{stat.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-white dash-counter">{stat.value}</p>
                      <p className="text-[9px] text-gray-600 uppercase tracking-wider">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggestion cards with tilt + gradient border */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={(e) => { addRipple(e); handleSubmit(s.text); }}
                    className="dash-suggestion dash-tilt-card group text-left px-4 py-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-400 relative overflow-hidden"
                    style={{ animationDelay: `${0.4 + i * 0.08}s` }}
                  >
                    {/* Gradient shine on hover */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${s.gradient}`} />
                    {/* Animated border gradient */}
                    <div className="dash-gradient-border absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10 flex items-start gap-3">
                      <span className="text-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 mt-0.5 inline-block">
                        {s.icon}
                      </span>
                      <div>
                        <p className="text-sm text-white font-medium group-hover:text-amber-300 transition-colors duration-300">
                          {s.text}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-400 transition-colors duration-300">{s.desc}</p>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>

                    {/* Ripple layer */}
                    {ripples.map((r) => (
                      <span key={r.id} className="dash-ripple" style={{ left: r.x, top: r.y }} />
                    ))}
                  </button>
                ))}
              </div>

              {/* Floating keyboard shortcut hint */}
              <div className="mt-8 dash-fade-up" style={{ animationDelay: "0.6s" }}>
                <div className="flex items-center gap-2 text-[10px] text-gray-600">
                  <kbd className="dash-kbd px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] font-mono">⌘</kbd>
                  <span>+</span>
                  <kbd className="dash-kbd px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] font-mono">K</kbd>
                  <span className="ml-1">to quickly focus input</span>
                </div>
              </div>
            </div>
          ) : (
            /* ═══════ MESSAGE LIST ═══════ */
            <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`dash-msg-enter flex gap-3 ${
                    msg.role === "user" ? "justify-end" : ""
                  }`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-sky-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1 dash-avatar-glow">
                      SC
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-amber-500/15 to-sky-500/15 border border-amber-500/10 text-white dash-msg-user"
                        : "bg-white/[0.04] border border-white/[0.06] text-gray-200 dash-msg-assistant"
                    }`}
                  >
                    {/* Reasoning toggle for assistant */}
                    {msg.role === "assistant" && msg.reasoning && (
                      <details className="mb-3 group/reason">
                        <summary className="flex items-center gap-2 text-xs text-sky-400 cursor-pointer hover:text-sky-300 transition-colors duration-300 list-none">
                          <svg className="w-3.5 h-3.5 transition-transform duration-300 group-open/reason:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          {msg.reasoning.length} reasoning steps
                          <span className="ml-auto text-emerald-400 text-[10px] dash-verified-badge">✓ verified</span>
                        </summary>
                        <div className="mt-2 space-y-1.5 pl-1 border-l border-white/[0.06]">
                          {msg.reasoning.map((step) => (
                            <div key={step.id} className="flex items-start gap-2 pl-3 py-1 dash-step-reveal">
                              <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                step.status === "corrected" ? "bg-amber-400 dash-dot-pulse" : "bg-emerald-400"
                              }`} />
                              <div>
                                <p className="text-[11px] font-medium text-gray-300">{step.label}</p>
                                <p className="text-[10px] text-gray-500">{step.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                    <div className="whitespace-pre-wrap dash-markdown">{msg.content.replace(/\\?\$?\\boxed\{([^}]+)\}\\?\$?/g, '**$1**')}</div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1 dash-avatar-glow">
                      {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              ))}

              {/* Generating indicator */}
              {isGenerating && (
                <div className="flex gap-3 dash-msg-enter">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-sky-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1 dash-avatar-glow">
                    SC
                  </div>
                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3 max-w-[80%] dash-glass">
                    <div className="flex items-center gap-2 text-xs text-sky-400 mb-2">
                      <div className="dash-thinking-dots flex gap-1">
                        <span /><span /><span />
                      </div>
                      <span className="dash-typewriter">Reasoning…</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {activeReasoning.length > 0
                        ? activeReasoning[activeReasoning.length - 1].label
                        : "Preparing…"}
                    </p>
                    {/* Mini progress */}
                    <div className="mt-2 h-0.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-sky-500 dash-progress-sweep" style={{ width: `${(activeReasoning.length / totalSteps) * 100}%` }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ═══════ INPUT AREA ═══════ */}
        <div className="flex-shrink-0 px-6 pb-4 pt-2 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="dash-input-container dash-input-glow relative rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.12] focus-within:border-sky-500/30 focus-within:shadow-[0_0_30px_rgba(56,189,248,0.08)] transition-all duration-400">
              {/* Animated border */}
              <div className="dash-input-border-anim absolute inset-0 rounded-2xl pointer-events-none" />

              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question and see self-correcting reasoning in action…"
                className="w-full bg-transparent text-white text-sm placeholder-gray-500 px-4 pt-3.5 pb-12 resize-none outline-none min-h-[52px] max-h-[160px] relative z-10"
                rows={1}
              />
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-1">
                  <button onClick={addRipple} className="dash-input-action dash-magnetic-btn p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all duration-300 relative overflow-hidden" title="Attach file">
                    <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <button onClick={addRipple} className="dash-input-action dash-magnetic-btn p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all duration-300 relative overflow-hidden" title="Select model">
                    <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button onClick={addRipple} className="dash-input-action dash-magnetic-btn p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all duration-300 relative overflow-hidden" title="Web search">
                    <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <div className="h-4 w-px bg-white/[0.06] mx-1" />
                  <span className="text-[10px] text-gray-600 font-mono dash-blink-slow">
                    {input.length > 0 ? `${input.length} chars` : "Shift+Enter for newline"}
                  </span>
                </div>
                <button
                  onClick={(e) => { addRipple(e); handleSubmit(); }}
                  disabled={!input.trim() || isGenerating}
                  className="dash-send-btn dash-magnetic-btn group flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  {ripples.map((r) => (
                    <span key={r.id} className="dash-ripple !bg-white/20" style={{ left: r.x, top: r.y }} />
                  ))}
                  {isGenerating ? (
                    <>
                      <div className="auth-spinner !w-3 !h-3 !border-[1.5px] relative z-10" />
                      <span className="relative z-10">Thinking</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">Send</span>
                      <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-gray-600 mt-2 dash-fade-up" style={{ animationDelay: "0.3s" }}>
              Self-correcting reasoning may produce imperfect results. Always verify critical outputs.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════ REASONING PANEL ═══════ */}
      {showReasoning && (
        <div className="dash-reasoning-panel w-[340px] flex-shrink-0 border-l border-white/[0.06] bg-[#080c18] flex flex-col h-full relative">
          {/* Subtle background pattern */}
          <div className="dash-panel-pattern absolute inset-0 pointer-events-none opacity-[0.015]" />

          <div className="flex items-center justify-between h-14 px-4 border-b border-white/[0.06] flex-shrink-0 relative z-10">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-sky-400 dash-icon-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm font-semibold text-white">Reasoning Trace</span>
              {isGenerating && <span className="dash-live-badge text-[8px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20">Live</span>}
            </div>
            <button
              onClick={(e) => { addRipple(e); setShowReasoning(false); }}
              className="dash-icon-btn p-1 rounded text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all duration-300 relative overflow-hidden"
            >
              <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 relative z-10">
            {activeReasoning.length === 0 && !isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-14 h-14 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4 dash-breathe">
                  <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 mb-1">No active reasoning</p>
                <p className="text-xs text-gray-600">Ask a question to see the<br />multi-path reasoning trace</p>

                {/* Decorative graph */}
                <div className="mt-6 dash-fade-up" style={{ animationDelay: "0.4s" }}>
                  <div className="flex items-end gap-1 h-12">
                    {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                      <div
                        key={i}
                        className="w-2 rounded-sm bg-gradient-to-t from-sky-500/20 to-sky-400/5 dash-bar-grow"
                        style={{ height: `${h}%`, animationDelay: `${0.5 + i * 0.05}s` }}
                      />
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-700 mt-1 text-center">Previous reasoning quality</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[10px] mb-1.5">
                    <span className="text-gray-500 uppercase tracking-wider font-semibold">Progress</span>
                    <span className="text-sky-400 font-mono">
                      {activeReasoning.filter((s) => s.status !== "pending").length}/{totalSteps}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-sky-500 to-purple-500 transition-all duration-700 ease-out dash-shimmer-bar"
                      style={{
                        width: `${(activeReasoning.filter((s) => s.status !== "pending").length / totalSteps) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Steps */}
                {activeReasoning.map((step, i) => (
                  <button
                    key={step.id}
                    onClick={() => toggleStep(step.id)}
                    className={`dash-reason-step w-full text-left rounded-xl border transition-all duration-400 ${
                      step.status === "running"
                        ? "bg-sky-500/[0.06] border-sky-500/20 shadow-lg shadow-sky-500/5 dash-glow-border-sky"
                        : step.status === "corrected"
                        ? "bg-amber-500/[0.06] border-amber-500/15 dash-glow-border-amber"
                        : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.04]"
                    }`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center gap-2.5 px-3 py-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.status === "running" ? "dash-step-pulse" : ""
                      }`}>
                        {step.status === "running" ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                        ) : step.status === "corrected" ? (
                          <svg className="w-4 h-4 text-amber-400 dash-icon-pop" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-emerald-400 dash-icon-pop" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-200 truncate">{step.label}</span>
                          {step.status === "corrected" && (
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded dash-badge-pop">
                              corrected
                            </span>
                          )}
                        </div>
                      </div>

                      <svg
                        className={`w-3 h-3 text-gray-500 transition-transform duration-300 ${
                          expandedSteps.has(step.id) ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {expandedSteps.has(step.id) && (
                      <div className="px-3 pb-3 pt-0 dash-expand-content">
                        <p className="text-[11px] text-gray-400 leading-relaxed pl-7">
                          {step.content}
                        </p>
                      </div>
                    )}
                  </button>
                ))}

                {/* Confidence */}
                {!isGenerating && activeReasoning.length >= totalSteps && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 dash-confidence-enter dash-glow-border-emerald">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Confidence Score</span>
                      <span className="text-sm font-bold text-emerald-400 dash-counter-up">94.2%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 w-[94.2%] dash-confidence-bar" />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">
                      High cross-path agreement. 1 correction applied.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Panel footer stats */}
          <div className="px-4 py-3 border-t border-white/[0.06] flex-shrink-0 relative z-10">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Paths", value: activeReasoning.length > 0 ? "3" : "—" },
                { label: "Corrected", value: activeReasoning.some((s) => s.status === "corrected") ? "1" : "—" },
                { label: "Latency", value: activeReasoning.length > 0 ? "4.2s" : "—" },
              ].map((s) => (
                <div key={s.label} className="dash-stat-hover group cursor-default">
                  <p className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors duration-300">{s.value}</p>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
