import { create } from 'zustand';
import api from '../services/api';
import useAuthStore from './useAuthStore';

const useBankSearchStore = create((set, get) => ({
  banks: [],
  loading: false,
  error: null,

  searchBanks: async (search = '') => { // Default to empty string
    const token = useAuthStore.getState().token;
    set({ loading: true, error: null });
    
    try {
      // If search is empty, it sends ?search= which returns the first 100 results
      const response = await api.get(`/bank/fetch-banks?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ 
        banks: response.data.data || [], 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || error.message, 
        loading: false 
      });
    }
  },

  clearBanks: () => set({ banks: [] })
}));

export default useBankSearchStore;