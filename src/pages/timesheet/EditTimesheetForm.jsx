import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion"; // Added AnimatePresence
import { fadeInUp } from "../../utils/animation";
import useThemeStore from "../../stores/useThemeStore";
import useTimesheetStore from "../../stores/useTimesheetStore";
import useTimesheetReferenceStore from "../../stores/useTimesheetReferenceStore";
import useAuthStore from "../../stores/useAuthStore";
import useToastStore from "../../stores/useToastStore";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../inputs-styles/Inputs.css";

// Import Modals
import CreateStaffModal from "../../components/modals/CreateStaffModal";
import CreateClientsModal from "../../components/modals/CreateClientsModal";
import CreateProjectModal from "../../components/modals/CreateProjectModal";

/* ─────────────────────────────────────────────
   Main Form Component
───────────────────────────────────────────── */
const EditTimesheetForm = ({ timesheetId, timesheet }) => {
  const { theme } = useThemeStore();
  const { updateTimesheet } = useTimesheetStore();
  const { staff, clients, projects, searchStaff, searchClients, searchProjects } = useTimesheetReferenceStore();
  const { user } = useAuthStore();
  const isTimesheetUser = user?.integrity === "Timesheet";
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Modal States
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

  const [form, setForm] = useState({
    id: "",
    date: null, 
    staff_name: "",
    staff_id: "",
    clients_name: "",
    clients_id: "",
    project: "",
    project_id: "", // Added project_id if needed
    task: "",
    start_time: "", 
    finish_time: "", 
  });

  /* ── Time Helpers ── */
  const parseTimeToDate = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    date.setSeconds(0);
    return date;
  };

  const formatDateToTimeStr = (date) => {
    if (!date) return "";
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  /* ── On mount: fetch dropdowns & populate form ── */
  useEffect(() => {
    searchStaff("");
    searchClients("");
    searchProjects("");
  }, []);

  useEffect(() => {
    if (!timesheet) return;
    setForm({
      id: timesheet.id ?? "",
      date: timesheet.date ? new Date(timesheet.date) : new Date(),
      staff_name: timesheet.staff_name ?? "",
      staff_id: timesheet.staff_id ?? "",
      clients_name: timesheet.clients_name ?? "",
      clients_id: timesheet.clients_id ?? "",
      project: timesheet.project ?? "",
      project_id: timesheet.project_id ?? "",
      task: timesheet.task ?? "",
      start_time: timesheet.start_time ?? "",
      finish_time: timesheet.finish_time ?? "",
    });
  }, [timesheet]);

  /* ── Options for React Select ── */
  const staffOptions = useMemo(() => {
    return staff.map((s) => ({ value: s.staff_id, label: s.staff_name }));
  }, [staff]);

  const clientOptions = useMemo(() => {
    return clients.map((c) => ({ value: c.clients_id || c.id, label: c.clients_name }));
  }, [clients]);

  const projectOptions = useMemo(() => {
    return projects.map((p) => ({ value: p.project_id || p.id, label: p.project_name }));
  }, [projects]);

  /* ── Validation ── */
  const validateForm = () => {
    const e = {};
    if (!form.date) e.date = "Work date is required";
    if (!form.staff_name) e.staff_name = "Staff is required";
    if (!form.clients_name) e.clients_name = "Client is required";
    if (!form.task?.trim()) e.task = "Task is required";
    if (!form.start_time) e.start_time = "Start time is required";
    if (!form.finish_time) e.finish_time = "Finish time is required";
    return e;
  };

  const errors = useMemo(() => (submitted ? validateForm() : {}), [submitted, form]);

  /* ── Handlers ── */
  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStaffChange = (opt) => {
    setForm((prev) => ({
      ...prev,
      staff_name: opt ? opt.label : "",
      staff_id: opt ? opt.value : "",
    }));
  };

  const handleClientChange = (opt) => {
    setForm((prev) => ({
      ...prev,
      clients_name: opt ? opt.label : "",
      clients_id: opt ? opt.value : "",
    }));
  };

  const handleProjectChange = (opt) => {
    setForm((prev) => ({
      ...prev,
      project: opt ? opt.label : "",
      project_id: opt ? opt.value : "",
    }));
  };

  // Modal Callbacks
  const handleStaffCreated = (newStaff) => {
    setShowCreateStaffModal(false);
    searchStaff("");
    if (newStaff) {
      handleStaffChange({ value: newStaff.staff_id, label: newStaff.staff_name });
    }
  };

  const handleClientCreated = (newClient) => {
    setShowCreateClientModal(false);
    searchClients("");
    if (newClient) {
      handleClientChange({ value: newClient.clients_id, label: newClient.clients_name });
    }
  };

  const handleProjectCreated = (newProject) => {
    setShowCreateProjectModal(false);
    searchProjects("");
    if (newProject) {
      handleProjectChange({ value: newProject.project_id, label: newProject.project_name });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    const valErrors = validateForm();
    if (Object.keys(valErrors).length > 0) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsLoading(true);

    const payload = {
      ...form,
      date: form.date.toISOString().split("T")[0],
    };

    const result = await updateTimesheet(payload);
    setIsLoading(false);

    if (result.success) {
      navigate(`/timesheet/view/${form.id}`);
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
            <div className="invoice-form-htxt">Edit Timesheet Entry</div>
            <div className="invoice-form-sub-htxt">
              Updating entry for <strong>{timesheet?.staff_name}</strong> on{" "}
              <strong>{timesheet?.date ? new Date(timesheet.date).toLocaleDateString('en-GB') : ''}</strong>.
            </div>
          </div>

          <div className="invoice-form-flex-box">

            {/* Work Date */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.date ? "input-form-error" : ""}`}>
                  <label className="input-form-label">Work Date</label>
                  <div className="form-wrapper">
                    <DatePicker
                      selected={form.date}
                      onChange={(date) => handleFieldChange("date", date)}
                      className={`form-input ${errors.date ? "input-error" : ""}`}
                      dateFormat="yyyy-MM-dd"
                      wrapperClassName="input-date-picker"
                      id="work_date"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                    <span className={`chevron-input-icon fas fa-calendar ${errors.date ? "input-icon-error" : ""}`} />
                  </div>
                </div>
                {errors.date && <div className="input-error-message">{errors.date}</div>}
              </div>
            </div>

            {/* Staff Name */}
            <div className="invoice-form invoice-form-three">
              <div className="inv-form-flex">
                <div className="input-form-wrapper inv-form-flex-wrap">
                  <div className={`input-form-group ${errors.staff_name ? "input-form-error" : ""}`}>
                    <label className="input-form-label">Staff</label>
                    <div className="form-wrapper">
                      <Select
                        options={staffOptions}
                        onInputChange={(val) => { if (val.length > 1) searchStaff(val); }}
                        onMenuOpen={() => setOpenMenuId("staff")}
                        onMenuClose={() => { setOpenMenuId(null); searchStaff(""); }}
                        onChange={handleStaffChange}
                        value={form.staff_name ? { value: form.staff_id, label: form.staff_name } : null}
                        placeholder="Search staff..."
                        className={`form-input-select ${errors.staff_name ? "input-error" : ""}`}
                        classNamePrefix="form-input-select"
                        isClearable={!isTimesheetUser}
                        isDisabled={isTimesheetUser}
                        inputId="staff_name"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                      />
                      <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "staff" ? "chevron-rotate" : "", errors.staff_name ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                    </div>
                  </div>
                  {errors.staff_name && <div className="input-error-message">{errors.staff_name}</div>}
                </div>
                {!isTimesheetUser && (
                  <button type="button" className="inv-form-flex-btn" onClick={() => setShowCreateStaffModal(true)} title="Add New Staff">
                    <span className="fas fa-plus"></span>
                  </button>
                )}
              </div>
            </div>

            {/* Client Name */}
            <div className="invoice-form invoice-form-three">
              <div className="inv-form-flex">
                <div className="input-form-wrapper inv-form-flex-wrap">
                  <div className={`input-form-group ${errors.clients_name ? "input-form-error" : ""}`}>
                    <label className="input-form-label">Client</label>
                    <div className="form-wrapper">
                      <Select
                        options={clientOptions}
                        onInputChange={(val) => { if (val.length > 1) searchClients(val); }}
                        onMenuOpen={() => setOpenMenuId("client")}
                        onMenuClose={() => { setOpenMenuId(null); searchClients(""); }}
                        onChange={handleClientChange}
                        value={form.clients_name ? { value: form.clients_id, label: form.clients_name } : null}
                        placeholder="Search client..."
                        className={`form-input-select ${errors.clients_name ? "input-error" : ""}`}
                        classNamePrefix="form-input-select"
                        isClearable
                        inputId="clients_name"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                      />
                      <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "client" ? "chevron-rotate" : "", errors.clients_name ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                    </div>
                  </div>
                  {errors.clients_name && <div className="input-error-message">{errors.clients_name}</div>}
                </div>
                {!isTimesheetUser && (
                  <button type="button" className="inv-form-flex-btn" onClick={() => setShowCreateClientModal(true)} title="Add New Client">
                    <span className="fas fa-plus"></span>
                  </button>
                )}
              </div>
            </div>

            {/* Client ID (ReadOnly) */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className="input-form-group">
                  <label className="input-form-label">Client ID</label>
                  <div className="form-wrapper">
                    <input 
                      type="text" 
                      className="form-input" 
                      value={form.clients_id} 
                      readOnly 
                      placeholder="Auto-filled" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Project */}
            <div className="invoice-form invoice-form-three">
              <div className="inv-form-flex">
                <div className="input-form-wrapper inv-form-flex-wrap">
                  <div className="input-form-group">
                    <label className="input-form-label">Project</label>
                    <div className="form-wrapper">
                      <Select
                        options={projectOptions}
                        onInputChange={(val) => { if (val.length > 1) searchProjects(val); }}
                        onMenuOpen={() => setOpenMenuId("project")}
                        onMenuClose={() => { setOpenMenuId(null); searchProjects(""); }}
                        onChange={handleProjectChange}
                        value={form.project ? { value: form.project_id, label: form.project } : null}
                        placeholder="Search project..."
                        className="form-input-select"
                        classNamePrefix="form-input-select"
                        isClearable
                        inputId="project"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                      />
                      <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "project" ? "chevron-rotate" : ""].filter(Boolean).join(" ")} />
                    </div>
                  </div>
                </div>
                {!isTimesheetUser && (
                  <button type="button" className="inv-form-flex-btn" onClick={() => setShowCreateProjectModal(true)} title="Add New Project">
                    <span className="fas fa-plus"></span>
                  </button>
                )}
              </div>
            </div>

            {/* Task */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.task ? "input-form-error" : ""}`}>
                  <label className="input-form-label">Task</label>
                  <div className="form-wrapper">
                    <input 
                      type="text" 
                      className={`form-input ${errors.task ? "input-error" : ""}`}
                      value={form.task} 
                      onChange={(e) => handleFieldChange("task", e.target.value)} 
                      placeholder="Describe the work" 
                    />
                  </div>
                </div>
                {errors.task && <div className="input-error-message">{errors.task}</div>}
              </div>
            </div>

            {/* Start Time */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.start_time ? "input-form-error" : ""}`}>
                  <label className="input-form-label">Start Time</label>
                  <div className="form-wrapper">
                    <DatePicker
                      selected={parseTimeToDate(form.start_time)}
                      onChange={(date) => handleFieldChange("start_time", formatDateToTimeStr(date))}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      className={`form-input ${errors.start_time ? "input-error" : ""}`}
                      wrapperClassName="input-date-picker"
                      id="start_time"
                    />
                    <span className={`chevron-input-icon fas fa-clock ${errors.start_time ? "input-icon-error" : ""}`} />
                  </div>
                </div>
                {errors.start_time && <div className="input-error-message">{errors.start_time}</div>}
              </div>
            </div>

            {/* Finish Time */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.finish_time ? "input-form-error" : ""}`}>
                  <label className="input-form-label">Finish Time</label>
                  <div className="form-wrapper">
                    <DatePicker
                      selected={parseTimeToDate(form.finish_time)}
                      onChange={(date) => handleFieldChange("finish_time", formatDateToTimeStr(date))}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      className={`form-input ${errors.finish_time ? "input-error" : ""}`}
                      wrapperClassName="input-date-picker"
                      id="finish_time"
                    />
                    <span className={`chevron-input-icon fas fa-clock ${errors.finish_time ? "input-icon-error" : ""}`} />
                  </div>
                </div>
                {errors.finish_time && <div className="input-error-message">{errors.finish_time}</div>}
              </div>
            </div>

          </div>

          {/* ── SUBMIT ── */}
          <div className="invoice-action-btn">
            <div className="invoice-action-btn-wrapper">
              <button
                type="button"
                className="form-btn form-btn-cancel"
                onClick={() => navigate(`/timesheet/view/${form.id}`)}
                disabled={isLoading}
                style={{ marginRight: '12px', background: 'var(--f-surface)', color: 'var(--f-text-muted)', border: '1px solid var(--f-border)', padding: '0 20px', height: '46px', borderRadius: '10px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="invoice-submit-btn">
                {isLoading ? (<div className="invoice-loader" />) : (<span className="invoice-submit-btn-text">Save Changes</span>)}
              </button>
            </div>
          </div>

        </form>
      </motion.div>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {!isTimesheetUser && showCreateStaffModal && (
          <CreateStaffModal 
            isOpen={showCreateStaffModal} 
            onClose={() => setShowCreateStaffModal(false)} 
            onStaffCreated={handleStaffCreated} 
          />
        )}
        {!isTimesheetUser && showCreateClientModal && (
          <CreateClientsModal 
            isOpen={showCreateClientModal} 
            onClose={() => setShowCreateClientModal(false)} 
            onClientCreated={handleClientCreated} 
          />
        )}
        {!isTimesheetUser && showCreateProjectModal && (
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

export default EditTimesheetForm;