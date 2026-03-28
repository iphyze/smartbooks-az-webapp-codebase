import React, { useState, useMemo } from 'react';
import DatePicker from "react-datepicker";
import AsyncSelect from 'react-select/async';
import "react-datepicker/dist/react-datepicker.css";
import useThemeStore from '../../../../stores/useThemeStore';
import api from '../../../../services/api';
import useAuthStore from '../../../../stores/useAuthStore';
import useToastStore from '../../../../stores/useToastStore';
import useSuppliersStore from '../../../../stores/useSuppliersStore';

const PrepareCompassGapsModal = ({ isOpen, onClose, selectedItems, data, onSuccess }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [remark, setRemark] = useState(`Payment against ${data.map(item => item.invoice_number).join(', ')}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { theme } = useThemeStore();
  const { token } = useAuthStore();
  const { showToast } = useToastStore();
  const { fetchAccounts } = useSuppliersStore();

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return data.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  }, [data]);

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const generateBatchOptions = () => {
    const batches = [];
    for (let batch = 1; batch <= 10; batch++) {
      batches.push(batch);
    }
    return batches;
  };

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

    if (!selectedAccount) {
      newErrors.account = true;
      isValid = false;
    }

    if (!remark.trim()) {
      newErrors.remark = true;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const accountName = selectedAccount.label?.split(' - ')[0] || '';
      
      const gapsData = [{
        supplier_name: data[0].suppliers_name,
        suppliers_id: data[0].supplier_id,
        payment_amount: totalAmount,
        payment_date: new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate()
        ).toLocaleDateString('en-CA'),
        batch: selectedBatch,
        remark: remark,
        invoice_numbers: data.map(item => item.invoice_number).join(', '),
        bank_name: selectedAccount.bank_name || '',
        account_number: selectedAccount.account_number || '',
        account_name: accountName,
        sort_code: selectedAccount.sort_code || ''
      }];

      // console.log(gapsData);

      await api.post('/gaps/expense/expenseGaps', gapsData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await onSuccess('Paid');
      showToast('GAPS prepared successfully', 'success');
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to prepare GAPS', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="view-modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={handleModalClick}>
        <div className="view-modal-header">
          <div className='view-modal-heading-textbox'>
            <div className='view-modal-ht'>Prepare GAPS</div>
            <div className='view-modal-subtext'>
              Preparing GAPS for {selectedItems.length} selected item(s) {data[0].suppliers_name}
            </div>
          </div>
        </div>

        <button onClick={onClose} className="fas fa-times view-modal-close"/>

        <div className='edit-modal-content'>
          <div className="form-grid">
            <div className="main-form-group">
              <label>Select Batch</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className={`gaps-input ${errors.batch ? 'error' : ''}`}
              >
                <option value="">Select Batch</option>
                {generateBatchOptions().map(batch => (
                  <option key={batch} value={batch}>Batch {batch}</option>
                ))}
              </select>
            </div>

            <div className="main-form-group">
              <label>Payment Date</label>
              <div className="date-picker-wrapper">
                <DatePicker
                  selected={selectedDate}
                  onChange={date => setSelectedDate(date)}
                  dateFormat="yyyy-MM-dd"
                  className={`gaps-input date-picker ${errors.date ? 'error' : ''}`}
                  placeholderText="Select Payment Date"
                  calendarClassName="date-picker-calendar"
                  isClearable
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
                <div className="date-picker-icon">
                  <span className="fas fa-calendar-alt"/>
                </div>
              </div>
            </div>

            <div className="main-form-group">
              <label>Total Amount</label>
              <input
                type="text"
                value={totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                className="gaps-input"
                disabled
              />
            </div>

            <div className="main-form-group">
              <label>Account Details</label>
              <AsyncSelect
                isClearable
                placeholder="Search Account..."
                loadOptions={fetchAccounts}
                onChange={setSelectedAccount}
                noOptionsMessage={({inputValue}) => {
                  if (!inputValue) return "Start typing to search...";
                  if (inputValue.length < 2) return "Enter at least 2 characters...";
                  return "No accounts found";
                }}
                value={selectedAccount}
                defaultOptions={false}
                cacheOptions={true}
                isSearchable={true}
                loadingMessage={() => "Searching..."}
                blurInputOnSelect={true}
                className={`react-select ${errors.account ? 'is-invalid' : ''}`}
                classNamePrefix="select"
              />
            </div>

            <div className="main-form-group main-form-group-full">
              <label>Remark</label>
              <textarea
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className={`gaps-input gaps-textarea ${errors.remark ? 'error' : ''}`}
                placeholder="Enter remark"
              />
            </div>

          </div>
        </div>

        <div className='edit-modal-footer'>
          <div className="gaps-form-actions">
            <button type="button" onClick={onClose} className="add-row-btn">
              <span className="fas fa-times"></span>&nbsp; Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSubmit} 
              className="form-submit-btn" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="login-loader"></div>
              ) : (
                <><span className="fas fa-save"></span>&nbsp; Prepare GAPS</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrepareCompassGapsModal;