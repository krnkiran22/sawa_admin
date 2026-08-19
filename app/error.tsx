"use client";

import { useEffect } from "react";

// App-level error boundary. Without this, any render/runtime throw in a page
// showed the default (blank) Next.js error screen. This catches it and offers a
// recovery action instead of a dead end.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin panel error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
        background: "var(--bg-app, #FFFBEF)",
        color: "var(--ink, #111111)",
        textAlign: "center",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "rgba(243,115,33,0.12)",
          border: "1px solid rgba(243,115,33,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.6rem",
        }}
      >
        !
      </div>
      <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Something went wrong</h1>
      <p style={{ margin: 0, color: "var(--ink-muted, #666)", maxWidth: 420 }}>
        An unexpected error occurred while rendering this page. You can try again, and if it
        keeps happening, refresh the browser.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
        <button
          onClick={reset}
          style={{
            padding: "0.6rem 1.4rem",
            borderRadius: 10,
            border: "none",
            background: "var(--accent, #1E5559)",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <a
          href="/dashboard"
          style={{
            padding: "0.6rem 1.4rem",
            borderRadius: 10,
            border: "1px solid var(--border, #E8E8E8)",
            background: "#fff",
            color: "var(--ink, #111)",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Go to dashboard
        </a>
      </div>
    </div>
  );
}
