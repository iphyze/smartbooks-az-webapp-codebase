import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';
import api from '../services/api';

const useDashboardStore = create(
  persist(
    (set, get) => ({
      // ── Data (Transient) ────────────────────────────────
      data: null,
      loading: false,
      error: null,

      // ── Filters (Persistent) ─────────────────────────────
      dateFrom: '',
      dateTo: '',

      /* ═════════════════════════════════════════════════════════════════════
         Fetch Data
      ═════════════════════════════════════════════════════════════════════ */
      fetchDashboardData: async () => {
        const token = useAuthStore.getState().token;
        set({ loading: true, error: null });

        try {
          // ✅ UNCOMMENTED - Get dates from store
          const { dateFrom, dateTo } = get();
          
          const params = new URLSearchParams();
          
          // ✅ UNCOMMENTED - Append date parameters to request
          if (dateFrom) params.append('date_from', dateFrom);
          if (dateTo) params.append('date_to', dateTo);

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
      partialize: (state) => ({
        dateFrom: state.dateFrom,
        dateTo: state.dateTo,
      }),
    }
  )
);

export default useDashboardStore;