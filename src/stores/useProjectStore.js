import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as XLSX from 'xlsx';
import useToastStore from './useToastStore';
import api from '../services/api';

const useProjectStore = create(
  persist(
    (set, get) => ({
      // ── Data (Transient - Do not persist) ────────────────────────────────
      data: [],
      loading: false,
      error: null,
      total: 0,
      selectedItems: [],
      selectedItemsData: {},

      // ── Single Project Data (Transient) ──────────────────────────────────
      singleProject: null,
      singleProjectInvoices: [],
      singleProjectSummary: null,
      fetchingSingle: false,
      singleProjectError: null,

      // ── Next Project Code (Transient) ────────────────────────────────────
      nextProjectCode: null,
      fetchingNextCode: false,
      nextCodeError: null,

      // ── Pagination & Sort (Persistent - Do persist) ──────────────────────
      currentPage: 1,
      itemsPerPage: 10,
      searchQuery: '',
      sortBy: 'project_name',
      sortOrder: 'ASC',

      /* ═════════════════════════════════════════════════════════════════════
         Fetch Next Project Code
      ═════════════════════════════════════════════════════════════════════ */
      fetchNextProjectCode: async () => {
        set({ fetchingNextCode: true, nextCodeError: null });

        try {
          const response = await api.get('/projects/fetch-last-project-id');

          set({
            nextProjectCode: response.data.project_code + 1,
            fetchingNextCode: false,
          });
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({
            nextCodeError: message,
            fetchingNextCode: false,
          });
          useToastStore.getState().showToast(`Failed to fetch next project code: ${message}`, 'error');
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         fetchData
      ═════════════════════════════════════════════════════════════════════ */
      fetchData: async () => {
        const { currentPage, itemsPerPage, sortBy, sortOrder, searchQuery } = get();

        set({ loading: true, error: null });

        try {
          const params = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage,
            sortBy,
            sortOrder,
          });

          if (searchQuery) params.append('search', searchQuery);

          const response = await api.get(`/projects/filtered-request?${params}`);

          set({
            data: response.data.data,
            total: response.data.meta.total,
            currentPage: response.data.meta.page,
            itemsPerPage: response.data.meta.limit,
            sortBy: response.data.meta.sortBy || 'project_name',
            sortOrder: response.data.meta.sortOrder || 'ASC',
            loading: false,
          });
        } catch (error) {
          set({
            error: error.response?.data?.message || error.message,
            loading: false,
          });
          useToastStore.getState().showToast('Failed to fetch projects', 'error');
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Fetch Single Project
      ═════════════════════════════════════════════════════════════════════ */
      fetchSingleProject: async (projectId) => {
        
        set({ fetchingSingle: true, singleProjectError: null, singleProject: null, singleProjectInvoices: [], singleProjectSummary: null });

        try {
          const response = await api.get(`/projects/fetch-single-project?projectId=${projectId}`);

          set({
            singleProject: response.data.data.project,
            singleProjectInvoices: response.data.data.invoices || [],
            singleProjectSummary: response.data.data.summary || null,
            fetchingSingle: false,
          });

          return response.data.data;
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({
            singleProjectError: message,
            fetchingSingle: false,
          });
          useToastStore.getState().showToast(`Failed to fetch project: ${message}`, 'error');
          return null;
        }
      },

      clearSingleProject: () => set({ 
        singleProject: null, 
        singleProjectInvoices: [], 
        singleProjectSummary: null, 
        singleProjectError: null, 
        fetchingSingle: false 
      }),

      /* ═════════════════════════════════════════════════════════════════════
         Create Project
      ═════════════════════════════════════════════════════════════════════ */
      createProject: async (projectData) => {

        try {
          await api.post(
            '/projects/create-project',
            {
              project_name: projectData.project_name,
              project_code: projectData.project_code,
            }
          );

          useToastStore.getState().showToast('Project created successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to create project';
          useToastStore.getState().showToast(message, 'error');
          return false;
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Edit Project
      ═════════════════════════════════════════════════════════════════════ */
      editProject: async (projectData) => {

        try {
          await api.put(
            '/projects/edit-project',
            {
              id: projectData.id,
              project_name: projectData.project_name,
              project_code: projectData.project_code,
            }
          );

          useToastStore.getState().showToast('Project updated successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to update project';
          useToastStore.getState().showToast(message, 'error');
          return false;
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Bulk Delete
      ═════════════════════════════════════════════════════════════════════ */
      deleteSelectedItems: async () => {
        const { selectedItems } = get();

        try {
          await api.delete('/projects/delete-project', {
            data: { projectIds: selectedItems },
          });

          await get().fetchData();
          set({ selectedItems: [], selectedItemsData: {} });
          useToastStore.getState().showToast('Projects deleted successfully', 'success');
          return true;
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({ error: message });
          useToastStore.getState().showToast(`Failed to delete: ${message}`, 'error');
          return false;
        }
      },

      /* ═════════════════════════════════════════════════════════════════════
         Pagination Helpers
      ═════════════════════════════════════════════════════════════════════ */
      getCurrentPageData: () => get().data,

      getTotalPages: () => {
        const { itemsPerPage, total } = get();
        return Math.ceil(total / itemsPerPage);
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query, currentPage: 1 });
      },

      setSorting: (newSortBy, newSortOrder) => {
        set({ sortBy: newSortBy, sortOrder: newSortOrder, currentPage: 1 });
      },

      setCurrentPage: (page) => {
        set({ currentPage: page });
      },

      setItemsPerPage: (items) => {
        set({ itemsPerPage: items, currentPage: 1 });
      },

      /* ═════════════════════════════════════════════════════════════════════
         Selection
      ═════════════════════════════════════════════════════════════════════ */
      toggleItemSelection: (id) => {
        const { selectedItems, selectedItemsData, data } = get();
        const isSelected = selectedItems.includes(id);

        const updated = isSelected
          ? selectedItems.filter((item) => item !== id)
          : [...selectedItems, id];

        const updatedData = { ...selectedItemsData };
        if (isSelected) {
          delete updatedData[id];
        } else {
          const row = data.find((item) => item.id === id);
          if (row) updatedData[id] = row;
        }

        set({ selectedItems: updated, selectedItemsData: updatedData });
      },

      clearSelection: () => set({ selectedItems: [], selectedItemsData: {} }),

      getSelectedItemsData: () => Object.values(get().selectedItemsData),

      /* ═════════════════════════════════════════════════════════════════════
         Export to Excel
      ═════════════════════════════════════════════════════════════════════ */
      exportToExcel: () => {
        try {
          const data = get().data;
          const exportData = data.map((project) => ({
            'Project Name': project.project_name,
            'Project Code': project.project_code,
            'Code': project.code,
            'Created At': formatDateTime(project.created_at),
            'Created By': project.created_by,
            'Updated At': formatDateTime(project.updated_at),
            'Updated By': project.updated_by,
          }));

          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(exportData, { skipHeader: false });
          XLSX.utils.book_append_sheet(wb, ws, 'Projects');

          const fileName = `projects_export_${new Date().toISOString().split('T')[0]}.xlsx`;
          XLSX.writeFile(wb, fileName);
          useToastStore.getState().showToast('Data exported successfully', 'success');
        } catch (error) {
          useToastStore.getState().showToast('Failed to export data', 'error');
          console.error(error);
        }

        /* ── Helpers (scoped inside exportToExcel) ── */
        function formatDateTime(dateStr) {
          if (!dateStr) return '';
          const d = new Date(dateStr);
          return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}`;
        }
      },
    }),

    // ── Persist Configuration ──────────────────────────────────────────────
    {
      name: 'project-storage',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        itemsPerPage: state.itemsPerPage,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);

export default useProjectStore;