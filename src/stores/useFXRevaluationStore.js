import { create } from 'zustand';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';
import api from '../services/api';

/**
 * FX Revaluation Store
 * Handles GET /exchange/get-revaluation (preview) and
 *         POST /exchange/post-revaluation (post journal)
 *
 * RATE SELECTION:
 * The frontend (FXRevaluation.jsx) uses useRateSearchStore to load available
 * rate records. The user picks one, and its `created_at` timestamp is passed
 * here as `rate_date`. The backend looks up that specific rate row from
 * currency_table using `rate_date`, extracts the correct FCY column value,
 * and uses it as the closing rate — instead of always defaulting to the
 * most recent record.
 *
 * Both GET and POST pass `rate_date` so the preview and the posted journal
 * always use the same rate the user selected.
 */
const useFXRevaluationStore = create((set) => ({

  /* ── State ──────────────────────────────────────────────────────── */
  preview: {
    data: {},
    summary: null,
    pendingJournals: [],
    closingRateInfo: null,
    meta: null,
    loading: false,
    error: null,
  },

  posting: {
    loading: false,
    error: null,
    result: null,
  },

  /* ── Actions ────────────────────────────────────────────────────── */

  /**
   * GET /exchange/get-revaluation
   * Params: { datefrom, dateto, currency, rate_date? }
   *
   * rate_date — the `created_at` value of the rate record the user selected.
   *             When provided, the backend fetches that specific row from
   *             currency_table instead of the latest one.
   *             When omitted, the backend falls back to ORDER BY created_at DESC.
   */
  fetchRevaluation: async (params) => {
    const token = useAuthStore.getState().token;
    set((s) => ({ preview: { ...s.preview, loading: true, error: null } }));

    try {
      const queryParams = {
        datefrom: params.datefrom,
        dateto: params.dateto,
        currency: params.currency,
      };

      // Only include rate_date if the user actually selected one
      if (params.rate_date) {
        queryParams.rate_date = params.rate_date;
      }

      const query = new URLSearchParams(queryParams);

      const res = await api.get(`/exchange/get-revaluation?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({
        preview: {
          data: res.data.data || {},
          summary: res.data.summary || null,
          pendingJournals: res.data.pending_journals || [],
          closingRateInfo: res.data.closing_rate_info || null,
          meta: res.data.meta || null,
          loading: false,
          error: null,
        },
      });

      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch FX revaluation data';
      set((s) => ({ preview: { ...s.preview, loading: false, error: msg } }));
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  /**
   * POST /exchange/post-revaluation
   * Body: {
   *   datefrom, dateto, currency,
   *   journal_date, journal_description, cost_center?,
   *   rate_date?   ← same value the user selected for the preview
   * }
   *
   * The backend re-derives the closing rate from rate_date server-side,
   * so the posted journal always matches the previewed numbers exactly.
   */
  postRevaluation: async (body) => {
    const token = useAuthStore.getState().token;
    set((s) => ({ posting: { ...s.posting, loading: true, error: null, result: null } }));

    try {
      const res = await api.post('/exchange/post-revaluation', body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      set({
        posting: {
          loading: false,
          error: null,
          result: res.data,
        },
      });

      useToastStore.getState().showToast(
        `FX Revaluation posted — Journal ${res.data.journal_id}`,
        'success'
      );

      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to post FX revaluation journal';
      set((s) => ({ posting: { ...s.posting, loading: false, error: msg } }));
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  /* Reset preview when params change before re-fetch */
  resetPreview: () =>
    set({
      preview: {
        data: {}, summary: null, pendingJournals: [],
        closingRateInfo: null, meta: null, loading: false, error: null,
      },
    }),
}));

export default useFXRevaluationStore;