import { create } from 'zustand';
import api from '../services/api';
import useToastStore from './useToastStore';

const useAccountingPeriodStore = create((set, get) => ({
  periods: [],
  loading: false,
  saving: false,
  error: null,
  searchQuery: '',

  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchPeriods: async () => {
    set({ loading: true, error: null });
    try {
      const query = get().searchQuery.trim();
      const response = await api.get(`/accounting-period/periods${query ? `?search=${encodeURIComponent(query)}` : ''}`);
      set({ periods: response.data.data || [], loading: false });
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to load accounting periods.';
      set({ loading: false, error: message });
      useToastStore.getState().showToast(message, 'error');
      return false;
    }
  },

  createPeriod: async (payload) => {
    set({ saving: true });
    try {
      await api.post('/accounting-period/create-period', payload);
      useToastStore.getState().showToast('Accounting period created successfully', 'success');
      await get().fetchPeriods();
      set({ saving: false });
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to create accounting period.';
      set({ saving: false });
      useToastStore.getState().showToast(message, 'error');
      return false;
    }
  },

  updatePeriod: async (payload) => {
    set({ saving: true });
    try {
      const response = await api.put('/accounting-period/update-lock-period', payload);
      useToastStore.getState().showToast(response.data.message || 'Accounting period updated', 'success');
      await get().fetchPeriods();
      set({ saving: false });
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to update accounting period.';
      set({ saving: false });
      useToastStore.getState().showToast(message, 'error');
      return false;
    }
  },
}));

export default useAccountingPeriodStore;
