import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../Header';
import NavBar from '../NavBar';
import PageNav from '../../components/PageNav';
import TableLoaderComponent from '../../components/TableLoaderComponent';
import useThemeStore from '../../stores/useThemeStore';
import useAuthStore from '../../stores/useAuthStore';
import useToastStore from '../../stores/useToastStore';
import useCostCentresStore from '../../stores/useCostCentresStore';
import { fadeInUp } from '../../utils/animation';
import { defaultRouteForRole, hasPermission } from '../../utils/permissions';
import './CostCentresOverview.css';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const Modal = ({ type, item, saving, onClose, onSubmit, onDelete }) => {
  const [name, setName] = useState(item?.name || '');
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const isView = type === 'view';
  const isDelete = type === 'delete';
  const isEdit = type === 'edit';
  const title = type === 'create' ? 'Create cost centre' : type === 'edit' ? 'Edit cost centre' : type === 'delete' ? (item?.usage?.can_hard_delete ? 'Delete cost centre' : 'Deactivate cost centre') : 'Cost centre details';

  useEffect(() => {
    setName(item?.name || '');
    setIsActive(item?.is_active ?? true);
  }, [item, type]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isDelete) return onDelete?.();
    if (isView) return onClose();
    onSubmit?.({ name: name.trim(), is_active: isActive });
  };

  return (
    <motion.div className="cc-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.form className="cc-modal" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} onMouseDown={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <header className="cc-modal__header">
          <div className="cc-modal__heading">
            <span className="cc-modal__icon"><i className={`fas ${isDelete ? 'fa-triangle-exclamation' : 'fa-layer-group'}`} /></span>
            <div><small>ADMINISTRATION</small><h2>{title}</h2></div>
          </div>
          <button type="button" className="cc-modal__close" onClick={onClose}><i className="fas fa-xmark" /></button>
        </header>

        <div className="cc-modal__body">
          {isDelete ? (
            <div className="cc-delete-message">
              <p>{item?.usage?.can_hard_delete
                ? <><strong>{item?.name}</strong> has no transaction references or user assignments and can be permanently deleted.</>
                : <><strong>{item?.name}</strong> is already in use. SmartBooks will deactivate it instead of removing historical references.</>}
              </p>
              <div className="cc-usage-grid">
                <span><strong>{item?.usage?.reference_count || 0}</strong> References</span>
                <span><strong>{item?.usage?.assigned_users || 0}</strong> Assigned users</span>
              </div>
            </div>
          ) : isView ? (
            <div className="cc-detail-grid">
              <div><span>Name</span><strong>{item?.name}</strong></div>
              <div><span>Status</span><strong>{item?.is_active ? 'Active' : 'Inactive'}</strong></div>
              <div><span>Transaction references</span><strong>{item?.usage?.reference_count || 0}</strong></div>
              <div><span>Assigned users</span><strong>{item?.usage?.assigned_users || 0}</strong></div>
              <div><span>Created</span><strong>{formatDate(item?.created_at)}</strong><small>{item?.created_by || '—'}</small></div>
              <div><span>Last updated</span><strong>{formatDate(item?.updated_at)}</strong><small>{item?.updated_by || '—'}</small></div>
              {Object.keys(item?.usage?.references || {}).length > 0 && (
                <div className="cc-detail-grid__wide">
                  <span>Reference sources</span>
                  <div className="cc-source-list">
                    {Object.entries(item.usage.references).map(([source, count]) => <em key={source}>{source.replaceAll('_', ' ')} <b>{count}</b></em>)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <label className="cc-field">
                <span>Cost centre name <b>*</b></span>
                <input autoFocus type="text" maxLength={255} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. AI Division" required />
                <small>This name is used to scope transactions, reports and user access.</small>
              </label>
              {isEdit && (
                <div className="cc-status-control">
                  <div><strong>Active cost centre</strong><span>Inactive cost centres remain available for historical reporting but cannot be selected for new postings.</span></div>
                  <button type="button" className={`cc-switch ${isActive ? 'on' : ''}`} onClick={() => setIsActive((value) => !value)} aria-pressed={isActive}><i /></button>
                </div>
              )}
              {isEdit && item?.usage?.reference_count > 0 && name.trim() !== item.name && (
                <div className="cc-info"><i className="fas fa-circle-info" /><span>Renaming this cost centre will update its stored cost-centre dimension across existing transactions so access and reports remain consistent.</span></div>
              )}
            </>
          )}
        </div>

        <footer className="cc-modal__footer">
          <button type="button" className="cc-btn cc-btn--ghost" onClick={onClose}>{isView ? 'Close' : 'Cancel'}</button>
          {!isView && (
            <button type="submit" className={`cc-btn ${isDelete ? 'cc-btn--danger' : 'cc-btn--primary'}`} disabled={saving || (!isDelete && !name.trim())}>
              {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : isDelete ? <><i className={`fas ${item?.usage?.can_hard_delete ? 'fa-trash' : 'fa-ban'}`} /> {item?.usage?.can_hard_delete ? 'Delete permanently' : 'Deactivate'}</> : <><i className="fas fa-floppy-disk" /> {type === 'create' ? 'Create cost centre' : 'Save changes'}</>}
            </button>
          )}
        </footer>
      </motion.form>
    </motion.div>
  );
};

const CostCentresOverview = () => {
  const [nav, setNav] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [modal, setModal] = useState(null);
  const { theme } = useThemeStore();
  const user = useAuthStore((state) => state.user);
  const { showToast } = useToastStore();
  const { data, summary, loading, saving, error, status, fetchData, setStatus, createCostCentre, updateCostCentre, deleteCostCentre, clearError } = useCostCentresStore();
  const canView = hasPermission(user, 'cost_centre.view');
  const canCreate = hasPermission(user, 'cost_centre.create');
  const canEdit = hasPermission(user, 'cost_centre.edit');
  const canDelete = hasPermission(user, 'cost_centre.delete');
  const canBrowse = canView || canEdit || canDelete;

  useEffect(() => {
    document.title = 'Smartbooks | Cost Centres';
    if (canBrowse) fetchData();
  }, [canBrowse, fetchData]);

  const filteredSummary = useMemo(() => [
    { label: 'Total cost centres', value: summary.total, icon: 'fa-layer-group' },
    { label: 'Active', value: summary.active, icon: 'fa-circle-check' },
    { label: 'Inactive', value: summary.inactive, icon: 'fa-circle-pause' },
    { label: 'Assigned to users', value: summary.assigned, icon: 'fa-user-lock' },
  ], [summary]);

  const runSearch = () => fetchData({ search: searchInput });
  const changeStatus = (value) => { setStatus(value); fetchData({ status: value, search: searchInput }); };

  const saveModal = async (values) => {
    try {
      const result = modal.type === 'create'
        ? await createCostCentre(values.name, { refresh: canBrowse })
        : await updateCostCentre({ id: modal.item.id, ...values });
      showToast(result?.message || 'Cost centre saved successfully.', 'success');
      setModal(null);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Unable to save cost centre.', 'error');
    }
  };

  const deleteModal = async () => {
    try {
      const result = await deleteCostCentre(modal.item.id);
      showToast(result?.message || 'Cost centre updated successfully.', 'success');
      setModal(null);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Unable to delete cost centre.', 'error');
    }
  };

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page cc-page">
            <PageNav pageTitle="Cost Centres" links={[{ label: 'Home', to: defaultRouteForRole(user), active: true }, { label: 'Cost Centres', to: '/cost-centres/home', active: false }]} />

            <motion.section className="cc-hero" variants={fadeInUp} initial="hidden" animate="show">
              <div><small>ADMINISTRATION</small><h1>Cost Centre Management</h1><p>Create and maintain the divisions used to control transaction visibility across SmartBooks.</p></div>
              {canCreate && <button className="cc-btn cc-btn--primary" onClick={() => setModal({ type: 'create', item: null })}><i className="fas fa-circle-plus" /> Add Cost Centre</button>}
            </motion.section>

            {canBrowse && <section className="cc-summary-grid">
              {filteredSummary.map((card) => <article key={card.label}><span><i className={`fas ${card.icon}`} /></span><div><strong>{Number(card.value || 0).toLocaleString()}</strong><small>{card.label}</small></div></article>)}
            </section>}

            {canBrowse ? <section className="cc-panel">
              <div className="cc-toolbar">
                <div className="cc-search"><i className="fas fa-magnifying-glass" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runSearch()} placeholder="Search cost centres..." /><button onClick={runSearch}>Search</button></div>
                <div className="cc-status-tabs">{STATUS_OPTIONS.map((option) => <button key={option.value} className={status === option.value ? 'active' : ''} onClick={() => changeStatus(option.value)}>{option.label}</button>)}</div>
              </div>

              {error && <div className="cc-error"><span><i className="fas fa-triangle-exclamation" /> {error}</span><button onClick={() => { clearError(); fetchData(); }}>Retry</button></div>}
              {loading ? <TableLoaderComponent /> : (
                <div className="cc-table-wrap">
                  <table className="cc-table">
                    <thead><tr><th>#</th><th>Cost Centre</th><th>Status</th><th>References</th><th>Assigned Users</th><th>Last Updated</th><th>Actions</th></tr></thead>
                    <tbody>
                      {data.map((item, index) => (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td><div className="cc-name"><span><i className="fas fa-layer-group" /></span><div><strong>{item.name}</strong><small>ID {item.id}</small></div></div></td>
                          <td><span className={`cc-status ${item.is_active ? 'active' : 'inactive'}`}><i className="fas fa-circle" />{item.is_active ? 'Active' : 'Inactive'}</span></td>
                          <td><strong className="cc-number">{item.usage?.reference_count || 0}</strong></td>
                          <td><strong className="cc-number">{item.usage?.assigned_users || 0}</strong></td>
                          <td><div className="cc-date"><strong>{formatDate(item.updated_at)}</strong><small>{item.updated_by || '—'}</small></div></td>
                          <td><div className="cc-actions">{canView && <button title="View" onClick={() => setModal({ type: 'view', item })}><i className="fas fa-eye" /></button>}{canEdit && <button title="Edit" onClick={() => setModal({ type: 'edit', item })}><i className="fas fa-pen" /></button>}{canDelete && <button className="danger" title={item.usage?.can_hard_delete ? 'Delete' : 'Deactivate'} onClick={() => setModal({ type: 'delete', item })}><i className={`fas ${item.usage?.can_hard_delete ? 'fa-trash' : 'fa-ban'}`} /></button>}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!data.length && <div className="cc-empty"><span><i className="fas fa-layer-group" /></span><h3>No cost centres found</h3><p>{canCreate ? 'Adjust your search or create a new cost centre.' : 'Adjust your search or status filter.'}</p></div>}
                </div>
              )}
            </section> : (
              <section className="cc-panel">
                <div className="cc-empty"><span><i className="fas fa-circle-plus" /></span><h3>Create access only</h3><p>You can create cost centres, but you do not have permission to browse existing cost centres.</p></div>
              </section>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>{modal && <Modal type={modal.type} item={modal.item} saving={saving} onClose={() => setModal(null)} onSubmit={saveModal} onDelete={deleteModal} />}</AnimatePresence>
    </div>
  );
};

export default CostCentresOverview;
