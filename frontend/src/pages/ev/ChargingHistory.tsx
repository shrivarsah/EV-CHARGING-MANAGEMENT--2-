import React, { useState, useEffect } from 'react';
import { History, Receipt, CheckCircle } from 'lucide-react';
import { ChargingSession } from '../../types/ev';
import { evService } from '../../services/evService';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';

export const ChargingHistory: React.FC = () => {
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ChargingSession | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await evService.getSessions('COMPLETED');
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Charging History & Invoices</h1>
          <p className="page-subtitle">Review historical charging sessions, energy consumption, and invoices</p>
        </div>
        <button onClick={loadSessions} className="btn btn-secondary btn-sm">
          Refresh History
        </button>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Retrieving past sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <History size={36} style={{ marginBottom: '0.75rem' }} />
            <p>No completed charging sessions recorded yet.</p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Date & Time</th>
                  <th>Charger Hardware</th>
                  <th>Energy Dispensed</th>
                  <th>Duration</th>
                  <th>Total Billed</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => {
                  const durationMins = Math.round(s.duration_seconds / 60);
                  return (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{s.id}</td>
                      <td>
                        <div>{new Date(s.start_time).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <strong>{s.charger?.identifier || 'Bay'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {s.charger?.connector_type} • {s.charger?.power_kw} kW
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {s.energy_consumed_kwh.toFixed(2)} kWh
                      </td>
                      <td>{durationMins} mins</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        ₹{s.total_amount.toFixed(2)}
                      </td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedReceipt(s)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Receipt size={13} /> View Invoice
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title={`Tax Invoice #${selectedReceipt?.id || ''}`}
      >
        {selectedReceipt && (
          <div style={{ padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--good)', marginBottom: '1.25rem' }}>
              <CheckCircle size={20} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Payment Status: Settled & Completed</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Session ID:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{selectedReceipt.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Charger Bay:</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.charger?.identifier} ({selectedReceipt.charger?.connector_type})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span>
                <span>{new Date(selectedReceipt.start_time).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Energy Consumption:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedReceipt.energy_consumed_kwh.toFixed(2)} kWh</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Battery State Delta:</span>
                <span>{selectedReceipt.initial_soc}% → {selectedReceipt.current_soc}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Duration:</span>
                <span>{Math.round(selectedReceipt.duration_seconds / 60)} minutes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem', fontSize: '1.1rem' }}>
                <span style={{ fontWeight: 700 }}>Total Billed:</span>
                <span style={{ fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                  ₹{selectedReceipt.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedReceipt(null)}>
                Close Invoice
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
