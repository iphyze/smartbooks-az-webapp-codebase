import { create } from 'zustand';
import * as XLSX from 'xlsx';
import useAuthStore from '../useAuthStore';
import useToastStore from '../useToastStore';
import api from '../../services/api';

const useSuppplierRequestStore = create((set, get) => ({
  // Data states
  data: [],
  loading: false,
  error: null,

  // Meta states
  total: 0,
  year: localStorage.getItem('supplier_selected_year') || useAuthStore.getState().user?.accounting_period || new Date().getFullYear(),
  payment_status: localStorage.getItem('supplier_payment_status') || 'all',

  // Pagination states
  currentPage: 1,
  itemsPerPage: localStorage.getItem('supplier_payment_limit') || 10,

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

      const response = await api.get(`/request/supplier/getFilteredRequest?${params}`, {
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

      localStorage.setItem('supplier_selected_year', year);
      localStorage.setItem('supplier_payment_status', payment_status);
      localStorage.setItem('supplier_selected_limit', itemsPerPage);
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
    localStorage.setItem('supplier_selected_limit', items);
    get().fetchData();
  },

  setYear: (year) => {
    set({ year, currentPage: 1 });
    localStorage.setItem('supplier_selected_year', year);
    get().fetchData(year);
  },

  setPaymentStatus: (status) => {
    set({ payment_status: status, currentPage: 1 });
    localStorage.setItem('supplier_selected_year', status);
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
      await api.delete('/request/supplier/delete', {
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
      '/request/supplier/updateStatus',
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
        'Invoice Number': item.invoice_number,
        'Purchase Number': item.purchase_number,
        'Po Number': item.po_number,
        'Invoice Date': formatDate(item.invoice_date),
        'Purchase Date': formatDate(item.purchase_date),
        'Date Received': formatDate(item.date_received),
        'Invoice Month': item.invoice_month,
        'Purchase Month': item.purchase_month,
        'Project Code': item.project_code,
        'Description': item.description,
        'Vat Policy': item.vat_policy,
        'Net Value': formatAmount(item.net_value),
        'Discount': formatAmount(item.discount),
        'Other Charges': formatAmount(item.other_charges),
        'Amount': formatAmount(item.amount),
        'Payment Status': item.payment_status,
        'Note': item.note || 'None',
        'Created At': formatDate(item.created_at),
        'Updated At': item.updated_at,
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
    XLSX.utils.book_append_sheet(wb, ws, 'supplier Fund Requests');

    const fileName = `supplier_fund_request_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      'Invoice Number': '',
      'Purchase Number': '',
      'Po Number': '',
      'Invoice Date': '',
      'Purchase Date': '',
      'Invoice Month': '',
      'Purchase Month': '',
      'Project Code': '',
      'Description': '',
      'Vat Policy': '',
      'Net Value': '',
      'Discount': '',
      'Other Charges': '',
      'Amount': '',
      'Payment Status': '',
      'Note': '',
      'Created At': '',
      'Updated At': '',
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

export default useSuppplierRequestStore;
