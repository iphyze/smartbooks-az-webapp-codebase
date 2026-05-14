import { create } from 'zustand';
import api from '../services/api';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';

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
  selectedBankId: null,
  bankFilter: 'unmatched',
  ledgerFilter: 'unmatched',
  bankSearch: '',
  ledgerSearch: '',
  classifyTarget: null,
};

const useBankReconStore = create((set, get) => ({
  list: { data: [], pagination: null, loading: false },
  current: { ...emptyCurrent },
  ui: { ...emptyUi },
  creating: false,
  saving: false,

  fetchList: async ({ page = 1, limit = 20, search = '' } = {}) => {
    const token = useAuthStore.getState().token;
    set((s) => ({ list: { ...s.list, loading: true } }));
    try {
      const q = new URLSearchParams({ page, limit, search });
      const res = await api.get(`/bank-recon/list?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ list: { data: res.data.data || [], pagination: res.data.pagination || null, loading: false } });
      return res.data;
    } catch (err) {
      set((s) => ({ list: { ...s.list, loading: false } }));
      useToastStore.getState().showToast(err.response?.data?.message || 'Failed to load list', 'error');
      return null;
    }
  },

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

  fetchSingle: async (id) => {
    if (!id) return null;
    const token = useAuthStore.getState().token;
    set((s) => ({ current: { ...s.current, loading: true } }));
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
      set((s) => ({ current: { ...s.current, loading: false } }));
      useToastStore.getState().showToast(err.response?.data?.message || 'Failed to load reconciliation', 'error');
      return null;
    }
  },

  matchLines: async (bankLineId, ledgerLineId) => {
    const token = useAuthStore.getState().token;
    const reconId = get().current.reconciliation?.id;
    if (!reconId || !bankLineId || !ledgerLineId) {
      useToastStore.getState().showToast('Missing reconciliation or line selection', 'error');
      return null;
    }

    const tempGroup = `TEMP-${bankLineId}-${ledgerLineId}`;
    set((s) => ({
      current: {
        ...s.current,
        bank_lines: s.current.bank_lines.map((l) =>
          Number(l.id) === Number(bankLineId) ? { ...l, match_status: 'Matched', match_group: tempGroup, auto_matched: 0 } : l
        ),
        ledger_lines: s.current.ledger_lines.map((l) =>
          Number(l.id) === Number(ledgerLineId) ? { ...l, match_status: 'Matched', match_group: tempGroup, auto_matched: 0 } : l
        ),
      },
      ui: { ...s.ui, selectedBankId: null },
    }));

    set({ saving: true });
    try {
      const res = await api.post('/bank-recon/match', toFD({
        recon_id: reconId,
        bank_line_id: bankLineId,
        ledger_line_id: ledgerLineId,
      }), {
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

  classifyLine: async ({ source, lineId, category, classification, drLedger, crLedger, note = '' }) => {
    const token = useAuthStore.getState().token;
    const reconId = get().current.reconciliation?.id;
    if (!reconId || !source || !lineId || !category || !classification) {
      useToastStore.getState().showToast('Category and reconciliation classification are required', 'error');
      return null;
    }

    set({ saving: true });
    try {
      const res = await api.post('/bank-recon/classify', toFD({
        recon_id: reconId,
        source,
        line_id: lineId,
        category,
        classification,
        dr_ledger: drLedger || '',
        cr_ledger: crLedger || '',
        note,
      }), {
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

  matchSelectedLines: async ({ bank_line_ids = [], ledger_line_ids = [] }) => {
    const token = useAuthStore.getState().token;
    const reconId = get().current?.reconciliation?.id;

    if (!reconId || !bank_line_ids.length || !ledger_line_ids.length) {
      useToastStore.getState().showToast('Select bank and ledger lines before matching.', 'error');
      return false;
    }

    set({ saving: true });

    try {
      const res = await api.post('/bank-recon/match-selected-lines', {
        recon_id: reconId,
        bank_line_ids,
        ledger_line_ids,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.status !== 'Success') {
        throw new Error(res.data?.message || 'Failed to match selected lines');
      }

      useToastStore.getState().showToast('Selected lines matched successfully', 'success');
      await get().fetchSingle(reconId);
      return true;
    } catch (err) {
      useToastStore.getState().showToast(err.response?.data?.message || err.message || 'Failed to match selected lines', 'error');
      return false;
    } finally {
      set({ saving: false });
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
      const res = await api.post('/bank-recon/classify-selected-lines', {
        recon_id: reconId,
        source,
        line_ids: lineIds,
        category,
        classification,
        dr_ledger: drLedger,
        cr_ledger: crLedger,
        note,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.status !== 'Success') {
        throw new Error(res.data?.message || 'Failed to classify selected lines');
      }

      useToastStore.getState().showToast('Selected lines moved to Details successfully', 'success');
      await get().fetchSingle(reconId);
      return true;
    } catch (err) {
      useToastStore.getState().showToast(err.response?.data?.message || err.message || 'Failed to classify selected lines', 'error');
      return false;
    } finally {
      set({ saving: false });
    }
  },

  selectBankLine: (id) => set((s) => ({
    ui: { ...s.ui, selectedBankId: Number(s.ui.selectedBankId) === Number(id) ? null : Number(id) },
  })),

  clearSelection: () => set((s) => ({ ui: { ...s.ui, selectedBankId: null } })),

  openClassify: (line, source = 'bank') => set((s) => ({
    ui: { ...s.ui, classifyTarget: { line, source }, selectedBankId: null },
  })),

  closeClassify: () => set((s) => ({ ui: { ...s.ui, classifyTarget: null } })),

  setUi: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),

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

  resetCurrent: () => set({ current: { ...emptyCurrent }, ui: { ...emptyUi } }),
}));

export default useBankReconStore;
