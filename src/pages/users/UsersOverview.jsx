import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useThemeStore from "../../stores/useThemeStore";
import useAuthStore from "../../stores/useAuthStore";
import useUsersStore from "../../stores/useUsersStore";
import PageNav from "../../components/PageNav";
import TableLoaderComponent from "../../components/TableLoaderComponent";
import ChartSearchableSelect from "../../components/ChartSearchableSelect";
import EmptyTable from "../../components/EmptyTable";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import ErrorModal from "../../components/modals/ErrorModal";

const ROLE_BADGE = {
  Admin: { color: "#7c3aed", bg: "rgba(124,58,237,0.12)" },
  Controller: { color: "#0891b2", bg: "rgba(8,145,178,0.12)" },
  Timesheet: { color: "#059669", bg: "rgba(5,150,105,0.12)" },
};

const UsersOverview = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();

  const {
    data, loading, error, total, currentPage, itemsPerPage, sortBy,
    sortOrder, searchQuery, selectedItems, fetchData, setCurrentPage,
    setItemsPerPage, setSearchQuery, setSorting, toggleItemSelection,
    clearSelection, deleteSelectedItems, getTotalPages,
  } = useUsersStore();

  // Local search input — only committed to store on Enter or icon click
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");

  const isAdmin = currentUser?.integrity === "Admin";

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Users", to: "/users/home", active: false },
  ];

  const actionOptions = [
    { id: "", label: "Select Action" },
    { id: "delete", label: "Delete" },
  ];

  const pageLimitOptions = [
    { id: 5, label: "5" }, { id: 10, label: "10" }, { id: 25, label: "25" },
    { id: 50, label: "50" }, { id: 100, label: "100" },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Users";
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, sortBy, sortOrder]);

  const totalPages = getTotalPages();

  /* ── Search — only fires on Enter or icon click ── */
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchInput(query);
    if (!query) {
      setSearchQuery('');
      fetchData();
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      setSearchQuery(searchInput);
      fetchData();
    }
  };

  const handleSearchClick = () => {
    setSearchQuery(searchInput);
    fetchData();
  };

  /* ── Sort ── */
  const handleSort = (key) => {
    const newDir = sortBy === key && sortOrder === "ASC" ? "DESC" : "ASC";
    setSorting(key, newDir);
  };

  /* ── Select all — mirrors InvoiceOverview exactly ── */
  const handleSelectAll = () => {
    const currentPageIds = data.map(u => u.id);
    const allSelected = currentPageIds.every(id => selectedItems.includes(id));

    if (allSelected) {
      const newSelection = selectedItems.filter(id => !currentPageIds.includes(id));
      useUsersStore.setState({ selectedItems: newSelection });
    } else {
      const newSelection = [...new Set([...selectedItems, ...currentPageIds])];
      useUsersStore.setState({ selectedItems: newSelection });
    }
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
  };

  const handleDeleteUser = (userId) => {
    useUsersStore.setState({ selectedItems: [userId] });
    setShowDeleteModal(true);
  };

  const getSortIcon = (key) => {
    if (sortBy !== key) return <i className="fas fa-sort active-table-sort-icon" />;
    return sortOrder === "ASC"
      ? <i className="fas fa-sort-up table-sort-icon" />
      : <i className="fas fa-sort-down table-sort-icon" />;
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const max = 5;
    const pages = [];
    if (totalPages <= max) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(1, currentPage - Math.floor(max / 2));
      const end = Math.min(totalPages, start + max - 1);
      if (start > 1) { pages.push(1); if (start > 2) pages.push("..."); }
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages) { if (end < totalPages - 1) pages.push("..."); pages.push(totalPages); }
    }
    return pages;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "—";

  const getRoleBadge = (role) => {
    const style = ROLE_BADGE[role] || { color: "#6b7280", bg: "rgba(107,114,128,0.12)" };
    return (
      <span style={{
        display: "inline-block", padding: "2px 10px", borderRadius: 20,
        fontSize: 11, fontFamily: "Montserrat-SemiBold",
        color: style.color, background: style.bg,
      }}>
        {role || "User"}
      </span>
    );
  };

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
            <PageNav pageTitle="Users Overview" links={links} />

            <motion.div variants={fadeInUp} initial="hidden" animate="show"
              transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
              className={`invoice-section theme-${theme}`}
            >
              {isAdmin && (
                <div className="top-action-wrapper">
                  <Link to="/users/create-user" className="create-new-invoice-btn">
                    <span className="fas fa-circle-plus" />
                    <span>Add User</span>
                  </Link>
                </div>
              )}

              <div className="main-table-box">
                {loading ? (
                  <TableLoaderComponent />
                ) : (
                  <>
                    <div className="table-controls">
                      <div className="table-search-box">
                        <input
                          type="text"
                          placeholder="Search users by name, email..."
                          value={searchInput}
                          onChange={handleSearchChange}
                          onKeyDown={handleSearchSubmit}
                          className="table-search-input"
                        />
                        <span
                          className="fas fa-search table-search-icon"
                          onClick={handleSearchClick}
                          style={{ cursor: "pointer" }}
                        />
                      </div>

                      <div className="filters-box">
                        <div className="filter-wrapper">
                          <label className="filter-wrapper-label">Page limit</label>
                          <ChartSearchableSelect
                            options={pageLimitOptions}
                            value={itemsPerPage}
                            onChange={setItemsPerPage}
                            className="box-filter-limit"
                          />
                        </div>

                        {isAdmin && selectedItems.length > 0 && (
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
                              {isAdmin && (
                                <th className="checkbox-cell">
                                  <input
                                    type="checkbox"
                                    checked={data.length > 0 && data.every(u => selectedItems.includes(u.id))}
                                    onChange={handleSelectAll}
                                    className={`table-checkbox fas fa-check ${data.length > 0 && data.every(u => selectedItems.includes(u.id)) ? "selected-checkbox" : ""}`}
                                  />
                                </th>
                              )}
                              <th onClick={() => handleSort("id")} className="sortable">
                                ID {getSortIcon("id")}
                              </th>
                              <th onClick={() => handleSort("fname")} className="sortable">
                                Name {getSortIcon("fname")}
                              </th>
                              <th onClick={() => handleSort("email")} className="sortable">
                                Email {getSortIcon("email")}
                              </th>
                              <th onClick={() => handleSort("integrity")} className="sortable">
                                Role {getSortIcon("integrity")}
                              </th>
                              <th onClick={() => handleSort("created_at")} className="sortable">
                                Created {getSortIcon("created_at")}
                              </th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.map((u, index) => (
                              <tr key={u.id} className={selectedItems.includes(u.id) ? "selected" : ""}>
                                {isAdmin && (
                                  <td className="checkbox-cell">
                                    <input
                                      type="checkbox"
                                      className={`table-checkbox fas fa-check ${selectedItems.includes(u.id) ? "selected-checkbox" : ""}`}
                                      checked={selectedItems.includes(u.id)}
                                      onChange={() => toggleItemSelection(u.id)}
                                    />
                                  </td>
                                )}
                                <td className="number-tab">{index + 1}</td>
                                <td>
                                  <div className="table-flex-box">
                                    <span className="table-customer-text">
                                      {u.fname} {u.lname}
                                    </span>
                                  </div>
                                </td>
                                <td>{u.email}</td>
                                <td>{getRoleBadge(u.integrity)}</td>
                                <td className="number-tab">{formatDate(u.created_at)}</td>
                                <td>
                                  <div className="action-buttons">
                                    <button
                                      className="btn-view"
                                      title="View"
                                      onClick={() => navigate(`/users/view/${u.id}`, { state: { user: u } })}
                                    >
                                      <span className="fas fa-file" />
                                    </button>
                                    {isAdmin && (
                                      <>
                                        <button
                                          className="btn-edit"
                                          title="Edit"
                                          onClick={() => navigate(`/users/edit/${u.id}`, { state: { user: u } })}
                                        >
                                          <span className="fas fa-pen" />
                                        </button>
                                        <button
                                          className="btns-delete"
                                          title="Delete"
                                          onClick={() => handleDeleteUser(u.id)}
                                        >
                                          <span className="fas fa-trash" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {totalPages > 1 && (
                      <div className="pagination-container">
                        <div className="pagination-info">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                          {Math.min(currentPage * itemsPerPage, total)} of {total} entries
                        </div>
                        <div className="pagination-controls">
                          <button className="pagination-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                            <span>Previous</span>
                          </button>
                          {getPageNumbers().map((page, i) =>
                            page === "..." ? (
                              <span key={`e-${i}`} className="pagination-ellipsis">...</span>
                            ) : (
                              <button
                                key={page}
                                className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                                onClick={() => goToPage(page)}
                              >
                                {page}
                              </button>
                            )
                          )}
                          <button className="pagination-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                            <span>Next</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {data.length === 0 && (
                      <EmptyTable
                        icon="fas fa-users-gear"
                        message="No user records found matching your criteria"
                        link={isAdmin ? "/users/create-user" : undefined}
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
                  onClose={() => { setShowDeleteModal(false); setSelectedAction(""); clearSelection(); }}
                  onConfirm={handleDelete}
                  count={selectedItems.length}
                  page="user"
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <ErrorModal
                  isOpen={!!error}
                  onClose={() => useUsersStore.setState({ error: null })}
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

export default UsersOverview;