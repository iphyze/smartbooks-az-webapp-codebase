import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import useThemeStore from '../../../stores/useThemeStore';
import { getPortalSelectProps } from '../../../utils/selectPortal';
import useBankReconStore from '../../../stores/useBankReconStore';
import BankReconApplyRulesModal from './BankReconApplyRulesModal';
import { CATEGORY_OPTIONS, CLASSIFICATION_OPTIONS, AUTO_LEDGERS } from './BankReconUtils';

const emptyForm = {
  id: null,
  rule_name: '',
  source: 'bank',
  match_field: 'description',
  match_type: 'contains',
  keywords: '',
  direction: 'ANY',
  category_name: 'Bank Charge',
  recon_classification: "They Debit We Don't Credit",
  suggested_dr_ledger: 'Bank Charges & Commission',
  suggested_cr_ledger: 'Bank Ledger',
  priority: 100,
  is_active: 1,
};

const sourceOptions = [
  { id: 'bank', label: 'Bank only' },
  { id: 'ledger', label: 'Ledger only' },
  { id: 'both', label: 'Bank & Ledger' },
];

const fieldOptions = [
  { id: 'description', label: 'Description' },
  { id: 'reference', label: 'Reference' },
  { id: 'description_reference', label: 'Description + Reference' },
];

const matchOptions = [
  { id: 'contains', label: 'Contains' },
  { id: 'exact', label: 'Exact' },
  { id: 'regex', label: 'Regex' },
];

const directionOptions = [
  { id: 'ANY', label: 'Any direction' },
  { id: 'OUT', label: 'OUT / Bank Dr / Ledger Cr' },
  { id: 'IN', label: 'IN / Bank Cr / Ledger Dr' },
];

const textInputClassName = 'form-input form-input-no-padding br-rule-input';

const toSelectOptions = (options) => options.map((item) => ({
  value: item.id,
  label: item.label,
}));

const selectValue = (options, value) => options.find((item) => String(item.value) === String(value)) || null;

const RuleSelect = ({ options, value, onChange, portalSelectProps, isSearchable = false }) => {
  const mappedOptions = toSelectOptions(options);

  return (
    <Select
      {...portalSelectProps}
      className="form-input-select br-rule-select"
      classNamePrefix="form-input-select"
      options={mappedOptions}
      value={selectValue(mappedOptions, value)}
      onChange={(option) => onChange(option?.value || '')}
      isSearchable={isSearchable}
      menuPlacement="auto"
    />
  );
};

const BankReconAutoRulesPanel = ({ recon }) => {
  const { theme = 'light' } = useThemeStore();
  const portalSelectProps = useMemo(() => getPortalSelectProps(theme || 'light'), [theme]);

  const {
    autoRules,
    fetchAutoRules,
    saveAutoRule,
    deleteAutoRule,
    toggleAutoRule,
    applyAutoRules,
    saving,
  } = useBankReconStore();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [overrideManual, setOverrideManual] = useState(false);
  const [applyResult, setApplyResult] = useState(null);

  useEffect(() => {
    if (open) fetchAutoRules();
  }, [open, fetchAutoRules]);

  const activeCount = useMemo(() => (autoRules.data || []).filter((r) => Number(r.is_active) === 1).length, [autoRules.data]);

  const patchForm = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'category_name') {
        const ledgers = AUTO_LEDGERS[value] || AUTO_LEDGERS.Other || {};
        next.suggested_dr_ledger = ledgers.dr || prev.suggested_dr_ledger;
        next.suggested_cr_ledger = ledgers.cr || prev.suggested_cr_ledger;
      }
      if (key === 'direction' && !prev.id) {
        if (value === 'OUT') next.recon_classification = "They Debit We Don't Credit";
        if (value === 'IN') next.recon_classification = "They Credit We Don't Debit";
      }
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    const res = await saveAutoRule(form);
    if (res) setForm(emptyForm);
  };

  const editRule = (rule) => setForm({
    ...emptyForm,
    ...rule,
    id: Number(rule.id),
    is_active: Number(rule.is_active) ? 1 : 0,
  });

  const openApplyRulesModal = () => {
    setOverrideManual(false);
    setApplyResult(null);
    setApplyModalOpen(true);
  };

  const closeApplyRulesModal = () => {
    if (saving) return;
    setApplyModalOpen(false);
    setOverrideManual(false);
    setApplyResult(null);
  };

  const confirmApplyRules = async () => {
    const response = await applyAutoRules({
      recon_id: recon?.id,
      source: 'both',
      override_manual: overrideManual,
    });
    if (response) setApplyResult(response?.data?.stats || {});
  };

  return (
    <>
    <section className={`br-auto-rules ${open ? 'br-auto-rules--open' : ''}`}>
      <button type="button" className="br-auto-rules-toggle" onClick={() => setOpen((v) => !v)}>
        <span>
          <i className="fas fa-wand-magic-sparkles" />
          Auto-categorisation Rules
          <small>{activeCount} active · custom rules override the default Smartbooks detection</small>
        </span>
        <i className={`fas fa-chevron-${open ? 'up' : 'down'}`} />
      </button>

      {open && (
        <div className="br-auto-rules-body">
          <form className="br-rule-form" onSubmit={submit}>
            <div className="br-rule-grid">
              <label>
                Rule name
                <input className={textInputClassName} value={form.rule_name} onChange={(e) => patchForm('rule_name', e.target.value)} placeholder="e.g. Zenith SMS alert charge" />
              </label>
              <label>
                Source
                <RuleSelect options={sourceOptions} value={form.source} onChange={(value) => patchForm('source', value)} portalSelectProps={portalSelectProps} />
              </label>
              <label>
                Match field
                <RuleSelect options={fieldOptions} value={form.match_field} onChange={(value) => patchForm('match_field', value)} portalSelectProps={portalSelectProps} />
              </label>
              <label>
                Match type
                <RuleSelect options={matchOptions} value={form.match_type} onChange={(value) => patchForm('match_type', value)} portalSelectProps={portalSelectProps} />
              </label>
              <label className="br-rule-wide">
                Keywords / phrases / regex
                <textarea className={textInputClassName} value={form.keywords} onChange={(e) => patchForm('keywords', e.target.value)} placeholder="One per line or comma-separated, e.g. SMS Alert, NIP Charge" rows={2} />
              </label>
              <label>
                Direction
                <RuleSelect options={directionOptions} value={form.direction} onChange={(value) => patchForm('direction', value)} portalSelectProps={portalSelectProps} />
              </label>
              <label>
                Category
                <RuleSelect options={CATEGORY_OPTIONS} value={form.category_name} onChange={(value) => patchForm('category_name', value)} portalSelectProps={portalSelectProps} isSearchable />
              </label>
              <label>
                Recon classification
                <RuleSelect options={CLASSIFICATION_OPTIONS} value={form.recon_classification} onChange={(value) => patchForm('recon_classification', value)} portalSelectProps={portalSelectProps} isSearchable />
              </label>
              <label>
                Suggested DR ledger
                <input className={textInputClassName} value={form.suggested_dr_ledger} onChange={(e) => patchForm('suggested_dr_ledger', e.target.value)} />
              </label>
              <label>
                Suggested CR ledger
                <input className={textInputClassName} value={form.suggested_cr_ledger} onChange={(e) => patchForm('suggested_cr_ledger', e.target.value)} />
              </label>
              <label>
                Priority
                <input className={textInputClassName} type="number" value={form.priority} onChange={(e) => patchForm('priority', e.target.value)} />
                <small className="br-rule-field-hint">Lower numbers run first.</small>
              </label>
            </div>
            <div className="br-rule-actions">
              <label className="br-rule-check">
                <input type="checkbox" checked={Number(form.is_active) === 1} onChange={(e) => patchForm('is_active', e.target.checked ? 1 : 0)} />
                Active
              </label>
              {form.id && <button type="button" className="br-btn-ghost-sm" onClick={() => setForm(emptyForm)}>Cancel edit</button>}
              <button type="submit" className="br-btn-primary br-btn-primary--sm" disabled={saving}>
                <i className="fas fa-save" />{form.id ? 'Update Rule' : 'Save Rule'}
              </button>
              <button type="button" className="br-btn-ghost-sm" disabled={saving || !recon?.id} onClick={openApplyRulesModal}>
                <i className="fas fa-wand-magic-sparkles" />Apply Active Rules Now
              </button>
            </div>
          </form>

          <div className="br-rule-list">
            {(autoRules.data || []).length === 0 && <div className="br-rule-empty">No custom auto-categorisation rules yet.</div>}
            {(autoRules.data || []).map((rule) => (
              <article key={rule.id} className="br-rule-card">
                <div>
                  <strong>{rule.rule_name}</strong>
                  <span>{rule.source} · {rule.match_type} · {rule.direction} · Priority {rule.priority}</span>
                  <p>{rule.keywords}</p>
                  <small>{rule.category_name} → {rule.recon_classification}</small>
                </div>
                <div className="br-rule-card-actions">
                  <button type="button" className="br-btn-ghost-sm" onClick={() => toggleAutoRule(rule.id, Number(rule.is_active) === 1 ? 0 : 1)}>
                    {Number(rule.is_active) === 1 ? 'Disable' : 'Enable'}
                  </button>
                  <button type="button" className="br-btn-ghost-sm" onClick={() => editRule(rule)}>Edit</button>
                  <button type="button" className="br-btn-ghost-sm br-rule-danger" onClick={() => deleteAutoRule(rule.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>

      {applyModalOpen && (
        <BankReconApplyRulesModal
          saving={saving}
          overrideManual={overrideManual}
          result={applyResult}
          onOverrideManualChange={setOverrideManual}
          onClose={closeApplyRulesModal}
          onConfirm={confirmApplyRules}
        />
      )}
    </>
  );
};

export default BankReconAutoRulesPanel;
