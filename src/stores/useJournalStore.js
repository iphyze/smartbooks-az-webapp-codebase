import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // Import middleware
import * as XLSX from 'xlsx';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';
import api from '../services/api';

const useJournalStore = create(
  persist(
    (set, get) => ({
      // ── Data (Transient - Do not persist) ────────────────────────────────
      data: [],
      loading: false,
      error: null,
      total: 0,
      selectedItems: [],
      selectedItemsData: {},

      // ── Pagination & Sort (Persistent - Do persist) ──────────────────────
      // Remove manual localStorage.getItem here. 
      // The middleware will restore these values automatically.
      currentPage: 1,
      itemsPerPage: 10, 
      searchQuery: '',
      sortBy: 'journal_date',
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

          const response = await api.get(`/journal/filtered-request?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            data: response.data.data,
            total: response.data.meta.total,
            // We usually trust local state for limit/sort, but if backend forces changes:
            currentPage: response.data.meta.page,
            itemsPerPage: response.data.meta.limit,
            sortBy: response.data.meta.sortBy || 'journal_date',
            sortOrder: response.data.meta.sortOrder || 'DESC',
            loading: false,
          });
          
          // No need for manual localStorage.setItem here anymore!

        } catch (error) {
          set({
            error: error.response?.data?.message || error.message,
            loading: false,
          });
          useToastStore.getState().showToast('Failed to fetch journals', 'error');
        }
      },

      fetchSingleJournal: async (journalId) => {
        const token = useAuthStore.getState().token;
        try {
          const response = await api.get(
            `/journal/fetch-single-journal?journal_id=${journalId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          return response.data.data ?? null;
        } catch (error) {
          const message =
            error.response?.data?.message || `Failed to fetch journal #${journalId}`;
          useToastStore.getState().showToast(message, 'error');
          return null;
        }
      },

      deleteSingleLine: async (lineItemId) => {
        const token = useAuthStore.getState().token;
        try {
          await api.delete('/journal/delete-single-journal', {
            headers: { Authorization: `Bearer ${token}` },
            data: { line_item_id: lineItemId },
          });
          useToastStore.getState().showToast('Line item deleted successfully', 'success');
          return true;
        } catch (error) {
          const message =
            error.response?.data?.message || 'Failed to delete line item';
          useToastStore.getState().showToast(message, 'error');
          return false;
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Pagination helpers
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
          const row = data.find((item) => item.journal_id === id);
          if (row) updatedData[id] = row;
        }

        set({ selectedItems: updated, selectedItemsData: updatedData });
      },

      clearSelection: () => set({ selectedItems: [], selectedItemsData: {} }),

      deleteSelectedItems: async () => {
        const { selectedItems } = get();
        const token = useAuthStore.getState().token;

        try {
          await api.delete('/journal/delete-journal', {
            headers: { Authorization: `Bearer ${token}` },
            data: { journalIds: selectedItems },
          });

          await get().fetchData();
          set({ selectedItems: [] });
          useToastStore.getState().showToast('Journals deleted successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({ error: message });
          useToastStore.getState().showToast(`Failed to delete: ${message}`, 'error');
          return false;
        }
      },

      getSelectedItemsData: () => Object.values(get().selectedItemsData),

      exportToExcel: () => {
      try {
        const data = get().data;
        const exportData = [];

        data.forEach((journal) => {
          if (journal.items && journal.items.length > 0) {
            journal.items.forEach((item, index) => {
              exportData.push({
                'Journal ID': index === 0 ? journal.journal_id : '',
                'Date': index === 0 ? formatDate(journal.journal_date) : '',
                'Type': index === 0 ? journal.journal_type : '',
                'Transaction Type': index === 0 ? journal.transaction_type : '',
                'Currency': index === 0 ? journal.journal_currency : '',
                'Cost Center': item.cost_center || journal.cost_center,
                'Description': item.journal_description,
                'Ledger Name': item.ledger_name,
                'Ledger Number': item.ledger_number,
                'Debit': formatAmount(item.debit),
                'Credit': formatAmount(item.credit),
                'Debit (NGN)': formatAmount(item.debit_ngn),
                'Credit (NGN)': formatAmount(item.credit_ngn),
                'Rate': item.rate,
                'Created At': formatDateTime(journal.created_at),
                'Created By': journal.created_by,
              });
            });
          } else {
            exportData.push({
              'Journal ID': journal.journal_id,
              'Date': formatDate(journal.journal_date),
              'Type': journal.journal_type,
              'Transaction Type': journal.transaction_type,
              'Currency': journal.journal_currency,
              'Cost Center': journal.cost_center,
              'Description': journal.journal_description,
              'Ledger Name': '',
              'Ledger Number': '',
              'Debit': formatAmount(journal.debit),
              'Credit': formatAmount(journal.credit),
              'Debit (NGN)': formatAmount(journal.debit_ngn),
              'Credit (NGN)': formatAmount(journal.credit_ngn),
              'Rate': '',
              'Created At': formatDateTime(journal.created_at),
              'Created By': journal.created_by,
            });
          }
        });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData, { skipHeader: false });
      XLSX.utils.book_append_sheet(wb, ws, 'Journals');

      const fileName = `journals_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      useToastStore.getState().showToast('Data exported successfully', 'success');
    } catch (error) {
      useToastStore.getState().showToast('Failed to export data', 'error');
      console.error(error);
    }

    /* ── Helpers (scoped inside exportToExcel) ── */
    function formatAmount(value) {
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
      }
    }),
    
    // ── Persist Configuration ──────────────────────────────────────────────
    {
      name: 'journal-storage', // Unique name for this store's localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage
      
      // OPTIONAL: Filter what gets saved. 
      // We only want to save user preferences, not the data itself.
      partialize: (state) => ({
        itemsPerPage: state.itemsPerPage,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        // We usually don't persist currentPage or searchQuery so the user starts fresh
        // but you can add them here if you want.
      }),
    }
  )
);

export default useJournalStore;