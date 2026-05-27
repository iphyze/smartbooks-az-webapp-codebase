import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';
import api from '../services/api';

const useUsersStore = create(
  persist(
    (set, get) => ({
      // ── Data ──────────────────────────────────────────────────────────
      data: [],
      loading: false,
      error: null,
      total: 0,
      selectedItems: [],

      // ── Single User State ─────────────────────────────────────────────
      singleUser: null,
      fetchingSingle: false,
      singleUserError: null,

      // ── Pagination & Sort (Persistent) ────────────────────────────────
      currentPage: 1,
      itemsPerPage: 10,
      searchQuery: '',
      sortBy: 'created_at',
      sortOrder: 'DESC',

      /* ═══════════════════════════════════════════════════════════════
         fetchData  —  paginated list for UsersOverview
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

          const response = await api.get(`/users/getFilteredRequest?${params}`);

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
          useToastStore.getState().showToast('Failed to fetch user records', 'error');
        }
      },

      /* ═══════════════════════════════════════════════════════════════
         fetchSingleUser
      ═══════════════════════════════════════════════════════════════ */
      fetchSingleUser: async (userId) => {
        set({ fetchingSingle: true, singleUserError: null, singleUser: null });

        try {
          const response = await api.get(
            `/users/getSingleUser?id=${userId}`
          );
          set({ singleUser: response.data.data ?? null, fetchingSingle: false });
        } catch (error) {
          const message = error.response?.data?.message || `Failed to fetch user #${userId}`;
          useToastStore.getState().showToast(message, 'error');
          set({ singleUserError: message, fetchingSingle: false, singleUser: null });
        }
      },

      clearSingleUser: () => set({ singleUser: null, singleUserError: null }),

      /* ═══════════════════════════════════════════════════════════════
         createUser
      ═══════════════════════════════════════════════════════════════ */
      createUser: async (payload) => {
        try {
          const response = await api.post('/users/createUsers', payload);
          useToastStore.getState().showToast('User created successfully', 'success');
          return { success: true, data: response.data.data };
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to create user';
          useToastStore.getState().showToast(message, 'error');
          return { success: false, message };
        }
      },

      /* ═══════════════════════════════════════════════════════════════
         updateUser  (Admin: edit any user)
      ═══════════════════════════════════════════════════════════════ */
      updateUser: async (payload) => {
        try {
          const response = await api.put('/users/editUsers', payload);
          useToastStore.getState().showToast('User updated successfully', 'success');
          return { success: true, data: response.data.data };
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to update user';
          useToastStore.getState().showToast(message, 'error');
          return { success: false, message };
        }
      },

      /* ═══════════════════════════════════════════════════════════════
         updateProfile  (Any user: update own profile)
      ═══════════════════════════════════════════════════════════════ */
      updateProfile: async (payload) => {
        try {
          const response = await api.put('/users/updateProfile', payload);
          if (response.data.requiresLogin) {
            useAuthStore.getState().clearSession();
            useToastStore.getState().showToast(response.data.message, 'info');
          } else {
            const { user } = useAuthStore.getState();
            useAuthStore.setState({
              user: { ...user, ...response.data.data },
            });
            useToastStore.getState().showToast('Profile updated successfully', 'success');
          }
          return { success: true, data: response.data.data };
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to update profile';
          useToastStore.getState().showToast(message, 'error');
          return { success: false, message };
        }
      },

      /* ═══════════════════════════════════════════════════════════════
         deleteSelectedItems
      ═══════════════════════════════════════════════════════════════ */
      deleteSelectedItems: async () => {
        const { selectedItems } = get();

        try {
          await api.delete('/users/deleteUsers', {
            data: { userIds: selectedItems },
          });
          await get().fetchData();
          set({ selectedItems: [] });
          useToastStore.getState().showToast('User record(s) deleted successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({ error: message });
          useToastStore.getState().showToast(`Failed to delete: ${message}`, 'error');
          return false;
        }
      },

      /* ═══════════════════════════════════════════════════════════════
         Pagination helpers
      ═══════════════════════════════════════════════════════════════ */
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
        const { selectedItems } = get();
        const isSelected = selectedItems.includes(id);
        set({ selectedItems: isSelected ? selectedItems.filter(i => i !== id) : [...selectedItems, id] });
      },

      clearSelection: () => set({ selectedItems: [] }),
    }),

    {
      name: 'users-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        itemsPerPage: state.itemsPerPage,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);

export default useUsersStore;
