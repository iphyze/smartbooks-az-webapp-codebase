import React, { useEffect, useState, useMemo } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useThemeStore from "../../stores/useThemeStore";
import TableLoaderComponent from "../../components/TableLoaderComponent";
import ChartSearchableSelect from "../../components/ChartSearchableSelect";
import { invoiceData } from "./invoiceData";

const InvoiceTableBox = () => {
  const { theme } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  
  // Generate year options for filter (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 2 }, (_, i) => {
    const year = currentYear - i;
    return { id: year.toString(), label: year.toString() };
  });
  
  // Status options for filter
  const statusOptions = [
    { id: "all", label: "All Status" },
    { id: "Paid", label: "Paid" },
    { id: "Pending", label: "Pending" },
    { id: "Rejected", label: "Rejected" }
  ];
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
  
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
    if (selectedRows.length === filteredData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredData.map(invoice => invoice.id));
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { 
      style: 'currency', 
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  // Get status badge style
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Paid':
        return 'badge-success';
      case 'Pending':
        return 'badge-warning';
      case 'Rejected':
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
  
  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = [...invoiceData];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }
    
    // Apply year filter
    filtered = filtered.filter(invoice => invoice.year.toString() === yearFilter);
    
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
  }, [searchTerm, statusFilter, yearFilter, sortConfig]);
  
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
    <motion.div variants={fadeInUp} initial="hidden" animate="show" 
      transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
      className={`invoice-section theme-${theme}`}
    >
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
                <span className="fas fa-search table-search-icon"/>
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
                    <lable className="filter-wrapper-label">Filter by year</lable>
                    <ChartSearchableSelect
                    options={yearOptions}
                    value={yearFilter}
                    onChange={(val) => setYearFilter(val)}
                    className="box-filter"
                    />
                </div>

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
                          checked={selectedRows.length === filteredData.length && filteredData.length > 0} 
                          onChange={handleSelectAll}
                          className={`table-checkbox fas fa-check 
                            ${selectedRows.length === filteredData.length && filteredData.length > 0 && 
                                'selected-checkbox'}`}
                        />
                      </th>
                      <th onClick={() => handleSort('id')} className="sortable">
                        ID {getSortIcon('id')}
                      </th>
                      <th onClick={() => handleSort('customer')} className="sortable">
                        Customer {getSortIcon('customer')}
                      </th>
                      <th onClick={() => handleSort('invoiceNo')} className="sortable">
                        Invoice No {getSortIcon('invoiceNo')}
                      </th>
                      <th onClick={() => handleSort('dateIssued')} className="sortable">
                        Date Issued {getSortIcon('dateIssued')}
                      </th>
                      <th onClick={() => handleSort('dueDate')} className="sortable">
                        Due Date {getSortIcon('dueDate')}
                      </th>
                      <th onClick={() => handleSort('amount')} className="sortable">
                        Amount (₦) {getSortIcon('amount')}
                      </th>
                      <th onClick={() => handleSort('status')} className="sortable">
                        Status {getSortIcon('status')}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((invoice) => (
                      <tr key={invoice.id} className={selectedRows.includes(invoice.id) ? 'selected' : ''}>
                        <td className="checkbox-cell">
                          <input 
                            type="checkbox"
                            className={`table-checkbox fas fa-check ${selectedRows.includes(invoice.id) && 'selected-checkbox'}`} 
                            checked={selectedRows.includes(invoice.id)}
                            onChange={() => handleSelectRow(invoice.id)}
                          />
                        </td>
                        <td>{invoice.id}</td>
                        <td>
                            <div className="table-flex-box">
                                <span className="fas fa-user-circle table-user"></span> 
                                <span className="table-customer-text">{invoice.customer}</span>
                            </div>
                        </td>
                        <td>{invoice.invoiceNo}</td>
                        <td>{invoice.dateIssued}</td>
                        <td>{invoice.dueDate}</td>
                        <td>{formatCurrency(invoice.amount)}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(invoice.status)}`}>
                            <span className="fas fa-circle badge-size"></span> {invoice.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-view" title="View">
                              View
                            </button>
                            <button className="btn-edit" title="Edit">
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredData.length === 0 && (
                  <div className="no-data">
                    <i className="fas fa-chart-bar"></i>
                    <p>No invoices found matching your criteria</p>
                    <Link to="/create-invoice" className="invoice-create-btn">
                        <span className="fas fa-circle-plus inv-create-btn-icon"></span>
                        <span className="inv-create-btn-text">Create New</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default InvoiceTableBox;