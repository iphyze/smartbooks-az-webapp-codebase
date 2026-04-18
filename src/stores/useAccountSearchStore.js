import { create } from 'zustand';
import api from '../services/api';
import useAuthStore from './useAuthStore';

const useAccountSearchStore = create((set, get) => ({
  accounts: [],
  loading: false,
  error: null,

  searchAccounts: async (search = '') => { // Default to empty string
    const token = useAuthStore.getState().token;
    set({ loading: true, error: null });
    
    try {
      // If search is empty, it sends ?search= which returns the first 100 results
      const response = await api.get(`/accounting-type/fetch-account?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ 
        accounts: response.data.data || [], 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || error.message, 
        loading: false 
      });
    }
  },

  clearAccounts: () => set({ accounts: [] })
}));

export default useAccountSearchStore;