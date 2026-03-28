import { create } from 'zustand';
import api from '../services/api';
import useAuthStore from './useAuthStore';

const useRateSearchStore = create((set, get) => ({
  rates: [],
  loading: false,
  error: null,

  searchRates: async (search = '') => {
    const token = useAuthStore.getState().token;
    set({ loading: true, error: null });

    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await api.get(`/rate/fetch-rate${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({
        rates: response.data.data || [],
        loading: false
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message,
        loading: false
      });
    }
  },

  clearRates: () => set({ rates: [] })
}));

export default useRateSearchStore;