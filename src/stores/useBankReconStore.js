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

const emptyCurrent = {
  reconciliation: null,
  bank_lines: [],
  ledger_lines: [],
  matches: [],
  summary: null,
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
        const token = useAuthStore.getState().token;
        const p = page ?? currentPage;
        const l = limit ?? itemsPerPage;
        const s = search ?? searchQuery;
        set((st) => ({ list: { ...st.list, loading: true } }));
        try {
          const q = new URLSearchParams({ page: p, limit: l, search: s });
          const res = await api.get(`/bank-recon/list?${q}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({
            list: { data: res.data.data || [], pagination: res.data.pagination || null, loading: false },
            currentPage: p,
          });
          return res.data;
        } catch (err) {
          set((st) => ({ list: { ...st.list, loading: false } }));
          useToastStore.getState().showToast(err.response?.data?.message || 'Failed to load list', 'error');
          return null;
        }
      },

      /* ═══════════════════════════════════════════════════════════════════
         Create
      ═══════════════════════════════════════════════════════════════════ */
      createReconciliation: async (payload) => {
        const token = useAuthStore.getState().token;
        set({ creating: true });
        try {
          const res = await api.post('/bank-recon/create', toFD(payload), {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
          });
          set({ creating: false });
          if (!res.data?.data?.id) {
            useToastStore.getState().showToast(res.data?.message || 'Reconciliation was not created', 'error');
            return null;
          }
          useToastStore.getState().showToast(res.data.message || 'Reconciliation created', 'success');
          get().fetchList();
          return res.data;
        } catch (err) {
          set({ creating: false });
          useToastStore.getState().showToast(err.response?.data?.message || 'Failed to create reconciliation', 'error');
          return null;
        }
      },

      /* ═══════════════════════════════════════════════════════════════════
         Update (header fields only — no file re-upload)
      ═══════════════════════════════════════════════════════════════════ */
      updateReconciliation: async (payload) => {
        const token = useAuthStore.getState().token;
        set({ saving: true });
        // payload may be plain object or FormData (when files are included)
        const isFormData = payload instanceof FormData;
        try {
          const res = await api.post('/bank-recon/update', payload, {
            headers: {
              Authorization: `Bearer ${token}`,
              ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {}),
            },
          });
          set({ saving: false });
          if (res.data?.status !== 'Success') {
            useToastStore.getState().showToast(res.data?.message || 'Update failed', 'error');
            return null;
          }
          useToastStore.getState().showToast('Reconciliation updated', 'success');
          get().fetchList();
          // Refresh current workspace if we just edited the open recon
          const updatedId = payload instanceof FormData
            ? parseInt(payload.get('recon_id'), 10)
            : payload.recon_id;
          if (updatedId && get().current.reconciliation?.id === updatedId) {
            await get().fetchSingle(updatedId);
          }
          return res.data;
        } catch (err) {
          set({ saving: false });
          useToastStore.getState().showToast(err.response?.data?.message || 'Failed to update reconciliation', 'error');
          return null;
        }
      },

      /* ═══════════════════════════════════════════════════════════════════
         Delete
      ═══════════════════════════════════════════════════════════════════ */
      deleteReconciliation: async (reconId) => {
        const token = useAuthStore.getState().token;
        try {
          const res = await api.post('/bank-recon/delete', { recon_id: reconId }, {
            headers: { Authorization: `Bearer ${token}` },
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
        const token = useAuthStore.getState().token;
        set((st) => ({ current: { ...st.current, loading: true } }));
        try {
          const res = await api.get(`/bank-recon/get?id=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const d = res.data.data || {};
          set({
            current: {
              reconciliation: d.reconciliation || null,
              bank_lines: d.bank_lines || [],
              ledger_lines: d.ledger_lines || [],
              matches: d.matches || [],
              summary: d.summary || null,
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
        const token = useAuthStore.getState().token;
        const reconId = get().current.reconciliation?.id;
        if (!reconId || !bankLineId || !ledgerLineId) return null;
        set({ saving: true });
        try {
          const res = await api.post('/bank-recon/match', toFD({ recon_id: reconId, bank_line_id: bankLineId, ledger_line_id: ledgerLineId }), {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
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
        const token = useAuthStore.getState().token;
        const reconId = get().current.reconciliation?.id;
        if (!reconId || !matchGroup) return null;
        set({ saving: true });
        try {
          const res = await api.post('/bank-recon/unmatch', toFD({ recon_id: reconId, match_group: matchGroup }), {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
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

      matchSelectedLines: async ({ bank_line_ids = [], ledger_line_ids = [] }) => {
        const token = useAuthStore.getState().token;
        const reconId = get().current?.reconciliation?.id;
        if (!reconId || !bank_line_ids.length || !ledger_line_ids.length) {
          useToastStore.getState().showToast('Select bank and ledger lines before matching.', 'error');
          return false;
        }
        set({ saving: true });
        try {
          const res = await api.post('/bank-recon/match-selected-lines', { recon_id: reconId, bank_line_ids, ledger_line_ids }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data?.status !== 'Success') throw new Error(res.data?.message || 'Failed to match');
          useToastStore.getState().showToast('Lines matched successfully', 'success');
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
        const token = useAuthStore.getState().token;
        const reconId = get().current.reconciliation?.id;
        if (!reconId || !source || !lineId || !category || !classification) {
          useToastStore.getState().showToast('Category and classification are required', 'error');
          return null;
        }
        set({ saving: true });
        try {
          const res = await api.post('/bank-recon/classify', toFD({ recon_id: reconId, source, line_id: lineId, category, classification, dr_ledger: drLedger || '', cr_ledger: crLedger || '', note }), {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
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
        const token = useAuthStore.getState().token;
        const reconId = get().current?.reconciliation?.id;
        if (!reconId || !source || !lineIds.length || !category || !classification) {
          useToastStore.getState().showToast('Select lines and provide category/classification.', 'error');
          return false;
        }
        set({ saving: true });
        try {
          const res = await api.post('/bank-recon/classify-selected-lines', { recon_id: reconId, source, line_ids: lineIds, category, classification, dr_ledger: drLedger, cr_ledger: crLedger, note }, {
            headers: { Authorization: `Bearer ${token}` },
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
        const token = useAuthStore.getState().token;
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
            headers: { Authorization: `Bearer ${token}` },
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
         Append lines from a new file upload (idempotent — skips duplicates)
      ═══════════════════════════════════════════════════════════════════ */
      /* ═══════════════════════════════════════════════════════════════════
         Add a single manual transaction line
      ═══════════════════════════════════════════════════════════════════ */
      addLine: async (payload) => {
        const token = useAuthStore.getState().token;
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
            headers: { Authorization: `Bearer ${token}` },
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
        const token = useAuthStore.getState().token;
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
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
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
        const token = useAuthStore.getState().token;
        const reconId = get().current.reconciliation?.id;
        if (!reconId || !source || !lineIds.length) {
          useToastStore.getState().showToast('source and line IDs are required.', 'error');
          return null;
        }
        set({ saving: true });
        try {
          const res = await api.post('/bank-recon/unclassify-line', { recon_id: reconId, source, line_ids: lineIds }, {
            headers: { Authorization: `Bearer ${token}` },
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

      downloadExcel: async (id, filename = 'Bank_Reconciliation') => {
        const token = useAuthStore.getState().token;
        try {
          const res = await api.get(`/bank-recon/export-excel?id=${id}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
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
