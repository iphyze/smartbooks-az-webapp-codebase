import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pdf } from '@react-pdf/renderer';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import NavBar from '../NavBar';
import Header from '../Header';
import PageNav from '../../components/PageNav';
import useThemeStore from '../../stores/useThemeStore';
import useTimesheetReportStore from '../../stores/useTimesheetReportStore';
import useTimesheetReferenceStore from '../../stores/useTimesheetReferenceStore';
import useAuthStore from '../../stores/useAuthStore';
import { isTimesheetOnly } from '../../utils/permissions';
import DownloadTimesheetReport from './DownloadTimesheetReport';
import CompanyLogo from '../../assets/images/smartbooks/az-logo.png';
import './TimesheetReport.css';

const ALL_STAFF_OPTION = { value: 'All Staff', label: 'All Staff' };
const DEFAULT_LIMIT = 25;

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

const monthStartDate = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toLocalISO = (d) => {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const fmtHours = (n) => `${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}h`;
const fmtCount = (n) => Number(n || 0).toLocaleString('en-US');
const fmtDate = (d) => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(`${d}T00:00:00`) : d;
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const safe = (v) => (v === null || v === undefined || v === '' ? '—' : v);

const getVisiblePages = (currentPage, totalPages) => {
  const maxVisiblePages = 5;
  const pages = [];

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i += 1) pages.push(i);
    return pages;
  }

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) pages.push('...');
  }

  for (let i = startPage; i <= endPage; i += 1) pages.push(i);

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  return pages;
};

const FilterBar = ({
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  staffFilter,
  setStaffFilter,
  search,
  setSearch,
  errors,
  loading,
  onSearch,
  isTimesheetUser,
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const { staff, searchStaff } = useTimesheetReferenceStore();

  useEffect(() => {
    searchStaff('');
  }, [searchStaff]);

  const staffOptions = useMemo(() => {
    const seen = new Set(['All Staff']);
    const mapped = (staff || [])
      .map((s) => {
        const name = String(s?.staff_name || '').trim();
        if (!name || seen.has(name)) return null;
        seen.add(name);
        return {
          value: name,
          label: name,
          staff_id: s?.staff_id || '',
        };
      })
      .filter(Boolean);

    return isTimesheetUser ? mapped : [ALL_STAFF_OPTION, ...mapped];
  }, [staff, isTimesheetUser]);

  useEffect(() => {
    if (isTimesheetUser && staffOptions.length > 0) {
      setStaffFilter(staffOptions[0]);
    }
  }, [isTimesheetUser, staffOptions, setStaffFilter]);

  return (
    <div className="tsr-filter-bar">
      <div className="tsr-filter-grid tsr-filter-grid--professional">
        <div className="tsr-filter-field">
          <label className={`tsr-filter-label ${errors?.dateFrom ? 'tsr-filter-label--err' : ''}`}>
            Date From <span className="tsr-req">*</span>
          </label>
          <div className="form-wrapper">
            <DatePicker
              selected={dateFrom}
              onChange={setDateFrom}
              className={`form-input ${errors?.dateFrom ? 'input-error' : ''}`}
              wrapperClassName="input-date-picker"
              dateFormat="yyyy-MM-dd"
              placeholderText="Start date"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
            <span className={`chevron-input-icon fas fa-calendar ${errors?.dateFrom ? 'input-icon-error' : ''}`} />
          </div>
          {errors?.dateFrom && <span className="tsr-filter-err"><i className="fas fa-circle-exclamation" /> {errors.dateFrom}</span>}
        </div>

        <div className="tsr-filter-field">
          <label className={`tsr-filter-label ${errors?.dateTo ? 'tsr-filter-label--err' : ''}`}>
            Date To <span className="tsr-req">*</span>
          </label>
          <div className="form-wrapper">
            <DatePicker
              selected={dateTo}
              onChange={setDateTo}
              className={`form-input ${errors?.dateTo ? 'input-error' : ''}`}
              wrapperClassName="input-date-picker"
              dateFormat="yyyy-MM-dd"
              placeholderText="End date"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
            <span className={`chevron-input-icon fas fa-calendar ${errors?.dateTo ? 'input-icon-error' : ''}`} />
          </div>
          {errors?.dateTo && <span className="tsr-filter-err"><i className="fas fa-circle-exclamation" /> {errors.dateTo}</span>}
        </div>

        <div className="tsr-filter-field">
          <label className="tsr-filter-label">Staff</label>
          <div className="form-wrapper">
            <Select
              options={staffOptions}
              value={isTimesheetUser ? (staffOptions[0] || null) : (staffFilter || ALL_STAFF_OPTION)}
              onChange={(opt) => setStaffFilter(opt || ALL_STAFF_OPTION)}
              onInputChange={(inputValue, actionMeta) => {
                if (actionMeta.action === 'input-change') {
                  searchStaff(inputValue.length > 1 ? inputValue : '');
                }
                return inputValue;
              }}
              getOptionLabel={(option) => String(option?.label || '')}
              getOptionValue={(option) => String(option?.value || '')}
              placeholder="Search staff..."
              className="form-input-select"
              classNamePrefix="form-input-select"
              isClearable={false}
              isDisabled={isTimesheetUser}
              menuPortalTarget={document.body}
              styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
              onMenuOpen={() => setOpenMenuId('staff')}
              onMenuClose={() => setOpenMenuId(null)}
            />
            <span className={`chevron-input-icon fas fa-chevron-down ${openMenuId === 'staff' ? 'chevron-rotate' : ''}`} />
          </div>
        </div>

        <div className="tsr-filter-field">
          <label className="tsr-filter-label">Search</label>
          <div className="form-wrapper">
            <input
              className="form-input"
              value={search}
              placeholder="Client, project, task, staff..."
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="input-icon fas fa-search" />
          </div>
        </div>

        <div className="tsr-filter-field tsr-filter-btn-cell">
          <label className="tsr-filter-label">&nbsp;</label>
          <button className="tsr-search-btn" onClick={() => onSearch(1)} disabled={loading}>
            {loading ? <><div className="tsr-btn-loader" /> Generating...</> : <><i className="fas fa-clock" /> Generate Report</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const EmptyPrompt = () => (
  <motion.div className="tsr-empty-prompt" variants={fadeUp} initial="hidden" animate="show">
    <div className="tsr-empty-icon"><i className="fas fa-business-time" /></div>
    <h3 className="tsr-empty-title">No report generated yet</h3>
    <p className="tsr-empty-sub">
      Select a reporting period and click <strong>Generate Report</strong> to view paginated timesheet activity.
    </p>
  </motion.div>
);

const KpiStrip = ({ summary }) => {
  if (!summary) return null;
  return (
    <div className="tsr-kpi-strip">
      <div className="tsr-kpi-cell tsr-kpi-cell--primary">
        <span className="tsr-kpi-label">Total Hours</span>
        <span className="tsr-kpi-value">{fmtHours(summary.grand_total_hours)}</span>
        <span className="tsr-kpi-pill tsr-pill--total"><i className="fas fa-sigma" /> Productive time</span>
      </div>
      <div className="tsr-kpi-cell">
        <span className="tsr-kpi-label">Entries</span>
        <span className="tsr-kpi-value">{fmtCount(summary.entry_count)}</span>
        <span className="tsr-kpi-pill tsr-pill--neutral"><i className="fas fa-list-check" /> Timesheet lines</span>
      </div>
      <div className="tsr-kpi-cell">
        <span className="tsr-kpi-label">Staff</span>
        <span className="tsr-kpi-value">{fmtCount(summary.staff_count)}</span>
        <span className="tsr-kpi-pill tsr-pill--blue"><i className="fas fa-users" /> Contributors</span>
      </div>
      <div className="tsr-kpi-cell">
        <span className="tsr-kpi-label">Clients</span>
        <span className="tsr-kpi-value">{fmtCount(summary.client_count)}</span>
        <span className="tsr-kpi-pill tsr-pill--watch"><i className="fas fa-briefcase" /> Serviced</span>
      </div>
      <div className="tsr-kpi-cell">
        <span className="tsr-kpi-label">Avg / Day</span>
        <span className="tsr-kpi-value">{fmtHours(summary.average_hours_per_day)}</span>
        <span className="tsr-kpi-pill tsr-pill--watch"><i className="fas fa-chart-line" /> Active days</span>
      </div>
    </div>
  );
};

const Pagination = ({ pagination, loading, onPageChange }) => {
  const total = Number(pagination?.total || 0);
  const currentPage = Number(pagination?.page || 1);
  const limit = Number(pagination?.limit || DEFAULT_LIMIT);
  const totalPages = Number(pagination?.pages || 0);

  if (!total || totalPages <= 1) return null;

  const from = ((currentPage - 1) * limit) + 1;
  const to = Math.min(currentPage * limit, total);
  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="tsr-pagination-container">
      <div className="tsr-pagination-info">
        Showing {fmtCount(from)} to {fmtCount(to)} of {fmtCount(total)} timesheet entries
      </div>
      <div className="tsr-pagination-controls">
        <button className="tsr-pagination-btn" onClick={() => onPageChange(currentPage - 1)} disabled={loading || currentPage === 1}>
          <i className="fas fa-chevron-left" />
        </button>
        {pages.map((page, index) => (
          page === '...'
            ? <span key={`ellipsis-${index}`} className="tsr-pagination-ellipsis">...</span>
            : (
              <button
                key={page}
                className={`tsr-pagination-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => onPageChange(page)}
                disabled={loading || currentPage === page}
              >
                {page}
              </button>
            )
        ))}
        <button className="tsr-pagination-btn" onClick={() => onPageChange(currentPage + 1)} disabled={loading || currentPage === totalPages}>
          <i className="fas fa-chevron-right" />
        </button>
      </div>
    </div>
  );
};

const ResultsView = ({ data, summary, meta, pagination, onExcel, excelLoading, onPdf, pdfLoading, onPageChange, loading }) => {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <div className="tsr-action-bar">
        <div className="tsr-action-left">
          <div className="tsr-results-badge"><i className="fas fa-business-time" /> Timesheet Report</div>
          <div className="tsr-meta-badge"><i className="fas fa-calendar" /> {fmtDate(meta?.datefrom)} - {fmtDate(meta?.dateto)}</div>
          <div className="tsr-meta-badge"><i className="fas fa-users" /> {meta?.staff_filter || 'All Staff'}</div>
          <div className="tsr-meta-badge"><i className="fas fa-layer-group" /> Page {pagination?.page || 1} of {pagination?.pages || 1}</div>
        </div>
        <div className="tsr-action-right">
          <button className="tsr-excel-btn" onClick={onExcel} disabled={excelLoading}>
            {excelLoading ? <><div className="tsr-btn-loader tsr-btn-loader--sm" /> Downloading...</> : <><i className="fas fa-file-excel" /> Export Excel</>}
          </button>
          <button className="tsr-pdf-btn" onClick={onPdf} disabled={pdfLoading}>
            {pdfLoading ? <><div className="tsr-btn-loader tsr-btn-loader--sm" /> Building PDF...</> : <><i className="fas fa-file-pdf" /> Export PDF</>}
          </button>
        </div>
      </div>

      <KpiStrip summary={summary} />

      <div className="tsr-report-paper">
        <div className="tsr-report-paper-header">
          <div className="tsr-report-title-block">
            <h2 className="tsr-report-title">Timesheet Activity Report</h2>
            <p className="tsr-report-sub">
              Paginated timesheet entries with full-period KPI totals · Generated {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <img src={CompanyLogo} alt="Logo" className="tsr-company-logo" />
        </div>

        <div className="tsr-table-wrap">
          <table className="tsr-table">
            <thead>
              <tr>
                <th className="tsr-th-wide">Staff / Date</th>
                <th>Client</th>
                <th>Project</th>
                <th>Task</th>
                <th className="tsr-th-num">Start</th>
                <th className="tsr-th-num">Finish</th>
                <th className="tsr-th-num">Hours</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="tsr-empty-cell">No timesheet entries found for the selected filters.</td>
                </tr>
              ) : (
                data.map((group, i) => (
                  <React.Fragment key={`${group.staff_id}-${group.staff_name}-${i}`}>
                    <tr className="tsr-group-row">
                      <td className="tsr-staff-name">{safe(group.staff_name)}</td>
                      <td>{fmtCount(group.entry_count)} entries on page</td>
                      <td>{fmtCount(group.client_count)} clients</td>
                      <td>{fmtDate(group.first_entry_date)} - {fmtDate(group.last_entry_date)}</td>
                      <td className="tsr-td-num">{fmtCount(group.days_logged)} days</td>
                      <td className="tsr-td-num">Avg {fmtHours(group.average_entry_hours)}</td>
                      <td className="tsr-td-num tsr-td-total">{fmtHours(group.total_hours)}</td>
                    </tr>
                    {(group.entries || []).map((entry, j) => (
                      <tr key={`${entry.id}-${j}`}>
                        <td className="tsr-date-cell">{fmtDate(entry.date)}</td>
                        <td>{safe(entry.clients_name)}</td>
                        <td>{safe(entry.project)}</td>
                        <td className="tsr-task-cell">{safe(entry.task)}</td>
                        <td className="tsr-td-num">{safe(entry.start_time)}</td>
                        <td className="tsr-td-num">{safe(entry.finish_time)}</td>
                        <td className="tsr-td-num tsr-td-total">{fmtHours(entry.total_hours)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
            {data.length > 0 && summary && (
              <tfoot>
                <tr className="tsr-tfoot-row">
                  <td>Full-period Total</td>
                  <td>{fmtCount(summary.staff_count)} staff</td>
                  <td>{fmtCount(summary.project_count)} projects</td>
                  <td>{fmtCount(summary.entry_count)} entries</td>
                  <td />
                  <td />
                  <td className="tsr-tfoot-val">{fmtHours(summary.grand_total_hours)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <Pagination pagination={pagination} loading={loading} onPageChange={onPageChange} />
      </div>
    </motion.div>
  );
};

const TimesheetReport = () => {
  const [nav, setNav] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dateFrom, setDateFrom] = useState(monthStartDate());
  const [dateTo, setDateTo] = useState(new Date());
  const [staffFilter, setStaffFilter] = useState(ALL_STAFF_OPTION);
  const [search, setSearch] = useState('');
  const [pageLimit] = useState(DEFAULT_LIMIT);

  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const isTimesheetUser = isTimesheetOnly(user);
  const { timesheetReport, fetchPaginatedTimesheetReport, fetchTimesheetReportForExport, downloadTimesheetExcel } = useTimesheetReportStore();

  useEffect(() => { document.title = 'Smartbooks | Timesheet Report'; }, []);

  const links = isTimesheetUser
    ? [
        { label: 'Timesheets', to: '/timesheet/home', active: true },
        { label: 'Timesheet Report', to: '/reports/timesheet', active: false },
      ]
    : [
        { label: 'Home', to: '/', active: true },
        { label: 'Reports & Analytics', to: '/reports/ledger', active: true },
        { label: 'Timesheet Report', to: '/reports/timesheet', active: false },
      ];

  const validate = useCallback(() => {
    const e = {};
    if (!dateFrom) e.dateFrom = 'Required';
    if (!dateTo) e.dateTo = 'Required';
    if (dateFrom && dateTo && dateFrom > dateTo) {
      e.dateTo = 'Date To must be after Date From';
    }
    return e;
  }, [dateFrom, dateTo]);

  const buildParams = useCallback((page = 1) => ({
    datefrom: toLocalISO(dateFrom),
    dateto: toLocalISO(dateTo),
    staff: isTimesheetUser ? 'My Timesheet' : (staffFilter?.value || 'All Staff'),
    search: search.trim(),
    page,
    limit: pageLimit,
  }), [dateFrom, dateTo, staffFilter, search, pageLimit, isTimesheetUser]);

  const handleSearch = useCallback(async (targetPage = 1) => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const result = await fetchPaginatedTimesheetReport(buildParams(targetPage));
    if (result) setHasSearched(true);
  }, [validate, fetchPaginatedTimesheetReport, buildParams]);

  const handleExcel = useCallback(async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setExcelLoading(true);
    await downloadTimesheetExcel(buildParams(1));
    setExcelLoading(false);
  }, [validate, downloadTimesheetExcel, buildParams]);


  const handlePdf = useCallback(async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setPdfLoading(true);
    try {
      const exportPayload = await fetchTimesheetReportForExport(buildParams(1));
      if (!exportPayload) return;

      const blob = await pdf(
        <DownloadTimesheetReport
          data={exportPayload.data || []}
          summary={exportPayload.summary || null}
          meta={exportPayload.meta || buildParams(1)}
        />
      ).toBlob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Timesheet_Report_${toLocalISO(dateFrom) || 'from'}_to_${toLocalISO(dateTo) || 'to'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  }, [validate, fetchTimesheetReportForExport, buildParams, dateFrom, dateTo]);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <div className={`tsr-root theme-${theme}`}>
          <div className="tsr-page">
            <PageNav pageTitle="Timesheet Report" links={links} />

            <FilterBar
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              staffFilter={staffFilter}
              setStaffFilter={setStaffFilter}
              search={search}
              setSearch={setSearch}
              errors={errors}
              loading={timesheetReport.loading}
              onSearch={handleSearch}
              isTimesheetUser={isTimesheetUser}
            />

            <AnimatePresence mode="wait">
              {!hasSearched ? (
                <motion.div key="prompt" variants={fadeUp} initial="hidden" animate="show" exit="exit">
                  <EmptyPrompt />
                </motion.div>
              ) : (
                <motion.div key="results" variants={fadeUp} initial="hidden" animate="show" exit="exit">
                  <ResultsView
                    data={timesheetReport.data || []}
                    summary={timesheetReport.summary}
                    meta={timesheetReport.meta || buildParams(1)}
                    pagination={timesheetReport.pagination}
                    onExcel={handleExcel}
                    excelLoading={excelLoading}
                    onPdf={handlePdf}
                    pdfLoading={pdfLoading}
                    onPageChange={handleSearch}
                    loading={timesheetReport.loading}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimesheetReport;
