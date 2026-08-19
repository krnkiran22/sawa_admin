// Route-level loading UI shown during navigation/suspense so pages fade in
// through a branded spinner instead of a blank flash.
export default function Loading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        background: "var(--bg-app, #FFFBEF)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid rgba(30,85,89,0.15)",
          borderTopColor: "var(--accent, #1E5559)",
          animation: "adminspin 0.8s linear infinite",
        }}
      />
      <p style={{ color: "var(--ink-muted, #666)", fontSize: "0.85rem", margin: 0 }}>Loading…</p>
      <style>{`@keyframes adminspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
