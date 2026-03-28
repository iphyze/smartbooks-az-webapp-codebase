import React, { useState, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import api from '../../../../services/api';
import useThemeStore from '../../../../stores/useThemeStore';
import useAuthStore from '../../../../stores/useAuthStore';
import useToastStore from '../../../../stores/useToastStore';
import useSuppliersStore from '../../../../stores/useSuppliersStore';
import useProjectsStore from '../../../../stores/projects/useProjectsStore';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const EditSupplierModal = ({ isOpen, onClose, data, onSuccess }) => {
  const [formData, setFormData] = useState({
    requestId: '',
    suppliers_name: "",
    supplier_id: "",
    invoice_number: "",
    purchase_number: "",
    po_number: "",
    invoice_date: null,
    purchase_date: null,
    date_received: null,
    project_code: "",
    description: "",
    vat_policy: "",
    amount: "",
    discount: 0,
    other_charges: 0,
    note: "",
    payment_status: "Pending",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useThemeStore();
  const { token } = useAuthStore();
  const { showToast } = useToastStore();
  const { fetchSuppliers } = useSuppliersStore();
  const { fetchProjects } = useProjectsStore();

  const [supplierSelection, setSupplierSelection] = useState(null);
  const [projectSelection, setProjectSelection] = useState(null);

  const vatOptions = [
    { value: "", label: "Select WHT Status" },
    { value: "0.00%", label: "No VAT - 0.00%" },
    { value: "2.00%", label: "Yes - 2.00%" },
    { value: "5.00%", label: "Yes - 5.00%" },
    { value: "7.50%", label: "No WHT - 7.50%" }
  ];

  const paymentStatusOptions = [
    { value: "Paid", label: "Paid" },
    { value: "Pending", label: "Pending" },
    { value: "Unconfirmed", label: "Unconfirmed" }
  ];

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  useEffect(() => {
    if (data) {
      setFormData({
        ...data,
        requestId: data.id,
        amount: data.net_value,
        invoice_date: data.invoice_date ? new Date(data.invoice_date) : null,
        purchase_date: data.purchase_date ? new Date(data.purchase_date) : null,
        date_received: data.date_received ? new Date(data.date_received) : null
      });

      setSupplierSelection({
        value: data.supplier_id,
        label: data.suppliers_name
      });

      setProjectSelection({
        value: data.project_code,
        label: data.project_code
      });
    }
  }, [data]);

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.supplier_id) {
      newErrors.supplier_id = true;
      isValid = false;
    }

    if (!formData.invoice_number) {
      newErrors.invoice_number = true;
      isValid = false;
    }

    if (!formData.purchase_number) {
      newErrors.purchase_number = true;
      isValid = false;
    }

    if (!formData.po_number) {
      newErrors.po_number = true;
      isValid = false;
    }

    if (!formData.invoice_date) {
      newErrors.invoice_date = true;
      isValid = false;
    }

    if (!formData.purchase_date) {
      newErrors.purchase_date = true;
      isValid = false;
    }

    if (!formData.date_received) {
      newErrors.date_received = true;
      isValid = false;
    }

    if (!formData.project_code) {
      newErrors.project_code = true;
      isValid = false;
    }

    if (!formData.description) {
      newErrors.description = true;
      isValid = false;
    }

    if (!formData.vat_policy) {
      newErrors.vat_policy = true;
      isValid = false;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = true;
      isValid = false;
    }

    const discount = parseFloat(formData.discount);
    if (isNaN(discount)) {
      newErrors.discount = true;
      isValid = false;
    }

    const otherCharges = parseFloat(formData.other_charges);
    if (isNaN(otherCharges)) {
      newErrors.other_charges = true;
      isValid = false;
    }

    if (!formData.payment_status) {
      newErrors.payment_status = true;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const formatAmountInput = (value) => {
    if (!value) return '';
    const parts = value.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const handleFormattedAmountChange = (field, formattedValue) => {
    const cleaned = formattedValue.replace(/,/g, '').replace(/[^\d.]/g, '');
    handleInputChange(field, cleaned);
  };

  const formatAmountOnBlur = (field) => {
    const raw = formData[field];
    if (!raw || isNaN(raw)) return;

    const rounded = parseFloat(raw).toFixed(2);
    handleInputChange(field, rounded);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        invoice_date: formData.invoice_date.toLocaleDateString('en-CA'),
        purchase_date: formData.purchase_date.toLocaleDateString('en-CA'),
        date_received: formData.date_received.toLocaleDateString('en-CA')
      };

      const response = await api.put('/request/supplier/edit', submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast(response?.data?.message, 'success');
      onSuccess();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || 'Update failed', 'error');
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
            <div className='view-modal-ht'>Edit Supplier's Request</div>
            <div className='view-modal-subtext'>Update the required fields and click update to save changes.</div>
          </div>
        </div>

        <button onClick={onClose} className="fas fa-times view-modal-close"/>

        <div className='edit-modal-content'>
          <form className="gaps-form edit-modal-form">
            <div className="form-grid">
              <div className="main-form-group main-form-group-full">
                <label>Supplier</label>
                <AsyncSelect
                  isClearable
                  placeholder="Search Supplier..."
                  loadOptions={fetchSuppliers}
                  onChange={(option) => {
                    handleInputChange('supplier_id', option?.value || '');
                    handleInputChange('suppliers_name', option?.label?.split('(')[0].trim() || '');
                    setSupplierSelection(option);
                  }}
                  value={supplierSelection}
                  className={`react-select ${errors.supplier_id ? 'is-invalid' : ''}`}
                  classNamePrefix="select"
                />
              </div>

              <div className="main-form-group">
                <label>Invoice Number</label>
                <input
                  type="text" value={formData.invoice_number}
                  onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                  className={`gaps-input ${errors.invoice_number ? 'error' : ''}`}
                  placeholder="Enter Invoice Number"
                />
              </div>

              <div className="main-form-group">
                <label>Purchase Number</label>
                <input
                  type="text" value={formData.purchase_number}
                  onChange={(e) => handleInputChange('purchase_number', e.target.value)}
                  className={`gaps-input ${errors.purchase_number ? 'error' : ''}`}
                  placeholder="Enter Purchase Number"
                />
              </div>

              <div className="main-form-group">
                <label>Po Number</label>
                <input
                  type="text" value={formData.po_number}
                  onChange={(e) => handleInputChange('po_number', e.target.value)}
                  className={`gaps-input ${errors.po_number ? 'error' : ''}`}
                  placeholder="Enter Po Number"
                />
              </div>

              <div className="main-form-group">
                <label>Invoice Date</label>
                <div className="date-picker-wrapper">
                  <DatePicker
                    selected={formData.invoice_date}
                    onChange={(date) => handleInputChange('invoice_date', date)}
                    dateFormat="yyyy-MM-dd"
                    className={`gaps-input date-picker ${errors.invoice_date ? 'error' : ''}`}
                    placeholderText="Select Date"
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
                <label>Purchase Date</label>
                <div className="date-picker-wrapper">
                  <DatePicker
                    selected={formData.purchase_date}
                    onChange={(date) => handleInputChange('purchase_date', date)}
                    dateFormat="yyyy-MM-dd"
                    className={`gaps-input date-picker ${errors.purchase_date ? 'error' : ''}`}
                    placeholderText="Select Date"
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
                <label>Date Received</label>
                <div className="date-picker-wrapper">
                  <DatePicker
                    selected={formData.date_received}
                    onChange={(date) => handleInputChange('date_received', date)}
                    dateFormat="yyyy-MM-dd"
                    className={`gaps-input date-picker ${errors.date_received ? 'error' : ''}`}
                    placeholderText="Select Date"
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


              <div className="main-form-group main-form-group-full">
                <label>project_code</label>
                <AsyncSelect
                  isClearable
                  placeholder="Search project_code..."
                  loadOptions={fetchProjects}
                  onChange={(option) => {
                    handleInputChange('project_code', option?.value || '');
                    setProjectSelection(option);
                  }}
                  value={projectSelection}
                  className={`react-select ${errors.project_code ? 'is-invalid' : ''}`}
                  classNamePrefix="select"
                />
              </div>

              <div className="main-form-group main-form-group-full">
                <label>Description</label>
                <input
                  type="text" value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`gaps-input ${errors.description ? 'error' : ''}`}
                  placeholder="Enter Description"
                />
              </div>

              <div className="main-form-group">
                <label>WHT Status</label>
                <Select
                  options={vatOptions}
                  value={vatOptions.find(option => option.value === formData.vat_policy)}
                  onChange={(option) => handleInputChange('vat_policy', option?.value || '')}
                  className={`react-select ${errors.vat_policy ? 'is-invalid' : ''}`}
                  classNamePrefix="select"
                  placeholder="Select WHT Status"
                  isClearable
                />
              </div>

              <div className="main-form-group">
                <label>Sub Total</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatAmountInput(formData.amount)}
                  onChange={(e) => handleFormattedAmountChange('amount', e.target.value)}
                  onBlur={() => formatAmountOnBlur('amount')}
                  className={`gaps-input ${errors.amount ? 'error' : ''}`}
                  placeholder="Enter Sub Total"
                />
              </div>

              <div className="main-form-group">
                <label>Discount</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatAmountInput(formData.discount)}
                  onChange={(e) => handleFormattedAmountChange('discount', e.target.value)}
                  onBlur={() => formatAmountOnBlur('discount')}
                  className={`gaps-input ${errors.discount ? 'error' : ''}`}
                  placeholder="Enter Discount"
                />
              </div>

              <div className="main-form-group">
                <label>Other Charges</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatAmountInput(formData.other_charges)}
                  onChange={(e) => handleFormattedAmountChange('other_charges', e.target.value)}
                  onBlur={() => formatAmountOnBlur('other_charges')}
                  className={`gaps-input ${errors.other_charges ? 'error' : ''}`}
                  placeholder="Enter Other Charges"
                />
              </div>

              <div className="main-form-group">
                <label>Payment Status</label>
                <Select
                  options={paymentStatusOptions}
                  value={paymentStatusOptions.find(option => option.value === formData.payment_status)}
                  onChange={(option) => handleInputChange('payment_status', option?.value || '')}
                  className={`react-select ${errors.payment_status ? 'is-invalid' : ''}`}
                  classNamePrefix="select"
                  placeholder="Select Payment Status"
                  isClearable
                />
              </div>

              <div className="main-form-group main-form-group-full">
                <label>Note (Optional)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => handleInputChange('note', e.target.value)}
                  className="gaps-input gaps-textarea"
                  placeholder="Enter Note"
                />
              </div>
            </div>
          </form>
        </div>

        <div className='edit-modal-footer'>
          <div className="gaps-form-actions">
            <button type="button" onClick={onClose} className="add-row-btn">
              <span className="fas fa-times"></span>&nbsp; Cancel
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