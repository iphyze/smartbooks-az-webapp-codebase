import { create } from 'zustand';
import api from '../services/api';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';

const useCategoryStore = create((set, get) => ({
  category: [],
  isLoading: false,
  error: null,
  
  // Fetch category
  fetchCategory: async () => {
    const showToast = useToastStore.getState().showToast;
    set({ isLoading: true });

    try {
      const token = useAuthStore.getState().token;
      
      const response = await api.get('/categories/getAllCategory', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.status === "Success") {
        set({ 
          category: response.data.data,
          isLoading: false,
          error: null
        });
        // showToast('category fetched successfully', 'success');
      } else {
        throw new Error(response.data.message || 'Failed to fetch category');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred while fetching category';
      showToast(errorMessage, 'error');
      set({ 
        error: errorMessage, 
        isLoading: false,
        category: []
      });
    }
  },

  // Refresh category
  refreshCategory: async () => {
    const showToast = useToastStore.getState().showToast;
    try {
      await get().fetchCategory();
      // showToast('category refreshed successfully', 'success');
    } catch (error) {
      showToast('Failed to refresh category', 'error');
    }
  },

  deleteCategory: async (data) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      
      const response = await api.delete('/categories/deleteCategory', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: data
      });
  
      if (response.data.status === "Success") {
        set(state => ({
          category: state.category.filter(categories => !data.categoryIds.includes(categories.id))
        }));
        
        showToast(`Successfully deleted ${data.categoryIds.length} category(s)`, 'success');
        
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete category');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete category';
      showToast(errorMessage, 'error');
      console.error('Error deleting categorys:', error);
      throw error;
    }
  },

  createCategory: async (categoryData) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      
      const response = await api.post('/categories/createCategory', 
        categoryData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.status === "Success") {
        // Add the new category to the state
        set(state => ({
          category: [...state.category, response.data.data]
        }));
        showToast(response.data?.message, 'success');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to create category');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create category';
      showToast(errorMessage, 'error');
      console.error('Error creating category:', error);
      throw error;
    }
  },


  fetchCategoryById: async (categoryId) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      const response = await api.get(`/categories/getSingleCategory/${categoryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (response.data.status === "Success") {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch category');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch category';
      showToast(errorMessage, 'error');
      throw error;
    }
  },


  editCategory: async (categoryData) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      const response = await api.put('/categories/editCategory', 
        categoryData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
  
      if (response.data.status === "Success") {
        // Update the category in the state
        set(state => ({
          category: state.category.map(category => 
            category.id === categoryData.categoryId ? { ...category, ...response.data.data } : category
          )
        }));
        
        showToast('category updated successfully', 'success');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to update category');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update category';
      showToast(errorMessage, 'error');
      throw error;
    }
  },

  // Export to Excel
  exportToExcel: () => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const category = get().category;
      
      // Format data for excel
      const formattedData = category.map(category => ({
        'Category Name': category.name,
        'Description': category.description,
        'Created By': category.createdBy,
        'Created At': new Date(category.createdAt).toLocaleString(),
        'Updated By': category.updatedBy,
        'Updated At': new Date(category.updatedAt).toLocaleString()
      }));

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "category");
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, // category Name
        { wch: 40 }, // Description
        { wch: 30 }, // Created By
        { wch: 20 }, // Created At
        { wch: 30 }, // Updated By
        { wch: 20 }  // Updated At
      ];
      ws['!cols'] = colWidths;

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      saveAs(data, `category_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('category exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showToast('Failed to export category', 'error');
    }
  }
}));

export default useCategoryStore;