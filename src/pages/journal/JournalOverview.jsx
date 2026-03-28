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
import ErrorModal from "../../components/modals/ErrorModal"; // 1. Import the new modal
import useJournalStore from "../../stores/useJournalStore";
import useAuthStore from "../../stores/useAuthStore";
import { formatCurrencyDecimals } from "../../utils/helper";

const JournalOverview = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  // 2. Destructure 'error' from the store
  const {
    data, loading, error, total, currentPage, itemsPerPage, sortBy,
    sortOrder, searchQuery, selectedItems, fetchData, setCurrentPage,
    setItemsPerPage, setSearchQuery, setSorting, toggleItemSelection,
    clearSelection, deleteSelectedItems, exportToExcel, getTotalPages
  } = useJournalStore();

  // Local UI states for modals and actions
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Journal", to: "/journal/home", active: false }
  ];

  useEffect(() => {
    document.title = "Smartbooks | Journal Overview";
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
    const currentPageIds = data.map(item => item.journal_id);
    const allSelected = currentPageIds.every(journal_id => selectedItems.includes(journal_id));

    if (allSelected) {
      const newSelection = selectedItems.filter(journal_id => !currentPageIds.includes(journal_id));
      useJournalStore.setState({ selectedItems: newSelection });
    } else {
      const newSelection = [...new Set([...selectedItems, ...currentPageIds])];
      useJournalStore.setState({ selectedItems: newSelection });
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

  const handleDeleteJournal = async (journal_id) => {
    if(journal_id !== ""){
      useJournalStore.setState({ selectedItems: [journal_id] });
      setShowDeleteModal(true);
    }
  }

  // 3. Handler to close Error Modal
  const handleCloseErrorModal = () => {
    useJournalStore.setState({ error: null });
  };

  const handleViewJournal = (journal) => {
    navigate(`/journal/view/${journal.journal_id}`, { state: { journal } });
  };

  const handleEditJournal = (journal) => {
    navigate(`/journal/edit/${journal.journal_id}`, { state: { journal } });
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

  const actionOptions = [
    { id: "", label: "Select Action" },
    { id: "delete", label: "Delete" }
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


  

  const voucherType = (type) => {
    switch (type){
      case 'Sales': return 'success';
      case 'Payment': return 'danger';
      case 'Receipt': return 'success';
      case 'Expenses': return 'warning';
      default: return null;
    }
  };

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle='Journal Overview' links={links} />

        <motion.div variants={fadeInUp} initial="hidden" animate="show"
          transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
          className={`invoice-section theme-${theme}`}
        >
          <div className="top-action-wrapper">
            <Link to='/journal/create' className="create-new-invoice-btn">
              <span className="fas fa-circle-plus"></span>
              <span className="create-new-invoice-btn-text">Create Journal</span>
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
                          <th onClick={() => handleSort('journal_id')} className="sortable">
                            ID {getSortIcon('journal_id')}
                          </th>
                          <th onClick={() => handleSort('journal_date')} className="sortable">
                            Date {getSortIcon('journal_date')}
                          </th>
                          <th>Description</th>
                          <th onClick={() => handleSort('journal_type')} className="sortable">
                            Type {getSortIcon('journal_type')}
                          </th>
                          <th>Amt</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((journal, index) => (
                          <tr key={journal.journal_id} className={selectedItems.includes(journal.journal_id) ? 'selected' : ''}>
                            <td className="checkbox-cell">
                              <input
                                type="checkbox"
                                className={`table-checkbox fas fa-check ${selectedItems.includes(journal.journal_id) && 'selected-checkbox'}`}
                                checked={selectedItems.includes(journal.journal_id)}
                                onChange={() => toggleItemSelection(journal.journal_id)}
                              />
                            </td>
                            <td className="number-tab">{journal.journal_id}</td>
                            <td>{new Date(journal.journal_date).toLocaleDateString('en-GB')}</td>
                            <td>
                              <div className="table-flex-box">
                                <span className="table-customer-text table-desc-text">{journal.journal_description}</span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge badge-${voucherType(journal.journal_type)}`}>
                                <span className={`badge-circle badge-circle-${voucherType(journal.journal_type)}`}/> {journal.journal_type}
                              </span>
                            </td>
                            <td className="data-table-bold-text">{formatCurrencyDecimals(journal.debit, journal.journal_currency)}</td>
                            <td>
                              <div className="action-buttons">
                                <button className="btn-edit" title="Edit" onClick={() => handleEditJournal(journal)}>
                                  <span className="fas fa-pen"></span> 
                                </button>
                                <button className="btn-view" title="View" onClick={() => handleViewJournal(journal)}>
                                  <span className="fas fa-file"></span> 
                                </button>
                                <button className="btns-delete" title="Delete" onClick={() => handleDeleteJournal(journal.journal_id)}>
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
                    icon="fas fa-book-open" 
                    message="No journals found matching your criteria"
                    link="/journal/create"
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

        {/* 4. Error Modal Integration */}
        <AnimatePresence>
          {error && (
            <ErrorModal
              isOpen={!!error}
              onClose={handleCloseErrorModal}
              onRetry={fetchData} // Pass fetchData directly as the retry function
              message={error}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JournalOverview;