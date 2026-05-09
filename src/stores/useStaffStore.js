import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';
import api from '../services/api';

const useStaffStore = create(
  persist(
    (set, get) => ({
      // ── Data (Transient) ──────────────────────────────────────────────
      data: [],
      loading: false,
      error: null,
      total: 0,
      selectedItems: [],
      selectedItemsData: {},

      // ── Single Staff State (for Edit/View) ────────────────────────────
      singleStaff: null,
      fetchingSingle: false,
      singleStaffError: null,

      // ── Next Staff Code (Transient) ────────────────────────────────────
      nextStaffId: null,
      fetchingStaffId: false,
      nextCodeError: null,

      // ── Pagination & Sort (Persistent) ───────────────────────────────
      currentPage: 1,
      itemsPerPage: 10,
      searchQuery: '',
      sortBy: 'created_at',
      sortOrder: 'DESC',

      /* ═════════════════════════════════════════════════════════════════════
            Fetch Next Staff ID
        ═════════════════════════════════════════════════════════════════════ */
      fetchNextStaffId: async () => {
        const token = useAuthStore.getState().token;
        set({ fetchingStaffId: true, nextCodeError: null });

        try {
          const response = await api.get('/staff/fetch-last-staff-id', {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            nextStaffId: response.data.staff_id + 1,
            fetchingStaffId: false,
          });
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({
            nextCodeError: message,
            fetchingStaffId: false,
          });
          useToastStore.getState().showToast(`Failed to fetch next staff id: ${message}`, 'error');
        }
      },

      /* ═══════════════════════════════════════════════════════════════
         fetchData  —  paginated list for StaffOverview table
      ═══════════════════════════════════════════════════════════════ */
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

          const response = await api.get(`/staff/filtered-request?${params}`, {
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
          set({ error: error.response?.data?.message || error.message, loading: false });
          useToastStore.getState().showToast('Failed to fetch staff records', 'error');
        }
      },

      /* ═══════════════════════════════════════════════════════════════
         fetchSingleStaff  —  for Edit / View pages (UPDATED)
      ═══════════════════════════════════════════════════════════════ */
      fetchSingleStaff: async (staffId) => {
        const token = useAuthStore.getState().token;
        
        // Set loading state
        set({ fetchingSingle: true, singleStaffError: null, singleStaff: null });

        try {
          const response = await api.get(
            `/staff/fetch-single-staff?staff_id=${staffId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          // Populate state on success
          set({
            singleStaff: response.data.data ?? null,
            fetchingSingle: false,
          });
        } catch (error) {
          const message = error.response?.data?.message || `Failed to fetch staff #${staffId}`;
          useToastStore.getState().showToast(message, 'error');
          
          // Set error state
          set({
            singleStaffError: message,
            fetchingSingle: false,
            singleStaff: null
          });
        }
      },

      // Helper to clear single staff state when leaving edit page
      clearSingleStaff: () => set({ singleStaff: null, singleStaffError: null }),

      /* ═══════════════════════════════════════════════════════════════
         fetchStaffDropdown  —  lightweight list for form selects
      ═══════════════════════════════════════════════════════════════ */
      fetchStaffDropdown: async (search = '') => {
        const token = useAuthStore.getState().token;
        try {
          const params = new URLSearchParams();
          if (search) params.append('search', search);

          const response = await api.get(`/staff/fetch-staff-dropdown?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          return response.data.data ?? [];
        } catch (error) {
          useToastStore.getState().showToast('Failed to load staff list', 'error');
          return [];
        }
      },

      /* ═══════════════════════════════════════════════════════════════
         createStaff
      ═══════════════════════════════════════════════════════════════ */
      createStaff: async (payload) => {
        const token = useAuthStore.getState().token;
        try {
          const response = await api.post('/staff/create-staff', payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          useToastStore.getState().showToast('Staff created successfully', 'success');
          return { success: true, data: response.data.data };
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to create staff';
          useToastStore.getState().showToast(message, 'error');
          return { success: false, message };
        }
      },

      /* ═══════════════════════════════════════════════════════════════
         updateStaff
      ═══════════════════════════════════════════════════════════════ */
      updateStaff: async (payload) => {
        const token = useAuthStore.getState().token;
        try {
          const response = await api.put('/staff/edit-staff', payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          useToastStore.getState().showToast('Staff updated successfully', 'success');
          return { success: true, data: response.data.data };
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to update staff';
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
          const row = data.find((item) => item.staff_id === id);
          if (row) updatedData[id] = row;
        }

        set({ selectedItems: updated, selectedItemsData: updatedData });
      },

      clearSelection: () => set({ selectedItems: [], selectedItemsData: {} }),

      deleteSelectedItems: async () => {
        const { selectedItems } = get();
        const token = useAuthStore.getState().token;

        try {
          await api.delete('/staff/delete-staff', {
            headers: { Authorization: `Bearer ${token}` },
            data: { staffIds: selectedItems },
          });

          await get().fetchData();
          set({ selectedItems: [] });
          useToastStore.getState().showToast('Staff record(s) deleted successfully', 'success');
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
      name: 'staff-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        itemsPerPage: state.itemsPerPage,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);

export default useStaffStore;