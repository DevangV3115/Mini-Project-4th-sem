"use client";

import { useState, useLayoutEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  {
    label: "New Chat",
    href: "/home",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 4v16m8-8H4"
      />
    ),
    accent: true,
  },
  {
    label: "Dashboard",
    href: "/home",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"
      />
    ),
  },
  {
    label: "Analytics",
    href: "/home/analytics",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    ),
  },
  {
    label: "History",
    href: "/home/history",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    label: "Models",
    href: "/home/models",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    ),
  },
  {
    label: "API Keys",
    href: "/home/api-keys",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    ),
  },
  {
    label: "Settings",
    href: "/home/settings",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
    ),
  },
];

const RECENT_CHATS = [
  { id: "1", title: "Multi-path reasoning on GSM8K", time: "2h ago" },
  { id: "2", title: "Self-correction in code gen", time: "5h ago" },
  { id: "3", title: "DPO training convergence", time: "1d ago" },
  { id: "4", title: "Consistency scoring methods", time: "2d ago" },
  { id: "5", title: "Commonsense QA evaluation", time: "3d ago" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    // Trigger re-render on mount to enable hydration-safe rendering
    setMounted(true);
  }, []);

  return (
    <aside
      className={`dash-sidebar relative flex flex-col h-screen bg-[#0a0e1a] border-r border-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5 logo-hover overflow-hidden">
          <div className="logo-icon h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-sky-500 flex items-center justify-center text-white font-bold text-xs pulse-glow flex-shrink-0">
            SC
          </div>
          <span
            className={`text-white font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
              collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
            }`}
          >
            SelfCorrect<span className="text-sky-400">AI</span>
          </span>
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="dash-icon-btn p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all duration-300"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-500 ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1 dash-nav-enter">
        {NAV_ITEMS.map((item, i) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              onMouseEnter={() => setHoveredItem(item.label)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`dash-nav-item group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                item.accent
                  ? "bg-gradient-to-r from-amber-500/10 to-sky-500/10 text-amber-300 hover:from-amber-500/20 hover:to-sky-500/20 border border-amber-500/10 hover:border-amber-500/20 mb-3"
                  : isActive
                  ? "bg-white/[0.08] text-white shadow-lg shadow-black/20"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
              }`}
              style={{
                animationDelay: mounted ? `${i * 50}ms` : "0ms",
              }}
            >
              {/* Active indicator */}
              {isActive && !item.accent && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-amber-400 to-sky-500 dash-active-pip" />
              )}

              <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {item.icon}
              </svg>

              <span
                className={`whitespace-nowrap transition-all duration-300 ${
                  collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                }`}
              >
                {item.label}
              </span>

              {/* Tooltip when collapsed */}
              {collapsed && hoveredItem === item.label && (
                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg border border-white/10 shadow-xl z-50 whitespace-nowrap dash-tooltip">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}

        {/* Recent Chats Section */}
        {!collapsed && (
          <div className="mt-6 dash-section-enter">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
              Recent
            </p>
            {RECENT_CHATS.map((chat, i) => (
              <button
                key={chat.id}
                className="dash-chat-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all duration-300 group"
                style={{ animationDelay: `${(i + NAV_ITEMS.length) * 50}ms` }}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-600 group-hover:text-sky-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{chat.title}</p>
                  <p className="text-[10px] text-gray-600">{chat.time}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="px-2 py-3 border-t border-white/[0.06] space-y-1">
        <div className="dash-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-sky-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <span
            className={`whitespace-nowrap truncate transition-all duration-300 ${
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            }`}
          >
            {user?.displayName || user?.email || "User"}
          </span>
        </div>
        <button
          onClick={async () => { await signOut(); router.replace("/login"); }}
          className="dash-nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/[0.05] transition-all duration-300 group"
        >
          <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span
            className={`whitespace-nowrap transition-all duration-300 ${
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            }`}
          >
            Sign out
          </span>
        </button>
      </div>
    </aside>
  );
}
