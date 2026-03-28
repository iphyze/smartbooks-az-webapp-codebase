import { create } from 'zustand';
import * as XLSX from 'xlsx';
import api from '../services/api';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';

const useAdvanceGapsStore = create((set, get) => ({
  // Data states
  data: [],
  loading: false,
  error: null,
  
  // Meta states
  total: 0,
  year: useAuthStore.getState().user?.accounting_period || new Date().getFullYear(),
  
  // Pagination states
  currentPage: 1,
  itemsPerPage: 10,
  
  // Filter states
  searchQuery: '',
  selectedDate: null,
  sortBy: 'created_at',
  sortOrder: 'desc',
  
  // Selection states
  selectedItems: [],
  
  // Fetch data
  fetchData: async (year = null) => {
    const { currentPage, itemsPerPage, selectedDate } = get();
    const token = useAuthStore.getState().token;
    

    if (year) {
      set({ year });
    }


    set({ loading: true });
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        year: year || get().year
      });

      if (selectedDate) {
        params.append('date', selectedDate.toLocaleDateString('en-CA'));
      }

      const response = await api.get(`/gaps/supplier/getFilteredGaps?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ 
        data: response.data.data,
        total: response.data.meta.total,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || error.message,
        loading: false 
      });
      useToastStore.getState().showToast('Failed to fetch data', 'error');
    }
  },

  // Get filtered and sorted data
  getFilteredData: () => {
    const { data, searchQuery, selectedDate, sortBy, sortOrder } = get();
    
    let filtered = [...data];

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.suppliers_name.toLowerCase().includes(searchLower) ||
        item.po_numbers.toLowerCase().includes(searchLower) ||
        item.payment_amount.toString().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Convert to numbers for numerical sorting if needed
      if (sortBy === 'payment_amount') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      // Handle string comparison
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    });

    return filtered;
  },

  // Get current page data
  getCurrentPageData: () => {
    const { currentPage, itemsPerPage } = get();
    const filtered = get().getFilteredData();
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    
    return filtered.slice(start, end);
  },

  // Get total pages
  getTotalPages: () => {
    const { itemsPerPage } = get();
    const filtered = get().getFilteredData();
    return Math.ceil(filtered.length / itemsPerPage);
  },

  // Action handlers
  setSearchQuery: (query) => {
    set({ searchQuery: query, currentPage: 1 });
  },

  setSelectedDate: (date) => {
    set({ 
      selectedDate: date ? new Date(date) : null,
      currentPage: 1 
    });
    get().fetchData();
  },

  setCurrentPage: (page) => {
    set({ currentPage: page });
  },

  setItemsPerPage: (items) => {
    set({ itemsPerPage: items, currentPage: 1 });
  },

  setSorting: (newSortBy, newSortOrder) => {
    set({ 
      sortBy: newSortBy, 
      sortOrder: newSortOrder,
      currentPage: 1
    });
  },
  
  toggleItemSelection: (id) => {
    const { selectedItems } = get();
    const newSelection = selectedItems.includes(id)
      ? selectedItems.filter(item => item !== id)
      : [...selectedItems, id];
    set({ selectedItems: newSelection });
  },

  clearSelection: () => set({ selectedItems: [] }),

  // Delete function remains the same
  deleteSelectedItems: async () => {
    const { selectedItems } = get();
    const token = useAuthStore.getState().token;

    try {
      await api.delete('/gaps/supplier/deleteSuppliersGaps', {
        headers: { Authorization: `Bearer ${token}` },
        data: { paymentIds: selectedItems }
      });
      
      await get().fetchData();
      set({ selectedItems: [] });
      useToastStore.getState().showToast('Items deleted successfully', 'success');
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({ error: errorMessage });
      useToastStore.getState().showToast(`Failed to delete items: ${errorMessage}`, 'error');
      return false;
    }
  },

exportToExcel: () => {
    try {
      const data = get().getFilteredData();
      
      const exportData = data.map(item => {

        const formatAmount = (amount) => {
          return Number(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
        };

        // Format payment date to dd/mm/yyyy
        const dateObj = new Date(item.payment_date);
        const formattedDate = dateObj.toLocaleDateString('en-GB'); // dd/mm/yyyy format

        return{
        'PaymentAmount (number format, 2 decimal places (max)': formatAmount(item.payment_amount),
        'PaymentDate (text format, dd / mm / yyyy, max, 11 characters)': formattedDate,
        'Reference (optional ie cells can be left blank, text format, alpha-numeric, max 20 characters)': '',
        'Remark (text format, alpha-numeric, max 25 characters)': item.remark,
        'VendorCode (text format, max of 32 charaters, eg staff ID, RC no or name)': item.account_name,
        'VendorName (text format, alpha-numeric, max 50 characters)': item.account_name,
        'VendorAcctNumber (text format, numeric, max 15 digits)': item.account_number,
        'VendorBankSortCode (text format, 9 digits)': item.sort_code
        }
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      XLSX.utils.book_append_sheet(wb, ws, 'Advance Gaps');

      const fileName = `advance_gaps_${new Date().toISOString().split('T')[0]}.xlsx`;

      XLSX.writeFile(wb, fileName);
      
      useToastStore.getState().showToast('Data exported successfully', 'success');
    } catch (error) {
      useToastStore.getState().showToast('Failed to export data', 'error');
    }
  }
}));

// Response interceptor remains the same
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      useToastStore.getState().showToast('Session expired. Please login again.', 'error');
    }
    return Promise.reject(error);
  }
);

export default useAdvanceGapsStore;