import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import NavBar from "../NavBar";
import Header from "../Header";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import ErrorModal from "../../components/modals/ErrorModal";
import OverviewWorkspace, { OverviewBadge, OverviewRowActions } from "../../components/overview/OverviewWorkspace";
import useThemeStore from "../../stores/useThemeStore";
import useProjectStore from "../../stores/useProjectStore";
import {
  formatOverviewDate,
  formatOverviewNumber,
  getOverviewInitials,
  getOverviewPageNumbers,
  overviewDeleteActions,
  overviewPageLimits,
} from "../../utils/overviewHelpers";

const ProjectOverview = () => {
  const [nav, setNav] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const {
    data, loading, error, total, currentPage, itemsPerPage, sortBy, sortOrder,
    searchQuery, selectedItems, fetchData, setCurrentPage, setItemsPerPage,
    setSearchQuery, setSorting, toggleItemSelection, clearSelection,
    deleteSelectedItems, exportToExcel, getTotalPages,
  } = useProjectStore();

  useEffect(() => {
    document.title = "Smartbooks | Project Overview";
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, sortBy, sortOrder, fetchData]);

  const totalPages = getTotalPages();
  const currentPageIds = useMemo(() => data.map((item) => item.id), [data]);
  const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedItems.includes(id));
  const currentYear = new Date().getFullYear();

  const handleSort = (key) => setSorting(key, sortBy === key && sortOrder === "ASC" ? "DESC" : "ASC");
  const sortIcon = (key) => sortBy !== key
    ? <i className="fas fa-sort invoice-sort-icon invoice-sort-icon--idle" />
    : <i className={`fas ${sortOrder === "ASC" ? "fa-sort-up" : "fa-sort-down"} invoice-sort-icon`} />;

  const handleSelectAll = () => {
    useProjectStore.setState({
      selectedItems: allSelected
        ? selectedItems.filter((id) => !currentPageIds.includes(id))
        : [...new Set([...selectedItems, ...currentPageIds])],
    });
  };

  const openSingleDelete = (id) => {
    useProjectStore.setState({ selectedItems: [id] });
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    await deleteSelectedItems();
    setShowDeleteModal(false);
    setSelectedAction("");
    clearSelection();
  };

  const rowActions = (project, compact = false) => (
    <OverviewRowActions compact={compact} actions={[
      { key: "view", label: "View", icon: "fa-arrow-up-right-from-square", tone: "view", onClick: () => navigate(`/project/view/${project.project_code}`, { state: { project } }) },
      { key: "edit", label: "Edit", icon: "fa-pen", tone: "edit", onClick: () => navigate(`/project/edit/${project.project_code}`, { state: { project } }) },
      { key: "delete", label: "Delete", icon: "fa-trash", tone: "delete", onClick: () => openSingleDelete(project.id) },
    ]} />
  );

  const columns = [
    {
      key: "name", label: "Project", sortKey: "project_name", onSort: handleSort, sortIcon,
      render: (project) => (
        <div className="entity-overview-primary">
          <span className="entity-overview-avatar">{getOverviewInitials(project.project_name, "PR")}</span>
          <div>
            <button type="button" className="entity-overview-link" onClick={() => navigate(`/project/view/${project.project_code}`, { state: { project } })}>{project.project_name || "Unnamed project"}</button>
            <small>{project.project_code || "No project code"}</small>
          </div>
        </div>
      ),
    },
    { key: "projectCode", label: "Project code", sortKey: "project_code", onSort: handleSort, sortIcon, render: (project) => <span className="entity-overview-mono">{project.project_code || "—"}</span> },
    { key: "code", label: "Internal code", sortKey: "code", onSort: handleSort, sortIcon, render: (project) => <OverviewBadge tone="blue">{project.code || "Not assigned"}</OverviewBadge> },
    { key: "created", label: "Created", sortKey: "created_at", onSort: handleSort, sortIcon, render: (project) => <span className="entity-overview-muted">{formatOverviewDate(project.created_at)}</span> },
    { key: "createdBy", label: "Created by", sortKey: "created_by", onSort: handleSort, sortIcon, render: (project) => <span className="entity-overview-muted">{project.created_by || "—"}</span> },
    { key: "actions", label: "Actions", render: (project) => rowActions(project) },
  ];

  const cards = [
    { key: "total", label: "Projects", value: formatOverviewNumber(total), note: "Full project register", icon: "fa-diagram-project", tone: "teal" },
    { key: "codes", label: "Codes assigned", value: formatOverviewNumber(data.filter((item) => item.code).length), note: "Records on this page", icon: "fa-hashtag", tone: "blue" },
    { key: "year", label: `Created in ${currentYear}`, value: formatOverviewNumber(data.filter((item) => new Date(item.created_at).getFullYear() === currentYear).length), note: "Records on this page", icon: "fa-calendar-check", tone: "green" },
    { key: "selected", label: "Selected projects", value: formatOverviewNumber(selectedItems.length), note: "Ready for bulk action", icon: "fa-circle-check", tone: "amber" },
  ];

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <OverviewWorkspace
          theme={theme}
          pageTitle="Project Overview"
          links={[{ label: "Home", to: "/", active: true }, { label: "Projects", to: "/project/home", active: false }]}
          hero={{
            icon: "fa-diagram-project",
            eyebrow: "Project workspace",
            title: "Keep project records structured and accessible",
            description: "Review project identities, internal codes and ownership details without losing the existing project actions and controls.",
            createLink: "/project/create",
            createLabel: "Create project",
            onExport: exportToExcel,
            exportDisabled: loading || data.length === 0,
          }}
          cards={cards}
          register={{ eyebrow: "Project register", title: "All projects", itemLabel: "project" }}
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
          searchPlaceholder="Search project name, code or creator"
          pageLimitOptions={overviewPageLimits}
          onItemsPerPageChange={setItemsPerPage}
          selectedCount={selectedItems.length}
          selectedAction={selectedAction}
          actionOptions={overviewDeleteActions}
          onActionChange={(action) => { setSelectedAction(action); if (action === "delete") setShowDeleteModal(true); }}
          onClearSelection={clearSelection}
          columns={columns}
          getRowKey={(project) => project.id || project.project_code}
          isSelected={(project) => selectedItems.includes(project.id)}
          onToggleSelection={(project) => toggleItemSelection(project.id)}
          allSelected={allSelected}
          onToggleSelectAll={handleSelectAll}
          mobile={{
            title: (project) => project.project_name || "Unnamed project",
            subtitle: (project) => `Project ${project.project_code || "—"}`,
            badge: (project) => <OverviewBadge tone="blue">{project.code || "No code"}</OverviewBadge>,
            fields: [
              { key: "created", label: "Created", render: (project) => formatOverviewDate(project.created_at) },
              { key: "creator", label: "Created by", render: (project) => project.created_by || "—" },
              { key: "projectCode", label: "Project code", render: (project) => project.project_code || "—", wide: true },
            ],
            actions: (project) => rowActions(project, true),
          }}
          pageNumbers={getOverviewPageNumbers(totalPages, currentPage)}
          onPageChange={(page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); }}
          empty={{ icon: "fas fa-diagram-project", message: "No projects found matching your criteria", link: "/project/create" }}
        />

        <AnimatePresence>
          {showDeleteModal && (
            <DeleteConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => { setShowDeleteModal(false); setSelectedAction(""); clearSelection(); }}
              onConfirm={handleDelete}
              count={selectedItems.length}
              page="project"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {error && <ErrorModal isOpen={Boolean(error)} onClose={() => useProjectStore.setState({ error: null })} onRetry={fetchData} message={error} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProjectOverview;
