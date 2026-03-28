import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import 'aos/dist/aos.css';
import useThemeStore from "../../stores/useThemeStore";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import TableLoaderComponent from "../../components/TableLoaderComponent";
import ChartSearchableSelect from "../../components/ChartSearchableSelect";
import EmptyTable from "../../components/EmptyTable";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import ErrorModal from "../../components/modals/ErrorModal";
import useRateStore from "../../stores/useRateStore"; // Updated Store
import { formatCurrencyDecimals } from "../../utils/helper";

const RateOverview = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  // Consume the Rate Store
  const {
    data, loading, error, total, currentPage, itemsPerPage, sortBy,
    sortOrder, searchQuery, selectedItems, fetchData, setCurrentPage,
    setItemsPerPage, setSearchQuery, setSorting, toggleItemSelection,
    clearSelection, deleteSelectedItems, exportToExcel, getTotalPages
  } = useRateStore();

  // Local UI states for modals and actions
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Rates", to: "/rate/home", active: false } // Updated link
  ];

  // Options for Bulk Actions dropdown
  const actionOptions = [
    { id: "", label: "Select Action" },
    { id: "delete", label: "Delete" }
  ];

  useEffect(() => {
    document.title = "Smartbooks | Rate Overview";
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
    // Rate data uses 'id' as primary key
    const currentPageIds = data.map(item => item.id);
    const allSelected = currentPageIds.every(id => selectedItems.includes(id));

    if (allSelected) {
      const newSelection = selectedItems.filter(id => !currentPageIds.includes(id));
      useRateStore.setState({ selectedItems: newSelection });
    } else {
      const newSelection = [...new Set([...selectedItems, ...currentPageIds])];
      useRateStore.setState({ selectedItems: newSelection });
    }
  };

  const handleActionChange = (actionId) => {
    setSelectedAction(actionId);
    if (actionId === "delete") {
      setShowDeleteModal(true);
    }
  };

  const handleDelete = async () => {
    await deleteSelectedItems();
    setShowDeleteModal(false);
    setSelectedAction("");
    clearSelection();
  };

  const handleDeleteRate = async (rateId) => {
    if(rateId !== ""){
      useRateStore.setState({ selectedItems: [rateId] });
      setShowDeleteModal(true);
    }
  }

  const handleCloseErrorModal = () => {
    useRateStore.setState({ error: null });
  };

  const handleEditRate = (rate) => {
    navigate(`/rate/edit/${rate.id}`, { state: { rate } });
  };

  const handleExport = () => {
    exportToExcel();
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

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle='Rate Overview' links={links} />

        <motion.div variants={fadeInUp} initial="hidden" animate="show"
          transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
          className={`invoice-section theme-${theme}`}
        >
          <div className="top-action-wrapper">
            <Link to='/rate/create' className="create-new-invoice-btn">
              <span className="fas fa-circle-plus"></span>
              <span>Create Rate</span>
            </Link>
            {/* <button className="create-new-invoice-btn export-btn" onClick={handleExport} title="Export to Excel">
              <span className="fas fa-file-excel"></span>
              <span>Export</span>
            </button> */}
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
                      placeholder="Search by date, rate, or creator..."
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
                          <th onClick={() => handleSort('created_at')} className="sortable">
                            Date {getSortIcon('created_at')}
                          </th>
                          <th onClick={() => handleSort('ngn_rate')} className="sortable">
                            NGN Rate {getSortIcon('ngn_rate')}
                          </th>
                          <th onClick={() => handleSort('usd_rate')} className="sortable">
                            USD Rate {getSortIcon('usd_rate')}
                          </th>
                          <th onClick={() => handleSort('gbp_rate')} className="sortable">
                            GBP Rate {getSortIcon('gbp_rate')}
                          </th>
                          <th onClick={() => handleSort('eur_rate')} className="sortable">
                            EUR Rate {getSortIcon('eur_rate')}
                          </th>
                          <th onClick={() => handleSort('created_by')} className="sortable">
                            Created By {getSortIcon('created_by')}
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((rate) => (
                          <tr key={rate.id} className={selectedItems.includes(rate.id) ? 'selected' : ''}>
                            <td className="checkbox-cell">
                              <input
                                type="checkbox"
                                className={`table-checkbox fas fa-check ${selectedItems.includes(rate.id) && 'selected-checkbox'}`}
                                checked={selectedItems.includes(rate.id)}
                                onChange={() => toggleItemSelection(rate.id)}
                              />
                            </td>
                            <td className="number-tab">{new Date(rate.created_at).toLocaleDateString('en-GB')}</td>
                            <td>{formatCurrencyDecimals(rate.ngn_rate, rate.ngn_cur)}</td>
                            <td>{formatCurrencyDecimals(rate.usd_rate, rate.usd_cur)}</td>
                            <td>{formatCurrencyDecimals(rate.gbp_rate, rate.gbp_cur)}</td>
                            <td>{formatCurrencyDecimals(rate.eur_rate, rate.eur_cur)}</td>
                            <td>
                              <div className="table-flex-box">
                                <span className="table-customer-text number-tab">{rate.created_by}</span>
                              </div>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button className="btn-edit" title="Edit" onClick={() => handleEditRate(rate)}>
                                  <span className="fas fa-pen"></span> 
                                </button>
                                <button className="btns-delete" title="Delete" onClick={() => handleDeleteRate(rate.id)}>
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
                    icon="fas fa-exchange-alt" 
                    message="No rates found matching your criteria"
                    link="/rate/create"
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

export default RateOverview;