import React from 'react';
import { X, CheckCheck, Bell } from 'lucide-react';
import { Notification } from '../types/ev';
import { StatusBadge } from './StatusBadge';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={18} color="var(--accent-emerald)" />
            <h4 style={{ margin: 0 }}>System Notifications</h4>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border-color)' }}>
          <button className="btn btn-secondary btn-sm" onClick={onMarkAllRead} style={{ fontSize: '0.75rem' }}>
            <CheckCheck size={14} /> Mark all read
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 1rem' }}>
              No notifications at this time.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: n.is_read ? 'var(--bg-secondary)' : 'var(--bg-card)',
                    opacity: n.is_read ? 0.75 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{n.title}</div>
                    <StatusBadge status={n.type} label={n.type} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                    {n.message}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {!n.is_read && (
                      <button
                        onClick={() => onMarkRead(n.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-emerald)', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
