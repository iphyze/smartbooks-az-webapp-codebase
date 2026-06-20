import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../Header';
import NavBar from '../NavBar';
import PageNav from '../../components/PageNav';
import useThemeStore from '../../stores/useThemeStore';
import useNotificationStore from '../../stores/useNotificationStore';
import { fadeInUp } from '../../utils/animation';
import './NotificationsPage.css';

const MODULE_ICONS = {
  invoice: 'fa-file-invoice-dollar',
  journal: 'fa-book-open',
  users: 'fa-user-shield',
  accounting_period: 'fa-calendar-check',
  bank_reconciliation: 'fa-scale-balanced',
  timesheet: 'fa-clock',
  security: 'fa-shield-halved',
  general: 'fa-bell',
};

const FILTERS = [
  { value: 'all', label: 'All activity', icon: 'fa-layer-group' },
  { value: 'unread', label: 'Unread', icon: 'fa-envelope' },
  { value: 'read', label: 'Read', icon: 'fa-envelope-open' },
];

const parseDate = (value) => {
  if (!value) return null;
  const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  const date = parseDate(value);
  if (!date) return 'Recently';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const dateGroup = (value) => {
  const date = parseDate(value);
  if (!date) return 'Earlier';
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDifference = Math.round((startToday - startDate) / 86400000);
  if (dayDifference === 0) return 'Today';
  if (dayDifference === 1) return 'Yesterday';
  if (dayDifference < 7) return 'This week';
  return 'Earlier';
};

const NotificationsPage = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const {
    items,
    counts,
    meta,
    filter,
    listLoading,
    loadingMore,
    error,
    fetchNotifications,
    setFilter,
    markRead,
    markAllRead,
    dismiss,
    loadMore,
  } = useNotificationStore();

  useEffect(() => {
    document.title = 'Smartbooks | Notifications';
    fetchNotifications({ page: 1, filter, append: false });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const groupedItems = useMemo(() => {
    const groups = [];
    items.forEach((item) => {
      const label = dateGroup(item.created_at);
      let group = groups.find((entry) => entry.label === label);
      if (!group) {
        group = { label, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });
    return groups;
  }, [items]);

  const openNotification = async (notification) => {
    if (!notification.is_read) {
      await markRead(notification.id);
    }
    if (notification.action_url?.startsWith('/')) {
      navigate(notification.action_url);
    }
  };

  const links = [
    { label: 'Home', to: '/', active: true },
    { label: 'Notifications', to: '/notifications', active: false },
  ];

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page notification-page">
            <PageNav pageTitle="Notifications" links={links} />

            <motion.section
              className="notification-page__hero"
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.28, delay: 0.06 }}
            >
              <div className="notification-page__hero-copy">
                <span className="notification-page__eyebrow">
                  <i className="fas fa-wave-square" /> Activity centre
                </span>
                <h2>Stay on top of important accounting activity</h2>
                <p>
                  Review journal, invoice, access, accounting-period and other Smartbooks updates assigned to you.
                </p>
              </div>

              <div className="notification-page__stats">
                <article>
                  <span><i className="fas fa-bell" /></span>
                  <div><strong>{counts.total_count}</strong><small>Available</small></div>
                </article>
                <article className="is-unread">
                  <span><i className="fas fa-envelope" /></span>
                  <div><strong>{counts.unread_count}</strong><small>Unread</small></div>
                </article>
              </div>
            </motion.section>

            <motion.section
              className="notification-page__workspace"
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.28, delay: 0.1 }}
            >
              <div className="notification-page__toolbar">
                <div className="notification-page__filters" role="tablist" aria-label="Notification filters">
                  {FILTERS.map((option) => (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={filter === option.value}
                      className={filter === option.value ? 'is-active' : ''}
                      key={option.value}
                      onClick={() => setFilter(option.value)}
                    >
                      <i className={`fas ${option.icon}`} /> {option.label}
                      {option.value === 'unread' && counts.unread_count > 0 && (
                        <em>{counts.unread_count > 99 ? '99+' : counts.unread_count}</em>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="notification-page__mark-all"
                  onClick={markAllRead}
                  disabled={counts.unread_count === 0}
                >
                  <i className="fas fa-check-double" /> Mark all as read
                </button>
              </div>

              {listLoading ? (
                <div className="notification-page__loading" aria-label="Loading notifications">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div className="notification-page__loading-row" key={index}>
                      <span /><div><b /><em /><small /></div>
                    </div>
                  ))}
                </div>
              ) : error && items.length === 0 ? (
                <div className="notification-page__state notification-page__state--error">
                  <span><i className="fas fa-triangle-exclamation" /></span>
                  <h3>Notifications could not be loaded</h3>
                  <p>{error}</p>
                  <button type="button" onClick={() => fetchNotifications({ page: 1, filter, append: false })}>
                    <i className="fas fa-rotate-right" /> Try again
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="notification-page__state">
                  <span><i className="fas fa-bell-slash" /></span>
                  <h3>{filter === 'unread' ? 'No unread notifications' : 'You’re all caught up'}</h3>
                  <p>
                    {filter === 'read'
                      ? 'Notifications you have read will appear here.'
                      : 'New activity assigned to you will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="notification-page__groups">
                  {groupedItems.map((group) => (
                    <section className="notification-page__group" key={group.label}>
                      <div className="notification-page__group-title">
                        <span>{group.label}</span><i />
                      </div>

                      <div className="notification-page__list">
                        {group.items.map((notification) => (
                          <article
                            className={`notification-page__item ${notification.is_read ? '' : 'is-unread'} priority-${notification.priority}`}
                            key={notification.id}
                          >
                            <button
                              type="button"
                              className="notification-page__item-main"
                              onClick={() => openNotification(notification)}
                            >
                              <span className="notification-page__icon">
                                <i className={`fas ${MODULE_ICONS[notification.module] || MODULE_ICONS.general}`} />
                              </span>

                              <span className="notification-page__item-copy">
                                <span className="notification-page__item-heading">
                                  <strong>{notification.title}</strong>
                                  {!notification.is_read && <em>New</em>}
                                </span>
                                <span className="notification-page__message">{notification.message}</span>
                                <span className="notification-page__meta">
                                  <em>{String(notification.module || 'general').replaceAll('_', ' ')}</em>
                                  {notification.actor?.name && <><i /><span>{notification.actor.name}</span></>}
                                  <i /><time>{formatDateTime(notification.created_at)}</time>
                                </span>
                              </span>

                              {notification.action_url?.startsWith('/') && (
                                <span className="notification-page__open-icon">
                                  <i className="fas fa-arrow-up-right-from-square" />
                                </span>
                              )}
                            </button>

                            <div className="notification-page__item-actions">
                              {!notification.is_read && (
                                <button type="button" onClick={() => markRead(notification.id)} title="Mark as read">
                                  <i className="fas fa-check" />
                                </button>
                              )}
                              <button
                                type="button"
                                className="is-danger"
                                onClick={() => dismiss(notification.id)}
                                title="Dismiss notification"
                              >
                                <i className="fas fa-xmark" />
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              {!listLoading && meta.has_more && (
                <div className="notification-page__load-more">
                  <button type="button" onClick={loadMore} disabled={loadingMore}>
                    <i className={`fas ${loadingMore ? 'fa-circle-notch fa-spin' : 'fa-angles-down'}`} />
                    {loadingMore ? 'Loading more' : 'Load more notifications'}
                  </button>
                  <span>Showing {items.length} of {meta.total}</span>
                </div>
              )}
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
