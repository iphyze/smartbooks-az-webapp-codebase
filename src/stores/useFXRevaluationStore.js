import { create } from 'zustand';
import useToastStore from './useToastStore';
import api from '../services/api';

const useFXRevaluationStore = create((set) => ({

  /* ── State ──────────────────────────────────────────────────────── */
  preview: {
    data:            {},
    summary:         null,
    pendingJournals: [],
    closingRateInfo: null,
    periodStatus:    null,
    meta:            null,
    loading:         false,
    error:           null,
  },

  posting: {
    loading: false,
    error:   null,
    result:  null,
  },

  postingZero: {
    loading: false,
    error:   null,
    result:  null,
  },

  // NEW: reversal state
  reversing: {
    loading: false,
    error:   null,
    result:  null,
  },

  /* ── Actions ────────────────────────────────────────────────────── */

  /**
   * GET /exchange/get-revaluation
   * Params: { datefrom, dateto, currency, rate_date? }
   */
  fetchRevaluation: async (params) => {
    set((s) => ({ preview: { ...s.preview, loading: true, error: null } }));

    try {
      const queryParams = {
        datefrom: params.datefrom,
        dateto:   params.dateto,
        currency: params.currency,
      };

      if (params.rate_date) {
        queryParams.rate_date = params.rate_date;
      }

      const query = new URLSearchParams(queryParams);

      const res = await api.get(`/exchange/get-revaluation?${query}`);

      set({
        preview: {
          data:            res.data.data             || {},
          summary:         res.data.summary          || null,
          pendingJournals: res.data.pending_journals  || [],
          closingRateInfo: res.data.closing_rate_info || null,
          periodStatus:    res.data.period_status    || null,
          meta:            res.data.meta             || null,
          loading:         false,
          error:           null,
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
   * Body: { datefrom, dateto, currency, journal_date, journal_description, cost_center?, rate_date? }
   */
  postRevaluation: async (body) => {
    set((s) => ({ posting: { ...s.posting, loading: true, error: null, result: null } }));

    try {
      const res = await api.post('/exchange/post-revaluation', body);

      set({
        posting: {
          loading: false,
          error:   null,
          result:  res.data,
        },
      });

      const s        = res.data.summary || {};
      const netLabel = s.net_label || 'Net Exchange';
      const netAmt   = Math.abs(s.net_fx_ngn || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
      useToastStore.getState().showToast(
        `FX Revaluation posted — Journal ${res.data.journal_id} · ${netLabel}: ₦${netAmt}`,
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

  /**
   * POST /exchange/post-zero-revaluation
   * Posts a memo-line audit approach where the affected ledgers receive zero-value
   * audit lines while the net FX effect is recognised in Exchange Gain/Loss.
   */
  postZeroRevaluation: async (body) => {
    set((s) => ({ postingZero: { ...s.postingZero, loading: true, error: null, result: null } }));

    try {
      const res = await api.post('/exchange/post-zero-revaluation', body);
      set({ postingZero: { loading: false, error: null, result: res.data } });
      useToastStore.getState().showToast(
        `Zero-entry FX audit journal posted — ${res.data.journal_id}`,
        'success'
      );
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to post zero-entry FX journal';
      set((s) => ({ postingZero: { ...s.postingZero, loading: false, error: msg } }));
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  /**
   * POST /exchange/reverse-revaluation
   * Body: { journal_id, reversal_date, reversal_description }
   *
   * Reverses a previously posted FX Revaluation journal by inserting
   * mirror-image lines under a new journal_id. After a successful reversal
   * the duplicate guard is cleared, allowing a fresh revaluation to be
   * posted for the same period.
   */
  reverseRevaluation: async (body) => {
    set((s) => ({ reversing: { ...s.reversing, loading: true, error: null, result: null } }));

    try {
      const res = await api.post('/exchange/reverse-revaluation', body);

      set({
        reversing: {
          loading: false,
          error:   null,
          result:  res.data,
        },
      });

      useToastStore.getState().showToast(
        `Journal ${body.journal_id} reversed — Reversal Journal: ${res.data.reversal_journal_id}`,
        'success'
      );

      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reverse FX revaluation';
      set((s) => ({ reversing: { ...s.reversing, loading: false, error: msg } }));
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  /* Reset preview when params change before re-fetch */
  resetPreview: () =>
    set({
      preview: {
        data: {}, summary: null, pendingJournals: [],
        closingRateInfo: null, periodStatus: null,
        meta: null, loading: false, error: null,
      },
    }),

  resetReversal: () =>
    set({ reversing: { loading: false, error: null, result: null } }),

}));

export default useFXRevaluationStore;