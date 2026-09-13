import { create } from 'zustand';
import api from '../services/api';

const messageFrom = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

const useCostCentresStore = create((set, get) => ({
  data: [],
  summary: { total: 0, active: 0, inactive: 0, assigned: 0 },
  loading: false,
  saving: false,
  error: null,
  search: '',
  status: 'all',

  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status }),
  clearError: () => set({ error: null }),

  fetchData: async (overrides = {}) => {
    const state = get();
    const search = overrides.search ?? state.search;
    const status = overrides.status ?? state.status;
    set({ loading: true, error: null, search, status });
    try {
      const response = await api.get('/cost-centres/manage-list', { params: { search, status } });
      set({
        data: Array.isArray(response.data?.data) ? response.data.data : [],
        summary: response.data?.summary || { total: 0, active: 0, inactive: 0, assigned: 0 },
        loading: false,
      });
      return response.data;
    } catch (error) {
      set({ loading: false, error: messageFrom(error, 'Unable to load cost centres.') });
      throw error;
    }
  },

  createCostCentre: async (name, { refresh = true } = {}) => {
    set({ saving: true, error: null });
    try {
      const response = await api.post('/cost-centres/create', { name });
      set({ saving: false });
      if (refresh) await get().fetchData();
      return response.data;
    } catch (error) {
      set({ saving: false, error: messageFrom(error, 'Unable to create cost centre.') });
      throw error;
    }
  },

  updateCostCentre: async ({ id, name, is_active }) => {
    set({ saving: true, error: null });
    try {
      const response = await api.put('/cost-centres/update', { id, name, is_active });
      set({ saving: false });
      await get().fetchData();
      return response.data;
    } catch (error) {
      set({ saving: false, error: messageFrom(error, 'Unable to update cost centre.') });
      throw error;
    }
  },

  deleteCostCentre: async (id) => {
    set({ saving: true, error: null });
    try {
      const response = await api.delete('/cost-centres/delete', { params: { id } });
      set({ saving: false });
      await get().fetchData();
      return response.data;
    } catch (error) {
      set({ saving: false, error: messageFrom(error, 'Unable to delete cost centre.') });
      throw error;
    }
  },
}));

export default useCostCentresStore;
