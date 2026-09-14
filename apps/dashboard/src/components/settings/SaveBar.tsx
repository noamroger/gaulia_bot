"use client";

import type { EditableResource } from "@/lib/useEditableResource";

type SaveBarState = Pick<
  EditableResource<object>,
  "dirty" | "saving" | "justSaved" | "error" | "save" | "reset"
>;

export function SaveBar({
  editor,
  invalidReason = null,
}: {
  editor: SaveBarState;
  invalidReason?: string | null;
}) {
  const { dirty, saving, justSaved, error } = editor;
  if (!dirty && !saving && !error && !justSaved) return null;

  const message =
    error ??
    (dirty ? (invalidReason ?? "Modifications non enregistrées.") : "Modifications enregistrées.");
  const isError = Boolean(error) || (dirty && Boolean(invalidReason));

  return (
    <div className="save-bar" role="status">
      <span className={`save-bar-message${isError ? " is-error" : ""}`}>{message}</span>
      {dirty && (
        <div className="save-bar-actions">
          <button
            type="button"
            className="button-secondary"
            disabled={saving}
            onClick={editor.reset}
          >
            Annuler
          </button>
          <button
            type="button"
            className="button-primary"
            disabled={saving || Boolean(invalidReason)}
            onClick={() => void editor.save()}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      )}
    </div>
  );
}
