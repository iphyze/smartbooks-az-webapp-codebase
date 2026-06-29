import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import NavBar from "../NavBar";
import Header from "../Header";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import ErrorModal from "../../components/modals/ErrorModal";
import OverviewWorkspace, { OverviewBadge, OverviewRowActions } from "../../components/overview/OverviewWorkspace";
import useThemeStore from "../../stores/useThemeStore";
import useStaffStore from "../../stores/useStaffStore";
import {
  formatOverviewDate,
  formatOverviewNumber,
  getOverviewInitials,
  getOverviewPageNumbers,
  overviewDeleteActions,
  overviewPageLimits,
  uniqueOverviewCount,
} from "../../utils/overviewHelpers";

const StaffOverview = () => {
  const [nav, setNav] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const {
    data, loading, error, total, currentPage, itemsPerPage, sortBy, sortOrder,
    searchQuery, selectedItems, fetchData, setCurrentPage, setItemsPerPage,
    setSearchQuery, setSorting, toggleItemSelection, clearSelection,
    deleteSelectedItems, getTotalPages,
  } = useStaffStore();

  useEffect(() => {
    document.title = "Smartbooks | Staff Overview";
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, sortBy, sortOrder, fetchData]);

  const totalPages = getTotalPages();
  const currentPageIds = useMemo(() => data.map((item) => item.staff_id), [data]);
  const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedItems.includes(id));
  const currentYear = new Date().getFullYear();

  const handleSort = (key) => setSorting(key, sortBy === key && sortOrder === "ASC" ? "DESC" : "ASC");
  const sortIcon = (key) => sortBy !== key
    ? <i className="fas fa-sort invoice-sort-icon invoice-sort-icon--idle" />
    : <i className={`fas ${sortOrder === "ASC" ? "fa-sort-up" : "fa-sort-down"} invoice-sort-icon`} />;

  const handleSelectAll = () => {
    useStaffStore.setState({
      selectedItems: allSelected
        ? selectedItems.filter((id) => !currentPageIds.includes(id))
        : [...new Set([...selectedItems, ...currentPageIds])],
    });
  };

  const openSingleDelete = (staffId) => {
    useStaffStore.setState({ selectedItems: [staffId] });
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    await deleteSelectedItems();
    setShowDeleteModal(false);
    setSelectedAction("");
    clearSelection();
  };

  const rowActions = (staff, compact = false) => (
    <OverviewRowActions compact={compact} actions={[
      { key: "view", label: "View", icon: "fa-arrow-up-right-from-square", tone: "view", onClick: () => navigate(`/staff/view/${staff.staff_id}`, { state: { staff } }) },
      { key: "edit", label: "Edit", icon: "fa-pen", tone: "edit", onClick: () => navigate(`/staff/edit/${staff.staff_id}`, { state: { staff } }) },
      { key: "delete", label: "Delete", icon: "fa-trash", tone: "delete", onClick: () => openSingleDelete(staff.staff_id) },
    ]} />
  );

  const columns = [
    { key: "id", label: "Staff ID", sortKey: "staff_id", onSort: handleSort, sortIcon, render: (staff) => <span className="entity-overview-mono">{staff.staff_id || "—"}</span> },
    {
      key: "name", label: "Staff member", sortKey: "staff_name", onSort: handleSort, sortIcon,
      render: (staff) => (
        <div className="entity-overview-primary">
          <span className="entity-overview-avatar">{getOverviewInitials(staff.staff_name, "ST")}</span>
          <div>
            <button type="button" className="entity-overview-link" onClick={() => navigate(`/staff/view/${staff.staff_id}`, { state: { staff } })}>{staff.staff_name || "Unnamed staff"}</button>
            <small>{staff.staff_email || "No email address"}</small>
          </div>
        </div>
      ),
    },
    { key: "job", label: "Job title", sortKey: "job_title", onSort: handleSort, sortIcon, render: (staff) => <OverviewBadge tone="violet">{staff.job_title || "Not assigned"}</OverviewBadge> },
    { key: "email", label: "Email", render: (staff) => staff.staff_email ? <a className="entity-overview-link" href={`mailto:${staff.staff_email}`}>{staff.staff_email}</a> : <span className="entity-overview-muted">—</span> },
    { key: "phone", label: "Phone", render: (staff) => <span className="entity-overview-mono">{staff.staff_tel || "—"}</span> },
    { key: "joined", label: "Date joined", sortKey: "date_of_joining", onSort: handleSort, sortIcon, render: (staff) => <span className="entity-overview-muted">{formatOverviewDate(staff.date_of_joining)}</span> },
    { key: "actions", label: "Actions", render: (staff) => rowActions(staff) },
  ];

  const cards = [
    { key: "total", label: "Staff records", value: formatOverviewNumber(total), note: "Full staff directory", icon: "fa-id-badge", tone: "teal" },
    { key: "roles", label: "Job titles shown", value: formatOverviewNumber(uniqueOverviewCount(data, (item) => item.job_title)), note: "Distinct on this page", icon: "fa-briefcase", tone: "violet" },
    { key: "new", label: `Joined in ${currentYear}`, value: formatOverviewNumber(data.filter((item) => new Date(item.date_of_joining).getFullYear() === currentYear).length), note: "Records on this page", icon: "fa-user-plus", tone: "green" },
    { key: "selected", label: "Selected staff", value: formatOverviewNumber(selectedItems.length), note: "Ready for bulk action", icon: "fa-circle-check", tone: "amber" },
  ];

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <OverviewWorkspace
          theme={theme}
          pageTitle="Staff Overview"
          links={[{ label: "Home", to: "/", active: true }, { label: "Staff", to: "/staff/home", active: false }]}
          hero={{
            icon: "fa-id-badge",
            eyebrow: "People directory",
            title: "A polished directory for every staff record",
            description: "Keep staff identities, roles and contact details organised for timesheets, projects and day-to-day administration.",
            createLink: "/staff/create-staff",
            createLabel: "Add staff",
          }}
          cards={cards}
          register={{ eyebrow: "Staff register", title: "All staff", itemLabel: "staff record" }}
          data={data}
          loading={loading}
          total={total}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalPages={totalPages}
          searchQuery={searchQuery}
          onSearchChange={(event) => { setSearchQuery(event.target.value); if (!event.target.value) fetchData(); }}
          onSearchSubmit={fetchData}
          onClearSearch={() => { setSearchQuery(""); fetchData(); }}
          searchPlaceholder="Search staff ID, name, title or email"
          pageLimitOptions={overviewPageLimits}
          onItemsPerPageChange={setItemsPerPage}
          selectedCount={selectedItems.length}
          selectedAction={selectedAction}
          actionOptions={overviewDeleteActions}
          onActionChange={(action) => { setSelectedAction(action); if (action === "delete") setShowDeleteModal(true); }}
          onClearSelection={clearSelection}
          columns={columns}
          getRowKey={(staff) => staff.staff_id}
          isSelected={(staff) => selectedItems.includes(staff.staff_id)}
          onToggleSelection={(staff) => toggleItemSelection(staff.staff_id)}
          allSelected={allSelected}
          onToggleSelectAll={handleSelectAll}
          mobile={{
            title: (staff) => staff.staff_name || "Unnamed staff",
            subtitle: (staff) => `Staff ${staff.staff_id || "—"}`,
            badge: (staff) => <OverviewBadge tone="violet">{staff.job_title || "Not assigned"}</OverviewBadge>,
            fields: [
              { key: "email", label: "Email", render: (staff) => staff.staff_email || "—", wide: true },
              { key: "phone", label: "Phone", render: (staff) => staff.staff_tel || "—" },
              { key: "joined", label: "Date joined", render: (staff) => formatOverviewDate(staff.date_of_joining) },
            ],
            actions: (staff) => rowActions(staff, true),
          }}
          pageNumbers={getOverviewPageNumbers(totalPages, currentPage)}
          onPageChange={(page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); }}
          empty={{ icon: "fas fa-id-badge", message: "No staff records found matching your criteria", link: "/staff/create-staff" }}
        />

        <AnimatePresence>
          {showDeleteModal && (
            <DeleteConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => { setShowDeleteModal(false); setSelectedAction(""); clearSelection(); }}
              onConfirm={handleDelete}
              count={selectedItems.length}
              page="staff"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {error && <ErrorModal isOpen={Boolean(error)} onClose={() => useStaffStore.setState({ error: null })} onRetry={fetchData} message={error} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StaffOverview;
