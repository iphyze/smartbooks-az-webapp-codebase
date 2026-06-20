import React, { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import useToastStore from "../../stores/useToastStore";
import printPdfDocument from "../../utils/printPdfDocument";
import "./EntityView.css";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

export const EntityViewShell = ({
  theme,
  icon = "fa-layer-group",
  eyebrow = "Smartbooks record",
  title,
  subtitle,
  badges = [],
  actions,
  highlights = [],
  children,
}) => (
  <section className={`entity-view-card theme-${theme}`}>
    <div className="entity-view-card__glow" aria-hidden="true" />

    <header className="entity-view-hero">
      <div className="entity-view-identity">
        <div className="entity-view-avatar" aria-hidden="true">
          <i className={`fas ${icon}`} />
        </div>

        <div className="entity-view-identity__copy">
          <span className="entity-view-eyebrow">
            <i className="fas fa-layer-group" aria-hidden="true" />
            {eyebrow}
          </span>
          <h2>{title || "Record details"}</h2>
          {subtitle && <p>{subtitle}</p>}

          {badges.length > 0 && (
            <div className="entity-view-badges">
              {badges.filter((badge) => badge?.label).map((badge, index) => (
                <span
                  key={`${badge.label}-${index}`}
                  className={joinClasses(
                    "entity-view-badge",
                    `entity-view-badge--${badge.variant || "neutral"}`
                  )}
                >
                  {badge.icon && <i className={`fas ${badge.icon}`} aria-hidden="true" />}
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {actions && <div className="entity-view-actions">{actions}</div>}
    </header>

    {highlights.length > 0 && (
      <div className="entity-view-highlight-grid">
        {highlights.map((highlight, index) => (
          <article className="entity-view-highlight" key={`${highlight.label}-${index}`}>
            <span className="entity-view-highlight__icon" aria-hidden="true">
              <i className={`fas ${highlight.icon || "fa-circle-info"}`} />
            </span>
            <div>
              <span>{highlight.label}</span>
              <strong title={String(highlight.value ?? "")}>{highlight.value || "Not available"}</strong>
            </div>
          </article>
        ))}
      </div>
    )}

    <div className="entity-view-content">{children}</div>
  </section>
);

export const EntityViewActions = ({
  onBack,
  backLabel = "Back",
  onEdit,
  editLabel = "Edit",
  pdfDocument,
  fileName = "Smartbooks document.pdf",
  printTitle = "Preparing document",
}) => {
  const { showToast } = useToastStore();
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    if (!pdfDocument || isPrinting) return;

    setIsPrinting(true);
    try {
      await printPdfDocument(pdfDocument, printTitle);
    } catch (error) {
      showToast(error?.message || "The PDF could not be prepared for printing.", "error");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <>
      {onBack && (
        <button type="button" className="entity-view-action entity-view-action--secondary" onClick={onBack}>
          <i className="fas fa-arrow-left" aria-hidden="true" />
          <span>{backLabel}</span>
        </button>
      )}
      {onEdit && (
        <button type="button" className="entity-view-action entity-view-action--primary" onClick={onEdit}>
          <i className="fas fa-pen-to-square" aria-hidden="true" />
          <span>{editLabel}</span>
        </button>
      )}
      {pdfDocument && (
        <>
          <button
            type="button"
            className="entity-view-action entity-view-action--print"
            onClick={handlePrint}
            disabled={isPrinting}
          >
            <i className={`fas ${isPrinting ? "fa-spinner fa-spin" : "fa-print"}`} aria-hidden="true" />
            <span>{isPrinting ? "Preparing…" : "Print PDF"}</span>
          </button>
          <PDFDownloadLink
            document={pdfDocument}
            fileName={fileName}
            className="entity-view-action entity-view-action--download"
          >
            {({ loading }) => (
              <>
                <i className={`fas ${loading ? "fa-spinner fa-spin" : "fa-file-pdf"}`} aria-hidden="true" />
                <span>{loading ? "Preparing…" : "Download PDF"}</span>
              </>
            )}
          </PDFDownloadLink>
        </>
      )}
    </>
  );
};

export const EntityViewPanel = ({
  icon = "fa-circle-info",
  title,
  description,
  wide = false,
  children,
  className = "",
}) => (
  <section className={joinClasses("entity-view-panel", wide && "entity-view-panel--wide", className)}>
    <div className="entity-view-panel__heading">
      <span className="entity-view-panel__heading-icon" aria-hidden="true">
        <i className={`fas ${icon}`} />
      </span>
      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
    </div>
    <div className="entity-view-panel__body">{children}</div>
  </section>
);

export const EntityViewDetail = ({
  icon = "fa-circle-info",
  label,
  value,
  subtle = false,
  onClick,
}) => {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={joinClasses(
        "entity-view-detail",
        subtle && "is-subtle",
        onClick && "is-interactive"
      )}
      onClick={onClick}
    >
      <span className="entity-view-detail__icon" aria-hidden="true">
        <i className={`fas ${icon}`} />
      </span>
      <span className="entity-view-detail__copy">
        <span className="entity-view-detail__label">{label}</span>
        <strong className="entity-view-detail__value">{value || "Not provided"}</strong>
      </span>
      {onClick && <i className="fas fa-arrow-up-right-from-square entity-view-detail__arrow" aria-hidden="true" />}
    </Tag>
  );
};

export const EntityViewSectionHeading = ({ icon = "fa-chart-line", title, description, count }) => (
  <div className="entity-view-section-heading">
    <span className="entity-view-section-heading__icon" aria-hidden="true">
      <i className={`fas ${icon}`} />
    </span>
    <div>
      <div className="entity-view-section-heading__title-row">
        <h3>{title}</h3>
        {count !== undefined && count !== null && (
          <span className="entity-view-section-heading__count">{count}</span>
        )}
      </div>
      {description && <p>{description}</p>}
    </div>
  </div>
);

export const EntitySummaryGrid = ({ children }) => (
  <div className="entity-view-summary-grid">{children}</div>
);

export const EntitySummaryCard = ({ title, subtitle, icon = "fa-chart-pie", rows = [] }) => (
  <article className="entity-view-summary-card">
    <div className="entity-view-summary-card__header">
      <span aria-hidden="true"><i className={`fas ${icon}`} /></span>
      <div>
        <h4>{title}</h4>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
    <div className="entity-view-summary-card__body">
      {rows.map((row, index) => (
        <div className={joinClasses("entity-view-summary-row", row.variant && `is-${row.variant}`)} key={`${row.label}-${index}`}>
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
  </article>
);

export const EntityViewTable = ({ columns = [], children, minWidth = 760 }) => (
  <div className="entity-view-table-wrap">
    <table className="entity-view-table" style={{ minWidth }}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key || column.label} className={column.align ? `is-${column.align}` : ""}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export const EntityViewEmpty = ({
  icon = "fa-inbox",
  title = "Nothing to show yet",
  description,
}) => (
  <div className="entity-view-empty">
    <span aria-hidden="true"><i className={`fas ${icon}`} /></span>
    <h4>{title}</h4>
    {description && <p>{description}</p>}
  </div>
);

export const EntityStatusBadge = ({ status }) => {
  const normalized = String(status || "unknown").toLowerCase();
  const variant = ["paid", "active"].includes(normalized)
    ? "success"
    : ["pending"].includes(normalized)
      ? "warning"
      : ["overdue", "cancelled", "inactive"].includes(normalized)
        ? "danger"
        : "neutral";

  return <span className={`entity-view-status entity-view-status--${variant}`}>{status || "Unknown"}</span>;
};

export const EntityTableAction = ({ label = "View", onClick, icon = "fa-eye" }) => (
  <button type="button" className="entity-view-table-action" onClick={onClick} title={label}>
    <i className={`fas ${icon}`} aria-hidden="true" />
    <span>{label}</span>
  </button>
);

export default EntityViewShell;
