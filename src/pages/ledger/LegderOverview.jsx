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
import useLedgerStore from "../../stores/useLedgerStore";

const LedgerOverview = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  // Consume the Ledger Store (Added deleteSingleLedger here)
  const {
    data, loading, error, total, currentPage, itemsPerPage, sortBy,
    sortOrder, searchQuery, selectedItems, fetchData, setCurrentPage,
    setItemsPerPage, setSearchQuery, setSorting, toggleItemSelection,
    clearSelection, deleteSelectedItems, deleteSingleLedger, exportToExcel, getTotalPages
  } = useLedgerStore();

  // Local UI states for modals and actions
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  
  // States to distinguish Single vs Bulk deletes
  const [isSingleDelete, setIsSingleDelete] = useState(false);
  const [singleDeleteLedgerNumber, setSingleDeleteLedgerNumber] = useState("");

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Ledgers", to: "/ledger/home", active: false }
  ];

  // Options for Bulk Actions dropdown
  const actionOptions = [
    { id: "", label: "Select Action" },
    { id: "delete", label: "Delete" }
  ];

  useEffect(() => {
    document.title = "Smartbooks | Ledger Overview";
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
    const newDirection = sortBy === key && sortOrder === 'DESC' ? 'ASC' : 'DESC';
    setSorting(key, newDirection);
  };

  const handlePageLimitChange = (limit) => {
    setItemsPerPage(limit);
  };

  // FIX 1: Update handleSelectAll to populate BOTH selectedItems AND selectedItemsData
  const handleSelectAll = () => {
    const currentPageIds = data.map(item => item.id);
    const allSelected = currentPageIds.every(id => selectedItems.includes(id));

    if (allSelected) {
      const newSelection = selectedItems.filter(id => !currentPageIds.includes(id));
      const newData = { ...useLedgerStore.getState().selectedItemsData };
      currentPageIds.forEach(id => delete newData[id]);
      useLedgerStore.setState({ selectedItems: newSelection, selectedItemsData: newData });
    } else {
      const newSelection = [...new Set([...selectedItems, ...currentPageIds])];
      const newData = { ...useLedgerStore.getState().selectedItemsData };
      data.forEach(item => {
        if (!newData[item.id]) {
          newData[item.id] = item; // Populate the data map so deleteSelectedItems can find the ledger_number
        }
      });
      useLedgerStore.setState({ selectedItems: newSelection, selectedItemsData: newData });
    }
  };

  const handleActionChange = (actionId) => {
    setSelectedAction(actionId);
    setIsSingleDelete(false); // Ensure bulk actions don't trigger single delete
    if (actionId === "delete") {
      setShowDeleteModal(true);
    }
  };

  // FIX 2: Split logic to handle single delete vs bulk delete appropriately
  const handleDelete = async () => {
    if (isSingleDelete) {
      const success = await deleteSingleLedger(singleDeleteLedgerNumber);
      if (success) {
        fetchData();
      }
      setIsSingleDelete(false);
      setSingleDeleteLedgerNumber("");
    } else {
      await deleteSelectedItems();
    }
    
    setShowDeleteModal(false);
    setSelectedAction("");
    clearSelection();
  };

  // FIX 3: Setup direct button to trigger single delete flag instead of faking a bulk selection
  const handleDeleteLedger = (ledgerNumber) => {
    if (ledgerNumber !== "") {
      setIsSingleDelete(true);
      setSingleDeleteLedgerNumber(ledgerNumber);
      setShowDeleteModal(true);
    }
  };

  const handleCloseErrorModal = () => {
    useLedgerStore.setState({ error: null });
  };

  const handleViewLedger = (ledger) => {
    navigate(`/ledger/view/${ledger.ledger_number}`, { state: { ledger } });
  };

  const handleEditLedger = (ledger) => {
    navigate(`/ledger/edit/${ledger.ledger_number}`, { state: { ledger } });
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
        <PageNav pageTitle='Ledgers' links={links} />

        <motion.div variants={fadeInUp} initial="hidden" animate="show"
          transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
          className={`invoice-section theme-${theme}`}
        >
          <div className="top-action-wrapper">
            <Link to='/ledger/create' className="create-new-invoice-btn">
              <span className="fas fa-circle-plus"></span>
              <span>Create Ledger</span>
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
                      placeholder="Search by ledger name, number, or class..."
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
                          <th onClick={() => handleSort('ledger_number')} className="sortable">
                            Ledger Number {getSortIcon('ledger_number')}
                          </th>
                          <th onClick={() => handleSort('ledger_name')} className="sortable">
                            Ledger Name {getSortIcon('ledger_name')}
                          </th>
                          <th onClick={() => handleSort('ledger_class')} className="sortable">
                            Ledger Class {getSortIcon('ledger_class')}
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((ledger) => (
                          <tr key={ledger.id} className={selectedItems.includes(ledger.id) ? 'selected' : ''}>
                            <td className="checkbox-cell">
                              <input
                                type="checkbox"
                                className={`table-checkbox fas fa-check ${selectedItems.includes(ledger.id) && 'selected-checkbox'}`}
                                checked={selectedItems.includes(ledger.id)}
                                onChange={() => toggleItemSelection(ledger.id)}
                              />
                            </td>
                            <td className="number-tab">{ledger.ledger_number}</td>
                            <td>
                              <div className="table-flex-box">
                                <span className="table-customer-text">{ledger.ledger_name}</span>
                              </div>
                            </td>
                            <td>{ledger.ledger_class}</td>
                            <td>
                              <div className="action-buttons">
                                <button className="btn-view" title="View" onClick={() => handleViewLedger(ledger)}>
                                  <span className="fas fa-file"></span> 
                                </button>
                                <button className="btn-edit" title="Edit" onClick={() => handleEditLedger(ledger)}>
                                  <span className="fas fa-pen"></span> 
                                </button>
                                <button className="btns-delete" title="Delete" onClick={() => handleDeleteLedger(ledger.ledger_number)}>
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
                    icon="fas fa-book" 
                    message="No ledgers found matching your criteria"
                    link="/ledger/create"
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
                setIsSingleDelete(false);
                setSingleDeleteLedgerNumber("");
              }}
              onConfirm={handleDelete}
              // Pass count dynamically: if single delete, show '1'. If bulk, show array length.
              count={isSingleDelete ? 1 : selectedItems.length}
              page="ledger"
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

export default LedgerOverview;