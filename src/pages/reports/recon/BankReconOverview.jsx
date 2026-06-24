import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../NavBar';
import Header from '../../Header';
import { AnimatePresence, motion } from 'framer-motion';
import { fadeInUp } from '../../../utils/animation';
import useThemeStore from '../../../stores/useThemeStore';
import PageNav from '../../../components/PageNav';
import TableLoaderComponent from '../../../components/TableLoaderComponent';
import EmptyTable from '../../../components/EmptyTable';
import ChartSearchableSelect from '../../../components/ChartSearchableSelect';
import DeleteConfirmationModal from '../../../components/modals/DeleteConfirmationModal';
import useBankReconStore from '../../../stores/useBankReconStore';

const fmtDate = (s) => s ? new Date(`${s}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtAmt  = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const BankReconOverview = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const {
    list, currentPage, itemsPerPage, searchQuery, selectedItems,
    fetchList, setCurrentPage, setItemsPerPage, setSearchQuery,
    toggleItemSelection, clearSelection, deleteSelectedItems, getTotalPages,
  } = useBankReconStore();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAction, setSelectedAction]   = useState('');
  const [deleteTarget, setDeleteTarget]       = useState(null);

  const links = [
    { label: 'Home', to: '/', active: true },
    { label: 'Reports & Analytics', to: '/reports/ledger', active: true },
    { label: 'Bank Reconciliations', to: '/reports/bank-recon', active: false },
  ];

  const pageLimitOptions = [10, 20, 50, 100].map((n) => ({ id: n, label: String(n) }));
  const actionOptions    = [{ id: '', label: 'Select Action' }, { id: 'delete', label: 'Delete Selected' }];

  useEffect(() => { document.title = 'Smartbooks | Bank Reconciliations'; }, []);
  useEffect(() => { fetchList(); }, [currentPage, itemsPerPage]);

  const totalPages = getTotalPages();
  const data       = list.data || [];
  const total      = list.pagination?.total || 0;

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (!e.target.value) fetchList({ page: 1 });
  };
  const handleSearchSubmit = (e) => { if (e.key === 'Enter') fetchList({ page: 1, search: searchQuery }); };
  const handleSearchClick  = () => fetchList({ page: 1, search: searchQuery });

  const handleActionChange = (id) => {
    setSelectedAction(id);
    if (id === 'delete') { setDeleteTarget(null); setShowDeleteModal(true); }
  };

  const handleDeleteSingle = (reconId) => { setDeleteTarget(reconId); setShowDeleteModal(true); };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await useBankReconStore.getState().deleteReconciliation(deleteTarget);
    } else {
      await deleteSelectedItems();
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
    setSelectedAction('');
    clearSelection();
  };

  const goToPage = (p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages; }
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const getSortIcon = () => null; // placeholder for future sorting

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
            <PageNav pageTitle="Bank Reconciliations" links={links} />

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.3, delay: 0.2, ease: 'easeInOut' }}
              className={`invoice-section theme-${theme}`}
            >
              {/* ── Create button ── */}
              <div className="top-action-wrapper">
                <button className="create-new-invoice-btn" onClick={() => navigate('/reports/bank-recon/create')}>
                  <span className="fas fa-circle-plus" />
                  <span>New Reconciliation</span>
                </button>
              </div>

              <div className="main-table-box">
                {list.loading ? <TableLoaderComponent /> : (
                  <>
                    {/* ── Table controls: search + filters ── */}
                    <div className="table-controls">
                      <div className="table-search-box">
                        <input
                          type="text"
                          placeholder="Search by ref, company, bank…"
                          className="table-search-input"
                          value={searchQuery}
                          onChange={handleSearchChange}
                          onKeyDown={handleSearchSubmit}
                        />
                        <span className="fas fa-search table-search-icon" onClick={handleSearchClick} style={{ cursor: 'pointer' }} />
                      </div>

                      <div className="filters-box">
                        <div className="filter-wrapper">
                          <label className="filter-wrapper-label">Page limit</label>
                          <ChartSearchableSelect options={pageLimitOptions} value={itemsPerPage} onChange={(v) => setItemsPerPage(v)} className="box-filter-limit" />
                        </div>
                        {selectedItems.length > 0 && (
                          <div className="filter-wrapper bulk-actions">
                            <label className="filter-wrapper-label">Select Action</label>
                            <ChartSearchableSelect options={actionOptions} value={selectedAction} onChange={handleActionChange} className="box-filter-action" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Table ── */}
                    <div className="table-box">
                      <div className="table-wrapper">
                        <table className="data-table invoice-table">
                          <thead>
                            <tr>
                              <th className="checkbox-cell">
                                <input
                                  type="checkbox"
                                  className={`table-checkbox fas fa-check ${data.length > 0 && selectedItems.length === data.length ? 'selected-checkbox' : ''}`}
                                  checked={data.length > 0 && selectedItems.length === data.length}
                                  onChange={() => {
                                    const ids = data.map((r) => r.id);
                                    const allSel = ids.every((id) => selectedItems.includes(id));
                                    useBankReconStore.setState({
                                      selectedItems: allSel
                                        ? selectedItems.filter((id) => !ids.includes(id))
                                        : [...new Set([...selectedItems, ...ids])],
                                    });
                                  }}
                                />
                              </th>
                              <th>Ref #</th>
                              <th>Company</th>
                              <th>Bank / Account</th>
                              <th>Period</th>
                              <th>Currency</th>
                              <th className="number-tab">Difference</th>
                              <th>Status</th>
                              <th>Created</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.map((r) => {
                              const diff = Number(r.unreconciled_difference || 0);
                              const ok   = Math.abs(diff) < 0.01;
                              return (
                                <tr key={r.id} className={selectedItems.includes(r.id) ? 'selected' : ''}>
                                  <td className="checkbox-cell">
                                    <input
                                      type="checkbox"
                                      className={`table-checkbox fas fa-check ${selectedItems.includes(r.id) ? 'selected-checkbox' : ''}`}
                                      checked={selectedItems.includes(r.id)}
                                      onChange={() => toggleItemSelection(r.id)}
                                    />
                                  </td>
                                  <td>
                                    <span className="table-customer-text" style={{ color: 'var(--color-green)', fontWeight: 700, fontSize: 12 }}>
                                      {r.recon_number}
                                    </span>
                                  </td>
                                  <td><span className="table-customer-text">{r.company_name}</span></td>
                                  <td style={{ fontSize: 12 }}>{[r.bank_name, r.account_number].filter(Boolean).join(' · ') || '—'}</td>
                                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(r.period_from)} – {fmtDate(r.period_to)}</td>
                                  <td>{r.currency}</td>
                                  <td className="number-tab" style={{ color: ok ? 'var(--color-green)' : '#f47c7c', fontWeight: 700 }}>
                                    {ok ? '0.00' : fmtAmt(diff)}
                                  </td>
                                  <td>
                                    <span style={{
                                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                      background: ok ? 'rgba(0,177,150,.1)' : 'rgba(244,124,124,.1)',
                                      color: ok ? 'var(--color-green)' : '#f47c7c',
                                    }}>
                                      {r.status}
                                    </span>
                                  </td>
                                  <td style={{ fontSize: 12 }}>{fmtDate(r.created_at?.split(' ')[0])}</td>
                                  <td>
                                    <div className="action-buttons">
                                      <button className="btn-view" title="Open Workspace" onClick={() => navigate(`/reports/bank-recon/workspace/${r.id}`)}>
                                        <span className="fas fa-arrows-left-right" />
                                      </button>
                                      <button className="btn-edit" title="Edit" onClick={() => navigate(`/reports/bank-recon/edit/${r.id}`)}>
                                        <span className="fas fa-pen" />
                                      </button>
                                      <button className="btns-delete" title="Delete" onClick={() => handleDeleteSingle(r.id)}>
                                        <span className="fas fa-trash" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {data.length === 0 && (
                              <EmptyTable
                                tableColSpan={10}
                                icon="fas fa-scale-balanced"
                                message="No reconciliations found"
                                description="Adjust your search or create a reconciliation to begin matching bank and ledger entries."
                                link="/reports/bank-recon/create"
                                actionLabel="Create New Reconciliation"
                              />
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* ── Pagination ── */}
                    {totalPages > 1 && (
                      <div className="pagination-container">
                        <div className="pagination-info">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} entries
                        </div>
                        <div className="pagination-controls">
                          <button className="pagination-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}><span>Previous</span></button>
                          {getPageNumbers().map((page, idx) => page === '...'
                            ? <span key={`e-${idx}`} className="pagination-ellipsis">...</span>
                            : <button key={page} className={`pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => goToPage(page)}>{page}</button>
                          )}
                          <button className="pagination-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}><span>Next</span></button>
                        </div>
                      </div>
                    )}


                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); setSelectedAction(''); clearSelection(); }}
            onConfirm={handleConfirmDelete}
            count={deleteTarget ? 1 : selectedItems.length}
            page="reconciliation"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BankReconOverview;