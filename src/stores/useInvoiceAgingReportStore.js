import { create } from 'zustand';
import api from '../services/api';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';

/**
 * useInvoiceAgingReportStore
 *
 * Manages the Invoice Aging Report:
 *   GET  /invoice/reports/all-invoice-aging   — fetch full report (no pagination)
 *   GET  /invoice/reports/invoice-aging-excel — download Excel
 *
 * We use the non-paginated route because aging reports are grouped by client
 * (one row per client) so the dataset is naturally small, and grand totals
 * must reflect the entire dataset — not just one page.
 */
const useInvoiceAgingReportStore = create((set) => ({

  // ── State ──────────────────────────────────────────────────────────────────
  agingReport: {
    data:    [],      // array of { clients_id, clients_name, currency, bucket_0_30, … }
    totals:  null,    // { total_bucket_0_30, total_bucket_31_60, … grand_total_outstanding }
    meta:    null,    // { currency }
    loading: false,
    error:   null,
  },

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch the full aging report (no pagination).
   * Params: { currency }
   */
  fetchAgingReport: async (params) => {
    const token = useAuthStore.getState().token;
    set((s) => ({ agingReport: { ...s.agingReport, loading: true, error: null } }));

    try {
      const query = new URLSearchParams({ currency: params.currency });

      const res = await api.get(`/invoice/reports/all-invoice-aging?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Compute grand totals client-side so they always match the visible rows
      const rows = res.data.data || [];
      const totals = rows.reduce(
        (acc, row) => ({
          total_bucket_0_30:          acc.total_bucket_0_30          + (parseFloat(row.bucket_0_30)       || 0),
          total_bucket_31_60:         acc.total_bucket_31_60         + (parseFloat(row.bucket_31_60)      || 0),
          total_bucket_61_90:         acc.total_bucket_61_90         + (parseFloat(row.bucket_61_90)      || 0),
          total_bucket_91_plus:       acc.total_bucket_91_plus       + (parseFloat(row.bucket_91_plus)    || 0),
          grand_total_outstanding:    acc.grand_total_outstanding    + (parseFloat(row.total_outstanding) || 0),
        }),
        {
          total_bucket_0_30:       0,
          total_bucket_31_60:      0,
          total_bucket_61_90:      0,
          total_bucket_91_plus:    0,
          grand_total_outstanding: 0,
        }
      );

      set({
        agingReport: {
          data:    rows,
          totals,
          meta:    { currency: params.currency },
          loading: false,
          error:   null,
        },
      });

      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch invoice aging report';
      set((s) => ({ agingReport: { ...s.agingReport, loading: false, error: msg } }));
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  /**
   * Download the Excel version of the aging report.
   * Params: { currency }
   */
  downloadAgingExcel: async (params) => {
    const token = useAuthStore.getState().token;
    try {
      const query = new URLSearchParams({ currency: params.currency });

      const res = await api.get(`/invoice/reports/invoice-aging-excel?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        responseType: 'blob',
      });

      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `Invoice_Aging_Report_${params.currency}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      useToastStore.getState().showToast('Excel downloaded successfully', 'success');
      return true;
    } catch (err) {
      useToastStore.getState().showToast(
        err.response?.data?.message || 'Failed to download Excel',
        'error'
      );
      return false;
    }
  },

  // ── Reset ──────────────────────────────────────────────────────────────────
  resetAgingReport: () =>
    set({ agingReport: { data: [], totals: null, meta: null, loading: false, error: null } }),

}));

export default useInvoiceAgingReportStore;