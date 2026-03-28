import { create } from 'zustand';
import * as XLSX from 'xlsx';
import useAuthStore from '../useAuthStore';
import useToastStore from '../useToastStore';
import api from '../../services/api';

const useExpenseRequestStore = create((set, get) => ({
  // Data states
  data: [],
  loading: false,
  error: null,

  // Meta states
  total: 0,
  year: localStorage.getItem('expense_selected_year') || useAuthStore.getState().user?.accounting_period || new Date().getFullYear(),
  payment_status: localStorage.getItem('expense_payment_status') || 'all',

  // Pagination states
  currentPage: 1,
  itemsPerPage: localStorage.getItem('expense_payment_limit') || 10,

  // Filter and sort states
  searchQuery: '',
  sortBy: 'created_at',
  sortOrder: 'DESC',

  selectedItems: [],

  // Fetch data
  fetchData: async () => {
    const { currentPage, itemsPerPage, year, payment_status } = get();
    const token = useAuthStore.getState().token;

    // const selectedYear = overrideYear !== null ? overrideYear : year;
    // const selectedStatus = overrideStatus !== null ? overrideStatus : payment_status;

    set({ loading: true });
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        year: year,
        payment_status: payment_status,
      });

      if (get().searchQuery) {
        params.append('search', get().searchQuery);
      }

      params.append('sortBy', get().sortBy);
      params.append('sortOrder', get().sortOrder);

      const response = await api.get(`/request/expense/getFilteredRequest?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({
        data: response.data.data,
        total: response.data.meta.total,
        currentPage: response.data.meta.page,
        itemsPerPage: response.data.meta.limit,
        year: year,
        payment_status: payment_status,
        searchQuery: response.data.meta.search || '',
        sortBy: response.data.meta.sortBy || 'created_at',
        sortOrder: response.data.meta.sortOrder || 'DESC',
        loading: false
      });

      localStorage.setItem('expense_selected_year', year);
      localStorage.setItem('expense_payment_status', payment_status);
      localStorage.setItem('expense_selected_limit', itemsPerPage);
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message,
        loading: false
      });
      useToastStore.getState().showToast('Failed to fetch requests', 'error');
    }
  },


  getCurrentPageData: () => get().data,

getTotalPages: () => {
  const { itemsPerPage, total } = get();
  return Math.ceil(total / itemsPerPage);
},

  setSearchQuery: (query) => {
    set({ searchQuery: query, currentPage: 1 });
  },

  setSorting: (newSortBy, newSortOrder) => {
    set({ 
      sortBy: newSortBy, 
      sortOrder: newSortOrder,
      currentPage: 1
    });
  },

  setCurrentPage: (page) => {
    set({ currentPage: page });
    get().fetchData();
  },

  setItemsPerPage: (items) => {
    set({ itemsPerPage: items, currentPage: 1 });
    localStorage.setItem('expense_selected_limit', items);
    get().fetchData();
  },

  setYear: (year) => {
    set({ year, currentPage: 1 });
    localStorage.setItem('expense_selected_year', year);
    get().fetchData(year);
  },

  setPaymentStatus: (status) => {
    set({ payment_status: status, currentPage: 1 });
    localStorage.setItem('expense_selected_year', status);
    get().fetchData(null, status);
  },

  toggleItemSelection: (id) => {
    const { selectedItems } = get();
    const updated = selectedItems.includes(id)
      ? selectedItems.filter(item => item !== id)
      : [...selectedItems, id];
    set({ selectedItems: updated });
  },

  clearSelection: () => set({ selectedItems: [] }),

  deleteSelectedItems: async () => {
    const { selectedItems } = get();
    const token = useAuthStore.getState().token;

    try {
      await api.delete('/request/expense/delete', {
        headers: { Authorization: `Bearer ${token}` },
        data: { requestIds: selectedItems }
      });

      await get().fetchData();
      set({ selectedItems: [] });
      useToastStore.getState().showToast('Requests deleted successfully', 'success');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      set({ error: message });
      useToastStore.getState().showToast(`Failed to delete: ${message}`, 'error');
      return false;
    }
  },


  updateSelectedItems: async (pytStatus) => {
  const { selectedItems } = get();
  const token = useAuthStore.getState().token;

  try {
    await api.put(
      '/request/expense/updateStatus',
      { requestIds: selectedItems, payment_status: pytStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await get().fetchData();
    set({ selectedItems: [] });
    useToastStore.getState().showToast(`Requests updated to "${pytStatus}" successfully`, 'success');
    return true;
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    set({ error: message });
    useToastStore.getState().showToast(`Failed to update: ${message}`, 'error');
    return false;
  }
},


 exportToExcel: () => {
  try {
    const data = get().data;

    // Sort by supplier name and created_at ASC
    const sortedData = [...data].sort((a, b) => {
      const nameCompare = a.suppliers_name.localeCompare(b.suppliers_name);
      if (nameCompare !== 0) return nameCompare;
      return new Date(a.created_at) - new Date(b.created_at);
    });

    const exportData = [];
    let sn = 1;
    let grandTotal = 0;

    let currentSupplier = '';
    let supplierTotal = 0;

    sortedData.forEach((item, index) => {
      const supplierChanged = item.suppliers_name !== currentSupplier;

      if (supplierChanged && index !== 0) {
        // Push subtotal row
        exportData.push(createSubtotalRow(supplierTotal));
        exportData.push(createEmptyRow());
        supplierTotal = 0;
      }

      currentSupplier = item.suppliers_name;
      const amount = parseFloat(item.amount) || 0;
      supplierTotal += amount;
      grandTotal += amount;

      exportData.push({
        'S/N': sn++,
        'Supplier Name': item.suppliers_name,
        'Description': item.description,
        'Classification': item.classification,
        'Projects': item.project_code,
        'Invoice Number': item.invoice_number,
        'Invoice Date': formatDate(item.invoice_date),
        'Received Date': formatDate(item.date_received),
        'Percentage': `${item.percentage}%`,
        'Net Value': formatAmount(item.net_value),
        'Vat': formatAmount(item.vat),
        'Total Inv. Amt': formatAmount(item.net_value),
        'Status': item.payment_status,
        'Note': item.note || 'None',
        'Total': ''
      });
    });

    // Push subtotal for last supplier
    if (sortedData.length > 0) {
      exportData.push(createSubtotalRow(supplierTotal));
      exportData.push(createEmptyRow());
    }

    // Push grand total
    exportData.push({ 'Note': '', 'Total': formatAmount(grandTotal) });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData, { skipHeader: false });
    XLSX.utils.book_append_sheet(wb, ws, 'Expense Fund Requests');

    const fileName = `expense_fund_request_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    useToastStore.getState().showToast('Data exported successfully', 'success');

  } catch (error) {
    useToastStore.getState().showToast('Failed to export data', 'error');
    console.error(error);
  }

  // Helpers
  function formatAmount(value) {
    return Number(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  function createEmptyRow() {
    return {
      'S/N': '',
      'Supplier Name': '',
      'Description': '',
      'Classification': '',
      'Projects': '',
      'Invoice Number': '',
      'Invoice Date': '',
      'Received Date': '',
      'Percentage': '',
      'Net Value': '',
      'Vat': '',
      'Total Inv. Amt': '',
      'Status': '',
      'Note': '',
      'Total': ''
    };
  }

  function createSubtotalRow(total) {
    return {
      'Note': '',
      'Total': formatAmount(total)
    };
  }
}


}));

export default useExpenseRequestStore;
