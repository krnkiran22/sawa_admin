import Link from "next/link";

// Custom 404 so unknown routes show a branded page (with a way back) instead of
// the default bare Next.js not-found screen.
export default function NotFound() {
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
      <h1 style={{ margin: 0, fontSize: "3rem", color: "var(--accent, #1E5559)" }}>404</h1>
      <p style={{ margin: 0, color: "var(--ink-muted, #666)" }}>
        This page doesn’t exist.
      </p>
      <Link
        href="/dashboard"
        style={{
          padding: "0.6rem 1.4rem",
          borderRadius: 10,
          border: "none",
          background: "var(--accent, #1E5559)",
          color: "#fff",
          fontWeight: 600,
          textDecoration: "none",
          marginTop: "0.5rem",
        }}
      >
        Back to dashboard
      </Link>
    </div>
  );
}
