import { create } from 'zustand';
import api from '../services/api';
import useAuthStore from './useAuthStore';

const useClientSearchStore = create((set, get) => ({
  clients: [],
  loading: false,
  error: null,

  searchClients: async (search = '') => { // Default to empty string
    const token = useAuthStore.getState().token;
    set({ loading: true, error: null });
    
    try {
      // If search is empty, it sends ?search= which returns the first 100 results
      const response = await api.get(`/clients/fetch-clients?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ 
        clients: response.data.data || [], 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || error.message, 
        loading: false 
      });
    }
  },

  clearClients: () => set({ clients: [] })
}));

export default useClientSearchStore;