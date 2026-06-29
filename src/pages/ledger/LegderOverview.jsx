import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import NavBar from "../NavBar";
import Header from "../Header";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import ErrorModal from "../../components/modals/ErrorModal";
import OverviewWorkspace, { OverviewBadge, OverviewRowActions } from "../../components/overview/OverviewWorkspace";
import useThemeStore from "../../stores/useThemeStore";
import useLedgerStore from "../../stores/useLedgerStore";
import {
  formatOverviewNumber,
  getOverviewInitials,
  getOverviewPageNumbers,
  overviewDeleteActions,
  overviewPageLimits,
  uniqueOverviewCount,
} from "../../utils/overviewHelpers";

const LedgerOverview = () => {
  const [nav, setNav] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  const [singleDeleteLedgerNumber, setSingleDeleteLedgerNumber] = useState("");
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const {
    data, loading, error, total, currentPage, itemsPerPage, sortBy, sortOrder,
    searchQuery, selectedItems, fetchData, setCurrentPage, setItemsPerPage,
    setSearchQuery, setSorting, toggleItemSelection, clearSelection,
    deleteSelectedItems, deleteSingleLedger, exportToExcel, getTotalPages,
  } = useLedgerStore();

  useEffect(() => {
    document.title = "Smartbooks | Ledger Overview";
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, sortBy, sortOrder, fetchData]);

  const totalPages = getTotalPages();
  const currentPageIds = useMemo(() => data.map((item) => item.id), [data]);
  const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedItems.includes(id));

  const handleSort = (key) => {
    setSorting(key, sortBy === key && sortOrder === "ASC" ? "DESC" : "ASC");
  };

  const sortIcon = (key) => sortBy !== key
    ? <i className="fas fa-sort invoice-sort-icon invoice-sort-icon--idle" />
    : <i className={`fas ${sortOrder === "ASC" ? "fa-sort-up" : "fa-sort-down"} invoice-sort-icon`} />;

  const handleSelectAll = () => {
    const selectedItemsData = { ...useLedgerStore.getState().selectedItemsData };
    if (allSelected) {
      currentPageIds.forEach((id) => delete selectedItemsData[id]);
      useLedgerStore.setState({
        selectedItems: selectedItems.filter((id) => !currentPageIds.includes(id)),
        selectedItemsData,
      });
      return;
    }

    data.forEach((item) => { selectedItemsData[item.id] = item; });
    useLedgerStore.setState({
      selectedItems: [...new Set([...selectedItems, ...currentPageIds])],
      selectedItemsData,
    });
  };

  const openSingleDelete = (ledgerNumber) => {
    setSingleDeleteLedgerNumber(ledgerNumber);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (singleDeleteLedgerNumber) {
      await deleteSingleLedger(singleDeleteLedgerNumber);
    } else {
      await deleteSelectedItems();
    }
    setShowDeleteModal(false);
    setSelectedAction("");
    setSingleDeleteLedgerNumber("");
    clearSelection();
  };

  const rowActions = (ledger, compact = false) => (
    <OverviewRowActions compact={compact} actions={[
      { key: "view", label: "View", icon: "fa-arrow-up-right-from-square", tone: "view", onClick: () => navigate(`/ledger/view/${ledger.ledger_number}`, { state: { ledger } }) },
      { key: "edit", label: "Edit", icon: "fa-pen", tone: "edit", onClick: () => navigate(`/ledger/edit/${ledger.ledger_number}`, { state: { ledger } }) },
      { key: "delete", label: "Delete", icon: "fa-trash", tone: "delete", onClick: () => openSingleDelete(ledger.ledger_number) },
    ]} />
  );

  const columns = [
    { key: "number", label: "Ledger number", sortKey: "ledger_number", onSort: handleSort, sortIcon, render: (ledger) => <span className="entity-overview-mono">{ledger.ledger_number || "—"}</span> },
    {
      key: "name", label: "Ledger name", sortKey: "ledger_name", onSort: handleSort, sortIcon,
      render: (ledger) => (
        <div className="entity-overview-primary">
          <span className="entity-overview-avatar">{getOverviewInitials(ledger.ledger_name, "LD")}</span>
          <div>
            <button type="button" className="entity-overview-link" onClick={() => navigate(`/ledger/view/${ledger.ledger_number}`, { state: { ledger } })}>{ledger.ledger_name || "Unnamed ledger"}</button>
            <small>{ledger.ledger_number || "No ledger number"}</small>
          </div>
        </div>
      ),
    },
    { key: "class", label: "Ledger class", sortKey: "ledger_class", onSort: handleSort, sortIcon, render: (ledger) => <OverviewBadge tone="violet">{ledger.ledger_class || "Unclassified"}</OverviewBadge> },
    { key: "actions", label: "Actions", render: (ledger) => rowActions(ledger) },
  ];

  const cards = [
    { key: "total", label: "Ledgers", value: formatOverviewNumber(total), note: "Full ledger register", icon: "fa-book-open", tone: "teal" },
    { key: "classes", label: "Classes shown", value: formatOverviewNumber(uniqueOverviewCount(data, (item) => item.ledger_class)), note: "Distinct on this page", icon: "fa-layer-group", tone: "violet" },
    { key: "displayed", label: "Rows displayed", value: formatOverviewNumber(data.length), note: `Page ${currentPage} of ${Math.max(totalPages, 1)}`, icon: "fa-table-list", tone: "blue" },
    { key: "selected", label: "Selected ledgers", value: formatOverviewNumber(selectedItems.length), note: "Ready for bulk action", icon: "fa-circle-check", tone: "amber" },
  ];

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <OverviewWorkspace
          theme={theme}
          pageTitle="Ledger Overview"
          links={[{ label: "Home", to: "/", active: true }, { label: "Ledgers", to: "/ledger/home", active: false }]}
          hero={{
            icon: "fa-book-open",
            eyebrow: "Ledger workspace",
            title: "A cleaner view of every accounting ledger",
            description: "Review ledger identities and classifications, then move directly into statements, edits and maintenance actions.",
            createLink: "/ledger/create",
            createLabel: "Create ledger",
            onExport: exportToExcel,
            exportDisabled: loading || data.length === 0,
          }}
          cards={cards}
          register={{ eyebrow: "Ledger register", title: "All ledgers", itemLabel: "ledger" }}
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
          searchPlaceholder="Search ledger number, name or class"
          pageLimitOptions={overviewPageLimits}
          onItemsPerPageChange={setItemsPerPage}
          selectedCount={selectedItems.length}
          selectedAction={selectedAction}
          actionOptions={overviewDeleteActions}
          onActionChange={(action) => { setSelectedAction(action); setSingleDeleteLedgerNumber(""); if (action === "delete") setShowDeleteModal(true); }}
          onClearSelection={clearSelection}
          columns={columns}
          getRowKey={(ledger) => ledger.id || ledger.ledger_number}
          isSelected={(ledger) => selectedItems.includes(ledger.id)}
          onToggleSelection={(ledger) => toggleItemSelection(ledger.id)}
          allSelected={allSelected}
          onToggleSelectAll={handleSelectAll}
          mobile={{
            title: (ledger) => ledger.ledger_name || "Unnamed ledger",
            subtitle: (ledger) => `Ledger ${ledger.ledger_number || "—"}`,
            badge: (ledger) => <OverviewBadge tone="violet">{ledger.ledger_class || "Unclassified"}</OverviewBadge>,
            fields: [
              { key: "number", label: "Ledger number", render: (ledger) => ledger.ledger_number || "—" },
              { key: "class", label: "Ledger class", render: (ledger) => ledger.ledger_class || "—" },
            ],
            actions: (ledger) => rowActions(ledger, true),
          }}
          pageNumbers={getOverviewPageNumbers(totalPages, currentPage)}
          onPageChange={(page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); }}
          empty={{ icon: "fas fa-book-open", message: "No ledgers found matching your criteria", link: "/ledger/create" }}
        />

        <AnimatePresence>
          {showDeleteModal && (
            <DeleteConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => { setShowDeleteModal(false); setSelectedAction(""); setSingleDeleteLedgerNumber(""); clearSelection(); }}
              onConfirm={handleDelete}
              count={singleDeleteLedgerNumber ? 1 : selectedItems.length}
              page="ledger"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {error && <ErrorModal isOpen={Boolean(error)} onClose={() => useLedgerStore.setState({ error: null })} onRetry={fetchData} message={error} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LedgerOverview;
