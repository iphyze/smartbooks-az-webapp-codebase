import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';
import api from '../services/api';

const useDashboardStore = create(
  persist(
    (set, get) => ({
      // ── Data (Transient) ────────────────────────────────
      data: null, // Stores the entire API response
      loading: false,
      error: null,

      // ── Filters (Persistent) ─────────────────────────────
      // We can persist filters if needed, usually date ranges
      dateFrom: '',
      dateTo: '',

      /* ═════════════════════════════════════════════════════════════════════
         Fetch Data
      ═════════════════════════════════════════════════════════════════════ */
      fetchDashboardData: async () => {
        const token = useAuthStore.getState().token;
        set({ loading: true, error: null });

        try {
          // You can append date filters here if needed
          // const { dateFrom, dateTo } = get();
          const params = new URLSearchParams();
          // if(dateFrom) params.append('date_from', dateFrom);

          const response = await api.get(`/reports?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            data: response.data,
            loading: false,
          });

        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({
            error: message,
            loading: false,
          });
          useToastStore.getState().showToast('Failed to fetch dashboard data', 'error');
        }
      },

      // Helper to set dates
      setDateFilter: (from, to) => {
        set({ dateFrom: from, dateTo: to });
        get().fetchDashboardData();
      },
    }),
    
    // ── Persist Configuration ──────────────────────────────────────────────
    {
      name: 'dashboard-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist filters, not the heavy data
      partialize: (state) => ({
        dateFrom: state.dateFrom,
        dateTo: state.dateTo,
      }),
    }
  )
);

export default useDashboardStore;