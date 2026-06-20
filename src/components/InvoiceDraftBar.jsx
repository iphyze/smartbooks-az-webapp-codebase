import React, { useMemo } from "react";

const stateCopy = {
  idle: ["Draft protection ready", "Changes will be saved automatically."],
  loading: ["Checking saved draft", "Looking for your latest invoice changes."],
  restored: ["Draft restored", "Your last saved invoice changes have been recovered."],
  pending: ["Unsaved changes", "Autosave will run shortly."],
  saving: ["Saving draft", "Keeping your latest invoice changes safe."],
  saved: ["Draft saved", "Your latest changes are safely stored."],
  error: ["Draft not saved", "Use Save draft to try again."],
};

const InvoiceDraftBar = ({
  saveState = "idle",
  lastSavedAt = null,
  isDirty = false,
  isRestoring = false,
  onSave,
  onClear,
  showClear = false,
  isClearing = false,
  disabled = false,
}) => {
  const copy = stateCopy[saveState] || stateCopy.idle;
  const savedTime = useMemo(() => {
    if (!lastSavedAt) return "";
    const date = new Date(lastSavedAt);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [lastSavedAt]);

  const icon = saveState === "error"
    ? "fa-triangle-exclamation"
    : saveState === "saving" || isRestoring
      ? "fa-spinner fa-spin"
      : saveState === "saved" || saveState === "restored"
        ? "fa-check"
        : "fa-cloud-arrow-up";

  return (
    <div className={`invoice-draft-bar invoice-draft-bar--${saveState}`}>
      <div className="invoice-draft-bar__status">
        <span className="invoice-draft-bar__icon" aria-hidden="true">
          <span className={`fas ${icon}`} />
        </span>
        <div>
          <strong>{copy[0]}</strong>
          <p>
            {copy[1]}
            {savedTime ? <span> Last saved at {savedTime}.</span> : null}
          </p>
        </div>
      </div>

      <div className="invoice-draft-bar__actions">
        {showClear ? (
          <button
            type="button"
            className="invoice-draft-bar__button invoice-draft-bar__button--clear"
            onClick={onClear}
            disabled={disabled || isClearing || isRestoring}
          >
            <span className={`fas ${isClearing ? "fa-spinner fa-spin" : "fa-eraser"}`} aria-hidden="true" />
            <span>{isClearing ? "Clearing…" : "Clear form"}</span>
          </button>
        ) : null}

        <button
          type="button"
          className="invoice-draft-bar__button"
          onClick={onSave}
          disabled={disabled || saveState === "saving" || isRestoring || (!isDirty && saveState === "saved")}
        >
          <span className={`fas ${saveState === "saving" ? "fa-spinner fa-spin" : "fa-floppy-disk"}`} aria-hidden="true" />
          <span>{saveState === "saving" ? "Saving…" : "Save draft"}</span>
        </button>
      </div>
    </div>
  );
};

export default InvoiceDraftBar;
