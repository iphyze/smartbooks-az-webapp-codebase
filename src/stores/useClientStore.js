import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as XLSX from 'xlsx';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';
import api from '../services/api';

const useClientStore = create(
  persist(
    (set, get) => ({
      // ── Data (Transient - Do not persist) ────────────────────────────────
      data: [],
      loading: false,
      error: null,
      total: 0,
      selectedItems: [],
      selectedItemsData: {},

      // ── Single Client Data (Transient) ───────────────────────────────────
      singleClient: null,
      singleClientInvoices: [],
      singleClientSummary: null,
      fetchingSingle: false,
      singleClientError: null,

      // ── Next Client ID (Transient) ───────────────────────────────────────
      nextClientId: null,
      fetchingNextId: false,
      nextIdError: null,

      // ── Pagination & Sort (Persistent - Do persist) ──────────────────────
      currentPage: 1,
      itemsPerPage: 10,
      searchQuery: '',
      sortBy: 'clients_name',
      sortOrder: 'ASC',

      /* ═════════════════════════════════════════════════════════════════════
         Fetch Next Client ID
      ═════════════════════════════════════════════════════════════════════ */
      fetchNextClientId: async () => {
        const token = useAuthStore.getState().token;
        set({ fetchingNextId: true, nextIdError: null });

        try {
          const response = await api.get('/clients/fetch-last-client-id', {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            nextClientId: response.data.clients_id + 1,
            fetchingNextId: false,
          });
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({
            nextIdError: message,
            fetchingNextId: false,
          });
          useToastStore.getState().showToast(`Failed to fetch next client ID: ${message}`, 'error');
        }
      },

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

          const response = await api.get(`/clients/filtered-request?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            data: response.data.data,
            total: response.data.meta.total,
            currentPage: response.data.meta.page,
            itemsPerPage: response.data.meta.limit,
            sortBy: response.data.meta.sortBy || 'clients_name',
            sortOrder: response.data.meta.sortOrder || 'ASC',
            loading: false,
          });
        } catch (error) {
          set({
            error: error.response?.data?.message || error.message,
            loading: false,
          });
          useToastStore.getState().showToast('Failed to fetch clients', 'error');
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Fetch Single Client
      ═════════════════════════════════════════════════════════════════════ */
      fetchSingleClient: async (clientId) => {
        const token = useAuthStore.getState().token;
        
        set({ fetchingSingle: true, singleClientError: null, singleClient: null, singleClientInvoices: [], singleClientSummary: null });

        try {
          const response = await api.get(`/clients/fetch-single-client?clientId=${clientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            singleClient: response.data.data.client,
            singleClientInvoices: response.data.data.invoices || [],
            singleClientSummary: response.data.data.summary || null,
            fetchingSingle: false,
          });

          return response.data.data;
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({
            singleClientError: message,
            fetchingSingle: false,
          });
          useToastStore.getState().showToast(`Failed to fetch client: ${message}`, 'error');
          return null;
        }
      },

      clearSingleClient: () => set({ 
        singleClient: null, 
        singleClientInvoices: [], 
        singleClientSummary: null, 
        singleClientError: null, 
        fetchingSingle: false 
      }),

      /* ═════════════════════════════════════════════════════════════════════
         Create Client
      ═════════════════════════════════════════════════════════════════════ */
      createClient: async (clientData) => {
        const token = useAuthStore.getState().token;

        try {
          await api.post(
            '/clients/create-clients',
            {
              clients_id: clientData.clients_id,
              clients_name: clientData.clients_name,
              clients_email: clientData.clients_email,
              clients_number: clientData.clients_number,
              clients_address: clientData.clients_address,
              create_ledger: clientData.create_ledger || 'Yes',
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          useToastStore.getState().showToast('Client created successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to create client';
          useToastStore.getState().showToast(message, 'error');
          return false;
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Edit Client
      ═════════════════════════════════════════════════════════════════════ */
      editClient: async (clientData) => {
        const token = useAuthStore.getState().token;

        try {
          await api.put(
            '/clients/edit-clients',
            {
              clients_id: clientData.clients_id,
              clients_name: clientData.clients_name,
              clients_email: clientData.clients_email,
              clients_number: clientData.clients_number,
              clients_address: clientData.clients_address,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          useToastStore.getState().showToast('Client updated successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to update client';
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
          await api.delete('/clients/delete-clients', {
            headers: { Authorization: `Bearer ${token}` },
            data: { clientIds: selectedItems },
          });

          await get().fetchData();
          set({ selectedItems: [], selectedItemsData: {} });
          useToastStore.getState().showToast('Clients deleted successfully', 'success');
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
          const exportData = data.map((client) => ({
            'Client ID': client.clients_id,
            'Client Name': client.clients_name,
            'Email': client.clients_email,
            'Phone Number': client.clients_number,
            'Address': client.clients_address,
            'Created At': formatDateTime(client.created_at),
            'Created By': client.created_by,
            'Updated At': formatDateTime(client.updated_at),
            'Updated By': client.updated_by,
          }));

          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(exportData, { skipHeader: false });
          XLSX.utils.book_append_sheet(wb, ws, 'Clients');

          const fileName = `clients_export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      name: 'client-storage',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        itemsPerPage: state.itemsPerPage,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);

export default useClientStore;