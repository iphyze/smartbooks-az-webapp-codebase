import { create } from 'zustand';
import * as XLSX from 'xlsx';
import useAuthStore from '../useAuthStore';
import useToastStore from '../useToastStore';
import api from '../../services/api';

const useJournalStore = create((set, get) => ({
  // Data states
  data: [],
  loading: false,
  error: null,

  // Meta states
  total: 0,

  // Pagination states
  currentPage: 1,
  itemsPerPage: parseInt(localStorage.getItem('journal_limit')) || 10,

  // Filter and sort states
  searchQuery: '',
  sortBy: localStorage.getItem('journal_sort_by') || 'journal_date',
  sortOrder: localStorage.getItem('journal_sort_order') || 'DESC',

  // Journal-specific filters
  journalType: localStorage.getItem('journal_type_filter') || 'all',       // e.g. Sales, General, Purchase
  transactionType: localStorage.getItem('journal_txn_type_filter') || 'all', // e.g. Bank, Cash
  journalCurrency: localStorage.getItem('journal_currency_filter') || 'all', // e.g. USD, NGN
  dateFrom: localStorage.getItem('journal_date_from') || '',
  dateTo: localStorage.getItem('journal_date_to') || '',

  selectedItems: [],
  selectedItemsData: {},

  // ─── Fetch Data ──────────────────────────────────────────────────────────────
  fetchData: async () => {
    const {
      currentPage, itemsPerPage, searchQuery, sortBy, sortOrder,
      journalType, transactionType, journalCurrency, dateFrom, dateTo
    } = get();
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
      if (journalType && journalType !== 'all') params.append('journal_type', journalType);
      if (transactionType && transactionType !== 'all') params.append('transaction_type', transactionType);
      if (journalCurrency && journalCurrency !== 'all') params.append('journal_currency', journalCurrency);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await api.get(`/journal/filtered-request?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const meta = response.data.meta || {};

      set({
        data: response.data.data || [],
        total: meta.total || 0,
        currentPage: meta.page || 1,
        itemsPerPage: meta.limit || itemsPerPage,
        searchQuery: meta.search || searchQuery,
        sortBy: meta.sortBy || sortBy,
        sortOrder: meta.sortOrder || sortOrder,
        loading: false,
      });

      // Persist filter preferences
      localStorage.setItem('journal_limit', meta.limit || itemsPerPage);
      localStorage.setItem('journal_sort_by', meta.sortBy || sortBy);
      localStorage.setItem('journal_sort_order', meta.sortOrder || sortOrder);
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
      useToastStore.getState().showToast('Failed to fetch journals', 'error');
    }
  },

  // ─── Selectors ───────────────────────────────────────────────────────────────
  getCurrentPageData: () => get().data,

  getTotalPages: () => {
    const { itemsPerPage, total } = get();
    return Math.ceil(total / itemsPerPage) || 1;
  },

  // ─── Setters ─────────────────────────────────────────────────────────────────
  setSearchQuery: (query) => {
    set({ searchQuery: query, currentPage: 1 });
  },

  setSorting: (newSortBy, newSortOrder) => {
    set({ sortBy: newSortBy, sortOrder: newSortOrder, currentPage: 1 });
    localStorage.setItem('journal_sort_by', newSortBy);
    localStorage.setItem('journal_sort_order', newSortOrder);
  },

  setCurrentPage: (page) => {
    set({ currentPage: page });
    get().fetchData();
  },

  setItemsPerPage: (items) => {
    set({ itemsPerPage: items, currentPage: 1 });
    localStorage.setItem('journal_limit', items);
    get().fetchData();
  },

  setJournalType: (type) => {
    set({ journalType: type, currentPage: 1 });
    localStorage.setItem('journal_type_filter', type);
  },

  setTransactionType: (type) => {
    set({ transactionType: type, currentPage: 1 });
    localStorage.setItem('journal_txn_type_filter', type);
  },

  setJournalCurrency: (currency) => {
    set({ journalCurrency: currency, currentPage: 1 });
    localStorage.setItem('journal_currency_filter', currency);
  },

  setDateFrom: (date) => {
    set({ dateFrom: date, currentPage: 1 });
    localStorage.setItem('journal_date_from', date);
  },

  setDateTo: (date) => {
    set({ dateTo: date, currentPage: 1 });
    localStorage.setItem('journal_date_to', date);
  },

  resetFilters: () => {
    set({
      journalType: 'all',
      transactionType: 'all',
      journalCurrency: 'all',
      dateFrom: '',
      dateTo: '',
      searchQuery: '',
      currentPage: 1,
    });
    localStorage.removeItem('journal_type_filter');
    localStorage.removeItem('journal_txn_type_filter');
    localStorage.removeItem('journal_currency_filter');
    localStorage.removeItem('journal_date_from');
    localStorage.removeItem('journal_date_to');
    get().fetchData();
  },

  // ─── Item Selection ───────────────────────────────────────────────────────────
  toggleItemSelection: (id) => {
    const { selectedItems, selectedItemsData, data } = get();
    const isSelected = selectedItems.includes(id);

    const updated = isSelected
      ? selectedItems.filter(item => item !== id)
      : [...selectedItems, id];

    const updatedData = { ...selectedItemsData };
    if (isSelected) {
      delete updatedData[id];
    } else {
      const row = data.find(item => item.id === id);
      if (row) updatedData[id] = row;
    }

    set({ selectedItems: updated, selectedItemsData: updatedData });
  },

  clearSelection: () => set({ selectedItems: [], selectedItemsData: {} }),

  getSelectedItemsData: () => Object.values(get().selectedItemsData),

  // ─── Delete ───────────────────────────────────────────────────────────────────
  deleteSelectedItems: async () => {
    const { selectedItems } = get();
    const token = useAuthStore.getState().token;

    try {
      await api.delete('/journal/delete', {
        headers: { Authorization: `Bearer ${token}` },
        data: { journalIds: selectedItems },
      });

      await get().fetchData();
      set({ selectedItems: [], selectedItemsData: {} });
      useToastStore.getState().showToast('Journals deleted successfully', 'success');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      set({ error: message });
      useToastStore.getState().showToast(`Failed to delete: ${message}`, 'error');
      return false;
    }
  },

  // ─── Export ───────────────────────────────────────────────────────────────────
  exportToExcel: () => {
    try {
      const { data } = get();

      const exportData = [];

      data.forEach((journal, jIdx) => {
        // Journal header row
        exportData.push({
          'Journal ID': journal.journal_id,
          'Journal Date': formatDate(journal.journal_date),
          'Type': journal.journal_type,
          'Transaction Type': journal.transaction_type,
          'Currency': journal.journal_currency,
          'Description': journal.journal_description,
          'Cost Center': journal.cost_center,
          'Total Debit': formatAmount(journal.debit),
          'Total Credit': formatAmount(journal.credit),
          'Total Debit (NGN)': formatAmount(journal.debit_ngn),
          'Total Credit (NGN)': formatAmount(journal.credit_ngn),
          'Created At': formatDate(journal.created_at),
          'Created By': journal.created_by,
          'Ledger': '',
          'Ledger Number': '',
          'Ledger Class': '',
          'Item Debit': '',
          'Item Credit': '',
        });

        // Journal line items
        (journal.items || []).forEach((item) => {
          exportData.push({
            'Journal ID': '',
            'Journal Date': '',
            'Type': '',
            'Transaction Type': '',
            'Currency': '',
            'Description': item.journal_description,
            'Cost Center': item.cost_center,
            'Total Debit': '',
            'Total Credit': '',
            'Total Debit (NGN)': '',
            'Total Credit (NGN)': '',
            'Created At': '',
            'Created By': '',
            'Ledger': item.ledger_name,
            'Ledger Number': item.ledger_number,
            'Ledger Class': `${item.ledger_class} / ${item.ledger_sub_class}`,
            'Item Debit': formatAmount(item.debit),
            'Item Credit': formatAmount(item.credit),
          });
        });

        // Spacer row between journals
        exportData.push({});
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData, { skipHeader: false });
      XLSX.utils.book_append_sheet(wb, ws, 'Journals');

      const fileName = `journals_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      useToastStore.getState().showToast('Journals exported successfully', 'success');
    } catch (error) {
      useToastStore.getState().showToast('Failed to export journals', 'error');
      console.error(error);
    }

    function formatAmount(value) {
      return Number(value || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    function formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB');
    }
  },
}));

export default useJournalStore;