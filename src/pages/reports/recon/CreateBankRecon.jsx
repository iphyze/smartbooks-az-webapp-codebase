import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp } from '../../../utils/animation';
import NavBar from '../../NavBar';
import Header from '../../Header';
import DatePicker from 'react-datepicker';
import useThemeStore from '../../../stores/useThemeStore';
import PageNav from '../../../components/PageNav';
import ChartSearchableSelect from '../../../components/ChartSearchableSelect';
import useBankReconStore from '../../../stores/useBankReconStore';
import { CURRENCY_OPTIONS, toISO } from './BankReconUtils';
import { Field, FileDrop } from './BankReconCommon';
import './BankReconciliation.css';
import 'react-datepicker/dist/react-datepicker.css';

const CreateBankRecon = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const { creating, createReconciliation } = useBankReconStore();

  // Form state
  const [errors, setErrors] = useState({});
  const [company, setCo]    = useState('');
  const [bankName, setBN]   = useState('');
  const [acctName, setAN]   = useState('');
  const [acctNo, setANo]    = useState('');
  const [currency, setCCY]  = useState('NGN');
  const [from, setFrom]     = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [to, setTo]         = useState(new Date());
  const [bankFile, setBF]   = useState(null);
  const [ledgerFile, setLF] = useState(null);
  const [bals, setBals]     = useState({ bank_opening: '', bank_closing: '', ledger_opening: '', ledger_closing: '', tolerance_days: 7, tolerance_amount: 0 });
  const [notes, setNotes]   = useState('');

  const links = [
    { label: 'Home', to: '/', active: true },
    { label: 'Reports & Analytics', to: '/reports/ledger', active: true },
    { label: 'Bank Reconciliations', to: '/reports/bank-recon', active: true },
    { label: 'New Reconciliation', to: '/reports/bank-recon/create', active: false },
  ];

  useEffect(() => { document.title = 'Smartbooks | New Bank Reconciliation'; }, []);

  const upd      = (k, v) => setBals((s) => ({ ...s, [k]: v }));
  const clearErr = (key) => setErrors((s) => { const n = { ...s }; delete n[key]; return n; });

  const validate = () => {
    const e = {};
    if (!company.trim()) e.company = 'Required';
    if (!from) e.from = 'Required';
    if (!to) e.to = 'Required';
    if (from && to && from > to) e.to = 'Must be after Period From';
    if (!bankFile) e.bankFile = 'Required';
    if (!ledgerFile) e.ledgerFile = 'Required';
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    const res = await createReconciliation({
      company_name: company.trim(), bank_name: bankName.trim(),
      account_name: acctName.trim(), account_number: acctNo.trim(),
      currency, period_from: toISO(from), period_to: toISO(to),
      bank_file: bankFile, ledger_file: ledgerFile,
      notes: notes.trim(), ...bals,
    });
    if (res?.data?.id) navigate(`/reports/bank-recon/workspace/${res.data.id}`);
  };

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
            <PageNav pageTitle="New Bank Reconciliation" links={links} />

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.3, delay: 0.2, ease: 'easeInOut' }}
              className={`invoice-form-box theme-${theme}`}
            >
              <div className="invoice-form-f-container">
                <div className="invoice-form-header">
                  <div className="invoice-form-htxt">New Bank Reconciliation</div>
                  <div className="invoice-form-sub-htxt">
                    Upload your bank and ledger statements. Transactions will be auto-matched and you can manually reconcile the rest.
                  </div>
                </div>

                <div className="invoice-form-flex-box">

                  {/* ── Company / Client ── */}
                  <div className="invoice-form invoice-form-full">
                    <div className="input-form-wrapper">
                      <div className={`input-form-group ${errors.company ? 'input-form-error' : ''}`}>
                        <label className={`input-form-label ${errors.company ? 'input-label-message' : ''}`}>
                          Company / Client <span style={{ color: '#f47c7c' }}>*</span>
                        </label>
                        <div className="form-wrapper">
                          <input className={`form-input form-input-no-padding ${errors.company ? 'input-error' : ''}`} value={company} onChange={(e) => { setCo(e.target.value); clearErr('company'); }} placeholder="e.g. Lambert Electromec Ltd" />
                        </div>
                      </div>
                      {errors.company && <div className="input-error-message">{errors.company}</div>}
                    </div>
                  </div>

                  {/* ── Bank Name ── */}
                  <div className="invoice-form invoice-form-three">
                    <div className="input-form-wrapper">
                      <div className="input-form-group">
                        <label className="input-form-label">Bank Name</label>
                        <div className="form-wrapper">
                          <input className="form-input form-input-no-padding" value={bankName} onChange={(e) => setBN(e.target.value)} placeholder="e.g. Zenith Bank" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Account Name ── */}
                  <div className="invoice-form invoice-form-three">
                    <div className="input-form-wrapper">
                      <div className="input-form-group">
                        <label className="input-form-label">Account Name</label>
                        <div className="form-wrapper">
                          <input className="form-input form-input-no-padding" value={acctName} onChange={(e) => setAN(e.target.value)} placeholder="Optional" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Account Number ── */}
                  <div className="invoice-form invoice-form-three">
                    <div className="input-form-wrapper">
                      <div className="input-form-group">
                        <label className="input-form-label">Account Number</label>
                        <div className="form-wrapper">
                          <input className="form-input form-input-no-padding" value={acctNo} onChange={(e) => setANo(e.target.value)} placeholder="Optional" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Currency ── */}
                  <div className="invoice-form invoice-form-three">
                    <div className="input-form-wrapper">
                      <div className="input-form-group">
                        <label className="input-form-label">Currency</label>
                        <div className="filter-wrapper">
                          <ChartSearchableSelect options={CURRENCY_OPTIONS} value={currency} onChange={setCCY} className="box-filter-limit" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Period From ── */}
                  <div className="invoice-form invoice-form-three">
                    <div className="input-form-wrapper">
                      <div className={`input-form-group ${errors.from ? 'input-form-error' : ''}`}>
                        <label className={`input-form-label ${errors.from ? 'input-label-message' : ''}`}>
                          Period From <span style={{ color: '#f47c7c' }}>*</span>
                        </label>
                        <div className="form-wrapper">
                          <DatePicker selected={from} onChange={(d) => { setFrom(d); clearErr('from'); }} className={`form-input ${errors.from ? 'input-error' : ''}`} wrapperClassName="input-date-picker" dateFormat="yyyy-MM-dd" showMonthDropdown showYearDropdown dropdownMode="select" />
                          <span className="chevron-input-icon fas fa-calendar" />
                        </div>
                      </div>
                      {errors.from && <div className="input-error-message">{errors.from}</div>}
                    </div>
                  </div>

                  {/* ── Period To ── */}
                  <div className="invoice-form invoice-form-three">
                    <div className="input-form-wrapper">
                      <div className={`input-form-group ${errors.to ? 'input-form-error' : ''}`}>
                        <label className={`input-form-label ${errors.to ? 'input-label-message' : ''}`}>
                          Period To <span style={{ color: '#f47c7c' }}>*</span>
                        </label>
                        <div className="form-wrapper">
                          <DatePicker selected={to} onChange={(d) => { setTo(d); clearErr('to'); }} minDate={from || undefined} className={`form-input ${errors.to ? 'input-error' : ''}`} wrapperClassName="input-date-picker" dateFormat="yyyy-MM-dd" showMonthDropdown showYearDropdown dropdownMode="select" />
                          <span className="chevron-input-icon fas fa-calendar" />
                        </div>
                      </div>
                      {errors.to && <div className="input-error-message">{errors.to}</div>}
                    </div>
                  </div>

                  {/* ── Balance fields ── */}
                  {[['bank_opening','Bank Opening Balance'],['bank_closing','Bank Closing Balance'],['ledger_opening','Ledger Opening Balance'],['ledger_closing','Ledger Closing Balance']].map(([k, lbl]) => (
                    <div key={k} className="invoice-form invoice-form-three">
                      <div className="input-form-wrapper">
                        <div className="input-form-group">
                          <label className="input-form-label">{lbl}</label>
                          <div className="form-wrapper">
                            <input className="form-input form-input-no-padding" value={bals[k]} onChange={(e) => upd(k, e.target.value)} placeholder="0.00" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* ── Tolerance fields ── */}
                  <div className="invoice-form invoice-form-three">
                    <div className="input-form-wrapper">
                      <div className="input-form-group">
                        <label className="input-form-label">Date Tolerance (days)</label>
                        <div className="form-wrapper">
                          <input className="form-input form-input-no-padding" type="number" min={0} max={30} value={bals.tolerance_days} onChange={(e) => upd('tolerance_days', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="invoice-form invoice-form-three">
                    <div className="input-form-wrapper">
                      <div className="input-form-group">
                        <label className="input-form-label">Amount Tolerance</label>
                        <div className="form-wrapper">
                          <input className="form-input form-input-no-padding" value={bals.tolerance_amount} onChange={(e) => upd('tolerance_amount', e.target.value)} placeholder="0.00" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── File uploads — use FileDrop from BankReconCommon ── */}
                  <div className="invoice-form invoice-form-half">
                    <div className="input-form-wrapper">
                      <div className={`input-form-group ${errors.bankFile ? 'input-form-error' : ''}`}>
                        <label className={`input-form-label ${errors.bankFile ? 'input-label-message' : ''}`}>
                          Bank Statement <span style={{ color: '#f47c7c' }}>*</span>
                        </label>
                        <label className={`br-drop ${bankFile ? 'br-drop--ok' : ''} ${errors.bankFile ? 'br-drop--err' : ''}`}>
                          <input type="file" style={{ display: 'none' }} accept=".csv,.xlsx,.xls" onChange={(e) => { setBF(e.target.files?.[0] || null); clearErr('bankFile'); }} />
                          <i className={`fas ${bankFile ? 'fa-check-circle' : 'fa-cloud-arrow-up'} br-drop-icon`} />
                          <span className="br-drop-name">{bankFile?.name || 'Click to upload CSV / XLSX'}</span>
                          <span className="br-drop-hint">Date · Description · Debit · Credit · Balance</span>
                        </label>
                        {errors.bankFile && <div className="input-error-message">{errors.bankFile}</div>}
                      </div>
                    </div>
                  </div>

                  <div className="invoice-form invoice-form-half">
                    <div className="input-form-wrapper">
                      <div className={`input-form-group ${errors.ledgerFile ? 'input-form-error' : ''}`}>
                        <label className={`input-form-label ${errors.ledgerFile ? 'input-label-message' : ''}`}>
                          Ledger Statement <span style={{ color: '#f47c7c' }}>*</span>
                        </label>
                        <label className={`br-drop ${ledgerFile ? 'br-drop--ok' : ''} ${errors.ledgerFile ? 'br-drop--err' : ''}`}>
                          <input type="file" style={{ display: 'none' }} accept=".csv,.xlsx,.xls" onChange={(e) => { setLF(e.target.files?.[0] || null); clearErr('ledgerFile'); }} />
                          <i className={`fas ${ledgerFile ? 'fa-check-circle' : 'fa-cloud-arrow-up'} br-drop-icon`} />
                          <span className="br-drop-name">{ledgerFile?.name || 'Click to upload CSV / XLSX'}</span>
                          <span className="br-drop-hint">Date · Description · Debit · Credit · Ledger · Balance</span>
                        </label>
                        {errors.ledgerFile && <div className="input-error-message">{errors.ledgerFile}</div>}
                      </div>
                    </div>
                  </div>

                  {/* ── Notes ── */}
                  <div className="invoice-form invoice-form-full">
                    <div className="input-form-wrapper">
                      <div className="input-form-group">
                        <label className="input-form-label">Notes</label>
                        <textarea className="form-input" style={{ minHeight: 72, resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reviewer notes, assumptions or client context…" />
                      </div>
                    </div>
                  </div>

                </div>

                <div className="invoice-action-btn main-submit-action-btn">
                  <div className="invoice-action-btn-wrapper">
                    <button type="button" disabled={creating} className="invoice-submit-btn" onClick={submit}>
                      {creating
                        ? <div className="invoice-loader" />
                        : <span className="invoice-submit-btn-text"><i className="fas fa-scale-balanced" style={{ marginRight: 8 }} />Create &amp; Auto-Match</span>}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBankRecon;
