import React from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const JOURNAL_TYPE_OPTIONS = [
  { value: "Payment", label: "Payment" },
  { value: "Receipt", label: "Receipt" },
  { value: "Expenses", label: "Expenses" },
  { value: "Sales", label: "Sales" },
  { value: "General", label: "General" },
  { value: "Journal", label: "Journal" },
];

const TRANSACTION_TYPE_OPTIONS = [
  { value: "Cash", label: "Cash" },
  { value: "Bank", label: "Bank" },
  { value: "Not Applicable", label: "Not Applicable" },
];

const SIDE_OPTIONS = [
  { value: "Debit", label: "Debit" },
  { value: "Credit", label: "Credit" },
];

const CURRENCY_OPTIONS = [
  { value: "NGN", label: "NGN" },
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
  { value: "EUR", label: "EUR" },
];

const DATE_PICKER_PORTAL_PROPS = {
  portalId: "smartbooks-datepicker-portal",
  popperClassName: "smartbooks-datepicker-popper",
  calendarClassName: "smartbooks-datepicker-calendar",
  popperPlacement: "bottom-start",
};

function parseDateValue(value, fallback = new Date()) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === "string" && value.trim()) {
    const clean = value.trim().slice(0, 10);
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean);
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return fallback instanceof Date && !Number.isNaN(fallback.getTime()) ? fallback : new Date();
}

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const portalTarget = () => (typeof document !== "undefined" ? document.body : null);

function FieldError({ message }) {
  return message ? <div className="input-error-message journal-form-error">{message}</div> : null;
}

function SectionHeader({ icon, eyebrow, title, description, action }) {
  return (
    <div className="journal-form-section__header">
      <div className="journal-form-section__heading">
        <span className="journal-form-section__icon" aria-hidden="true">
          <i className={`fas ${icon}`} />
        </span>
        <div>
          <span className="journal-form-section__eyebrow">{eyebrow}</span>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export default function JournalFormView({
  mode,
  journalDetails,
  headerErrors,
  handleDetailChange,
  costCenterOptions,
  journalItems,
  itemErrorMap,
  ledgers,
  searchLedgers,
  rates,
  masterRateOptions,
  handleItemChange,
  setOpenMenuId,
  openMenuId,
  setShowCreateClientModal,
  setShowCreateLedgerModal,
  setShowCreateRateModal,
  setActiveRowId,
  setMasterRateId,
  onRemoveItem,
  addItem,
  onDuplicateItem,
  onInsertItem,
  onAddBalancingLine,
  onOpenImport,
  quickLedgers = [],
  favoriteLedgerNames = [],
  onQuickLedgerSelect,
  onToggleFavoriteLedger,
  onLineKeyDown,
  totals,
  isBalanced,
  isLoading,
  onCancel,
}) {
  const isEdit = mode === "edit";

  return (
    <div className="journal-form-layout">
      <header className="journal-form-hero">
        <div className="journal-form-hero__copy">
          <span className="journal-form-hero__badge">
            <i className={`fas ${isEdit ? "fa-pen" : "fa-plus"}`} />
            {isEdit ? "Edit journal" : "New journal"}
          </span>
          <h2>{isEdit ? "Update journal entry" : "Create journal entry"}</h2>
          <p>
            {isEdit
              ? "Review the posting details and journal lines, then save a balanced entry."
              : "Capture the posting details, add debit and credit lines, and confirm the journal balances."}
          </p>
        </div>

        <div className="journal-form-hero__stats" aria-label="Journal status">
          <div className="journal-form-stat">
            <span>Lines</span>
            <strong>{journalItems.length}</strong>
          </div>
          <div className="journal-form-stat">
            <span>Base currency</span>
            <strong>{journalDetails.journal_currency || "NGN"}</strong>
          </div>
          <div className={`journal-form-stat journal-form-stat--status ${isBalanced ? "is-balanced" : "is-unbalanced"}`}>
            <span>Status</span>
            <strong><i className={`fas ${isBalanced ? "fa-check-circle" : "fa-exclamation-circle"}`} /> {isBalanced ? "Balanced" : "Unbalanced"}</strong>
          </div>
        </div>
      </header>

      <section className="journal-form-section journal-form-section--details">
        <SectionHeader
          icon="fa-file-alt"
          eyebrow="Journal information"
          title="Posting details"
          description="Set the date, journal category, currency and transaction method."
        />

        <div className="journal-form-details-grid">
          <div className="journal-form-field">
            <label className={`input-form-label ${headerErrors.journal_date ? "input-label-message" : ""}`} htmlFor="journal_date">Journal Date</label>
            <div className={`input-form-group ${headerErrors.journal_date ? "input-form-error" : ""}`}>
              <div className="form-wrapper">
                <DatePicker
                  selected={journalDetails.journal_date}
                  onChange={(date) => handleDetailChange("journal_date", date)}
                  className={`form-input journal-form-control ${headerErrors.journal_date ? "input-error" : ""}`}
                  dateFormat="yyyy-MM-dd"
                  wrapperClassName="input-date-picker journal-form-datepicker"
                  {...DATE_PICKER_PORTAL_PROPS}
                  id="journal_date"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
                <span className={`chevron-input-icon fas fa-calendar ${headerErrors.journal_date ? "input-icon-error" : ""}`} />
              </div>
            </div>
            <FieldError message={headerErrors.journal_date} />
          </div>

          <div className="journal-form-field">
            <label className={`input-form-label ${headerErrors.journal_type ? "input-label-message" : ""}`} htmlFor="journal_type">Journal Type</label>
            <div className={`input-form-group ${headerErrors.journal_type ? "input-form-error" : ""}`}>
              <div className="form-wrapper">
                <Select
                  options={JOURNAL_TYPE_OPTIONS}
                  onChange={(option) => handleDetailChange("journal_type", option?.value || "")}
                  value={JOURNAL_TYPE_OPTIONS.find((option) => option.value === journalDetails.journal_type) || null}
                  placeholder="Select journal type"
                  className={`form-input-select journal-form-select ${headerErrors.journal_type ? "input-error" : ""}`}
                  classNamePrefix="form-input-select"
                  isClearable
                  inputId="journal_type"
                  onMenuOpen={() => setOpenMenuId("journal_type")}
                  onMenuClose={() => setOpenMenuId(null)}
                />
                <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "journal_type" ? "chevron-rotate" : "", headerErrors.journal_type ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
              </div>
            </div>
            <FieldError message={headerErrors.journal_type} />
          </div>

          <div className="journal-form-field">
            <label className={`input-form-label ${headerErrors.journal_currency ? "input-label-message" : ""}`} htmlFor="journal_currency">Journal Currency</label>
            <div className={`input-form-group ${headerErrors.journal_currency ? "input-form-error" : ""}`}>
              <div className="form-wrapper">
                <Select
                  options={CURRENCY_OPTIONS}
                  onChange={(option) => handleDetailChange("journal_currency", option?.value || "")}
                  value={CURRENCY_OPTIONS.find((option) => option.value === journalDetails.journal_currency) || null}
                  placeholder="Select currency"
                  className={`form-input-select journal-form-select ${headerErrors.journal_currency ? "input-error" : ""}`}
                  classNamePrefix="form-input-select"
                  inputId="journal_currency"
                  onMenuOpen={() => setOpenMenuId("journal_currency")}
                  onMenuClose={() => setOpenMenuId(null)}
                />
                <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "journal_currency" ? "chevron-rotate" : "", headerErrors.journal_currency ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
              </div>
            </div>
            <FieldError message={headerErrors.journal_currency} />
          </div>

          <div className="journal-form-field">
            <label className={`input-form-label ${headerErrors.transaction_type ? "input-label-message" : ""}`} htmlFor="transaction_type">Transaction Type</label>
            <div className={`input-form-group ${headerErrors.transaction_type ? "input-form-error" : ""}`}>
              <div className="form-wrapper">
                <Select
                  options={TRANSACTION_TYPE_OPTIONS}
                  onChange={(option) => handleDetailChange("transaction_type", option?.value || "")}
                  value={TRANSACTION_TYPE_OPTIONS.find((option) => option.value === journalDetails.transaction_type) || null}
                  placeholder="Select transaction type"
                  className={`form-input-select journal-form-select ${headerErrors.transaction_type ? "input-error" : ""}`}
                  classNamePrefix="form-input-select"
                  isClearable
                  inputId="transaction_type"
                  onMenuOpen={() => setOpenMenuId("transaction_type")}
                  onMenuClose={() => setOpenMenuId(null)}
                />
                <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "transaction_type" ? "chevron-rotate" : "", headerErrors.transaction_type ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
              </div>
            </div>
            <FieldError message={headerErrors.transaction_type} />
          </div>
        </div>

        <div className="journal-form-divider" />

        <div className="journal-form-context">
          <div className="journal-form-context__intro">
            <span className="journal-form-context__icon"><i className="fas fa-briefcase" /></span>
            <div>
              <h4>Business context</h4>
              <p>Choose the cost centre first, then add the description that should appear across the journal.</p>
            </div>
          </div>

          <div className="journal-form-context__stack">
            <div className="journal-form-field">
              <label className={`input-form-label ${headerErrors.cost_center ? "input-label-message" : ""}`} htmlFor="cost_center">Cost Center</label>
              <div className="journal-form-control-with-action">
                <div className={`input-form-group ${headerErrors.cost_center ? "input-form-error" : ""}`}>
                  <div className="form-wrapper">
                    <Select
                      options={costCenterOptions}
                      onChange={(option) => handleDetailChange("cost_center", option?.value || "")}
                      value={costCenterOptions.find((option) => option.value === journalDetails.cost_center) || null}
                      placeholder="Select cost center"
                      className={`form-input-select journal-form-select ${headerErrors.cost_center ? "input-error" : ""}`}
                      classNamePrefix="form-input-select"
                      inputId="cost_center"
                      onMenuOpen={() => setOpenMenuId("cost_center")}
                      onMenuClose={() => setOpenMenuId(null)}
                    />
                    <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "cost_center" ? "chevron-rotate" : "", headerErrors.cost_center ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                  </div>
                </div>
                <button type="button" className="journal-form-secondary-action" onClick={() => setShowCreateClientModal(true)}>
                  <i className="fas fa-plus" />
                  Add client
                </button>
              </div>
              <FieldError message={headerErrors.cost_center} />
            </div>

            <div className="journal-form-field">
              <label className={`input-form-label ${headerErrors.main_journal_description ? "input-label-message" : ""}`} htmlFor="main_journal_description">Journal Description</label>
              <div className={`input-form-group ${headerErrors.main_journal_description ? "input-form-error" : ""}`}>
                <div className="form-wrapper">
                  <textarea
                    className={`form-input journal-form-control journal-form-textarea ${headerErrors.main_journal_description ? "input-error" : ""}`}
                    rows="4"
                    placeholder="Describe the purpose of this journal..."
                    value={journalDetails.main_journal_description}
                    onChange={(event) => handleDetailChange("main_journal_description", event.target.value)}
                    id="main_journal_description"
                  />
                </div>
              </div>
              <FieldError message={headerErrors.main_journal_description} />
            </div>
          </div>
        </div>
      </section>

      <section className="journal-form-section journal-form-section--lines">
        <SectionHeader
          icon="fa-list-ul"
          eyebrow="Journal lines"
          title="Debit and credit entries"
          description="Each line has enough room for the ledger, narration, posting date, currency and amount."
          action={(
            <div className="journal-form-section-actions">
              {!isEdit && onOpenImport ? (
                <button type="button" className="journal-form-import-action" onClick={onOpenImport}>
                  <i className="fas fa-file-import" />
                  Import Excel / CSV
                </button>
              ) : null}
              <button type="button" className="journal-form-add-line journal-form-add-line--top" onClick={addItem}>
                <i className="fas fa-plus" />
                Add line
              </button>
            </div>
          )}
        />

        <div className="journal-form-balance-note">
          <span><i className="fas fa-info-circle" /> Debit and credit totals must be equal before submission.</span>
          <div className="journal-form-balance-note__actions">
            {!isBalanced && onAddBalancingLine ? (
              <button type="button" className="journal-form-balance-action" onClick={onAddBalancingLine}>
                <i className="fas fa-balance-scale" />
                Add balancing line
              </button>
            ) : null}
            <strong className={isBalanced ? "is-balanced" : "is-unbalanced"}>
              {isBalanced ? "Currently balanced" : `${formatNumber(totals.grand_total)} difference`}
            </strong>
          </div>
        </div>

        <div className="journal-form-shortcuts">
          <span><i className="fas fa-bolt" /> Faster entry</span>
          <small><kbd>Ctrl</kbd> + <kbd>Enter</kbd> adds a line · <kbd>Alt</kbd> + <kbd>D</kbd> duplicates the current line</small>
        </div>

        <div className="journal-form-lines">
          {journalItems.map((item, index) => {
            const rowErr = itemErrorMap[item.id] || {};
            const ledgerId = `ledger_${item.id}`;
            const sideId = `side_${item.id}`;
            const currencyId = `currency_${item.id}`;
            const rateId = `rate_${item.id}`;

            return (
              <article className="journal-line-card" key={item.id}>
                <header className="journal-line-card__header">
                  <div className="journal-line-card__identity">
                    <span className="journal-line-card__number">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>Journal line {index + 1}</strong>
                      <span>{item.ledger_name || "Select a ledger to begin"}</span>
                    </div>
                  </div>

                  <div className="journal-line-card__meta">
                    {item.sides ? <span className={`journal-line-side is-${item.sides.toLowerCase()}`}>{item.sides}</span> : null}
                    <span className="journal-line-amount">{item.jcurrency || "NGN"} {formatNumber(item.amount)}</span>
                    <div className="journal-line-card__tools">
                      <button type="button" onClick={() => onInsertItem?.(item.id, "above")} title="Insert line above" aria-label={`Insert line above ${index + 1}`}>
                        <i className="fas fa-arrow-up" />
                      </button>
                      <button type="button" onClick={() => onInsertItem?.(item.id, "below")} title="Insert line below" aria-label={`Insert line below ${index + 1}`}>
                        <i className="fas fa-arrow-down" />
                      </button>
                      <button type="button" onClick={() => onDuplicateItem?.(item.id)} title="Duplicate journal line" aria-label={`Duplicate journal line ${index + 1}`}>
                        <i className="fas fa-copy" />
                      </button>
                      <button
                        type="button"
                        className="journal-line-remove"
                        onClick={() => onRemoveItem(item)}
                        disabled={journalItems.length === 1}
                        title="Remove journal line"
                        aria-label={`Remove journal line ${index + 1}`}
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>
                </header>

                <div className="journal-line-card__body" onKeyDown={(event) => onLineKeyDown?.(item.id, event)}>
                  {quickLedgers.length && !item.ledger_name ? (
                    <div className="journal-smart-ledgers">
                      <div className="journal-smart-ledgers__label">
                        <span><i className="fas fa-magic" /> Quick ledgers</span>
                        <small>Recent and favourite accounts</small>
                      </div>
                      <div className="journal-smart-ledgers__chips">
                        {quickLedgers.slice(0, 6).map((ledger) => {
                          const isFavourite = favoriteLedgerNames.includes(ledger.ledger_name);
                          return (
                            <div className={`journal-smart-ledger-chip ${item.ledger_name === ledger.ledger_name ? "is-selected" : ""}`} key={ledger.ledger_name}>
                              <button type="button" className="journal-smart-ledger-chip__select" onClick={() => onQuickLedgerSelect?.(item.id, ledger.ledger_name)}>
                                <strong>{ledger.ledger_name}</strong>
                                <span>{ledger.ledger_number || "Ledger"}</span>
                              </button>
                              <button type="button" className={`journal-smart-ledger-chip__star ${isFavourite ? "is-favourite" : ""}`} onClick={() => onToggleFavoriteLedger?.(ledger.ledger_name)} title={isFavourite ? "Remove from favourites" : "Add to favourites"}>
                                <i className="fas fa-star" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="journal-line-primary-grid">
                    <div className="journal-form-field journal-form-field--ledger">
                      <label className={`input-form-label ${rowErr.ledger_name ? "input-label-message" : ""}`} htmlFor={ledgerId}>Ledger Name</label>
                      <div className="journal-form-control-with-action">
                        <div className={`input-form-group ${rowErr.ledger_name ? "input-form-error" : ""}`}>
                          <div className="form-wrapper">
                            <Select
                              options={ledgers.map((ledger) => ({ value: ledger.ledger_name, label: ledger.ledger_name }))}
                              onInputChange={(value) => { if (value.length > 1) searchLedgers(value); }}
                              onMenuOpen={() => setOpenMenuId(`ledger_${item.id}`)}
                              onMenuClose={() => { setOpenMenuId(null); searchLedgers(""); }}
                              onChange={(option) => handleItemChange(item.id, "ledger_name", option?.value || "")}
                              value={item.ledger_name ? { value: item.ledger_name, label: item.ledger_name } : null}
                              placeholder="Search and select ledger"
                              isClearable
                              inputId={ledgerId}
                              className={`form-input-select journal-form-select ${rowErr.ledger_name ? "input-error" : ""}`}
                              classNamePrefix="form-input-select"
                              menuPortalTarget={portalTarget()}
                              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                            />
                            <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === `ledger_${item.id}` ? "chevron-rotate" : "", rowErr.ledger_name ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                          </div>
                        </div>
                        <button
                          type="button"
                          className="journal-form-secondary-action"
                          onClick={() => {
                            setActiveRowId(item.id);
                            setShowCreateLedgerModal(true);
                          }}
                        >
                          <i className="fas fa-plus" />
                          New ledger
                        </button>
                      </div>
                      <FieldError message={rowErr.ledger_name} />
                      {item.ledger_name ? (
                        <div className="journal-selected-ledger-meta">
                          <span><i className="fas fa-hashtag" /> {item.ledger_number || "No number"}</span>
                          <span>{item.ledger_class || "Unclassified"}{item.ledger_sub_class ? ` · ${item.ledger_sub_class}` : ""}</span>
                          <button type="button" onClick={() => onToggleFavoriteLedger?.(item.ledger_name)} className={favoriteLedgerNames.includes(item.ledger_name) ? "is-favourite" : ""}>
                            <i className="fas fa-star" />
                            {favoriteLedgerNames.includes(item.ledger_name) ? "Favourite" : "Save favourite"}
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div className="journal-form-field journal-form-field--description">
                      <label className={`input-form-label ${rowErr.journal_description ? "input-label-message" : ""}`} htmlFor={`description_${item.id}`}>Line Description</label>
                      <div className={`input-form-group ${rowErr.journal_description ? "input-form-error" : ""}`}>
                        <div className="form-wrapper">
                          <input
                            id={`description_${item.id}`}
                            data-journal-field="description"
                            type="text"
                            className={`form-input journal-form-control ${rowErr.journal_description ? "input-error" : ""}`}
                            value={item.journal_description}
                            onChange={(event) => handleItemChange(item.id, "journal_description", event.target.value)}
                            placeholder="Enter a clear line description"
                          />
                        </div>
                      </div>
                      <FieldError message={rowErr.journal_description} />
                    </div>
                  </div>

                  <div className="journal-line-financial-grid">
                    <div className="journal-form-field">
                      <label className={`input-form-label ${rowErr.journal_date ? "input-label-message" : ""}`} htmlFor={`line_date_${item.id}`}>Journal Date</label>
                      <div className={`input-form-group ${rowErr.journal_date ? "input-form-error" : ""}`}>
                        <div className="form-wrapper">
                          <DatePicker
                            selected={parseDateValue(item.journal_date, journalDetails.journal_date)}
                            onChange={(date) => handleItemChange(item.id, "journal_date", date)}
                            className={`form-input journal-form-control ${rowErr.journal_date ? "input-error" : ""}`}
                            dateFormat="yyyy-MM-dd"
                            wrapperClassName="input-date-picker journal-form-datepicker"
                            {...DATE_PICKER_PORTAL_PROPS}
                            id={`line_date_${item.id}`}
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                          />
                          <span className={`chevron-input-icon fas fa-calendar ${rowErr.journal_date ? "input-icon-error" : ""}`} />
                        </div>
                      </div>
                      <FieldError message={rowErr.journal_date} />
                    </div>

                    <div className="journal-form-field">
                      <label className={`input-form-label ${rowErr.sides ? "input-label-message" : ""}`} htmlFor={sideId}>DR / CR</label>
                      <div className={`input-form-group ${rowErr.sides ? "input-form-error" : ""}`}>
                        <div className="form-wrapper">
                          <Select
                            options={SIDE_OPTIONS}
                            onChange={(option) => handleItemChange(item.id, "sides", option?.value || "")}
                            value={SIDE_OPTIONS.find((option) => option.value === item.sides) || null}
                            placeholder="Select side"
                            className={`form-input-select journal-form-select ${rowErr.sides ? "input-error" : ""}`}
                            classNamePrefix="form-input-select"
                            inputId={sideId}
                            onMenuOpen={() => setOpenMenuId(`sides_${item.id}`)}
                            onMenuClose={() => setOpenMenuId(null)}
                            menuPortalTarget={portalTarget()}
                            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                          />
                          <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === `sides_${item.id}` ? "chevron-rotate" : "", rowErr.sides ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                        </div>
                      </div>
                      <FieldError message={rowErr.sides} />
                    </div>

                    <div className="journal-form-field">
                      <label className={`input-form-label ${rowErr.jcurrency ? "input-label-message" : ""}`} htmlFor={currencyId}>Currency</label>
                      <div className={`input-form-group ${rowErr.jcurrency ? "input-form-error" : ""}`}>
                        <div className="form-wrapper">
                          <Select
                            options={CURRENCY_OPTIONS}
                            onChange={(option) => handleItemChange(item.id, "jcurrency", option?.value || "NGN")}
                            value={CURRENCY_OPTIONS.find((option) => option.value === item.jcurrency) || null}
                            className={`form-input-select journal-form-select ${rowErr.jcurrency ? "input-error" : ""}`}
                            classNamePrefix="form-input-select"
                            inputId={currencyId}
                            onMenuOpen={() => setOpenMenuId(`currency_${item.id}`)}
                            onMenuClose={() => setOpenMenuId(null)}
                            menuPortalTarget={portalTarget()}
                            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                          />
                          <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === `currency_${item.id}` ? "chevron-rotate" : "", rowErr.jcurrency ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                        </div>
                      </div>
                      <FieldError message={rowErr.jcurrency} />
                    </div>

                    <div className="journal-form-field journal-form-field--rate">
                      <label className={`input-form-label ${rowErr.jrate ? "input-label-message" : ""}`} htmlFor={rateId}>Rate Date</label>
                      <div className="journal-form-control-with-action">
                        <div className={`input-form-group ${rowErr.jrate ? "input-form-error" : ""}`}>
                          <div className="form-wrapper">
                            <Select
                              options={masterRateOptions.map((option) => ({
                                ...option,
                                label: option.rate
                                  ? `${option.rate.created_at?.slice(0, 10)} | ${item.jcurrency} @ ${option.rate[`${item.jcurrency.toLowerCase()}_rate`]}`
                                  : option.label,
                              }))}
                              onChange={(option) => setMasterRateId(option?.value || "")}
                              value={item.jrate ? {
                                value: item.jrate,
                                label: item.rate_date
                                  ? `${String(item.rate_date).slice(0, 10)} | ${item.jcurrency} @ ${item.currencyRate}`
                                  : "",
                              } : null}
                              placeholder={rates.length === 0 ? "Loading rates..." : "Select rate date"}
                              className={`form-input-select journal-form-select ${rowErr.jrate ? "input-error" : ""}`}
                              classNamePrefix="form-input-select"
                              isClearable
                              inputId={rateId}
                              onMenuOpen={() => setOpenMenuId(`rate_${item.id}`)}
                              onMenuClose={() => setOpenMenuId(null)}
                              menuPortalTarget={portalTarget()}
                              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                              noOptionsMessage={() => rates.length === 0 ? "Loading rates..." : "No rates found"}
                            />
                            <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === `rate_${item.id}` ? "chevron-rotate" : "", rowErr.jrate ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                          </div>
                        </div>
                        <button type="button" className="journal-form-icon-action" onClick={() => setShowCreateRateModal(true)} title="Create exchange rate" aria-label="Create exchange rate">
                          <i className="fas fa-plus" />
                        </button>
                      </div>
                      <FieldError message={rowErr.jrate} />
                    </div>

                    <div className="journal-form-field journal-form-field--amount">
                      <label className={`input-form-label ${rowErr.amount ? "input-label-message" : ""}`} htmlFor={`amount_${item.id}`}>Amount</label>
                      <div className={`input-form-group ${rowErr.amount ? "input-form-error" : ""}`}>
                        <div className="form-wrapper journal-form-amount-wrapper">
                          <span className="journal-form-amount-prefix">{item.jcurrency || "NGN"}</span>
                          <input
                            id={`amount_${item.id}`}
                            data-journal-field="amount"
                            type="number"
                            className={`form-input form-input-number journal-form-control journal-form-amount-input ${rowErr.amount ? "input-error" : ""}`}
                            value={item.amount}
                            onChange={(event) => handleItemChange(item.id, "amount", event.target.value)}
                            onWheel={(event) => event.currentTarget.blur()}
                            step="any"
                            min="0"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <FieldError message={rowErr.amount} />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <button type="button" className="journal-form-add-line journal-form-add-line--wide" onClick={addItem}>
          <span><i className="fas fa-plus" /></span>
          <div>
            <strong>Add another journal line</strong>
            <small>Create the next debit or credit entry.</small>
          </div>
        </button>
      </section>

      <section className="journal-form-summary-section">
        <div className="journal-form-summary-copy">
          <span className="journal-form-section__eyebrow">Balance review</span>
          <h3>Confirm the journal totals</h3>
          <p>The final difference must be 0.00 before the journal can be submitted.</p>
        </div>

        <div className="journal-form-summary-grid">
          <div className="journal-summary-card">
            <div className="journal-summary-card__header">
              <span>NGN totals</span>
              <i className="fas fa-coins" />
            </div>
            <div className="journal-summary-card__row"><span>Debit</span><strong>{formatNumber(totals.total_debit_ngn)}</strong></div>
            <div className="journal-summary-card__row"><span>Credit</span><strong>{formatNumber(totals.total_credit_ngn)}</strong></div>
            <div className="journal-summary-card__row journal-summary-card__row--balance"><span>Balance</span><strong>{formatNumber(totals.grand_total_ngn)}</strong></div>
          </div>

          <div className="journal-summary-card">
            <div className="journal-summary-card__header">
              <span>FCY totals</span>
              <i className="fas fa-globe" />
            </div>
            <div className="journal-summary-card__row"><span>Debit</span><strong>{formatNumber(totals.total_debit_usd)}</strong></div>
            <div className="journal-summary-card__row"><span>Credit</span><strong>{formatNumber(totals.total_credit_usd)}</strong></div>
            <div className="journal-summary-card__row journal-summary-card__row--balance"><span>Balance</span><strong>{formatNumber(totals.grand_total_usd)}</strong></div>
          </div>

          <div className={`journal-difference-card ${isBalanced ? "is-balanced" : "is-unbalanced"}`}>
            <span className="journal-difference-card__icon"><i className={`fas ${isBalanced ? "fa-check" : "fa-exclamation"}`} /></span>
            <div>
              <span>Difference</span>
              <strong>{formatNumber(totals.grand_total)}</strong>
              <small>{isBalanced ? "Ready to submit" : "Debit and credit must match"}</small>
            </div>
          </div>
        </div>
      </section>

      <footer className="journal-form-footer">
        <div className={`journal-form-footer__status ${isBalanced ? "is-balanced" : "is-unbalanced"}`}>
          <span className="journal-form-footer__status-icon">
            <i className={`fas ${isBalanced ? "fa-check" : "fa-exclamation"}`} />
          </span>
          <div>
            <strong>{isBalanced ? "Journal is balanced" : "Journal still needs attention"}</strong>
            <span>{isBalanced ? "The debit and credit entries are ready." : "Adjust the journal lines until the difference is 0.00."}</span>
          </div>
        </div>

        <div className="journal-form-footer__actions">
          <button type="button" className="journal-form-cancel" onClick={onCancel} disabled={isLoading}>Cancel</button>
          <button type="submit" className="journal-form-submit" disabled={isLoading}>
            {isLoading ? <span className="invoice-loader" /> : <><i className={`fas ${isEdit ? "fa-save" : "fa-paper-plane"}`} /> {isEdit ? "Update Journal" : "Submit Journal"}</>}
          </button>
        </div>
      </footer>
    </div>
  );
}
