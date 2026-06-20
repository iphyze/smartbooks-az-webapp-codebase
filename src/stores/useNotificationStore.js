import { create } from 'zustand';
import api from '../services/api';
import useToastStore from './useToastStore';

const initialState = {
  recent: [],
  items: [],
  counts: {
    total_count: 0,
    unread_count: 0,
    unseen_count: 0,
  },
  meta: {
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 1,
    has_more: false,
  },
  filter: 'all',
  summaryLoading: false,
  listLoading: false,
  loadingMore: false,
  initialized: false,
  error: null,
};

const normalizeCounts = (counts = {}) => ({
  total_count: Number(counts.total_count) || 0,
  unread_count: Number(counts.unread_count) || 0,
  unseen_count: Number(counts.unseen_count) || 0,
});

const normalizeMeta = (meta = {}) => ({
  page: Number(meta.page) || 1,
  limit: Number(meta.limit) || 20,
  total: Number(meta.total) || 0,
  total_pages: Number(meta.total_pages) || 1,
  has_more: Boolean(meta.has_more),
});

const updateNotification = (collection, notificationId, changes) =>
  collection.map((item) => (
    Number(item.id) === Number(notificationId) ? { ...item, ...changes } : item
  ));

const removeNotification = (collection, notificationId) =>
  collection.filter((item) => Number(item.id) !== Number(notificationId));

const useNotificationStore = create((set, get) => ({
  ...initialState,

  fetchSummary: async ({ silent = false } = {}) => {
    if (!silent) set({ summaryLoading: true, error: null });

    try {
      const response = await api.get('/notifications/summary?limit=8');
      const payload = response.data?.data || {};
      set({
        recent: Array.isArray(payload.items) ? payload.items : [],
        counts: normalizeCounts(payload.counts),
        summaryLoading: false,
        initialized: true,
        error: null,
      });
      return true;
    } catch (error) {
      set({
        summaryLoading: false,
        initialized: true,
        error: error.response?.data?.message || 'Unable to load notifications.',
      });
      return false;
    }
  },

  fetchNotifications: async ({ page = 1, filter = get().filter, append = false } = {}) => {
    set(append
      ? { loadingMore: true, error: null }
      : { listLoading: true, error: null, filter }
    );

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        filter,
      });
      const response = await api.get(`/notifications/list?${params.toString()}`);
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      const meta = response.data?.meta || {};

      set((state) => ({
        items: append ? [...state.items, ...data] : data,
        meta: normalizeMeta(meta),
        counts: normalizeCounts(meta),
        filter,
        listLoading: false,
        loadingMore: false,
        error: null,
      }));
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to load notifications.';
      set({ listLoading: false, loadingMore: false, error: message });
      useToastStore.getState().showToast(message, 'error');
      return false;
    }
  },

  setFilter: async (filter) => {
    if (!['all', 'unread', 'read'].includes(filter)) return;
    set({ filter, items: [], meta: { ...initialState.meta } });
    await get().fetchNotifications({ page: 1, filter, append: false });
  },

  markSeen: async (ids = []) => {
    const validIds = [...new Set(ids.map(Number).filter((id) => id > 0))];
    if (!validIds.length) return true;

    const now = new Date().toISOString();
    set((state) => ({
      recent: state.recent.map((item) => (
        validIds.includes(Number(item.id)) ? { ...item, is_seen: true, seen_at: item.seen_at || now } : item
      )),
      items: state.items.map((item) => (
        validIds.includes(Number(item.id)) ? { ...item, is_seen: true, seen_at: item.seen_at || now } : item
      )),
      counts: { ...state.counts, unseen_count: Math.max(0, state.counts.unseen_count - validIds.length) },
    }));

    try {
      const response = await api.patch('/notifications/mark-seen', { ids: validIds });
      if (response.data?.data?.counts) {
        set({ counts: normalizeCounts(response.data.data.counts) });
      }
      return true;
    } catch {
      get().fetchSummary({ silent: true });
      return false;
    }
  },

  markRead: async (notificationId) => {
    const target = [...get().recent, ...get().items]
      .find((item) => Number(item.id) === Number(notificationId));
    const wasUnread = target ? !target.is_read : true;
    const wasUnseen = target ? !target.is_seen : true;
    const now = new Date().toISOString();

    set((state) => {
      const removeFromUnreadFilter = state.filter === 'unread' && wasUnread;
      return {
        recent: updateNotification(state.recent, notificationId, {
          is_read: true,
          is_seen: true,
          read_at: target?.read_at || now,
          seen_at: target?.seen_at || now,
        }),
        items: removeFromUnreadFilter
          ? removeNotification(state.items, notificationId)
          : updateNotification(state.items, notificationId, {
            is_read: true,
            is_seen: true,
            read_at: target?.read_at || now,
            seen_at: target?.seen_at || now,
          }),
        counts: {
          ...state.counts,
          unread_count: wasUnread ? Math.max(0, state.counts.unread_count - 1) : state.counts.unread_count,
          unseen_count: wasUnseen ? Math.max(0, state.counts.unseen_count - 1) : state.counts.unseen_count,
        },
        meta: removeFromUnreadFilter
          ? { ...state.meta, total: Math.max(0, state.meta.total - 1) }
          : state.meta,
      };
    });

    try {
      const response = await api.patch('/notifications/mark-read', { id: Number(notificationId) });
      if (response.data?.data?.counts) {
        set({ counts: normalizeCounts(response.data.data.counts) });
      }
      return true;
    } catch (error) {
      await Promise.all([
        get().fetchSummary({ silent: true }),
        get().fetchNotifications({ page: 1, filter: get().filter, append: false }),
      ]);
      useToastStore.getState().showToast(
        error.response?.data?.message || 'Unable to update the notification.',
        'error'
      );
      return false;
    }
  },

  markAllRead: async () => {
    if (get().counts.unread_count <= 0) return true;
    const now = new Date().toISOString();

    set((state) => ({
      recent: state.recent.map((item) => ({
        ...item,
        is_read: true,
        is_seen: true,
        read_at: item.read_at || now,
        seen_at: item.seen_at || now,
      })),
      items: state.filter === 'unread'
        ? []
        : state.items.map((item) => ({
          ...item,
          is_read: true,
          is_seen: true,
          read_at: item.read_at || now,
          seen_at: item.seen_at || now,
        })),
      counts: { ...state.counts, unread_count: 0, unseen_count: 0 },
      meta: state.filter === 'unread'
        ? { ...state.meta, total: 0, total_pages: 1, has_more: false }
        : state.meta,
    }));

    try {
      const response = await api.patch('/notifications/mark-all-read');
      if (response.data?.data?.counts) {
        set({ counts: normalizeCounts(response.data.data.counts) });
      }
      useToastStore.getState().showToast('All notifications marked as read.', 'success');
      return true;
    } catch (error) {
      await Promise.all([
        get().fetchSummary({ silent: true }),
        get().fetchNotifications({ page: 1, filter: get().filter, append: false }),
      ]);
      useToastStore.getState().showToast(
        error.response?.data?.message || 'Unable to mark all notifications as read.',
        'error'
      );
      return false;
    }
  },

  dismiss: async (notificationId) => {
    const target = [...get().recent, ...get().items]
      .find((item) => Number(item.id) === Number(notificationId));

    set((state) => ({
      recent: removeNotification(state.recent, notificationId),
      items: removeNotification(state.items, notificationId),
      counts: {
        total_count: Math.max(0, state.counts.total_count - 1),
        unread_count: target && !target.is_read
          ? Math.max(0, state.counts.unread_count - 1)
          : state.counts.unread_count,
        unseen_count: target && !target.is_seen
          ? Math.max(0, state.counts.unseen_count - 1)
          : state.counts.unseen_count,
      },
      meta: {
        ...state.meta,
        total: Math.max(0, state.meta.total - 1),
      },
    }));

    try {
      const response = await api.delete('/notifications/dismiss', {
        data: { id: Number(notificationId) },
      });
      if (response.data?.data?.counts) {
        set({ counts: normalizeCounts(response.data.data.counts) });
      }
      return true;
    } catch (error) {
      await Promise.all([
        get().fetchSummary({ silent: true }),
        get().fetchNotifications({ page: 1, filter: get().filter, append: false }),
      ]);
      useToastStore.getState().showToast(
        error.response?.data?.message || 'Unable to dismiss the notification.',
        'error'
      );
      return false;
    }
  },

  loadMore: async () => {
    const { meta, filter, loadingMore } = get();
    if (!meta.has_more || loadingMore) return;
    await get().fetchNotifications({ page: meta.page + 1, filter, append: true });
  },

  reset: () => set({ ...initialState }),
}));

export default useNotificationStore;
