import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import NavBar from "../NavBar";
import Header from "../Header";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import ErrorModal from "../../components/modals/ErrorModal";
import OverviewWorkspace, { OverviewBadge, OverviewRowActions } from "../../components/overview/OverviewWorkspace";
import useThemeStore from "../../stores/useThemeStore";
import useRateStore from "../../stores/useRateStore";
import { formatCurrencyDecimals } from "../../utils/helper";
import {
  formatOverviewDate,
  formatOverviewNumber,
  getOverviewPageNumbers,
  overviewDeleteActions,
  overviewPageLimits,
  uniqueOverviewCount,
} from "../../utils/overviewHelpers";

const RateOverview = () => {
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
  } = useRateStore();

  useEffect(() => {
    document.title = "Smartbooks | Exchange Rate Overview";
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
    useRateStore.setState({
      selectedItems: allSelected
        ? selectedItems.filter((id) => !currentPageIds.includes(id))
        : [...new Set([...selectedItems, ...currentPageIds])],
    });
  };

  const openSingleDelete = (id) => {
    useRateStore.setState({ selectedItems: [id] });
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    await deleteSelectedItems();
    setShowDeleteModal(false);
    setSelectedAction("");
    clearSelection();
  };

  const rowActions = (rate, compact = false) => (
    <OverviewRowActions compact={compact} actions={[
      { key: "edit", label: "Edit", icon: "fa-pen", tone: "edit", onClick: () => navigate(`/rate/edit/${rate.id}`, { state: { rate } }) },
      { key: "delete", label: "Delete", icon: "fa-trash", tone: "delete", onClick: () => openSingleDelete(rate.id) },
    ]} />
  );

  const columns = [
    { key: "date", label: "Effective date", sortKey: "created_at", onSort: handleSort, sortIcon, render: (rate) => <span className="entity-overview-mono">{formatOverviewDate(rate.created_at)}</span> },
    { key: "ngn", label: "NGN rate", sortKey: "ngn_rate", onSort: handleSort, sortIcon, render: (rate) => <OverviewBadge tone="teal">{formatCurrencyDecimals(rate.ngn_rate, rate.ngn_cur)}</OverviewBadge> },
    { key: "usd", label: "USD rate", sortKey: "usd_rate", onSort: handleSort, sortIcon, render: (rate) => <span className="entity-overview-mono">{formatCurrencyDecimals(rate.usd_rate, rate.usd_cur)}</span> },
    { key: "gbp", label: "GBP rate", sortKey: "gbp_rate", onSort: handleSort, sortIcon, render: (rate) => <span className="entity-overview-mono">{formatCurrencyDecimals(rate.gbp_rate, rate.gbp_cur)}</span> },
    { key: "eur", label: "EUR rate", sortKey: "eur_rate", onSort: handleSort, sortIcon, render: (rate) => <span className="entity-overview-mono">{formatCurrencyDecimals(rate.eur_rate, rate.eur_cur)}</span> },
    { key: "createdBy", label: "Created by", sortKey: "created_by", onSort: handleSort, sortIcon, render: (rate) => <span className="entity-overview-muted">{rate.created_by || "—"}</span> },
    { key: "actions", label: "Actions", render: (rate) => rowActions(rate) },
  ];

  const cards = [
    { key: "total", label: "Rate records", value: formatOverviewNumber(total), note: "Full exchange-rate history", icon: "fa-arrow-right-arrow-left", tone: "teal" },
    { key: "currencies", label: "Currencies tracked", value: "4", note: "NGN, USD, GBP and EUR", icon: "fa-coins", tone: "blue" },
    { key: "dates", label: "Rate dates shown", value: formatOverviewNumber(uniqueOverviewCount(data, (item) => String(item.created_at || "").slice(0, 10))), note: "Distinct on this page", icon: "fa-calendar-day", tone: "violet" },
    { key: "selected", label: "Selected records", value: formatOverviewNumber(selectedItems.length), note: "Ready for bulk action", icon: "fa-circle-check", tone: "amber" },
  ];

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <OverviewWorkspace
          theme={theme}
          pageTitle="Exchange Rate Overview"
          links={[{ label: "Home", to: "/", active: true }, { label: "Exchange Rates", to: "/rate/home", active: false }]}
          hero={{
            icon: "fa-arrow-right-arrow-left",
            eyebrow: "Currency controls",
            title: "Maintain exchange-rate history with greater clarity",
            description: "Review effective dates and all supported currency rates in a compact register built for fast accounting checks.",
            createLink: "/rate/create",
            createLabel: "Add exchange rate",
            onExport: exportToExcel,
            exportDisabled: loading || data.length === 0,
          }}
          cards={cards}
          register={{ eyebrow: "Rate register", title: "All exchange rates", itemLabel: "rate record" }}
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
          searchPlaceholder="Search date, currency rate or creator"
          pageLimitOptions={overviewPageLimits}
          onItemsPerPageChange={setItemsPerPage}
          selectedCount={selectedItems.length}
          selectedAction={selectedAction}
          actionOptions={overviewDeleteActions}
          onActionChange={(action) => { setSelectedAction(action); if (action === "delete") setShowDeleteModal(true); }}
          onClearSelection={clearSelection}
          columns={columns}
          getRowKey={(rate) => rate.id}
          isSelected={(rate) => selectedItems.includes(rate.id)}
          onToggleSelection={(rate) => toggleItemSelection(rate.id)}
          allSelected={allSelected}
          onToggleSelectAll={handleSelectAll}
          mobile={{
            title: (rate) => formatOverviewDate(rate.created_at),
            subtitle: (rate) => `Created by ${rate.created_by || "—"}`,
            badge: () => <OverviewBadge tone="teal">Rate set</OverviewBadge>,
            fields: [
              { key: "usd", label: "USD", render: (rate) => formatCurrencyDecimals(rate.usd_rate, rate.usd_cur) },
              { key: "gbp", label: "GBP", render: (rate) => formatCurrencyDecimals(rate.gbp_rate, rate.gbp_cur) },
              { key: "eur", label: "EUR", render: (rate) => formatCurrencyDecimals(rate.eur_rate, rate.eur_cur) },
              { key: "ngn", label: "NGN", render: (rate) => formatCurrencyDecimals(rate.ngn_rate, rate.ngn_cur) },
            ],
            actions: (rate) => rowActions(rate, true),
          }}
          pageNumbers={getOverviewPageNumbers(totalPages, currentPage)}
          onPageChange={(page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); }}
          empty={{ icon: "fas fa-arrow-right-arrow-left", message: "No exchange rates found matching your criteria", link: "/rate/create" }}
        />

        <AnimatePresence>
          {showDeleteModal && (
            <DeleteConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => { setShowDeleteModal(false); setSelectedAction(""); clearSelection(); }}
              onConfirm={handleDelete}
              count={selectedItems.length}
              page="exchange rate"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {error && <ErrorModal isOpen={Boolean(error)} onClose={() => useRateStore.setState({ error: null })} onRetry={fetchData} message={error} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RateOverview;
