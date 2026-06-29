import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import NavBar from "../NavBar";
import Header from "../Header";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import ErrorModal from "../../components/modals/ErrorModal";
import OverviewWorkspace, { OverviewBadge, OverviewRowActions } from "../../components/overview/OverviewWorkspace";
import useThemeStore from "../../stores/useThemeStore";
import useClientStore from "../../stores/useClientStore";
import {
  formatOverviewNumber,
  getOverviewInitials,
  getOverviewPageNumbers,
  overviewDeleteActions,
  overviewPageLimits,
} from "../../utils/overviewHelpers";

const ClientOverview = () => {
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
  } = useClientStore();

  useEffect(() => {
    document.title = "Smartbooks | Client Overview";
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, sortBy, sortOrder, fetchData]);

  const totalPages = getTotalPages();
  const currentPageIds = useMemo(() => data.map((item) => item.id), [data]);
  const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedItems.includes(id));

  const handleSort = (key) => setSorting(key, sortBy === key && sortOrder === "ASC" ? "DESC" : "ASC");
  const sortIcon = (key) => sortBy !== key
    ? <i className="fas fa-sort invoice-sort-icon invoice-sort-icon--idle" />
    : <i className={`fas ${sortOrder === "ASC" ? "fa-sort-up" : "fa-sort-down"} invoice-sort-icon`} />;

  const handleSelectAll = () => {
    useClientStore.setState({
      selectedItems: allSelected
        ? selectedItems.filter((id) => !currentPageIds.includes(id))
        : [...new Set([...selectedItems, ...currentPageIds])],
    });
  };

  const openSingleDelete = (id) => {
    useClientStore.setState({ selectedItems: [id] });
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    await deleteSelectedItems();
    setShowDeleteModal(false);
    setSelectedAction("");
    clearSelection();
  };

  const rowActions = (client, compact = false) => (
    <OverviewRowActions compact={compact} actions={[
      { key: "view", label: "View", icon: "fa-arrow-up-right-from-square", tone: "view", onClick: () => navigate(`/client/view/${client.clients_id}`, { state: { client } }) },
      { key: "edit", label: "Edit", icon: "fa-pen", tone: "edit", onClick: () => navigate(`/client/edit/${client.clients_id}`, { state: { client } }) },
      { key: "delete", label: "Delete", icon: "fa-trash", tone: "delete", onClick: () => openSingleDelete(client.id) },
    ]} />
  );

  const columns = [
    { key: "id", label: "Client ID", sortKey: "clients_id", onSort: handleSort, sortIcon, render: (client) => <span className="entity-overview-mono">{client.clients_id || "—"}</span> },
    {
      key: "name", label: "Client", sortKey: "clients_name", onSort: handleSort, sortIcon,
      render: (client) => (
        <div className="entity-overview-primary">
          <span className="entity-overview-avatar">{getOverviewInitials(client.clients_name, "CL")}</span>
          <div>
            <button type="button" className="entity-overview-link" onClick={() => navigate(`/client/view/${client.clients_id}`, { state: { client } })}>{client.clients_name || "Unnamed client"}</button>
            <small>{client.clients_id || "No client ID"}</small>
          </div>
        </div>
      ),
    },
    { key: "email", label: "Email", sortKey: "clients_email", onSort: handleSort, sortIcon, render: (client) => client.clients_email ? <a className="entity-overview-link" href={`mailto:${client.clients_email}`}>{client.clients_email}</a> : <span className="entity-overview-muted">—</span> },
    { key: "phone", label: "Phone", sortKey: "clients_number", onSort: handleSort, sortIcon, render: (client) => <span className="entity-overview-mono">{client.clients_number || "—"}</span> },
    { key: "contact", label: "Contact status", render: (client) => <OverviewBadge tone={client.clients_email && client.clients_number ? "green" : "amber"}>{client.clients_email && client.clients_number ? "Complete" : "Needs detail"}</OverviewBadge> },
    { key: "actions", label: "Actions", render: (client) => rowActions(client) },
  ];

  const cards = [
    { key: "total", label: "Clients", value: formatOverviewNumber(total), note: "Full client register", icon: "fa-address-book", tone: "teal" },
    { key: "email", label: "With email shown", value: formatOverviewNumber(data.filter((item) => item.clients_email).length), note: "Records on this page", icon: "fa-envelope", tone: "blue" },
    { key: "phone", label: "With phone shown", value: formatOverviewNumber(data.filter((item) => item.clients_number).length), note: "Records on this page", icon: "fa-phone", tone: "green" },
    { key: "selected", label: "Selected clients", value: formatOverviewNumber(selectedItems.length), note: "Ready for bulk action", icon: "fa-circle-check", tone: "amber" },
  ];

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <OverviewWorkspace
          theme={theme}
          pageTitle="Client Overview"
          links={[{ label: "Home", to: "/", active: true }, { label: "Clients", to: "/client/home", active: false }]}
          hero={{
            icon: "fa-address-book",
            eyebrow: "Client workspace",
            title: "Keep every client relationship easy to find",
            description: "Review client identities and contact details in a modern register designed for faster invoicing and project workflows.",
            createLink: "/client/create",
            createLabel: "Add client",
            onExport: exportToExcel,
            exportDisabled: loading || data.length === 0,
          }}
          cards={cards}
          register={{ eyebrow: "Client register", title: "All clients", itemLabel: "client" }}
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
          searchPlaceholder="Search client ID, name, email or phone"
          pageLimitOptions={overviewPageLimits}
          onItemsPerPageChange={setItemsPerPage}
          selectedCount={selectedItems.length}
          selectedAction={selectedAction}
          actionOptions={overviewDeleteActions}
          onActionChange={(action) => { setSelectedAction(action); if (action === "delete") setShowDeleteModal(true); }}
          onClearSelection={clearSelection}
          columns={columns}
          getRowKey={(client) => client.id || client.clients_id}
          isSelected={(client) => selectedItems.includes(client.id)}
          onToggleSelection={(client) => toggleItemSelection(client.id)}
          allSelected={allSelected}
          onToggleSelectAll={handleSelectAll}
          mobile={{
            title: (client) => client.clients_name || "Unnamed client",
            subtitle: (client) => `Client ${client.clients_id || "—"}`,
            badge: (client) => <OverviewBadge tone={client.clients_email && client.clients_number ? "green" : "amber"}>{client.clients_email && client.clients_number ? "Complete" : "Needs detail"}</OverviewBadge>,
            fields: [
              { key: "email", label: "Email", render: (client) => client.clients_email || "—", wide: true },
              { key: "phone", label: "Phone", render: (client) => client.clients_number || "—" },
              { key: "id", label: "Client ID", render: (client) => client.clients_id || "—" },
            ],
            actions: (client) => rowActions(client, true),
          }}
          pageNumbers={getOverviewPageNumbers(totalPages, currentPage)}
          onPageChange={(page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); }}
          empty={{ icon: "fas fa-address-book", message: "No clients found matching your criteria", link: "/client/create" }}
        />

        <AnimatePresence>
          {showDeleteModal && (
            <DeleteConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => { setShowDeleteModal(false); setSelectedAction(""); clearSelection(); }}
              onConfirm={handleDelete}
              count={selectedItems.length}
              page="client"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {error && <ErrorModal isOpen={Boolean(error)} onClose={() => useClientStore.setState({ error: null })} onRetry={fetchData} message={error} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ClientOverview;
