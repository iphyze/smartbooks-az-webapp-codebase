import { create } from "zustand";
import api from "../services/api";

const DEFAULT_FILTERS = {
  search: "",
  module: "all",
  action_type: "all",
  user_id: 0,
  date_from: "",
  date_to: "",
  page: 1,
  limit: 15,
  sortBy: "created_at",
  sortOrder: "DESC",
};

const toQuery = (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined && value !== "all" && value !== 0) {
      params.set(key, String(value));
    }
  });
  params.set("page", String(filters.page || 1));
  params.set("limit", String(filters.limit || 15));
  params.set("sortBy", filters.sortBy || "created_at");
  params.set("sortOrder", filters.sortOrder || "DESC");
  return params.toString();
};

const useActivityLogsStore = create((set, get) => ({
  items: [],
  meta: { total: 0, page: 1, limit: 15, pages: 1 },
  summary: { total_all: 0, today_count: 0, active_users: 0, critical_count: 0 },
  filterOptions: { modules: [], action_types: [], users: [] },
  filters: { ...DEFAULT_FILTERS },
  loading: false,
  exporting: false,
  error: null,

  setFilter: (name, value, resetPage = true) => set((state) => ({
    filters: {
      ...state.filters,
      [name]: value,
      ...(resetPage ? { page: 1 } : {}),
    },
  })),

  setFilters: (values) => set((state) => ({
    filters: { ...state.filters, ...values },
  })),

  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  fetchLogs: async (overrides = {}) => {
    const filters = { ...get().filters, ...overrides };
    set({ loading: true, error: null, filters });
    try {
      const response = await api.get(`/activity-logs/list?${toQuery(filters)}`);
      set({
        items: response.data?.data || [],
        meta: response.data?.meta || { total: 0, page: 1, limit: filters.limit, pages: 1 },
        summary: response.data?.summary || get().summary,
        filterOptions: response.data?.filter_options || get().filterOptions,
        loading: false,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || "Activity logs could not be loaded.";
      set({ loading: false, error: message, items: [] });
      throw error;
    }
  },

  exportLogs: async () => {
    const filters = get().filters;
    set({ exporting: true, error: null });
    try {
      const response = await api.get(`/activity-logs/export?${toQuery({ ...filters, page: 1, limit: 5000 })}`, {
        responseType: "blob",
      });
      const disposition = response.headers?.["content-disposition"] || "";
      const matchedName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
      const filename = matchedName || `smartbooks_activity_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      set({ exporting: false });
      return true;
    } catch (error) {
      const message = error.response?.data?.message || "Activity logs could not be exported.";
      set({ exporting: false, error: message });
      throw error;
    }
  },
}));

export { DEFAULT_FILTERS };
export default useActivityLogsStore;
