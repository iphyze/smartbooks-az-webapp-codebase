import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import PageNav from "../../components/PageNav";
import TableLoaderComponent from "../../components/TableLoaderComponent";
import ChartSearchableSelect from "../../components/ChartSearchableSelect";
import EmptyTable from "../../components/EmptyTable";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import ErrorModal from "../../components/modals/ErrorModal";
import useThemeStore from "../../stores/useThemeStore";
import useTimesheetStore from "../../stores/useTimesheetStore";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp } from "../../utils/animation";

const TimesheetOverview = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const {
    data, loading, error, total, currentPage, itemsPerPage,
    sortBy, sortOrder, searchQuery, selectedItems,
    fetchData, setCurrentPage, setItemsPerPage, setSearchQuery,
    setSorting, toggleItemSelection, clearSelection,
    deleteSelectedItems, deleteSingleItem, getTotalPages,
  } = useTimesheetStore();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Timesheets", to: "/timesheet/home", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Timesheet Overview";
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, sortBy, sortOrder]);

  const totalPages = getTotalPages();

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query) fetchData();
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') fetchData();
  };

  const handleSearchClick = () => fetchData();

  const handleSort = (key) => {
    const newDirection = sortBy === key && sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setSorting(key, newDirection);
  };

  const handlePageLimitChange = (limit) => setItemsPerPage(limit);

  const handleSelectAll = () => {
    const currentPageIds = data.map((item) => item.id);
    const allSelected = currentPageIds.every((id) => selectedItems.includes(id));

    if (allSelected) {
      const newSelection = selectedItems.filter((id) => !currentPageIds.includes(id));
      useTimesheetStore.setState({ selectedItems: newSelection });
    } else {
      const newSelection = [...new Set([...selectedItems, ...currentPageIds])];
      useTimesheetStore.setState({ selectedItems: newSelection });
    }
  };

  const handleActionChange = (actionId) => {
    setSelectedAction(actionId);
    if (actionId === "delete") {
      setDeleteTarget(null);
      setShowDeleteModal(true);
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteSingleItem(deleteTarget);
    } else {
      await deleteSelectedItems();
    }
    setShowDeleteModal(false);
    setSelectedAction("");
    setDeleteTarget(null);
    clearSelection();
  };

  const handleDeleteRow = (id) => {
    if (id !== "") {
      setDeleteTarget(id);
      setShowDeleteModal(true);
    }
  };

  const handleCloseErrorModal = () => {
    useTimesheetStore.setState({ error: null });
  };

  const getSortIcon = (columnKey) => {
    if (sortBy !== columnKey) {
      return <i className="fas fa-sort active-table-sort-icon" />;
    }
    return sortOrder === 'ASC'
      ? <i className="fas fa-sort-up table-sort-icon" />
      : <i className="fas fa-sort-down table-sort-icon" />;
  };

  const pageLimitOptions = [
    { id: 5,   label: "5"   },
    { id: 10,  label: "10"  },
    { id: 25,  label: "25"  },
    { id: 50,  label: "50"  },
    { id: 100, label: "100" },
    { id: 200, label: "200" },
    { id: 500, label: "500" },
  ];

  const actionOptions = [
    { id: "",       label: "Select Action" },
    { id: "delete", label: "Delete"        },
  ];

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  const formatHours = (hours) => {
    if (!hours && hours !== 0) return '—';
    return `${parseFloat(hours).toFixed(2)} hrs`;
  };

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
            <PageNav pageTitle="Timesheet Overview" links={links} />

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
              className={`invoice-section theme-${theme}`}
            >
              <div className="top-action-wrapper">
                <Link to="/timesheet/create-timesheet" className="create-new-invoice-btn">
                  <span className="fas fa-circle-plus" />
                  <span className="create-new-invoice-btn-text">Log Time</span>
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
                                  className={`table-checkbox fas fa-check ${
                                    selectedItems.length === data.length && data.length > 0
                                      ? 'selected-checkbox'
                                      : ''
                                  }`}
                                />
                              </th>
                              <th onClick={() => handleSort('date')} className="sortable">
                                Date {getSortIcon('date')}
                              </th>
                              <th onClick={() => handleSort('staff_name')} className="sortable">
                                Staff {getSortIcon('staff_name')}
                              </th>
                              <th>Client</th>
                              {/* <th>Project</th> */}
                              {/* <th>Task</th> */}
                              <th>Start</th>
                              <th>Finish</th>
                              <th onClick={() => handleSort('total_hours')} className="sortable">
                                Hours {getSortIcon('total_hours')}
                              </th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.map((row) => (
                              <tr
                                key={row.id}
                                className={selectedItems.includes(row.id) ? 'selected' : ''}
                              >
                                <td className="checkbox-cell">
                                  <input
                                    type="checkbox"
                                    className={`table-checkbox fas fa-check ${
                                      selectedItems.includes(row.id) ? 'selected-checkbox' : ''
                                    }`}
                                    checked={selectedItems.includes(row.id)}
                                    onChange={() => toggleItemSelection(row.id)}
                                  />
                                </td>
                                <td>{formatDate(row.date)}</td>
                                <td className="data-table-bold-text">{row.staff_name}</td>
                                <td>{row.clients_name || '—'}</td>
                                {/* <td>{row.project || '—'}</td> */}
                                {/* <td>
                                  <div className="table-flex-box">
                                    <span className="table-customer-text table-desc-text">
                                      {row.task}
                                    </span>
                                  </div>
                                </td> */}
                                <td>{row.start_time}</td>
                                <td>{row.finish_time}</td>
                                <td className="data-table-bold-text">
                                  {formatHours(row.total_hours)}
                                </td>
                                <td>
                                  <div className="action-buttons">
                                    <button
                                      className="btn-edit"
                                      title="Edit"
                                      onClick={() => navigate(`/timesheet/edit/${row.id}`)}
                                    >
                                      <span className="fas fa-pen" />
                                    </button>
                                    <button
                                      className="btn-view"
                                      title="View"
                                      onClick={() => navigate(`/timesheet/view/${row.id}`)}
                                    >
                                      <span className="fas fa-file" />
                                    </button>
                                    <button
                                      className="btns-delete"
                                      title="Delete"
                                      onClick={() => handleDeleteRow(row.id)}
                                    >
                                      <span className="fas fa-trash" />
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
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                          {Math.min(currentPage * itemsPerPage, total)} of {total} entries
                        </div>
                        <div className="pagination-controls">
                          <button
                            className="pagination-btn"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <span>Previous</span>
                          </button>

                          {getPageNumbers().map((page, index) =>
                            page === '...' ? (
                              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                                ...
                              </span>
                            ) : (
                              <button
                                key={page}
                                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                onClick={() => goToPage(page)}
                              >
                                {page}
                              </button>
                            )
                          )}

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
                        icon="fas fa-clock"
                        message="No timesheet entries found matching your criteria"
                        link="/timesheet/create-timesheet"
                      />
                    )}
                  </>
                )}
              </div>
            </motion.div>

            <AnimatePresence>
              {showDeleteModal && (
                <DeleteConfirmationModal
                  isOpen={showDeleteModal}
                  onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedAction("");
                    setDeleteTarget(null);
                    clearSelection();
                  }}
                  onConfirm={handleDelete}
                  count={deleteTarget ? 1 : selectedItems.length}
                  page="timesheet"
                />
              )}
            </AnimatePresence>

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
      </div>
    </div>
  );
};

export default TimesheetOverview;