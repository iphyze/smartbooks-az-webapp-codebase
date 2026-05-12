import React, { useState, useEffect, useMemo } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import PageNav from "../../components/PageNav";
import useThemeStore from "../../stores/useThemeStore";
import useDashboardStore from "../../stores/useDashboardStore";

/* ── Sub-components ── */
import DashboardControls, { toISO, today, yearStart, parseISO } from "../../components/DashboardControls";
import StatCards from "../../components/StatCards";
import { ReceivablesCard, RevenueExpensesCard, ExchangeRatesCard } from "../../components/InfoCards";
import { TrendChart, InvoiceStatusPie, TopClientsChart, TransactionActivity } from "./Charts";
import { BankBalancesCard, RecentInvoices, ClientSummaryTable, QuickActions } from "../../components/DataCards";

/* ── CSS ── */
import "./Dashboard.css";
import "../../components/DashboardControls.css";
import "../../components/StatCards.css";
import "../../components/InfoCards.css";
import "./Charts.css";
import "../../components/DataCards.css";

const Dashboard = () => {
  const [nav, setNav]             = useState(false);
  const [activeCur, setActiveCur] = useState("NGN");
  const [trendCur,  setTrendCur]  = useState("NGN");
  const [dateFrom,  setDateFrom]  = useState(yearStart());
  const [dateTo,    setDateTo]    = useState(today());

  const { theme } = useThemeStore();
  const { data, loading, fetchDashboardData, setDateFilter } = useDashboardStore();

  const links = [{ label: "Home", to: "/", active: true }];

  useEffect(() => {
    document.title = "Smartbooks | Dashboard";
    fetchDashboardData();
  }, []);

  /* ── Derived data ── */
  const overview     = data?.data?.overview         || {};
  const rates        = data?.data?.latest_rates     || null;
  const bankData     = data?.data?.bank_balances    || {};
  const topClients   = data?.data?.top_clients      || [];
  const recentInv    = data?.data?.recent_invoices  || [];
  const revEx        = data?.data?.revenue_expenses || [];
  const monthly      = data?.data?.monthly_trend    || [];
  const invStatus    = data?.data?.invoice_status   || {};
  const receivables  = data?.data?.receivables      || [];
  const jSummary     = data?.data?.journal_summary  || [];

  const activeReceiv = useMemo(() => receivables.find(r => r.currency === activeCur) || {}, [receivables, activeCur]);
  const activeRevEx  = useMemo(() => revEx.find(r => r.currency === activeCur) || {},       [revEx, activeCur]);

  const trendData = useMemo(() =>
    monthly.filter(m => m.currency === trendCur).map(m => ({
      month:    m.month,
      Revenue:  parseFloat(m.revenue)  || 0,
      Expenses: parseFloat(m.expenses) || 0,
    })), [monthly, trendCur]);

  const statusPie = useMemo(() =>
    (invStatus[activeCur] || []).map(r => ({
      name:  r.status,
      value: parseFloat(r.total_amount) || 0,
      count: r.count,
    })), [invStatus, activeCur]);

  const clientBar = useMemo(() =>
    topClients.filter(c => c.currency === activeCur).slice(0, 7).map(c => ({
      name:        c.clients_name.split(" ").slice(0, 2).join(" "),
      Billed:      parseFloat(c.total_billed)      || 0,
      Outstanding: parseFloat(c.total_outstanding) || 0,
    })), [topClients, activeCur]);

  const journalBars = useMemo(() => {
    return ["Sales","Expenses","Receipt","Payment"].map(type => {
      const m = jSummary.find(j => j.journal_type === type && j.currency === activeCur);
      return {
        name:   type,
        Debit:  m ? parseFloat(m.total_debit)  || 0 : 0,
        Credit: m ? parseFloat(m.total_credit) || 0 : 0,
      };
    });
  }, [jSummary, activeCur]);

  const bankTotals = {
    ngn: parseFloat(bankData.total_ngn) || 0,
    usd: parseFloat(bankData.total_usd) || 0,
    gbp: parseFloat(bankData.total_gbp) || 0,
    eur: parseFloat(bankData.total_eur) || 0,
  };

  /* ── Date handlers ── */
  const handleDateFromChange = (date) => {
    if (!date) return;
    const maxTo = new Date(date);
    maxTo.setFullYear(maxTo.getFullYear() + 1);
    setDateFrom(date);
    if (dateTo > maxTo) setDateTo(maxTo);
  };

  const handleDateToChange = (date) => {
    if (!date) return;
    setDateTo(date);
  };

  const handleApply = () => setDateFilter(toISO(dateFrom), toISO(dateTo));

  const handleClear = () => {
    const df = yearStart(), dt = today();
    setDateFrom(df); setDateTo(dt);
    setDateFilter(toISO(df), toISO(dt));
  };

  const isFiltered = toISO(dateFrom) !== toISO(yearStart()) || toISO(dateTo) !== toISO(today());

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
            <PageNav pageTitle="Dashboard" links={links} />

            {/* Controls */}
            <DashboardControls
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={handleDateFromChange}
              onDateToChange={handleDateToChange}
              onApply={handleApply}
              onClear={handleClear}
              isFiltered={isFiltered}
              activeCur={activeCur}
              onCurChange={setActiveCur}
            />

            {/* KPI Stats */}
            <StatCards overview={overview} loading={loading} />

            {/* Info row — receivables / rev-ex / rates */}
            <div className="db-grid-3">
              <ReceivablesCard    data={activeReceiv} currency={activeCur} loading={loading} delay={0.08} />
              <RevenueExpensesCard data={activeRevEx} currency={activeCur} loading={loading} delay={0.12} />
              <ExchangeRatesCard  rates={rates}                            loading={loading} delay={0.16} />
            </div>

            {/* Monthly trend */}
            <TrendChart
              data={trendData}
              currency={trendCur}
              onCurrencyChange={setTrendCur}
              loading={loading}
              delay={0.18}
            />

            {/* Bank + Pie */}
            <div className="db-grid-2">
              <BankBalancesCard accounts={bankData.accounts} totals={bankTotals} loading={loading} delay={0.2} />
              <InvoiceStatusPie data={statusPie}                                 loading={loading} delay={0.22} />
            </div>

            {/* Top clients chart */}
            <TopClientsChart data={clientBar} loading={loading} delay={0.24} />

            {/* Journal activity + recent invoices */}
            <div className="db-grid-2">
              <TransactionActivity data={journalBars} loading={loading} delay={0.26} />
              <RecentInvoices      invoices={recentInv} loading={loading} delay={0.28} />
            </div>

            {/* Client summary table */}
            <ClientSummaryTable clients={topClients} loading={loading} delay={0.3} />

            {/* Quick Actions */}
            <QuickActions delay={0} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
