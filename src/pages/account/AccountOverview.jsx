import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import NavBar from "../NavBar";
import Header from "../Header";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import ErrorModal from "../../components/modals/ErrorModal";
import OverviewWorkspace, { OverviewBadge, OverviewRowActions } from "../../components/overview/OverviewWorkspace";
import useThemeStore from "../../stores/useThemeStore";
import useAccountStore from "../../stores/useAccountStore";
import {
  formatOverviewNumber,
  getOverviewInitials,
  getOverviewPageNumbers,
  overviewDeleteActions,
  overviewPageLimits,
  uniqueOverviewCount,
} from "../../utils/overviewHelpers";

const AccountOverview = () => {
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
  } = useAccountStore();

  useEffect(() => {
    document.title = "Smartbooks | Account Types Overview";
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
    useAccountStore.setState({
      selectedItems: allSelected
        ? selectedItems.filter((id) => !currentPageIds.includes(id))
        : [...new Set([...selectedItems, ...currentPageIds])],
    });
  };

  const openSingleDelete = (id) => {
    useAccountStore.setState({ selectedItems: [id] });
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    await deleteSelectedItems();
    setShowDeleteModal(false);
    setSelectedAction("");
    clearSelection();
  };

  const rowActions = (account, compact = false) => (
    <OverviewRowActions compact={compact} actions={[
      { key: "view", label: "View", icon: "fa-arrow-up-right-from-square", tone: "view", onClick: () => navigate(`/account/view/${account.id}`, { state: { account } }) },
      { key: "edit", label: "Edit", icon: "fa-pen", tone: "edit", onClick: () => navigate(`/account/edit/${account.id}`, { state: { account } }) },
      { key: "delete", label: "Delete", icon: "fa-trash", tone: "delete", onClick: () => openSingleDelete(account.id) },
    ]} />
  );

  const columns = [
    {
      key: "type", label: "Account type", sortKey: "type", onSort: handleSort, sortIcon,
      render: (account) => (
        <div className="entity-overview-primary">
          <span className="entity-overview-avatar">{getOverviewInitials(account.type, "AT")}</span>
          <div>
            <button type="button" className="entity-overview-link" onClick={() => navigate(`/account/view/${account.id}`, { state: { account } })}>{account.type || "Unnamed type"}</button>
            <small>Chart classification</small>
          </div>
        </div>
      ),
    },
    { key: "categoryId", label: "Category ID", sortKey: "category_id", onSort: handleSort, sortIcon, render: (account) => <span className="entity-overview-mono">{account.category_id || "—"}</span> },
    { key: "category", label: "Category", sortKey: "category", onSort: handleSort, sortIcon, render: (account) => <OverviewBadge tone="teal">{account.category || "Uncategorised"}</OverviewBadge> },
    { key: "subCategory", label: "Sub category", sortKey: "sub_category", onSort: handleSort, sortIcon, render: (account) => <span className="entity-overview-muted">{account.sub_category || "—"}</span> },
    { key: "actions", label: "Actions", headerClassName: "entity-overview-actions-header", cellClassName: "entity-overview-actions-cell", render: (account) => rowActions(account) },
  ];

  const cards = [
    { key: "total", label: "Account types", value: formatOverviewNumber(total), note: "Full chart register", icon: "fa-wallet", tone: "teal" },
    { key: "categories", label: "Categories shown", value: formatOverviewNumber(uniqueOverviewCount(data, (item) => item.category)), note: "Distinct on this page", icon: "fa-layer-group", tone: "blue" },
    { key: "subcategories", label: "Sub-categories shown", value: formatOverviewNumber(uniqueOverviewCount(data, (item) => item.sub_category)), note: "Distinct on this page", icon: "fa-sitemap", tone: "violet" },
    { key: "selected", label: "Selected records", value: formatOverviewNumber(selectedItems.length), note: "Ready for bulk action", icon: "fa-circle-check", tone: "amber" },
  ];

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <OverviewWorkspace
          theme={theme}
          pageTitle="Account Types Overview"
          links={[{ label: "Home", to: "/", active: true }, { label: "Accounts", to: "/account/home", active: false }]}
          hero={{
            icon: "fa-wallet",
            eyebrow: "Chart foundation",
            title: "Keep the chart of accounts clearly structured",
            description: "Manage account types, reporting categories and sub-categories from one consistent accounting workspace.",
            createLink: "/account/create",
            createLabel: "Create account type",
            onExport: exportToExcel,
            exportDisabled: loading || data.length === 0,
          }}
          cards={cards}
          register={{ eyebrow: "Account register", title: "All account types", itemLabel: "account type" }}
          data={data}
          loading={loading}
          total={total}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalPages={totalPages}
          searchQuery={searchQuery}
          onSearchChange={(event) => {
            setSearchQuery(event.target.value);
            if (!event.target.value) fetchData();
          }}
          onSearchSubmit={fetchData}
          onClearSearch={() => { setSearchQuery(""); fetchData(); }}
          searchPlaceholder="Search type, category or sub-category"
          pageLimitOptions={overviewPageLimits}
          onItemsPerPageChange={setItemsPerPage}
          selectedCount={selectedItems.length}
          selectedAction={selectedAction}
          actionOptions={overviewDeleteActions}
          onActionChange={(action) => { setSelectedAction(action); if (action === "delete") setShowDeleteModal(true); }}
          onClearSelection={clearSelection}
          columns={columns}
          getRowKey={(account) => account.id}
          isSelected={(account) => selectedItems.includes(account.id)}
          onToggleSelection={(account) => toggleItemSelection(account.id)}
          allSelected={allSelected}
          onToggleSelectAll={handleSelectAll}
          mobile={{
            title: (account) => account.type || "Unnamed account type",
            subtitle: (account) => `Category ID ${account.category_id || "—"}`,
            badge: (account) => <OverviewBadge tone="teal">{account.category || "Uncategorised"}</OverviewBadge>,
            fields: [
              { key: "category", label: "Category", render: (account) => account.category || "—" },
              { key: "subCategory", label: "Sub category", render: (account) => account.sub_category || "—" },
            ],
            actions: (account) => rowActions(account, true),
          }}
          pageNumbers={getOverviewPageNumbers(totalPages, currentPage)}
          onPageChange={(page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); }}
          empty={{ icon: "fas fa-wallet", message: "No account types found matching your criteria", link: "/account/create" }}
        />

        <AnimatePresence>
          {showDeleteModal && (
            <DeleteConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => { setShowDeleteModal(false); setSelectedAction(""); clearSelection(); }}
              onConfirm={handleDelete}
              count={selectedItems.length}
              page="account"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {error && <ErrorModal isOpen={Boolean(error)} onClose={() => useAccountStore.setState({ error: null })} onRetry={fetchData} message={error} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AccountOverview;
