import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";

const defaultHasContent = (payload) => {
  const details = payload?.invoiceDetails || {};
  const items = Array.isArray(payload?.invoiceItems) ? payload.invoiceItems : [];

  return Boolean(
    details.clients_name ||
    details.project ||
    details.bank_name ||
    items.some((item) => item?.description?.trim() || Number(item?.amount || 0) > 0)
  );
};

const stableSnapshot = (value) => JSON.stringify(value ?? {});

const useInvoiceAutosave = ({
  mode,
  invoiceNumber = null,
  initialDraftUuid = "",
  payload,
  onRestore,
  enabled = true,
  debounceMs = 1400,
  hasContent = defaultHasContent,
}) => {
  const [draftUuid, setDraftUuid] = useState(initialDraftUuid || "");
  const [draftKey, setDraftKey] = useState(mode === "edit" ? `edit:${invoiceNumber}` : "create");
  const [saveState, setSaveState] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isRestoring, setIsRestoring] = useState(Boolean(enabled));
  const [isDirty, setIsDirty] = useState(false);

  const readyRef = useRef(false);
  const mountedRef = useRef(true);
  const payloadRef = useRef(payload);
  const savedSnapshotRef = useRef("");
  const skipNextAutosaveRef = useRef(false);
  const saveRequestRef = useRef(0);

  const payloadSnapshot = useMemo(() => stableSnapshot(payload), [payload]);

  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  useEffect(() => {
    // React StrictMode runs an extra setup/cleanup cycle in development.
    // Resetting the ref here prevents the form from remaining permanently
    // locked in the restoring state after that development-only cycle.
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadDraft = useCallback(async () => {
    if (!enabled) {
      readyRef.current = false;
      setIsRestoring(false);
      return;
    }

    setIsRestoring(true);
    setSaveState("loading");

    try {
      const params = initialDraftUuid
        ? { draft_uuid: initialDraftUuid }
        : {
            mode,
            invoice_number: mode === "edit" ? invoiceNumber : undefined,
            draft_key: mode === "edit" ? `edit:${invoiceNumber}` : "create",
          };

      const response = await api.get("/invoice/get-draft", { params });
      const draft = response.data?.data;

      if (draft?.payload && typeof onRestore === "function") {
        skipNextAutosaveRef.current = true;
        onRestore(draft.payload);
        setDraftUuid(draft.draft_uuid || "");
        setDraftKey(draft.draft_key || (mode === "edit" ? `edit:${invoiceNumber}` : "create"));
        setLastSavedAt(draft.last_saved_at || draft.updated_at || null);
        savedSnapshotRef.current = stableSnapshot(draft.payload);
        setSaveState("restored");
        setIsDirty(false);
      } else {
        savedSnapshotRef.current = stableSnapshot(payloadRef.current);
        setSaveState("idle");
      }
    } catch {
      setSaveState("error");
    } finally {
      readyRef.current = true;
      if (mountedRef.current) {
        setIsRestoring(false);
      }
    }
  }, [enabled, initialDraftUuid, invoiceNumber, mode, onRestore]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  const saveNow = useCallback(async ({ silent = false } = {}) => {
    if (!enabled || !readyRef.current || !hasContent(payloadRef.current)) {
      return null;
    }

    const requestId = ++saveRequestRef.current;
    if (mountedRef.current) {
      setSaveState("saving");
    }

    try {
      const response = await api.post("/invoice/save-draft", {
        draft_uuid: draftUuid || undefined,
        draft_key: draftKey,
        mode,
        invoice_number: mode === "edit" ? invoiceNumber : undefined,
        payload: payloadRef.current,
      });

      if (requestId !== saveRequestRef.current) {
        return response.data?.data || null;
      }

      const saved = response.data?.data;
      if (mountedRef.current) {
        setDraftUuid(saved?.draft_uuid || draftUuid);
        setDraftKey(saved?.draft_key || draftKey);
        setLastSavedAt(saved?.last_saved_at || new Date().toISOString());
        setSaveState("saved");
        setIsDirty(false);
      }
      savedSnapshotRef.current = stableSnapshot(payloadRef.current);
      return saved;
    } catch (error) {
      if (mountedRef.current) {
        setSaveState("error");
      }
      if (!silent) {
        throw error;
      }
      return null;
    }
  }, [draftKey, draftUuid, enabled, hasContent, invoiceNumber, mode]);

  useEffect(() => {
    if (!enabled || !readyRef.current) return undefined;

    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return undefined;
    }

    const changed = payloadSnapshot !== savedSnapshotRef.current;
    const containsContent = hasContent(payload);

    if (!containsContent) {
      savedSnapshotRef.current = payloadSnapshot;
      setIsDirty(false);
      setSaveState((current) => (
        current === "loading" || current === "restored" ? current : "idle"
      ));
      return undefined;
    }

    setIsDirty(changed);

    if (!changed) {
      return undefined;
    }

    setSaveState((current) => (current === "saving" ? current : "pending"));
    const timer = window.setTimeout(() => {
      saveNow({ silent: true });
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, enabled, hasContent, payload, payloadSnapshot, saveNow]);

  useEffect(() => {
    const warnBeforeLeaving = (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isDirty]);

  const clearDraft = useCallback(async (nextPayload = null) => {
    saveRequestRef.current += 1;
    if (draftUuid) {
      try {
        await api.post("/invoice/delete-draft", { draft_uuid: draftUuid });
      } catch {
        // Clearing the form or completing an invoice must not fail because
        // an already-cleared draft is unavailable.
      }
    }

    const cleanPayload = nextPayload ?? payloadRef.current;
    payloadRef.current = cleanPayload;
    savedSnapshotRef.current = stableSnapshot(cleanPayload);
    skipNextAutosaveRef.current = true;

    setDraftUuid("");
    setLastSavedAt(null);
    setSaveState("idle");
    setIsDirty(false);
  }, [draftUuid]);

  return {
    draftUuid,
    draftKey,
    saveState,
    lastSavedAt,
    isDirty,
    isRestoring,
    saveNow,
    clearDraft,
    reloadDraft: loadDraft,
  };
};

export default useInvoiceAutosave;
