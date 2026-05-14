import { create } from 'zustand';
import api from '../services/api';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';

const emptyCurrent = {
  reconciliation: null,
  bank_lines: [],
  ledger_lines: [],
  matches: [],
  adjustments: [],
  summary: null,
  loading: false,
  error: null,
};

const toFormData = (payload = {}) => {
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (Array.isArray(value) || (value && typeof value === 'object' && !(value instanceof File))) {
      fd.append(key, JSON.stringify(value));
    } else if (value !== null && value !== undefined) {
      fd.append(key, value);
    }
  });
  return fd;
};

const useBankReconciliationStore = create((set, get) => ({
  reconciliations: { data: [], pagination: null, loading: false, error: null },
  current: { ...emptyCurrent },
  creating: false,
  analyzing: false,
  manualMatching: false,
  classifying: false,

  fetchReconciliations: async ({ page = 1, limit = 25, search = '' } = {}) => {
    const token = useAuthStore.getState().token;
    set((s) => ({ reconciliations: { ...s.reconciliations, loading: true, error: null } }));
    try {
      const query = new URLSearchParams({ page, limit, search });
      const res = await api.get(`/bank-reconciliation/fetch-bank-reconciliations?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ reconciliations: { data: res.data.data || [], pagination: res.data.pagination || null, loading: false, error: null } });
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch bank reconciliations';
      set((s) => ({ reconciliations: { ...s.reconciliations, loading: false, error: msg } }));
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  fetchSingleReconciliation: async (id) => {
    if (!id) return null;
    const token = useAuthStore.getState().token;
    set((s) => ({ current: { ...s.current, loading: true, error: null } }));
    try {
      const res = await api.get(`/bank-reconciliation/fetch-single-bank-reconciliation?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ current: { ...(res.data.data || {}), loading: false, error: null } });
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch bank reconciliation';
      set((s) => ({ current: { ...s.current, loading: false, error: msg } }));
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  createReconciliation: async (payload) => {
    const token = useAuthStore.getState().token;
    set({ creating: true });
    try {
      const res = await api.post('/bank-reconciliation/create-bank-reconciliation', toFormData(payload), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      set({ creating: false });
      useToastStore.getState().showToast('Bank reconciliation created', 'success');
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create bank reconciliation';
      set({ creating: false });
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  analyzeReconciliation: async (reconciliationId) => {
    if (!reconciliationId) {
      useToastStore.getState().showToast('Missing reconciliation id', 'error');
      return null;
    }
    const token = useAuthStore.getState().token;
    set({ analyzing: true });
    try {
      const res = await api.post('/bank-reconciliation/analyze-bank-reconciliation', toFormData({ reconciliation_id: reconciliationId }), {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ analyzing: false });
      useToastStore.getState().showToast('Auto-match completed', 'success');
      await get().fetchSingleReconciliation(reconciliationId);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to analyze reconciliation';
      set({ analyzing: false });
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  manualMatchLines: async ({ reconciliation_id, bank_line_ids, ledger_line_ids, notes }) => {
    const token = useAuthStore.getState().token;
    set({ manualMatching: true });
    try {
      const res = await api.post('/bank-reconciliation/manual-match-bank-reconciliation', {
        reconciliation_id,
        bank_line_ids,
        ledger_line_ids,
        notes: notes || '',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ manualMatching: false });
      useToastStore.getState().showToast('Selected lines matched', 'success');
      await get().fetchSingleReconciliation(reconciliation_id);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save manual match';
      set({ manualMatching: false });
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  classifyLines: async ({ reconciliation_id, source, line_ids, category, notes }) => {
    const token = useAuthStore.getState().token;
    set({ classifying: true });
    try {
      const res = await api.post('/bank-reconciliation/mark-bank-reconciliation-adjustment', {
        reconciliation_id,
        source,
        line_ids,
        category,
        notes: notes || '',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ classifying: false });
      useToastStore.getState().showToast('Selected lines classified', 'success');
      await get().fetchSingleReconciliation(reconciliation_id);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to classify selected lines';
      set({ classifying: false });
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  downloadReconciliationExcel: async (id, reference = 'Bank_Reconciliation') => {
    const token = useAuthStore.getState().token;
    try {
      const res = await api.get(`/bank-reconciliation/download-bank-reconciliation-excel?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reference}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      useToastStore.getState().showToast(err.response?.data?.message || 'Failed to download Excel', 'error');
      return false;
    }
  },

  resetCurrent: () => set({ current: { ...emptyCurrent } }),
}));

export default useBankReconciliationStore;
