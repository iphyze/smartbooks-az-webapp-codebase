import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import NavBar from "../NavBar";
import Header from "../Header";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import ErrorModal from "../../components/modals/ErrorModal";
import OverviewWorkspace, { OverviewBadge, OverviewRowActions } from "../../components/overview/OverviewWorkspace";
import useThemeStore from "../../stores/useThemeStore";
import useTimesheetStore from "../../stores/useTimesheetStore";
import {
  formatOverviewDate,
  formatOverviewNumber,
  getOverviewInitials,
  getOverviewPageNumbers,
  overviewDeleteActions,
  overviewPageLimits,
  uniqueOverviewCount,
} from "../../utils/overviewHelpers";

const formatHours = (value) => `${Number(value || 0).toFixed(2)} hrs`;

const TimesheetOverview = () => {
  const [nav, setNav] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const {
    data, loading, error, total, currentPage, itemsPerPage, sortBy, sortOrder,
    searchQuery, selectedItems, fetchData, setCurrentPage, setItemsPerPage,
    setSearchQuery, setSorting, toggleItemSelection, clearSelection,
    deleteSelectedItems, deleteSingleItem, getTotalPages,
  } = useTimesheetStore();

  useEffect(() => {
    document.title = "Smartbooks | Timesheet Overview";
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, sortBy, sortOrder, fetchData]);

  const totalPages = getTotalPages();
  const currentPageIds = useMemo(() => data.map((item) => item.id), [data]);
  const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedItems.includes(id));
  const displayedHours = data.reduce((sum, item) => sum + Number(item.total_hours || 0), 0);

  const handleSort = (key) => setSorting(key, sortBy === key && sortOrder === "ASC" ? "DESC" : "ASC");
  const sortIcon = (key) => sortBy !== key
    ? <i className="fas fa-sort invoice-sort-icon invoice-sort-icon--idle" />
    : <i className={`fas ${sortOrder === "ASC" ? "fa-sort-up" : "fa-sort-down"} invoice-sort-icon`} />;

  const handleSelectAll = () => {
    useTimesheetStore.setState({
      selectedItems: allSelected
        ? selectedItems.filter((id) => !currentPageIds.includes(id))
        : [...new Set([...selectedItems, ...currentPageIds])],
    });
  };

  const openSingleDelete = (id) => {
    setDeleteTarget(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (deleteTarget) await deleteSingleItem(deleteTarget);
    else await deleteSelectedItems();
    setShowDeleteModal(false);
    setSelectedAction("");
    setDeleteTarget(null);
    clearSelection();
  };

  const rowActions = (entry, compact = false) => (
    <OverviewRowActions compact={compact} actions={[
      { key: "view", label: "View", icon: "fa-arrow-up-right-from-square", tone: "view", onClick: () => navigate(`/timesheet/view/${entry.id}`) },
      { key: "edit", label: "Edit", icon: "fa-pen", tone: "edit", onClick: () => navigate(`/timesheet/edit/${entry.id}`) },
      { key: "delete", label: "Delete", icon: "fa-trash", tone: "delete", onClick: () => openSingleDelete(entry.id) },
    ]} />
  );

  const columns = [
    { key: "date", label: "Date", sortKey: "date", onSort: handleSort, sortIcon, render: (entry) => <span className="entity-overview-mono">{formatOverviewDate(entry.date)}</span> },
    {
      key: "staff", label: "Staff member", sortKey: "staff_name", onSort: handleSort, sortIcon,
      render: (entry) => (
        <div className="entity-overview-primary">
          <span className="entity-overview-avatar">{getOverviewInitials(entry.staff_name, "ST")}</span>
          <div><strong>{entry.staff_name || "Unassigned staff"}</strong><small>{entry.clients_name || "No client"}</small></div>
        </div>
      ),
    },
    { key: "client", label: "Client", render: (entry) => <span className="entity-overview-muted">{entry.clients_name || "—"}</span> },
    { key: "start", label: "Start", render: (entry) => <span className="entity-overview-mono">{entry.start_time || "—"}</span> },
    { key: "finish", label: "Finish", render: (entry) => <span className="entity-overview-mono">{entry.finish_time || "—"}</span> },
    { key: "hours", label: "Hours", sortKey: "total_hours", onSort: handleSort, sortIcon, render: (entry) => <OverviewBadge tone="teal" icon="fa-clock">{formatHours(entry.total_hours)}</OverviewBadge> },
    { key: "actions", label: "Actions", render: (entry) => rowActions(entry) },
  ];

  const cards = [
    { key: "total", label: "Timesheet entries", value: formatOverviewNumber(total), note: "Full time register", icon: "fa-clock", tone: "teal" },
    { key: "hours", label: "Hours displayed", value: displayedHours.toFixed(2), note: "Current page total", icon: "fa-business-time", tone: "blue" },
    { key: "staff", label: "Staff shown", value: formatOverviewNumber(uniqueOverviewCount(data, (item) => item.staff_name)), note: "Distinct on this page", icon: "fa-users", tone: "violet" },
    { key: "clients", label: "Clients shown", value: formatOverviewNumber(uniqueOverviewCount(data, (item) => item.clients_name)), note: "Distinct on this page", icon: "fa-address-book", tone: "green" },
  ];

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <OverviewWorkspace
          theme={theme}
          pageTitle="Timesheet Overview"
          links={[{ label: "Home", to: "/", active: true }, { label: "Timesheets", to: "/timesheet/home", active: false }]}
          hero={{
            icon: "fa-clock",
            eyebrow: "Time workspace",
            title: "Review recorded time in one focused workspace",
            description: "Track staff, client, time range and hours while preserving every existing timesheet view, edit and delete action.",
            createLink: "/timesheet/create-timesheet",
            createLabel: "Log time",
          }}
          cards={cards}
          register={{ eyebrow: "Time register", title: "All timesheet entries", itemLabel: "timesheet entry" }}
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
          searchPlaceholder="Search date, staff or client"
          pageLimitOptions={overviewPageLimits}
          onItemsPerPageChange={setItemsPerPage}
          selectedCount={selectedItems.length}
          selectedAction={selectedAction}
          actionOptions={overviewDeleteActions}
          onActionChange={(action) => { setSelectedAction(action); setDeleteTarget(null); if (action === "delete") setShowDeleteModal(true); }}
          onClearSelection={clearSelection}
          columns={columns}
          getRowKey={(entry) => entry.id}
          isSelected={(entry) => selectedItems.includes(entry.id)}
          onToggleSelection={(entry) => toggleItemSelection(entry.id)}
          allSelected={allSelected}
          onToggleSelectAll={handleSelectAll}
          mobile={{
            title: (entry) => entry.staff_name || "Unassigned staff",
            subtitle: (entry) => formatOverviewDate(entry.date),
            badge: (entry) => <OverviewBadge tone="teal">{formatHours(entry.total_hours)}</OverviewBadge>,
            fields: [
              { key: "client", label: "Client", render: (entry) => entry.clients_name || "—", wide: true },
              { key: "start", label: "Start", render: (entry) => entry.start_time || "—" },
              { key: "finish", label: "Finish", render: (entry) => entry.finish_time || "—" },
            ],
            actions: (entry) => rowActions(entry, true),
          }}
          pageNumbers={getOverviewPageNumbers(totalPages, currentPage)}
          onPageChange={(page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); }}
          empty={{ icon: "fas fa-clock", message: "No timesheet entries found matching your criteria", link: "/timesheet/create-timesheet" }}
        />

        <AnimatePresence>
          {showDeleteModal && (
            <DeleteConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => { setShowDeleteModal(false); setSelectedAction(""); setDeleteTarget(null); clearSelection(); }}
              onConfirm={handleDelete}
              count={deleteTarget ? 1 : selectedItems.length}
              page="timesheet"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {error && <ErrorModal isOpen={Boolean(error)} onClose={() => useTimesheetStore.setState({ error: null })} onRetry={fetchData} message={error} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TimesheetOverview;
