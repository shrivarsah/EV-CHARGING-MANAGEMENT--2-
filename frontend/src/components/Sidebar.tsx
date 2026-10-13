import React from 'react';
import {
  MapPin, BatteryCharging, CalendarClock, History,
  LayoutDashboard, ShieldAlert, Code2, Bug, LineChart,
  Settings, Gauge
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavigationTab =
  | 'stations'
  | 'active-session'
  | 'reservations'
  | 'history'
  | 'admin'
  | 'metrics-overview'
  | 'code-quality'
  | 'testing-security'
  | 'ev-metrics'
  | 'trends'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { isAdmin } = useAuth();

  const navItem = (tab: NavigationTab, label: string, icon: React.ReactNode) => {
    const isActive = currentTab === tab;
    return (
      <button
        onClick={() => onSelectTab(tab)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          width: '100%',
          padding: '0.65rem 0.9rem',
          borderRadius: '8px',
          border: 'none',
          background: isActive ? 'var(--accent-emerald-light)' : 'transparent',
          color: isActive ? 'var(--accent-emerald)' : 'var(--text-secondary)',
          fontWeight: isActive ? 700 : 500,
          fontSize: '0.875rem',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.15s ease',
          marginBottom: '0.2rem'
        }}
      >
        <span style={{ color: isActive ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
          {icon}
        </span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <aside
      style={{
        width: '260px',
        borderRight: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        flexShrink: 0
      }}
    >
      {/* EV Charging Section */}
      <div>
        <div
          style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            fontWeight: 800,
            padding: '0 0.9rem 0.6rem 0.9rem'
          }}
        >
          EV Charging Network
        </div>
        <div>
          {navItem('stations', 'Stations & Chargers', <MapPin size={17} />)}
          {navItem('active-session', 'Live Charging Session', <BatteryCharging size={17} />)}
          {navItem('reservations', 'Slot Reservations', <CalendarClock size={17} />)}
          {navItem('history', 'Charging History', <History size={17} />)}
          {isAdmin && navItem('admin', 'Admin Operations', <LayoutDashboard size={17} />)}
        </div>
      </div>

      {/* Software Metrics Section */}
      <div>
        <div
          style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            fontWeight: 800,
            padding: '0 0.9rem 0.6rem 0.9rem'
          }}
        >
          Software Quality Dashboard
        </div>
        <div>
          {navItem('metrics-overview', 'Overview (10 Metrics)', <Gauge size={17} />)}
          {navItem('code-quality', 'Code Quality', <Code2 size={17} />)}
          {navItem('testing-security', 'Testing & Security', <ShieldAlert size={17} />)}
          {navItem('ev-metrics', 'EV Charging Metrics (Jira)', <Bug size={17} />)}
          {navItem('trends', 'Historical Trends', <LineChart size={17} />)}
          {navItem('settings', 'API & Credentials', <Settings size={17} />)}
        </div>
      </div>
    </aside>
  );
};
