// In useSuppliersStore.js
import { create } from 'zustand';
import { debounce } from 'lodash';
import api from '../services/api';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';

const useSuppliersStore = create((set, get) => {
  // Create debounced functions at store initialization
  const debouncedSupplierSearch = debounce(async (searchQuery, token) => {
    try {
      const response = await api.get(`/data/fetchSuppliers?search=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.status === "Success") {
        return response.data.data.map(supplier => ({
          value: supplier.id,
          label: `${supplier.supplier_name} (${supplier.supplier_number})`,
          supplier_number: supplier.supplier_number
        }));
      }
      return [];
    } catch (error) {
      useToastStore.getState().showToast(error?.response?.data?.message, 'error');
      return [];
    }
  }, 100);

  const debouncedAccountSearch = debounce(async (searchQuery, token) => {
    try {
      const response = await api.get(`/data/fetchSuppliersAccountDetails?search=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.status === "Success") {
        return response.data.data.map(account => ({
          value: account.id,
          label: `${account.account_name} - ${account.bank_name}`,
          account_number: account.account_number,
          bank_name: account.bank_name,
          sort_code: account.sort_code
        }));
      }
      return [];
    } catch (error) {
      useToastStore.getState().showToast(error?.response?.data?.message, 'error');
      return [];
    }
  }, 100);

  return {
    suppliers: [],
    accounts: [],
    loading: false,
    error: null,

    fetchSuppliers: async (searchQuery) => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const token = useAuthStore.getState().token;
      return debouncedSupplierSearch(searchQuery, token);
    },

    fetchAccounts: async (searchQuery) => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const token = useAuthStore.getState().token;
      return debouncedAccountSearch(searchQuery, token);
    }
  };
});

export default useSuppliersStore;