"use client";

import { useState } from "react";
// Adding search functionality to the abstract history page

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  // In a real app, this would be fetched from Firestore/chatStore
  const mockHistory = [
    { id: 1, title: "Self-correcting reasoning logic", date: "2026-03-23" },
    { id: 2, title: "How does Chain-of-Thought work", date: "2026-03-22" },
    { id: 3, title: "Compare multi-path vs single-path", date: "2026-03-20" },
  ];

  const filteredHistory = mockHistory.filter((item) => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Chat History</h2>
        
        {/* Added Search/Filtering Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors w-64"
          />
          <svg className="w-4 h-4 text-gray-500 absolute right-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {filteredHistory.length > 0 ? (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] transition-colors cursor-pointer flex justify-between items-center group">
              <span className="text-sm font-medium text-gray-300 group-hover:text-amber-300 transition-colors">{item.title}</span>
              <span className="text-xs text-gray-500">{item.date}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 max-w-sm">
            {searchTerm ? "No results found for your search." : "Your past conversations will appear here. Start a new chat to build your history."}
          </p>
        </div>
      )}
    </div>
  );
}
