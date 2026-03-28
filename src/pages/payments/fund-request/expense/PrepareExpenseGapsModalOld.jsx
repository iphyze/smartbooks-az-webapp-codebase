import React, { useState } from 'react';
import DatePicker from "react-datepicker";
import AsyncSelect from 'react-select/async';
import "react-datepicker/dist/react-datepicker.css";
import useThemeStore from '../../../../stores/useThemeStore';
import api from '../../../../services/api';
import useAuthStore from '../../../../stores/useAuthStore';
import useToastStore from '../../../../stores/useToastStore';
import useSuppliersStore from '../../../../stores/useSuppliersStore';

const PrepareExpenseGapsModalOld = ({ isOpen, onClose, selectedItems, data, onSuccess }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [accountSelections, setAccountSelections] = useState({});
  const { theme } = useThemeStore();
  const { token } = useAuthStore();
  const { showToast } = useToastStore();
  const { fetchAccounts } = useSuppliersStore();

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

    // Validate account selections
    data.forEach((item, index) => {
      if (!accountSelections[index]) {
        if (!newErrors.accounts) newErrors.accounts = {};
        newErrors.accounts[index] = true;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Prepare the data in the required format
      const gapsData = data.map((item, index) => {
        const accountDetails = accountSelections[index] || {};
        const accountName = accountDetails.label?.split(' - ')[0] || '';

        return {
          suppliers_id: item.supplier_id,
          supplier_name: item.suppliers_name,
          payment_amount: item.amount,
          payment_date: selectedDate.toLocaleDateString('en-CA'),
          batch: selectedBatch,
          invoice_numbers: item.invoice_number,
          bank_name: accountDetails.bank_name || '',
          account_number: accountDetails.account_number || '',
          account_name: accountName,
          sort_code: accountDetails.sort_code || ''
        };
      });

      // Create GAPS entries
      await api.post('/gaps/expense/expenseGaps', gapsData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update payment status to Paid
      await onSuccess('Paid');
      
      showToast('GAPS prepared successfully', 'success');
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to prepare GAPS', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="view-modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={handleModalClick}>
        <div className="view-modal-header">
          <div className='view-modal-heading-textbox'>
            <div className='view-modal-ht'>Prepare GAPS</div>
            <div className='view-modal-subtext'>
              Preparing GAPS for {selectedItems.length} selected item(s)
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
          </div>

          <div className="table-container mt-4">
            <table className="gaps-table">
              <thead>
                <tr>
                  <th>Supplier Name</th>
                  <th>Amount</th>
                  <th>Account Details</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td>{item.suppliers_name}</td>
                    <td>{Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <AsyncSelect
                        isClearable
                        placeholder="Search Account..."
                        loadOptions={fetchAccounts}
                        onChange={(option) => {
                          setAccountSelections(prev => ({
                            ...prev,
                            [index]: option
                          }));
                          // Clear error when valid selection is made
                          if (option && errors.accounts) {
                            const newErrors = { ...errors };
                            if (newErrors.accounts) {
                              delete newErrors.accounts[index];
                              if (Object.keys(newErrors.accounts).length === 0) {
                                delete newErrors.accounts;
                              }
                            }
                            setErrors(newErrors);
                          }
                        }}
                        noOptionsMessage={({inputValue}) => {
                          if (!inputValue) return "Start typing to search...";
                          if (inputValue.length < 2) return "Enter at least 2 characters...";
                          return "No accounts found";
                        }}
                        value={accountSelections[index] || null}
                        defaultOptions={false}
                        cacheOptions={true}
                        isSearchable={true}
                        loadingMessage={() => "Searching..."}
                        blurInputOnSelect={true}
                        className={`react-select ${errors.accounts?.[index] ? 'is-invalid' : ''}`}
                        classNamePrefix="select"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default PrepareExpenseGapsModalOld;