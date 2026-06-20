import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import useBankReconStore from '../../../stores/useBankReconStore';
import ReconSelect from './ReconSelect';
import { CURRENCY_OPTIONS, toISO } from './BankReconUtils';
import { Field } from './BankReconCommon';

const BankReconHeaderEditModal = ({ recon, onClose }) => {
  const { saving, updateReconciliation } = useBankReconStore();
  const [form, setForm] = useState(null);
  useEffect(() => {
    setForm({
      company_name: recon.company_name || '', bank_name: recon.bank_name || '', account_name: recon.account_name || '',
      account_number: recon.account_number || '', currency: recon.currency || 'NGN',
      period_from: recon.period_from ? new Date(`${recon.period_from}T00:00:00`) : new Date(),
      period_to: recon.period_to ? new Date(`${recon.period_to}T00:00:00`) : new Date(),
      bank_opening: recon.bank_opening || '0', bank_closing: recon.bank_closing || '0',
      ledger_opening: recon.ledger_opening || '0', ledger_closing: recon.ledger_closing || '0',
      tolerance_days: recon.tolerance_days ?? 7, tolerance_amount: recon.tolerance_amount ?? 0, notes: recon.notes || '',
    });
  }, [recon]);
  if (!form) return null;
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const save = async (event) => {
    event.preventDefault();
    if (!form.company_name.trim()) return;
    const payload = { ...form, recon_id: recon.id, period_from: toISO(form.period_from), period_to: toISO(form.period_to) };
    const response = await updateReconciliation(payload);
    if (response) onClose();
  };
  return (
    <div className="br-modal-bg" role="presentation">
      <form className="br-modal br-modal--wide" onSubmit={save}>
        <div className="br-modal-head"><div><h3>Edit reconciliation details</h3><p>Update period, account and tolerance information.</p></div><button type="button" className="br-modal-x" onClick={onClose}><i className="fas fa-times" /></button></div>
        <div className="br-modal-form">
          <div className="br-modal-row"><Field label="Company / Client" required><input className="gaps-input" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} /></Field><Field label="Currency"><ReconSelect options={CURRENCY_OPTIONS} value={form.currency} onChange={(v) => set('currency', v)} /></Field></div>
          <div className="br-modal-row"><Field label="Bank Name"><input className="gaps-input" value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)} /></Field><Field label="Account Number"><input className="gaps-input" value={form.account_number} onChange={(e) => set('account_number', e.target.value)} /></Field></div>
          <div className="br-modal-row"><Field label="Period From"><DatePicker selected={form.period_from} onChange={(date) => set('period_from', date)} className="gaps-input" dateFormat="yyyy-MM-dd" /></Field><Field label="Period To"><DatePicker selected={form.period_to} onChange={(date) => set('period_to', date)} className="gaps-input" dateFormat="yyyy-MM-dd" minDate={form.period_from} /></Field></div>
          <div className="br-modal-row"><Field label="Bank Closing"><input className="gaps-input" value={form.bank_closing} onChange={(e) => set('bank_closing', e.target.value)} /></Field><Field label="Ledger Closing"><input className="gaps-input" value={form.ledger_closing} onChange={(e) => set('ledger_closing', e.target.value)} /></Field></div>
          <div className="br-modal-row"><Field label="Date Tolerance (days)"><input className="gaps-input" type="number" value={form.tolerance_days} onChange={(e) => set('tolerance_days', e.target.value)} /></Field><Field label="Amount Tolerance"><input className="gaps-input" value={form.tolerance_amount} onChange={(e) => set('tolerance_amount', e.target.value)} /></Field></div>
          <Field label="Notes"><textarea className="gaps-input br-textarea" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
        </div>
        <div className="br-modal-foot"><button type="button" className="br-btn-ghost" onClick={onClose}>Cancel</button><button type="submit" className="br-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
      </form>
    </div>
  );
};
export default BankReconHeaderEditModal;
