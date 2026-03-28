import React, { useState, useEffect, useCallback, useMemo } from "react";
import NavBar from "../../../NavBar";
import Header from "../../../Header";
import { NavLink } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import 'aos/dist/aos.css';
import AOS from 'aos';
import useThemeStore from "../../../../stores/useThemeStore";
import Icon from "../../../../assets/images/ico.png";
import { debounce } from 'lodash';
import DeleteModal from "../../../../components/DeleteModal";
import EmptyState from "../../../../components/EmptyState";
import ErrorState from "../../../../components/ErrorState";
import useAuthStore from "../../../../stores/useAuthStore";
import ViewModal from "./ViewModal";
import EditAdvanceModal from "./EditAdvanceModal";
import useAdvanceRequestStore from "../../../../stores/fund-request/useAdvanceRequestStore";
import UpdateModal from "../../../../components/UpdateModal";
import PrepareAdvanceGapsModal from "./PrepareAdvanceGapsModal";

const AdvanceTable = () => {
  const [nav, setNav] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [itemToUpdate, setItemToUpdate] = useState(null);
  const { theme } = useThemeStore();
  const [searchText, setSearchText] = useState('');
  const { token, user } = useAuthStore();
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showGapsModal, setShowGapsModal] = useState(false);
  const [pytStatus, setPytStatus] = useState(null);
  
  const {
    total, error, currentPage, itemsPerPage, selectedItems,
    sortBy, sortOrder, fetchData, setSearchQuery, setCurrentPage,
    setItemsPerPage, setSorting, toggleItemSelection, deleteSelectedItems, updateSelectedItems,
    getTotalPages, exportToExcel, getCurrentPageData,
    setPaymentStatus, payment_status, year, loading, setYear
  } = useAdvanceRequestStore();
  

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
  const years = [];
  for (let year = 2022; year <= currentYear; year++) {
    years.push(year);
  }
  return years;
};

const handleYearChange = (e) => {
    const year = e.target.value;
    const newYear = year === 'all' ? '' : parseInt(year);
    setYear(newYear);
    fetchData();
};

  const debouncedSearch = useCallback(debounce((value) => {
    setSearchQuery(value);
    fetchData();
  }, 300), []);

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


  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const success = await updateSelectedItems(pytStatus);
      if (success) {
        setShowUpdateModal(false);
        setItemToUpdate(null);
      }
    } finally {
      setIsUpdating(false);
    }
  };


  const handlePaymentStatusChange = (e) => {
    const status = e.target.value;
    setPaymentStatus(status);
    fetchData();
  };

    const handleSort = (column) => {
    const newOrder = column === sortBy && sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setSorting(column, newOrder);
    fetchData();
    };

  const handleSelectAll = (e) => {
  if (e.target.checked) {
    const currentIds = currentItems.map(item => item.id);
    useAdvanceRequestStore.setState({ 
      selectedItems: [...new Set([...selectedItems, ...currentIds])] 
    });
  } else {
    const currentIds = currentItems.map(item => item.id);
    useAdvanceRequestStore.setState({ 
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
      case 'pending':
        setShowUpdateModal(true);
        setPytStatus('Pending');
        break;
      case 'paid':
        setShowUpdateModal(true);
        setPytStatus('Paid');
        break;
      case 'unconfirmed':
        setShowUpdateModal(true);
        setPytStatus('Unconfirmed');
        break;
      case 'prepare-gaps':
        setShowGapsModal(true);
        setPytStatus('Paid');
        break;
      // Add more cases for other actions here
      default:
        break;
    }
  };

  const totalPages = getTotalPages();

  useEffect(() => {
    AOS.init({
      duration: 1000,
      offset: 100,
      easing: 'ease-in-out',
      once: true,
    });

    document.title = "Acctlab | Advance Fund Request";
    fetchData();

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
            <p className="content-header">Fund Request</p>
          </div>
          <div className="cch-title-box">
            <NavLink to='/' className="ccht-titlelink">Home</NavLink>
            <span className="ccht-arrow fas fa-chevron-right"></span>
            <NavLink to='/payments/fund-request' className="ccht-titlelink">Fund Request</NavLink>
            <span className="ccht-arrow fas fa-chevron-right"></span>
            <p className="ccht-titletext">Advance</p>
          </div>
        </div>


        

        <div className="data-table-wrapper" data-aos="fade-up">



        <div className="data-table-header">
        
        <div className="data-table-title">Advance</div>
        <NavLink to='create' className="data-create-button">
            <span className="fas fa-plus-circle"></span>&nbsp; Create New
        </NavLink>
        
        </div>

        <div className="filters-user-section">


            <div className="year-selection-box">
    
            <div className="year-selection-label">{
              selectedItems.length > 0 ? 
                <>{selectedItems.length} item(s) selected</> : 'Select Action'
              }
            </div>
    
            <select disabled={selectedItems.length === 0} onChange={(e) => {handleActionSelect(e.target.value); e.target.value = ''}}
                className={`year-select-action ${selectedItems.length === 0 ? 'disabled' : ''}`} value="">
                <option value="">Select Action</option>
                <option value="delete">Delete Selected</option>
                <option value="pending">Update to Pending</option>
                <option value="paid">Update to Paid</option>
                <option value="unconfirmed">Update to Unconfirmed</option>
                <option value="prepare-gaps">Prepare Gaps</option>
            </select>
            
            </div>
        

            <div className="year-selection-box">
              <div className="year-selection-label">Filter By Year</div>
              <select value={year} onChange={handleYearChange} 
              className="year-select-action">
                  <option value="all">All</option>
                  {generateYearOptions().map(year => (<option key={year} value={year}>{year}</option>))}
              </select>
            </div>
    
            <div className="year-selection-box">
              <div className="year-selection-label">Filter By Status</div>
              <select value={payment_status} onChange={handlePaymentStatusChange} className="year-select-action">
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="unconfirmed">Unconfirmed</option>
              </select>
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
                <option value={250}>250</option>
                <option value={500}>500</option>
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
                  Download &nbsp;<span className="fas fa-download"></span>
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
                    <th>
                      <input type="checkbox" checked={isCurrentPageAllSelected()} onChange={handleSelectAll} className="checkbox"/>
                    </th>
                    <th onClick={() => handleSort('id')} className="sortable-header">
                      ID
                      <span className="sort-icon">
                        {sortBy === 'id' ? (
                          <i className={`fas fa-sort-${sortOrder === 'ASC' ? 'up' : 'down'}`} />
                        ) : (
                          <i className="fas fa-sort" />
                        )}
                      </span>
                    </th>
                    <th onClick={() => handleSort('suppliers_name')} className="sortable-header">
                      Supplier Name
                      <span className="sort-icon">
                        {sortBy === 'suppliers_name' ? (
                          <i className={`fas fa-sort-${sortOrder === 'ASC' ? 'up' : 'down'}`} />
                        ) : (
                          <i className="fas fa-sort" />
                        )}
                      </span>
                    </th>
                    <th onClick={() => handleSort('po_number')} className="sortable-header">
                      PO Number
                      <span className="sort-icon">
                        {sortBy === 'po_number' ? (
                          <i className={`fas fa-sort-${sortOrder === 'ASC' ? 'up' : 'down'}`} />
                        ) : (
                          <i className="fas fa-sort" />
                        )}
                      </span>
                    </th>
                    <th onClick={() => handleSort('amount_payable')} className="sortable-header">
                      Amount
                      <span className="sort-icon">
                        {sortBy === 'date_received' ? (
                          <i className={`fas fa-sort-${sortOrder === 'ASC' ? 'up' : 'down'}`} />
                        ) : (
                          <i className="fas fa-sort" />
                        )}
                      </span>
                    </th>
                    <th onClick={() => handleSort('percentage')} className="sortable-header">
                      Percentage
                      <span className="sort-icon">
                        {sortBy === 'percentage' ? (
                          <i className={`fas fa-sort-${sortOrder === 'ASC' ? 'up' : 'down'}`} />
                        ) : (
                          <i className="fas fa-sort" />
                        )}
                      </span>
                    </th>
                    <th onClick={() => handleSort('payment_status')} className="sortable-header">
                      Payment Status
                      <span className="sort-icon">
                        {sortBy === 'payment_status' ? (
                          <i className={`fas fa-sort-${sortOrder === 'ASC' ? 'up' : 'down'}`} />
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
                            </div>
                          </div>
                      </td>
                      <td>{item.po_number}</td>
                      <td><div className="tab-box-bankname">₦ {formatAmount(item.advance_payment)}</div></td>
                      <td>{item.percentage}%</td>
                      <td><div className={`payment-status ${item.payment_status}-status-color`}>{item.payment_status}</div></td>
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


        {showUpdateModal && (
          <UpdateModal
            onConfirm={handleUpdate}
            onCancel={() => {
              setShowUpdateModal(false);
              setItemToUpdate(null);
              setPytStatus(null);
            }}
            message={itemToUpdate 
              ? `Are you sure you want to update this item to ${pytStatus}?` 
              : `Are you sure you want to update ${selectedItems.length} selected item(s) to ${pytStatus}?`
            }
            isLoading={isUpdating}
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


        {showGapsModal && (
          <PrepareAdvanceGapsModal
            isOpen={showGapsModal}
            onClose={() => setShowGapsModal(false)}
            selectedItems={selectedItems}
            data={currentItems.filter(item => selectedItems.includes(item.id))}
            onSuccess={(status) => {
              updateSelectedItems(status);
              fetchData();
            }}
          />
        )}

      </div>
    </div>
    </>
  );
};

export default AdvanceTable;