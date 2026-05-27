import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import useToastStore from './useToastStore';
import api from '../services/api';

const useTimesheetStore = create(
  persist(
    (set, get) => ({
      // ── Data (Transient) ──────────────────────────────────────────────
      data: [],
      loading: false,
      error: null,
      total: 0,
      selectedItems: [],
      selectedItemsData: {},

      // ── Pagination & Sort (Persistent) ───────────────────────────────
      currentPage: 1,
      itemsPerPage: 10,
      searchQuery: '',
      sortBy: 'created_at',
      sortOrder: 'DESC',

      /* ═══════════════════════════════════════════════════════════════
         fetchData  —  paginated list for TimesheetOverview
      ═══════════════════════════════════════════════════════════════ */
      fetchData: async () => {
        const { currentPage, itemsPerPage, sortBy, sortOrder, searchQuery } = get();

        set({ loading: true, error: null });

        try {
          const params = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage,
            sortBy,
            sortOrder,
          });
          if (searchQuery) params.append('search', searchQuery);

          const response = await api.get(`/timesheet/filtered-request?${params}`);

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
          set({ error: error.response?.data?.message || error.message, loading: false });
          useToastStore.getState().showToast('Failed to fetch timesheets', 'error');
        }
      },

      /* ═══════════════════════════════════════════════════════════════
         fetchSingleTimesheet  —  for Edit / View pages
      ═══════════════════════════════════════════════════════════════ */
      fetchSingleTimesheet: async (id) => {
        try {
          const response = await api.get(`/timesheet/fetch-single-timesheet?id=${id}`);
          return response.data.data ?? null;
        } catch (error) {
          const message = error.response?.data?.message || `Failed to fetch timesheet #${id}`;
          useToastStore.getState().showToast(message, 'error');
          return null;
        }
      },

      /* ═══════════════════════════════════════════════════════════════
         createTimesheet  —  batch POST (arrays of entries per date)
      ═══════════════════════════════════════════════════════════════ */
      createTimesheet: async (payload) => {
        try {
          const response = await api.post('/timesheet/create-timesheet', payload);
          useToastStore.getState().showToast('Timesheet entries created successfully', 'success');
          return { success: true, data: response.data.data };
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to create timesheet';
          useToastStore.getState().showToast(message, 'error');
          return { success: false, message };
        }
      },

      /* ═══════════════════════════════════════════════════════════════
         updateTimesheet  —  single row PUT
      ═══════════════════════════════════════════════════════════════ */
      updateTimesheet: async (payload) => {
        try {
          const response = await api.put('/timesheet/edit-timesheet', payload);
          useToastStore.getState().showToast('Timesheet updated successfully', 'success');
          return { success: true, data: response.data.data };
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to update timesheet';
          useToastStore.getState().showToast(message, 'error');
          return { success: false, message };
        }
      },

      /* ═══════════════════════════════════════════════════════════════
         Pagination helpers
      ═══════════════════════════════════════════════════════════════ */
      getCurrentPageData: () => get().data,

      getTotalPages: () => {
        const { itemsPerPage, total } = get();
        return Math.ceil(total / itemsPerPage);
      },

      setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),

      setSorting: (newSortBy, newSortOrder) =>
        set({ sortBy: newSortBy, sortOrder: newSortOrder, currentPage: 1 }),

      setCurrentPage: (page) => {
        set({ currentPage: page });
        get().fetchData();
      },

      setItemsPerPage: (items) => {
        set({ itemsPerPage: items, currentPage: 1 });
        get().fetchData();
      },

      /* ═══════════════════════════════════════════════════════════════
         Selection
      ═══════════════════════════════════════════════════════════════ */
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

      deleteSingleItem: async (id) => {
        try {
          await api.delete('/timesheet/delete-single-timesheet', { data: { id } });
          await get().fetchData();
          set({ selectedItems: [], selectedItemsData: {} });
          useToastStore.getState().showToast('Timesheet entry deleted successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({ error: message });
          useToastStore.getState().showToast(`Failed to delete: ${message}`, 'error');
          return false;
        }
      },

      deleteSelectedItems: async () => {
        const { selectedItems } = get();

        try {
          await api.delete('/timesheet/delete-timesheet', {
            data: { ids: selectedItems },
          });

          await get().fetchData();
          set({ selectedItems: [] });
          useToastStore.getState().showToast('Timesheet entry(s) deleted successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({ error: message });
          useToastStore.getState().showToast(`Failed to delete: ${message}`, 'error');
          return false;
        }
      },

      getSelectedItemsData: () => Object.values(get().selectedItemsData),
    }),

    // ── Persist Configuration ─────────────────────────────────────────
    {
      name: 'timesheet-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        itemsPerPage: state.itemsPerPage,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);

export default useTimesheetStore;