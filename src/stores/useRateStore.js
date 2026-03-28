import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as XLSX from 'xlsx';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';
import api from '../services/api';

const useRateStore = create(
  persist(
    (set, get) => ({
      // ── Data (Transient - Do not persist) ────────────────────────────────
      data: [],
      loading: false,
      error: null,
      total: 0,
      selectedItems: [],
      selectedItemsData: {},

      // ── Single Rate Data (Transient) ─────────────────────────────────────
      singleRate: null,
      fetchingSingle: false,
      singleRateError: null,

      // ── Pagination & Sort (Persistent - Do persist) ──────────────────────
      currentPage: 1,
      itemsPerPage: 10,
      searchQuery: '',
      sortBy: 'created_at',
      sortOrder: 'DESC',

      /* ═════════════════════════════════════════════════════════════════════
         fetchData
      ═════════════════════════════════════════════════════════════════════ */
      fetchData: async () => {
        const { currentPage, itemsPerPage, sortBy, sortOrder, searchQuery } = get();
        const token = useAuthStore.getState().token;

        set({ loading: true, error: null });

        try {
          const params = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage,
            sortBy,
            sortOrder,
          });

          if (searchQuery) params.append('search', searchQuery);

          const response = await api.get(`/rate/filtered-request?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            data: response.data.data,
            total: response.data.meta.total,
            currentPage: response.data.meta.page,
            itemsPerPage: response.data.meta.limit,
            sortBy: response.data.meta.sortBy || 'created_at',
            sortOrder: response.data.meta.sortOrder || 'DESC',
            loading: false,
          });
        } catch (error) {
          set({
            error: error.response?.data?.message || error.message,
            loading: false,
          });
          useToastStore.getState().showToast('Failed to fetch rates', 'error');
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Fetch Single Rate
      ═════════════════════════════════════════════════════════════════════ */
      fetchSingleRate: async (id) => {
        const token = useAuthStore.getState().token;
        
        set({ fetchingSingle: true, singleRateError: null, singleRate: null });

        try {
          const response = await api.get(`/rate/fetch-single-rate?id=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            singleRate: response.data.data,
            fetchingSingle: false,
          });

          return response.data.data;
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({
            singleRateError: message,
            fetchingSingle: false,
          });
          useToastStore.getState().showToast(`Failed to fetch rate: ${message}`, 'error');
          return null;
        }
      },

      clearSingleRate: () => set({ singleRate: null, singleRateError: null, fetchingSingle: false }),

      /* ═════════════════════════════════════════════════════════════════════
         Create Rate
      ═════════════════════════════════════════════════════════════════════ */
      createRate: async (rateData) => {
        const token = useAuthStore.getState().token;

        try {
          await api.post(
            '/rate/create-rate',
            {
              ngn_cur: rateData.ngn_cur,
              ngn_rate: rateData.ngn_rate,
              usd_cur: rateData.usd_cur,
              usd_rate: rateData.usd_rate,
              gbp_cur: rateData.gbp_cur,
              gbp_rate: rateData.gbp_rate,
              eur_cur: rateData.eur_cur,
              eur_rate: rateData.eur_rate,
              created_at: rateData.created_at,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          useToastStore.getState().showToast('Rate created successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to create rate';
          useToastStore.getState().showToast(message, 'error');
          return false;
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Edit Rate
      ═════════════════════════════════════════════════════════════════════ */
      editRate: async (rateData) => {
        const token = useAuthStore.getState().token;

        try {
          await api.put(
            '/rate/edit-rate',
            {
              id: rateData.id,
              ngn_cur: rateData.ngn_cur,
              ngn_rate: rateData.ngn_rate,
              usd_cur: rateData.usd_cur,
              usd_rate: rateData.usd_rate,
              gbp_cur: rateData.gbp_cur,
              gbp_rate: rateData.gbp_rate,
              eur_cur: rateData.eur_cur,
              eur_rate: rateData.eur_rate,
              created_at: rateData.created_at,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          useToastStore.getState().showToast('Rate updated successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to update rate';
          useToastStore.getState().showToast(message, 'error');
          return false;
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Bulk Delete
      ═════════════════════════════════════════════════════════════════════ */
      deleteSelectedItems: async () => {
        const { selectedItems } = get();
        const token = useAuthStore.getState().token;

        try {
          await api.delete('/rate/delete-rate', {
            headers: { Authorization: `Bearer ${token}` },
            data: { rateIds: selectedItems },
          });

          await get().fetchData();
          set({ selectedItems: [], selectedItemsData: {} });
          useToastStore.getState().showToast('Rates deleted successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({ error: message });
          useToastStore.getState().showToast(`Failed to delete: ${message}`, 'error');
          return false;
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Pagination Helpers
      ═════════════════════════════════════════════════════════════════════ */
      getCurrentPageData: () => get().data,

      getTotalPages: () => {
        const { itemsPerPage, total } = get();
        return Math.ceil(total / itemsPerPage);
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query, currentPage: 1 });
      },

      setSorting: (newSortBy, newSortOrder) => {
        set({ sortBy: newSortBy, sortOrder: newSortOrder, currentPage: 1 });
      },

      setCurrentPage: (page) => {
        set({ currentPage: page });
        get().fetchData();
      },

      setItemsPerPage: (items) => {
        set({ itemsPerPage: items, currentPage: 1 });
        get().fetchData();
      },

      /* ═════════════════════════════════════════════════════════════════════
         Selection
      ═════════════════════════════════════════════════════════════════════ */
      toggleItemSelection: (id) => {
        const { selectedItems, selectedItemsData, data } = get();
        const isSelected = selectedItems.includes(id);

        const updated = isSelected
          ? selectedItems.filter((item) => item !== id)
          : [...selectedItems, id];

        const updatedData = { ...selectedItemsData };
        if (isSelected) {
          delete updatedData[id];
        } else {
          const row = data.find((item) => item.id === id);
          if (row) updatedData[id] = row;
        }

        set({ selectedItems: updated, selectedItemsData: updatedData });
      },

      clearSelection: () => set({ selectedItems: [], selectedItemsData: {} }),

      getSelectedItemsData: () => Object.values(get().selectedItemsData),

      /* ═════════════════════════════════════════════════════════════════════
         Export to Excel
      ═════════════════════════════════════════════════════════════════════ */
      exportToExcel: () => {
        try {
          const data = get().data;
          const exportData = data.map((rate) => ({
            'Date': formatDate(rate.created_at),
            'NGN Rate': formatRate(rate.ngn_rate),
            'USD Rate': formatRate(rate.usd_rate),
            'GBP Rate': formatRate(rate.gbp_rate),
            'EUR Rate': formatRate(rate.eur_rate),
            'Created By': rate.created_by,
            'Updated At': formatDateTime(rate.updated_at),
            'Updated By': rate.updated_by,
          }));

          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(exportData, { skipHeader: false });
          XLSX.utils.book_append_sheet(wb, ws, 'Rates');

          const fileName = `rates_export_${new Date().toISOString().split('T')[0]}.xlsx`;
          XLSX.writeFile(wb, fileName);
          useToastStore.getState().showToast('Data exported successfully', 'success');
        } catch (error) {
          useToastStore.getState().showToast('Failed to export data', 'error');
          console.error(error);
        }

        /* ── Helpers (scoped inside exportToExcel) ── */
        function formatRate(value) {
          return Number(value || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        }

        function formatDate(dateStr) {
          if (!dateStr) return '';
          return new Date(dateStr).toLocaleDateString('en-GB');
        }

        function formatDateTime(dateStr) {
          if (!dateStr) return '';
          const d = new Date(dateStr);
          return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}`;
        }
      },
    }),

    // ── Persist Configuration ──────────────────────────────────────────────
    {
      name: 'rate-storage',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        itemsPerPage: state.itemsPerPage,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);

export default useRateStore;