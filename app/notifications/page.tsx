"use client";

import { useState } from "react";
import { AdminShell } from "../components/AdminShell";
import { ConfirmModal } from "../components/ConfirmModal";
import { useToast } from "../components/Toast";
import { useAdminData } from "../providers/AdminDataProvider";
import styles from "./page.module.css";

export default function NotificationsPage() {
  const { couples, sendNotification } = useAdminData();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<"all" | "specific">("all");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  // Broadcasts are irreversible, so gate the actual send behind a confirmation
  // that spells out exactly how many couples will receive the push.
  const [showConfirm, setShowConfirm] = useState(false);

  const allSelected = couples.length > 0 && selectedRecipientIds.length === couples.length;
  const someSelected = selectedRecipientIds.length > 0 && !allSelected;

  const handleToggleAll = () => {
    setSelectedRecipientIds(allSelected ? [] : couples.map((c) => c.id));
  };

  const handleToggleRecipient = (id: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const recipientCount = targetType === "all" ? couples.length : selectedRecipientIds.length;

  // Validate, then open the confirmation modal instead of sending immediately.
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    if (targetType === "specific" && selectedRecipientIds.length === 0) {
      toast("Please select at least one recipient.", "error");
      return;
    }
    if (recipientCount === 0) {
      toast("There are no recipients to notify.", "error");
      return;
    }
    setShowConfirm(true);
  };

  const doSend = async () => {
    setIsSending(true);
    setSuccess(false);
    try {
      await sendNotification(title, message, targetType === "all" ? undefined : selectedRecipientIds);
      setSuccess(true);
      setTitle("");
      setMessage("");
      setSelectedRecipientIds([]);
      toast(`Notification sent to ${recipientCount} couple${recipientCount === 1 ? "" : "s"}.`, "success");
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      toast("Failed to send notification.", "error");
    } finally {
      setIsSending(false);
      setShowConfirm(false);
    }
  };

  return (
    <AdminShell title="Send Notifications" subtitle="Broadcast messages to all users or target specific couples.">
      <form className={styles.page} onSubmit={handleSend}>
        {/* Left column: compose */}
        <div className={`glassCard ${styles.compose}`}>
          <h3 className="sectionTitle">Compose</h3>

          <div className={styles.field}>
            <label className={styles.label}>Notification Title</label>
            <input
              className="control"
              placeholder="e.g. New Feature Update!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Message Body</label>
            <textarea
              className="control"
              placeholder="Write your message here..."
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              style={{ resize: "none" }}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Target Audience</label>
            <div className={styles.radioGroup}>
              <label className={`${styles.radioCard} ${targetType === "all" ? styles.radioCardActive : ""}`}>
                <input type="radio" name="target" checked={targetType === "all"} onChange={() => setTargetType("all")} />
                <i className="mdi mdi-account-group" style={{ fontSize: "1.4rem" }} />
                <div>
                  <strong>All Users</strong>
                  <p>{couples.length} couples</p>
                </div>
              </label>
              <label className={`${styles.radioCard} ${targetType === "specific" ? styles.radioCardActive : ""}`}>
                <input type="radio" name="target" checked={targetType === "specific"} onChange={() => setTargetType("specific")} />
                <i className="mdi mdi-account-check" style={{ fontSize: "1.4rem" }} />
                <div>
                  <strong>Specific Couples</strong>
                  <p>Choose manually</p>
                </div>
              </label>
            </div>
          </div>

          <div className={styles.actions}>
            <button className="buttonPrimary" type="submit" disabled={isSending}>
              {isSending ? (
                <><i className="mdi mdi-loading mdi-spin" /> Sending...</>
              ) : (
                <><i className="mdi mdi-send" /> Send Notification</>
              )}
            </button>
            {success && (
              <span className={styles.success}>
                <i className="mdi mdi-check-circle" /> Sent successfully!
              </span>
            )}
          </div>
        </div>

        {/* Right column: recipients table */}
        {targetType === "specific" && (
          <div className={`glassCard ${styles.recipients}`}>
            <div className={styles.recipientsHeader}>
              <h3 className="sectionTitle">
                Select Recipients
                {selectedRecipientIds.length > 0 && (
                  <span className={styles.badge}>{selectedRecipientIds.length} selected</span>
                )}
              </h3>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected; }}
                      onChange={handleToggleAll}
                    />
                  </th>
                  <th>Couple Name</th>
                  <th>City</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {couples.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--ink-muted)" }}>
                      No couples found.
                    </td>
                  </tr>
                ) : (
                  couples.map((couple) => {
                    const checked = selectedRecipientIds.includes(couple.id);
                    return (
                      <tr
                        key={couple.id}
                        className={checked ? styles.rowSelected : ""}
                        onClick={() => handleToggleRecipient(couple.id)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleRecipient(couple.id)}
                          />
                        </td>
                        <td>
                          <strong>{couple.pairName}</strong>
                        </td>
                        <td>{couple.city || "—"}</td>
                        <td>
                          <span className={`chip ${couple.status === "engaged" ? "chipSuccess" : couple.status === "inactive" ? "chipDanger" : "chipNeutral"}`}>
                            {couple.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </form>

      <ConfirmModal
        isOpen={showConfirm}
        title={targetType === "all" ? "Broadcast to ALL couples?" : "Send notification?"}
        message={
          targetType === "all"
            ? `This will immediately push "${title}" to every couple on the platform (${recipientCount} couple${recipientCount === 1 ? "" : "s"}). This cannot be undone.`
            : `Send "${title}" to ${recipientCount} selected couple${recipientCount === 1 ? "" : "s"}?`
        }
        confirmLabel={isSending ? "Sending…" : `Send to ${recipientCount}`}
        tone="primary"
        onConfirm={doSend}
        onCancel={() => setShowConfirm(false)}
        isLoading={isSending}
      />
    </AdminShell>
  );
}
