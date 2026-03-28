import { create } from 'zustand';

const useToastStore = create((set) => ({
  toasts: [],
  showToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          message,
          type,
          createdAt: new Date()
        }
      ]
    }));

    // Auto remove after 10 seconds
    setTimeout(() => {
      // Dispatch a custom event to trigger the animation
      window.dispatchEvent(new CustomEvent('hideToast', { detail: { id } }));
    }, 10000);
  },
  hideToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }));
  }
}));

export default useToastStore;