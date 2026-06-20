import React, { useMemo, useState } from 'react';
import useBankReconStore from '../../../stores/useBankReconStore';
import { fmtAmt, safe } from './BankReconUtils';

const fieldLabel = (key) => String(key || '')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (m) => m.toUpperCase());

const SmartMetric = ({ label, value, tone = '' }) => (
  <div className={`br-smart-metric ${tone ? `br-smart-metric--${tone}` : ''}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const BankReconSmartInsightsPanel = () => {
  const { current } = useBankReconStore();
  const [open, setOpen] = useState(true);
  const explanation = current.difference_explanation;
  const profiles = current.upload_profiles || [];
  const learned = current.learned_patterns || [];

  const topProfiles = useMemo(() => profiles.slice(0, 2), [profiles]);
  const topLearned = useMemo(() => learned.slice(0, 6), [learned]);

  const diff = Number(explanation?.absolute_difference || 0);
  const balanced = explanation?.status === 'Balanced' || diff <= 0.01;

  return (
    <section className="br-smart-panel">
      <button type="button" className="br-smart-toggle" onClick={() => setOpen((v) => !v)}>
        <span>
          <i className="fas fa-wand-magic-sparkles" />
          Smart reconciliation intelligence
          <small>Difference explanation, upload memory and learned monthly patterns</small>
        </span>
        <i className={`fas fa-chevron-${open ? 'up' : 'down'}`} />
      </button>

      {open && (
        <div className="br-smart-body">
          <div className="br-smart-summary">
            <SmartMetric label="Status" value={explanation?.status || 'Review'} tone={balanced ? 'ok' : 'warn'} />
            <SmartMetric label="Difference" value={`${explanation?.currency || 'NGN'} ${fmtAmt(diff)}`} tone={balanced ? 'ok' : 'warn'} />
            <SmartMetric label="Upload profiles" value={profiles.length} />
            <SmartMetric label="Learned patterns" value={learned.length} />
          </div>

          {explanation?.headline && (
            <div className={`br-smart-callout ${balanced ? 'br-smart-callout--ok' : 'br-smart-callout--warn'}`}>
              <i className={`fas ${balanced ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} />
              <p>{explanation.headline}</p>
            </div>
          )}

          {!!explanation?.causes?.length && (
            <div className="br-smart-section">
              <h4><i className="fas fa-magnifying-glass-chart" />Likely difference drivers</h4>
              <div className="br-smart-cause-list">
                {explanation.causes.slice(0, 6).map((cause, idx) => (
                  <div className="br-smart-cause" key={`${cause.type || 'cause'}-${idx}`}>
                    <span>
                      <strong>{cause.label}</strong>
                      <small>{cause.description}</small>
                    </span>
                    <b>{explanation.currency || 'NGN'} {fmtAmt(cause.amount)}</b>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!!explanation?.actions?.length && (
            <div className="br-smart-section">
              <h4><i className="fas fa-list-check" />Recommended next actions</h4>
              <ul className="br-smart-action-list">
                {explanation.actions.slice(0, 5).map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>)}
              </ul>
            </div>
          )}

          <div className="br-smart-grid">
            <div className="br-smart-section">
              <h4><i className="fas fa-file-import" />Upload profile memory</h4>
              {topProfiles.length ? (
                <div className="br-smart-profile-list">
                  {topProfiles.map((profile) => (
                    <article className="br-smart-profile" key={`${profile.source}-${profile.id}`}>
                      <strong>{String(profile.source || '').toUpperCase()} · {safe(profile.last_file_name)}</strong>
                      <span>{safe(profile.bank_name)} · {safe(profile.account_number)} · used {Number(profile.use_count || 1)} time(s)</span>
                      <div className="br-smart-map">
                        {Object.entries(profile.mapping || {}).filter(([, value]) => value).slice(0, 6).map(([key, value]) => (
                          <small key={key}>{fieldLabel(key)} → {value}</small>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="br-smart-empty">Upload profiles will appear here after a bank or ledger file is uploaded with this patch.</p>
              )}
            </div>

            <div className="br-smart-section">
              <h4><i className="fas fa-brain" />Learned monthly patterns</h4>
              {topLearned.length ? (
                <div className="br-smart-pattern-list">
                  {topLearned.map((pattern) => (
                    <article className="br-smart-pattern" key={pattern.id}>
                      <strong>{pattern.pattern_text}</strong>
                      <span>{pattern.category_name} · {pattern.recon_classification}</span>
                      <small>{Number(pattern.confidence || 0).toFixed(0)}% confidence · used {Number(pattern.use_count || 1)} time(s)</small>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="br-smart-empty">Classify recurring items once; Smartbooks will learn and suggest the same treatment on future uploads.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default BankReconSmartInsightsPanel;
