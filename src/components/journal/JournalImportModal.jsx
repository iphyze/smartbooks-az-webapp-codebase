import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api from "../../services/api";
import useAuthStore from "../../stores/useAuthStore";
import { downloadJournalImportTemplate, formatImportNumber, parseJournalImportFile } from "../../utils/journalImport";
import "./JournalImportModal.css";

const ACCEPTED_TYPES = ".xlsx,.xls,.csv";

function ErrorList({ title, entries }) {
  if (!entries?.length) return null;
  return (
    <div className="journal-import-errors">
      <strong>{title}</strong>
      <ul>
        {entries.map((entry, index) => (
          <li key={`${entry}-${index}`}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}

export default function JournalImportModal({ isOpen, onClose, onApply }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const reset = () => {
    setFile(null);
    setError("");
    setResult(null);
    setIsValidating(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeModal = () => {
    if (isValidating) return;
    reset();
    onClose();
  };

  const validateFile = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setError("");
    setResult(null);
    setIsValidating(true);

    try {
      const parsed = await parseJournalImportFile(selectedFile);
      const token = useAuthStore.getState().token;
      const response = await api.post("/journal/validate-import", parsed, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(response.data?.data || null);
    } catch (requestError) {
      const responseData = requestError.response?.data;
      if (responseData?.data) setResult(responseData.data);
      setError(responseData?.message || requestError.message || "Unable to validate the journal file.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    validateFile(event.dataTransfer.files?.[0]);
  };

  const handleTemplateDownload = (format) => {
    try {
      setError("");
      downloadJournalImportTemplate(format);
    } catch (downloadError) {
      setError(downloadError.message || "Unable to prepare the journal template.");
    }
  };

  const headerErrorEntries = result?.header_errors
    ? Object.values(result.header_errors)
    : [];
  const allRowErrorEntries = (result?.row_errors || []).flatMap((row) =>
    Object.values(row.errors || {}).map((message) => `Row ${row.row}: ${message}`)
  );
  const rowErrorEntries = allRowErrorEntries.slice(0, 20);
  if (allRowErrorEntries.length > 20) {
    rowErrorEntries.push(`${allRowErrorEntries.length - 20} additional row issues are not shown.`);
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="journal-import-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <motion.section
            className="journal-import-modal"
            initial={{ opacity: 0, y: 22, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="journal-import-title"
          >
            <header className="journal-import-header">
              <div className="journal-import-heading">
                <span className="journal-import-heading__icon"><i className="fas fa-file-import" /></span>
                <div>
                  <span className="journal-import-eyebrow">Bulk journal entry</span>
                  <h2 id="journal-import-title">Import Excel or CSV</h2>
                  <p>Validate the file, review the journal lines, then load them into the normal journal form.</p>
                </div>
              </div>
              <button type="button" className="journal-import-close" onClick={closeModal} aria-label="Close import modal">
                <i className="fas fa-times" />
              </button>
            </header>

            <div className="journal-import-body">
              <div className="journal-import-template-note">
                <span><i className="fas fa-shield-alt" /></span>
                <div>
                  <strong>Review the imported journal before submitting.</strong>
                  <p>The import fills the current journal form so you can review, adjust and submit it through the normal workflow.</p>
                </div>
              </div>

              <div className="journal-import-template-actions">
                <button type="button" className="journal-import-template-button" onClick={() => handleTemplateDownload("xlsx")}>
                  <i className="fas fa-file-excel" /> Excel template
                </button>
                <button type="button" className="journal-import-template-button" onClick={() => handleTemplateDownload("csv")}>
                  <i className="fas fa-file-csv" /> CSV template
                </button>
              </div>

              <div
                className={`journal-import-dropzone ${dragActive ? "is-active" : ""} ${file ? "has-file" : ""}`}
                onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => { event.preventDefault(); setDragActive(false); }}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={(event) => validateFile(event.target.files?.[0])}
                />
                <span className="journal-import-dropzone__icon"><i className={`fas ${file ? "fa-file-alt" : "fa-cloud-upload-alt"}`} /></span>
                <div>
                  <strong>{file ? file.name : "Drop your journal file here"}</strong>
                  <span>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB selected` : "Excel (.xlsx/.xls) and CSV files are supported"}</span>
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isValidating}>
                  {file ? "Choose another" : "Browse file"}
                </button>
              </div>

              {isValidating ? (
                <div className="journal-import-loading">
                  <span className="invoice-loader" />
                  <div><strong>Checking journal data</strong><span>Matching ledgers, dates, currencies and exchange rates…</span></div>
                </div>
              ) : null}

              {error ? <div className="journal-import-alert is-error"><i className="fas fa-exclamation-triangle" /><span>{error}</span></div> : null}

              {result ? (
                <div className="journal-import-result">
                  <div className="journal-import-summary-grid">
                    <div><span>Journal lines</span><strong>{result.summary?.line_count || 0}</strong></div>
                    <div><span>Debit (NGN)</span><strong>{formatImportNumber(result.summary?.total_debit_ngn)}</strong></div>
                    <div><span>Credit (NGN)</span><strong>{formatImportNumber(result.summary?.total_credit_ngn)}</strong></div>
                    <div className={result.summary?.is_balanced ? "is-balanced" : "is-unbalanced"}>
                      <span>Difference</span><strong>{formatImportNumber(result.summary?.difference_ngn)}</strong>
                    </div>
                  </div>

                  <ErrorList title="Header issues" entries={headerErrorEntries} />
                  <ErrorList title="Line issues" entries={rowErrorEntries} />
                  <ErrorList title="Please note" entries={result.warnings || []} />

                  {result.items?.length ? (
                    <div className="journal-import-preview">
                      <div className="journal-import-preview__heading">
                        <div><strong>Validated line preview</strong><span>Showing the first {Math.min(8, result.items.length)} lines</span></div>
                        <span>{result.header?.journal_type || "Journal"} · {result.header?.journal_date || "—"}</span>
                      </div>
                      <div className="journal-import-preview__table-wrap">
                        <table>
                          <thead><tr><th>#</th><th>Ledger</th><th>Side</th><th>Currency</th><th>Amount</th><th>Description</th></tr></thead>
                          <tbody>
                            {result.items.slice(0, 8).map((item, index) => (
                              <tr key={`${item.ledger_name}-${index}`}>
                                <td>{index + 1}</td>
                                <td><strong>{item.ledger_name || "Unknown"}</strong><span>{item.ledger_number || "—"}</span></td>
                                <td>{item.sides || "—"}</td>
                                <td>{item.jcurrency || "—"}</td>
                                <td>{formatImportNumber(item.amount)}</td>
                                <td>{item.journal_description || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <footer className="journal-import-footer">
              <button type="button" className="journal-import-cancel" onClick={closeModal} disabled={isValidating}>Cancel</button>
              <button
                type="button"
                className="journal-import-apply"
                disabled={!result?.can_import || isValidating}
                onClick={() => {
                  onApply(result);
                  reset();
                }}
              >
                <i className="fas fa-file-import" /> Load into journal form
              </button>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
