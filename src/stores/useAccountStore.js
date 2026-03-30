import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as XLSX from 'xlsx';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';
import api from '../services/api';

const useAccountStore = create(
  persist(
    (set, get) => ({
      // ── Data (Transient - Do not persist) ────────────────────────────────
      data: [],
      loading: false,
      error: null,
      total: 0,
      selectedItems: [],
      selectedItemsData: {},

      // ── Single Account Data (Transient) ──────────────────────────────────
      singleAccount: null,
      singleAccountLedgers: [],
      singleAccountSummary: null,
      fetchingSingle: false,
      singleAccountError: null,

      // ── Pagination & Sort (Persistent - Do persist) ──────────────────────
      currentPage: 1,
      itemsPerPage: 10,
      searchQuery: '',
      sortBy: 'type',
      sortOrder: 'ASC',

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

          const response = await api.get(`/accounting-type/filtered-request?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            data: response.data.data,
            total: response.data.meta.total,
            currentPage: response.data.meta.page,
            itemsPerPage: response.data.meta.limit,
            sortBy: response.data.meta.sortBy || 'type',
            sortOrder: response.data.meta.sortOrder || 'ASC',
            loading: false,
          });
        } catch (error) {
          set({
            error: error.response?.data?.message || error.message,
            loading: false,
          });
          useToastStore.getState().showToast('Failed to fetch account types', 'error');
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Fetch Single Account
      ═════════════════════════════════════════════════════════════════════ */
      fetchSingleAccount: async (accountId) => {
        const token = useAuthStore.getState().token;
        
        set({ fetchingSingle: true, singleAccountError: null, singleAccount: null, singleAccountLedgers: [], singleAccountSummary: null });

        try {
          const response = await api.get(`/accounting-type/fetch-single-account?accountId=${accountId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            singleAccount: response.data.data.account,
            singleAccountLedgers: response.data.data.ledgers || [],
            singleAccountSummary: response.data.data.account_summary || null,
            fetchingSingle: false,
          });

          return response.data.data;
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({
            singleAccountError: message,
            fetchingSingle: false,
          });
          useToastStore.getState().showToast(`Failed to fetch account: ${message}`, 'error');
          return null;
        }
      },

      clearSingleAccount: () => set({ 
        singleAccount: null, 
        singleAccountLedgers: [], 
        singleAccountSummary: null, 
        singleAccountError: null, 
        fetchingSingle: false 
      }),

      /* ═════════════════════════════════════════════════════════════════════
         Create Account Type
      ═════════════════════════════════════════════════════════════════════ */
      createAccountType: async (accountData) => {
        const token = useAuthStore.getState().token;

        try {
          await api.post(
            '/accounting-type/create-account-type',
            {
              type: accountData.type,
              category_id: accountData.category_id,
              category: accountData.category,
              sub_category: accountData.sub_category,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          useToastStore.getState().showToast('Account type created successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to create account type';
          useToastStore.getState().showToast(message, 'error');
          return false;
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Edit Account Type
      ═════════════════════════════════════════════════════════════════════ */
      editAccountType: async (accountData) => {
        const token = useAuthStore.getState().token;

        try {
          await api.put(
            '/accounting-type/edit-account-type',
            {
              id: accountData.id,
              type: accountData.type,
              category_id: accountData.category_id,
              category: accountData.category,
              sub_category: accountData.sub_category,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          useToastStore.getState().showToast('Account type updated successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to update account type';
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
          await api.delete('/accounting-type/delete-account-type', {
            headers: { Authorization: `Bearer ${token}` },
            data: { accountTypeIds: selectedItems },
          });

          await get().fetchData();
          set({ selectedItems: [], selectedItemsData: {} });
          useToastStore.getState().showToast('Account types deleted successfully', 'success');
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
          const exportData = data.map((account) => ({
            'Type': account.type,
            'Category ID': account.category_id,
            'Category': account.category,
            'Sub Category': account.sub_category,
            'Created At': formatDateTime(account.created_at),
            'Created By': account.created_by,
            'Updated At': formatDateTime(account.updated_at),
            'Updated By': account.updated_by,
          }));

          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(exportData, { skipHeader: false });
          XLSX.utils.book_append_sheet(wb, ws, 'Account Types');

          const fileName = `account_types_export_${new Date().toISOString().split('T')[0]}.xlsx`;
          XLSX.writeFile(wb, fileName);
          useToastStore.getState().showToast('Data exported successfully', 'success');
        } catch (error) {
          useToastStore.getState().showToast('Failed to export data', 'error');
          console.error(error);
        }

        /* ── Helpers (scoped inside exportToExcel) ── */
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
      name: 'account-type-storage',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        itemsPerPage: state.itemsPerPage,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);

export default useAccountStore;