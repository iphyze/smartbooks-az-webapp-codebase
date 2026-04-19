import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as XLSX from 'xlsx';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';
import api from '../services/api';

const useLedgerStore = create(
  persist(
    (set, get) => ({
      // ── Data (Transient - Do not persist) ────────────────────────────────
      data: [],
      loading: false,
      error: null,
      total: 0,
      selectedItems: [],
      selectedItemsData: {},

      // ── Single Ledger Data (Transient) ──────────────────────────────────
      singleLedger: null,
      singleLedgerEntries: [],
      singleLedgerSummary: null,
      fetchingSingle: false,
      singleLedgerError: null,

      // ── Pagination & Sort (Persistent - Do persist) ──────────────────────
      currentPage: 1,
      itemsPerPage: 10,
      searchQuery: '',
      sortBy: 'ledger_number',
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

          const response = await api.get(`/ledger/filtered-request?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            data: response.data.data,
            total: response.data.meta.total,
            currentPage: response.data.meta.page,
            itemsPerPage: response.data.meta.limit,
            sortBy: response.data.meta.sortBy || 'ledger_number',
            sortOrder: response.data.meta.sortOrder || 'DESC',
            loading: false,
          });
        } catch (error) {
          set({
            error: error.response?.data?.message || error.message,
            loading: false,
          });
          useToastStore.getState().showToast('Failed to fetch ledgers', 'error');
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Fetch Single Ledger
      ═════════════════════════════════════════════════════════════════════ */
      fetchSingleLedger: async (ledgerNumber) => {
        const token = useAuthStore.getState().token;
        
        set({ 
          fetchingSingle: true, 
          singleLedgerError: null, 
          singleLedger: null, 
          singleLedgerEntries: [], 
          singleLedgerSummary: null 
        });

        try {
          const response = await api.get(`/ledger/fetch-single-ledger?ledger_number=${ledgerNumber}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            singleLedger: response.data.data.ledger,
            singleLedgerEntries: response.data.data.journal_entries || [],
            singleLedgerSummary: response.data.data.summary || null,
            fetchingSingle: false,
          });

          return response.data.data;
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({
            singleLedgerError: message,
            fetchingSingle: false,
          });
          useToastStore.getState().showToast(`Failed to fetch ledger: ${message}`, 'error');
          return null;
        }
      },

      clearSingleLedger: () => set({ 
        singleLedger: null, 
        singleLedgerEntries: [], 
        singleLedgerSummary: null, 
        singleLedgerError: null, 
        fetchingSingle: false 
      }),

      /* ═════════════════════════════════════════════════════════════════════
         Create Ledger
      ═════════════════════════════════════════════════════════════════════ */
      createLedger: async (ledgerData) => {
        const token = useAuthStore.getState().token;

        try {
          await api.post(
            '/ledger/create-ledger',
            {
              ledger_name: ledgerData.ledger_name,
              account_type: ledgerData.account_type,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          useToastStore.getState().showToast('Ledger created successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to create ledger';
          useToastStore.getState().showToast(message, 'error');
          return false;
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Edit Ledger
      ═════════════════════════════════════════════════════════════════════ */
      editLedger: async (ledgerData) => {
        const token = useAuthStore.getState().token;

        try {
          await api.put(
            '/ledger/edit-ledger',
            {
              ledger_number: ledgerData.ledger_number,
              ledger_name: ledgerData.ledger_name,
              account_type: ledgerData.account_type,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          useToastStore.getState().showToast('Ledger updated successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to update ledger';
          useToastStore.getState().showToast(message, 'error');
          return false;
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Single Ledger Operations
      ═════════════════════════════════════════════════════════════════════ */
      
      // Delete a single ledger (calls the specific single-delete endpoint)
      deleteSingleLedger: async (ledgerNumber) => {
        const token = useAuthStore.getState().token;
        try {
          await api.delete('/ledger/delete-single-ledger', {
            headers: { Authorization: `Bearer ${token}` },
            data: { ledger_number: ledgerNumber },
          });
          useToastStore.getState().showToast('Ledger deleted successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to delete ledger';
          useToastStore.getState().showToast(message, 'error');
          return false;
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Bulk Operations
      ═════════════════════════════════════════════════════════════════════ */

      // Delete multiple selected ledgers
      deleteSelectedItems: async () => {
        const { selectedItems, selectedItemsData } = get();
        const token = useAuthStore.getState().token;

        try {
          // Extract the ledger_numbers from the selected items data for the payload
          const ledgerNumbers = selectedItems
            .map(id => selectedItemsData[id]?.ledger_number)
            .filter(Boolean);

          await api.delete('/ledger/delete-ledger', {
            headers: { Authorization: `Bearer ${token}` },
            data: { ledgerNumbers },
          });

          await get().fetchData();
          set({ selectedItems: [], selectedItemsData: {} });
          useToastStore.getState().showToast('Ledgers deleted successfully', 'success');
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
          const exportData = data.map((ledger) => ({
            'Ledger Name': ledger.ledger_name,
            'Ledger Number': ledger.ledger_number,
            'Ledger Class': ledger.ledger_class,
            'Ledger Class Code': ledger.ledger_class_code,
            'Ledger Sub Class': ledger.ledger_sub_class,
            'Ledger Type': ledger.ledger_type,
            'Created At': formatDateTime(ledger.created_at),
            'Created By': ledger.created_by,
            'Updated At': formatDateTime(ledger.updated_at),
            'Updated By': ledger.updated_by,
          }));

          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(exportData, { skipHeader: false });
          XLSX.utils.book_append_sheet(wb, ws, 'Ledgers');

          const fileName = `ledgers_export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      name: 'ledger-storage',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        itemsPerPage: state.itemsPerPage,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);

export default useLedgerStore;