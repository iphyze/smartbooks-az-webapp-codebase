import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../../utils/animation';
import NavBar from '../../NavBar';
import Header from '../../Header';
import useThemeStore from '../../../stores/useThemeStore';
import PageNav from '../../../components/PageNav';
import EditLoaderComponent from '../../../components/EditLoaderComponent';
import useBankReconStore from '../../../stores/useBankReconStore';
import DatePicker from 'react-datepicker';
import ChartSearchableSelect from '../../../components/ChartSearchableSelect';
import { CURRENCY_OPTIONS, toISO } from './BankReconUtils';
import './BankReconciliation.css';
import 'react-datepicker/dist/react-datepicker.css';

const parseAmt = (v) => { const n = parseFloat(String(v || '0').replace(/[^0-9.-]/g, '')); return isNaN(n) ? 0 : n; };


// ── Defined outside EditBankRecon so React doesn't remount it on every keystroke ──
const FileAppendRow = ({ label, currentName, newFile, onClear, inputRef, onFileChange }) => (
    <div className="invoice-form invoice-form-half">
      <div className="input-form-wrapper">
        <div className="input-form-group">
          <label className="input-form-label">{label}</label>
          {!newFile ? (
            <label
              className="br-drop"
              style={{ minHeight: 80 }}
              title="Upload an additional statement file"
            >
              <input
                type="file"
                ref={inputRef}
                style={{ display: 'none' }}
                accept=".csv,.xlsx,.xls"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              />
              <i className="fas fa-cloud-arrow-up br-drop-icon" />
              <span className="br-drop-name" style={{ fontSize: 12 }}>
                Current: <strong>{currentName || '—'}</strong>
              </span>
              <span className="br-drop-hint">Append additional lines (optional)</span>
            </label>
          ) : (
            <div className="br-drop br-drop--ok" style={{ minHeight: 80, cursor: 'default' }}>
              <i className="fas fa-check-circle br-drop-icon" />
              <span className="br-drop-name">{newFile.name}</span>
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#f47c7c', marginTop: 4 }}
                onClick={() => { onClear(null); if (inputRef.current) inputRef.current.value = ''; }}
              >
                <i className="fas fa-xmark" style={{ marginRight: 4 }} />Remove selected file
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const FormField = ({ label, err, required, children }) => (
  <div className="input-form-wrapper">
    <div className={`input-form-group ${err ? 'input-form-error' : ''}`}>
      <label className={`input-form-label ${err ? 'input-label-message' : ''}`}>
        {label}{required && <span style={{ color: '#f47c7c' }}> *</span>}
      </label>
      {children}
    </div>
    {err && <div className="input-error-message">{err}</div>}
  </div>
);


const EditBankRecon = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const [nav, setNav] = useState(false);

  const { fetchSingle, updateReconciliation, saving } = useBankReconStore();
  const recon   = useBankReconStore((s) => s.current.reconciliation);
  const loading = useBankReconStore((s) => s.current.loading);

  const [form, setForm]           = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [newBankFile, setNewBankFile]     = useState(null);
  const [newLedgerFile, setNewLedgerFile] = useState(null);
  const bankFileRef   = useRef(null);
  const ledgerFileRef = useRef(null);

  const links = [
    { label: 'Home', to: '/', active: true },
    { label: 'Reports & Analytics', to: '/reports/ledger', active: true },
    { label: 'Bank Reconciliations', to: '/reports/bank-recon', active: true },
    { label: 'Edit', to: `/reports/bank-recon/edit/${id}`, active: false },
  ];

  useEffect(() => {
    document.title = 'Smartbooks | Edit Reconciliation';
    if (id) fetchSingle(parseInt(id, 10));
  }, [id]);

  useEffect(() => {
    if (!recon) return;
    setForm({
      company_name:     recon.company_name   || '',
      bank_name:        recon.bank_name      || '',
      account_name:     recon.account_name   || '',
      account_number:   recon.account_number || '',
      currency:         recon.currency       || 'NGN',
      period_from:      recon.period_from    ? new Date(`${recon.period_from}T00:00:00`) : new Date(),
      period_to:        recon.period_to      ? new Date(`${recon.period_to}T00:00:00`)   : new Date(),
      bank_opening:     String(recon.bank_opening   || 0),
      bank_closing:     String(recon.bank_closing   || 0),
      ledger_opening:   String(recon.ledger_opening || 0),
      ledger_closing:   String(recon.ledger_closing || 0),
      tolerance_days:   String(recon.tolerance_days   ?? 7),
      tolerance_amount: String(recon.tolerance_amount ?? 0),
      notes: recon.notes || '',
    });
  }, [recon]);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const errors = submitted ? (() => {
    const e = {};
    if (!form?.company_name?.trim()) e.company_name = 'Required';
    if (!form?.period_from) e.period_from = 'Required';
    if (!form?.period_to) e.period_to = 'Required';
    if (form?.period_from && form?.period_to && form.period_from > form.period_to) {
      e.period_to = 'Must be after Period From';
    }
    return e;
  })() : {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!form?.company_name?.trim() || !form?.period_from || !form?.period_to || form.period_from > form.period_to) return;

    // Build FormData so we can optionally include new files
    const fd = new FormData();
    fd.append('recon_id',        parseInt(id, 10));
    fd.append('company_name',    form.company_name.trim());
    fd.append('bank_name',       form.bank_name.trim());
    fd.append('account_name',    form.account_name.trim());
    fd.append('account_number',  form.account_number.trim());
    fd.append('currency',        form.currency);
    fd.append('period_from',     toISO(form.period_from));
    fd.append('period_to',       toISO(form.period_to));
    fd.append('bank_opening',    parseAmt(form.bank_opening));
    fd.append('bank_closing',    parseAmt(form.bank_closing));
    fd.append('ledger_opening',  parseAmt(form.ledger_opening));
    fd.append('ledger_closing',  parseAmt(form.ledger_closing));
    fd.append('tolerance_days',  parseInt(form.tolerance_days, 10));
    fd.append('tolerance_amount', parseAmt(form.tolerance_amount));
    fd.append('notes',           form.notes);
    if (newBankFile)   fd.append('bank_file',   newBankFile);
    if (newLedgerFile) fd.append('ledger_file', newLedgerFile);

    const res = await updateReconciliation(fd);
    if (res) navigate(`/reports/bank-recon/workspace/${id}`);
  };


  if (loading || !form) return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} /><NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}><div className="db-page">
          <PageNav pageTitle="Edit Reconciliation" links={links} />
          <EditLoaderComponent text="Loading reconciliation…" />
        </div></div>
      </div>
    </div>
  );


  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
            <PageNav pageTitle="Edit Reconciliation" links={links} />

            <motion.div variants={fadeInUp} initial="hidden" animate="show"
              transition={{ duration: 0.3, delay: 0.2, ease: 'easeInOut' }}
              className={`invoice-form-box theme-${theme}`}
            >
              <form className="invoice-form-f-container" onSubmit={handleSubmit} noValidate>
                <div className="invoice-form-header">
                  <div className="invoice-form-htxt">Edit Reconciliation</div>
                  <div className="invoice-form-sub-htxt">
                    Update the reconciliation details or append an updated statement extract. Existing lines, matches and classifications are preserved; only genuinely new transactions are added.
                  </div>
                </div>

                <div className="invoice-form-flex-box">

                  <div className="invoice-form invoice-form-full">
                    <FormField label="Company / Client" required err={errors.company_name}>
                      <div className="form-wrapper">
                        <input className={`form-input form-input-no-padding ${errors.company_name ? 'input-error' : ''}`} value={form.company_name} onChange={(e) => upd('company_name', e.target.value)} />
                      </div>
                    </FormField>
                  </div>

                  <div className="invoice-form invoice-form-three">
                    <FormField label="Bank Name">
                      <div className="form-wrapper"><input className="form-input form-input-no-padding" value={form.bank_name} onChange={(e) => upd('bank_name', e.target.value)} /></div>
                    </FormField>
                  </div>
                  <div className="invoice-form invoice-form-three">
                    <FormField label="Account Name">
                      <div className="form-wrapper"><input className="form-input form-input-no-padding" value={form.account_name} onChange={(e) => upd('account_name', e.target.value)} /></div>
                    </FormField>
                  </div>
                  <div className="invoice-form invoice-form-three">
                    <FormField label="Account Number">
                      <div className="form-wrapper"><input className="form-input form-input-no-padding" value={form.account_number} onChange={(e) => upd('account_number', e.target.value)} /></div>
                    </FormField>
                  </div>

                  <div className="invoice-form invoice-form-three">
                    <FormField label="Currency">
                      <div className="filter-wrapper"><ChartSearchableSelect options={CURRENCY_OPTIONS} value={form.currency} onChange={(v) => upd('currency', v)} className="box-filter-limit" /></div>
                    </FormField>
                  </div>
                  <div className="invoice-form invoice-form-three">
                    <FormField label="Period From" required err={errors.period_from}>
                      <div className="form-wrapper">
                        <DatePicker selected={form.period_from} onChange={(d) => upd('period_from', d)} className="form-input" wrapperClassName="input-date-picker" dateFormat="yyyy-MM-dd" showMonthDropdown showYearDropdown dropdownMode="select" />
                        <span className="chevron-input-icon fas fa-calendar" />
                      </div>
                    </FormField>
                  </div>
                  <div className="invoice-form invoice-form-three">
                    <FormField label="Period To" required err={errors.period_to}>
                      <div className="form-wrapper">
                        <DatePicker selected={form.period_to} onChange={(d) => upd('period_to', d)} minDate={form.period_from} className="form-input" wrapperClassName="input-date-picker" dateFormat="yyyy-MM-dd" showMonthDropdown showYearDropdown dropdownMode="select" />
                        <span className="chevron-input-icon fas fa-calendar" />
                      </div>
                    </FormField>
                  </div>

                  {[['bank_opening','Bank Opening Balance'],['bank_closing','Bank Closing Balance'],['ledger_opening','Ledger Opening Balance'],['ledger_closing','Ledger Closing Balance']].map(([k,lbl]) => (
                    <div key={k} className="invoice-form invoice-form-three">
                      <FormField label={lbl}>
                        <div className="form-wrapper"><input className="form-input form-input-no-padding" value={form[k]} onChange={(e) => upd(k, e.target.value)} placeholder="0.00" /></div>
                      </FormField>
                    </div>
                  ))}

                  <div className="invoice-form invoice-form-three">
                    <FormField label="Tolerance (days)">
                      <div className="form-wrapper"><input className="form-input form-input-no-padding" type="number" min={0} max={30} value={form.tolerance_days} onChange={(e) => upd('tolerance_days', e.target.value)} /></div>
                    </FormField>
                  </div>
                  <div className="invoice-form invoice-form-three">
                    <FormField label="Tolerance Amount">
                      <div className="form-wrapper"><input className="form-input form-input-no-padding" value={form.tolerance_amount} onChange={(e) => upd('tolerance_amount', e.target.value)} placeholder="0.00" /></div>
                    </FormField>
                  </div>

                  {/* ── Optional statement append ── */}
                  <div className="invoice-form invoice-form-full" style={{ marginTop: 8, marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sb-text-2, #3d5752)', paddingBottom: 4, borderBottom: '1px solid var(--sb-border, #deeee9)' }}>
                      <i className="fas fa-file-arrow-up" style={{ marginRight: 8, color: 'var(--color-green)' }} />
                      Append Statement Lines (optional)
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--sb-text-3, #7aada6)', margin: '8px 0 0' }}>
                      Uploading an updated extract only appends transactions that are not already present. Existing lines, matches, categories and manual classifications remain unchanged.
                    </p>
                  </div>

                  <FileAppendRow
                    label="Bank Statement"
                    currentName={recon?.bank_file_name}
                    newFile={newBankFile}
                    onClear={setNewBankFile}
                    inputRef={bankFileRef}
                    onFileChange={setNewBankFile}
                  />
                  <FileAppendRow
                    label="Ledger Statement"
                    currentName={recon?.ledger_file_name}
                    newFile={newLedgerFile}
                    onClear={setNewLedgerFile}
                    inputRef={ledgerFileRef}
                    onFileChange={setNewLedgerFile}
                  />

                  <div className="invoice-form invoice-form-full">
                    <FormField label="Notes">
                      <textarea className="form-input" style={{ minHeight: 72, resize: 'vertical' }} value={form.notes} onChange={(e) => upd('notes', e.target.value)} placeholder="Reviewer notes…" />
                    </FormField>
                  </div>
                </div>

                <div className="invoice-action-btn main-submit-action-btn">
                  <div className="invoice-action-btn-wrapper">
                    <button type="button" className="br-btn-ghost" onClick={() => navigate(`/reports/bank-recon/workspace/${id}`)} disabled={saving}>
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="invoice-submit-btn">
                      {saving ? <div className="invoice-loader" /> : <span className="invoice-submit-btn-text">Save Changes</span>}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBankRecon;