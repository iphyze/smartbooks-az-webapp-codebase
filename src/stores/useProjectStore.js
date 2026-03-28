import { create } from 'zustand';
import api from '../services/api';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';

const useProjectStore = create((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,
  
  // Fetch projects
  fetchProjects: async () => {
    const showToast = useToastStore.getState().showToast;
    set({ isLoading: true });

    try {
      const token = useAuthStore.getState().token;
      
      const response = await api.get('/projects/getAllProject', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.status === "Success") {
        set({ 
          projects: response.data.data,
          isLoading: false,
          error: null
        });
        // showToast('Projects fetched successfully', 'success');
      } else {
        throw new Error(response.data.message || 'Failed to fetch projects');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred while fetching projects';
      showToast(errorMessage, 'error');
      set({ 
        error: errorMessage, 
        isLoading: false,
        projects: []
      });
    }
  },

  // Refresh projects
  refreshProjects: async () => {
    const showToast = useToastStore.getState().showToast;
    try {
      await get().fetchProjects();
      // showToast('Projects refreshed successfully', 'success');
    } catch (error) {
      showToast('Failed to refresh projects', 'error');
    }
  },

  // deleteProjects: async (projectIds) => {
  //   const showToast = useToastStore.getState().showToast;
    
  //   try {
  //     const token = useAuthStore.getState().token;
      
  //     const response = await api.post('/projects/deleteProjects', 
  //       { projectIds: projectIds },
  //       {
  //         headers: {
  //           'Authorization': `Bearer ${token}`
  //         }
  //       }
  //     );

  //     if (response.data.status === "Success") {
  //       // Remove deleted projects from the state
  //       set(state => ({
  //         projects: state.projects.filter(project => !projectIds.includes(project.id))
  //       }));
  //       showToast(`Successfully deleted ${projectIds.length} project(s)`, 'success');
  //       return true;
  //     } else {
  //       throw new Error(response.data.message || 'Failed to delete projects');
  //     }
  //   } catch (error) {
  //     const errorMessage = error.response?.data?.message || error.message || 'Failed to delete projects';
  //     showToast(errorMessage, 'error');
  //     console.error('Error deleting projects:', error);
  //     throw error;
  //   }
  // },

  createProject: async (projectData) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      
      const response = await api.post('/projects/createProject', 
        projectData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.status === "Success") {
        // Add the new project to the state
        set(state => ({
          projects: [...state.projects, response.data.data]
        }));
        showToast(response.data?.message, 'success');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to create project');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create project';
      showToast(errorMessage, 'error');
      console.error('Error creating project:', error);
      throw error;
    }
  },


  fetchProjectById: async (projectId) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      const response = await api.get(`/projects/getSingleProject/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (response.data.status === "Success") {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch project');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch project';
      showToast(errorMessage, 'error');
      throw error;
    }
  },


  editProject: async (projectData) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      const response = await api.put('/projects/editProject', 
        projectData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
  
      if (response.data.status === "Success") {
        // Update the project in the state
        set(state => ({
          projects: state.projects.map(project => 
            project.id === projectData.projectId ? { ...project, ...response.data.data } : project
          )
        }));
        
        showToast('Project updated successfully', 'success');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to update project');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update project';
      showToast(errorMessage, 'error');
      throw error;
    }
  },

  deleteProjects: async (data) => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const token = useAuthStore.getState().token;
      
      const response = await api.delete('/projects/deleteProject', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: data
      });
  
      if (response.data.status === "Success") {
        set(state => ({
          projects: state.projects.filter(project => !data.projectIds.includes(project.id))
        }));
        
        showToast(`Successfully deleted ${data.projectIds.length} project(s)`, 'success');
        
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete projects');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete projects';
      showToast(errorMessage, 'error');
      console.error('Error deleting projects:', error);
      throw error;
    }
  },

  // Export to Excel
  exportToExcel: () => {
    const showToast = useToastStore.getState().showToast;
    
    try {
      const projects = get().projects;
      
      // Format data for excel
      const formattedData = projects.map(project => ({
        'Project Name': project.name,
        'Description': project.description,
        'Created By': project.createdBy,
        'Created At': new Date(project.createdAt).toLocaleString(),
        'Updated By': project.updatedBy,
        'Updated At': new Date(project.updatedAt).toLocaleString()
      }));

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Projects");
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, // Project Name
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
      
      saveAs(data, `projects_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Projects exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showToast('Failed to export projects', 'error');
    }
  }
}));

export default useProjectStore;