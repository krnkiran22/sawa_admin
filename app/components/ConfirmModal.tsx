"use client";

import React from "react";
import styles from "./ConfirmModal.module.css";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  /** Label for the confirm button. Defaults to "Confirm Delete" for
      backwards-compatibility with the existing delete flows. */
  confirmLabel?: string;
  /** Visual tone of the confirm button. "danger" (default) is red;
      "primary" is used for non-destructive confirmations (e.g. broadcast). */
  tone?: "danger" | "primary";
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading,
  confirmLabel = "Confirm Delete",
  tone = "danger",
}: ConfirmModalProps) {
  // Close on Escape and trap focus lightly so the modal is keyboard-accessible.
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={() => !isLoading && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button
            className="buttonGhost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={isLoading}
            style={
              tone === "primary"
                ? { background: "var(--accent)", borderColor: "var(--accent)" }
                : undefined
            }
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
