// In useProjectsStore.js
import { create } from 'zustand';
import { debounce } from 'lodash';
import useAuthStore from '../useAuthStore';
import useToastStore from '../useToastStore';
import api from '../../services/api';

const useProjectsStore = create((set, get) => {
  // Create debounced functions at store initialization
  const debouncedProjectsearch = debounce(async (searchQuery, token) => {
    try {
      const response = await api.get(`/data/fetchProjects?search=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.status === "Success") {
        return response.data.data.map(project => ({
          value: project.code,
          label: `(${project.code}) - ${project.location}`,
          code: project.code,
        }));
      }
      return [];
    } catch (error) {
      useToastStore.getState().showToast(error?.response?.data?.message, 'error');
      return [];
    }
  }, 100);

  return {
    projects: [],
    loading: false,
    error: null,

    fetchProjects: async (searchQuery) => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const token = useAuthStore.getState().token;
      return debouncedProjectsearch(searchQuery, token);
    },

  };
});

export default useProjectsStore;