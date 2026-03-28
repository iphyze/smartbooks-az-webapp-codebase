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
import { customers } from "./data/customerData";
import EmptyTable from "../../components/EmptyTable";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import UpdateModal from "../../components/modals/UpdateModal";
import CustomerViewModal from "../../components/modals/CustomerViewModal";

const CustomerOverview = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  
  // Initialize state with imported data
  const [customerDataState, setCustomerDataState] = useState(customers);
  
  // Add navigate function
  const navigate = useNavigate();

  const links = [
    { label: "Home", to: "/dashboard", active: true },
    { label: "Customers", to: "/", active: false }
  ]

  useEffect(() => {
    document.title = "Digital Invoice Naija | Customers";
  }, []);

  // Status options for filter
  const statusOptions = [
    { id: "all", label: "All Status" },
    { id: "Active", label: "Active" },
    { id: "Inactive", label: "Inactive" }
  ];

  // Status options for update action
  const updateStatusOptions = [
    { id: "Active", label: "Active" },
    { id: "Inactive", label: "Inactive" }
  ];

  // Action options for bulk actions
  const actionOptions = [
    { id: "", label: "Select Action" },
    { id: "update", label: "Update Status" },
    { id: "delete", label: "Delete" }
  ];

  // Page limit options
  const pageLimitOptions = [
    { id: 5, label: "5" },
    { id: 10, label: "10" },
    { id: 25, label: "25" },
    { id: 50, label: "50" },
    { id: 100, label: "100" },
    { id: 250, label: "250" },
    { id: 500, label: "500" }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortConfig]);

  // Handle row selection
  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedData.map(customer => customer.id));
    }
  };

  // Get status badge style
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active':
        return 'badge-success';
      case 'Inactive':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Handle delete action
  const handleDelete = () => {
    // In a real app, this would make an API call
    setCustomerDataState(prevData => prevData.filter(customer => !selectedRows.includes(customer.id)));
    setSelectedRows([]);
    setShowDeleteModal(false);
    setSelectedAction("");
  };

  // Handle update status action
  const handleUpdateStatus = (newStatus) => {
    // In a real app, this would make an API call
    setCustomerDataState(prevData => 
      prevData.map(customer => 
        selectedRows.includes(customer.id) 
          ? { ...customer, status: newStatus }
          : customer
      )
    );
    setSelectedRows([]);
    setShowUpdateModal(false);
    setSelectedAction("");
  };

  // Handle action selection change
  const handleActionChange = (actionId) => {
    setSelectedAction(actionId);
    
    if (actionId === "delete") {
      setShowDeleteModal(true);
    } else if (actionId === "update") {
      setShowUpdateModal(true);
    }
  };

  // Handle page limit change
  const handlePageLimitChange = (limit) => {
    setPageLimit(limit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  // Handle view customer
  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  // Handle edit customer
  const handleEditCustomer = (customer) => {
    navigate(`/customer/edit/${customer.id}`, { state: { customer } });
  };

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = [...customerDataState];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.tin.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [customerDataState, searchTerm, statusFilter, sortConfig]);

  // Calculate total pages after filteredData is defined
  const totalPages = Math.ceil(filteredData.length / pageLimit);

  // Get paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageLimit;
    const endIndex = startIndex + pageLimit;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageLimit]);

  // Handle page navigation
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Get page numbers to display
  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    const pages = [];
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Get sort icon
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <i className="fas fa-sort active-table-sort-icon"></i>;
    }
    return sortConfig.direction === 'ascending'
      ? <i className="fas fa-sort-up table-sort-icon"></i>
      : <i className="fas fa-sort-down table-sort-icon"></i>;
  };

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle='Customers' links={links} />

        <motion.div variants={fadeInUp} initial="hidden" animate="show"
          transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
          className={`invoice-section theme-${theme}`}
        >

          <div className="top-action-wrapper">
            <Link to='/customer/create-customer' className="create-new-invoice-btn">
              <span className="fas fa-circle-plus"></span>
              <span>Create Customer</span>
            </Link>

            {filteredData.length > 0 &&
            (
            <button className="create-new-invoice-btn export-btn">
                <span className="fas fa-file-excel"></span>
                <span>Export Excel</span>
              </button>
            )
            }
          </div>

          <div className="main-table-box">
            {isLoading ? (
              <TableLoaderComponent />
            ) : (
              <>
                <div className="table-controls">
                  <div className="table-search-box">
                    <input type="text" placeholder="Search..."
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="table-search-input"
                    />
                    <span className="fas fa-search table-search-icon"></span>
                  </div>

                  <div className="filters-box">
                    <div className="filter-wrapper">
                      <label className="filter-wrapper-label">Filter by status</label>
                      <ChartSearchableSelect
                        options={statusOptions}
                        value={statusFilter}
                        onChange={(val) => setStatusFilter(val)}
                        className="box-filter"
                      />
                    </div>

                    <div className="filter-wrapper">
                      <label className="filter-wrapper-label">Page limit</label>
                      <ChartSearchableSelect
                        options={pageLimitOptions}
                        value={pageLimit}
                        onChange={handlePageLimitChange}
                        className="box-filter-limit"
                      />
                    </div>
                    
                    {selectedRows.length > 0 && (
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination-container">
                    <div className="pagination-controls">
                      <button 
                        className="pagination-btn"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="fas fa-chevron-left"></i>
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
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                    <div className="pagination-info">
                      Showing {((currentPage - 1) * pageLimit) + 1} to {Math.min(currentPage * pageLimit, filteredData.length)} of {filteredData.length} entries
                    </div>
                  </div>
                )}

                <div className="table-box">
                  <div className="table-wrapper">
                    <table className="data-table invoice-table">
                      <thead>
                        <tr>
                          <th className="checkbox-cell">
                            <input
                              type="checkbox"
                              checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                              onChange={handleSelectAll}
                              className={`table-checkbox fas fa-check
                            ${selectedRows.length === paginatedData.length && paginatedData.length > 0 &&
                                'selected-checkbox'}`}
                            />
                          </th>
                          <th onClick={() => handleSort('id')} className="sortable">
                            ID {getSortIcon('id')}
                          </th>
                          <th onClick={() => handleSort('name')} className="sortable">
                            Customer Name {getSortIcon('name')}
                          </th>
                          <th onClick={() => handleSort('email')} className="sortable">
                            Email {getSortIcon('email')}
                          </th>
                          <th onClick={() => handleSort('phone')} className="sortable">
                            Phone {getSortIcon('phone')}
                          </th>
                          <th onClick={() => handleSort('tin')} className="sortable">
                            TIN {getSortIcon('tin')}
                          </th>
                          <th onClick={() => handleSort('status')} className="sortable">
                            Status {getSortIcon('status')}
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.map((customer, index) => (
                          <tr key={customer.id} className={selectedRows.includes(customer.id) ? 'selected' : ''}>
                            <td className="checkbox-cell">
                              <input
                                type="checkbox"
                                className={`table-checkbox fas fa-check ${selectedRows.includes(customer.id) && 'selected-checkbox'}`}
                                checked={selectedRows.includes(customer.id)}
                                onChange={() => handleSelectRow(customer.id)}
                              />
                            </td>
                            <td>{(currentPage - 1) * pageLimit + index + 1}</td>
                            <td>
                              <div className="table-flex-box">
                                <span className="fas fa-user-circle table-user"></span>
                                <span className="table-customer-text">{customer.name}</span>
                              </div>
                            </td>
                            <td>{customer.email}</td>
                            <td>{customer.phone}</td>
                            <td>{customer.tin}</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(customer.status)}`}>
                                <span className="fas fa-circle badge-size"></span> {customer.status}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button className="btn-view" title="View" onClick={() => handleViewCustomer(customer)}>
                                  <span className="fas fa-file"></span> &nbsp; View
                                </button>
                                <button className="btn-edit" title="Edit" onClick={() => handleEditCustomer(customer)}>
                                  <span className="fas fa-pen"></span> &nbsp; Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {filteredData.length === 0 && (
                  <EmptyTable
                    icon="fas fa-users" 
                    message="No customers found matching your criteria"
                    link="/customer/create-customer"
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
              }}
              onConfirm={handleDelete}
              count={selectedRows.length}
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
              }}
              onConfirm={handleUpdateStatus}
              count={selectedRows.length}
              statusOptions={updateStatusOptions}
            />
          )}
        </AnimatePresence>

        {/* View Customer Modal */}
        <AnimatePresence>
          {showViewModal && (
            <CustomerViewModal
              isOpen={showViewModal}
              onClose={() => setShowViewModal(false)}
              customer={selectedCustomer}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CustomerOverview;