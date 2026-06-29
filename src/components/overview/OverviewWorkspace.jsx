import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageNav from "../PageNav";
import ChartSearchableSelect from "../ChartSearchableSelect";
import TableLoaderComponent from "../TableLoaderComponent";
import EmptyTable from "../EmptyTable";
import { fadeInUp } from "../../utils/animation";
import "./OverviewWorkspace.css";

export const OverviewRowActions = ({ actions = [], compact = false }) => (
  <div className={`entity-overview-actions ${compact ? "entity-overview-actions--mobile" : ""}`}>
    {actions.filter(Boolean).map((action) => (
      <button
        key={action.key || action.label}
        type="button"
        className={`entity-overview-action entity-overview-action--${action.tone || "neutral"}`}
        onClick={action.onClick}
        title={action.label}
        aria-label={action.ariaLabel || action.label}
      >
        <i className={`fas ${action.icon}`} aria-hidden="true" />
        {compact && <span>{action.label}</span>}
      </button>
    ))}
  </div>
);

export const OverviewBadge = ({ children, tone = "neutral", icon }) => (
  <span className={`entity-overview-badge entity-overview-badge--${tone}`}>
    {icon && <i className={`fas ${icon}`} aria-hidden="true" />}
    {children}
  </span>
);

const OverviewWorkspace = ({
  theme,
  pageTitle,
  links,
  hero,
  cards = [],
  register,
  data = [],
  loading,
  total = 0,
  currentPage = 1,
  itemsPerPage = 10,
  totalPages = 0,
  searchQuery = "",
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  searchPlaceholder = "Search records",
  pageLimitOptions = [],
  onItemsPerPageChange,
  selectedCount = 0,
  selectedAction = "",
  actionOptions = [],
  onActionChange,
  onClearSelection,
  columns = [],
  getRowKey,
  isSelected,
  onToggleSelection,
  allSelected,
  onToggleSelectAll,
  mobile,
  pageNumbers = [],
  onPageChange,
  empty,
}) => {
  const visibleStart = total > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0;
  const visibleEnd = Math.min(currentPage * itemsPerPage, total);

  const submitSearch = (event) => {
    event.preventDefault();
    onSearchSubmit?.();
  };

  return (
    <div className={`db-root entity-overview-root theme-${theme}`}>
      <div className="db-page entity-overview-page">
        <PageNav pageTitle={pageTitle} links={links} />

        <motion.section
          className="entity-overview-hero"
          variants={fadeInUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="entity-overview-hero__copy">
            <span className="entity-overview-eyebrow">
              <i className={`fas ${hero.icon}`} aria-hidden="true" />
              {hero.eyebrow}
            </span>
            <h1>{hero.title}</h1>
            <p>{hero.description}</p>
          </div>

          <div className="entity-overview-hero__actions">
            {hero.onExport && (
              <button
                type="button"
                className="entity-overview-button entity-overview-button--secondary"
                onClick={hero.onExport}
                disabled={hero.exportDisabled}
              >
                <i className="fas fa-file-excel" aria-hidden="true" />
                <span>{hero.exportLabel || "Export current page"}</span>
              </button>
            )}
            {hero.createLink && (
              <Link to={hero.createLink} className="entity-overview-button entity-overview-button--primary">
                <i className="fas fa-plus" aria-hidden="true" />
                <span>{hero.createLabel}</span>
              </Link>
            )}
          </div>
        </motion.section>

        {cards.length > 0 && (
          <motion.section
            className="entity-overview-kpis"
            variants={fadeInUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.35, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
            aria-label={`${pageTitle} summary`}
          >
            {cards.map((card) => (
              <article key={card.key || card.label} className={`entity-overview-kpi entity-overview-kpi--${card.tone || "teal"}`}>
                <div className="entity-overview-kpi__top">
                  <span className="entity-overview-kpi__icon"><i className={`fas ${card.icon}`} aria-hidden="true" /></span>
                  {card.chip && <span className="entity-overview-kpi__chip">{card.chip}</span>}
                </div>
                <strong>{card.value}</strong>
                <span>{card.label}</span>
                <small>{card.note}</small>
              </article>
            ))}
          </motion.section>
        )}

        <motion.section
          className="entity-overview-panel"
          variants={fadeInUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="entity-overview-panel__header">
            <div>
              <span className="entity-overview-eyebrow">{register.eyebrow}</span>
              <h2>{register.title}</h2>
              <p>{register.description || `${Number(total).toLocaleString("en-US")} ${register.itemLabel}${total === 1 ? "" : "s"} in the current register`}</p>
            </div>
            <span className="entity-overview-panel__count">
              <i className="fas fa-layer-group" aria-hidden="true" />
              Page {currentPage} of {Math.max(totalPages, 1)}
            </span>
          </div>

          <div className="entity-overview-toolbar">
            <form className="entity-overview-search" onSubmit={submitSearch}>
              <i className="fas fa-magnifying-glass" aria-hidden="true" />
              <input
                type="search"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={onSearchChange}
                aria-label={searchPlaceholder}
              />
              {searchQuery && (
                <button type="button" className="entity-overview-search__clear" onClick={onClearSearch} aria-label="Clear search">
                  <i className="fas fa-xmark" aria-hidden="true" />
                </button>
              )}
              <button type="submit" className="entity-overview-search__submit">
                <span>Search</span>
                <i className="fas fa-arrow-right" aria-hidden="true" />
              </button>
            </form>

            <div className="entity-overview-filters">
              <div className="entity-overview-filter">
                <label>Rows per page</label>
                <ChartSearchableSelect
                  options={pageLimitOptions}
                  value={itemsPerPage}
                  onChange={onItemsPerPageChange}
                  className="entity-overview-limit-select"
                />
              </div>

              {selectedCount > 0 && (
                <div className="entity-overview-filter entity-overview-filter--action">
                  <label>Bulk action</label>
                  <ChartSearchableSelect
                    options={actionOptions}
                    value={selectedAction}
                    onChange={onActionChange}
                    className="entity-overview-action-select"
                  />
                </div>
              )}
            </div>
          </div>

          {selectedCount > 0 && (
            <div className="entity-overview-selection">
              <span><i className="fas fa-circle-check" aria-hidden="true" /> {selectedCount} selected</span>
              <button type="button" onClick={onClearSelection}>Clear selection</button>
            </div>
          )}

          {loading ? (
            <div className="entity-overview-loader"><TableLoaderComponent /></div>
          ) : (
            <>
              {data.length > 0 && (
                <>
                  <div className="entity-overview-table-wrap">
                    <table className="entity-overview-table">
                      <thead>
                        <tr>
                          <th className="entity-overview-check-cell">
                            <input
                              type="checkbox"
                              checked={Boolean(allSelected)}
                              onChange={onToggleSelectAll}
                              aria-label={`Select all ${register.itemLabel}s on this page`}
                              className="table-checkbox"
                            />
                          </th>
                          {columns.map((column) => (
                            <th
                              key={column.key}
                              className={`${column.sortKey ? "sortable" : ""} ${column.headerClassName || ""}`.trim()}
                              onClick={column.sortKey ? () => column.onSort?.(column.sortKey) : undefined}
                            >
                              {column.label} {column.sortKey ? column.sortIcon?.(column.sortKey) : null}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item, index) => {
                          const key = getRowKey(item, index);
                          const selected = isSelected(item);
                          return (
                            <tr key={key} className={selected ? "selected" : ""}>
                              <td className="entity-overview-check-cell">
                                <input
                                  type="checkbox"
                                  className="table-checkbox"
                                  checked={selected}
                                  onChange={() => onToggleSelection(item)}
                                  aria-label={`Select ${register.itemLabel}`}
                                />
                              </td>
                              {columns.map((column) => (
                                <td key={column.key} className={column.cellClassName || ""}>
                                  {column.render(item, index)}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="entity-overview-mobile-list">
                    {data.map((item, index) => {
                      const key = getRowKey(item, index);
                      const selected = isSelected(item);
                      return (
                        <article key={`mobile-${key}`} className={`entity-overview-mobile-card ${selected ? "selected" : ""}`}>
                          <div className="entity-overview-mobile-card__top">
                            <label className="entity-overview-mobile-check">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => onToggleSelection(item)}
                                aria-label={`Select ${register.itemLabel}`}
                              />
                              <span />
                            </label>
                            <div className="entity-overview-mobile-card__identity">
                              <strong>{mobile.title(item)}</strong>
                              {mobile.subtitle && <small>{mobile.subtitle(item)}</small>}
                            </div>
                            {mobile.badge && <div className="entity-overview-mobile-card__badge">{mobile.badge(item)}</div>}
                          </div>

                          <div className="entity-overview-mobile-card__fields">
                            {mobile.fields.map((field) => (
                              <div key={field.key} className={field.wide ? "wide" : ""}>
                                <span>{field.label}</span>
                                <strong>{field.render(item)}</strong>
                              </div>
                            ))}
                          </div>

                          {mobile.actions(item)}
                        </article>
                      );
                    })}
                  </div>
                </>
              )}

              {totalPages > 1 && (
                <div className="entity-overview-pagination">
                  <div className="entity-overview-pagination__info">
                    <span>Showing</span>
                    <strong>{visibleStart}–{visibleEnd}</strong>
                    <span>of {Number(total).toLocaleString("en-US")}</span>
                  </div>
                  <div className="entity-overview-pagination__controls">
                    <button
                      type="button"
                      className="entity-overview-page-button entity-overview-page-button--nav"
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >
                      <i className="fas fa-chevron-left" aria-hidden="true" />
                      <span>Previous</span>
                    </button>

                    {pageNumbers.map((page, index) => (
                      page === "..." ? (
                        <span key={`ellipsis-${index}`} className="entity-overview-pagination__ellipsis">•••</span>
                      ) : (
                        <button
                          type="button"
                          key={page}
                          className={`entity-overview-page-button ${currentPage === page ? "active" : ""}`}
                          onClick={() => onPageChange(page)}
                          aria-current={currentPage === page ? "page" : undefined}
                        >
                          {page}
                        </button>
                      )
                    ))}

                    <button
                      type="button"
                      className="entity-overview-page-button entity-overview-page-button--nav"
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                    >
                      <span>Next</span>
                      <i className="fas fa-chevron-right" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {data.length === 0 && (
                <div className="entity-overview-empty">
                  <EmptyTable icon={empty.icon} message={empty.message} link={empty.link} />
                </div>
              )}
            </>
          )}
        </motion.section>
      </div>
    </div>
  );
};

export default OverviewWorkspace;
