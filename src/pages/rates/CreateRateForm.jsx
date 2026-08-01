import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useThemeStore from "../../stores/useThemeStore";
import useToastStore from "../../stores/useToastStore";
import useRateStore from "../../stores/useRateStore";
import { fadeInUp } from "../../utils/animation";
import "../inputs-styles/Inputs.css";

const toISODate = (value) => {
  if (!value) return "";
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
};

const CreateRateForm = () => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { createRate } = useRateStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rateDetails, setRateDetails] = useState({
    effective_date: new Date(),
    rate_source: "Manual entry",
    source_reference: "",
    ngn_rate: "1",
    usd_rate: "",
    gbp_rate: "",
    eur_rate: "",
  });

  const validateForm = useCallback(() => {
    const next = {};
    if (!rateDetails.effective_date) next.effective_date = "Effective date is required";
    if (!rateDetails.rate_source.trim()) next.rate_source = "Rate source is required";
    ["ngn_rate", "usd_rate", "gbp_rate", "eur_rate"].forEach((field) => {
      const amount = Number(rateDetails[field]);
      if (!Number.isFinite(amount) || amount <= 0) next[field] = `Valid ${field.slice(0, 3).toUpperCase()} rate is required`;
    });
    return next;
  }, [rateDetails]);

  const errors = useMemo(() => (submitted ? validateForm() : {}), [submitted, validateForm]);
  const update = (field, value) => setRateDetails((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length) {
      showToast("Please fill in all required fields correctly", "error");
      return;
    }

    setIsLoading(true);
    const success = await createRate({
      ngn_cur: "NGN",
      ngn_rate: rateDetails.ngn_rate,
      usd_cur: "USD",
      usd_rate: rateDetails.usd_rate,
      gbp_cur: "GBP",
      gbp_rate: rateDetails.gbp_rate,
      eur_cur: "EUR",
      eur_rate: rateDetails.eur_rate,
      effective_date: toISODate(rateDetails.effective_date),
      rate_source: rateDetails.rate_source.trim(),
      source_reference: rateDetails.source_reference.trim(),
    });
    setIsLoading(false);

    if (success) {
      setSubmitted(false);
      navigate("/rate/home");
    }
  };

  const rateField = (currency) => {
    const key = `${currency.toLowerCase()}_rate`;
    return (
      <div className="invoice-form invoice-form-three" key={currency}>
        <div className="input-form-wrapper">
          <div className={`input-form-group ${errors[key] ? "input-form-error" : ""}`}>
            <label className={`input-form-label ${errors[key] ? "input-label-message" : ""}`} htmlFor={key}>{currency} Rate</label>
            <div className="form-wrapper">
              <input
                type="number"
                id={key}
                className={`form-input form-input-no-padding ${errors[key] ? "input-error" : ""}`}
                value={rateDetails[key]}
                onChange={(event) => update(key, event.target.value)}
                onWheel={(event) => event.currentTarget.blur()}
                step="0.00000001"
                min="0.00000001"
                placeholder="0.00"
              />
            </div>
          </div>
          {errors[key] && <div className="input-error-message">{errors[key]}</div>}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.01, delay: 0.02, ease: "easeInOut" }}
      className={`invoice-form-box theme-${theme}`}
    >
      <form className="invoice-form-f-container" onSubmit={handleSubmit} noValidate>
        <div className="invoice-form-header">
          <div className="invoice-form-htxt">Create New Rate</div>
          <div className="invoice-form-sub-htxt">
            The effective date controls which accounting date can use the rate. The system records today&apos;s entry timestamp separately for audit.
          </div>
        </div>

        <div className="invoice-form-flex-box">
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.effective_date ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.effective_date ? "input-label-message" : ""}`} htmlFor="effective_date">Rate Effective Date</label>
                <div className="form-wrapper">
                  <DatePicker
                    selected={rateDetails.effective_date}
                    onChange={(date) => update("effective_date", date)}
                    className={`form-input ${errors.effective_date ? "input-error" : ""}`}
                    dateFormat="yyyy-MM-dd"
                    wrapperClassName="input-date-picker"
                    id="effective_date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                  <span className={`chevron-input-icon fas fa-calendar ${errors.effective_date ? "input-icon-error" : ""}`} />
                </div>
              </div>
              {errors.effective_date && <div className="input-error-message">{errors.effective_date}</div>}
            </div>
          </div>

          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.rate_source ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.rate_source ? "input-label-message" : ""}`} htmlFor="rate_source">Rate Source</label>
                <div className="form-wrapper">
                  <input
                    id="rate_source"
                    className={`form-input form-input-no-padding ${errors.rate_source ? "input-error" : ""}`}
                    value={rateDetails.rate_source}
                    onChange={(event) => update("rate_source", event.target.value)}
                    maxLength={255}
                    placeholder="e.g. CBN closing rate"
                  />
                </div>
              </div>
              {errors.rate_source && <div className="input-error-message">{errors.rate_source}</div>}
            </div>
          </div>

          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className="input-form-group">
                <label className="input-form-label" htmlFor="source_reference">Source Reference <span> (Optional)</span></label>
                <div className="form-wrapper">
                  <input
                    id="source_reference"
                    className="form-input form-input-no-padding"
                    value={rateDetails.source_reference}
                    onChange={(event) => update("source_reference", event.target.value)}
                    maxLength={500}
                    placeholder="Bulletin, URL, quote or reference"
                  />
                </div>
              </div>
            </div>
          </div>

          {["NGN", "USD", "GBP", "EUR"].map(rateField)}
        </div>

        <div className="invoice-action-btn">
          <div className="invoice-action-btn-wrapper">
            <button type="submit" disabled={isLoading} className="invoice-submit-btn">
              {isLoading ? <div className="invoice-loader" /> : <span className="invoice-submit-btn-text">Create Rate</span>}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateRateForm;
