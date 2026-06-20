import React from 'react';
import { useNavigate } from 'react-router-dom';
import useNotificationStore from '../../stores/useNotificationStore';
import './NotificationDropdown.css';

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

const formatRelativeTime = (value) => {
  if (!value) return 'Just now';
  const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T');
  const timestamp = new Date(normalized).getTime();
  if (Number.isNaN(timestamp)) return 'Recently';

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 45) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const NotificationDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const {
    recent,
    counts,
    summaryLoading,
    markRead,
    markAllRead,
    dismiss,
  } = useNotificationStore();

  const openNotification = async (notification) => {
    if (!notification.is_read) {
      await markRead(notification.id);
    }
    onClose?.();
    const target = notification.action_url?.startsWith('/')
      ? notification.action_url
      : '/notifications';
    navigate(target);
  };

  const viewAll = () => {
    onClose?.();
    navigate('/notifications');
  };

  return (
    <div className="notification-dropdown" role="dialog" aria-label="Recent notifications">
      <div className="notification-dropdown__head">
        <div>
          <span className="notification-dropdown__eyebrow">Smartbooks activity</span>
          <h3>Notifications</h3>
        </div>
        <span className="notification-dropdown__count">
          {counts.unread_count > 99 ? '99+' : counts.unread_count} unread
        </span>
      </div>

      <div className="notification-dropdown__toolbar">
        <span>Latest updates</span>
        <button
          type="button"
          onClick={markAllRead}
          disabled={counts.unread_count === 0}
        >
          <i className="fas fa-check-double" /> Mark all read
        </button>
      </div>

      <div className="notification-dropdown__list">
        {summaryLoading && recent.length === 0 ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div className="notification-dropdown__skeleton" key={index}>
              <span /><div><b /><em /></div>
            </div>
          ))
        ) : recent.length === 0 ? (
          <div className="notification-dropdown__empty">
            <span><i className="fas fa-bell-slash" /></span>
            <h4>You’re all caught up</h4>
            <p>New accounting activity will appear here.</p>
          </div>
        ) : (
          recent.map((notification) => (
            <article
              key={notification.id}
              className={`notification-dropdown__item ${notification.is_read ? '' : 'is-unread'} priority-${notification.priority}`}
            >
              <button
                type="button"
                className="notification-dropdown__item-main"
                onClick={() => openNotification(notification)}
              >
                <span className="notification-dropdown__icon">
                  <i className={`fas ${MODULE_ICONS[notification.module] || MODULE_ICONS.general}`} />
                </span>
                <span className="notification-dropdown__copy">
                  <span className="notification-dropdown__item-title">
                    {notification.title}
                    {!notification.is_read && <i aria-label="Unread" />}
                  </span>
                  <span className="notification-dropdown__message">{notification.message}</span>
                  <span className="notification-dropdown__meta">
                    <em>{String(notification.module || 'general').replaceAll('_', ' ')}</em>
                    <i />
                    <time>{formatRelativeTime(notification.created_at)}</time>
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="notification-dropdown__dismiss"
                onClick={(event) => {
                  event.stopPropagation();
                  dismiss(notification.id);
                }}
                aria-label={`Dismiss ${notification.title}`}
                title="Dismiss notification"
              >
                <i className="fas fa-xmark" />
              </button>
            </article>
          ))
        )}
      </div>

      <button type="button" className="notification-dropdown__footer" onClick={viewAll}>
        View all notifications <i className="fas fa-arrow-right" />
      </button>
    </div>
  );
};

export default NotificationDropdown;
