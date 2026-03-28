import { create } from 'zustand';
import api from '../services/api';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';
import eventService from '../services/eventService';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


const addUniqueItem = (array, item, idField = 'id') => {
  const exists = array.some(existing => existing[idField] === item[idField]);
  if (!exists) {
    return [...array, item];
  }
  return array;
};

const updateItemInArray = (array, item, idField = 'id') => {
  return array.map(existing => 
    existing[idField] === item[idField] ? { ...existing, ...item } : existing
  );
};

const useLogsStore = create((set, get) => ({
  logs: [],
  responses: [],
  isLoading: false,
  error: null,
  sseConnected: false,

  initializeSSE: () => {
    const token = useAuthStore.getState().token;
    const showToast = useToastStore.getState().showToast;
    
    if (!token) {
      console.error('No token available for SSE connection');
      return;
    }

    const eventSource = eventService.connect(token);

    // Handle connection state
    eventSource.onopen = () => {
      set({ sseConnected: true });
      console.log('SSE Connection established');
    };

    eventSource.onerror = (error) => {
      set({ sseConnected: false });
      console.error('SSE Connection error:', error);
      showToast('Real-time updates connection lost', 'error');
    };

    eventSource.addEventListener('log', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Log event received:', data);
        
        // Fetch updated logs for the current client
        const state = get();
        if (data.clientId) {
          // Get the current clientId from the URL or state
          const currentClientId = window.location.pathname.split('/').pop();
          if (currentClientId === data.clientId.toString()) {
            // Refresh logs
            const fetchLogs = async () => {
              try {
                const token = useAuthStore.getState().token;
                const response = await api.get(`/logs/getSingleClientLog/${currentClientId}/${data.contactType}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
    
                if (response.data.status === "Success") {
                  set({ 
                    logs: response.data.data,
                    isLoading: false,
                    error: null
                  });
                  useToastStore.getState().showToast('New log received', 'info');
                }
              } catch (error) {
                console.error('Error fetching updated logs:', error);
              }
            };
            fetchLogs();
          }
        }
      } catch (error) {
        console.error('Error processing log event:', error);
      }
    });
    
    eventSource.addEventListener('response', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Response event received:', data);
        
        // Fetch updated responses
        const state = get();
        if (data.clientId) {
          const currentClientId = window.location.pathname.split('/').pop();
          if (currentClientId === data.clientId.toString()) {
            // Refresh responses
            const fetchResponses = async () => {
              try {
                const token = useAuthStore.getState().token;
                const response = await api.get('/logs/getAllLogResponses', {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
    
                if (response.data.status === "Success") {
                  set({ 
                    responses: response.data.data,
                    isLoading: false,
                    error: null
                  });
                  useToastStore.getState().showToast('New response received', 'info');
                }
              } catch (error) {
                console.error('Error fetching updated responses:', error);
              }
            };
            fetchResponses();
          }
        }
      } catch (error) {
        console.error('Error processing response event:', error);
      }
    });

    eventSource.addEventListener('reminder', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.emailSent) {
          showToast(`Reminder sent for: ${data.title}`, 'info');
        }
        
        if (data.messageId) {
          set(state => ({
            logs: state.logs.map(log => 
              log.id === data.messageId 
                ? { ...log, reminderSent: true }
                : log
            )
          }));
        }
      } catch (error) {
        console.error('Error processing reminder event:', error);
      }
    });

    eventSource.addEventListener('reminderError', (event) => {
      try {
        const data = JSON.parse(event.data);
        showToast(`Failed to send reminder: ${data.error}`, 'error');
      } catch (error) {
        console.error('Error processing reminder error event:', error);
      }
    });

    // Handle general messages
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('General SSE message received:', data);
      } catch (error) {
        console.error('Error processing general message:', error);
      }
    };

    return () => {
      eventSource.close();
      set({ sseConnected: false });
    };
  },

  disconnectSSE: () => {
    eventService.disconnect();
    set({ sseConnected: false });
  },

  fetchClientLogs: async (clientId, contactType) => {
    const showToast = useToastStore.getState().showToast;
    set({ isLoading: true });
  
    try {
      const token = useAuthStore.getState().token;
      const response = await api.get(`/logs/getSingleClientLog/${clientId}/${contactType}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (response.data.status === "Success") {
        set({ 
          logs: response.data.data,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch logs';
      set({ 
        error: errorMessage,
        isLoading: false,
        logs: []
      });
      showToast(errorMessage, 'error');
    }
  },

  createLog: async (logData) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      const response = await api.post('/logs/createLog', 
        {
          ...logData,
          clientId: logData.clientId, // Ensure clientId is included
          contactType: logData.contactType // Include contactType
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.status === "Success") {
        set(state => ({
          logs: [...state.logs, response.data.data]
        }));
        
        showToast('Log created successfully', 'success');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to create log');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create log';
      showToast(errorMessage, 'error');
      throw error;
    }
  },

  createLogResponse: async (logData) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      const response = await api.post('/logs/createLogResponse', 
        {
          ...logData,
          clientId: logData.clientId // Ensure clientId is included
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
  
      if (response.data.status === "Success") {
        showToast('Response added successfully', 'success');
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create response');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create response';
      showToast(errorMessage, 'error');
      throw error;
    }s
  },

  editLog: async (logData) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      const response = await api.put('/logs/editLog', 
        logData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
  
      if (response.data.status === "Success") {
        set(state => ({
          logs: state.logs.map(log => 
            log.id === logData.messageId ? { ...log, ...response.data.data } : log
          )
        }));
        
        showToast(response.data.message || 'Log updated successfully', 'success');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to update log');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update log';
      showToast(errorMessage, 'error');
      throw error;
    }
  },

  fetchAllLogResponses: async () => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      const response = await api.get('/logs/getAllLogResponses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (response.data.status === "Success") {
        set({ 
          responses: response.data.data,
          isLoading: false,
          error: null
        });
        return response.data.data;
      } else {
        showToast(response.data.message || 'Failed to fetch responses', 'error');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch responses';
      showToast(errorMessage, 'error');
      throw error;
    }
  },

  editResponseLog: async (logData) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      const response = await api.put('/logs/editResponseLog', 
        logData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
  
      if (response.data.status === "Success") {
        set(state => ({
          responses: state.responses.map(response => 
            response.id === logData.responseId 
              ? { 
                  ...response,
                  message: logData.message,
                  title: logData.title,
                  updatedAt: new Date().toISOString()
                } 
              : response
          )
        }));
        
        showToast(response.data.message || 'Response updated successfully', 'success');
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update response');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update response';
      showToast(errorMessage, 'error');
      throw error;
    }
  },

  updateResponses: (newResponse) => {
    set(state => ({
      responses: [...state.responses, newResponse]
    }));
  },

  deleteLogs: async (messageIds) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      const response = await api.delete('/logs/deleteLog', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: { messageIds }
      });

      if (response.data.status === "Success") {
        set(state => ({
          logs: state.logs.filter(log => !messageIds.includes(log.id))
        }));
        
        showToast('Log(s) deleted successfully', 'success');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete log(s)');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete log(s)';
      showToast(errorMessage, 'error');
      throw error;
    }
  },

  deleteResponses: async (responseIds) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      const response = await api.delete('/logs/deleteResponse', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: { responseIds }
      });
  
      if (response.data.status === "Success") {
        set(state => ({
          responses: state.responses.filter(response => !responseIds.includes(response.id))
        }));
        
        showToast('Response(s) deleted successfully', 'success');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete response(s)');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete response(s)';
      showToast(errorMessage, 'error');
      throw error;
    }
  },

  clearLogs: () => {
    set({ logs: [], error: null });
  },

  clearResponses: () => {
    set({ responses: [] });
  },

  exportToExcel: () => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const logs = get().logs;
      const responses = get().responses;
  
      if (!logs.length) {
        showToast('No logs available to export', 'error');
        return;
      }
  
      // Create a map of responses by logId for easy lookup
      const responseMap = responses.reduce((acc, response) => {
        if (!acc[response.logId]) {
          acc[response.logId] = [];
        }
        acc[response.logId].push(response);
        return acc;
      }, {});
  
      // Format data for excel with logs and their responses as separate rows
      let formattedData = [];
      let serialNumber = 1;
  
      logs.forEach(log => {
        // Add log entry
        formattedData.push({
          'S/N': serialNumber++,
          'Type': 'Log',
          'Title': log.title,
          'Message': log.message,
          'Client Name': log.clientName,
          'Project': log.projectTitle,
          'Contact Type': log.contactType,
          'Created By': `${log.firstName} ${log.lastName}`,
          'Created At': new Date(log.createdAt).toLocaleString()
        });
  
        // Add responses for this log
        const logResponses = responseMap[log.id] || [];
        logResponses.forEach(response => {
          formattedData.push({
            'S/N': serialNumber++,
            'Type': 'Response',
            'Title': response.title,
            'Message': response.message,
            'Client Name': log.clientName,     // Use the parent log's client name
            'Project': log.projectTitle,       // Use the parent log's project
            'Contact Type': log.contactType,   // Use the parent log's contact type
            'Created By': `${response.firstName} ${response.lastName}`,
            'Created At': new Date(response.createdAt).toLocaleString()
          });
        });
      });
  
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Logs and Responses");
      
      // Set column widths
      const colWidths = [
        { wch: 5 },   // S/N
        { wch: 10 },  // Type
        { wch: 30 },  // Title
        { wch: 50 },  // Message
        { wch: 30 },  // Client Name
        { wch: 30 },  // Project
        { wch: 15 },  // Contact Type
        { wch: 30 },  // Created By
        { wch: 20 }   // Created At
      ];
      ws['!cols'] = colWidths;
  
      // Auto-height for rows
      ws['!rows'] = formattedData.map(() => ({ hpt: 30 }));
  
      const excelBuffer = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'array',
        cellStyles: true
      });
      
      const data = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      saveAs(data, `logs_and_responses_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Logs exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showToast('Failed to export logs', 'error');
    }
  }
}));

export default useLogsStore;