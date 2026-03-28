import React, { useEffect, useState, useMemo, useCallback } from "react";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useToastStore from "../../stores/useToastStore";
import useRateStore from "../../stores/useRateStore";
import "../inputs-styles/Inputs.css";

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const EditRateForm = ({ rateId, rate, onSaveSuccess }) => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { editRate } = useRateStore();

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* ── Form State ── */
  const [rateDetails, setRateDetails] = useState({
    created_at: new Date(),
    ngn_rate: "1",
    usd_rate: "",
    gbp_rate: "",
    eur_rate: "",
  });

  /* ── Populate form when rate prop arrives ── */
  useEffect(() => {
    if (!rate) return;

    setRateDetails({
      created_at: rate.created_at ? new Date(rate.created_at) : new Date(),
      ngn_rate: rate.ngn_rate || "1",
      usd_rate: rate.usd_rate || "",
      gbp_rate: rate.gbp_rate || "",
      eur_rate: rate.eur_rate || "",
    });
  }, [rate]);

  /* ─────────────────────────────────────────────
     Validation
  ───────────────────────────────────────────── */
  const validateForm = useCallback(() => {
    const e = {};
    if (!rateDetails.created_at) e.created_at = "Date is required";
    if (!rateDetails.ngn_rate || isNaN(parseFloat(rateDetails.ngn_rate)) || parseFloat(rateDetails.ngn_rate) < 0) 
      e.ngn_rate = "Valid NGN rate is required";
    if (!rateDetails.usd_rate || isNaN(parseFloat(rateDetails.usd_rate)) || parseFloat(rateDetails.usd_rate) < 0) 
      e.usd_rate = "Valid USD rate is required";
    if (!rateDetails.gbp_rate || isNaN(parseFloat(rateDetails.gbp_rate)) || parseFloat(rateDetails.gbp_rate) < 0) 
      e.gbp_rate = "Valid GBP rate is required";
    if (!rateDetails.eur_rate || isNaN(parseFloat(rateDetails.eur_rate)) || parseFloat(rateDetails.eur_rate) < 0) 
      e.eur_rate = "Valid EUR rate is required";
    return e;
  }, [rateDetails]);

  const errors = useMemo(() => (submitted ? validateForm() : {}), [submitted, validateForm]);

  /* ─────────────────────────────────────────────
     Handlers
  ───────────────────────────────────────────── */
  const handleDetailChange = (field, value) => {
    setRateDetails((prev) => ({ ...prev, [field]: value }));
  };

  /* ─────────────────────────────────────────────
     Submit
  ───────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      showToast("Please fill in all required fields correctly", "error");
      return;
    }

    setIsLoading(true);

    const formattedDate = rateDetails.created_at instanceof Date
      ? rateDetails.created_at.toISOString().split("T")[0]
      : rateDetails.created_at;

    const payload = {
      id: rateId,
      ngn_cur: "NGN",
      ngn_rate: rateDetails.ngn_rate,
      usd_cur: "USD",
      usd_rate: rateDetails.usd_rate,
      gbp_cur: "GBP",
      gbp_rate: rateDetails.gbp_rate,
      eur_cur: "EUR",
      eur_rate: rateDetails.eur_rate,
      created_at: formattedDate,
    };

    const success = await editRate(payload);

    setIsLoading(false);

    if (success) {
      setSubmitted(false);
      if (onSaveSuccess) onSaveSuccess();
    }
  };

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.01, delay: 0.02, ease: "easeInOut" }}
      className={`invoice-form-box theme-${theme}`}
    >
      <form
        className="invoice-form-f-container"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* ── HEADER DETAILS ── */}
        <div className="invoice-form-header">
          <div className="invoice-form-htxt">Edit Rate</div>
          <div className="invoice-form-sub-htxt">
            Update the details below to edit Rate ID #{rateId}
          </div>
        </div>

        <div className="invoice-form-flex-box">
          
          {/* Date Picker */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.created_at ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.created_at ? "input-label-message" : ""}`} htmlFor="created_at">
                  Effective Date
                </label>
                <div className="form-wrapper">
                  <DatePicker
                    selected={rateDetails.created_at}
                    onChange={(date) => handleDetailChange("created_at", date)}
                    className={`form-input ${errors.created_at ? "input-error" : ""}`}
                    dateFormat="yyyy-MM-dd"
                    wrapperClassName="input-date-picker"
                    id="created_at"
                  />
                  <span className={`chevron-input-icon fas fa-calendar ${errors.created_at ? "input-icon-error" : ""}`} />
                </div>
              </div>
              {errors.created_at && (
                <div className="input-error-message">{errors.created_at}</div>
              )}
            </div>
          </div>

          {/* NGN Rate */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.ngn_rate ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.ngn_rate ? "input-label-message" : ""}`} htmlFor="ngn_rate">
                  NGN Rate
                </label>
                <div className="form-wrapper">
                  <input
                    type="number"
                    id="ngn_rate"
                    className={`form-input form-input-no-padding ${errors.ngn_rate ? "input-error" : ""}`}
                    value={rateDetails.ngn_rate}
                    onChange={(e) => handleDetailChange("ngn_rate", e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
              </div>
              {errors.ngn_rate && (
                <div className="input-error-message">{errors.ngn_rate}</div>
              )}
            </div>
          </div>

          {/* USD Rate */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.usd_rate ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.usd_rate ? "input-label-message" : ""}`} htmlFor="usd_rate">
                  USD Rate
                </label>
                <div className="form-wrapper">
                  <input
                    type="number"
                    id="usd_rate"
                    className={`form-input form-input-no-padding ${errors.usd_rate ? "input-error" : ""}`}
                    value={rateDetails.usd_rate}
                    onChange={(e) => handleDetailChange("usd_rate", e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
              </div>
              {errors.usd_rate && (
                <div className="input-error-message">{errors.usd_rate}</div>
              )}
            </div>
          </div>

          {/* GBP Rate */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.gbp_rate ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.gbp_rate ? "input-label-message" : ""}`} htmlFor="gbp_rate">
                  GBP Rate
                </label>
                <div className="form-wrapper">
                  <input
                    type="number"
                    id="gbp_rate"
                    className={`form-input form-input-no-padding ${errors.gbp_rate ? "input-error" : ""}`}
                    value={rateDetails.gbp_rate}
                    onChange={(e) => handleDetailChange("gbp_rate", e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
              </div>
              {errors.gbp_rate && (
                <div className="input-error-message">{errors.gbp_rate}</div>
              )}
            </div>
          </div>

          {/* EUR Rate */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.eur_rate ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.eur_rate ? "input-label-message" : ""}`} htmlFor="eur_rate">
                  EUR Rate
                </label>
                <div className="form-wrapper">
                  <input
                    type="number"
                    id="eur_rate"
                    className={`form-input form-input-no-padding ${errors.eur_rate ? "input-error" : ""}`}
                    value={rateDetails.eur_rate}
                    onChange={(e) => handleDetailChange("eur_rate", e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
              </div>
              {errors.eur_rate && (
                <div className="input-error-message">{errors.eur_rate}</div>
              )}
            </div>
          </div>

        </div>

        {/* ── SUBMIT ── */}
        <div className="invoice-action-btn">
          <div className="invoice-action-btn-wrapper">
            <button
              type="submit"
              disabled={isLoading}
              className="invoice-submit-btn"
            >
              {isLoading ? (
                <div className="invoice-loader" />
              ) : (
                <span className="invoice-submit-btn-text">Update Rate</span>
              )}
            </button>
          </div>
        </div>

      </form>
    </motion.div>
  );
};

export default EditRateForm;