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
  batch: 1,
  year: useAuthStore.getState().user?.accounting_period || new Date().getFullYear(),
  filterUserId: useAuthStore.getState().user?.id || null,
  
  // Pagination states
  currentPage: 1,
  itemsPerPage: 10,
  
  // Filter states
  searchQuery: '',
  selectedDate: null,
  sortBy: 'payment_date',
  sortOrder: 'desc',
  
  // Selection states
  selectedItems: [],

  userOptions: [],
  
  // Fetch data
  fetchData: async (year = null) => {
    const { currentPage, itemsPerPage, selectedDate, filterUserId } = get();
    const token = useAuthStore.getState().token;

    set({ loading: true });
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      });

      const yearToUse = year || get().year;
      if (yearToUse) {
        params.append('year', yearToUse);
      }

      if (selectedDate) {
        params.append('date', selectedDate.toLocaleDateString('en-CA'));
      }

      if (filterUserId && filterUserId !== 'all') {
        params.append('userId', filterUserId);
      } else if (filterUserId === 'all') {
        params.append('userId', 'all');
      }

      params.append('batch', get().batch);

      if (get().searchQuery) {
        params.append('search', get().searchQuery);
      }

      params.append('sortBy', get().sortBy);
      params.append('sortOrder', get().sortOrder);

      const response = await api.get(`/gaps/advance/getFilteredGaps?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ 
        data: response.data.data,
        total: response.data.meta.total,
        currentPage: response.data.meta.page,
        itemsPerPage: response.data.meta.limit,
        year: response.data.meta.year,
        searchQuery: response.data.meta.search || '',
        sortBy: response.data.meta.sortBy || 'payment_date',
        sortOrder: response.data.meta.sortOrder || 'desc',
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



  fetchUsers: async () => {
  const token = useAuthStore.getState().token;
  try {
    const response = await api.get('/data/fetchUsers', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const users = response.data.data || [];

    const options = [
      { label: 'All', value: 'all' },
      ...users.map(allUser => ({
        label: `${allUser.fname} ${allUser.lname}`,
        value: allUser.id
      }))
    ];

    set({ userOptions: options });
  } catch (err) {
    useToastStore.getState().showToast('Failed to fetch users', 'error');
    console.error('Failed to load users', err);
  }
},


  // Get current page data
getCurrentPageData: () => get().data,



  // Get total pages
getTotalPages: () => {
  const { itemsPerPage, total } = get();
  return Math.ceil(total / itemsPerPage);
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

  setFilterUserId: (userId) => {
  set({
    filterUserId: userId,
    currentPage: 1
  });
    get().fetchData(); // auto-refresh when user changes
  },

  setCurrentPage: (page) => {
    set({ currentPage: page });
    get().fetchData();
  },

  setItemsPerPage: (items) => {
    set({ itemsPerPage: items, currentPage: 1 });
    get().fetchData();
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
      await api.delete('/gaps/advance/deleteSuppliersAdvanceGaps', {
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
      const data = get().data;
      
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