import { create } from "zustand";
import api from "../services/api";

let configurationRequest = null;

const usePermissionsStore = create((set, get) => ({
  catalogue: [],
  roles: [],
  loading: false,
  loaded: false,
  error: null,

  loadConfiguration: async ({ force = false } = {}) => {
    if (get().loaded && !force) {
      return { success: true, catalogue: get().catalogue, roles: get().roles };
    }
    if (configurationRequest && !force) return configurationRequest;

    set({ loading: true, error: null });
    configurationRequest = Promise.all([
      api.get("/permissions/catalog"),
      api.get("/permissions/roles"),
    ])
      .then(([catalogueResponse, rolesResponse]) => {
        const catalogue = catalogueResponse.data?.data || [];
        const roles = rolesResponse.data?.data || [];
        set({ catalogue, roles, loading: false, loaded: true, error: null });
        return { success: true, catalogue, roles };
      })
      .catch((error) => {
        const message = error.response?.data?.message || "Failed to load permissions.";
        set({ loading: false, error: message });
        return { success: false, message, catalogue: [], roles: [] };
      })
      .finally(() => {
        configurationRequest = null;
      });

    return configurationRequest;
  },

  clearError: () => set({ error: null }),
}));

export default usePermissionsStore;
