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
import useInvoiceStore from "../../stores/useInvoiceStore";
import { formatCurrencyDecimals } from "../../utils/helper";
import printPdfDocument from "../../utils/printPdfDocument";
import useToastStore from "../../stores/useToastStore";
import api from "../../services/api";
import DownloadInvoice from "./DownloadInvoice";
import { fadeInUp } from "../../utils/animation";
import InvoiceKPICards from "./InvoiceKPICards";
import "./InvoiceWorkflow.css";
import "./InvoiceOverview.css";

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

const clientInitials = (name) => String(name || "Client")
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join("")
  .toUpperCase();

const InvoiceOverview = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const [printingInvoiceNumber, setPrintingInvoiceNumber] = useState(null);

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
  } = useInvoiceStore();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Invoices", to: "/invoice/home", active: false },
  ];

  const actionOptions = [
    { id: "", label: "Select Action" },
    { id: "delete", label: "Delete" },
  ];

  const pageLimitOptions = [5, 10, 25, 50, 100, 200, 500]
    .map((limit) => ({ id: limit, label: String(limit) }));

  useEffect(() => {
    document.title = "Smartbooks | Invoice Overview";
    fetchKPIs();
  }, [fetchKPIs]);

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, sortBy, sortOrder, fetchData]);

  const totalPages = getTotalPages();
  const currentPageIds = useMemo(() => data.map((item) => item.invoice_number), [data]);
  const allCurrentPageSelected = currentPageIds.length > 0
    && currentPageIds.every((invoiceNumber) => selectedItems.includes(invoiceNumber));

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
    const newDirection = sortBy === key && sortOrder === "ASC" ? "DESC" : "ASC";
    setSorting(key, newDirection);
  };

  const handleSelectAll = () => {
    if (allCurrentPageSelected) {
      useInvoiceStore.setState({
        selectedItems: selectedItems.filter((invoiceNumber) => !currentPageIds.includes(invoiceNumber)),
      });
      return;
    }

    useInvoiceStore.setState({
      selectedItems: [...new Set([...selectedItems, ...currentPageIds])],
    });
  };

  const handleActionChange = (actionId) => {
    setSelectedAction(actionId);
    if (actionId === "delete") setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    await deleteSelectedItems();
    setShowDeleteModal(false);
    setSelectedAction("");
    clearSelection();
    fetchKPIs();
  };

  const handleDeleteInvoice = (invoiceNumber) => {
    if (!invoiceNumber) return;
    useInvoiceStore.setState({ selectedItems: [invoiceNumber] });
    setShowDeleteModal(true);
  };

  const handleCloseErrorModal = () => {
    useInvoiceStore.setState({ error: null });
  };

  const handleViewInvoice = (invoice) => {
    navigate(`/invoice/view/${invoice.invoice_number}`, { state: { invoice } });
  };

  const handleEditInvoice = (invoice) => {
    navigate(`/invoice/edit/${invoice.invoice_number}`, { state: { invoice } });
  };

  const handlePrintInvoice = async (invoice) => {
    if (!invoice?.invoice_number || printingInvoiceNumber) return;

    setPrintingInvoiceNumber(invoice.invoice_number);
    try {
      const response = await api.get(
        `/invoice/fetch-single-invoice?invoice_number=${encodeURIComponent(invoice.invoice_number)}`
      );
      const fullInvoice = response.data?.data;
      if (!fullInvoice) throw new Error("Invoice data was not returned.");

      const reference = String(fullInvoice.invoice_number || "").startsWith("AZ-")
        ? String(fullInvoice.invoice_number)
        : `AZ-${fullInvoice.invoice_number || ""}`;
      await printPdfDocument(<DownloadInvoice invoice={fullInvoice} />, `Preparing invoice ${reference}`);
    } catch (error) {
      showToast(
        error.response?.data?.message || error.message || "The invoice could not be prepared for printing.",
        "error"
      );
    } finally {
      setPrintingInvoiceNumber(null);
    }
  };

  const getSortIcon = (columnKey) => {
    if (sortBy !== columnKey) return <i className="fas fa-sort invoice-sort-icon invoice-sort-icon--idle" />;
    return sortOrder === "ASC"
      ? <i className="fas fa-sort-up invoice-sort-icon" />
      : <i className="fas fa-sort-down invoice-sort-icon" />;
  };

  const getWorkflowStyle = (status) => {
    const normalized = String(status || "Issued").toLowerCase();
    return ["issued", "cancelled", "void"].includes(normalized) ? normalized : "issued";
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid": return "success";
      case "Pending":
      case "Partially Paid": return "warning";
      case "Overdue":
      case "Cancelled":
      case "Rejected": return "danger";
      default: return "neutral";
    }
  };

  const formatDeliveryDate = (value) => {
    if (!value) return "";
    const parsed = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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

  const renderDeliveryState = (invoice) => (
    Number(invoice.sent_count || 0) > 0 ? (
      <div className="invoice-delivery-state invoice-delivery-state--sent">
        <span className="invoice-delivery-state__label">
          <i className="fas fa-paper-plane" aria-hidden="true" />
          Sent {Number(invoice.sent_count) > 1 ? `${invoice.sent_count}×` : ""}
        </span>
        {invoice.last_sent_at && <small>{formatDeliveryDate(invoice.last_sent_at)}</small>}
      </div>
    ) : (
      <div className="invoice-delivery-state invoice-delivery-state--not-sent">
        <span className="invoice-delivery-state__label">
          <i className="fas fa-envelope" aria-hidden="true" />
          Not sent
        </span>
      </div>
    )
  );

  const renderRowActions = (invoice, compact = false) => (
    <div className={`invoice-row-actions ${compact ? "invoice-row-actions--mobile" : ""}`}>
      <button
        type="button"
        className="invoice-row-action invoice-row-action--edit"
        title="Edit invoice"
        aria-label={`Edit invoice ${invoice.invoice_number}`}
        onClick={() => handleEditInvoice(invoice)}
      >
        <i className="fas fa-pen" />
        {compact && <span>Edit</span>}
      </button>
      <button
        type="button"
        className="invoice-row-action invoice-row-action--view"
        title="View invoice"
        aria-label={`View invoice ${invoice.invoice_number}`}
        onClick={() => handleViewInvoice(invoice)}
      >
        <i className="fas fa-arrow-up-right-from-square" />
        {compact && <span>View</span>}
      </button>
      <button
        type="button"
        className="invoice-row-action invoice-row-action--print"
        title="Print invoice"
        aria-label={`Print invoice ${invoice.invoice_number}`}
        onClick={() => handlePrintInvoice(invoice)}
        disabled={printingInvoiceNumber === invoice.invoice_number}
      >
        <i className={`fas ${printingInvoiceNumber === invoice.invoice_number ? "fa-spinner fa-spin" : "fa-print"}`} />
        {compact && <span>Print</span>}
      </button>
      <button
        type="button"
        className="invoice-row-action invoice-row-action--delete"
        title="Delete invoice"
        aria-label={`Delete invoice ${invoice.invoice_number}`}
        onClick={() => handleDeleteInvoice(invoice.invoice_number)}
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
        <div className={`db-root invoice-overview-root theme-${theme}`}>
          <div className="db-page invoice-overview-page">
            <PageNav pageTitle="Invoice Overview" links={links} />

            <motion.section
              className="invoice-overview-hero"
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="invoice-overview-hero__copy">
                <span className="invoice-overview-eyebrow">
                  <i className="fas fa-file-invoice-dollar" /> Billing workspace
                </span>
                <h1>Manage every invoice from one clear view</h1>
                <p>Track payment, workflow and delivery status while keeping daily invoice actions within easy reach.</p>
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
                <Link to="/invoice/create" className="invoice-overview-button invoice-overview-button--primary">
                  <i className="fas fa-plus" />
                  <span>Create invoice</span>
                </Link>
              </div>
            </motion.section>

            <InvoiceKPICards kpis={kpis} loading={kpisLoading} />

            <motion.section
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="invoice-overview-panel"
            >
              <div className="invoice-overview-panel__header">
                <div>
                  <span className="invoice-overview-eyebrow">Invoice register</span>
                  <h2>All invoices</h2>
                  <p>{total.toLocaleString("en-US")} invoice{total === 1 ? "" : "s"} in the current register</p>
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
                    placeholder="Search invoice number, client or status"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    aria-label="Search invoices"
                  />
                  {searchQuery && (
                    <button type="button" className="invoice-search-clear" onClick={handleClearSearch} aria-label="Clear invoice search">
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
                      <div className="invoice-overview-table-wrap">
                        <table className="invoice-overview-table">
                          <thead>
                            <tr>
                              <th className="invoice-check-cell">
                                <input
                                  type="checkbox"
                                  checked={allCurrentPageSelected}
                                  onChange={handleSelectAll}
                                  aria-label="Select all invoices on this page"
                                  className="table-checkbox"
                                />
                              </th>
                              <th className="sortable" onClick={() => handleSort("invoice_number")}>Invoice {getSortIcon("invoice_number")}</th>
                              <th className="sortable" onClick={() => handleSort("invoice_date")}>Issued {getSortIcon("invoice_date")}</th>
                              <th>Client</th>
                              <th className="sortable" onClick={() => handleSort("due_date")}>Due {getSortIcon("due_date")}</th>
                              <th className="sortable" onClick={() => handleSort("status")}>Payment {getSortIcon("status")}</th>
                              <th className="sortable" onClick={() => handleSort("workflow_status")}>Workflow {getSortIcon("workflow_status")}</th>
                              <th className="sortable" onClick={() => handleSort("last_sent_at")}>Delivery {getSortIcon("last_sent_at")}</th>
                              <th>Amount</th>
                              <th className="invoice-actions-cell">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.map((invoice) => {
                              const selected = selectedItems.includes(invoice.invoice_number);
                              return (
                                <tr key={invoice.id || invoice.invoice_number} className={selected ? "selected" : ""}>
                                  <td className="invoice-check-cell">
                                    <input
                                      type="checkbox"
                                      className="table-checkbox"
                                      checked={selected}
                                      onChange={() => toggleItemSelection(invoice.invoice_number)}
                                      aria-label={`Select invoice ${invoice.invoice_number}`}
                                    />
                                  </td>
                                  <td>
                                    <button type="button" className="invoice-number-link" onClick={() => handleViewInvoice(invoice)}>
                                      <span>INV</span> {invoice.invoice_number}
                                    </button>
                                  </td>
                                  <td><span className="invoice-date-value">{formatDate(invoice.invoice_date)}</span></td>
                                  <td>
                                    <div className="invoice-client-cell">
                                      <span className="invoice-client-avatar">{clientInitials(invoice.clients_name)}</span>
                                      <span>{invoice.clients_name || "Unassigned client"}</span>
                                    </div>
                                  </td>
                                  <td><span className="invoice-date-value">{formatDate(invoice.due_date)}</span></td>
                                  <td>
                                    <span className={`invoice-status-pill invoice-status-pill--${getStatusStyle(invoice.status)}`}>
                                      <i /> {invoice.status || "Unknown"}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`invoice-list-workflow invoice-list-workflow--${getWorkflowStyle(invoice.workflow_status)}`}>
                                      {invoice.workflow_status || "Issued"}
                                    </span>
                                  </td>
                                  <td>{renderDeliveryState(invoice)}</td>
                                  <td><strong className="invoice-amount-value">{formatCurrencyDecimals(invoice.invoice_amount, invoice.currency)}</strong></td>
                                  <td className="invoice-actions-cell">{renderRowActions(invoice)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="invoice-mobile-list">
                        {data.map((invoice) => {
                          const selected = selectedItems.includes(invoice.invoice_number);
                          return (
                            <article key={`mobile-${invoice.id || invoice.invoice_number}`} className={`invoice-mobile-card ${selected ? "selected" : ""}`}>
                              <div className="invoice-mobile-card__top">
                                <label className="invoice-mobile-check">
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleItemSelection(invoice.invoice_number)}
                                    aria-label={`Select invoice ${invoice.invoice_number}`}
                                  />
                                  <span />
                                </label>
                                <button type="button" className="invoice-mobile-number" onClick={() => handleViewInvoice(invoice)}>
                                  INV {invoice.invoice_number}
                                </button>
                                <span className={`invoice-status-pill invoice-status-pill--${getStatusStyle(invoice.status)}`}>
                                  <i /> {invoice.status || "Unknown"}
                                </span>
                              </div>

                              <div className="invoice-mobile-client">
                                <span className="invoice-client-avatar">{clientInitials(invoice.clients_name)}</span>
                                <div>
                                  <strong>{invoice.clients_name || "Unassigned client"}</strong>
                                  <small>{formatDate(invoice.invoice_date)} · due {formatDate(invoice.due_date)}</small>
                                </div>
                              </div>

                              <div className="invoice-mobile-card__amount">
                                <span>Invoice amount</span>
                                <strong>{formatCurrencyDecimals(invoice.invoice_amount, invoice.currency)}</strong>
                              </div>

                              <div className="invoice-mobile-card__meta">
                                <div>
                                  <span>Workflow</span>
                                  <strong className={`invoice-list-workflow invoice-list-workflow--${getWorkflowStyle(invoice.workflow_status)}`}>
                                    {invoice.workflow_status || "Issued"}
                                  </strong>
                                </div>
                                <div>
                                  <span>Delivery</span>
                                  {renderDeliveryState(invoice)}
                                </div>
                              </div>

                              {renderRowActions(invoice, true)}
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
                          aria-label="Previous page"
                        >
                          <i className="fas fa-chevron-left" />
                          <span>Previous</span>
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
                              aria-current={currentPage === page ? "page" : undefined}
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
                          aria-label="Next page"
                        >
                          <span>Next</span>
                          <i className="fas fa-chevron-right" />
                        </button>
                      </div>
                    </div>
                  )}

                  {data.length === 0 && (
                    <div className="invoice-overview-empty">
                      <EmptyTable
                        icon="fas fa-file-invoice"
                        message="No invoices found matching your criteria"
                        link="/invoice/create"
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
                  page="invoice"
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

export default InvoiceOverview;
