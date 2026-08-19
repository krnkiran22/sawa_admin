"use client";

import { useState } from "react";
import { AdminShell } from "../components/AdminShell";
import { ConfirmModal } from "../components/ConfirmModal";
import { useAdminData } from "../providers/AdminDataProvider";
import { statusClass } from "../lib/format";

export default function BlocksPage() {
  const { blocks, adminUnblock, refresh } = useAdminData();
  const [filter, setFilter] = useState<"all" | "user" | "community">("all");
  const [search, setSearch] = useState("");
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<
    { blockerCoupleId: string; targetId: string; id: string } | null
  >(null);

  const filtered = blocks
    .filter((b) => filter === "all" || b.targetType === filter)
    .filter(
      (b) =>
        !search ||
        b.blockerName.toLowerCase().includes(search.toLowerCase()) ||
        b.targetName.toLowerCase().includes(search.toLowerCase())
    );

  const userBlockCount = blocks.filter((b) => b.targetType === "user").length;
  const communityBlockCount = blocks.filter((b) => b.targetType === "community").length;

  const confirmUnblock = async () => {
    if (!unblockTarget) return;
    const { blockerCoupleId, targetId, id } = unblockTarget;
    setUnblocking(id);
    try {
      await adminUnblock(blockerCoupleId, targetId);
    } finally {
      setUnblocking(null);
      setUnblockTarget(null);
    }
  };

  return (
    <AdminShell
      title="Blocks"
      subtitle="View all user and community blocks across the platform."
    >
      {/* Header row with refresh */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button
          onClick={refresh}
          style={{
            padding: "0.45rem 1.1rem",
            borderRadius: "8px",
            border: "1px solid rgba(0,0,0,0.15)",
            background: "rgba(255,255,255,0.8)",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div className="glassCard" style={{ flex: 1, minWidth: 160, padding: "1rem 1.25rem" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Blocks</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "1.8rem", fontWeight: 700, color: "var(--ink-body)" }}>{blocks.length}</p>
        </div>
        <div className="glassCard" style={{ flex: 1, minWidth: 160, padding: "1rem 1.25rem" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>User Blocks</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "1.8rem", fontWeight: 700, color: "var(--ink-body)" }}>{userBlockCount}</p>
        </div>
        <div className="glassCard" style={{ flex: 1, minWidth: 160, padding: "1rem 1.25rem" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Community Blocks</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "1.8rem", fontWeight: 700, color: "var(--ink-body)" }}>{communityBlockCount}</p>
        </div>
      </div>

      {/* Filters + search */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        {(["all", "user", "community"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.45rem 1.1rem",
              borderRadius: "999px",
              border: filter === f ? "2px solid var(--accent-orange)" : "2px solid transparent",
              background: filter === f ? "rgba(255,140,0,0.12)" : "rgba(0,0,0,0.06)",
              color: "var(--ink-body)",
              fontWeight: filter === f ? 700 : 400,
              cursor: "pointer",
              fontSize: "0.88rem",
              textTransform: "capitalize",
            }}
          >
            {f === "all" ? `All (${blocks.length})` : f === "user" ? `Users (${userBlockCount})` : `Communities (${communityBlockCount})`}
          </button>
        ))}
        <input
          placeholder="Search blocker or target…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            marginLeft: "auto",
            padding: "0.45rem 0.9rem",
            borderRadius: "8px",
            border: "1px solid rgba(0,0,0,0.15)",
            background: "rgba(255,255,255,0.7)",
            fontSize: "0.88rem",
            minWidth: 220,
            color: "var(--ink-body)",
          }}
        />
      </div>

      <section className="glassCard">
        <h3 className="sectionTitle">
          {filter === "all" ? "All Blocks" : filter === "user" ? "User Blocks" : "Community Blocks"}
          {" "}({filtered.length})
        </h3>
        <table className="dataTable">
          <thead>
            <tr>
              <th>Blocked By</th>
              <th>Blocked Target</th>
              <th>Target Type</th>
              <th>Target ID</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--ink-muted)" }}>
                  {search ? "No matches found." : "No blocks recorded yet."}
                </td>
              </tr>
            ) : (
              filtered.map((block) => (
                <tr key={block.id}>
                  <td>
                    <strong>{block.blockerName}</strong>
                    <br />
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>{block.blockerCoupleId}</span>
                  </td>
                  <td><strong>{block.targetName}</strong></td>
                  <td>
                    <span className={statusClass(block.targetType === "community" ? "warning" : "neutral")}>
                      {block.targetType}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontFamily: "monospace" }}>
                      {block.targetId}
                    </span>
                  </td>
                  <td>
                    <button
                      disabled={unblocking === block.id}
                      onClick={() => setUnblockTarget({ blockerCoupleId: block.blockerCoupleId, targetId: block.targetId, id: block.id })}
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "6px",
                        border: "none",
                        background: unblocking === block.id ? "#ccc" : "#ef4444",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: unblocking === block.id ? "not-allowed" : "pointer",
                        fontSize: "0.8rem",
                      }}
                    >
                      {unblocking === block.id ? "…" : "Unblock"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <ConfirmModal
        isOpen={!!unblockTarget}
        title="Remove block"
        message="Remove this block? The blocker will be able to see and interact with the target again."
        confirmLabel={unblocking ? "Removing…" : "Remove block"}
        tone="primary"
        onConfirm={confirmUnblock}
        onCancel={() => setUnblockTarget(null)}
        isLoading={!!unblocking}
      />
    </AdminShell>
  );
}
