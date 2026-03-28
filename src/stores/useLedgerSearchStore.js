import { create } from 'zustand';
import api from '../services/api';
import useAuthStore from './useAuthStore';

const useLedgerStore = create((set, get) => ({
  ledgers: [],
  loading: false,
  error: null,

  searchLedgers: async (search = '') => { // Default to empty string
    const token = useAuthStore.getState().token;
    set({ loading: true, error: null });
    
    try {
      // If search is empty, it sends ?search= which returns the first 100 results
      const response = await api.get(`/ledger/fetch-ledger?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ 
        ledgers: response.data.data || [], 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || error.message, 
        loading: false 
      });
    }
  },

  clearLedgers: () => set({ ledgers: [] })
}));

export default useLedgerStore;