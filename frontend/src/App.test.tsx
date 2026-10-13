
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock authentication
vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ isAuthenticated: false }),
}));

// Mock theme
vi.mock('./context/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Login page
vi.mock('./pages/Login', () => ({
  Login: ({
    onSwitchToRegister,
  }: {
    onSwitchToRegister: () => void;
  }) => (
    <div>
      <h1>Login</h1>
      <button type="button" onClick={onSwitchToRegister}>
        Register
      </button>
    </div>
  ),
}));

// Mock Register page
vi.mock('./pages/Register', () => ({
  Register: ({
    onSwitchToLogin,
  }: {
    onSwitchToLogin: () => void;
  }) => (
    <div>
      <h1>Register</h1>
      <button type="button" onClick={onSwitchToLogin}>
        Back to login
      </button>
    </div>
  ),
}));

// Mock application components
vi.mock('./components/Navbar', () => ({
  Navbar: () => null,
}));

vi.mock('./components/Sidebar', () => ({
  Sidebar: () => null,
}));

vi.mock('./components/NotificationDrawer', () => ({
  NotificationDrawer: () => null,
}));

// Mock EV pages
vi.mock('./pages/ev/StationCatalog', () => ({
  StationCatalog: () => null,
}));

vi.mock('./pages/ev/ActiveSession', () => ({
  ActiveSession: () => null,
}));

vi.mock('./pages/ev/ReservationsList', () => ({
  ReservationsList: () => null,
}));

vi.mock('./pages/ev/ChargingHistory', () => ({
  ChargingHistory: () => null,
}));

vi.mock('./pages/ev/AdminOperations', () => ({
  AdminOperations: () => null,
}));

// Mock metrics pages
vi.mock('./pages/metrics/MetricsOverview', () => ({
  MetricsOverview: () => null,
}));

vi.mock('./pages/metrics/CodeQualityPage', () => ({
  CodeQualityPage: () => null,
}));

vi.mock('./pages/metrics/TestingSecurityPage', () => ({
  TestingSecurityPage: () => null,
}));

vi.mock('./pages/metrics/EVMetricsPage', () => ({
  EVMetricsPage: () => null,
}));

vi.mock('./pages/metrics/TrendsPage', () => ({
  TrendsPage: () => null,
}));

vi.mock('./pages/metrics/SettingsPage', () => ({
  SettingsPage: () => null,
}));

// Mock EV service
vi.mock('./services/evService', () => ({
  evService: {
    getActiveSession: vi.fn().mockResolvedValue(null),
    getNotifications: vi.fn().mockResolvedValue([]),
    startSession: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  },
}));

import App from './App';

describe('EV Charging Management App', () => {
  // Clean up rendered components after each test
  afterEach(() => {
    cleanup();
  });

  it('shows the login screen when the user is not authenticated', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Login' })
    ).toBeInTheDocument();
  });

  it('switches from login to registration and back', async () => {
    render(<App />);

    // Verify login screen
    expect(
      screen.getByRole('heading', { name: 'Login' })
    ).toBeInTheDocument();

    // Click Register
    fireEvent.click(
      screen.getByRole('button', { name: 'Register' })
    );

    // Verify registration screen
    expect(
      screen.getByRole('heading', { name: 'Register' })
    ).toBeInTheDocument();

    // Return to login
    fireEvent.click(
      screen.getByRole('button', { name: 'Back to login' })
    );

    // Verify login screen again
    expect(
      screen.getByRole('heading', { name: 'Login' })
    ).toBeInTheDocument();
  });
});
