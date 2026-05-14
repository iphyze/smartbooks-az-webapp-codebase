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
    const token = useAuthStore.getState().token;
    if (!id) return null;
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
      const fd = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) fd.append(key, value);
      });
      const res = await api.post('/bank-reconciliation/create-bank-reconciliation', fd, {
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
    const token = useAuthStore.getState().token;
    const id = Number(reconciliationId || 0);
    if (!id) {
      useToastStore.getState().showToast('Reconciliation ID is missing. Please reopen the reconciliation and try again.', 'error');
      return null;
    }
    set({ analyzing: true });
    try {
      const body = new URLSearchParams({ reconciliation_id: String(id), id: String(id) });
      const res = await api.post('/bank-reconciliation/analyze-bank-reconciliation', body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      set({ analyzing: false });
      useToastStore.getState().showToast('Reconciliation analysis completed', 'success');
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to analyze reconciliation';
      set({ analyzing: false });
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  manualMatchLines: async ({ reconciliation_id, bank_line_ids = [], ledger_line_ids = [], notes = '' }) => {
    const token = useAuthStore.getState().token;
    const id = Number(reconciliation_id || 0);
    if (!id) {
      useToastStore.getState().showToast('Reconciliation ID is missing.', 'error');
      return null;
    }
    set({ manualMatching: true });
    try {
      const res = await api.post('/bank-reconciliation/manual-match-bank-reconciliation', {
        reconciliation_id: id,
        bank_line_ids,
        ledger_line_ids,
        notes,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await get().fetchSingleReconciliation(id);
      set({ manualMatching: false });
      useToastStore.getState().showToast('Manual match saved', 'success');
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save manual match';
      set({ manualMatching: false });
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  classifyBankAdjustment: async ({ reconciliation_id, bank_line_ids = [], adjustment_type = 'Other', debit_ledger = '', credit_ledger = '', notes = '' }) => {
    const token = useAuthStore.getState().token;
    const id = Number(reconciliation_id || 0);
    if (!id) {
      useToastStore.getState().showToast('Reconciliation ID is missing.', 'error');
      return null;
    }
    set({ classifying: true });
    try {
      const res = await api.post('/bank-reconciliation/mark-bank-reconciliation-adjustment', {
        reconciliation_id: id,
        bank_line_ids,
        adjustment_type,
        debit_ledger,
        credit_ledger,
        notes,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await get().fetchSingleReconciliation(id);
      set({ classifying: false });
      useToastStore.getState().showToast('Bank line classified', 'success');
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to classify bank line';
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
