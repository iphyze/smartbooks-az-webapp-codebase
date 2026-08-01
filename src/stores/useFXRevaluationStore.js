import { create } from "zustand";
import api from "../services/api";
import useToastStore from "./useToastStore";

const emptyPreview = {
  data: {},
  summary: null,
  pendingJournals: [],
  closingRateInfo: null,
  periodStatus: null,
  meta: null,
  previewToken: null,
  warnings: [],
  realizedData: [],
  realizedSummary: null,
  pendingManualJournals: [],
  pendingManualSummary: null,
  combinedSummary: null,
  loading: false,
  error: null,
};

const useFXRevaluationStore = create((set) => ({
  preview: { ...emptyPreview },

  posting: {
    loading: false,
    error: null,
    result: null,
  },

  reversing: {
    loading: false,
    error: null,
    result: null,
  },

  fetchRevaluation: async (params) => {
    set((state) => ({
      preview: {
        ...state.preview,
        loading: true,
        error: null,
      },
    }));

    try {
      const queryParams = {
        datefrom: params.datefrom,
        dateto: params.dateto,
        currency: params.currency,
      };

      if (params.rate_id) queryParams.rate_id = params.rate_id;
      else if (params.rate_date) queryParams.rate_date = params.rate_date;

      const query = new URLSearchParams(queryParams);
      const response = await api.get(`/exchange/get-revaluation?${query.toString()}`);
      const payload = response.data || {};
      const realized = payload.realized || {};
      const unrealized = payload.unrealized || {};

      set({
        preview: {
          // Backward-compatible fields still represent the postable unrealized preview.
          data: unrealized.data || payload.data || {},
          summary: unrealized.summary || payload.summary || null,
          pendingJournals:
            unrealized.pending_journals || payload.pending_journals || [],
          closingRateInfo: payload.closing_rate_info || null,
          periodStatus: payload.period_status || null,
          meta: payload.meta || null,
          previewToken:
            unrealized.preview_token || payload.preview_token || null,
          warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
          realizedData:
            realized.data || payload.realized_data || [],
          realizedSummary:
            realized.summary || payload.realized_summary || null,
          pendingManualJournals:
            realized.pending_manual_journals ||
            payload.pending_manual_journals ||
            [],
          pendingManualSummary:
            realized.pending_manual_summary ||
            payload.pending_manual_summary ||
            null,
          combinedSummary: payload.combined_summary || null,
          loading: false,
          error: null,
        },
      });

      return payload;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to prepare the FX gain/loss review.";

      set((state) => ({
        preview: {
          ...state.preview,
          loading: false,
          error: message,
        },
      }));
      useToastStore.getState().showToast(message, "error");
      return null;
    }
  },

  postRevaluation: async (body) => {
    set((state) => ({
      posting: {
        ...state.posting,
        loading: true,
        error: null,
        result: null,
      },
    }));

    try {
      const response = await api.post("/exchange/post-revaluation", body);
      const payload = response.data || {};

      set({
        posting: {
          loading: false,
          error: null,
          result: payload,
        },
      });

      if (payload.journal_id) {
        const summary = payload.summary || {};
        const netAmount = Math.abs(Number(summary.net_fx_ngn || 0)).toLocaleString(
          "en-NG",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        );
        useToastStore
          .getState()
          .showToast(
            `Unrealized FX revaluation posted — Journal ${payload.journal_id} · ${
              summary.net_label || "Net Exchange"
            }: ₦${netAmount}`,
            "success"
          );
      } else {
        useToastStore
          .getState()
          .showToast(payload.message || "No unrealized FX journal was required.", "success");
      }

      return payload;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to post the unrealized FX revaluation journal.";
      set((state) => ({
        posting: {
          ...state.posting,
          loading: false,
          error: message,
        },
      }));
      useToastStore.getState().showToast(message, "error");
      return null;
    }
  },

  reverseRevaluation: async (body) => {
    set((state) => ({
      reversing: {
        ...state.reversing,
        loading: true,
        error: null,
        result: null,
      },
    }));

    try {
      const response = await api.post("/exchange/reverse-revaluation", body);
      const payload = response.data || {};

      set({
        reversing: {
          loading: false,
          error: null,
          result: payload,
        },
      });

      useToastStore
        .getState()
        .showToast(
          `Unrealized FX journal ${body.journal_id} reversed — Reversal Journal ${payload.reversal_journal_id}`,
          "success"
        );

      return payload;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to reverse the unrealized FX revaluation journal.";
      set((state) => ({
        reversing: {
          ...state.reversing,
          loading: false,
          error: message,
        },
      }));
      useToastStore.getState().showToast(message, "error");
      return null;
    }
  },

  resetPreview: () => set({ preview: { ...emptyPreview } }),

  clearPostingResult: () =>
    set((state) => ({
      posting: {
        ...state.posting,
        result: null,
      },
    })),

  resetReversal: () =>
    set({
      reversing: {
        loading: false,
        error: null,
        result: null,
      },
    }),
}));

export default useFXRevaluationStore;
