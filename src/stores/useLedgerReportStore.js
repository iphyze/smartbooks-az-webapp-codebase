import { create } from 'zustand';
import api from '../services/api';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';

/**
 * useLedgerReportStore
 * Manages all ledger report fetches:
 *  - Ledger Statement  (/ledger/reports/ledger-reports)
 *  - General Ledger    (/ledger/reports/general-ledger-reports)
 *  - Trial Balance     (/ledger/reports/trial-balance)
 *  - P&L               (/ledger/reports/pl-reports)
 *  - Balance Sheet     (/ledger/reports/balance-sheet-reports)
 */
const useLedgerReportStore = create((set, get) => ({

  // ── Ledger Statement ─────────────────────────────────────────────────────
  ledgerStatement: {
    data: [],
    title: '',
    meta: null,
    loading: false,
    error: null,
  },

  // ── General Ledger ────────────────────────────────────────────────────────
  generalLedger: {
    data: [],
    totals: null,
    meta: null,
    loading: false,
    error: null,
  },

  // ── Trial Balance ─────────────────────────────────────────────────────────
  trialBalance: {
    data: {},
    totals: null,
    meta: null,
    loading: false,
    error: null,
  },

  // ── Profit & Loss ─────────────────────────────────────────────────────────
  profitLoss: {
    data: {},
    summary: null,
    meta: null,
    loading: false,
    error: null,
  },

  // ── Balance Sheet ─────────────────────────────────────────────────────────
  balanceSheet: {
    data: {},
    summary: null,
    meta: null,
    loading: false,
    error: null,
  },

  /* ══════════════════════════════════════════════════════════════════════════
     LEDGER STATEMENT
     Params: { functionalCurrency, datefrom, dateto, fromledger, toledger }
  ══════════════════════════════════════════════════════════════════════════ */
  fetchLedgerStatement: async (params) => {
    const token = useAuthStore.getState().token;

    set((s) => ({ ledgerStatement: { ...s.ledgerStatement, loading: true, error: null } }));

    try {
      const query = new URLSearchParams({
        functionalCurrency: params.functionalCurrency,
        datefrom: params.datefrom,
        dateto: params.dateto,
        fromledger: params.fromledger,
        toledger: params.toledger,
      });

      const res = await api.get(`/ledger/reports/ledger-reports?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({
        ledgerStatement: {
          data: res.data.data || [],
          title: res.data.title || 'Ledger Statement',
          meta: res.data.meta || null,
          loading: false,
          error: null,
        },
      });

      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch ledger statement';
      set((s) => ({
        ledgerStatement: { ...s.ledgerStatement, loading: false, error: msg },
      }));
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  /* ══════════════════════════════════════════════════════════════════════════
     LEDGER STATEMENT — EXCEL DOWNLOAD
  ══════════════════════════════════════════════════════════════════════════ */
  downloadLedgerStatementExcel: async (params) => {
    const token = useAuthStore.getState().token;

    try {
      const query = new URLSearchParams({
        functionalCurrency: params.functionalCurrency,
        datefrom: params.datefrom,
        dateto: params.dateto,
        fromledger: params.fromledger,
        toledger: params.toledger,
      });

      const res = await api.get(`/ledger/reports/ledger-reports-excel?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ledger_Statement_${params.datefrom}_to_${params.dateto}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      useToastStore.getState().showToast('Excel downloaded successfully', 'success');
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to download Excel';
      useToastStore.getState().showToast(msg, 'error');
      return false;
    }
  },

  /* ══════════════════════════════════════════════════════════════════════════
     GENERAL LEDGER  — uses /all-gl-reports (full LEFT JOIN, no pagination)
     Params: { datefrom, dateto, currency }
     Grand totals are computed client-side from the returned rows so the
     totals row always matches the visible data exactly.
  ══════════════════════════════════════════════════════════════════════════ */
  fetchGeneralLedger: async (params) => {
    const token = useAuthStore.getState().token;

    set((s) => ({ generalLedger: { ...s.generalLedger, loading: true, error: null } }));

    try {
      const query = new URLSearchParams({
        datefrom: params.datefrom,
        dateto: params.dateto,
        currency: params.currency,
      });

      const res = await api.get(`/ledger/reports/all-gl-reports?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const rows = res.data.data || [];

      // Compute grand totals client-side from the full row set
      const totals = rows.reduce(
        (acc, row) => ({
          grand_total_debit: acc.grand_total_debit + (parseFloat(row.total_debit) || 0),
          grand_total_credit: acc.grand_total_credit + (parseFloat(row.total_credit) || 0),
          grand_total_balance: acc.grand_total_balance + (parseFloat(row.balance) || 0),
        }),
        { grand_total_debit: 0, grand_total_credit: 0, grand_total_balance: 0 }
      );

      set({
        generalLedger: {
          data: rows,
          totals,
          meta: {
            currency: params.currency,
            datefrom: params.datefrom,
            dateto: params.dateto,
          },
          loading: false,
          error: null,
        },
      });

      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch general ledger';
      set((s) => ({
        generalLedger: { ...s.generalLedger, loading: false, error: msg },
      }));
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  /* ══════════════════════════════════════════════════════════════════════════
     GENERAL LEDGER — EXCEL DOWNLOAD  (/ledger/reports/gl-reports-excel)
     Params: { datefrom, dateto, currency }
  ══════════════════════════════════════════════════════════════════════════ */
  downloadGeneralLedgerExcel: async (params) => {
    const token = useAuthStore.getState().token;

    try {
      const query = new URLSearchParams({
        datefrom: params.datefrom,
        dateto: params.dateto,
        currency: params.currency,
      });

      const res = await api.get(`/ledger/reports/gl-reports-excel?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `General_Ledger_${params.currency}_${params.datefrom}_to_${params.dateto}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      useToastStore.getState().showToast('Excel downloaded successfully', 'success');
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to download Excel';
      useToastStore.getState().showToast(msg, 'error');
      return false;
    }
  },

  /* ══════════════════════════════════════════════════════════════════════════
   TRIAL BALANCE  (/ledger/reports/trial-balance)
   Params: { datefrom, dateto, currency, zerobal }
══════════════════════════════════════════════════════════════════════════ */
  fetchTrialBalance: async (params) => {
    const token = useAuthStore.getState().token;
    set((s) => ({ trialBalance: { ...s.trialBalance, loading: true, error: null } }));
    try {
      const query = new URLSearchParams({
        datefrom: params.datefrom,
        dateto: params.dateto,
        currency: params.currency,
        zerobal: params.zerobal || 'No',
      });
      const res = await api.get(`/ledger/reports/trial-balance?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({
        trialBalance: {
          data: res.data.data || {},
          totals: res.data.totals || null,
          meta: res.data.meta || null,
          loading: false,
          error: null,
        },
      });
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch trial balance';
      set((s) => ({ trialBalance: { ...s.trialBalance, loading: false, error: msg } }));
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  /* ══════════════════════════════════════════════════════════════════════════
     TRIAL BALANCE — EXCEL DOWNLOAD
  ══════════════════════════════════════════════════════════════════════════ */
  downloadTrialBalanceExcel: async (params) => {
    const token = useAuthStore.getState().token;
    try {
      const query = new URLSearchParams({
        datefrom: params.datefrom,
        dateto: params.dateto,
        currency: params.currency,
        zerobal: params.zerobal || 'No',
      });
      const res = await api.get(`/ledger/reports/trial-balance-excel?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Trial_Balance_${params.currency}_${params.datefrom}_to_${params.dateto}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      useToastStore.getState().showToast('Excel downloaded successfully', 'success');
      return true;
    } catch (err) {
      useToastStore.getState().showToast(err.response?.data?.message || 'Failed to download Excel', 'error');
      return false;
    }
  },
  /* ══════════════════════════════════════════════════════════════════════════
   PROFIT & LOSS  (/ledger/reports/pl-reports)
   Params: { datefrom, dateto, currency, zerobal }
══════════════════════════════════════════════════════════════════════════ */
  fetchProfitLoss: async (params) => {
    const token = useAuthStore.getState().token;
    set((s) => ({ profitLoss: { ...s.profitLoss, loading: true, error: null } }));
    try {
      const query = new URLSearchParams({
        datefrom: params.datefrom,
        dateto: params.dateto,
        currency: params.currency,
        zerobal: params.zerobal || 'No',
      });
      const res = await api.get(`/ledger/reports/pl-reports?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({
        profitLoss: {
          data: res.data.data || {},
          summary: res.data.summary || null,
          meta: res.data.meta || null,
          loading: false,
          error: null,
        },
      });
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch profit & loss';
      set((s) => ({ profitLoss: { ...s.profitLoss, loading: false, error: msg } }));
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  /* ══════════════════════════════════════════════════════════════════════════
     PROFIT & LOSS — EXCEL DOWNLOAD
  ══════════════════════════════════════════════════════════════════════════ */
  downloadProfitLossExcel: async (params) => {
    const token = useAuthStore.getState().token;
    try {
      const query = new URLSearchParams({
        datefrom: params.datefrom,
        dateto: params.dateto,
        currency: params.currency,
        zerobal: params.zerobal || 'No',
      });
      const res = await api.get(`/ledger/reports/pl-reports-excel?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Profit_Loss_${params.currency}_${params.datefrom}_to_${params.dateto}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      useToastStore.getState().showToast('Excel downloaded successfully', 'success');
      return true;
    } catch (err) {
      useToastStore.getState().showToast(err.response?.data?.message || 'Failed to download Excel', 'error');
      return false;
    }
  },

  /* ══════════════════════════════════════════════════════════════════════════
   BALANCE SHEET  (/ledger/reports/balance-sheet-reports)
   Params: { datefrom, dateto, currency, zerobal }
══════════════════════════════════════════════════════════════════════════ */
  fetchBalanceSheet: async (params) => {
    const token = useAuthStore.getState().token;
    set((s) => ({ balanceSheet: { ...s.balanceSheet, loading: true, error: null } }));
    try {
      const query = new URLSearchParams({
        datefrom: params.datefrom,
        dateto: params.dateto,
        currency: params.currency,
        zerobal: params.zerobal || 'No',
      });
      const res = await api.get(`/ledger/reports/balance-sheet-reports?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({
        balanceSheet: {
          data: res.data.data || {},
          summary: res.data.summary || null,
          meta: res.data.meta || null,
          loading: false,
          error: null,
        },
      });
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch balance sheet';
      set((s) => ({ balanceSheet: { ...s.balanceSheet, loading: false, error: msg } }));
      useToastStore.getState().showToast(msg, 'error');
      return null;
    }
  },

  /* ══════════════════════════════════════════════════════════════════════════
     BALANCE SHEET — EXCEL DOWNLOAD
  ══════════════════════════════════════════════════════════════════════════ */
  downloadBalanceSheetExcel: async (params) => {
    const token = useAuthStore.getState().token;
    try {
      const query = new URLSearchParams({
        datefrom: params.datefrom,
        dateto: params.dateto,
        currency: params.currency,
        zerobal: params.zerobal || 'No',
      });
      const res = await api.get(`/ledger/reports/bs-reports-excel?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Balance_Sheet_${params.currency}_${params.datefrom}_to_${params.dateto}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      useToastStore.getState().showToast('Excel downloaded successfully', 'success');
      return true;
    } catch (err) {
      useToastStore.getState().showToast(err.response?.data?.message || 'Failed to download Excel', 'error');
      return false;
    }
  },

  /* ══════════════════════════════════════════════════════════════════════════
     RESET helpers
  ══════════════════════════════════════════════════════════════════════════ */
  resetLedgerStatement: () =>
    set({ ledgerStatement: { data: [], title: '', meta: null, loading: false, error: null } }),

  resetGeneralLedger: () =>
    set({ generalLedger: { data: [], totals: null, meta: null, loading: false, error: null } }),

  resetTrialBalance: () =>
    set({ trialBalance: { data: {}, totals: null, meta: null, loading: false, error: null } }),

  resetProfitLoss: () =>
    set({ profitLoss: { data: {}, summary: null, meta: null, loading: false, error: null } }),

  resetBalanceSheet: () =>
    set({ balanceSheet: { data: {}, summary: null, meta: null, loading: false, error: null } }),
}));

export default useLedgerReportStore;