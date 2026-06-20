import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Select from "react-select";
import useThemeStore from "../../stores/useThemeStore";
import useToastStore from "../../stores/useToastStore";
import useInvoiceServiceStore from "../../stores/useInvoiceServiceStore";
import "../../pages/invoice/InvoiceForm.css";

const CURRENCY_OPTIONS = ["NGN", "USD", "GBP", "EUR"].map((value) => ({ value, label: value }));

const emptyForm = (currency) => ({
  service_name: "",
  description: "",
  currency: currency || "NGN",
  default_amount: "",
  discount_percent: "0",
  vat_percent: "0",
  wht_percent: "0",
});

const CreateInvoiceServiceModal = ({ isOpen, currency, initialLine, onClose, onCreated }) => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const createService = useInvoiceServiceStore((state) => state.createService);
  const [form, setForm] = useState(() => emptyForm(currency));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      service_name: initialLine?.description?.trim()?.slice(0, 180) || "",
      description: initialLine?.description || "",
      currency: currency || "NGN",
      default_amount: initialLine?.amount ?? "",
      discount_percent: initialLine?.discount ?? "0",
      vat_percent: initialLine?.vat ?? "0",
      wht_percent: initialLine?.wht ?? "0",
    });
    setErrors({});
  }, [isOpen, currency, initialLine]);

  const currencyLocked = Boolean(currency);
  const title = initialLine?.description?.trim() ? "Save line as reusable service" : "Create reusable service";

  const validate = () => {
    const next = {};
    if (!form.service_name.trim()) next.service_name = "Service name is required.";
    if (!form.description.trim()) next.description = "Invoice description is required.";
    if (!form.currency) next.currency = "Currency is required.";
    const amount = Number(form.default_amount || 0);
    if (Number.isNaN(amount) || amount < 0) next.default_amount = "Enter a valid amount.";
    ["discount_percent", "vat_percent", "wht_percent"].forEach((field) => {
      const value = Number(form[field] || 0);
      if (Number.isNaN(value) || value < 0 || value > 100) next[field] = "Use a value from 0 to 100.";
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const created = await createService({
        ...form,
        service_name: form.service_name.trim(),
        description: form.description.trim(),
        default_amount: Number(form.default_amount || 0),
        discount_percent: Number(form.discount_percent || 0),
        vat_percent: Number(form.vat_percent || 0),
        wht_percent: Number(form.wht_percent || 0),
      });
      showToast("Reusable invoice service created", "success");
      onCreated?.(created);
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || "The reusable service could not be created.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`invoice-service-modal theme-${theme}`} role="dialog" aria-modal="true" aria-labelledby="invoice-service-modal-title">
      <button type="button" className="invoice-service-modal__backdrop" onClick={isSubmitting ? undefined : onClose} aria-label="Close service modal" />
      <motion.form
        className="invoice-service-modal__panel"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.985 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        noValidate
      >
        <header className="invoice-service-modal__header">
          <div className="invoice-service-modal__icon"><span className="fas fa-layer-group" aria-hidden="true" /></div>
          <div>
            <span className="invoice-service-modal__eyebrow">Service catalogue</span>
            <h3 id="invoice-service-modal-title">{title}</h3>
            <p>Reuse this description, amount and tax setup on future invoices.</p>
          </div>
          <button type="button" className="invoice-service-modal__close" onClick={onClose} disabled={isSubmitting} aria-label="Close">
            <span className="fas fa-times" aria-hidden="true" />
          </button>
        </header>

        <div className="invoice-service-modal__body">
          <div className="invoice-service-modal__field">
            <label htmlFor="catalogue-service-name">Service name</label>
            <input
              id="catalogue-service-name"
              className={`form-input ${errors.service_name ? "input-error" : ""}`}
              value={form.service_name}
              onChange={(event) => setForm((current) => ({ ...current, service_name: event.target.value }))}
              placeholder="e.g. Monthly retainership"
              autoComplete="off"
            />
            {errors.service_name ? <span className="input-error-message">{errors.service_name}</span> : null}
          </div>

          <div className="invoice-service-modal__field">
            <label htmlFor="catalogue-service-description">Invoice description</label>
            <textarea
              id="catalogue-service-description"
              className={`form-input form-input-textarea ${errors.description ? "input-error" : ""}`}
              rows="4"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Description that should appear on the invoice"
            />
            {errors.description ? <span className="input-error-message">{errors.description}</span> : null}
          </div>

          <div className="invoice-service-modal__grid">
            <div className="invoice-service-modal__field">
              <label>Currency</label>
              <Select
                options={CURRENCY_OPTIONS}
                value={CURRENCY_OPTIONS.find((option) => option.value === form.currency) || null}
                onChange={(option) => setForm((current) => ({ ...current, currency: option?.value || "" }))}
                className={`form-input-select ${errors.currency ? "input-error" : ""}`}
                classNamePrefix="form-input-select"
                isDisabled={currencyLocked}
              />
              {errors.currency ? <span className="input-error-message">{errors.currency}</span> : null}
            </div>
            <div className="invoice-service-modal__field">
              <label htmlFor="catalogue-service-amount">Default amount</label>
              <input
                id="catalogue-service-amount"
                type="number"
                min="0"
                step="0.01"
                className={`form-input ${errors.default_amount ? "input-error" : ""}`}
                value={form.default_amount}
                onChange={(event) => setForm((current) => ({ ...current, default_amount: event.target.value }))}
                placeholder="0.00"
              />
              {errors.default_amount ? <span className="input-error-message">{errors.default_amount}</span> : null}
            </div>
          </div>

          <div className="invoice-service-modal__tax-grid">
            {[
              ["discount_percent", "Discount (%)"],
              ["vat_percent", "VAT (%)"],
              ["wht_percent", "WHT (%)"],
            ].map(([field, label]) => (
              <div className="invoice-service-modal__field" key={field}>
                <label htmlFor={`catalogue-${field}`}>{label}</label>
                <input
                  id={`catalogue-${field}`}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className={`form-input ${errors[field] ? "input-error" : ""}`}
                  value={form[field]}
                  onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                />
                {errors[field] ? <span className="input-error-message">{errors[field]}</span> : null}
              </div>
            ))}
          </div>
        </div>

        <footer className="invoice-service-modal__footer">
          <button type="button" className="invoice-service-modal__cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="invoice-service-modal__submit" disabled={isSubmitting}>
            {isSubmitting ? <span className="invoice-loader" /> : <><span className="fas fa-save" aria-hidden="true" /> Save reusable service</>}
          </button>
        </footer>
      </motion.form>
    </div>
  );
};

export default CreateInvoiceServiceModal;
