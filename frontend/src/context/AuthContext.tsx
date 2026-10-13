import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types/auth';
import { request } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; role?: string; phone?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth_change', handleAuthChange);
    return () => window.removeEventListener('auth_change', handleAuthChange);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('auth_token', res.access_token);
    localStorage.setItem('auth_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (data: { email: string; password: string; full_name: string; role?: string; phone?: string }) => {
    await request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    // Auto login after registration
    await login(data.email, data.password);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const u = await request<User>('/auth/me');
      setUser(u);
      localStorage.setItem('auth_user', JSON.stringify(u));
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'ADMIN',
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
