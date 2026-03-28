import React, { useState, useEffect } from "react";
import NavBar from "../../../NavBar";
import Header from "../../../Header";
import { NavLink } from "react-router-dom";
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { debounce } from 'lodash';
import 'aos/dist/aos.css';
import AOS from 'aos';
import api from "../../../../services/api";
import useThemeStore from "../../../../stores/useThemeStore";
import useAuthStore from "../../../../stores/useAuthStore";
import Icon from "../../../../assets/images/ico.png";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useToastStore from "../../../../stores/useToastStore";
import { useNavigate } from "react-router-dom";
import useSuppliersStore from "../../../../stores/useSuppliersStore";

const CreateSupplierSchedule = () => {
  const [nav, setNav] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useThemeStore();
  const { token } = useAuthStore();
  const [errors, setErrors] = useState({});
  const [selectedBatch, setSelectedBatch] = useState(null);
  const searchCache = new Map();
  const initialRow = {
    supplier_name: "",
    suppliers_id: "",
    payment_amount: "",
    payment_date: "",
    batch: "",
    // percentages: "",
    po_numbers: "",
    invoice_numbers: "",
    bank_name: "",
    account_number: "",
    account_name: "",
    sort_code: ""
  };

  const [rows, setRows] = useState([initialRow]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [supplierSelections, setSupplierSelections] = useState({});
  const [accountSelections, setAccountSelections] = useState({});
  const {showToast} = useToastStore();
  const navigate = useNavigate();
  const { fetchSuppliers, fetchAccounts } = useSuppliersStore();



  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!selectedDate) {
        newErrors.date = true;
        isValid = false;
    }

    if (!selectedBatch) {
      newErrors.batch = true;
      isValid = false;
    }

    rows.forEach((row, index) => {
      newErrors[index] = {};

      if (!row.suppliers_id) {
        newErrors[index].supplier = true;
        isValid = false;
      }
      
      if (!row.payment_amount || parseFloat(row.payment_amount) <= 0) {
        newErrors[index].payment_amount = true;
        isValid = false;
      }


      // if (!row.percentages || parseFloat(row.percentages) <= 0 || parseFloat(row.percentages) > 100) {
      //   newErrors[index].percentages = true;
      //   isValid = false;
      // }

      if (!row.po_numbers) {
        newErrors[index].po_numbers = true;
        isValid = false;
      }

      if (!row.invoice_numbers) {
        newErrors[index].invoice_numbers = true;
        isValid = false;
      }

      if (!row.account_name) {
        newErrors[index].account = true;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };


  const formatAmountInput = (value) => {
  if (!value) return '';
  const parts = value.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};



const handleFormattedAmountChange = (index, formattedValue) => {
  const cleaned = formattedValue.replace(/,/g, '').replace(/[^\d.]/g, '');
  handleRowChange(index, 'payment_amount', cleaned);
};


const formatAmountOnBlur = (index) => {
  const raw = rows[index]?.payment_amount;
  if (!raw || isNaN(raw)) return;

  const rounded = parseFloat(raw).toFixed(2);
  handleRowChange(index, 'payment_amount', rounded);
};




  const handleAddRow = () => {
    const newIndex = rows.length;
    setRows([...rows, { ...initialRow }]);
    // Clear selections for the new row
    setSupplierSelections(prev => ({
        ...prev,
        [newIndex]: null
    }));
    setAccountSelections(prev => ({
        ...prev,
        [newIndex]: null
    }));
};

  const handleRemoveRow = (index) => {
    const newRows = rows.filter((_, idx) => idx !== index);
    setRows(newRows);
    
    // Remove selections for the deleted row and reindex remaining selections
    const newSupplierSelections = {};
    const newAccountSelections = {};
    
    Object.keys(supplierSelections).forEach(idx => {
        if (idx < index) {
            newSupplierSelections[idx] = supplierSelections[idx];
        } else if (idx > index) {
            newSupplierSelections[idx - 1] = supplierSelections[idx];
        }
    });
    
    Object.keys(accountSelections).forEach(idx => {
        if (idx < index) {
            newAccountSelections[idx] = accountSelections[idx];
        } else if (idx > index) {
            newAccountSelections[idx - 1] = accountSelections[idx];
        }
    });
    
    setSupplierSelections(newSupplierSelections);
    setAccountSelections(newAccountSelections);
};


    const resetForm = () => {
    // Reset rows to initial state
    setRows([{ ...initialRow }]);
    
    // Reset date picker
    setSelectedDate(null);

    // Reset batch selection
    setSelectedBatch(null);
    
    // Reset errors
    setErrors({});
    
    // Reset select fields
    setSupplierSelections({});
    setAccountSelections({});
};


// Add this function after the resetForm function (around line 150):
  const generateBatchOptions = () => {
    const batches = [];
    for (let batch = 1; batch <= 10; batch++) {
      batches.push(batch);
    }
    return batches;
  };

  const handleBatchChange = (e) => {
    const batch = e.target.value ? parseInt(e.target.value) : null;
    setSelectedBatch(batch);
    if (batch) {
      const newErrors = { ...errors };
      delete newErrors.batch;
      setErrors(newErrors);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {

        const rowsWithDate = rows.map(row => ({
        ...row,
        // payment_date: selectedDate.toISOString().split('T')[0]
        batch: selectedBatch,
        payment_date: new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate()
        ).toLocaleDateString('en-CA')
      }));

      const response = await api.post('/gaps/supplier/suppliersGaps', rowsWithDate, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      resetForm();
      showToast(response?.data?.message, 'success');
      navigate("/payments/gaps/suppliers");

      // Handle success
    } catch (error) {
        showToast(error?.response.data?.message, 'error');
      console.error('Error submitting form:', error);
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowChange = (index, field, value) => {
  const newRows = [...rows];
  newRows[index][field] = value;
  setRows(newRows);
  
  // Validate the changed field immediately
  const newErrors = { ...errors };
  if (!newErrors[index]) newErrors[index] = {};
  
  switch (field) {
    case 'suppliers_id':
    case 'supplier_name':
      newErrors[index].supplier = !value;
      break;
    case 'payment_amount':
      newErrors[index].payment_amount = !value || parseFloat(value) <= 0;
      break;
    // case 'percentages':
    //   newErrors[index].percentages = !value || parseFloat(value) <= 0 || parseFloat(value) > 100;
    //   break;
    case 'invoice_numbers':
      newErrors[index].invoice_numbers = !value;
      break;
    case 'po_numbers':
      newErrors[index].po_numbers = !value;
      break;
    case 'account_name':
      newErrors[index].account = !value;
      break;
    default:
      break;
  }
  
  setErrors(newErrors);
};

  useEffect(() => {
    AOS.init({
      duration: 1000,
      offset: 100,
      easing: 'ease-in-out',
      once: true,
    });

    document.title = "Acctlab | Create Advance Gaps Schedule";

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);


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

  return(
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav}/>
      <NavBar setNav={setNav} nav={nav}/>
      
      <div className={`content-container theme-${theme}`}>
        <div className="content-container-h-flexbox" data-aos='fade-down'>
          <div className="cch-flexbox">
            <p className="content-header">Create New</p>
          </div>
          <div className="cch-title-box">
            <NavLink to='/payments/gaps' className="ccht-titlelink">Gaps</NavLink>
            <span className="ccht-arrow fas fa-chevron-right"></span>
            <NavLink to='/payments/gaps/advance' className="ccht-titlelink">Advance</NavLink>
            <span className="ccht-arrow fas fa-chevron-right"></span>
            <p className="ccht-titletext">Create</p>
          </div>
        </div>

    <div className="form-flexbox">

      <div className="date-picker-container form-flex-row" data-aos="fade-down">
          <label className="date-picker-label">Select Batch</label>
          <div className="date-picker-wrapper">
            <select
              value={selectedBatch || ''}
              onChange={handleBatchChange}
              className={`gaps-input ${errors.batch ? 'error' : ''}`}
            >
              <option value="">Select Batch</option>
              {generateBatchOptions().map(batch => (
                <option key={batch} value={batch}>Batch {batch}</option>
              ))}
            </select>
          </div>
        </div>

    <div className="date-picker-container form-flex-row" data-aos="fade-down">
        <label className="date-picker-label">Select Payment Date</label>
        <div className="date-picker-wrapper">
        <DatePicker
        selected={selectedDate}
        onChange={date => {
            setSelectedDate(date);
            if (date) {
            const newErrors = { ...errors };
            delete newErrors.date;
            setErrors(newErrors);
            }
        }}
        dateFormat="yyyy-MM-dd"
        placeholderText="Select Payment Date"
        className={`gaps-input date-picker ${errors.date ? 'error' : ''}`}
        calendarClassName="date-picker-calendar"
        isClearable
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

    <form onSubmit={handleSubmit} className="gaps-form" data-aos="fade-up">

      <div className="table-container">
        <table className="gaps-table">
          <thead>
            <tr>
              <th className="gaps-id-th">ID</th>
              <th className="gaps-suppliers-two-th">Supplier</th>
              <th className="gaps-amount-th">Amount</th>
              {/* <th className="gaps-perc-th">Percentage</th> */}
              <th className="gaps-inv-th">Invoice No.</th>
              <th className="gaps-po-th">PO Number</th>
              <th className="gaps-suppliers-two-th">Account Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="gaps-id-td">{index + 1}</td>
                <td className="gaps-suppliers-two-td">
                  <AsyncSelect
                    isClearable
                    placeholder="Search Supplier..."
                    loadOptions={fetchSuppliers}
                    onChange={(option) => {
                        handleRowChange(index, 'suppliers_id', option?.value || '');
                        handleRowChange(index, 'supplier_name', option?.label?.split('(')[0].trim() || '');
                        setSupplierSelections(prev => ({
                        ...prev,
                        [index]: option
                        }));
                    }}
                    noOptionsMessage={({inputValue}) => {
                        if (!inputValue) return "Start typing to search...";
                        if (inputValue.length < 2) return "Enter at least 2 characters...";
                        return "No suppliers found";
                    }}
                    value={supplierSelections[index] || null}
                    defaultOptions={false} // Changed to false to prevent initial load
                    cacheOptions={true}
                    isSearchable={true}
                    loadingMessage={() => "Searching..."}
                    blurInputOnSelect={true}
                    className={`react-select ${errors[index]?.supplier ? 'is-invalid' : ''}`}
                    classNamePrefix="select"
                    filterOption={null}
                    onInputChange={(newValue, { action }) => {
                        if (action === 'input-change') {
                        return newValue;
                        }
                        return '';
                    }}
                    />
                </td>
                
                {/* <td>
                  <input type="number" min="0" value={row.payment_amount} onChange={(e) => handleRowChange(index, 'payment_amount', e.target.value)}
                    className={`gaps-input no-spinners ${errors[index]?.payment_amount ? 'error' : ''}`} placeholder="Amount"/>
                </td> */}

                  <td>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formatAmountInput(row.payment_amount)}
                      onChange={(e) => handleFormattedAmountChange(index, e.target.value)}
                      onBlur={() => formatAmountOnBlur(index)}
                      className={`gaps-input no-spinners ${errors[index]?.payment_amount ? 'error' : ''}`}
                      placeholder="Amount"
                    />
                  </td>


                {/* <td>
                  <input
                    type="number" min="0" max="100" value={row.percentages}
                    onChange={(e) => handleRowChange(index, 'percentages', e.target.value)}
                    className={`gaps-input no-spinners ${errors[index]?.percentages ? 'error' : ''}`}
                    placeholder="Percentage"
                  />
                </td> */}
                
                <td>
                  <input type="text" value={row.invoice_numbers}
                    onChange={(e) => handleRowChange(index, 'invoice_numbers', e.target.value)}
                    className={`gaps-input ${errors[index]?.invoice_numbers ? 'error' : ''}`}
                    placeholder="Invoice No."
                  />
                </td>
                <td>
                  <input type="text" value={row.po_numbers}
                    onChange={(e) => handleRowChange(index, 'po_numbers', e.target.value)}
                    className={`gaps-input ${errors[index]?.po_numbers ? 'error' : ''}`}
                    placeholder="Po. Number"
                  />
                </td>
                <td className="gaps-suppliers-two-td">
                  <AsyncSelect
                    isClearable
                    placeholder="Search Account..."
                    loadOptions={fetchAccounts}
                    onChange={(option) => {
                        if (option) {

                          const accountName = option.label.split(' - ')[0];

                        handleRowChange(index, 'account_name', accountName);
                        handleRowChange(index, 'account_number', option.account_number);
                        handleRowChange(index, 'bank_name', option.bank_name);
                        handleRowChange(index, 'sort_code', option.sort_code);
                        } else {
                        handleRowChange(index, 'account_name', '');
                        handleRowChange(index, 'account_number', '');
                        handleRowChange(index, 'bank_name', '');
                        handleRowChange(index, 'sort_code', '');
                        }
                        setAccountSelections(prev => ({
                        ...prev,
                        [index]: option
                        }));
                    }}
                    noOptionsMessage={({inputValue}) => {
                        if (!inputValue) return "Start typing to search...";
                        if (inputValue.length < 2) return "Enter at least 2 characters...";
                        return "No accounts found";
                    }}
                    value={accountSelections[index] || null}
                    defaultOptions={false} // Changed to false to prevent initial load
                    cacheOptions={true}
                    isSearchable={true}
                    loadingMessage={() => "Searching..."}
                    blurInputOnSelect={true}
                    className={`react-select ${errors[index]?.account ? 'is-invalid' : ''}`}
                    classNamePrefix="select"
                    filterOption={null}
                    onInputChange={(newValue, { action }) => {
                        if (action === 'input-change') {
                        return newValue;
                        }
                        return '';
                    }}
                    />
                </td>
                <td>

                  <button type="button" onClick={() => handleRemoveRow(index)} className="remove-row-btn" disabled={rows.length === 1}>
                    <span className="fas fa-trash"></span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="gaps-form-actions">
        <button type="button" onClick={handleAddRow} className="add-row-btn">
          <span className="fas fa-plus-circle"></span>&nbsp; Add Row
        </button>
        <button type="submit" className="form-submit-btn" disabled={isSubmitting}>
          {isSubmitting ? <div className="login-loader"></div> : (<><span className="fas fa-plus"></span>&nbsp; Submit</>)}
        </button>
      </div>
    </form>
      </div>
    </div>
  );
};

export default CreateSupplierSchedule;