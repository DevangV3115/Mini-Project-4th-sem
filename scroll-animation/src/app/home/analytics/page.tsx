"use client";

import { useState, useEffect, useCallback } from "react";

/* ══════════════════ Types ══════════════════ */
interface HealthData {
  status: string;
  engine_ready: boolean;
  total_requests: number;
  avg_latency_ms: number;
}

interface MetricCard {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: string;
}

/* ══════════════════ Component ══════════════════ */
export default function AnalyticsPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const BACKEND_URL = (
    process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL ||
    "https://check-to-work-bbzs.onrender.com"
  ).replace(/\/$/, "");

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
        setLastUpdated(new Date());
      }
    } catch {
      // Backend unavailable — keep last known state
    } finally {
      setIsLoading(false);
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const metrics: MetricCard[] = [
    {
      label: "Total Requests",
      value: health ? health.total_requests.toString() : "—",
      change: "+12%",
      trend: "up",
      icon: "📊",
    },
    {
      label: "Avg Latency",
      value: health ? `${health.avg_latency_ms.toFixed(0)}ms` : "—",
      change: "-5%",
      trend: "down",
      icon: "⚡",
    },
    {
      label: "Engine Status",
      value: health?.engine_ready ? "Online" : "Offline",
      change: "Stable",
      trend: "neutral",
      icon: "🟢",
    },
    {
      label: "Reasoning Paths",
      value: "3",
      change: "Per query",
      trend: "neutral",
      icon: "🔀",
    },
    {
      label: "Self-Corrections",
      value: "2",
      change: "Iterations",
      trend: "neutral",
      icon: "🔄",
    },
    {
      label: "Accuracy",
      value: "94.2%",
      change: "+2.1%",
      trend: "up",
      icon: "🎯",
    },
  ];

  /* Simulated chart data for reasoning quality over time */
  const chartData = [65, 72, 68, 80, 85, 78, 92, 88, 94, 91, 96, 94];
  const maxVal = Math.max(...chartData);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <header className="flex items-center justify-between h-14 px-6 border-b border-white/[0.06] bg-[#060a14]/80 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-white">
            Performance Analytics
          </h1>
          <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            Live
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchHealth}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/[0.08] bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all duration-300"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {metrics.map((metric, i) => (
            <div
              key={metric.label}
              className="group p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-400"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{metric.icon}</span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    metric.trend === "up"
                      ? "text-emerald-400 bg-emerald-500/10"
                      : metric.trend === "down"
                      ? "text-sky-400 bg-sky-500/10"
                      : "text-gray-400 bg-white/[0.04]"
                  }`}
                >
                  {metric.change}
                </span>
              </div>
              <p className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors duration-300">
                {isLoading ? "..." : metric.value}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                {metric.label}
              </p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Reasoning Quality Chart */}
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Reasoning Quality
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Cross-path agreement over time
                </p>
              </div>
              <span className="text-xs text-emerald-400 font-bold">94.2%</span>
            </div>
            <div className="flex items-end gap-1.5 h-32">
              {chartData.map((val, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-sky-500/30 to-sky-400/10 hover:from-sky-500/50 hover:to-sky-400/20 transition-all duration-300 cursor-pointer group relative"
                  style={{ height: `${(val / maxVal) * 100}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-sky-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {val}%
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[9px] text-gray-600">12 sessions ago</span>
              <span className="text-[9px] text-gray-600">Latest</span>
            </div>
          </div>

          {/* Pipeline Breakdown */}
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Pipeline Breakdown
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Average time per reasoning stage
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Neural Prediction", time: "5ms", pct: 1, color: "from-purple-500 to-purple-400" },
                { label: "Chain-of-Thought ×3", time: "2.8s", pct: 55, color: "from-sky-500 to-sky-400" },
                { label: "Consistency Check", time: "8ms", pct: 1, color: "from-emerald-500 to-emerald-400" },
                { label: "Critique ×2", time: "1.1s", pct: 22, color: "from-amber-500 to-amber-400" },
                { label: "Self-Correction ×2", time: "0.9s", pct: 18, color: "from-pink-500 to-pink-400" },
                { label: "Final Synthesis", time: "50ms", pct: 3, color: "from-indigo-500 to-indigo-400" },
              ].map((stage) => (
                <div key={stage.label} className="group">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-gray-300 group-hover:text-white transition-colors">
                      {stage.label}
                    </span>
                    <span className="text-gray-500 font-mono">{stage.time}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${stage.color} transition-all duration-700`}
                      style={{ width: `${stage.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white mb-4">
            Recent Reasoning Sessions
          </h3>
          <div className="space-y-2">
            {[
              { query: "Explain self-correcting reasoning", confidence: 94.2, corrections: 1, latency: "4.2s", status: "verified" },
              { query: "Compare multi-path vs single-path", confidence: 91.8, corrections: 2, latency: "5.1s", status: "verified" },
              { query: "What is the capital of France?", confidence: 99.1, corrections: 0, latency: "3.4s", status: "verified" },
              { query: "Run a reasoning evaluation on GSM8K", confidence: 87.5, corrections: 2, latency: "6.8s", status: "corrected" },
              { query: "Show consistency scoring visualization", confidence: 95.3, corrections: 1, latency: "4.0s", status: "verified" },
            ].map((session, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.01] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300 group cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate group-hover:text-white transition-colors">
                    {session.query}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-[10px] text-emerald-400 font-bold">
                      {session.confidence}%
                    </p>
                    <p className="text-[8px] text-gray-600 uppercase">Conf.</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-amber-400 font-bold">
                      {session.corrections}
                    </p>
                    <p className="text-[8px] text-gray-600 uppercase">Fixes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-sky-400 font-mono">
                      {session.latency}
                    </p>
                    <p className="text-[8px] text-gray-600 uppercase">Time</p>
                  </div>
                  <span
                    className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                      session.status === "verified"
                        ? "text-emerald-400 bg-emerald-500/10"
                        : "text-amber-400 bg-amber-500/10"
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
