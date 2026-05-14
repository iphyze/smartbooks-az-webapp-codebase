import { create } from 'zustand';
import api from '../services/api';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';

const emptyTotals = {
  total_bucket_0_30: 0,
  total_bucket_31_60: 0,
  total_bucket_61_90: 0,
  total_bucket_91_plus: 0,
  grand_total_outstanding: 0,
  invoice_count: 0,
  pending_count: 0,
  partially_paid_count: 0,
  overdue_count: 0,
  client_count: 0,
  overdue_exposure: 0,
  overdue_exposure_percent: 0,
  high_risk_exposure_percent: 0,
};

const numberValue = (value) => Number(value || 0);

const buildTotalsFromRows = (rows = []) => {
  const totals = rows.reduce(
    (acc, row) => {
      acc.total_bucket_0_30 += numberValue(row.bucket_0_30);
      acc.total_bucket_31_60 += numberValue(row.bucket_31_60);
      acc.total_bucket_61_90 += numberValue(row.bucket_61_90);
      acc.total_bucket_91_plus += numberValue(row.bucket_91_plus);
      acc.grand_total_outstanding += numberValue(row.total_outstanding);
      acc.invoice_count += numberValue(row.invoice_count);
      acc.pending_count += numberValue(row.pending_count);
      acc.partially_paid_count += numberValue(row.partially_paid_count);
      acc.overdue_count += numberValue(row.overdue_count);
      return acc;
    },
    { ...emptyTotals, client_count: rows.length }
  );

  totals.overdue_exposure =
    totals.total_bucket_31_60 + totals.total_bucket_61_90 + totals.total_bucket_91_plus;

  if (totals.grand_total_outstanding > 0) {
    totals.overdue_exposure_percent = Number(
      ((totals.overdue_exposure / totals.grand_total_outstanding) * 100).toFixed(2)
    );
    totals.high_risk_exposure_percent = Number(
      ((totals.total_bucket_91_plus / totals.grand_total_outstanding) * 100).toFixed(2)
    );
  }

  return totals;
};

const useInvoiceAgingReportStore = create((set) => ({
  agingReport: {
    data: [],
    totals: null,
    meta: null,
    loading: false,
    error: null,
  },

  fetchAgingReport: async (params) => {
    const token = useAuthStore.getState().token;
    set((s) => ({ agingReport: { ...s.agingReport, loading: true, error: null } }));

    try {
      const query = new URLSearchParams({ currency: params.currency });
      const res = await api.get(`/invoice/reports/all-invoice-aging?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      const totals = res.data?.totals || buildTotalsFromRows(rows);

      set({
        agingReport: {
          data: rows,
          totals,
          meta: {
            currency: params.currency,
            as_of_date: res.data?.meta?.as_of_date,
            aging_basis: res.data?.meta?.aging_basis,
            outstanding_basis: res.data?.meta?.outstanding_basis,
            included_statuses: res.data?.meta?.included_statuses || ['Pending', 'Partially Paid', 'Overdue'],
            excluded_statuses: res.data?.meta?.excluded_statuses || ['Paid', 'Cancelled'],
          },
          loading: false,
          error: null,
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

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10).replaceAll('-', '');
      link.href = url;
      link.setAttribute('download', `Invoice_Aging_Report_${params.currency}_${today}.xlsx`);
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

  resetAgingReport: () =>
    set({ agingReport: { data: [], totals: null, meta: null, loading: false, error: null } }),
}));

export default useInvoiceAgingReportStore;
