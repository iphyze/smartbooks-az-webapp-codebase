import { create } from 'zustand';
import api from '../services/api';
import useAuthStore from './useAuthStore';

const useStaffSearchStore = create((set, get) => ({
  staff: [],
  loading: false,
  error: null,

  searchStaff: async (search = '') => { // Default to empty string
    const token = useAuthStore.getState().token;
    set({ loading: true, error: null });
    
    try {
      // If search is empty, it sends ?search= which returns the first 100 results
      const response = await api.get(`/staff/fetch-staff?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ 
        staff: response.data.data || [], 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || error.message, 
        loading: false 
      });
    }
  },

  clearStaff: () => set({ staff: [] })
}));

export default useStaffSearchStore;