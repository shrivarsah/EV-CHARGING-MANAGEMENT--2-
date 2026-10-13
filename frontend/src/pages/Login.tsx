import React, { useState } from 'react';
import { Zap, Lock, Mail, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onSwitchToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (type: 'admin' | 'customer') => {
    if (type === 'admin') {
      setEmail('admin@evcharging.com');
      setPassword('Admin@12345');
    } else {
      setEmail('customer@evcharging.com');
      setPassword('Customer@12345');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-primary)' }}>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10b981, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <Zap size={28} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>VoltMetric Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            EV Charging Station Network & Software Quality Platform
          </p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                style={{ paddingLeft: '2.4rem' }}
              />
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{ paddingLeft: '2.4rem' }}
              />
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', marginBottom: '1.25rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'} <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Fast Login Pills */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.75rem', textAlign: 'center' }}>
            Faculty & Demonstration Accounts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleFillDemo('admin')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', justifyContent: 'center' }}
            >
              <ShieldCheck size={13} color="var(--danger)" /> Fill Admin
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('customer')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', justifyContent: 'center' }}
            >
              <User size={13} color="var(--accent-emerald)" /> Fill Customer
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{ background: 'none', border: 'none', color: 'var(--accent-emerald)', cursor: 'pointer', fontWeight: 700 }}
          >
            Register Here
          </button>
        </div>
      </div>
    </div>
  );
};
