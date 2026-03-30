import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import 'aos/dist/aos.css';
import useThemeStore from "../../stores/useThemeStore";
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, fadeInUp, fadeInDown } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import TableLoaderComponent from "../../components/TableLoaderComponent";
import ChartSearchableSelect from "../../components/ChartSearchableSelect";
import EmptyTable from "../../components/EmptyTable";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import ErrorModal from "../../components/modals/ErrorModal";
import UpdateModal from "../../components/modals/UpdateModal"; // Import UpdateModal
import useInvoiceStore from "../../stores/useInvoiceStore"; // Updated Store
import useAuthStore from "../../stores/useAuthStore";
import { formatCurrencyDecimals } from "../../utils/helper";

const InvoiceOverview = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  // Consume the Invoice Store
  const {
    data, loading, error, total, currentPage, itemsPerPage, sortBy,
    sortOrder, searchQuery, selectedItems, fetchData, setCurrentPage,
    setItemsPerPage, setSearchQuery, setSorting, toggleItemSelection,
    clearSelection, deleteSelectedItems, exportToExcel, getTotalPages,
    updateInvoiceStatus // New action for status update
  } = useInvoiceStore();

  // Local UI states for modals and actions
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Invoices", to: "/invoice/home", active: false }
  ];

  // Options for the Status Update Modal
  const statusOptions = [
    { id: "Paid", label: "Paid" },
    { id: "Pending", label: "Pending" },
    { id: "Overdue", label: "Overdue" },
    { id: "Cancelled", label: "Cancelled" }
  ];

  // Options for Bulk Actions dropdown
  const actionOptions = [
    { id: "", label: "Select Action" },
    { id: "update-status", label: "Update Status" },
    { id: "delete", label: "Delete" }
  ];

  useEffect(() => {
    document.title = "Smartbooks | Invoice Overview";
  }, []);

  // Fetch data whenever relevant store states change
  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, sortBy, sortOrder]); 

  const totalPages = getTotalPages();

  // Handlers
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query) fetchData(); 
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') fetchData();
  };

  const handleSearchClick = () => {
    fetchData();
  };

  const handleSort = (key) => {
    const newDirection = sortBy === key && sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setSorting(key, newDirection);
  };

  const handlePageLimitChange = (limit) => {
    setItemsPerPage(limit);
  };

  const handleSelectAll = () => {
    // Invoice data uses 'id' as primary key based on sample
    const currentPageIds = data.map(item => item.invoice_number);
    const allSelected = currentPageIds.every(invoice_number => selectedItems.includes(invoice_number));

    if (allSelected) {
      const newSelection = selectedItems.filter(invoice_number => !currentPageIds.includes(invoice_number));
      useInvoiceStore.setState({ selectedItems: newSelection });
    } else {
      const newSelection = [...new Set([...selectedItems, ...currentPageIds])];
      useInvoiceStore.setState({ selectedItems: newSelection });
    }
  };

  const handleActionChange = (actionId) => {
    setSelectedAction(actionId);
    if (actionId === "delete") {
      setShowDeleteModal(true);
    } else if (actionId === "update-status") {
      setShowUpdateModal(true);
    }
  };

  const handleDelete = async () => {
    await deleteSelectedItems();
    setShowDeleteModal(false);
    setSelectedAction("");
    clearSelection();
  };

  const handleUpdateStatus = async (status) => {
    await updateInvoiceStatus(status);
    setShowUpdateModal(false);
    setSelectedAction("");
    clearSelection();
  };

  const handleDeleteInvoice = async (invoice_id) => {
    if(invoice_id !== ""){
      useInvoiceStore.setState({ selectedItems: [invoice_id] });
      setShowDeleteModal(true);
    }
  }

  const handleCloseErrorModal = () => {
    useInvoiceStore.setState({ error: null });
  };

  const handleViewInvoice = (invoice) => {
    navigate(`/invoice/view/${invoice.invoice_number}`, { state: { invoice } });
  };

  const handleEditInvoice = (invoice) => {
    navigate(`/invoice/edit/${invoice.invoice_number}`, { state: { invoice } });
  };

  const getSortIcon = (columnKey) => {
    if (sortBy !== columnKey) {
      return <i className="fas fa-sort active-table-sort-icon"></i>;
    }
    return sortOrder === 'ASC'
      ? <i className="fas fa-sort-up table-sort-icon"></i>
      : <i className="fas fa-sort-down table-sort-icon"></i>;
  };

  const pageLimitOptions = [
    { id: 5, label: "5" },
    { id: 10, label: "10" },
    { id: 25, label: "25" },
    { id: 50, label: "50" },
    { id: 100, label: "100" },
    { id: 200, label: "200" },
    { id: 500, label: "500" },
  ];

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    const pages = [];
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Helper for status styles
  const getStatusStyle = (type) => {
      switch (type) {
          case 'Paid': return 'success';
          case 'Pending': return 'warning';
          case 'Partially Paid': return 'warning';
          case 'Overdue': return 'danger';
          case 'Cancelled': return 'danger';
          default: return null;
      }
  };

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle='Invoice Overview' links={links} />

        <motion.div variants={fadeInUp} initial="hidden" animate="show"
          transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
          className={`invoice-section theme-${theme}`}
        >
          <div className="top-action-wrapper">
            <Link to='/invoice/create' className="create-new-invoice-btn">
              <span className="fas fa-circle-plus"></span>
              <span>Create Invoice</span>
            </Link>
          </div>

          <div className="main-table-box">
            {loading ? (
              <TableLoaderComponent />
            ) : (
              <>
                <div className="table-controls">
                  <div className="table-search-box">
                    <input 
                      type="text" 
                      placeholder="Search..."
                      value={searchQuery} 
                      onChange={handleSearchChange} 
                      onKeyDown={handleSearchSubmit}
                      className="table-search-input"
                    />
                    <span 
                      className="fas fa-search table-search-icon" 
                      onClick={handleSearchClick} 
                      style={{ cursor: 'pointer' }}
                    />
                  </div>

                  <div className="filters-box">
                    <div className="filter-wrapper">
                      <label className="filter-wrapper-label">Page limit</label>
                      <ChartSearchableSelect
                        options={pageLimitOptions}
                        value={itemsPerPage}
                        onChange={handlePageLimitChange}
                        className="box-filter-limit"
                      />
                    </div>
                    
                    {selectedItems.length > 0 && (
                      <div className="filter-wrapper bulk-actions">
                        <label className="filter-wrapper-label">Select Action</label>
                        <ChartSearchableSelect
                          options={actionOptions}
                          value={selectedAction}
                          onChange={handleActionChange}
                          className="box-filter-action"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="table-box">
                  <div className="table-wrapper">
                    <table className="data-table invoice-table">
                      <thead>
                        <tr>
                          <th className="checkbox-cell">
                            <input
                              type="checkbox"
                              checked={data.length > 0 && selectedItems.length === data.length}
                              onChange={handleSelectAll}
                              className={`table-checkbox fas fa-check 
                            ${selectedItems.length === data.length && data.length > 0 && 'selected-checkbox'}`}
                            />
                          </th>
                          <th onClick={() => handleSort('invoice_number')} className="sortable">
                            Inv # {getSortIcon('invoice_number')}
                          </th>
                          <th onClick={() => handleSort('invoice_date')} className="sortable">
                            Date {getSortIcon('invoice_date')}
                          </th>
                          <th>Client</th>
                          <th onClick={() => handleSort('due_date')} className="sortable">
                            Due Date {getSortIcon('due_date')}
                          </th>
                          <th onClick={() => handleSort('status')} className="sortable">
                            Status {getSortIcon('status')}
                          </th>
                          <th>Amt</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((invoice) => (
                          <tr key={invoice.id} className={selectedItems.includes(invoice.invoice_number) ? 'selected' : ''}>
                            <td className="checkbox-cell">
                              <input
                                type="checkbox"
                                className={`table-checkbox fas fa-check ${selectedItems.includes(invoice.invoice_number) && 'selected-checkbox'}`}
                                checked={selectedItems.includes(invoice.invoice_number)}
                                onChange={() => toggleItemSelection(invoice.invoice_number)}
                              />
                            </td>
                            <td className="number-tab">{invoice.invoice_number}</td>
                            <td>{new Date(invoice.invoice_date).toLocaleDateString('en-GB')}</td>
                            <td>
                              <div className="table-flex-box">
                                <span className="table-customer-text number-tab">{invoice.clients_name}</span>
                              </div>
                            </td>
                            <td>{new Date(invoice.due_date).toLocaleDateString('en-GB')}</td>
                            <td>
                              <span className={`badge badge-${getStatusStyle(invoice.status)}`}>
                                <span className={`badge-circle badge-circle-${getStatusStyle(invoice.status)}`}/> {invoice.status}
                              </span>
                            </td>
                            <td className="data-table-bold-text">{formatCurrencyDecimals(invoice.invoice_amount, invoice.currency)}</td>
                            <td>
                              <div className="action-buttons">
                                <button className="btn-edit" title="Edit" onClick={() => handleEditInvoice(invoice)}>
                                  <span className="fas fa-pen"></span> 
                                </button>
                                <button className="btn-view" title="View" onClick={() => handleViewInvoice(invoice)}>
                                  <span className="fas fa-file"></span> 
                                </button>
                                <button className="btns-delete" title="Delete" onClick={() => handleDeleteInvoice(invoice.invoice_number)}>
                                  <span className="fas fa-trash"></span> 
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination-container">
                    <div className="pagination-info">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} entries
                    </div>
                    <div className="pagination-controls">
                      <button 
                        className="pagination-btn" 
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <span>Previous</span>
                      </button>
                      
                      {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                        ) : (
                          <button
                            key={page}
                            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => goToPage(page)}
                          >
                            {page}
                          </button>
                        )
                      ))}
                      
                      <button 
                        className="pagination-btn" 
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <span>Next</span>
                      </button>
                    </div>
                  </div>
                )}

                {data.length === 0 && (
                  <EmptyTable
                    icon="fas fa-file-invoice" 
                    message="No invoices found matching your criteria"
                    link="/invoice/create"
                  />
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Delete Confirmation Modal */}
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

        {/* Update Status Modal */}
        <AnimatePresence>
          {showUpdateModal && (
            <UpdateModal
              isOpen={showUpdateModal}
              onClose={() => {
                setShowUpdateModal(false);
                setSelectedAction("");
                clearSelection();
              }}
              onConfirm={handleUpdateStatus}
              count={selectedItems.length}
              statusOptions={statusOptions}
            />
          )}
        </AnimatePresence>

        {/* Error Modal Integration */}
        <AnimatePresence>
          {error && (
            <ErrorModal
              isOpen={!!error}
              onClose={handleCloseErrorModal}
              onRetry={fetchData}
              message={error}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InvoiceOverview;