import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import NavBar from "../NavBar";
import Header from "../Header";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import ErrorModal from "../../components/modals/ErrorModal";
import OverviewWorkspace, { OverviewBadge, OverviewRowActions } from "../../components/overview/OverviewWorkspace";
import useThemeStore from "../../stores/useThemeStore";
import useBankStore from "../../stores/useBankStore";
import {
  formatOverviewDate,
  formatOverviewNumber,
  getOverviewInitials,
  getOverviewPageNumbers,
  overviewDeleteActions,
  overviewPageLimits,
  uniqueOverviewCount,
} from "../../utils/overviewHelpers";

const BankOverview = () => {
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
  } = useBankStore();

  useEffect(() => {
    document.title = "Smartbooks | Bank Overview";
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
    useBankStore.setState({
      selectedItems: allSelected
        ? selectedItems.filter((id) => !currentPageIds.includes(id))
        : [...new Set([...selectedItems, ...currentPageIds])],
    });
  };

  const openSingleDelete = (id) => {
    useBankStore.setState({ selectedItems: [id] });
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    await deleteSelectedItems();
    setShowDeleteModal(false);
    setSelectedAction("");
    clearSelection();
  };

  const rowActions = (bank, compact = false) => (
    <OverviewRowActions compact={compact} actions={[
      { key: "view", label: "View", icon: "fa-arrow-up-right-from-square", tone: "view", onClick: () => navigate(`/banks/view/${bank.id}`, { state: { bank } }) },
      { key: "edit", label: "Edit", icon: "fa-pen", tone: "edit", onClick: () => navigate(`/banks/edit/${bank.id}`, { state: { bank } }) },
      { key: "delete", label: "Delete", icon: "fa-trash", tone: "delete", onClick: () => openSingleDelete(bank.id) },
    ]} />
  );

  const columns = [
    {
      key: "accountName", label: "Account name", sortKey: "account_name", onSort: handleSort, sortIcon,
      render: (bank) => (
        <div className="entity-overview-primary">
          <span className="entity-overview-avatar">{getOverviewInitials(bank.bank_name || bank.account_name, "BK")}</span>
          <div>
            <button type="button" className="entity-overview-link" onClick={() => navigate(`/banks/view/${bank.id}`, { state: { bank } })}>{bank.account_name || "Unnamed account"}</button>
            <small>{bank.bank_name || "Bank not specified"}</small>
          </div>
        </div>
      ),
    },
    { key: "accountNumber", label: "Account number", sortKey: "account_number", onSort: handleSort, sortIcon, render: (bank) => <span className="entity-overview-mono">{bank.account_number || "—"}</span> },
    { key: "bankName", label: "Bank", sortKey: "bank_name", onSort: handleSort, sortIcon, render: (bank) => <span className="entity-overview-muted">{bank.bank_name || "—"}</span> },
    { key: "currency", label: "Currency", sortKey: "account_currency", onSort: handleSort, sortIcon, render: (bank) => <OverviewBadge tone="blue" icon="fa-coins">{bank.account_currency || "—"}</OverviewBadge> },
    { key: "created", label: "Created", sortKey: "created_at", onSort: handleSort, sortIcon, render: (bank) => <span className="entity-overview-muted">{formatOverviewDate(bank.created_at)}</span> },
    { key: "actions", label: "Actions", render: (bank) => rowActions(bank) },
  ];

  const cards = [
    { key: "total", label: "Bank accounts", value: formatOverviewNumber(total), note: "Full bank register", icon: "fa-building-columns", tone: "teal" },
    { key: "banks", label: "Institutions shown", value: formatOverviewNumber(uniqueOverviewCount(data, (item) => item.bank_name)), note: "Distinct on this page", icon: "fa-landmark", tone: "blue" },
    { key: "currencies", label: "Currencies shown", value: formatOverviewNumber(uniqueOverviewCount(data, (item) => item.account_currency)), note: "Distinct on this page", icon: "fa-coins", tone: "green" },
    { key: "selected", label: "Selected accounts", value: formatOverviewNumber(selectedItems.length), note: "Ready for bulk action", icon: "fa-circle-check", tone: "amber" },
  ];

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <OverviewWorkspace
          theme={theme}
          pageTitle="Bank Overview"
          links={[{ label: "Home", to: "/", active: true }, { label: "Banks", to: "/banks/home", active: false }]}
          hero={{
            icon: "fa-building-columns",
            eyebrow: "Cash management",
            title: "Manage every bank account from one organised register",
            description: "Review account identities, institutions and currencies while keeping view, edit and maintenance actions close at hand.",
            createLink: "/banks/create",
            createLabel: "Add bank account",
            onExport: exportToExcel,
            exportDisabled: loading || data.length === 0,
          }}
          cards={cards}
          register={{ eyebrow: "Bank register", title: "All bank accounts", itemLabel: "bank account" }}
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
          searchPlaceholder="Search account, bank, number or currency"
          pageLimitOptions={overviewPageLimits}
          onItemsPerPageChange={setItemsPerPage}
          selectedCount={selectedItems.length}
          selectedAction={selectedAction}
          actionOptions={overviewDeleteActions}
          onActionChange={(action) => { setSelectedAction(action); if (action === "delete") setShowDeleteModal(true); }}
          onClearSelection={clearSelection}
          columns={columns}
          getRowKey={(bank) => bank.id}
          isSelected={(bank) => selectedItems.includes(bank.id)}
          onToggleSelection={(bank) => toggleItemSelection(bank.id)}
          allSelected={allSelected}
          onToggleSelectAll={handleSelectAll}
          mobile={{
            title: (bank) => bank.account_name || "Unnamed account",
            subtitle: (bank) => bank.bank_name || "Bank not specified",
            badge: (bank) => <OverviewBadge tone="blue">{bank.account_currency || "—"}</OverviewBadge>,
            fields: [
              { key: "number", label: "Account number", render: (bank) => bank.account_number || "—" },
              { key: "created", label: "Created", render: (bank) => formatOverviewDate(bank.created_at) },
              { key: "bank", label: "Institution", render: (bank) => bank.bank_name || "—", wide: true },
            ],
            actions: (bank) => rowActions(bank, true),
          }}
          pageNumbers={getOverviewPageNumbers(totalPages, currentPage)}
          onPageChange={(page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); }}
          empty={{ icon: "fas fa-building-columns", message: "No bank accounts found matching your criteria", link: "/banks/create" }}
        />

        <AnimatePresence>
          {showDeleteModal && (
            <DeleteConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => { setShowDeleteModal(false); setSelectedAction(""); clearSelection(); }}
              onConfirm={handleDelete}
              count={selectedItems.length}
              page="bank account"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {error && <ErrorModal isOpen={Boolean(error)} onClose={() => useBankStore.setState({ error: null })} onRetry={fetchData} message={error} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BankOverview;
