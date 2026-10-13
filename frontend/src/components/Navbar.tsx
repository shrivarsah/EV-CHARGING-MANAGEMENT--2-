import React from 'react';
import { Zap, Sun, Moon, Bell, LogOut, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ChargingSession } from '../types/ev';

interface NavbarProps {
  activeSession: ChargingSession | null;
  unreadCount: number;
  onOpenNotifications: () => void;
  onNavigateToActiveSession: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSession,
  unreadCount,
  onOpenNotifications,
  onNavigateToActiveSession
}) => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      style={{
        height: '68px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.35)'
          }}
        >
          <Zap size={22} color="#ffffff" />
        </div>
        <div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Volt<span style={{ color: 'var(--accent-emerald)' }}>Metric</span>
          </span>
          <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            EV Network & Software Quality
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Active Session Chip */}
        {activeSession && (
          <button
            onClick={onNavigateToActiveSession}
            className="btn btn-secondary btn-sm"
            style={{
              borderColor: 'var(--accent-emerald)',
              background: 'var(--accent-emerald-light)',
              color: 'var(--good)'
            }}
          >
            <span className="pulse-indicator pulse-green" />
            <span>Active Session: {activeSession.current_soc}%</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          style={{ padding: '0.5rem' }}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="btn btn-secondary btn-sm"
          style={{ position: 'relative', padding: '0.5rem' }}
          title="Notifications"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--accent-emerald)',
                color: '#ffffff',
                borderRadius: '9999px',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.1rem 0.35rem',
                minWidth: '16px',
                textAlign: 'center'
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Info & Role Badge */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border-color)' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: isAdmin ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: isAdmin ? 'var(--danger)' : 'var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              {isAdmin ? <Shield size={16} /> : <UserIcon size={16} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.full_name}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.role}</span>
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{ marginLeft: '0.5rem', padding: '0.45rem' }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
