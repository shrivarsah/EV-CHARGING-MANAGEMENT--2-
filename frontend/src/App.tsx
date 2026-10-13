import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { NotificationDrawer } from './components/NotificationDrawer';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// EV Pages
import { StationCatalog } from './pages/ev/StationCatalog';
import { ActiveSession } from './pages/ev/ActiveSession';
import { ReservationsList } from './pages/ev/ReservationsList';
import { ChargingHistory } from './pages/ev/ChargingHistory';
import { AdminOperations } from './pages/ev/AdminOperations';

// Metrics Pages
import { MetricsOverview } from './pages/metrics/MetricsOverview';
import { CodeQualityPage } from './pages/metrics/CodeQualityPage';
import { TestingSecurityPage } from './pages/metrics/TestingSecurityPage';
import { EVMetricsPage } from './pages/metrics/EVMetricsPage';
import { TrendsPage } from './pages/metrics/TrendsPage';
import { SettingsPage } from './pages/metrics/SettingsPage';

import { ChargingSession, Notification, Charger } from './types/ev';
import { evService } from './services/evService';

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<NavigationTab>('stations');

  // Global State
  const [activeSession, setActiveSession] = useState<ChargingSession | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadActiveSession = async () => {
    if (!isAuthenticated) return;
    try {
      const sess = await evService.getActiveSession();
      setActiveSession(sess);
    } catch (err) {
      console.error(err);
    }
  };

  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const notifs = await evService.getNotifications();
      setNotifications(notifs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadActiveSession();
      loadNotifications();
      const interval = setInterval(() => {
        loadActiveSession();
        loadNotifications();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  const handleStartSession = async (charger: Charger) => {
    try {
      const newSession = await evService.startSession({
        charger_id: charger.id,
        initial_soc: 20.0,
        target_soc: 90.0
      });
      setActiveSession(newSession);
      setCurrentTab('active-session');
      loadNotifications();
    } catch (err: any) {
      alert(`Could not start session: ${err.message}`);
    }
  };

  const handleMarkNotifRead = async (id: number) => {
    await evService.markNotificationRead(id);
    loadNotifications();
  };

  const handleMarkAllNotifsRead = async () => {
    await evService.markAllNotificationsRead();
    loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="app-container">
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      <div className="main-content">
        <Navbar
          activeSession={activeSession}
          unreadCount={unreadCount}
          onOpenNotifications={() => setDrawerOpen(true)}
          onNavigateToActiveSession={() => setCurrentTab('active-session')}
        />

        <main className="page-wrapper">
          {currentTab === 'stations' && (
            <StationCatalog
              onStartSession={handleStartSession}
              onRefreshNotifications={loadNotifications}
            />
          )}

          {currentTab === 'active-session' && (
            <ActiveSession
              session={activeSession}
              onSessionCompleted={() => {
                setActiveSession(null);
                setCurrentTab('history');
                loadNotifications();
              }}
              onRefreshNotifications={loadNotifications}
              onGoToStations={() => setCurrentTab('stations')}
            />
          )}

          {currentTab === 'reservations' && (
            <ReservationsList
              onStartSession={handleStartSession}
              onRefreshNotifications={loadNotifications}
            />
          )}

          {currentTab === 'history' && <ChargingHistory />}

          {currentTab === 'admin' && <AdminOperations />}

          {currentTab === 'metrics-overview' && (
            <MetricsOverview onGoToSettings={() => setCurrentTab('settings')} />
          )}

          {currentTab === 'code-quality' && <CodeQualityPage />}

          {currentTab === 'testing-security' && <TestingSecurityPage />}

          {currentTab === 'ev-metrics' && <EVMetricsPage />}

          {currentTab === 'trends' && <TrendsPage />}

          {currentTab === 'settings' && (
            <SettingsPage onRefreshMetrics={loadNotifications} />
          )}
        </main>
      </div>

      <NotificationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifsRead}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
