import React, { useState } from 'react';
import { Zap, Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(formData);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-primary)' }}>
      <div className="glass-card" style={{ maxWidth: '460px', width: '100%', padding: '2.5rem' }}>
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
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Register to reserve EV bays and monitor charging telemetry
          </p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Alex Mercer"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@company.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="form-input"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 6 characters"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Account Role</label>
            <select
              className="form-select"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="CUSTOMER">Customer (EV Driver)</option>
              <option value="ADMIN">System Administrator</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', marginBottom: '1.25rem' }}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{ background: 'none', border: 'none', color: 'var(--accent-emerald)', cursor: 'pointer', fontWeight: 700 }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
