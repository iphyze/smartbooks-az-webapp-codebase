import { create } from 'zustand';
import api from '../services/api';

const useTimesheetReferenceStore = create((set) => ({
  staff: [],
  clients: [],
  projects: [],
  loading: false,

  searchStaff: async (search = '') => {
    const response = await api.get('/timesheet/reference-data', { params: { type: 'staff', search } });
    set({ staff: response.data.data || [] });
  },

  searchClients: async (search = '') => {
    const response = await api.get('/timesheet/reference-data', { params: { type: 'clients', search } });
    set({ clients: response.data.data || [] });
  },

  searchProjects: async (search = '') => {
    const response = await api.get('/timesheet/reference-data', { params: { type: 'projects', search } });
    set({ projects: response.data.data || [] });
  },
}));

export default useTimesheetReferenceStore;
