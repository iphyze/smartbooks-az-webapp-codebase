import { create } from 'zustand';
import api from '../services/api';
import useToastStore from './useToastStore';

const emptyReport = {
    data: [],
    summary: null,
    meta: null,
    pagination: null,
    loading: false,
    error: null,
};

const normalizeParams = (params = {}) => ({
    datefrom: params.datefrom,
    dateto: params.dateto,
    staff: params.staff || 'All Staff',
    search: params.search || '',
});

const normalizePagination = (pagination, fallback = {}) => {
    if (!pagination) {
        return {
            page: Number(fallback.page || 1),
            limit: Number(fallback.limit || 25),
            total: 0,
            pages: 1,
        };
    }

    return {
        page: Number(pagination.page || fallback.page || 1),
        limit: Number(pagination.limit || fallback.limit || 25),
        total: Number(pagination.total || 0),
        pages: Number(pagination.pages || pagination.total_pages || 1),
    };
};

const useTimesheetReportStore = create((set) => ({
    timesheetReport: { ...emptyReport },

    /**
     * Fetch the full filtered report.
     * Use this only for exports/PDF preparation, not for the visible report table.
     */
    fetchAllTimesheetReport: async (params) => {
        const cleanParams = normalizeParams(params);

        set((s) => ({
            timesheetReport: {
                ...s.timesheetReport,
                loading: true,
                error: null,
            },
        }));

        try {
            const query = new URLSearchParams(cleanParams);
            const res = await api.get(`/timesheet/reports/all-timesheet-report?${query}`);

            set({
                timesheetReport: {
                    data: res.data.data || [],
                    summary: res.data.summary || null,
                    meta: res.data.meta || cleanParams,
                    pagination: null,
                    loading: false,
                    error: null,
                },
            });

            return res.data;
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to fetch timesheet report';
            set((s) => ({
                timesheetReport: {
                    ...s.timesheetReport,
                    loading: false,
                    error: msg,
                },
            }));
            useToastStore.getState().showToast(msg, 'error');
            return null;
        }
    },

    /**
     * Fetch the visible report table using pagination.
     * Summary remains full-period summary from the backend, while data is the current page.
     */
    fetchPaginatedTimesheetReport: async (params = {}) => {
        const cleanParams = normalizeParams(params);
        const page = Number(params.page || 1);
        const limit = Number(params.limit || 25);

        const query = new URLSearchParams({
            ...cleanParams,
            page,
            limit,
        });

        set((s) => ({
            timesheetReport: {
                ...s.timesheetReport,
                loading: true,
                error: null,
            },
        }));

        try {
            const res = await api.get(`/timesheet/reports/timesheet-report?${query}`);

            set({
                timesheetReport: {
                    data: res.data.data || [],
                    summary: res.data.summary || null,
                    meta: res.data.meta || cleanParams,
                    pagination: normalizePagination(res.data.pagination, { page, limit }),
                    loading: false,
                    error: null,
                },
            });

            return res.data;
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to fetch paginated timesheet report';
            set((s) => ({
                timesheetReport: {
                    ...s.timesheetReport,
                    loading: false,
                    error: msg,
                },
            }));
            useToastStore.getState().showToast(msg, 'error');
            return null;
        }
    },

    /**
     * Export helper for PDF.
     * Does not mutate the visible paginated report state.
     */
    fetchTimesheetReportForExport: async (params) => {
        const cleanParams = normalizeParams(params);

        try {
            const query = new URLSearchParams(cleanParams);
            const res = await api.get(`/timesheet/reports/all-timesheet-report?${query}`);

            return res.data;
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to prepare timesheet PDF';
            useToastStore.getState().showToast(msg, 'error');
            return null;
        }
    },

    /**
     * Excel export already uses the full filtered export route.
     */
    downloadTimesheetExcel: async (params) => {
        const cleanParams = normalizeParams(params);

        try {
            const query = new URLSearchParams(cleanParams);
            const res = await api.get(`/timesheet/reports/timesheet-excel?${query}`, {
                headers: {
                    Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Timesheet_Report_${cleanParams.datefrom}_to_${cleanParams.dateto}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            useToastStore.getState().showToast('Timesheet Excel downloaded successfully', 'success');
            return true;
        } catch (err) {
            useToastStore.getState().showToast(
                err.response?.data?.message || 'Failed to download timesheet Excel',
                'error'
            );
            return false;
        }
    },

    resetTimesheetReport: () => set({ timesheetReport: { ...emptyReport } }),
}));

export default useTimesheetReportStore;
