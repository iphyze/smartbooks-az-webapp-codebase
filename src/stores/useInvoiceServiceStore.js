import { create } from "zustand";
import api from "../services/api";

const useInvoiceServiceStore = create((set, get) => ({
  services: [],
  isLoading: false,
  error: null,
  lastCurrency: "",
  lastSearch: "",

  fetchServices: async ({ currency = "", search = "", includeInactive = false } = {}) => {
    const normalizedCurrency = String(currency || "").toUpperCase();
    const normalizedSearch = String(search || "").trim();
    set({ isLoading: true, error: null });

    try {
      const response = await api.get("/invoice/service-catalogue", {
        params: {
          currency: normalizedCurrency,
          search: normalizedSearch,
          include_inactive: includeInactive,
          limit: 150,
        },
      });
      const services = Array.isArray(response.data?.data) ? response.data.data : [];
      set({
        services,
        isLoading: false,
        lastCurrency: normalizedCurrency,
        lastSearch: normalizedSearch,
      });
      return services;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to load reusable invoice services.";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createService: async (payload) => {
    const response = await api.post("/invoice/create-service", payload);
    const created = response.data?.data;
    if (created) {
      set((state) => ({
        services: [created, ...state.services.filter((service) => service.id !== created.id)],
      }));
    }
    return created;
  },

  updateService: async (payload) => {
    const response = await api.put("/invoice/update-service", payload);
    const updated = response.data?.data;
    if (updated) {
      set((state) => ({
        services: state.services.map((service) => (service.id === updated.id ? updated : service)),
      }));
    }
    return updated;
  },

  clearServices: () => set({ services: [], error: null, lastCurrency: "", lastSearch: "" }),
}));

export default useInvoiceServiceStore;
