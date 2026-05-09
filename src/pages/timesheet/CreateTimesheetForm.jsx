import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import ReactDOM from "react-dom"; // Import ReactDOM for Portal
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useToastStore from "../../stores/useToastStore";
import useStaffSearchStore from "../../stores/useStaffSearchStore";
import useTimesheetStore from "../../stores/useTimesheetStore";
import useClientSearchStore from "../../stores/useClientSearchStore";
import useProjectSearchStore from "../../stores/useProjectSearchStore";
import api from "../../services/api";
import useAuthStore from "../../stores/useAuthStore";
import "../inputs-styles/Inputs.css";
import DeleteLineItemModal from "../../components/modals/DeleteLineItemModal";
import CreateStaffModal from "../../components/modals/CreateStaffModal";
import CreateClientsModal from "../../components/modals/CreateClientsModal";
import CreateProjectModal from "../../components/modals/CreateProjectModal";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────
   Portal Component for DatePicker
   Fixed: Uses useRef to maintain a stable container element.
───────────────────────────────────────────── */
const CalendarPortal = ({ children }) => {
  const elRef = useRef(null);

  // Create the element only once
  if (!elRef.current) {
    elRef.current = document.createElement("div");
    elRef.current.style.position = "absolute";
    elRef.current.style.zIndex = "9999";
  }

  useEffect(() => {
    const el = elRef.current;
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  return ReactDOM.createPortal(children, elRef.current);
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
let _itemCounter = 0;
function createEmptyItem() {
  _itemCounter++;
  return {
    id: `item_${Date.now()}_${_itemCounter}`,
    staff_name: "",
    staff_id: "",
    clients_name: "",
    clients_id: "",
    project: "",
    project_id: "",
    task: "",
    start_time: "",
    finish_time: "",
  };
}

const parseTimeToDate = (timeStr) => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  date.setSeconds(0);
  date.setMilliseconds(0); // Important: Zero out milliseconds to ensure strict equality
  return date;
};

const formatDateToTimeStr = (date) => {
  if (!date) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const CreateTimesheetForm = () => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { staff, searchStaff } = useStaffSearchStore();
  const { clients, searchClients } = useClientSearchStore();
  const { projects, searchProjects } = useProjectSearchStore();
  const { createTimesheet } = useTimesheetStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const navigate = useNavigate();

  const [deleteModal, setDeleteModal] = useState({ open: false, itemId: null });

  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [activeRowId, setActiveRowId] = useState(null);

  const [workDate, setWorkDate] = useState(new Date());
  const [timesheetItems, setTimesheetItems] = useState([createEmptyItem()]);
  const prevTimesheetItemsRef = useRef(timesheetItems);

  useEffect(() => {
    searchStaff("");
    searchClients("");
    searchProjects("");
  }, []);

  useEffect(() => {
    prevTimesheetItemsRef.current = timesheetItems;
  }, [timesheetItems]);

  const staffOptions = useMemo(() => staff.map((s) => ({ value: s.staff_id, label: s.staff_name })), [staff]);
  const clientOptions = useMemo(() => clients.map((c) => ({ value: c.clients_id || c.id, label: c.clients_name })), [clients]);
  const projectOptions = useMemo(() => projects.map((p) => ({ value: p.project_id || p.id, label: p.project_name })), [projects]);

  const validateItems = useCallback(() => {
    return timesheetItems.map((item) => {
      const e = {};
      if (!item.staff_name) e.staff_name = "Staff required";
      if (!item.clients_name) e.clients_name = "Client required";
      if (!item.task?.trim()) e.task = "Task required";
      if (!item.start_time) e.start_time = "Start time required";
      if (!item.finish_time) e.finish_time = "Finish time required";
      return e;
    });
  }, [timesheetItems]);

  const itemErrorMap = useMemo(() => {
    if (!submitted) return {};
    const errs = validateItems();
    const prevItems = prevTimesheetItemsRef.current;
    return Object.fromEntries(
      timesheetItems.map((item, i) => {
        const isNew = !prevItems.some((p) => p.id === item.id);
        if (isNew) return [item.id, {}];
        return [item.id, errs[i] || {}];
      })
    );
  }, [submitted, validateItems, timesheetItems]);

  const handleItemChange = (id, field, value) => {
    setTimesheetItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        if (field === "staff_name_obj") {
          updated.staff_name = value ? value.label : "";
          updated.staff_id = value ? value.value : "";
        }
        if (field === "client_name_obj") {
          updated.clients_name = value ? value.label : "";
          updated.clients_id = value ? value.value : "";
        }
        if (field === "project_name_obj") {
          updated.project = value ? value.label : "";
          updated.project_id = value ? value.value : "";
        }
        return updated;
      })
    );
  };

  const addItem = () => setTimesheetItems((prev) => [...prev, createEmptyItem()]);

  const requestRemoveItem = (itemId) => {
    if (timesheetItems.length === 1) return;
    setDeleteModal({ open: true, itemId });
  };

  const confirmRemoveItem = () => {
    setTimesheetItems((prev) => prev.filter((i) => i.id !== deleteModal.itemId));
    setDeleteModal({ open: false, itemId: null });
  };

  const handleStaffCreated = (newStaff) => {
    setShowCreateStaffModal(false);
    searchStaff("");
    if (newStaff && activeRowId) {
      setTimeout(() => {
        handleItemChange(activeRowId, "staff_name_obj", { value: newStaff.staff_id, label: newStaff.staff_name });
      }, 300);
    }
  };

  const handleClientCreated = (newClient) => {
    setShowCreateClientModal(false);
    searchClients("");
    if (newClient && activeRowId) {
      setTimeout(() => {
        handleItemChange(activeRowId, "client_name_obj", { value: newClient.clients_id, label: newClient.clients_name });
      }, 300);
    }
  };

  const handleProjectCreated = (newProject) => {
    setShowCreateProjectModal(false);
    searchProjects("");
    if (newProject && activeRowId) {
      setTimeout(() => {
        handleItemChange(activeRowId, "project_name_obj", { value: newProject.project_id, label: newProject.project_name });
      }, 300);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    const iErr = validateItems();
    const hasFieldErrors = iErr.some((rowE) => Object.keys(rowE).length > 0);

    if (hasFieldErrors) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsLoading(true);

    const payload = {
      date: workDate.toISOString().split("T")[0],
      staff_name: timesheetItems.map((i) => i.staff_name),
      staff_id: timesheetItems.map((i) => i.staff_id),
      clients_name: timesheetItems.map((i) => i.clients_name),
      clients_id: timesheetItems.map((i) => i.clients_id),
      project: timesheetItems.map((i) => i.project),
      task: timesheetItems.map((i) => i.task),
      start_time: timesheetItems.map((i) => i.start_time),
      finish_time: timesheetItems.map((i) => i.finish_time),
    };

    const result = await createTimesheet(payload);
    
    setIsLoading(false);
    
    if (result.success) {
      setSubmitted(false);
      setTimesheetItems([createEmptyItem()]);
      navigate("/timesheet/home");
    }
  };

  return (
    <>
      <motion.div 
        variants={fadeInUp} 
        initial="hidden" 
        animate="show" 
        transition={{ duration: 0.01, delay: 0.02, ease: "easeInOut" }} 
        className={`invoice-form-box theme-${theme}`}
      >
        <form className="invoice-form-f-container" onSubmit={handleSubmit} noValidate>
          
          <div className="invoice-form-header">
            <div className="invoice-form-htxt">Log Time</div>
            <div className="invoice-form-sub-htxt">Select a work date then add one or more staff entries below.</div>
          </div>

          <div className="invoice-form-flex-box">
            
            {/* Work Date */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${submitted && !workDate ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${submitted && !workDate ? "input-label-message" : ""}`} htmlFor="work_date">Work Date</label>
                  <div className="form-wrapper">
                    <DatePicker 
                      selected={workDate} 
                      onChange={(date) => setWorkDate(date)} 
                      className={`form-input ${submitted && !workDate ? "input-error" : ""}`} 
                      dateFormat="yyyy-MM-dd" 
                      wrapperClassName="input-date-picker" 
                      id="work_date" 
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"  
                    />
                    <span className={`chevron-input-icon fas fa-calendar ${submitted && !workDate ? "input-icon-error" : ""}`} />
                  </div>
                </div>
                {submitted && !workDate && <div className="input-error-message">Date is required</div>}
              </div>
            </div>

          </div>

          {/* ── TIMESHEET ITEMS TABLE ── */}
          <div className="invoice-form-full">
            <div className="invoice-items-table timesheet-items-table">
              <div className="invoice-table-header journal-table-header">
                <div className="invoice-table-cell">Staff Name</div>
                <div className="invoice-table-cell">Client</div>
                <div className="invoice-table-cell cell-small">Client ID</div>
                <div className="invoice-table-cell">Project</div>
                <div className="invoice-table-cell">Task</div>
                <div className="invoice-table-cell cell-small">Start</div>
                <div className="invoice-table-cell cell-small">Finish</div>
                <div className="invoice-table-cell cell-action">Action</div>
              </div>

              {timesheetItems.map((item) => {
                const rowErr = itemErrorMap[item.id] || {};

                return (
                  <div key={item.id} className="invoice-table-row">
                    
                    {/* Staff Name */}
                    <div className="invoice-table-cell">
                      <div className="inv-form-flex">
                        <div className="input-form-wrapper inv-form-flex-wrap" style={{ margin: 0 }}>
                          <div className={`input-form-group ${rowErr.staff_name ? "input-form-error" : ""}`}>
                            <div className="form-wrapper">
                              <Select
                                options={staffOptions}
                                onInputChange={(val) => { if (val.length > 1) searchStaff(val); }}
                                onMenuOpen={() => setOpenMenuId(`staff_${item.id}`)}
                                onMenuClose={() => { setOpenMenuId(null); searchStaff(""); }}
                                onChange={(opt) => handleItemChange(item.id, "staff_name_obj", opt)}
                                value={item.staff_name ? { value: item.staff_id, label: item.staff_name } : null}
                                placeholder="Search staff..."
                                className={`form-input-select ${rowErr.staff_name ? "input-error" : ""}`}
                                classNamePrefix="form-input-select"
                                isClearable
                                inputId={`staff_${item.id}`}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                              />
                              <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === `staff_${item.id}` ? "chevron-rotate" : "", rowErr.staff_name ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                            </div>
                          </div>
                          {rowErr.staff_name && <div className="input-error-message">{rowErr.staff_name}</div>}
                        </div>
                        <button type="button" className="inv-form-flex-btn" onClick={() => { setActiveRowId(item.id); setShowCreateStaffModal(true); }} title="Add New Staff">
                          <span className="fas fa-plus"></span>
                        </button>
                      </div>
                    </div>

                    {/* Client Name */}
                    <div className="invoice-table-cell">
                      <div className="inv-form-flex">
                        <div className="input-form-wrapper inv-form-flex-wrap" style={{ margin: 0 }}>
                          <div className={`input-form-group ${rowErr.clients_name ? "input-form-error" : ""}`}>
                            <div className="form-wrapper">
                              <Select
                                options={clientOptions}
                                onInputChange={(val) => { if (val.length > 1) searchClients(val); }}
                                onMenuOpen={() => setOpenMenuId(`client_${item.id}`)}
                                onMenuClose={() => { setOpenMenuId(null); searchClients(""); }}
                                onChange={(opt) => handleItemChange(item.id, "client_name_obj", opt)}
                                value={item.clients_name ? { value: item.clients_id, label: item.clients_name } : null}
                                placeholder="Search client..."
                                className={`form-input-select ${rowErr.clients_name ? "input-error" : ""}`}
                                classNamePrefix="form-input-select"
                                isClearable
                                inputId={`client_${item.id}`}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                              />
                              <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === `client_${item.id}` ? "chevron-rotate" : "", rowErr.clients_name ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                            </div>
                          </div>
                          {rowErr.clients_name && <div className="input-error-message">{rowErr.clients_name}</div>}
                        </div>
                        <button type="button" className="inv-form-flex-btn" onClick={() => { setActiveRowId(item.id); setShowCreateClientModal(true); }} title="Add New Client">
                          <span className="fas fa-plus"></span>
                        </button>
                      </div>
                    </div>

                    {/* Client ID (ReadOnly) */}
                    <div className="invoice-table-cell cell-small">
                      <div className="input-form-wrapper" style={{ margin: 0 }}>
                        <div className={`input-form-group`}>
                          <div className="form-wrapper">
                            <input 
                              type="text" 
                              className={`form-input form-input-number read-only-input`} 
                              value={item.clients_id} 
                              readOnly 
                              placeholder="ID" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Project */}
                    <div className="invoice-table-cell">
                      <div className="inv-form-flex">
                        <div className="input-form-wrapper inv-form-flex-wrap" style={{ margin: 0 }}>
                          <div className={`input-form-group`}>
                            <div className="form-wrapper">
                              <Select
                                options={projectOptions}
                                onInputChange={(val) => { if (val.length > 1) searchProjects(val); }}
                                onMenuOpen={() => setOpenMenuId(`project_${item.id}`)}
                                onMenuClose={() => { setOpenMenuId(null); searchProjects(""); }}
                                onChange={(opt) => handleItemChange(item.id, "project_name_obj", opt)}
                                value={item.project ? { value: item.project_id, label: item.project } : null}
                                placeholder="Search project..."
                                className="form-input-select"
                                classNamePrefix="form-input-select"
                                isClearable
                                inputId={`project_${item.id}`}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                              />
                              <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === `project_${item.id}` ? "chevron-rotate" : ""].filter(Boolean).join(" ")} />
                            </div>
                          </div>
                        </div>
                        <button type="button" className="inv-form-flex-btn" onClick={() => { setActiveRowId(item.id); setShowCreateProjectModal(true); }} title="Add New Project">
                          <span className="fas fa-plus"></span>
                        </button>
                      </div>
                    </div>

                    {/* Task */}
                    <div className="invoice-table-cell">
                      <div className="input-form-wrapper" style={{ margin: 0 }}>
                        <div className={`input-form-group ${rowErr.task ? "input-form-error" : ""}`}>
                          <div className="form-wrapper">
                            <input 
                              type="text" 
                              className={`form-input ${rowErr.task ? "input-error" : ""}`} 
                              value={item.task} 
                              onChange={(e) => handleItemChange(item.id, "task", e.target.value)} 
                              placeholder="Task desc" 
                            />
                          </div>
                        </div>
                        {rowErr.task && <div className="input-error-message">{rowErr.task}</div>}
                      </div>
                    </div>

                    {/* Start Time */}
                    <div className="invoice-table-cell cell-small">
                      <div className="input-form-wrapper" style={{ margin: 0 }}>
                        <div className={`input-form-group ${rowErr.start_time ? "input-form-error" : ""}`}>
                          <div className="form-wrapper">
                            <DatePicker
                              selected={parseTimeToDate(item.start_time)}
                              onChange={(date) => handleItemChange(item.id, "start_time", formatDateToTimeStr(date))}
                              showTimeSelect
                              showTimeSelectOnly
                              timeIntervals={15}
                              timeCaption="Time"
                              dateFormat="h:mm aa"
                              className={`form-input ${rowErr.start_time ? "input-error" : ""}`}
                              wrapperClassName="input-date-picker"
                              id={`start_${item.id}`}
                              popperContainer={CalendarPortal}
                            />
                            <span className={`chevron-input-icon fas fa-clock ${rowErr.start_time ? "input-icon-error" : ""}`} />
                          </div>
                        </div>
                        {rowErr.start_time && <div className="input-error-message">{rowErr.start_time}</div>}
                      </div>
                    </div>

                    {/* Finish Time */}
                    <div className="invoice-table-cell cell-small">
                      <div className="input-form-wrapper" style={{ margin: 0 }}>
                        <div className={`input-form-group ${rowErr.finish_time ? "input-form-error" : ""}`}>
                          <div className="form-wrapper">
                            <DatePicker
                              selected={parseTimeToDate(item.finish_time)}
                              onChange={(date) => handleItemChange(item.id, "finish_time", formatDateToTimeStr(date))}
                              showTimeSelect
                              showTimeSelectOnly
                              timeIntervals={15}
                              timeCaption="Time"
                              dateFormat="h:mm aa"
                              className={`form-input ${rowErr.finish_time ? "input-error" : ""}`}
                              wrapperClassName="input-date-picker"
                              id={`finish_${item.id}`}
                              popperContainer={CalendarPortal}
                            />
                            <span className={`chevron-input-icon fas fa-clock ${rowErr.finish_time ? "input-icon-error" : ""}`} />
                          </div>
                        </div>
                        {rowErr.finish_time && <div className="input-error-message">{rowErr.finish_time}</div>}
                      </div>
                    </div>

                    {/* Remove Row */}
                    <div className="invoice-table-cell cell-action">
                      <button type="button" onClick={() => requestRemoveItem(item.id)} className="invoice-remove-btn" disabled={timesheetItems.length === 1} title="Remove row">
                        <span className="fas fa-trash" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SUMMARY ── */}
          <div className="invoice-form-summary">
            <button type="button" onClick={addItem} className="invoice-add-btn">
              <span className="fas fa-plus-circle" /> Add Row
            </button>
          </div>

          {/* ── SUBMIT ── */}
          <div className="invoice-action-btn">
            <div className="invoice-action-btn-wrapper">
              <button type="submit" disabled={isLoading} className="invoice-submit-btn">
                {isLoading ? (<div className="invoice-loader" />) : (<span className="invoice-submit-btn-text">Submit Timesheet</span>)}
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {deleteModal.open && (
          <DeleteLineItemModal 
            isOpen={deleteModal.open} 
            onClose={() => setDeleteModal({ open: false, itemId: null })} 
            onConfirm={confirmRemoveItem} 
            isNew={true} 
          />
        )}
        {showCreateStaffModal && (
          <CreateStaffModal 
            isOpen={showCreateStaffModal} 
            onClose={() => setShowCreateStaffModal(false)} 
            onStaffCreated={handleStaffCreated} 
          />
        )}
        {showCreateClientModal && (
          <CreateClientsModal 
            isOpen={showCreateClientModal} 
            onClose={() => setShowCreateClientModal(false)} 
            onClientCreated={handleClientCreated} 
          />
        )}
        {showCreateProjectModal && (
          <CreateProjectModal 
            isOpen={showCreateProjectModal} 
            onClose={() => setShowCreateProjectModal(false)} 
            onProjectCreated={handleProjectCreated} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default CreateTimesheetForm;