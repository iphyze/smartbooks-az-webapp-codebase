import { create } from 'zustand';
import api from '../services/api';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';

const useContactStore = create((set, get) => ({
  contacts: [],
  isLoading: false,
  error: null,

  createContact: async (contactData) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      
      const response = await api.post('/contacts/createContact', 
        contactData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.status === "Success") {
        // Add the new contact to the state
        set(state => ({
          contacts: [...state.contacts, response.data.data]
        }));
        
        // Show success toast
        showToast(response.data?.message, 'success');
        return true;
      } else {
        // Show error toast for known error
        showToast(response.data.message || 'Failed to create contact', 'error');
        throw new Error(response.data.message || 'Failed to create contact');
      }
    } catch (error) {
      // Show error toast for unexpected error
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
      showToast(errorMessage, 'error');
      console.error('Error creating contact:', error);
      throw error;
    }
  },

  editContact: async (contactData) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      
      const response = await api.put('/contacts/editContact', 
        contactData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
  
      if (response.data.status === "Success") {
        // Update the contact in the state
        set(state => ({
          contacts: state.contacts.map(contact => 
            contact.id === contactData.contactId ? { ...contact, ...response.data.data } : contact
          )
        }));
        
        showToast(response.data?.message || 'contact updated successfully', 'success');
        return true;
      } else {
        showToast(response.data.message || 'Failed to update contact', 'error');
        throw new Error(response.data.message || 'Failed to update contact');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
      showToast(errorMessage, 'error');
      console.error('Error updating contact:', error);
      throw error;
    }
  },

  // Here's how you would implement the other functions with toast notifications:

  fetchContacts: async () => {
    const showToast = useToastStore.getState().showToast;
    set({ isLoading: true });
    
    try {
      const token = useAuthStore.getState().token;
      
      const response = await api.get('/contacts/getAllContacts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.status === "Success") {
        set({ 
          contacts: response.data.data,
          isLoading: false,
          error: null
        });
      } else {
        throw new Error(response.data.message || 'Failed to fetch contacts');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch contacts';
      showToast(errorMessage, 'error');
      set({ 
        error: errorMessage, 
        isLoading: false,
        contacts: []
      });
    }
  },


  // Add this to fetch a single contact
fetchContactById: async (contactId) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      
      const response = await api.get(`/contacts/getSingleContact/${contactId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (response.data.status === "Success") {
        return response.data.data;
      } else {
        showToast(response.data.message || 'Failed to fetch contact', 'error')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch contact';
      showToast(errorMessage, 'error');
    }
  },


  
  deleteContacts: async (data) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      
      const response = await api.delete('/contacts/deleteContact', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: data // This is the key change - passing data in the config object
      });
  
      if (response.data.status === "Success") {
        // Remove deleted contacts from the state
        set(state => ({
          contacts: state.contacts.filter(contact => !data.contactIds.includes(contact.id))
        }));
        
        // Show success toast
        showToast(`Successfully deleted ${data.contactIds.length} contact(s)`, 'success');
  
        // Refresh contacts list
        // await get().fetchContacts();
        
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete contacts');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete contacts';
      showToast(errorMessage, 'error');
      console.error('Error deleting contacts:', error);
      throw error;
    }
  },

  exportToExcel: () => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const contacts = get().contacts;
      
      // Format data for excel
      const formattedData = contacts.map(contact => ({
        'id': contact.id,
        'Organization': contact.organization,
        'Representative': contact.representative,
        'Tel': contact.tel,
        'Email': contact.email,
        'Project': contact.projectTitle,
        'Category Name': contact.categoryName,
        'Comment': contact.comment,
        'Status': contact.status,
        'CreatedBy': contact.createdBy,
        'UpdatedBy': contact.updatedBy,
        'Created At': new Date(contact.createdAt).toLocaleString(),
        'Updated At': new Date(contact.updatedAt).toLocaleString()
      }));

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "contacts");
      
      // Set column widths
      const colWidths = [
        { wch: 15 }, // id
        { wch: 30 }, // organization
        { wch: 30 }, // representative
        { wch: 15 }, // tel
        { wch: 20 }, // email
        { wch: 20 }, // project
        { wch: 20 }, // category
        { wch: 20 }, // comment
        { wch: 20 }, // status
        { wch: 20 }, // created By
        { wch: 20 }, // updated By
        { wch: 20 }, // Created At
        { wch: 20 }  // UpdatedBy At
      ];
      ws['!cols'] = colWidths;

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      saveAs(data, `Contacts_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Contact list exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showToast('Failed to export contact list', 'error');
    }
  }
}));

export default useContactStore;