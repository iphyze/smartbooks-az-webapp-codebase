import React, { useState, useEffect, useRef } from 'react';
import AsyncSelect from 'react-select/async';
import { debounce } from 'lodash';
import useSuppliersStore from '../../../../stores/useSuppliersStore';
import useAuthStore from '../../../../stores/useAuthStore';
import api from '../../../../services/api';
import useToastStore from '../../../../stores/useToastStore';
import useThemeStore from '../../../../stores/useThemeStore';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const EditSupplierModal = ({ isOpen, onClose, data, onSuccess }) => {
  const [formData, setFormData] = useState({
    id: '',
    supplier_name: '',
    suppliers_id: '',
    payment_amount: '',
    percentages: '',
    po_numbers: '',
    invoice_numbers: '',
    bank_name: '',
    account_number: '',
    account_name: '',
    sort_code: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchSuppliers, fetchAccounts } = useSuppliersStore();
  const { token } = useAuthStore();
  const { showToast } = useToastStore();
  const {theme} = useThemeStore();

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const supplierRef = useRef(null);
  const amountRef = useRef(null);
  const percentageRef = useRef(null);
  const invNumberRef = useRef(null);
  const poNumberRef = useRef(null);
  const accountRef = useRef(null);
  const dateRef = useRef(null);

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  useEffect(() => {
    if (data) {
      setFormData(data);
      setSelectedDate(data.payment_date ? new Date(data.payment_date) : null);
      setSelectedSupplier({
        value: data.suppliers_id,
        label: `${data.suppliers_name}`
      });
      setSelectedAccount({
        value: data.id,
        label: `${data.account_name} - ${data.bank_name}`,
        account_number: data.account_number,
        bank_name: data.bank_name,
        sort_code: data.sort_code
      });
    }
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;


    // Ensure all required fields are present
    const submitData = {
      ...formData,
      supplier_name: formData.supplier_name || selectedSupplier?.label || '',
      suppliers_id: formData.suppliers_id || selectedSupplier?.value || '',
      account_name: formData.account_name || selectedAccount?.label?.split(' - ')[0] || '',
      payment_date: selectedDate ? new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      ).toLocaleDateString('en-CA') : ''
    };


    setIsSubmitting(true);
    try {
      const response = await api.put('/gaps/supplier/editSuppliersGaps', submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast(response.data.message, 'success');
      onSuccess();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || 'Update failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  const formatAmountInput = (value) => {
    if (!value) return '';
    const parts = value.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };



  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!selectedDate) {
      newErrors.date = true;
      isValid = false;
      dateRef.current?.input?.focus();
      return false;
    }

    if (!formData.suppliers_id) {
      newErrors.supplier = true;
      isValid = false;
      supplierRef.current?.focus();
      return false;
    }

    if (!formData.payment_amount || parseFloat(formData.payment_amount) <= 0) {
      newErrors.payment_amount = true;
      isValid = false;
      amountRef.current?.focus();
      return false;
    }

    if (!formData.percentages || parseFloat(formData.percentages) <= 0 || parseFloat(formData.percentages) > 100) {
      newErrors.percentages = true;
      isValid = false;
      percentageRef.current?.focus();
      return false;
    }


    if (!formData.invoice_numbers) {
      newErrors.invoice_numbers = true;
      isValid = false;
      invNumberRef.current?.focus();
      return false;
    }

    if (!formData.po_numbers) {
      newErrors.po_numbers = true;
      isValid = false;
      poNumberRef.current?.focus();
      return false;
    }

    if (!formData.account_name) {
      newErrors.account = true;
      isValid = false;
      accountRef.current?.focus();
      return false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAmountChange = (e) => {
  const input = e.target.value;
  const cleaned = input.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  const sanitized = parts.length > 2 
    ? `${parts[0]}.${parts.slice(1).join('')}`
    : cleaned;

  setFormData(prev => ({
    ...prev,
    payment_amount: sanitized
  }));
};


const handleAmountBlur = () => {
  const value = parseFloat(formData.payment_amount);
  if (!isNaN(value)) {
    const rounded = value.toFixed(2);
    setFormData(prev => ({
      ...prev,
      payment_amount: rounded
    }));
  }
};


  if (!isOpen) return null;

  return (
    <div className="view-modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={handleModalClick}>
        
        <div className="view-modal-header">
          <div className='view-modal-heading-textbox'>
            <div className='view-modal-ht'>Edit Payment Details</div>
            <div className='view-modal-subtext'>Kindly update the required fields and click update to successfully update the entry.</div>
          </div>
        </div>

        <button onClick={onClose} className="fas fa-times view-modal-close"/>

        <div className='edit-modal-content'>
        
        <form className="gaps-form edit-modal-form">

          <div className="form-group">
            <label>Payment Date</label>
            <div className="date-picker-wrapper">
              <DatePicker
                ref={dateRef}
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

          <div className="form-group">
            <label>Supplier</label>
            <AsyncSelect
              isClearable
              ref={supplierRef}
              value={selectedSupplier}
              loadOptions={fetchSuppliers}
              onChange={(option) => {
                setSelectedSupplier(option);
                if (option) {
                  setFormData(prev => ({
                    ...prev,
                    suppliers_id: option.value,
                    supplier_name: option.label.split('(')[0].trim()
                  }));
                } else {
                  setFormData(prev => ({
                    ...prev,
                    suppliers_id: '',
                    supplier_name: ''
                  }));
                }
              }}
              className={`react-select ${errors.supplier ? 'is-invalid' : ''}`}
              classNamePrefix="select"
              placeholder="Search supplier..."
              noOptionsMessage={({inputValue}) => {
                if (!inputValue) return "Start typing to search...";
                if (inputValue.length < 2) return "Enter at least 2 characters...";
                return "No suppliers found";
              }}
            />
          </div>

          {/* <div className="form-group">
            <label>Amount</label>
            <input
              type="text"
              ref={amountRef}
              value={formData.payment_amount}
              onChange={handleAmountChange}
              className={`gaps-input ${errors.payment_amount ? 'error' : ''}`}
              placeholder="Enter amount"
            />
          </div> */}

          <div className="form-group">
            <label>Amount</label>
            <input
              type="text"
              ref={amountRef}
              inputMode="decimal"
              value={formatAmountInput(formData.payment_amount)}
              onChange={handleAmountChange}
              onBlur={handleAmountBlur}
              className={`gaps-input ${errors.payment_amount ? 'error' : ''}`}
              placeholder="Enter amount"
            />
          </div>

          <div className="form-group">
            <label>Percentage</label>
            <input
              type="number"
              ref={percentageRef}
              value={formData.percentages}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                percentages: e.target.value
              }))}
              className={`gaps-input no-spinners ${errors.percentages ? 'error' : ''}`}
              placeholder="Enter percentage"
              min="0"
              max="100"
            />
          </div>

          <div className="form-group">
            <label>PO Number</label>
            <input
              type="text"
              ref={poNumberRef}
              value={formData.po_numbers}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                po_numbers: e.target.value
              }))}
              className={`gaps-input ${errors.po_numbers ? 'error' : ''}`}
              placeholder="Enter PO number"
            />
          </div>

          <div className="form-group">
            <label>Account Details</label>
            <AsyncSelect
              isClearable
              value={selectedAccount}
              ref={accountRef}
              loadOptions={fetchAccounts}
              onChange={(option) => {
                setSelectedAccount(option);
                if (option) {
                  const accountName = option.label.split(' - ')[0];
                  setFormData(prev => ({
                    ...prev,
                    account_name: accountName,
                    account_number: option.account_number,
                    bank_name: option.bank_name,
                    sort_code: option.sort_code
                  }));
                } else {
                  setFormData(prev => ({
                    ...prev,
                    account_name: '',
                    account_number: '',
                    bank_name: '',
                    sort_code: ''
                  }));
                }
              }}
              className={`react-select ${errors.account ? 'is-invalid' : ''}`}
              classNamePrefix="select"
              placeholder="Search account..."
              noOptionsMessage={({inputValue}) => {
                if (!inputValue) return "Start typing to search...";
                if (inputValue.length < 2) return "Enter at least 2 characters...";
                return "No accounts found";
              }}
            />
          </div>
          
        </form>
        
        </div>

        <div className='edit-modal-footer'>
            <div className="gaps-form-actions">
              <button type="button" onClick={onClose} className="add-row-btn">
                Cancel
              </button>
              <button type="button" onClick={handleSubmit} className="form-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="login-loader"></div>
                ) : (
                  <>
                    <span className="fas fa-save"></span>&nbsp; Update
                  </>
                )}
              </button>
            </div>
          </div>

      </div>
    </div>
  );
};

export default EditSupplierModal;