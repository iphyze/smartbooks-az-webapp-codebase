import React, { useEffect, useState } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import useDashboardStore from "../../stores/useDashboardStore";
import PageNav from "../../components/PageNav";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn } from "../../utils/animation";
import { 
  Users, FileText, BookOpen, DollarSign, 
  TrendingUp, Wallet 
} from "lucide-react";

// Recharts imports
import { 
  LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

// Component Imports
import TableLoaderComponent from "../../components/TableLoaderComponent";
import ErrorModal from "../../components/modals/ErrorModal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import "./Dashboard.css";

// Helper to format currency
const formatCurrency = (value, currency = "NGN") => {
  if (!value) return "0.00";
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(value);
};

// Helper for compact number formatting (e.g. 1.2M)
const formatCompact = (value) => {
  if (!value) return "0";
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  return value.toFixed(0);
};

const Dashboard = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  
  // Destructure state and actions from the store
  const { 
    data, loading, error, fetchDashboardData, 
    dateFrom, dateTo, setDateFilter 
  } = useDashboardStore();

  const links = [
    { label: "Home", to: "/", active: false }
  ];

  useEffect(() => {
    document.title = "Smartbooks | Dashboard";
    fetchDashboardData();
  }, []);

  // Handler to close Error Modal
  const handleCloseErrorModal = () => {
    useDashboardStore.setState({ error: null });
  };

  // Handlers for Date Filters
  const handleStartDateChange = (date) => {
    setDateFilter(date, dateTo);
  };

  const handleEndDateChange = (date) => {
    setDateFilter(dateFrom, date);
  };

  // Derived State
  const overview = data?.data?.overview || {};
  const latestRates = data?.data?.latest_rates || {};
  const receivables = data?.data?.receivables || [];
  const topClients = data?.data?.top_clients || [];
  const recentInvoices = data?.data?.recent_invoices || [];
  const monthlyTrend = data?.data?.monthly_trend || [];

  // Prepare Data for Charts
  const chartTrendData = monthlyTrend
    .filter(m => m.currency === 'NGN')
    .map(m => ({
      name: m.month,
      revenue: m.revenue,
      expenses: m.expenses
    }));

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle="Dashboard" links={links} />

        <motion.div 
          className="dashboard-container"
          initial="initial"
          animate="animate"
          variants={fadeIn}
        >
          {/* --- Filters Section --- */}
          <div className="dashboard-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
            <div className="table-controls" style={{ marginBottom: 0 }}>
              <div className="table-search-box" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="filter-wrapper-label" style={{ marginBottom: 0 }}>Filter By Date:</span>
                
                {/* Date From Picker */}
                <div className="input-form-wrapper" style={{ marginBottom: 0 }}>
                  <div className="input-form-group">
                    <div className="form-wrapper">
                      <DatePicker
                        selected={dateFrom}
                        onChange={handleStartDateChange}
                        className="form-input"
                        dateFormat="yyyy-MM-dd"
                        wrapperClassName="input-date-picker"
                        placeholderText="Start Date"
                        isClearable
                      />
                      <span className="chevron-input-icon fas fa-calendar" />
                    </div>
                  </div>
                </div>

                <span style={{ color: 'var(--text-muted)' }}>to</span>

                {/* Date To Picker */}
                <div className="input-form-wrapper" style={{ marginBottom: 0 }}>
                  <div className="input-form-group">
                    <div className="form-wrapper">
                      <DatePicker
                        selected={dateTo}
                        onChange={handleEndDateChange}
                        className="form-input"
                        dateFormat="yyyy-MM-dd"
                        wrapperClassName="input-date-picker"
                        placeholderText="End Date"
                        isClearable
                      />
                      <span className="chevron-input-icon fas fa-calendar" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Main Content --- */}
          {loading ? (
            <TableLoaderComponent />
          ) : (
            <>
              {/* --- Overview Cards --- */}
              <div className="overview-grid">
                <motion.div className="dashboard-card stat-card" variants={fadeIn}>
                  <div className="icon-container" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                    <Users color="#6366f1" />
                  </div>
                  <span className="label">Total Clients</span>
                  <span className="value">{overview.total_clients || 0}</span>
                </motion.div>

                <motion.div className="dashboard-card stat-card" variants={fadeIn}>
                  <div className="icon-container" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                    <FileText color="#10b981" />
                  </div>
                  <span className="label">Total Invoices</span>
                  <span className="value">{overview.total_invoices || 0}</span>
                </motion.div>

                <motion.div className="dashboard-card stat-card" variants={fadeIn}>
                  <div className="icon-container" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                    <BookOpen color="#f59e0b" />
                  </div>
                  <span className="label">Total Journals</span>
                  <span className="value">{overview.total_journals || 0}</span>
                </motion.div>

                <motion.div className="dashboard-card stat-card" variants={fadeIn}>
                  <div className="icon-container" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                    <Users color="#ef4444" />
                  </div>
                  <span className="label">Total Users</span>
                  <span className="value">{overview.total_users || 0}</span>
                </motion.div>
              </div>

              {/* --- Charts Row --- */}
              <div className="content-grid">
                {/* Revenue vs Expense Trend */}
                <div className="dashboard-card">
                  <h3 className="section-title">
                    <TrendingUp size={18} /> Monthly Trend (NGN)
                  </h3>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <LineChart data={chartTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity="0.2" />
                        <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={formatCompact} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} 
                          labelStyle={{ color: '#fff' }} 
                        />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Latest Rates */}
                <div className="dashboard-card">
                  <h3 className="section-title">
                    <DollarSign size={18} /> Exchange Rates
                  </h3>
                  <div className="rates-list" style={{ marginTop: '1rem' }}>
                    <div className="rate-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                      <span>USD</span>
                      <strong>₦{latestRates.usd_rate || '0'}</strong>
                    </div>
                    <div className="rate-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                      <span>GBP</span>
                      <strong>₦{latestRates.gbp_rate || '0'}</strong>
                    </div>
                    <div className="rate-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                      <span>EUR</span>
                      <strong>₦{latestRates.eur_rate || '0'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Tables Row --- */}
              <div className="content-grid">
                {/* Receivables Table */}
                <div className="dashboard-card">
                  <h3 className="section-title">
                    <Wallet size={18} /> Receivables Overview
                  </h3>
                  <div className="table-container">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Currency</th>
                          <th>Total</th>
                          <th>Current</th>
                          <th>Overdue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receivables.map((item, index) => (
                          <tr key={index}>
                            <td><strong>{item.currency}</strong></td>
                            <td>{formatCurrency(item.total_receivables, item.currency)}</td>
                            <td style={{ color: '#10b981' }}>{formatCurrency(item.current_receivables, item.currency)}</td>
                            <td style={{ color: '#ef4444' }}>{formatCurrency(item.overdue_receivables, item.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Clients Table */}
                <div className="dashboard-card">
                  <h3 className="section-title">
                    <Users size={18} /> Top Clients
                  </h3>
                  <div className="table-container">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Client</th>
                          <th>Billed</th>
                          <th>Outstanding</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topClients.slice(0, 5).map((client, index) => (
                          <tr key={index}>
                            <td>{client.clients_name}</td>
                            <td>{formatCurrency(client.total_billed, client.currency)}</td>
                            <td style={{ color: client.total_outstanding > 0 ? '#f59e0b' : '#10b981' }}>
                              {formatCurrency(client.total_outstanding, client.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* --- Recent Invoices Full Width --- */}
              <div className="dashboard-card full-width">
                <h3 className="section-title">
                  <FileText size={18} /> Recent Invoices
                </h3>
                <div className="table-container">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Number</th>
                        <th>Client</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInvoices.map((inv, index) => (
                        <tr key={index}>
                          <td>{inv.invoice_number}</td>
                          <td>{inv.clients_name}</td>
                          <td>{formatCurrency(inv.invoice_amount, inv.currency)}</td>
                          <td>
                            <span className={`status-badge status-${inv.status.toLowerCase()}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td>{new Date(inv.due_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Error Modal Integration */}
      <AnimatePresence>
        {error && (
          <ErrorModal
            isOpen={!!error}
            onClose={handleCloseErrorModal}
            onRetry={fetchDashboardData}
            message={error}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;