import React, { useState, useEffect, useCallback, useMemo } from "react";
import NavBar from "../../../NavBar";
import Header from "../../../Header";
import { NavLink } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import 'aos/dist/aos.css';
import AOS from 'aos';
import useThemeStore from "../../../../stores/useThemeStore";
import useAdvanceGapsStore from "../../../../stores/useAdvanceGapsStore";
import Icon from "../../../../assets/images/ico.png";
import { debounce } from 'lodash';
import DeleteModal from "../../../../components/DeleteModal";
import EmptyState from "../../../../components/EmptyState";
import ErrorState from "../../../../components/ErrorState";
import useAuthStore from "../../../../stores/useAuthStore";
import ViewModal from "./ViewModal";
import EditAdvanceModal from "./EditAdvanceModal";
import Select from "react-select";

const AdvanceSchedule = () => {
  const [nav, setNav] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const { theme } = useThemeStore();
  const [searchText, setSearchText] = useState('');
  const { token, user } = useAuthStore();
  const [selectedYear, setSelectedYear] = useState(user?.accounting_period || new Date().getFullYear());
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState('all');
  
  const {
    data, total, error, currentPage, itemsPerPage, searchQuery, selectedDate, selectedItems,
    sortBy, sortOrder, fetchData, setSearchQuery, setSelectedDate, setCurrentPage,
    setItemsPerPage, setSorting, toggleItemSelection, deleteSelectedItems,
    getTotalPages, exportToExcel, clearSelection, getCurrentPageData, filterUserId, setFilterUserId, userOptions,
    fetchUsers, loading
  } = useAdvanceGapsStore();


  const actionOptions = [
    { value: "delete", label: "Delete Selected" },
  ];

  const currentItems = getCurrentPageData();

  const getPaginationInfo = () => {
    const start = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, total);
    return { start, end, total };
  };

  const formatAmount = (amount) => {
    return Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const paginationInfo = useMemo(() => getPaginationInfo(), [
    currentPage,
    itemsPerPage,
    total
  ]);

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [{ value: 'all', label: 'All' }]; // Add All option first
  for (let year = 2022; year <= currentYear; year++) {
    years.push({ value: year, label: year.toString() });
  }
  return years;
};


const generateBatchOptions = () => {
  const batches = [{ label: 'All', value: 'all' }]; // Add this line
  for (let batch = 1; batch <= 10; batch++) {
    batches.push({ label: `Batch ${batch}`, value: batch }); // Update to object format
  }
  return batches;
};


const handleBatchChange = (e) => {
  const batch = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
  setSelectedBatch(batch);
  useAdvanceGapsStore.setState({ batch });
  fetchData();
};

  const debouncedSearch = useCallback(
      debounce((value) => {
          setSearchQuery(value);
          fetchData();
      }, 300),
      [fetchData]
  );

  const handleSearchChange = (e) => {
    const { value } = e.target;
    setSearchText(value);
    debouncedSearch(value);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteSelectedItems();
      if (success) {
        setShowDeleteModal(false);
        setItemToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };


    const handleSort = (column) => {
      const newOrder = column === sortBy && sortOrder === 'ASC' ? 'DESC' : 'ASC';
      setSorting(column, newOrder);
      fetchData();
    };

  const handleSelectAll = (e) => {
  if (e.target.checked) {
    const currentIds = currentItems.map(item => item.id);
    useAdvanceGapsStore.setState({ 
      selectedItems: [...new Set([...selectedItems, ...currentIds])] 
    });
  } else {
    const currentIds = currentItems.map(item => item.id);
    useAdvanceGapsStore.setState({ 
      selectedItems: selectedItems.filter(id => !currentIds.includes(id))
    });
  }
};

    const isCurrentPageAllSelected = () => {
        return currentItems.length > 0 && currentItems.every(item => selectedItems.includes(item.id));
    };

    const handlePreviousPage = () => {
    if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
    }
    };

    const handleNextPage = () => {
    if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
    }
    };

  const handleActionSelect = (action) => {
    switch(action) {
      case 'delete':
        setShowDeleteModal(true);
        break;
      // Add more cases for other actions here
      default:
        break;
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const totalPages = getTotalPages();

  useEffect(() => {
    AOS.init({
      duration: 1000,
      offset: 100,
      easing: 'ease-in-out',
      once: true,
    });

    document.title = "Acctlab | Gaps Schedule";
    fetchData();
    fetchUsers();

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [fetchData]);


  if (error) {
    return <ErrorState message={error} />;
  }


  if (isLoading) {
    return (
      <div className={`loader-container theme-${theme}`}>
        <div className="loader-content">
          <img src={Icon} alt="Loading" className="loader-icon" />
          <p className="loader-text">Loading...</p>
        </div>
      </div>
    );
  }


  const InnerLoader = () => {
    return(
        <div className={`inner-loader-container theme-${theme}`}>
            <div className="loader-content">
            <img src={Icon} alt="Loading" className="loader-icon" />
            <p className="loader-text">Loading...</p>
        </div>
        </div>
    )
  }


  const getInitials = (name) => {
    if (!name) return "";
    const words = name.trim().split(" ");
    return words.length === 1
        ? words[0][0].toUpperCase()
        : (words[0][0] + words[1][0]).toUpperCase();
    };


    const handleView = (item) => {
        setShowViewModal(true);
        setViewData(item);
    }

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowEditModal(true);
    };

  return(
    <>
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav}/>
      <NavBar setNav={setNav} nav={nav}/>
      
      <div className={`content-container theme-${theme}`}>
        <div className="content-container-h-flexbox" data-aos='fade-down'>
          <div className="cch-flexbox">
            <p className="content-header">Gaps Advance</p>
          </div>
          <div className="cch-title-box">
            <NavLink to='/' className="ccht-titlelink">Home</NavLink>
            <span className="ccht-arrow fas fa-chevron-right"></span>
            <NavLink to='/payments/gaps' className="ccht-titlelink">Gaps</NavLink>
            <span className="ccht-arrow fas fa-chevron-right"></span>
            <p className="ccht-titletext">Advance</p>
          </div>
        </div>


        

        <div className="data-table-wrapper" data-aos="fade-up">



        <div className="data-table-header">
        
        <div className="data-table-title">Payment Schedule</div>
        <NavLink to='create' className="data-create-button">
            <span className="fas fa-plus-circle"></span>&nbsp; Create New
        </NavLink>
        
        </div>

        <div className="filters-user-section">

              <div className="main-form-group" style={{ width: "180px" }}>
                <label>Select Action</label>
                <Select
                  options={actionOptions}
                  value={null}
                  onChange={(option) => {
                    if (option) {
                      handleActionSelect(option.value);
                    }
                  }}
                  className="react-select"
                  classNamePrefix="select"
                  placeholder="Select Action"
                  isClearable={false}
                  isDisabled={selectedItems.length === 0}
                />
              </div>
    

              <div className="main-form-group" style={{ width: "120px" }}>
                <label>Filter By Year</label>
                <Select
                  options={generateYearOptions()}
                  value={generateYearOptions().find(option => option.value === selectedYear)}
                  onChange={(option) => {
                    if (option) {
                      const yearValue = option.value === 'all' ? 'all' : option.value;
                      setSelectedYear(yearValue);
                      fetchData(yearValue);
                    }
                  }}
                  className="react-select"
                  classNamePrefix="select"
                  placeholder="Select Year"
                  isClearable={false}
                />
              </div>

            <div className="main-form-group" style={{ width: "240px" }}>
              <label>Filter By User</label>
              <Select
                options={userOptions}
                value={userOptions.find(option => option.value === filterUserId)}
                onChange={(option) => {
                  if (option) {
                    setFilterUserId(option.value);
                    fetchData();
                  }
                }}
                className="react-select"
                classNamePrefix="select"
                placeholder="Select User"
                isClearable={false}
              />
            </div>

            <div className="main-form-group" style={{ width: "140px" }}>
              <label>Filter By Batch</label>
              <Select
                options={generateBatchOptions()}
                value={generateBatchOptions().find(option => option.value === selectedBatch)}
                onChange={(option) => {
                  if (option) {
                    const batch = option.value === 'all' ? 'all' : parseInt(option.value);
                    setSelectedBatch(batch);
                    useAdvanceGapsStore.setState({ batch });
                    fetchData();
                  }
                }}
                className="react-select"
                classNamePrefix="select"
                placeholder="Select Batch"
                isClearable={false}
              />
            </div>

    
            <div className="main-form-group" style={{ width: "200px" }}>
              
              <div className="year-selection-label">Filter By Date</div>
              <div className="datatable-date-picker-wrapper">
                  <DatePicker
                  isClearable
                  selected={selectedDate}
                  onChange={handleDateChange}
                  className="gaps-input date-picker"
                  calendarClassName="date-picker-calendar"
                  placeholderText="Select Date"
                  dateFormat="yyyy-MM-dd"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  adjustDateOnChange
                  strictParsing
                  startDate={selectedDate}
                  endDate={selectedDate}
                  />
                  <div className="date-picker-icon">
                      <span className="fas fa-calendar-alt"/>
                  </div>
              </div>
    
            </div>
    
        </div>


        <div className="inner-data-table-box">

        {/* Filters Section */}
        <div className="filters-section">
        
          <div className="filters-section-cols">
          
          <div className="filters-page-box">
          
            <div className="filters-page-show-text">Show</div>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="items-per-page-select">
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            <div className="filters-page-show-text">Entries</div>

          </div>

          </div>

          <div className="filters-section-cols-action">

              <div className="data-search-box-wrap">
                  <input type="text" placeholder="Search..." value={searchText} onChange={handleSearchChange} className="data-search-input"/>
                  <span className="fas fa-search search-box-icon"></span>
              </div>

              <button onClick={exportToExcel} className="export-button">
                   <span className="fas fa-download"></span>&nbsp; Download
              </button>
          </div>

        </div>


        {/* Data Table */}
        <div className="data-table">
           {loading ? (
                <InnerLoader />
                ) : currentItems?.length ? (
                <table className="datatable-table">
                    <thead>
                    <tr>
                        <th><input type="checkbox" checked={isCurrentPageAllSelected()} onChange={handleSelectAll} className="checkbox"/></th>
                        <th>ID</th>
                        <th onClick={() => handleSort('suppliers_name')} className="sortable-header">
                            Supplier Name 
                            <span className="sort-icon">
                            {sortBy === 'suppliers_name' ? (
                                <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`} />
                            ) : (
                                <i className="fas fa-sort" />
                            )}
                            </span>
                        </th>
                        <th onClick={() => handleSort('payment_amount')} className="sortable-header">
                            Amount
                            <span className="sort-icon">
                            {sortBy === 'payment_amount' ? (
                                <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`} />
                            ) : (
                                <i className="fas fa-sort" />
                            )}
                            </span>
                        </th>
                        <th onClick={() => handleSort('payment_date')} className="sortable-header">
                            Payment Date
                            <span className="sort-icon">
                            {sortBy === 'payment_date' ? (
                                <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`} />
                            ) : (
                                <i className="fas fa-sort" />
                            )}
                            </span>
                        </th>
                        <th onClick={() => handleSort('po_numbers')} className="sortable-header">
                            PO Number
                            <span className="sort-icon">
                            {sortBy === 'po_numbers' ? (
                                <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`} />
                            ) : (
                                <i className="fas fa-sort" />
                            )}
                            </span>
                        </th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentItems.map((item, index) => (
                        <tr key={item.id}>
                        <td>
                            <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleItemSelection(item.id)} className="checkbox"/>
                        </td>
                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td>
                            <div className="tab-flex">
                                <div className="tab-col">{getInitials(item.suppliers_name)}</div>
                                <div className="tab-box">
                                    <div className="tab-box-name">{item.suppliers_name}</div>
                                    <div className="tab-box-bankname">{item.bank_name} - {item.account_number}</div>
                                </div>
                            </div>
                        </td>
                        <td><div className="tab-box-bankname">₦ {formatAmount(item.payment_amount)}</div></td>
                        <td>{item.payment_date}</td>
                        <td>{item.po_numbers}</td>
                        <td>
                            <button onClick={() => handleEdit(item)} className="fas fa-pen action-btns"></button>
                            <button onClick={() => handleView(item)} className="fas fa-info-circle action-btns"></button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                ) : (
                <EmptyState />
                )}
        </div>

        {/* Pagination */}

        {!loading && currentItems.length > 0 && (
        
        <div className="pagination-box">
        
        <div className="pagination-showing">
            {(() => {
            const { start, end, total } = paginationInfo;
            return `Showing ${start} to ${end} of ${total} entries`;
            })()}
        </div>

        <div className="pagination">

            <button onClick={handlePreviousPage} disabled={currentPage === 1} className={`pagination-nav ${currentPage === 1 ? 'disabled' : ''}`}>
                Previous
            </button>
          {Array.from({ length: totalPages }, (_, index) => {
            const pageNumber = index + 1;
            
            // Show ellipsis for large page numbers
            if (totalPages > 7) {
            if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
            ) {
                return (
                <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={currentPage === pageNumber ? 'active' : ''}
                >
                    {pageNumber}
                </button>
                );
            } else if (
                pageNumber === currentPage - 2 ||
                pageNumber === currentPage + 2
            ) {
                return <span key={pageNumber} className="pagination-ellipsis">...</span>;
            }
            return null;
            }

            // Show all pages if total pages are 7 or less
            return (
            <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={currentPage === pageNumber ? 'active' : ''}
            >
                {pageNumber}
            </button>
            );
        })}

        <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`pagination-nav ${currentPage === totalPages ? 'disabled' : ''}`}
        >
            Next
        </button>

        </div>

        </div>

        )}

        </div>

        
        </div>



        {/* Delete Modal */}
        {showDeleteModal && (
          <DeleteModal
            onConfirm={handleDelete}
            onCancel={() => {
              setShowDeleteModal(false);
              setItemToDelete(null);
            }}
            message={itemToDelete 
              ? "Are you sure you want to delete this item?" 
              : `Are you sure you want to delete ${selectedItems.length} selected item(s)?`
            }
            isLoading={isDeleting}
          />
        )}


        {showViewModal && (
          <ViewModal
            onCancel={() => {
              setShowViewModal(false);
              setViewData(null);
            }}
            viewData={viewData}
          />
        )}


        {showEditModal && (
        <EditAdvanceModal
            isOpen={showEditModal}
            onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
            }}
            data={editingItem}
            onSuccess={() => {
            fetchData();
            setShowEditModal(false);
            setEditingItem(null);
            }}
        />
        )}

      </div>
    </div>
    </>
  );
};

export default AdvanceSchedule;