import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import NavBar from "../NavBar";
import Header from "../Header";
import PageNav from "../../components/PageNav";
import TableLoaderComponent from "../../components/TableLoaderComponent";
import ChartSearchableSelect from "../../components/ChartSearchableSelect";
import EmptyTable from "../../components/EmptyTable";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import ErrorModal from "../../components/modals/ErrorModal";
import useThemeStore from "../../stores/useThemeStore";
import useJournalStore from "../../stores/useJournalStore";
import { formatCurrencyDecimals } from "../../utils/helper";
import { fadeInUp } from "../../utils/animation";
import JournalKPICards from "./JournalKPICards";
import "../invoice/InvoiceOverview.css";
import "./JournalOverview.css";

const formatDate = (value) => {
  if (!value) return "—";
  const text = String(value);
  const parsed = new Date(text.includes("T") ? text : `${text.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (value) => String(value || "Journal")
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join("")
  .toUpperCase();

const JournalOverview = () => {
  const [nav, setNav] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const {
    data,
    loading,
    error,
    total,
    currentPage,
    itemsPerPage,
    sortBy,
    sortOrder,
    searchQuery,
    selectedItems,
    fetchData,
    setCurrentPage,
    setItemsPerPage,
    setSearchQuery,
    setSorting,
    toggleItemSelection,
    clearSelection,
    deleteSelectedItems,
    exportToExcel,
    getTotalPages,
    fetchKPIs,
    kpis,
    kpisLoading,
  } = useJournalStore();

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Journal", to: "/journal/home", active: false },
  ];

  const pageLimitOptions = [5, 10, 25, 50, 100, 200, 500]
    .map((limit) => ({ id: limit, label: String(limit) }));

  const actionOptions = [
    { id: "", label: "Select Action" },
    { id: "delete", label: "Delete" },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Journal Overview";
    fetchKPIs();
  }, [fetchKPIs]);

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, sortBy, sortOrder, fetchData]);

  const totalPages = getTotalPages();
  const currentPageIds = useMemo(() => data.map((item) => item.journal_id), [data]);
  const allCurrentPageSelected = currentPageIds.length > 0
    && currentPageIds.every((journalId) => selectedItems.includes(journalId));

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    if (!query) fetchData();
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchData();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    fetchData();
  };

  const handleSort = (key) => {
    const direction = sortBy === key && sortOrder === "ASC" ? "DESC" : "ASC";
    setSorting(key, direction);
  };

  const handleSelectAll = () => {
    if (allCurrentPageSelected) {
      useJournalStore.setState({
        selectedItems: selectedItems.filter((journalId) => !currentPageIds.includes(journalId)),
      });
      return;
    }

    useJournalStore.setState({
      selectedItems: [...new Set([...selectedItems, ...currentPageIds])],
    });
  };

  const handleActionChange = (actionId) => {
    setSelectedAction(actionId);
    if (actionId === "delete") setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    const deleted = await deleteSelectedItems();
    setShowDeleteModal(false);
    setSelectedAction("");
    clearSelection();
    if (deleted) fetchKPIs();
  };

  const handleDeleteJournal = (journalId) => {
    if (!journalId) return;
    useJournalStore.setState({ selectedItems: [journalId] });
    setShowDeleteModal(true);
  };

  const handleCloseErrorModal = () => {
    useJournalStore.setState({ error: null });
  };

  const handleViewJournal = (journal) => {
    navigate(`/journal/view/${journal.journal_id}`, { state: { journal } });
  };

  const handleEditJournal = (journal) => {
    navigate(`/journal/edit/${journal.journal_id}`, { state: { journal } });
  };

  const handleDuplicateJournal = (journal) => {
    navigate(`/journal/create?duplicate=${encodeURIComponent(journal.journal_id)}`);
  };

  const getSortIcon = (columnKey) => {
    if (sortBy !== columnKey) {
      return <i className="fas fa-sort invoice-sort-icon invoice-sort-icon--idle" />;
    }
    return sortOrder === "ASC"
      ? <i className="fas fa-sort-up invoice-sort-icon" />
      : <i className="fas fa-sort-down invoice-sort-icon" />;
  };

  const getTypeStyle = (type) => {
    switch (String(type || "").toLowerCase()) {
      case "sales": return "success";
      case "receipt": return "success";
      case "payment": return "danger";
      case "expenses": return "warning";
      default: return "neutral";
    }
  };

  const getJournalAmount = (journal) => {
    const currency = String(journal?.journal_currency || "NGN").toUpperCase();
    const items = Array.isArray(journal?.items) ? journal.items : [];
    const asAmount = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
    };

    const sumSideForCurrency = (side) => items.reduce((sum, item) => {
      if (String(item?.journal_currency || "").toUpperCase() !== currency) return sum;
      return sum + asAmount(item?.[side]);
    }, 0);

    const ngnEquivalent = Math.max(
      asAmount(journal?.debit_ngn),
      asAmount(journal?.credit_ngn),
      asAmount(journal?.debit),
      asAmount(journal?.credit),
    );

    if (currency === "NGN") {
      const lineAmount = Math.max(sumSideForCurrency("debit"), sumSideForCurrency("credit"));
      return { currency, amount: lineAmount || ngnEquivalent, ngnEquivalent: null };
    }

    const lineAmount = Math.max(sumSideForCurrency("debit"), sumSideForCurrency("credit"));
    const storedForeignAmount = Math.max(
      asAmount(journal?.debit_others),
      asAmount(journal?.credit_others),
    );
    const rate = asAmount(journal?.rate);
    const convertedFallback = rate > 0 ? ngnEquivalent / rate : 0;

    return {
      currency,
      amount: lineAmount || storedForeignAmount || convertedFallback,
      ngnEquivalent,
    };
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    const pages = [];

    if (totalPages <= maxVisiblePages) {
      for (let page = 1; page <= totalPages; page += 1) pages.push(page);
      return pages;
    }

    const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - maxVisiblePages + 1));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push("...");
    }

    for (let page = startPage; page <= endPage; page += 1) pages.push(page);

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const renderRowActions = (journal, compact = false) => (
    <div className={`invoice-row-actions journal-row-actions ${compact ? "invoice-row-actions--mobile" : ""}`}>
      <button
        type="button"
        className="invoice-row-action invoice-row-action--edit"
        title="Edit journal"
        aria-label={`Edit journal ${journal.journal_id}`}
        onClick={() => handleEditJournal(journal)}
      >
        <i className="fas fa-pen" />
        {compact && <span>Edit</span>}
      </button>
      <button
        type="button"
        className="invoice-row-action invoice-row-action--view"
        title="View journal"
        aria-label={`View journal ${journal.journal_id}`}
        onClick={() => handleViewJournal(journal)}
      >
        <i className="fas fa-arrow-up-right-from-square" />
        {compact && <span>View</span>}
      </button>
      <button
        type="button"
        className="invoice-row-action journal-row-action--duplicate"
        title="Duplicate journal"
        aria-label={`Duplicate journal ${journal.journal_id}`}
        onClick={() => handleDuplicateJournal(journal)}
      >
        <i className="fas fa-copy" />
        {compact && <span>Duplicate</span>}
      </button>
      <button
        type="button"
        className="invoice-row-action invoice-row-action--delete"
        title="Delete journal"
        aria-label={`Delete journal ${journal.journal_id}`}
        onClick={() => handleDeleteJournal(journal.journal_id)}
      >
        <i className="fas fa-trash" />
        {compact && <span>Delete</span>}
      </button>
    </div>
  );

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`db-root invoice-overview-root journal-overview-root theme-${theme}`}>
          <div className="db-page invoice-overview-page journal-overview-page">
            <PageNav pageTitle="Journal Overview" links={links} />

            <motion.section
              className="invoice-overview-hero journal-overview-hero"
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="invoice-overview-hero__copy">
                <span className="invoice-overview-eyebrow">
                  <i className="fas fa-book-open" /> Accounting workspace
                </span>
                <h1>Review every journal from one balanced register</h1>
                <p>Search, sort and manage posted entries while keeping journal amounts, currencies and supporting actions easy to review.</p>
              </div>
              <div className="invoice-overview-hero__actions">
                <button
                  type="button"
                  className="invoice-overview-button invoice-overview-button--secondary"
                  onClick={exportToExcel}
                  disabled={loading || data.length === 0}
                >
                  <i className="fas fa-file-excel" />
                  <span>Export current page</span>
                </button>
                <Link to="/journal/create" className="invoice-overview-button invoice-overview-button--primary">
                  <i className="fas fa-plus" />
                  <span>Create journal</span>
                </Link>
              </div>
            </motion.section>

            <JournalKPICards kpis={kpis} loading={kpisLoading} />

            <motion.section
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="invoice-overview-panel journal-overview-panel"
            >
              <div className="invoice-overview-panel__header">
                <div>
                  <span className="invoice-overview-eyebrow">Journal register</span>
                  <h2>All journal entries</h2>
                  <p>{total.toLocaleString("en-US")} journal{total === 1 ? "" : "s"} in the current register</p>
                </div>
                <span className="invoice-overview-panel__count">
                  <i className="fas fa-layer-group" /> Page {currentPage} of {Math.max(totalPages, 1)}
                </span>
              </div>

              <div className="invoice-overview-toolbar">
                <form className="invoice-overview-search" onSubmit={handleSearchSubmit}>
                  <i className="fas fa-magnifying-glass" aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Search ID, description, type, cost centre or currency"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    aria-label="Search journals"
                  />
                  {searchQuery && (
                    <button type="button" className="invoice-search-clear" onClick={handleClearSearch} aria-label="Clear journal search">
                      <i className="fas fa-xmark" />
                    </button>
                  )}
                  <button type="submit" className="invoice-search-submit">
                    <span>Search</span>
                    <i className="fas fa-arrow-right" />
                  </button>
                </form>

                <div className="invoice-overview-filters">
                  <div className="invoice-overview-filter">
                    <label>Rows per page</label>
                    <ChartSearchableSelect
                      options={pageLimitOptions}
                      value={itemsPerPage}
                      onChange={setItemsPerPage}
                      className="invoice-page-limit-select"
                    />
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="invoice-overview-filter invoice-overview-filter--action">
                      <label>Bulk action</label>
                      <ChartSearchableSelect
                        options={actionOptions}
                        value={selectedAction}
                        onChange={handleActionChange}
                        className="invoice-bulk-action-select"
                      />
                    </div>
                  )}
                </div>
              </div>

              {selectedItems.length > 0 && (
                <div className="invoice-selection-banner">
                  <span><i className="fas fa-circle-check" /> {selectedItems.length} selected</span>
                  <button type="button" onClick={clearSelection}>Clear selection</button>
                </div>
              )}

              {loading ? (
                <div className="invoice-overview-loader"><TableLoaderComponent /></div>
              ) : (
                <>
                  {data.length > 0 && (
                    <>
                      <div className="invoice-overview-table-wrap journal-overview-table-wrap">
                        <table className="invoice-overview-table journal-overview-table">
                          <thead>
                            <tr>
                              <th className="invoice-check-cell">
                                <input
                                  type="checkbox"
                                  checked={allCurrentPageSelected}
                                  onChange={handleSelectAll}
                                  aria-label="Select all journals on this page"
                                  className="table-checkbox"
                                />
                              </th>
                              <th className="sortable" onClick={() => handleSort("journal_id")}>Journal {getSortIcon("journal_id")}</th>
                              <th className="sortable" onClick={() => handleSort("journal_date")}>Date {getSortIcon("journal_date")}</th>
                              <th>Description</th>
                              <th className="sortable" onClick={() => handleSort("journal_type")}>Type {getSortIcon("journal_type")}</th>
                              <th>Cost centre</th>
                              <th>Amount</th>
                              <th className="invoice-actions-cell">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.map((journal) => {
                              const selected = selectedItems.includes(journal.journal_id);
                              const displayAmount = getJournalAmount(journal);
                              return (
                                <tr key={journal.id || journal.journal_id} className={selected ? "selected" : ""}>
                                  <td className="invoice-check-cell">
                                    <input
                                      type="checkbox"
                                      className="table-checkbox"
                                      checked={selected}
                                      onChange={() => toggleItemSelection(journal.journal_id)}
                                      aria-label={`Select journal ${journal.journal_id}`}
                                    />
                                  </td>
                                  <td>
                                    <button type="button" className="invoice-number-link" onClick={() => handleViewJournal(journal)}>
                                      <span>JRN</span> {journal.journal_id}
                                    </button>
                                  </td>
                                  <td><span className="invoice-date-value">{formatDate(journal.journal_date)}</span></td>
                                  <td>
                                    <div className="journal-description-cell">
                                      <strong>{journal.journal_description || "No description"}</strong>
                                      <small>{journal.transaction_type || "Not applicable"}</small>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`invoice-status-pill invoice-status-pill--${getTypeStyle(journal.journal_type)}`}>
                                      <i /> {journal.journal_type || "General"}
                                    </span>
                                  </td>
                                  <td><span className="journal-cost-centre">{journal.cost_center || "—"}</span></td>
                                  <td className="journal-overview-amount-cell">
                                    <div className="journal-overview-amount">
                                      <strong className="invoice-amount-value">
                                        {formatCurrencyDecimals(displayAmount.amount, displayAmount.currency)}
                                      </strong>
                                      {displayAmount.ngnEquivalent !== null && (
                                        <small>NGN equiv. {formatCurrencyDecimals(displayAmount.ngnEquivalent, "NGN")}</small>
                                      )}
                                    </div>
                                  </td>
                                  <td className="invoice-actions-cell">{renderRowActions(journal)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="invoice-mobile-list journal-mobile-list">
                        {data.map((journal) => {
                          const selected = selectedItems.includes(journal.journal_id);
                          const displayAmount = getJournalAmount(journal);
                          return (
                            <article key={`mobile-${journal.id || journal.journal_id}`} className={`invoice-mobile-card journal-mobile-card ${selected ? "selected" : ""}`}>
                              <div className="invoice-mobile-card__top">
                                <label className="invoice-mobile-check">
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleItemSelection(journal.journal_id)}
                                    aria-label={`Select journal ${journal.journal_id}`}
                                  />
                                  <span />
                                </label>
                                <button type="button" className="invoice-mobile-number" onClick={() => handleViewJournal(journal)}>
                                  JRN {journal.journal_id}
                                </button>
                                <span className={`invoice-status-pill invoice-status-pill--${getTypeStyle(journal.journal_type)}`}>
                                  <i /> {journal.journal_type || "General"}
                                </span>
                              </div>

                              <div className="invoice-mobile-client journal-mobile-description">
                                <span className="invoice-client-avatar">{getInitials(journal.cost_center || journal.journal_description)}</span>
                                <div>
                                  <strong>{journal.journal_description || "No description"}</strong>
                                  <small>{formatDate(journal.journal_date)} · {journal.transaction_type || "Not applicable"}</small>
                                </div>
                              </div>

                              <div className="invoice-mobile-card__amount">
                                <span>Journal amount</span>
                                <div className="journal-mobile-amount">
                                  <strong>{formatCurrencyDecimals(displayAmount.amount, displayAmount.currency)}</strong>
                                  {displayAmount.ngnEquivalent !== null && (
                                    <small>NGN equiv. {formatCurrencyDecimals(displayAmount.ngnEquivalent, "NGN")}</small>
                                  )}
                                </div>
                              </div>

                              <div className="invoice-mobile-card__meta journal-mobile-meta">
                                <div>
                                  <span>Cost centre</span>
                                  <strong>{journal.cost_center || "—"}</strong>
                                </div>
                                <div>
                                  <span>Currency</span>
                                  <strong>{String(journal.journal_currency || "NGN").toUpperCase()}</strong>
                                </div>
                              </div>

                              {renderRowActions(journal, true)}
                            </article>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {totalPages > 1 && (
                    <div className="invoice-pagination">
                      <div className="invoice-pagination__info">
                        <span>Showing</span>
                        <strong>{((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, total)}</strong>
                        <span>of {total.toLocaleString("en-US")}</span>
                      </div>
                      <div className="invoice-pagination__controls">
                        <button
                          type="button"
                          className="invoice-page-button invoice-page-button--nav"
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <i className="fas fa-chevron-left" /> <span>Previous</span>
                        </button>

                        {getPageNumbers().map((page, index) => (
                          page === "..." ? (
                            <span key={`ellipsis-${index}`} className="invoice-pagination__ellipsis">•••</span>
                          ) : (
                            <button
                              type="button"
                              key={page}
                              className={`invoice-page-button ${currentPage === page ? "active" : ""}`}
                              onClick={() => goToPage(page)}
                              aria-label={`Go to page ${page}`}
                            >
                              {page}
                            </button>
                          )
                        ))}

                        <button
                          type="button"
                          className="invoice-page-button invoice-page-button--nav"
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <span>Next</span> <i className="fas fa-chevron-right" />
                        </button>
                      </div>
                    </div>
                  )}

                  {data.length === 0 && (
                    <div className="invoice-overview-empty">
                      <EmptyTable
                        icon="fas fa-book-open"
                        message="No journals found matching your criteria"
                        link="/journal/create"
                      />
                    </div>
                  )}
                </>
              )}
            </motion.section>

            <AnimatePresence>
              {showDeleteModal && (
                <DeleteConfirmationModal
                  isOpen={showDeleteModal}
                  onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedAction("");
                    clearSelection();
                  }}
                  onConfirm={handleDelete}
                  count={selectedItems.length}
                  page="journal"
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <ErrorModal
                  isOpen={Boolean(error)}
                  onClose={handleCloseErrorModal}
                  onRetry={fetchData}
                  message={error}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalOverview;
