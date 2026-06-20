import React, { useLayoutEffect, useMemo, useRef } from "react";
import Select from "react-select";

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const rowSubtotal = (item) => {
  const amount = Number.parseFloat(item.amount) || 0;
  const discount = Number.parseFloat(item.discount) || 0;
  const vat = Number.parseFloat(item.vat) || 0;
  const discountAmount = amount * (discount / 100);
  const taxableAmount = amount - discountAmount;
  return taxableAmount + taxableAmount * (vat / 100);
};

const AutoResizeTextarea = ({ value, onChange, className, placeholder }) => {
  const textareaRef = useRef(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 132)}px`;
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      rows={5}
      className={className}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
};

const NumberField = ({ label, value, error, onChange, max, placeholder = "0.00" }) => (
  <div className="invoice-line-card__field">
    <label>{label}</label>
    <div className={`input-form-group ${error ? "input-form-error" : ""}`}>
      <div className="form-wrapper">
        <input
          type="number"
          className={`form-input form-input-number ${error ? "input-error" : ""}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onWheel={(event) => event.currentTarget.blur()}
          step="0.01"
          min="0"
          max={max}
          placeholder={placeholder}
        />
      </div>
    </div>
    {error ? <div className="input-error-message">{error}</div> : null}
  </div>
);

const InvoiceLineEditor = ({
  items = [],
  currency = "—",
  errorsById = {},
  services = [],
  servicesLoading = false,
  onSearchServices,
  onApplyService,
  onSaveAsService,
  onChange,
  onRemove,
}) => {
  const serviceOptions = useMemo(
    () => services.map((service) => ({
      value: service.id,
      label: `${service.service_name} · ${service.currency} ${formatNumber(service.default_amount)}`,
      service,
    })),
    [services]
  );

  return (
    <div className="invoice-line-list">
      {items.map((item, index) => {
        const errors = errorsById[item.id] || {};
        const subtotal = rowSubtotal(item);
        const selectedService = serviceOptions.find((option) => Number(option.value) === Number(item.service_catalogue_id)) || null;

        return (
          <article className="invoice-line-card" key={item.id}>
            <header className="invoice-line-card__header">
              <div className="invoice-line-card__identity">
                <span className="invoice-line-card__number">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <span className="invoice-line-card__eyebrow">Service line</span>
                  <strong>{item.description?.trim() || `Invoice service ${index + 1}`}</strong>
                </div>
              </div>

              <div className="invoice-line-card__header-actions">
                <div className="invoice-line-card__subtotal" aria-label={`Line ${index + 1} subtotal`}>
                  <span>Line total</span>
                  <strong>
                    <small>{currency || "—"}</small>
                    {formatNumber(subtotal)}
                  </strong>
                </div>
                <button
                  type="button"
                  className="invoice-line-card__remove"
                  onClick={() => onRemove(item)}
                  disabled={items.length === 1}
                  title={items.length === 1 ? "At least one service line is required" : "Remove service line"}
                  aria-label={`Remove service line ${index + 1}`}
                >
                  <span className="fas fa-trash" aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className="invoice-line-card__body">
              <div className="invoice-line-card__catalogue-row">
                <div className="invoice-line-card__catalogue-field">
                  <label htmlFor={`invoice-service-${item.id}`}>Use a saved service</label>
                  <div className="form-wrapper">
                    <Select
                      inputId={`invoice-service-${item.id}`}
                      options={serviceOptions}
                      value={selectedService}
                      onChange={(option) => onApplyService?.(item.id, option?.service || null)}
                      onInputChange={(value, action) => {
                        if (action.action === "input-change") onSearchServices?.(value);
                        return value;
                      }}
                      isLoading={servicesLoading}
                      isClearable
                      className="form-input-select invoice-line-card__catalogue-select"
                      classNamePrefix="form-input-select"
                      placeholder="Search the service catalogue..."
                      noOptionsMessage={() => servicesLoading ? "Loading services..." : `No saved ${currency} services found`}
                    />
                    <span className="chevron-input-icon fas fa-chevron-down" aria-hidden="true" />
                  </div>
                </div>

                <div className="invoice-line-card__catalogue-footer">
                  <small>Selecting a service fills the description, amount and tax rates.</small>
                  <button
                    type="button"
                    className="invoice-line-card__save-service"
                    onClick={() => onSaveAsService?.(item)}
                    title="Save this line for future invoices"
                  >
                    <span className="fas fa-bookmark" aria-hidden="true" />
                    <span>Save as service</span>
                  </button>
                </div>
              </div>

              <div className="invoice-line-card__description">
                <label>Service description</label>
                <div className={`input-form-group ${errors.description ? "input-form-error" : ""}`}>
                  <div className="form-wrapper">
                    <AutoResizeTextarea
                      className={`form-input form-input-textarea ${errors.description ? "input-error" : ""}`}
                      value={item.description}
                      onChange={(event) => onChange(item.id, "description", event.target.value)}
                      placeholder="Describe the service delivered, period covered, or agreed scope"
                    />
                  </div>
                </div>
                {errors.description ? <div className="input-error-message">{errors.description}</div> : null}
              </div>

              <div className="invoice-line-card__financials">
                <NumberField
                  label={`Amount (${currency || "—"})`}
                  value={item.amount}
                  error={errors.amount}
                  onChange={(value) => onChange(item.id, "amount", value)}
                />
                <NumberField
                  label="Discount (%)"
                  value={item.discount}
                  error={errors.discount}
                  max="100"
                  onChange={(value) => onChange(item.id, "discount", value)}
                />
                <NumberField
                  label="VAT (%)"
                  value={item.vat}
                  error={errors.vat}
                  max="100"
                  onChange={(value) => onChange(item.id, "vat", value)}
                />
                <NumberField
                  label="WHT (%)"
                  value={item.wht}
                  error={errors.wht}
                  max="100"
                  onChange={(value) => onChange(item.id, "wht", value)}
                />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default InvoiceLineEditor;
