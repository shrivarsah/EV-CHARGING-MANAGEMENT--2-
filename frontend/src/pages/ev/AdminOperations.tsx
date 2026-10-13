import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, MapPin, Zap, AlertTriangle, Plus, Trash2, Edit2, StopCircle
} from 'lucide-react';
import { AdminStats, Station, Charger, ChargingSession } from '../../types/ev';
import { evService } from '../../services/evService';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';

export const AdminOperations: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [activeSessions, setActiveSessions] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Station Modal
  const [stationModalOpen, setStationModalOpen] = useState(false);
  const [stationForm, setStationForm] = useState({
    name: '',
    code: '',
    address: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 13.08,
    longitude: 80.27,
    status: 'ACTIVE',
    amenities: 'Restrooms, Cafe, Wi-Fi'
  });

  // Charger Modal
  const [chargerModalOpen, setChargerModalOpen] = useState(false);
  const [chargerStationId, setChargerStationId] = useState<number | null>(null);
  const [chargerForm, setChargerForm] = useState({
    identifier: '',
    connector_type: 'CCS2',
    power_kw: 120.0,
    current_type: 'DC',
    price_per_kwh: 19.5,
    status: 'AVAILABLE'
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [stData, stationsData, sessionsData] = await Promise.all([
        evService.getAdminStats(),
        evService.getStations(),
        evService.getAdminActiveSessions()
      ]);
      setStats(stData);
      setStations(stationsData);
      setActiveSessions(sessionsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await evService.createStation(stationForm as any);
      setStationModalOpen(false);
      setStationForm({
        name: '', code: '', address: '', city: 'Chennai', state: 'Tamil Nadu',
        latitude: 13.08, longitude: 80.27, status: 'ACTIVE', amenities: 'Restrooms, Cafe, Wi-Fi'
      });
      loadAll();
    } catch (err: any) {
      alert(`Create station failed: ${err.message}`);
    }
  };

  const handleDeleteStation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this station? All attached chargers will be removed.')) return;
    try {
      await evService.deleteStation(id);
      loadAll();
    } catch (err: any) {
      alert(`Delete station failed: ${err.message}`);
    }
  };

  const handleAddCharger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargerStationId) return;
    try {
      await evService.updateChargerStatus(chargerStationId, 'AVAILABLE'); // or create endpoint
      // Using standard charger add
      const resp = await fetch('http://localhost:8000/api/v1/chargers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ ...chargerForm, station_id: chargerStationId })
      });
      if (!resp.ok) throw new Error(await resp.text());
      setChargerModalOpen(false);
      loadAll();
    } catch (err: any) {
      alert(`Add charger failed: ${err.message}`);
    }
  };

  const handleStatusChange = async (chargerId: number, newStatus: string) => {
    try {
      await evService.updateChargerStatus(chargerId, newStatus);
      loadAll();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleEmergencyStop = async (sessionId: number) => {
    if (!confirm('Administrative Emergency Stop: Terminate this active session now?')) return;
    try {
      await evService.emergencyStopSession(sessionId);
      loadAll();
    } catch (err: any) {
      alert(`Stop failed: ${err.message}`);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Admin Operations Center</h1>
          <p className="page-subtitle">Real-time infrastructure telemetry, station provisioning, and bay override controls</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setStationModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={14} /> Add Station
          </button>
          <button onClick={loadAll} className="btn btn-secondary btn-sm">
            Refresh Metrics
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Stations</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>{stats.total_stations}</div>
          </div>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Bays</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>{stats.total_chargers}</div>
          </div>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Bays</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--good)', marginTop: '0.25rem' }}>{stats.available_chargers}</div>
          </div>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Sessions</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--warning)', marginTop: '0.25rem' }}>{stats.active_sessions}</div>
          </div>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dispensed Energy</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>{stats.total_energy_kwh.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>kWh</span></div>
          </div>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Revenue</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>₹{stats.total_revenue.toLocaleString()}</div>
          </div>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bay Utilization</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>{stats.utilization_rate}%</div>
          </div>
        </div>
      )}

      {/* Active Sessions Control */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Live Active Sessions Monitoring ({activeSessions.length})</h3>
        {activeSessions.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
            No vehicle charging sessions currently in progress across the network.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Customer ID</th>
                  <th>Charger Bay</th>
                  <th>Battery SoC</th>
                  <th>Energy Meter</th>
                  <th>Duration</th>
                  <th>Accrued Bill</th>
                  <th>Emergency Action</th>
                </tr>
              </thead>
              <tbody>
                {activeSessions.map(sess => (
                  <tr key={sess.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{sess.id}</td>
                    <td>Customer #{sess.user_id}</td>
                    <td><strong>{sess.charger?.identifier}</strong></td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{sess.current_soc}%</td>
                    <td>{sess.energy_consumed_kwh.toFixed(2)} kWh</td>
                    <td>{Math.round(sess.duration_seconds / 60)} mins</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>₹{sess.total_amount.toFixed(2)}</td>
                    <td>
                      <button
                        onClick={() => handleEmergencyStop(sess.id)}
                        className="btn btn-danger btn-sm"
                      >
                        <StopCircle size={13} /> Emergency Stop
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stations & Hardware Provisioning */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '1rem' }}>Station Network Provisioning ({stations.length})</h3>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Station Name</th>
                <th>Location</th>
                <th>Total Bays</th>
                <th>Status</th>
                <th>Hardware Provisioning</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stations.map(st => (
                <tr key={st.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{st.code}</td>
                  <td><strong>{st.name}</strong></td>
                  <td>{st.address}, {st.city}</td>
                  <td>{st.chargers.length} Bays</td>
                  <td><StatusBadge status={st.status} /></td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                      {st.chargers.map(ch => (
                        <div key={ch.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--bg-secondary)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                          <span>{ch.identifier}:</span>
                          <select
                            value={ch.status}
                            onChange={e => handleStatusChange(ch.id, e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'inherit', fontWeight: 700, cursor: 'pointer' }}
                          >
                            <option value="AVAILABLE">AVAILABLE</option>
                            <option value="CHARGING">CHARGING</option>
                            <option value="RESERVED">RESERVED</option>
                            <option value="MAINTENANCE">MAINTENANCE</option>
                            <option value="OFFLINE">OFFLINE</option>
                          </select>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setChargerStationId(st.id);
                          setChargerForm({ identifier: `${st.code.split('-')[1] || 'BAY'}-0${st.chargers.length + 1}`, connector_type: 'CCS2', power_kw: 120.0, current_type: 'DC', price_per_kwh: 19.5, status: 'AVAILABLE' });
                          setChargerModalOpen(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                      >
                        <Plus size={11} /> Bay
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteStation(st.id)}
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Station Modal */}
      <Modal
        isOpen={stationModalOpen}
        onClose={() => setStationModalOpen(false)}
        title="Provision New EV Charging Station"
      >
        <form onSubmit={handleCreateStation}>
          <div className="form-group">
            <label className="form-label">Station Name</label>
            <input
              type="text"
              required
              className="form-input"
              value={stationForm.name}
              onChange={e => setStationForm({ ...stationForm, name: e.target.value })}
              placeholder="e.g. Guindy Tech Park Fast Charging Hub"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Station Code (Unique)</label>
            <input
              type="text"
              required
              className="form-input"
              value={stationForm.code}
              onChange={e => setStationForm({ ...stationForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. CHE-GDY-06"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              type="text"
              required
              className="form-input"
              value={stationForm.address}
              onChange={e => setStationForm({ ...stationForm, address: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                required
                className="form-input"
                value={stationForm.city}
                onChange={e => setStationForm({ ...stationForm, city: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                className="form-input"
                value={stationForm.state}
                onChange={e => setStationForm({ ...stationForm, state: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Amenities</label>
            <input
              type="text"
              className="form-input"
              value={stationForm.amenities}
              onChange={e => setStationForm({ ...stationForm, amenities: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStationModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Station</button>
          </div>
        </form>
      </Modal>

      {/* Add Charger Modal */}
      <Modal
        isOpen={chargerModalOpen}
        onClose={() => setChargerModalOpen(false)}
        title="Add Charger Bay to Station"
      >
        <form onSubmit={handleAddCharger}>
          <div className="form-group">
            <label className="form-label">Bay Identifier</label>
            <input
              type="text"
              required
              className="form-input"
              value={chargerForm.identifier}
              onChange={e => setChargerForm({ ...chargerForm, identifier: e.target.value })}
              placeholder="e.g. GDY-DC-01"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Connector Type</label>
              <select
                className="form-select"
                value={chargerForm.connector_type}
                onChange={e => setChargerForm({ ...chargerForm, connector_type: e.target.value })}
              >
                <option value="CCS2">CCS2 (DC Fast)</option>
                <option value="CHAdeMO">CHAdeMO (DC)</option>
                <option value="TYPE2">Type 2 (AC)</option>
                <option value="GBT">GB/T</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Power Rating (kW)</label>
              <input
                type="number"
                step="0.1"
                required
                className="form-input"
                value={chargerForm.power_kw}
                onChange={e => setChargerForm({ ...chargerForm, power_kw: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Current Standard</label>
              <select
                className="form-select"
                value={chargerForm.current_type}
                onChange={e => setChargerForm({ ...chargerForm, current_type: e.target.value })}
              >
                <option value="DC">DC (Fast)</option>
                <option value="AC">AC (Standard)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price per kWh (₹)</label>
              <input
                type="number"
                step="0.1"
                required
                className="form-input"
                value={chargerForm.price_per_kwh}
                onChange={e => setChargerForm({ ...chargerForm, price_per_kwh: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setChargerModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Charger Bay</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
