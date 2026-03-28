import { create } from 'zustand';
import api from '../services/api';
import useAuthStore from './useAuthStore';

const useProjectSearchStore = create((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  searchProjects: async (search = '') => { // Default to empty string
    const token = useAuthStore.getState().token;
    set({ loading: true, error: null });
    
    try {
      // If search is empty, it sends ?search= which returns the first 100 results
      const response = await api.get(`/projects/fetch-projects?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ 
        projects: response.data.data || [], 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || error.message, 
        loading: false 
      });
    }
  },

  clearProjects: () => set({ projects: [] })
}));

export default useProjectSearchStore;