import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Header from '../Header';
import NavBar from '../NavBar';
import PageNav from '../../components/PageNav';
import { DateInput, parseISO, toISO, today, yearStart } from '../../components/DashboardControls';
import useThemeStore from '../../stores/useThemeStore';
import useDashboardStore from '../../stores/useDashboardStore';
import '../../components/DashboardControls.css';
import './Dashboard.css';

const BASIS_OPTIONS = [
  { value: 'NGN_EQUIVALENT', label: 'NGN Eqv.', description: 'Consolidated view' },
  { value: 'NGN', label: 'NGN', description: 'Native transactions' },
  { value: 'USD', label: 'USD', description: 'Native transactions' },
  { value: 'GBP', label: 'GBP', description: 'Native transactions' },
  { value: 'EUR', label: 'EUR', description: 'Native transactions' },
];

const AGEING_ORDER = ['Current', '1–30 days', '31–60 days', '61–90 days', '90+ days'];
const STATUS_STYLE = {
  Paid: 'success',
  Pending: 'warning',
  Partial: 'info',
  Overdue: 'danger',
  Cancelled: 'neutral',
};

const number = (value) => Number.parseFloat(value) || 0;
const dateValue = (value) => parseISO(value) || today();
const money = (value, currency) => new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency,
  maximumFractionDigits: 2,
}).format(number(value));
const compactMoney = (value, currency) => new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency,
  notation: 'compact',
  maximumFractionDigits: 1,
}).format(number(value));
const plainCompact = (value) => new Intl.NumberFormat('en-NG', {
  notation: 'compact',
  maximumFractionDigits: 1,
}).format(number(value));
const percent = (value) => `${number(value).toFixed(1)}%`;
const shortDate = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric',
}) : '—';
const monthLabel = (month) => month ? new Date(`${month}-01T00:00:00`).toLocaleDateString('en-GB', {
  month: 'short', year: '2-digit',
}) : '';

const Skeleton = ({ className = '' }) => <span className={`analytics-skel ${className}`} />;

const Card = ({ title, icon, action, className = '', children }) => (
  <section className={`analytics-card ${className}`}>
    <header className="analytics-card__header">
      <h2><i className={`fas ${icon}`} /> {title}</h2>
      {action}
    </header>
    <div className="analytics-card__body">{children}</div>
  </section>
);

const Empty = ({ icon = 'fa-chart-column', text }) => (
  <div className="analytics-empty">
    <i className={`fas ${icon}`} />
    <p>{text}</p>
  </div>
);

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="analytics-tooltip">
      <strong>{monthLabel(label)}</strong>
      {payload.map((entry) => (
        <span key={entry.dataKey}>
          <i style={{ backgroundColor: entry.color }} />
          <em>{entry.name}</em><b>{money(entry.value, currency)}</b>
        </span>
      ))}
    </div>
  );
};

const presetRange = (preset) => {
  const now = today();
  if (preset === 'MTD') return { dateFrom: new Date(now.getFullYear(), now.getMonth(), 1), dateTo: now };
  if (preset === 'QTD') return { dateFrom: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1), dateTo: now };
  if (preset === 'LAST_12') {
    const from = new Date(now);
    from.setFullYear(from.getFullYear() - 1);
    from.setDate(from.getDate() + 1);
    return { dateFrom: from, dateTo: now };
  }
  if (preset === 'PRIOR_YEAR') return {
    dateFrom: new Date(now.getFullYear() - 1, 0, 1),
    dateTo: new Date(now.getFullYear() - 1, 11, 31),
  };
  return { dateFrom: yearStart(), dateTo: now };
};

const AnalyticsToolbar = ({ draft, setDraft, onApply, onReset, loading }) => {
  const choosePreset = (preset) => {
    const range = presetRange(preset);
    setDraft((current) => ({ ...current, ...range, preset }));
  };

  return (
    <section className="analytics-toolbar">
      <div className="analytics-toolbar__top">
        <div>
          <span className="analytics-eyebrow">Reporting controls</span>
          <h2>Analyse performance by period and currency</h2>
        </div>
        <div className="analytics-presets" aria-label="Date presets">
          {[
            ['YTD', 'Year to date'],
            ['MTD', 'Month to date'],
            ['QTD', 'Quarter to date'],
            ['LAST_12', 'Last 12 months'],
            ['PRIOR_YEAR', 'Prior year'],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={draft.preset === value ? 'active' : ''}
              onClick={() => choosePreset(value)}
            >{label}</button>
          ))}
        </div>
      </div>
      <div className="analytics-toolbar__bottom">
        <div className="analytics-dates">
          <DateInput
            label="From"
            value={draft.dateFrom}
            onChange={(date) => setDraft((current) => ({ ...current, dateFrom: date, preset: '' }))}
            maxDate={draft.dateTo}
          />
          <i className="fas fa-arrow-right analytics-dates__arrow" />
          <DateInput
            label="To"
            value={draft.dateTo}
            onChange={(date) => setDraft((current) => ({ ...current, dateTo: date, preset: '' }))}
            minDate={draft.dateFrom}
          />
        </div>
        <div className="analytics-basis" aria-label="Currency basis">
          {BASIS_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.value}
              className={draft.basis === option.value ? 'active' : ''}
              onClick={() => setDraft((current) => ({ ...current, basis: option.value }))}
              title={option.description}
            >{option.label}</button>
          ))}
        </div>
        <div className="analytics-toolbar__actions">
          <button type="button" className="analytics-btn analytics-btn--secondary" onClick={onReset} disabled={loading}>
            <i className="fas fa-rotate-left" /> Reset
          </button>
          <button type="button" className="analytics-btn analytics-btn--primary" onClick={onApply} disabled={loading}>
            <i className={`fas ${loading ? 'fa-circle-notch fa-spin' : 'fa-chart-line'}`} />
            {loading ? 'Analysing' : 'Apply analysis'}
          </button>
        </div>
      </div>
    </section>
  );
};

const ExecutiveHero = ({ executive, meta, controls, loading }) => {
  const netPositive = number(executive.net_result) >= 0;
  const locked = Boolean(controls?.closing_period && ['1', 'true', 'TRUE', true, 1].includes(controls.closing_period.is_locked));
  return (
    <section className="analytics-hero">
      <div className="analytics-hero__copy">
        <span className="analytics-eyebrow">Executive summary · {meta.basis_label}</span>
        <h1>Financial performance command centre</h1>
        <p>{meta.measurement_note}</p>
        <div className="analytics-hero__badges">
          <span><i className="fas fa-calendar-days" /> {shortDate(meta.date_from)} — {shortDate(meta.date_to)}</span>
          <span className={locked ? 'locked' : 'open'}>
            <i className={`fas ${locked ? 'fa-lock' : 'fa-lock-open'}`} />
            {controls?.closing_period ? (locked ? 'Period locked at closing date' : 'Closing period is open') : 'No closing period configured'}
          </span>
        </div>
      </div>
      <div className={`analytics-net ${netPositive ? 'positive' : 'negative'}`}>
        <span>Net result</span>
        {loading ? <Skeleton className="analytics-skel--hero" /> : <strong>{compactMoney(executive.net_result, meta.display_currency)}</strong>}
        <small><i className={`fas ${netPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`} /> {percent(executive.profit_margin)} margin</small>
      </div>
    </section>
  );
};

const KpiCard = ({ icon, label, value, sub, style, loading }) => (
  <article className={`analytics-kpi analytics-kpi--${style}`}>
    <i className={`fas ${icon}`} />
    <div>
      <span>{label}</span>
      {loading ? <Skeleton className="analytics-skel--value" /> : <strong>{value}</strong>}
      <small>{sub}</small>
    </div>
  </article>
);

const PerformanceChart = ({ rows, currency, loading }) => (
  <Card title="Profitability trend" icon="fa-chart-area" className="analytics-span-2" action={<Link to="/reports/ledger/profit-and-loss">P&amp;L report <i className="fas fa-arrow-right" /></Link>}>
    {loading ? <Skeleton className="analytics-skel--chart" /> : rows.length ? (
      <ResponsiveContainer width="100%" height={290}>
        <AreaChart data={rows} margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#13c0ad" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#13c0ad" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="dashboardExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0747f" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#f0747f" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--analytics-grid)" strokeDasharray="4 5" />
          <XAxis dataKey="month" tickFormatter={monthLabel} axisLine={false} tickLine={false} tick={{ fill: 'var(--analytics-muted)', fontSize: 11 }} />
          <YAxis tickFormatter={plainCompact} axisLine={false} tickLine={false} tick={{ fill: 'var(--analytics-muted)', fontSize: 11 }} width={56} />
          <Tooltip
            content={<CustomTooltip currency={currency} />}
            cursor={{ stroke: 'var(--analytics-chart-crosshair)', strokeWidth: 1, strokeDasharray: '4 4' }}
            wrapperStyle={{ outline: 'none' }}
          />
          <Area name="Revenue" type="monotone" dataKey="revenue" stroke="#13c0ad" fill="url(#dashboardRevenue)" strokeWidth={2.4} />
          <Area name="Expenses" type="monotone" dataKey="expenses" stroke="#f0747f" fill="url(#dashboardExpense)" strokeWidth={2.4} />
        </AreaChart>
      </ResponsiveContainer>
    ) : <Empty icon="fa-chart-area" text="No profitability movement within this period." />}
  </Card>
);

const BillingTrend = ({ rows, currency, loading }) => (
  <Card title="Billing and collections" icon="fa-file-invoice-dollar" action={<Link to="/reports/invoice-aging">Ageing report <i className="fas fa-arrow-right" /></Link>}>
    {loading ? <Skeleton className="analytics-skel--chart" /> : rows.length ? (
      <ResponsiveContainer width="100%" height={290}>
        <BarChart data={rows} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--analytics-grid)" strokeDasharray="4 5" />
          <XAxis dataKey="month" tickFormatter={monthLabel} axisLine={false} tickLine={false} tick={{ fill: 'var(--analytics-muted)', fontSize: 11 }} />
          <YAxis tickFormatter={plainCompact} axisLine={false} tickLine={false} tick={{ fill: 'var(--analytics-muted)', fontSize: 11 }} width={50} />
          <Tooltip
            content={<CustomTooltip currency={currency} />}
            cursor={{
              fill: 'var(--analytics-chart-cursor)',
              stroke: 'var(--analytics-chart-cursor-border)',
              strokeWidth: 1,
              radius: 8,
            }}
            wrapperStyle={{ outline: 'none' }}
          />
          <Bar name="Invoiced" dataKey="invoiced" fill="#5b9af5" radius={[6, 6, 2, 2]} />
          <Bar name="Collected" dataKey="collected" fill="#13c0ad" radius={[6, 6, 2, 2]} />
        </BarChart>
      </ResponsiveContainer>
    ) : <Empty icon="fa-file-circle-exclamation" text="No billing activity within this period." />}
  </Card>
);

const AgeingPanel = ({ rows, currency, loading, total }) => {
  const mapped = AGEING_ORDER.map((bucket) => rows.find((item) => item.bucket === bucket) || { bucket, amount: 0, invoice_count: 0 });
  return (
    <Card title="Receivable ageing" icon="fa-hourglass-half" action={<Link to="/reports/invoice-aging">View detail <i className="fas fa-arrow-right" /></Link>}>
      {loading ? <Skeleton className="analytics-skel--list" /> : (
        <div className="analytics-aging">
          {mapped.map((entry, index) => {
            const value = number(entry.amount);
            const ratio = total > 0 ? (value / total) * 100 : 0;
            return (
              <div className={`analytics-aging__row age-${index}`} key={entry.bucket}>
                <div><strong>{entry.bucket}</strong><span>{entry.invoice_count || 0} invoices</span></div>
                <div className="analytics-aging__bar"><i style={{ width: `${Math.max(ratio, value ? 2 : 0)}%` }} /></div>
                <b>{compactMoney(value, currency)}</b>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

const PositionPanel = ({ rows, currency, loading }) => {
  const max = Math.max(...rows.map((row) => Math.abs(number(row.balance))), 1);
  return (
    <Card title="Ledger position at closing date" icon="fa-scale-balanced" action={<Link to="/reports/ledger/balance-sheet">Balance sheet <i className="fas fa-arrow-right" /></Link>}>
      {loading ? <Skeleton className="analytics-skel--list" /> : rows.length ? (
        <div className="analytics-position">
          {rows.map((row) => (
            <div key={row.ledger_class}>
              <span>{row.ledger_class}</span>
              <div><i className={`class-${row.ledger_class.toLowerCase()}`} style={{ width: `${Math.abs(number(row.balance)) / max * 100}%` }} /></div>
              <strong>{compactMoney(row.balance, currency)}</strong>
            </div>
          ))}
        </div>
      ) : <Empty text="No ledger position is available for the closing date." />}
    </Card>
  );
};

const CashPanel = ({ accounts, currency, loading }) => (
  <Card title="Cash and bank position" icon="fa-building-columns" action={<Link to="/banks/home">Bank accounts <i className="fas fa-arrow-right" /></Link>}>
    {loading ? <Skeleton className="analytics-skel--list" /> : accounts.length ? (
      <div className="analytics-cash">
        {accounts.map((account) => (
          <div key={`${account.ledger_number}-${account.source_currency}`}>
            <i className="fas fa-wallet" />
            <span><strong>{account.ledger_name}</strong><small>{account.source_currency} · {account.ledger_number}</small></span>
            <b>{compactMoney(account.balance, currency)}</b>
          </div>
        ))}
      </div>
    ) : <Empty icon="fa-building-columns" text="No cash or bank ledger balances found." />}
  </Card>
);

const ClientExposure = ({ clients, currency, loading }) => (
  <Card title="Largest client exposure" icon="fa-users" className="analytics-span-2" action={<Link to="/client/home">Clients <i className="fas fa-arrow-right" /></Link>}>
    {loading ? <Skeleton className="analytics-skel--table" /> : clients.length ? (
      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead><tr><th>Client</th><th>Source</th><th>Open invoices</th><th>Outstanding</th><th>Overdue</th><th>Risk</th></tr></thead>
          <tbody>
            {clients.map((client) => {
              const risk = number(client.outstanding) > 0 ? number(client.overdue) / number(client.outstanding) * 100 : 0;
              return (
                <tr key={`${client.clients_id}-${client.source_currency}`}>
                  <td><strong>{client.clients_name}</strong></td>
                  <td><span className="analytics-pill analytics-pill--neutral">{client.source_currency}</span></td>
                  <td>{client.invoice_count}</td>
                  <td>{money(client.outstanding, currency)}</td>
                  <td className={number(client.overdue) > 0 ? 'negative' : ''}>{money(client.overdue, currency)}</td>
                  <td><span className={`analytics-pill ${risk > 70 ? 'analytics-pill--danger' : risk > 20 ? 'analytics-pill--warning' : 'analytics-pill--success'}`}>{risk.toFixed(0)}%</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : <Empty icon="fa-user-check" text="There are no outstanding client balances at the closing date." />}
  </Card>
);

const MixPanel = ({ title, icon, rows, loading, currency, type }) => {
  const max = Math.max(...rows.map((row) => number(type === 'currency' ? row.activity_ngn : row.transaction_value)), 1);
  return (
    <Card title={title} icon={icon}>
      {loading ? <Skeleton className="analytics-skel--list" /> : rows.length ? (
        <div className="analytics-mix">
          {rows.map((row) => {
            const label = type === 'currency' ? row.currency : row.journal_type;
            const value = number(type === 'currency' ? row.activity_ngn : row.transaction_value);
            return (
              <div key={label}>
                <span>{label}</span>
                <div><i style={{ width: `${value / max * 100}%` }} /></div>
                <strong>{compactMoney(value, type === 'currency' ? 'NGN' : currency)}</strong>
              </div>
            );
          })}
        </div>
      ) : <Empty text="No transaction activity in this period." />}
    </Card>
  );
};

const RecentInvoices = ({ rows, currency, loading }) => (
  <Card title="Recent billing activity" icon="fa-clock-rotate-left" action={<Link to="/invoice/home">Invoices <i className="fas fa-arrow-right" /></Link>}>
    {loading ? <Skeleton className="analytics-skel--list" /> : rows.length ? (
      <div className="analytics-recent">
        {rows.map((invoice) => (
          <div key={invoice.invoice_number}>
            <span><strong>#{invoice.invoice_number}</strong><small>{invoice.clients_name} · {shortDate(invoice.invoice_date)}</small></span>
            <b>{compactMoney(invoice.amount, currency)}</b>
            <em className={`analytics-pill analytics-pill--${STATUS_STYLE[invoice.status] || 'neutral'}`}>{invoice.status}</em>
          </div>
        ))}
      </div>
    ) : <Empty icon="fa-file-invoice" text="No invoices were raised in the selected period." />}
  </Card>
);

const RateStrip = ({ rates, controls, loading }) => (
  <section className="analytics-strip">
    <div>
      <span className="analytics-eyebrow">Latest FX reference rate</span>
      <strong>{rates?.created_at ? shortDate(rates.created_at.slice(0, 10)) : 'No rates available'}</strong>
    </div>
    {loading ? <Skeleton className="analytics-skel--strip" /> : [
      ['USD / NGN', rates?.usd_rate],
      ['GBP / NGN', rates?.gbp_rate],
      ['EUR / NGN', rates?.eur_rate],
    ].map(([pair, value]) => (
      <div className="analytics-rate" key={pair}><span>{pair}</span><strong>{number(value).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong></div>
    ))}
    <div className="analytics-rate analytics-rate--control">
      <span>Periods in range</span>
      <strong>{controls?.overlapping_periods || 0} <small>/ {controls?.locked_periods || 0} locked</small></strong>
    </div>
  </section>
);

const Dashboard = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const { data, loading, error, filters, fetchDashboardData, applyFilters, resetFilters } = useDashboardStore();
  const [draft, setDraft] = useState({
    dateFrom: dateValue(filters.dateFrom),
    dateTo: dateValue(filters.dateTo),
    basis: filters.basis || 'NGN_EQUIVALENT',
    preset: '',
  });

  useEffect(() => {
    document.title = 'Smartbooks | Executive Dashboard';
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      dateFrom: dateValue(filters.dateFrom),
      dateTo: dateValue(filters.dateTo),
      basis: filters.basis || 'NGN_EQUIVALENT',
    }));
  }, [filters]);

  const response = data?.data || {};
  const meta = data?.meta || {
    date_from: toISO(draft.dateFrom), date_to: toISO(draft.dateTo), display_currency: draft.basis === 'NGN_EQUIVALENT' ? 'NGN' : draft.basis,
    basis_label: draft.basis === 'NGN_EQUIVALENT' ? 'NGN Equivalent · consolidated' : `${draft.basis} · native currency`,
    measurement_note: 'Performance metrics follow the selected period. Balance metrics are measured at the ending date.',
  };
  const executive = response.executive || {};
  const currency = meta.display_currency || 'NGN';
  const pAndL = response.monthly_performance || [];
  const billing = response.monthly_billing || [];

  const insights = useMemo(() => [
    {
      icon: 'fa-coins', style: number(executive.net_result) >= 0 ? 'success' : 'danger',
      title: number(executive.net_result) >= 0 ? 'Operating surplus' : 'Operating deficit',
      text: `${compactMoney(Math.abs(number(executive.net_result)), currency)} at ${percent(executive.profit_margin)} margin`,
    },
    {
      icon: 'fa-receipt', style: number(executive.collection_rate) >= 70 ? 'success' : 'warning',
      title: 'Collection efficiency', text: `${percent(executive.collection_rate)} of selected-period billing collected`,
    },
    {
      icon: 'fa-triangle-exclamation', style: number(executive.overdue_ratio) > 30 ? 'danger' : 'info',
      title: 'Receivable risk', text: `${percent(executive.overdue_ratio)} of open balances are overdue`,
    },
  ], [executive, currency]);

  const apply = () => applyFilters({
    dateFrom: toISO(draft.dateFrom),
    dateTo: toISO(draft.dateTo),
    basis: draft.basis,
  });

  const reset = async () => {
    const defaults = presetRange('YTD');
    setDraft({ ...defaults, basis: 'NGN_EQUIVALENT', preset: 'YTD' });
    await resetFilters();
  };

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <main className={`content-container theme-${theme}`}>
        <div className={`analytics-root db-root theme-${theme}`}>
          <div className="analytics-page">
            <PageNav pageTitle="Executive Dashboard" links={[{ label: 'Analytics', to: '/', active: false }]} />
            <AnalyticsToolbar draft={draft} setDraft={setDraft} onApply={apply} onReset={reset} loading={loading} />
            {error && (
              <div className="analytics-error">
                <i className="fas fa-circle-exclamation" />
                <span>{error}</span>
                <button type="button" onClick={apply}>Retry</button>
              </div>
            )}
            <ExecutiveHero executive={executive} meta={meta} controls={response.period_controls} loading={loading} />
            <div className="analytics-insights">
              {insights.map((insight) => (
                <article className={`analytics-insight analytics-insight--${insight.style}`} key={insight.title}>
                  <i className={`fas ${insight.icon}`} />
                  <div><strong>{insight.title}</strong><span>{insight.text}</span></div>
                </article>
              ))}
            </div>
            <div className="analytics-kpis">
              <KpiCard icon="fa-arrow-trend-up" style="brand" label="Revenue" value={compactMoney(executive.revenue, currency)} sub={`${executive.journal_count || 0} posted journals`} loading={loading} />
              <KpiCard icon="fa-arrow-trend-down" style="danger" label="Expenses" value={compactMoney(executive.expenses, currency)} sub="Recognised within period" loading={loading} />
              <KpiCard icon="fa-file-invoice-dollar" style="blue" label="Invoiced" value={compactMoney(executive.invoiced, currency)} sub={`${executive.invoice_count || 0} invoices · ${executive.billed_clients || 0} clients`} loading={loading} />
              <KpiCard icon="fa-hand-holding-dollar" style="warning" label="Outstanding" value={compactMoney(executive.outstanding, currency)} sub={`${executive.open_invoice_count || 0} open invoices`} loading={loading} />
              <KpiCard icon="fa-clock" style="danger" label="Overdue" value={compactMoney(executive.overdue, currency)} sub={`${percent(executive.overdue_ratio)} of outstanding`} loading={loading} />
              <KpiCard icon="fa-building-columns" style="brand" label="Cash position" value={compactMoney(executive.cash_balance, currency)} sub={`As at ${shortDate(meta.date_to)}`} loading={loading} />
            </div>
            <div className="analytics-grid">
              <PerformanceChart rows={pAndL} currency={currency} loading={loading} />
              <BillingTrend rows={billing} currency={currency} loading={loading} />
              <AgeingPanel rows={response.receivable_aging || []} total={number(executive.outstanding)} currency={currency} loading={loading} />
              <PositionPanel rows={response.financial_position || []} currency={currency} loading={loading} />
              <CashPanel accounts={response.cash_accounts || []} currency={currency} loading={loading} />
              <ClientExposure clients={response.client_exposure || []} currency={currency} loading={loading} />
              <MixPanel title="Transaction activity" icon="fa-shuffle" rows={response.transaction_mix || []} currency={currency} loading={loading} type="transaction" />
              <MixPanel title="Currency exposure" icon="fa-money-bill-transfer" rows={response.currency_mix || []} currency="NGN" loading={loading} type="currency" />
              <RecentInvoices rows={response.recent_invoices || []} currency={currency} loading={loading} />
            </div>
            <RateStrip rates={response.latest_rates} controls={response.period_controls} loading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
