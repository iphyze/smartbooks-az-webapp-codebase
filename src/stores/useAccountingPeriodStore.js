import { create } from 'zustand';
import api from '../services/api';
import useToastStore from './useToastStore';

const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

const useAccountingPeriodStore = create((set, get) => ({
  periods: [],
  closures: [],
  loading: false,
  closuresLoading: false,
  saving: false,
  lockPreviewLoading: false,
  locking: false,
  unlocking: false,
  fiscalPreviewLoading: false,
  fiscalPosting: false,
  reversalPreviewLoading: false,
  reversing: false,
  error: null,
  searchQuery: '',
  lockPreview: null,
  fiscalPreview: null,
  reversalPreview: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  clearLockPreview: () => set({ lockPreview: null }),
  clearFiscalPreview: () => set({ fiscalPreview: null }),
  clearReversalPreview: () => set({ reversalPreview: null }),

  fetchPeriods: async () => {
    set({ loading: true, error: null });
    try {
      const query = get().searchQuery.trim();
      const response = await api.get(`/accounting-period/periods${query ? `?search=${encodeURIComponent(query)}` : ''}`);
      set({ periods: response.data.data || [], loading: false });
      return true;
    } catch (error) {
      const message = errorMessage(error, 'Unable to load accounting periods.');
      set({ loading: false, error: message });
      useToastStore.getState().showToast(message, 'error');
      return false;
    }
  },

  fetchClosures: async () => {
    set({ closuresLoading: true });
    try {
      const response = await api.get('/accounting-period/fiscal-year-closures');
      set({ closures: response.data.data || [], closuresLoading: false });
      return true;
    } catch (error) {
      const message = errorMessage(error, 'Unable to load fiscal-year closures.');
      set({ closuresLoading: false });
      useToastStore.getState().showToast(message, 'error');
      return false;
    }
  },

  createPeriod: async (payload) => {
    set({ saving: true });
    try {
      const response = await api.post('/accounting-period/create-period', {
        start_date: payload.start_date,
        end_date: payload.end_date,
        is_locked: false,
        is_active: Boolean(payload.is_active),
      });
      useToastStore.getState().showToast(response.data.message || 'Accounting period created successfully.', 'success');
      await get().fetchPeriods();
      set({ saving: false });
      return true;
    } catch (error) {
      const message = errorMessage(error, 'Unable to create accounting period.');
      set({ saving: false });
      useToastStore.getState().showToast(message, 'error');
      return false;
    }
  },

  updatePeriod: async (payload) => {
    set({ saving: true });
    try {
      const response = await api.put('/accounting-period/update-lock-period', {
        id: payload.id,
        start_date: payload.start_date,
        end_date: payload.end_date,
        is_locked: Boolean(payload.is_locked),
        is_active: Boolean(payload.is_active),
        lock_reason: payload.lock_reason || '',
      });
      useToastStore.getState().showToast(response.data.message || 'Accounting period updated.', 'success');
      await get().fetchPeriods();
      set({ saving: false });
      return true;
    } catch (error) {
      const message = errorMessage(error, 'Unable to update accounting period.');
      set({ saving: false });
      useToastStore.getState().showToast(message, 'error');
      return false;
    }
  },

  previewLockPeriod: async (periodId) => {
    set({ lockPreviewLoading: true, lockPreview: null });
    try {
      const response = await api.post('/accounting-period/preview-lock-period', { period_id: periodId });
      set({ lockPreview: response.data.data || null, lockPreviewLoading: false });
      return response.data.data || null;
    } catch (error) {
      const message = errorMessage(error, 'Unable to prepare the accounting-period lock preview.');
      set({ lockPreviewLoading: false, lockPreview: null });
      useToastStore.getState().showToast(message, 'error');
      return null;
    }
  },

  lockPeriod: async ({ period, previewToken, lockReason }) => {
    set({ locking: true });
    try {
      const response = await api.put('/accounting-period/update-lock-period', {
        id: period.id,
        start_date: period.start_date,
        end_date: period.end_date,
        is_locked: true,
        is_active: Boolean(period.is_active),
        lock_reason: lockReason,
        preview_token: previewToken,
      });
      useToastStore.getState().showToast(response.data.message || 'Accounting period locked successfully.', 'success');
      await Promise.all([get().fetchPeriods(), get().fetchClosures()]);
      set({ locking: false, lockPreview: null });
      return true;
    } catch (error) {
      const message = errorMessage(error, 'Unable to lock the accounting period.');
      set({ locking: false });
      useToastStore.getState().showToast(message, 'error');
      return false;
    }
  },

  unlockPeriod: async ({ period, reason }) => {
    set({ unlocking: true });
    try {
      const response = await api.put('/accounting-period/update-lock-period', {
        id: period.id,
        start_date: period.start_date,
        end_date: period.end_date,
        is_locked: false,
        is_active: Boolean(period.is_active),
        lock_reason: period.lock_reason || '',
        unlock_reason: reason,
      });
      useToastStore.getState().showToast(response.data.message || 'Accounting period unlocked successfully.', 'success');
      await Promise.all([get().fetchPeriods(), get().fetchClosures()]);
      set({ unlocking: false });
      return true;
    } catch (error) {
      const message = errorMessage(error, 'Unable to unlock the accounting period.');
      set({ unlocking: false });
      useToastStore.getState().showToast(message, 'error');
      return false;
    }
  },

  previewFiscalYearClose: async (payload) => {
    set({ fiscalPreviewLoading: true, fiscalPreview: null });
    try {
      const response = await api.post('/accounting-period/preview-fiscal-year-close', payload);
      const preview = response.data.data || null;
      set({ fiscalPreview: preview, fiscalPreviewLoading: false });
      return preview;
    } catch (error) {
      const message = errorMessage(error, 'Unable to prepare the fiscal-year close preview.');
      set({ fiscalPreviewLoading: false, fiscalPreview: null });
      useToastStore.getState().showToast(message, 'error');
      return null;
    }
  },

  postFiscalYearClose: async (payload) => {
    set({ fiscalPosting: true });
    try {
      const response = await api.post('/accounting-period/post-fiscal-year-close', payload);
      useToastStore.getState().showToast(response.data.message || 'Fiscal year closed successfully.', 'success');
      await Promise.all([get().fetchPeriods(), get().fetchClosures()]);
      set({ fiscalPosting: false, fiscalPreview: null });
      return response.data.data || true;
    } catch (error) {
      const message = errorMessage(error, 'Unable to post the fiscal-year close.');
      set({ fiscalPosting: false });
      useToastStore.getState().showToast(message, 'error');
      return false;
    }
  },

  previewFiscalYearCloseReversal: async (closureId) => {
    set({ reversalPreviewLoading: true, reversalPreview: null });
    try {
      const response = await api.post('/accounting-period/preview-fiscal-year-close-reversal', { closure_id: closureId });
      const preview = response.data.data || null;
      set({ reversalPreview: preview, reversalPreviewLoading: false });
      return preview;
    } catch (error) {
      const message = errorMessage(error, 'Unable to prepare the fiscal-year close reversal preview.');
      set({ reversalPreviewLoading: false, reversalPreview: null });
      useToastStore.getState().showToast(message, 'error');
      return null;
    }
  },

  reverseFiscalYearClose: async ({ closureId, previewToken, reason }) => {
    set({ reversing: true });
    try {
      const response = await api.post('/accounting-period/reverse-fiscal-year-close', {
        closure_id: closureId,
        preview_token: previewToken,
        reason,
      });
      useToastStore.getState().showToast(response.data.message || 'Fiscal-year closure reversed successfully.', 'success');
      await Promise.all([get().fetchPeriods(), get().fetchClosures()]);
      set({ reversing: false, reversalPreview: null });
      return response.data.data || true;
    } catch (error) {
      const message = errorMessage(error, 'Unable to reverse the fiscal-year closure.');
      set({ reversing: false });
      useToastStore.getState().showToast(message, 'error');
      return false;
    }
  },
}));

export default useAccountingPeriodStore;
