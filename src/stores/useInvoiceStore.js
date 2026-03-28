import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as XLSX from 'xlsx';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';
import api from '../services/api';

const useInvoiceStore = create(
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
      currentPage: 1,
      itemsPerPage: 10, 
      searchQuery: '',
      sortBy: 'invoice_date', // Default sort for invoices
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

          const response = await api.get(`/invoice/filtered-request?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            data: response.data.data,
            total: response.data.meta.total,
            currentPage: response.data.meta.page,
            itemsPerPage: response.data.meta.limit,
            sortBy: response.data.meta.sortBy || 'invoice_date',
            sortOrder: response.data.meta.sortOrder || 'DESC',
            loading: false,
          });

        } catch (error) {
          set({
            error: error.response?.data?.message || error.message,
            loading: false,
          });
          useToastStore.getState().showToast('Failed to fetch invoices', 'error');
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Single Invoice Operations
      ═════════════════════════════════════════════════════════════════════ */
      
      // Delete a single invoice (calls the specific single-delete endpoint)
      deleteSingleInvoice: async (invoiceId) => {
        const token = useAuthStore.getState().token;
        try {
          await api.delete('/invoice/delete-single-invoice', {
            headers: { Authorization: `Bearer ${token}` },
            data: { invoice_id: invoiceId }, // Adjust payload key if backend expects differently
          });
          useToastStore.getState().showToast('Invoice deleted successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to delete invoice';
          useToastStore.getState().showToast(message, 'error');
          return false;
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Bulk Operations
      ═════════════════════════════════════════════════════════════════════ */

      // Delete multiple selected invoices
      deleteSelectedItems: async () => {
        const { selectedItems } = get();
        const token = useAuthStore.getState().token;

        try {
          await api.delete('/invoice/delete-invoice', {
            headers: { Authorization: `Bearer ${token}` },
            data: { invoiceIds: selectedItems },
          });

          await get().fetchData();
          set({ selectedItems: [], selectedItemsData: {} });
          useToastStore.getState().showToast('Invoices deleted successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({ error: message });
          useToastStore.getState().showToast(`Failed to delete: ${message}`, 'error');
          return false;
        }
      },

      // Update status for multiple selected invoices
      updateInvoiceStatus: async (status) => {
        const { selectedItems } = get();
        const token = useAuthStore.getState().token;

        try {
          await api.put('/invoice/update-invoice', 
            { invoiceIds: selectedItems, status }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );

          await get().fetchData();
          set({ selectedItems: [], selectedItemsData: {} });
          useToastStore.getState().showToast(`Invoices marked as ${status}`, 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          useToastStore.getState().showToast(`Failed to update status: ${message}`, 'error');
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
          // Note: Using 'id' for invoices based on sample data
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
          const exportData = [];

          data.forEach((invoice) => {
            if (invoice.items && invoice.items.length > 0) {
              invoice.items.forEach((item, index) => {
                exportData.push({
                  'Invoice #': index === 0 ? invoice.invoice_number : '',
                  'Date': index === 0 ? formatDate(invoice.invoice_date) : '',
                  'Client': index === 0 ? invoice.clients_name : '',
                  'Due Date': index === 0 ? formatDate(invoice.due_date) : '',
                  'Currency': index === 0 ? invoice.currency : '',
                  'Status': index === 0 ? invoice.status : '',
                  'Description': item.description,
                  'Item Amount': formatAmount(item.amount),
                  'VAT': formatAmount(item.vat),
                  'WHT': formatAmount(item.wht),
                  'Total': formatAmount(item.total),
                  'Created At': index === 0 ? formatDateTime(invoice.created_at) : '',
                  'Created By': index === 0 ? invoice.created_by : '',
                });
              });
            } else {
              exportData.push({
                'Invoice #': invoice.invoice_number,
                'Date': formatDate(invoice.invoice_date),
                'Client': invoice.clients_name,
                'Due Date': formatDate(invoice.due_date),
                'Currency': invoice.currency,
                'Status': invoice.status,
                'Description': '',
                'Item Amount': '',
                'VAT': '',
                'WHT': '',
                'Total': formatAmount(invoice.invoice_amount),
                'Created At': formatDateTime(invoice.created_at),
                'Created By': invoice.created_by,
              });
            }
          });

          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(exportData, { skipHeader: false });
          XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

          const fileName = `invoices_export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      },
    }),
    
    // ── Persist Configuration ──────────────────────────────────────────────
    {
      name: 'invoice-storage', // Unique name for Invoice Store
      storage: createJSONStorage(() => localStorage),
      
      partialize: (state) => ({
        itemsPerPage: state.itemsPerPage,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);

export default useInvoiceStore;