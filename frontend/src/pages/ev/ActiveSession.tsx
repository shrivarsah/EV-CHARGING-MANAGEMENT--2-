import React, { useState, useEffect } from 'react';
import { BatteryCharging, Zap, Clock, CreditCard, CheckCircle, StopCircle, ArrowRight } from 'lucide-react';
import { ChargingSession } from '../../types/ev';
import { evService } from '../../services/evService';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';

interface ActiveSessionProps {
  session: ChargingSession | null;
  onSessionCompleted: () => void;
  onRefreshNotifications: () => void;
  onGoToStations: () => void;
}

export const ActiveSession: React.FC<ActiveSessionProps> = ({
  session,
  onSessionCompleted,
  onRefreshNotifications,
  onGoToStations
}) => {
  const [currentSession, setCurrentSession] = useState<ChargingSession | null>(session);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI AutoPay');
  const [completing, setCompleting] = useState(false);
  const [invoiceSuccess, setInvoiceSuccess] = useState<any>(null);

  useEffect(() => {
    setCurrentSession(session);
  }, [session]);

  // Live simulation tick every 4 seconds while session is active
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'ACTIVE') return;

    const interval = setInterval(async () => {
      // Calculate realistic incremental telemetry
      const nextSoc = Math.min(100, Math.round((currentSession.current_soc + 0.5) * 10) / 10);
      const nextEnergy = Math.round((currentSession.energy_consumed_kwh + 0.35) * 100) / 100;
      const nextDuration = currentSession.duration_seconds + 4;

      try {
        const updated = await evService.updateProgress(currentSession.id, {
          current_soc: nextSoc,
          energy_consumed_kwh: nextEnergy,
          duration_seconds: nextDuration
        });
        setCurrentSession(updated);
      } catch (err) {
        console.error('Telemetry sync error:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentSession]);

  const handleManualBoost = async () => {
    if (!currentSession) return;
    const nextSoc = Math.min(100, currentSession.current_soc + 2.0);
    const nextEnergy = Math.round((currentSession.energy_consumed_kwh + 1.2) * 100) / 100;
    const nextDuration = currentSession.duration_seconds + 60;

    try {
      const updated = await evService.updateProgress(currentSession.id, {
        current_soc: nextSoc,
        energy_consumed_kwh: nextEnergy,
        duration_seconds: nextDuration
      });
      setCurrentSession(updated);
    } catch (err: any) {
      alert(`Boost error: ${err.message}`);
    }
  };

  const handleCompleteSession = async () => {
    if (!currentSession) return;
    setCompleting(true);
    try {
      const finished = await evService.completeSession(currentSession.id, {
        current_soc: currentSession.current_soc,
        energy_consumed_kwh: currentSession.energy_consumed_kwh,
        duration_seconds: currentSession.duration_seconds,
        payment_method: paymentMethod
      });
      setInvoiceSuccess(finished);
      onRefreshNotifications();
      setTimeout(() => {
        setCompleteModalOpen(false);
        onSessionCompleted();
      }, 2500);
    } catch (err: any) {
      alert(`Completion failed: ${err.message}`);
    } finally {
      setCompleting(false);
    }
  };

  if (!currentSession) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <BatteryCharging size={54} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
        <h2>No Active Charging Session</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '0.75rem auto 1.5rem auto' }}>
          Connect your electric vehicle to any available bay in our network to start real-time telemetry tracking.
        </p>
        <button onClick={onGoToStations} className="btn btn-primary">
          Browse Charging Stations <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const rate = currentSession.charger?.price_per_kwh || 18.50;
  const accruedAmount = Math.round(currentSession.energy_consumed_kwh * rate * 100) / 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Live Charging Telemetry</h1>
          <p className="page-subtitle">Real-time meter telemetry for Session #{currentSession.id}</p>
        </div>
        <StatusBadge status="CHARGING" label="Live Fast Charging" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Battery SOC Gauge Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem' }}>
          <div
            style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: `conic-gradient(var(--accent-emerald) 0% ${currentSession.current_soc}%, var(--border-color) ${currentSession.current_soc}% 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
              marginBottom: '1.5rem',
              position: 'relative'
            }}
          >
            <div
              style={{
                width: '144px',
                height: '144px',
                borderRadius: '50%',
                background: 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BatteryCharging size={28} color="var(--accent-emerald)" style={{ marginBottom: '0.2rem' }} />
              <div style={{ fontSize: '2.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {Math.round(currentSession.current_soc)}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: {currentSession.target_soc}%</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
            <button onClick={handleManualBoost} className="btn btn-secondary btn-sm">
              <Zap size={14} color="var(--accent-emerald)" /> Simulate +2% Boost
            </button>
            <button onClick={() => setCompleteModalOpen(true)} className="btn btn-danger btn-sm">
              <StopCircle size={14} /> Stop & Settle
            </button>
          </div>
        </div>

        {/* Telemetry Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>
              <Zap size={18} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Energy Consumed</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {currentSession.energy_consumed_kwh.toFixed(2)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>kWh</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Meter Rate: ₹{rate.toFixed(2)} / kWh
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>
              <Clock size={18} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Charging Duration</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {formatTime(currentSession.duration_seconds)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Started: {new Date(currentSession.start_time).toLocaleTimeString()}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-indigo)', marginBottom: '0.5rem' }}>
              <CreditCard size={18} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Accrued Amount</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
              ₹{accruedAmount.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Automated Billing Calculation
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              <BatteryCharging size={18} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Bay Hardware</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
              {currentSession.charger?.identifier || 'Bay Charger'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              {currentSession.charger?.connector_type} • {currentSession.charger?.power_kw} kW {currentSession.charger?.current_type}
            </div>
          </div>
        </div>
      </div>

      {/* Complete & Invoicing Modal */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Complete Charging & Invoicing"
      >
        {invoiceSuccess ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle size={54} color="var(--good)" style={{ marginBottom: '1rem' }} />
            <h3>Session Succeeded & Invoiced!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {invoiceSuccess.energy_consumed_kwh} kWh consumed in {Math.round(invoiceSuccess.duration_seconds / 60)} minutes.
            </p>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)', margin: '1rem 0' }}>
              Total: ₹{invoiceSuccess.total_amount.toFixed(2)}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Charger bay has been released back to Available.</p>
          </div>
        ) : (
          <div>
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Final Battery SoC:</span>
                <span style={{ fontWeight: 700 }}>{Math.round(currentSession.current_soc)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Energy Dispensed:</span>
                <span style={{ fontWeight: 700 }}>{currentSession.energy_consumed_kwh.toFixed(2)} kWh</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Duration:</span>
                <span style={{ fontWeight: 700 }}>{formatTime(currentSession.duration_seconds)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', fontSize: '1.1rem' }}>
                <span style={{ fontWeight: 700 }}>Total Invoice:</span>
                <span style={{ fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                  ₹{accruedAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Settlement Method</label>
              <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="UPI AutoPay">UPI AutoPay (Instant)</option>
                <option value="Credit / Debit Card">Credit / Debit Card</option>
                <option value="EV Corporate Wallet">EV Corporate Wallet</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setCompleteModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCompleteSession} disabled={completing}>
                {completing ? 'Settling Payment...' : 'Settle & Release Charger'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
