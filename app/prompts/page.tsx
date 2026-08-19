"use client";

import { FormEvent, useState } from "react";
import { AdminShell } from "../components/AdminShell";
import { ConfirmModal } from "../components/ConfirmModal";
import { useAdminData } from "../providers/AdminDataProvider";
import styles from "./page.module.css";

const CATEGORY_OPTIONS = [
  { value: "chat_shortcut", label: "Personal Chat (couple ↔ couple)" },
  { value: "group_prompt",  label: "Group Chat (community groups)" },
];

const CATEGORY_LABELS: Record<string, string> = {
  chat_shortcut: "Personal Chat",
  group_prompt:  "Group Chat",
};

const CATEGORY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  chat_shortcut: { bg: "#e8f4fd", color: "#1a6fa8", border: "#b3d9f5" },
  group_prompt:  { bg: "#f0faf0", color: "#2a7a3a", border: "#b2ddb9" },
};

export default function PromptsPage() {
  const { prompts, addPrompt, togglePrompt, editPrompt, reorderPrompts, deletePrompt } = useAdminData();
  const [text, setText] = useState("");
  const [category, setCategory] = useState("chat_shortcut");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteContent, setDeleteContent] = useState("");
  const [activeTab, setActiveTab] = useState<"chat_shortcut" | "group_prompt">("chat_shortcut");

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Keep left form category and right list tab in sync
  const setActiveCategory = (value: string) => {
    setCategory(value);
    setActiveTab(value as "chat_shortcut" | "group_prompt");
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    addPrompt(text.trim(), category);
    setText("");
  };

  const openDeleteModal = (id: string, content: string) => {
    setDeleteId(id);
    setDeleteContent(content);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await deletePrompt?.(deleteId);
    setIsDeleting(false);
    setDeleteId(null);
  };

  const startEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditText(currentTitle);
  };

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return;
    await editPrompt(id, editText.trim());
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const filtered = prompts.filter((p) => (p.category || "chat_shortcut") === activeTab);

  // Reordering happens within one category tab, but sortOrder is a single global
  // sequence on the server. Sending only the current category's ids made the
  // server reassign 0..N for those rows, colliding with the other category's
  // sortOrder values and scrambling cross-category order on the next fetch.
  // Instead we swap the two adjacent items *inside the full global id list* and
  // send that, so sortOrder stays globally unique and stable.
  const swapGlobal = (aId: string, bId: string) => {
    const globalIds = prompts.map((p) => p.id);
    const ia = globalIds.indexOf(aId);
    const ib = globalIds.indexOf(bId);
    if (ia === -1 || ib === -1) return;
    [globalIds[ia], globalIds[ib]] = [globalIds[ib], globalIds[ia]];
    reorderPrompts(globalIds);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    swapGlobal(filtered[index].id, filtered[index - 1].id);
  };

  const moveDown = (index: number) => {
    if (index === filtered.length - 1) return;
    swapGlobal(filtered[index].id, filtered[index + 1].id);
  };

  return (
    <AdminShell
      title="Chat Prompts"
      subtitle="Manage quick-send message shortcuts shown in personal chats and group chats separately."
    >
      <div className={styles.layout}>
        {/* Add form */}
        <form className="glassCard" onSubmit={onSubmit}>
          <h3 className="sectionTitle">New Prompt</h3>
          <div className="stack" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {CATEGORY_OPTIONS.map((opt) => {
                const c = CATEGORY_COLORS[opt.value];
                const selected = category === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setActiveCategory(opt.value)}
                    style={{
                      flex: 1,
                      padding: "0.6rem 1rem",
                      borderRadius: "10px",
                      border: `2px solid ${selected ? c.border : "var(--stroke)"}`,
                      background: selected ? c.bg : "white",
                      color: selected ? c.color : "var(--ink-muted)",
                      fontWeight: selected ? 700 : 400,
                      cursor: "pointer",
                      fontSize: "0.88rem",
                      transition: "all 0.15s",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <input
              className="control"
              placeholder={
                category === "group_prompt"
                  ? "e.g. 'What's the plan for this weekend?'"
                  : "e.g. 'Coffee sometime?'"
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              style={{ color: "var(--ink)", background: "white" }}
            />
            <button className="buttonPrimary" type="submit">
              Add to App
            </button>
          </div>
        </form>

        {/* Prompt list with tabs */}
        <section className="glassCard">
          {/* Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.2rem" }}>
            {CATEGORY_OPTIONS.map((opt) => {
              const count = prompts.filter((p) => (p.category || "chat_shortcut") === opt.value).length;
              const c = CATEGORY_COLORS[opt.value];
              const active = activeTab === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setActiveTab(opt.value as "chat_shortcut" | "group_prompt")}
                  style={{
                    padding: "0.45rem 1.1rem",
                    borderRadius: "99px",
                    border: `1.5px solid ${active ? c.border : "var(--stroke)"}`,
                    background: active ? c.bg : "transparent",
                    color: active ? c.color : "var(--ink-muted)",
                    fontWeight: active ? 700 : 400,
                    cursor: "pointer",
                    fontSize: "0.88rem",
                  }}
                >
                  {CATEGORY_LABELS[opt.value]} ({count})
                </button>
              );
            })}
          </div>

          <div className="stack" style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {filtered.map((prompt, index) => {
              const c = CATEGORY_COLORS[prompt.category || "chat_shortcut"];
              const isEditing = editingId === prompt.id;
              return (
                <article key={prompt.id} className={styles.promptRow}>
                  {/* Reorder arrows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginRight: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      title="Move up"
                      style={{
                        background: "none",
                        border: "1px solid var(--stroke)",
                        borderRadius: "4px",
                        cursor: index === 0 ? "not-allowed" : "pointer",
                        opacity: index === 0 ? 0.3 : 0.7,
                        padding: "1px 5px",
                        fontSize: "0.7rem",
                        lineHeight: 1,
                        color: "var(--ink-muted)",
                      }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(index)}
                      disabled={index === filtered.length - 1}
                      title="Move down"
                      style={{
                        background: "none",
                        border: "1px solid var(--stroke)",
                        borderRadius: "4px",
                        cursor: index === filtered.length - 1 ? "not-allowed" : "pointer",
                        opacity: index === filtered.length - 1 ? 0.3 : 0.7,
                        padding: "1px 5px",
                        fontSize: "0.7rem",
                        lineHeight: 1,
                        color: "var(--ink-muted)",
                      }}
                    >
                      ▼
                    </button>
                  </div>

                  <div style={{ flex: 1 }}>
                    {isEditing ? (
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <input
                          className="control"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(prompt.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          autoFocus
                          style={{ flex: 1, color: "var(--ink)", background: "white", padding: "0.4rem 0.7rem", fontSize: "0.95rem" }}
                        />
                        <button
                          type="button"
                          onClick={() => saveEdit(prompt.id)}
                          style={{
                            padding: "0.35rem 0.85rem",
                            borderRadius: "8px",
                            border: "none",
                            background: "var(--accent)",
                            color: "white",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: "0.82rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          style={{
                            padding: "0.35rem 0.75rem",
                            borderRadius: "8px",
                            border: "1px solid var(--stroke)",
                            background: "white",
                            color: "var(--ink-muted)",
                            cursor: "pointer",
                            fontSize: "0.82rem",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "1.05rem", color: "var(--ink)" }}>
                          {prompt.title}
                        </p>
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: "0.2rem",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "99px",
                            background: c.bg,
                            color: c.color,
                            border: `1px solid ${c.border}`,
                          }}
                        >
                          {CATEGORY_LABELS[prompt.category || "chat_shortcut"]}
                        </span>
                      </>
                    )}
                  </div>

                  {!isEditing && (
                    <div className={styles.promptActions}>
                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => startEdit(prompt.id, prompt.title)}
                        title="Edit prompt"
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--ink-muted)",
                          cursor: "pointer",
                          fontSize: "1.2rem",
                          display: "flex",
                          alignItems: "center",
                          padding: "0 0.25rem",
                        }}
                      >
                        <i className="mdi mdi-pencil-outline"></i>
                      </button>
                      {/* Active / Paused toggle */}
                      <button
                        className="buttonGhost"
                        onClick={() => togglePrompt(prompt.id)}
                        type="button"
                        style={{
                          borderColor: prompt.active ? "var(--accent-cool)" : "var(--stroke)",
                          color: prompt.active ? "var(--accent-cool)" : "var(--ink-muted)",
                          padding: "0.5rem 1rem",
                          borderRadius: "8px",
                        }}
                      >
                        {prompt.active ? "Active" : "Paused"}
                      </button>
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => openDeleteModal(prompt.id, prompt.title)}
                        title="Delete prompt"
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--accent-orange)",
                          cursor: "pointer",
                          fontSize: "1.4rem",
                          marginLeft: "0.5rem",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <i className="mdi mdi-delete-outline"></i>
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
            {filtered.length === 0 && (
              <p style={{ textAlign: "center", color: "var(--ink-muted)", padding: "2rem" }}>
                No {CATEGORY_LABELS[activeTab].toLowerCase()} prompts yet. Use the form above to add some.
              </p>
            )}
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Prompt"
        message={`Are you sure you want to delete "${deleteContent}"? This will remove it for all users.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={isDeleting}
      />
    </AdminShell>
  );
}
