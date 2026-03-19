"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div style={{ background: "#0f172a", color: "#fff", padding: "2rem", fontFamily: "monospace", minHeight: "100vh" }}>
      <h2>Something went wrong</h2>
      <pre style={{ whiteSpace: "pre-wrap", color: "#f87171" }}>
        {error.message}
      </pre>
      <pre style={{ whiteSpace: "pre-wrap", color: "#94a3b8", fontSize: "0.8rem" }}>
        {error.stack}
      </pre>
      <button
        onClick={() => reset()}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
      >
        Try again
      </button>
    </div>
  );
}
