import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';
import api from '../services/api';

const toFD = (obj = {}) => {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== null && v !== undefined) fd.append(k, v);
  });
  return fd;
};


const coerceApiPayload = (payload) => {
  if (payload?.data && (payload.status || payload.message)) return payload;
  if (typeof payload !== 'string') return payload || {};
  const trimmed = payload.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch (_) {
        return { raw: payload };
      }
    }
    return { raw: payload };
  }
};


const POSITIVE_ID_KEYS = new Set([
  'id',
  'recon_id',
  'reconciliation_id',
  'created_recon_id',
  'insert_id',
  'bank_recon_id',
  'bankReconId',
  'reconId',
  'reconciliationId',
]);

const toPositiveId = (value) => {
  const numericId = Number(value);
  return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
};

const extractReconId = (value = {}) => {
  const payload = coerceApiPayload(value);
  const directCandidate =
    payload?.data?.id ??
    payload?.data?.recon_id ??
    payload?.data?.reconciliation_id ??
    payload?.data?.created_recon_id ??
    payload?.data?.insert_id ??
    payload?.data?.bank_recon_id ??
    payload?.data?.reconciliation?.id ??
    payload?.data?.recon?.id ??
    payload?.payload?.data?.id ??
    payload?.payload?.id ??
    payload?.reconciliation?.id ??
    payload?.recon?.id ??
    payload?.id ??
    payload?.recon_id ??
    payload?.reconciliation_id ??
    payload?.created_recon_id ??
    payload?.insert_id ??
    payload?.bank_recon_id;

  const directId = toPositiveId(directCandidate);
  if (directId) return directId;

  // Defensive fallback: some PHP routes or proxies may wrap the response in an
  // unexpected object shape. Walk the object and accept known reconciliation ID
  // keys anywhere in the payload instead of failing a successful create.
  const queue = [payload];
  const visited = new Set();
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) {
      current.forEach((item) => queue.push(item));
      continue;
    }

    for (const [key, item] of Object.entries(current)) {
      if (POSITIVE_ID_KEYS.has(key)) {
        const id = toPositiveId(item);
        if (id) return id;
      }
      if (item && typeof item === 'object') queue.push(item);
    }
  }

  return null;
};


const responseIsSuccess = (payload = {}) => {
  const responsePayload = coerceApiPayload(payload);
  const status = String(responsePayload?.status || responsePayload?.success || responsePayload?.ok || '').toLowerCase();
  return (
    status === 'success' ||
    status === 'true' ||
    status === 'ok' ||
    responsePayload?.success === true ||
    responsePayload?.ok === true
  );
};

const responseIsFailure = (payload = {}) => {
  const responsePayload = coerceApiPayload(payload);
  const status = String(responsePayload?.status || responsePayload?.success || responsePayload?.ok || '').toLowerCase();
  return (
    status === 'failed' ||
    status === 'failure' ||
    status === 'false' ||
    status === 'error' ||
    responsePayload?.success === false ||
    responsePayload?.ok === false
  );
};

const getResponseMessage = (payload = {}, fallback = 'Request failed') => {
  const responsePayload = coerceApiPayload(payload);
  return responsePayload?.message || responsePayload?.error || responsePayload?.raw || fallback;
};

const normaliseCreateResponse = (payload = {}, id) => {
  const responsePayload = coerceApiPayload(payload);
  const reconId = Number(id || extractReconId(responsePayload));
  if (!Number.isFinite(reconId) || reconId <= 0) return null;

  return {
    ...responsePayload,
    status: responsePayload.status || 'Success',
    data: {
      ...(responsePayload.data || {}),
      id: reconId,
      recon_id: reconId,
      reconciliation_id: reconId,
      reconciliation: {
        ...(responsePayload.data?.reconciliation || {}),
        id: reconId,
      },
    },
  };
};


const searchLatestCreatedRecon = async (payload = {}, createdAfter = null) => {
  const periodFrom = String(payload.period_from || '').slice(0, 10);
  const periodTo = String(payload.period_to || '').slice(0, 10);
  const company = String(payload.company_name || payload.company || payload.recon_company || '').trim().toLowerCase();
  const bank = String(payload.bank_name || payload.recon_bank || '').trim().toLowerCase();
  const account = String(payload.account_number || payload.recon_account_number || '').trim().toLowerCase();
  const year = String(payload.year || payload.accounting_year || useAuthStore.getState().user?.accounting_period || periodTo.slice(0, 4) || periodFrom.slice(0, 4) || '').trim();
  const createdAfterMs = createdAfter instanceof Date
    ? createdAfter.getTime() - 120000
    : Number(createdAfter || 0) - 120000;

  const searchCandidates = [
    payload.company_name,
    payload.company,
    payload.recon_company,
    payload.bank_name,
    payload.recon_bank,
    payload.account_number,
    payload.recon_account_number,
    '',
  ].filter((value, index, arr) => value !== undefined && value !== null && arr.indexOf(value) === index);

  const allRows = [];
  for (const candidate of searchCandidates) {
    const params = new URLSearchParams({ page: '1', limit: '100' });
    if (candidate) params.set('search', String(candidate));
    if (/^\d{4}$/.test(year)) params.set('year', year);

    try {
      const response = await api.get(`/bank-recon/list?${params.toString()}`);
      const responsePayload = coerceApiPayload(response.data);
      if (responseIsFailure(responsePayload)) continue;
      const rows = Array.isArray(responsePayload?.data) ? responsePayload.data : [];
      rows.forEach((row) => {
        const rowId = extractReconId(row);
        if (rowId && !allRows.some((existing) => extractReconId(existing) === rowId)) allRows.push(row);
      });
    } catch (_) {
      // Only a secondary lookup. The caller will still show a real error if no
      // confirmed new row can be resolved.
    }
  }

  if (!allRows.length) return null;

  const rowMatchesRequest = (row) => {
    const rowCompany = String(row.company_name || row.company || '').trim().toLowerCase();
    const rowBank = String(row.bank_name || row.bank || '').trim().toLowerCase();
    const rowAccount = String(row.account_number || row.recon_account_number || '').trim().toLowerCase();
    const rowFrom = String(row.period_from || '').slice(0, 10);
    const rowTo = String(row.period_to || '').slice(0, 10);
    const rowCreatedAt = Date.parse(row.created_at || row.updated_at || 0) || 0;

    if (createdAfterMs && rowCreatedAt && rowCreatedAt < createdAfterMs) return false;
    if (company && rowCompany !== company) return false;
    if (bank && rowBank !== bank) return false;
    if (account && rowAccount !== account) return false;
    if (periodFrom && rowFrom !== periodFrom) return false;
    if (periodTo && rowTo !== periodTo) return false;
    return true;
  };

  const strictRows = allRows.filter(rowMatchesRequest);
  if (!strictRows.length) return null;

  return strictRows.sort((a, b) => {
    const aTime = Date.parse(a.created_at || a.updated_at || 0) || 0;
    const bTime = Date.parse(b.created_at || b.updated_at || 0) || 0;
    return bTime - aTime || extractReconId(b) - extractReconId(a);
  })[0] || null;
};

const emptyCurrent = {
  reconciliation: null,
  bank_lines: [],
  ledger_lines: [],
  matches: [],
  summary: null,
  difference_explanation: null,
  upload_profiles: [],
  learned_patterns: [],
  loading: false,
};

const emptyUi = {
  bankFilter: 'unmatched',
  ledgerFilter: 'unmatched',
  bankSearch: '',
  ledgerSearch: '',
};

const useBankReconStore = create(
  persist(
    (set, get) => ({
      // ── List state ─────────────────────────────────────────────────────
      list: { data: [], pagination: null, loading: false },

      // ── Single recon workspace state ───────────────────────────────────
      current: { ...emptyCurrent },
      ui: { ...emptyUi },
      creating: false,
      saving: false,
      autoRules: { data: [], loading: false },

      // ── Pagination / sort (persisted) ──────────────────────────────────
      currentPage: 1,
      itemsPerPage: 10,
      searchQuery: '',
      sortBy: 'created_at',
      sortOrder: 'DESC',

      // ── Selection (for bulk delete) ────────────────────────────────────
      selectedItems: [],

      /* ═══════════════════════════════════════════════════════════════════
         List
      ═══════════════════════════════════════════════════════════════════ */
      fetchList: async ({ page, limit, search } = {}) => {
        const { currentPage, itemsPerPage, searchQuery } = get();
        const p = page ?? currentPage;
        const l = limit ?? itemsPerPage;
        const s = search ?? searchQuery;
        set((st) => ({ list: { ...st.list, loading: true } }));
        try {
          const year = useAuthStore.getState().user?.accounting_period;
          const q = new URLSearchParams({ page: p, limit: l, search: s });
          if (year) q.set('year', year);
          const res = await api.get(`/bank-recon/list?${q}`);
          const responsePayload = coerceApiPayload(res.data);
          if (responseIsFailure(responsePayload)) {
            throw new Error(getResponseMessage(responsePayload, 'Failed to load list'));
          }
          set({
            list: { data: responsePayload.data || [], pagination: responsePayload.pagination || null, loading: false },
            currentPage: p,
            searchQuery: s,
          });
          return responsePayload;
        } catch (err) {
          set((st) => ({ list: { ...st.list, loading: false } }));
          const data = coerceApiPayload(err.response?.data);
          useToastStore.getState().showToast(getResponseMessage(data, err.message || 'Failed to load list'), 'error');
          return null;
        }
      },

      /* ═══════════════════════════════════════════════════════════════════
         Create
      ═══════════════════════════════════════════════════════════════════ */
      createReconciliation: async (payload) => {
        set({ creating: true });
        const requestStartedAt = new Date();
        try {
          const res = await api.post('/bank-recon/create', toFD(payload));
          const responsePayload = coerceApiPayload(res.data);

          if (responseIsFailure(responsePayload)) {
            throw new Error(getResponseMessage(responsePayload, 'Failed to create reconciliation'));
          }

          let normalised = normaliseCreateResponse(responsePayload);

          // Only use the list fallback when the backend explicitly reports
          // business success. Do not treat a plain HTTP 200 as success because
          // PHP fatals/warnings can still come back as a 200 response on some
          // local setups. Also only accept a row created after this request.
          if (!normalised && responseIsSuccess(responsePayload)) {
            const latest = await searchLatestCreatedRecon(payload, requestStartedAt);
            const fallbackId = extractReconId(latest);
            if (fallbackId) {
              normalised = normaliseCreateResponse(responsePayload, fallbackId);
            }
          }

          set({ creating: false });

          if (!normalised) {
            const message = responseIsSuccess(responsePayload)
              ? 'Reconciliation was created, but Smartbooks could not confirm the new record in the list. Please check the backend response for the returned reconciliation ID.'
              : getResponseMessage(responsePayload, 'Reconciliation was not created. The server did not return a valid success response.');
            useToastStore.getState().showToast(message, 'error');
            return null;
          }

          useToastStore.getState().showToast(normalised.message || 'Reconciliation created', 'success');
          await get().fetchList({ page: 1, search: '' });
          return normalised;
        } catch (err) {
          set({ creating: false });
          const data = coerceApiPayload(err.response?.data);
          useToastStore.getState().showToast(getResponseMessage(data, err.message || 'Failed to create reconciliation'), 'error');
          return null;
        }
      },

      /* ═══════════════════════════════════════════════════════════════════
         Update (header fields only — no file re-upload)
      ═══════════════════════════════════════════════════════════════════ */
      updateReconciliation: async (payload) => {
        set({ saving: true });
        // payload may be plain object or FormData (when files are included)
        try {
          const body = payload instanceof FormData ? payload : toFD(payload);
          const res = await api.post('/bank-recon/update', body);
          const responsePayload = coerceApiPayload(res.data);
          set({ saving: false });
          if (responseIsFailure(responsePayload) || !responseIsSuccess(responsePayload)) {
            useToastStore.getState().showToast(getResponseMessage(responsePayload, 'Update failed'), 'error');
            return null;
          }
          useToastStore.getState().showToast(responsePayload?.message || 'Reconciliation updated', 'success');
          await get().fetchList({ page: 1, search: '' });
          // Refresh current workspace if we just edited the open recon
          const updatedId = payload instanceof FormData
            ? parseInt(payload.get('recon_id'), 10)
            : Number(payload.recon_id);
          if (updatedId && Number(get().current.reconciliation?.id) === updatedId) {
            await get().fetchSingle(updatedId);
          }
          return responsePayload;
        } catch (err) {
          set({ saving: false });
          const data = coerceApiPayload(err.response?.data);
          useToastStore.getState().showToast(getResponseMessage(data, 'Failed to update reconciliation'), 'error');
          return null;
        }
      },

      /* ═══════════════════════════════════════════════════════════════════
         Delete
      ═══════════════════════════════════════════════════════════════════ */
      deleteReconciliation: async (reconId) => {
        try {
          const res = await api.post('/bank-recon/delete', { recon_id: reconId }, {
            
          });
          if (res.data?.status !== 'Success') {
            useToastStore.getState().showToast(res.data?.message || 'Delete failed', 'error');
            return false;
          }
          useToastStore.getState().showToast(res.data.message || 'Reconciliation deleted', 'success');
          get().fetchList();
          return true;
        } catch (err) {
          useToastStore.getState().showToast(err.response?.data?.message || 'Failed to delete', 'error');
          return false;
        }
      },

      deleteSelectedItems: async () => {
        const { selectedItems } = get();
        const results = await Promise.all(selectedItems.map((id) => get().deleteReconciliation(id)));
        const allOk = results.every(Boolean);
        if (allOk) set({ selectedItems: [] });
        return allOk;
      },

      /* ═══════════════════════════════════════════════════════════════════
         Fetch single (workspace)
      ═══════════════════════════════════════════════════════════════════ */
      fetchSingle: async (id) => {
        if (!id) return null;
        set((st) => ({ current: { ...st.current, loading: true } }));
        try {
          const res = await api.get(`/bank-recon/get?id=${id}`, {
            
          });
          const d = res.data.data || {};
          set({
            current: {
              reconciliation: d.reconciliation || null,
              bank_lines: d.bank_lines || [],
              ledger_lines: d.ledger_lines || [],
              matches: d.matches || [],
              summary: d.summary || null,
              difference_explanation: d.difference_explanation || null,
              upload_profiles: d.upload_profiles || [],
              learned_patterns: d.learned_patterns || [],
              loading: false,
            },
            ui: { ...emptyUi },
          });
          return res.data;
        } catch (err) {
          set((st) => ({ current: { ...st.current, loading: false } }));
          useToastStore.getState().showToast(err.response?.data?.message || 'Failed to load reconciliation', 'error');
          return null;
        }
      },

      /* ═══════════════════════════════════════════════════════════════════
         Matching
      ═══════════════════════════════════════════════════════════════════ */
      matchLines: async (bankLineId, ledgerLineId) => {
        const reconId = get().current.reconciliation?.id;
        if (!reconId || !bankLineId || !ledgerLineId) return null;
        set({ saving: true });
        try {
          const res = await api.post('/bank-recon/match', toFD({ recon_id: reconId, bank_line_id: bankLineId, ledger_line_id: ledgerLineId }), {
            
          });
          await get().fetchSingle(reconId);
          set({ saving: false });
          useToastStore.getState().showToast('Lines matched', 'success');
          return res.data;
        } catch (err) {
          await get().fetchSingle(reconId);
          set({ saving: false });
          useToastStore.getState().showToast(err.response?.data?.message || 'Match failed', 'error');
          return null;
        }
      },

      unmatchLines: async (matchGroup) => {
        const reconId = get().current.reconciliation?.id;
        if (!reconId || !matchGroup) return null;
        set({ saving: true });
        try {
          const res = await api.post('/bank-recon/unmatch', toFD({ recon_id: reconId, match_group: matchGroup }), {
            
          });
          await get().fetchSingle(reconId);
          set({ saving: false });
          useToastStore.getState().showToast('Match removed', 'success');
          return res.data;
        } catch (err) {
          await get().fetchSingle(reconId);
          set({ saving: false });
          useToastStore.getState().showToast(err.response?.data?.message || 'Unmatch failed', 'error');
          return null;
        }
      },

      matchSelectedLines: async ({ bank_line_ids = [], ledger_line_ids = [], allow_partial = false, match_note = '' }) => {
        const reconId = get().current?.reconciliation?.id;
        if (!reconId || !bank_line_ids.length || !ledger_line_ids.length) {
          useToastStore.getState().showToast('Select bank and ledger lines before matching.', 'error');
          return false;
        }
        set({ saving: true });
        try {
          const res = await api.post('/bank-recon/match-selected-lines', { recon_id: reconId, bank_line_ids, ledger_line_ids, allow_partial, match_note }, {
            
          });
          if (res.data?.status !== 'Success') throw new Error(res.data?.message || 'Failed to match');
          useToastStore.getState().showToast(res.data?.message || 'Lines matched successfully', 'success');
          await get().fetchSingle(reconId);
          return true;
        } catch (err) {
          useToastStore.getState().showToast(err.response?.data?.message || err.message || 'Failed to match', 'error');
          return false;
        } finally {
          set({ saving: false });
        }
      },

      classifyLine: async ({ source, lineId, category, classification, drLedger, crLedger, note = '' }) => {
        const reconId = get().current.reconciliation?.id;
        if (!reconId || !source || !lineId || !category || !classification) {
          useToastStore.getState().showToast('Category and classification are required', 'error');
          return null;
        }
        set({ saving: true });
        try {
          const res = await api.post('/bank-recon/classify', toFD({ recon_id: reconId, source, line_id: lineId, category, classification, dr_ledger: drLedger || '', cr_ledger: crLedger || '', note }), {
            
          });
          await get().fetchSingle(reconId);
          set({ saving: false });
          useToastStore.getState().showToast('Line classified', 'success');
          return res.data;
        } catch (err) {
          await get().fetchSingle(reconId);
          set({ saving: false });
          useToastStore.getState().showToast(err.response?.data?.message || 'Classification failed', 'error');
          return null;
        }
      },

      classifySelectedLines: async ({ source, lineIds = [], category, classification, drLedger, crLedger, note }) => {
        const reconId = get().current?.reconciliation?.id;
        if (!reconId || !source || !lineIds.length || !category || !classification) {
          useToastStore.getState().showToast('Select lines and provide category/classification.', 'error');
          return false;
        }
        set({ saving: true });
        try {
          const res = await api.post('/bank-recon/classify-selected-lines', { recon_id: reconId, source, line_ids: lineIds, category, classification, dr_ledger: drLedger, cr_ledger: crLedger, note }, {
            
          });
          if (res.data?.status !== 'Success') throw new Error(res.data?.message || 'Failed to classify');
          useToastStore.getState().showToast('Lines classified successfully', 'success');
          await get().fetchSingle(reconId);
          return true;
        } catch (err) {
          useToastStore.getState().showToast(err.response?.data?.message || err.message || 'Failed to classify', 'error');
          return false;
        } finally {
          set({ saving: false });
        }
      },

      /* ═══════════════════════════════════════════════════════════════════
         Update a single line (amount, direction, date, description, etc.)
      ═══════════════════════════════════════════════════════════════════ */
      updateLine: async ({ line_id, source, recon_id, ...fields }) => {
        const reconId = recon_id ?? get().current.reconciliation?.id;
        if (!reconId || !line_id || !source) {
          useToastStore.getState().showToast('line_id, source and recon_id are required.', 'error');
          return null;
        }
        set({ saving: true });
        try {
          // Remove undefined fields so the backend ignores them
          const payload = { line_id, source, recon_id: reconId };
          Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== '') payload[k] = v; });

          const res = await api.post('/bank-recon/update-line', payload, {
            
          });
          if (res.data?.status !== 'Success') {
            useToastStore.getState().showToast(res.data?.message || 'Update failed', 'error');
            return null;
          }
          // Warn if a matched line was edited
          if (res.data?.warning) {
            useToastStore.getState().showToast(
              'Line updated — it was matched, please review the match.',
              'warning'
            );
          } else {
            useToastStore.getState().showToast('Line updated successfully', 'success');
          }
          await get().fetchSingle(reconId);
          return res.data;
        } catch (err) {
          useToastStore.getState().showToast(err.response?.data?.message || 'Failed to update line', 'error');
          return null;
        } finally {
          set({ saving: false });
        }
      },


      /* ═══════════════════════════════════════════════════════════════════
         Delete one or more bank/ledger lines from the open reconciliation
      ═══════════════════════════════════════════════════════════════════ */
      deleteLines: async ({ source, lineIds = [], recon_id }) => {
        const reconId = recon_id ?? get().current.reconciliation?.id;
        const ids = Array.isArray(lineIds) ? lineIds : [lineIds];
        const cleanedIds = [...new Set(ids.map(Number).filter((id) => Number.isFinite(id) && id > 0))];

        if (!reconId || !source || !cleanedIds.length) {
          useToastStore.getState().showToast('Select at least one bank or ledger line to delete.', 'error');
          return null;
        }

        set({ saving: true });
        try {
          const res = await api.post('/bank-recon/delete-line', { recon_id: reconId, source, line_ids: cleanedIds }, {
            
          });
          if (res.data?.status !== 'Success') {
            useToastStore.getState().showToast(res.data?.message || 'Delete line failed', 'error');
            return null;
          }
          useToastStore.getState().showToast(res.data?.message || 'Line deleted successfully', 'success');
          await get().fetchSingle(reconId);
          return res.data;
        } catch (err) {
          useToastStore.getState().showToast(err.response?.data?.message || 'Failed to delete line', 'error');
          return null;
        } finally {
          set({ saving: false });
        }
      },

      /* ═══════════════════════════════════════════════════════════════════
         Append lines from a new file upload (idempotent — skips duplicates)
      ═══════════════════════════════════════════════════════════════════ */
      /* ═══════════════════════════════════════════════════════════════════
         Add a single manual transaction line
      ═══════════════════════════════════════════════════════════════════ */
      addLine: async (payload) => {
        const reconId = payload.recon_id ?? get().current.reconciliation?.id;
        if (!reconId) {
          useToastStore.getState().showToast('recon_id is required.', 'error');
          return null;
        }
        set({ saving: true });
        try {
          const body = { ...payload, recon_id: reconId };
          // Remove undefined fields
          Object.keys(body).forEach((k) => { if (body[k] === undefined) delete body[k]; });
          const res = await api.post('/bank-recon/add-line', body, {
            
          });
          if (res.data?.status !== 'Success') {
            useToastStore.getState().showToast(res.data?.message || 'Add line failed', 'error');
            return null;
          }
          useToastStore.getState().showToast('Line added — it is now unmatched and ready.', 'success');
          await get().fetchSingle(reconId);
          return res.data;
        } catch (err) {
          useToastStore.getState().showToast(err.response?.data?.message || 'Failed to add line', 'error');
          return null;
        } finally {
          set({ saving: false });
        }
      },

      appendLines: async ({ recon_id, source, file }) => {
        const reconId = recon_id ?? get().current.reconciliation?.id;
        if (!reconId || !source || !file) {
          useToastStore.getState().showToast('recon_id, source and file are required.', 'error');
          return null;
        }
        set({ saving: true });
        try {
          const fd = new FormData();
          fd.append('recon_id', reconId);
          fd.append('source', source);
          fd.append(`${source}_file`, file);
          const res = await api.post('/bank-recon/append-lines', fd, {
            
          });
          if (res.data?.status !== 'Success') {
            useToastStore.getState().showToast(res.data?.message || 'Append failed', 'error');
            return null;
          }
          useToastStore.getState().showToast(res.data.message, 'success');
          await get().fetchSingle(reconId);
          return res.data;
        } catch (err) {
          useToastStore.getState().showToast(err.response?.data?.message || 'Failed to append lines', 'error');
          return null;
        } finally {
          set({ saving: false });
        }
      },

      /* ═══════════════════════════════════════════════════════════════════
         Remove lines from classification → back to Unmatched
      ═══════════════════════════════════════════════════════════════════ */
      unclassifyLines: async ({ source, lineIds = [] }) => {
        const reconId = get().current.reconciliation?.id;
        if (!reconId || !source || !lineIds.length) {
          useToastStore.getState().showToast('source and line IDs are required.', 'error');
          return null;
        }
        set({ saving: true });
        try {
          const res = await api.post('/bank-recon/unclassify-line', { recon_id: reconId, source, line_ids: lineIds }, {
            
          });
          if (res.data?.status !== 'Success') {
            useToastStore.getState().showToast(res.data?.message || 'Unclassify failed', 'error');
            return null;
          }
          useToastStore.getState().showToast(res.data.message, 'success');
          await get().fetchSingle(reconId);
          return res.data;
        } catch (err) {
          useToastStore.getState().showToast(err.response?.data?.message || 'Failed to unclassify', 'error');
          return null;
        } finally {
          set({ saving: false });
        }
      },

      fetchAutoRules: async () => {
        set((st) => ({ autoRules: { ...st.autoRules, loading: true } }));
        try {
          const res = await api.get('/bank-recon/auto-rules');
          const payload = coerceApiPayload(res.data);
          if (responseIsFailure(payload)) throw new Error(getResponseMessage(payload, 'Failed to load rules'));
          set({ autoRules: { data: payload.data || [], loading: false } });
          return payload.data || [];
        } catch (err) {
          set((st) => ({ autoRules: { ...st.autoRules, loading: false } }));
          useToastStore.getState().showToast(err.response?.data?.message || err.message || 'Failed to load auto rules', 'error');
          return [];
        }
      },

      saveAutoRule: async (payload) => {
        set({ saving: true });
        try {
          const res = await api.post('/bank-recon/auto-rules', { action: 'save', ...payload });
          const responsePayload = coerceApiPayload(res.data);
          if (responseIsFailure(responsePayload) || !responseIsSuccess(responsePayload)) {
            throw new Error(getResponseMessage(responsePayload, 'Failed to save rule'));
          }
          set({ autoRules: { data: responsePayload.data || [], loading: false } });
          useToastStore.getState().showToast(responsePayload.message || 'Auto rule saved', 'success');
          return responsePayload;
        } catch (err) {
          useToastStore.getState().showToast(err.response?.data?.message || err.message || 'Failed to save auto rule', 'error');
          return null;
        } finally {
          set({ saving: false });
        }
      },

      deleteAutoRule: async (id) => {
        if (!id) return null;
        set({ saving: true });
        try {
          const res = await api.post('/bank-recon/auto-rules', { action: 'delete', id });
          const responsePayload = coerceApiPayload(res.data);
          if (responseIsFailure(responsePayload) || !responseIsSuccess(responsePayload)) {
            throw new Error(getResponseMessage(responsePayload, 'Failed to delete rule'));
          }
          set({ autoRules: { data: responsePayload.data || [], loading: false } });
          useToastStore.getState().showToast(responsePayload.message || 'Auto rule deleted', 'success');
          return responsePayload;
        } catch (err) {
          useToastStore.getState().showToast(err.response?.data?.message || err.message || 'Failed to delete auto rule', 'error');
          return null;
        } finally {
          set({ saving: false });
        }
      },

      toggleAutoRule: async (id, is_active) => {
        if (!id) return null;
        try {
          const res = await api.post('/bank-recon/auto-rules', { action: 'toggle', id, is_active });
          const responsePayload = coerceApiPayload(res.data);
          if (responseIsFailure(responsePayload) || !responseIsSuccess(responsePayload)) {
            throw new Error(getResponseMessage(responsePayload, 'Failed to update rule'));
          }
          set({ autoRules: { data: responsePayload.data || [], loading: false } });
          return responsePayload;
        } catch (err) {
          useToastStore.getState().showToast(err.response?.data?.message || err.message || 'Failed to update rule', 'error');
          return null;
        }
      },

      applyAutoRules: async ({ recon_id, source = 'bank', override_manual = false } = {}) => {
        const reconId = recon_id ?? get().current.reconciliation?.id;
        if (!reconId) return null;
        set({ saving: true });
        try {
          const res = await api.post('/bank-recon/auto-rules', {
            action: 'apply',
            recon_id: reconId,
            source,
            override_manual: Boolean(override_manual),
          });
          const responsePayload = coerceApiPayload(res.data);
          if (responseIsFailure(responsePayload) || !responseIsSuccess(responsePayload)) {
            throw new Error(getResponseMessage(responsePayload, 'Failed to apply auto rules'));
          }
          useToastStore.getState().showToast(responsePayload.message || 'Auto rules applied', 'success');
          await get().fetchSingle(reconId);
          return responsePayload;
        } catch (err) {
          useToastStore.getState().showToast(err.response?.data?.message || err.message || 'Failed to apply auto rules', 'error');
          return null;
        } finally {
          set({ saving: false });
        }
      },

      downloadExcel: async (id, filename = 'Bank_Reconciliation') => {
        try {
          const res = await api.get(`/bank-recon/export-excel?id=${id}`, {
            headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
            responseType: 'blob',
          });
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const a = document.createElement('a');
          a.href = url;
          a.setAttribute('download', `${filename}.xlsx`);
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          return true;
        } catch (err) {
          useToastStore.getState().showToast('Failed to download Excel', 'error');
          return false;
        }
      },

      /* ═══════════════════════════════════════════════════════════════════
         Pagination helpers
      ═══════════════════════════════════════════════════════════════════ */
      setCurrentPage: (page) => { set({ currentPage: page }); get().fetchList({ page }); },
      setItemsPerPage: (items) => { set({ itemsPerPage: items, currentPage: 1 }); get().fetchList({ page: 1, limit: items }); },
      setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
      getTotalPages: () => {
        const { list, itemsPerPage } = get();
        return Math.ceil((list.pagination?.total || 0) / itemsPerPage);
      },

      /* ═══════════════════════════════════════════════════════════════════
         Selection
      ═══════════════════════════════════════════════════════════════════ */
      toggleItemSelection: (id) => {
        const { selectedItems } = get();
        set({ selectedItems: selectedItems.includes(id) ? selectedItems.filter((x) => x !== id) : [...selectedItems, id] });
      },
      clearSelection: () => set({ selectedItems: [] }),

      /* ═══════════════════════════════════════════════════════════════════
         UI helpers
      ═══════════════════════════════════════════════════════════════════ */
      setUi: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),
      resetCurrent: () => set({ current: { ...emptyCurrent }, ui: { ...emptyUi } }),
    }),
    {
      name: 'bank-recon-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        itemsPerPage: state.itemsPerPage,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);

export default useBankReconStore;
