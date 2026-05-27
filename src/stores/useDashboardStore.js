import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import useToastStore from './useToastStore';
import api from '../services/api';

const dateToISO = (date) => {
  const value = date instanceof Date ? date : new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
};

let inFlightKey = null;
let inFlightRequest = null;

const defaultFilters = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return {
    dateFrom: dateToISO(start),
    dateTo: dateToISO(now),
    basis: 'NGN_EQUIVALENT',
  };
};

const useDashboardStore = create(
  persist(
    (set, get) => ({
      data: null,
      loading: false,
      error: null,
      filters: defaultFilters(),

      fetchDashboardData: async (overrideFilters = null) => {
        const filters = { ...get().filters, ...(overrideFilters || {}) };
        set({ loading: true, error: null, filters });

        const requestKey = `${filters.dateFrom}|${filters.dateTo}|${filters.basis}`;

        try {
          if (!inFlightRequest || inFlightKey !== requestKey) {
            inFlightKey = requestKey;
            inFlightRequest = api.get('/reports/dashboard-analytics', {
              params: {
                date_from: filters.dateFrom,
                date_to: filters.dateTo,
                basis: filters.basis,
              },
            }).finally(() => {
              if (inFlightKey === requestKey) {
                inFlightKey = null;
                inFlightRequest = null;
              }
            });
          }

          const response = await inFlightRequest;
          set({ data: response.data, loading: false, error: null });
          return true;
        } catch (error) {
          const message = error.response?.data?.message || 'Unable to load dashboard analytics.';
          set({ error: message, loading: false });
          useToastStore.getState().showToast(message, 'error');
          return false;
        }
      },

      applyFilters: async (nextFilters) => get().fetchDashboardData(nextFilters),
      resetFilters: async () => get().fetchDashboardData(defaultFilters()),
    }),
    {
      name: 'smartbooks-dashboard-filters',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ filters: state.filters }),
    }
  )
);

export default useDashboardStore;
