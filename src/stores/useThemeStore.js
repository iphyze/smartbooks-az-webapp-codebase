import { create } from "zustand";
import { persist } from "zustand/middleware";

const SUPPORTED_THEMES = new Set(["light", "dark"]);
const normalizeTheme = (theme) => (SUPPORTED_THEMES.has(theme) ? theme : "light");

const updateDocumentTheme = (theme) => {
  if (typeof document === "undefined") return;

  const safeTheme = normalizeTheme(theme);
  document.body.classList.remove("theme-dark", "theme-light");
  document.body.classList.add(`theme-${safeTheme}`);
  document.documentElement.dataset.theme = safeTheme;
  document.documentElement.style.colorScheme = safeTheme;
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: "light",

      setTheme: (theme) => {
        const safeTheme = normalizeTheme(theme);
        set({ theme: safeTheme });
        updateDocumentTheme(safeTheme);
      },

      toggleTheme: () => {
        const nextTheme = get().theme === "light" ? "dark" : "light";
        set({ theme: nextTheme });
        updateDocumentTheme(nextTheme);
      },

      init: () => {
        const safeTheme = normalizeTheme(get().theme);
        if (safeTheme !== get().theme) set({ theme: safeTheme });
        updateDocumentTheme(safeTheme);
      },
    }),
    {
      name: "theme-storage",
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return { state: { theme: "light" } };
          try {
            const value = window.localStorage.getItem(name);
            return value ? JSON.parse(value) : { state: { theme: "light" } };
          } catch (error) {
            window.localStorage.removeItem(name);
            return { state: { theme: "light" } };
          }
        },
        setItem: (name, value) => {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name) => {
          if (typeof window !== "undefined") window.localStorage.removeItem(name);
        },
      },
    }
  )
);

export default useThemeStore;
