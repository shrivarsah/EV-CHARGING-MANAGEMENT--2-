import React, { useState, useEffect } from 'react';
import { Search, Filter, Zap, Calendar, Play, CheckCircle } from 'lucide-react';
import { Station, Charger } from '../../types/ev';
import { evService } from '../../services/evService';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';

interface StationCatalogProps {
  onStartSession: (charger: Charger) => void;
  onRefreshNotifications: () => void;
}

export const StationCatalog: React.FC<StationCatalogProps> = ({
  onStartSession,
  onRefreshNotifications
}) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedConnector, setSelectedConnector] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Reservation Modal State
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);
  const [reservationDate, setReservationDate] = useState('');
  const [reservationTime, setReservationTime] = useState('');
  const [reserving, setReserving] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState<string | null>(null);

  const loadStations = async () => {
    setLoading(true);
    try {
      const data = await evService.getStations({
        q: searchQuery || undefined,
        city: selectedCity || undefined,
        connector_type: selectedConnector || undefined,
        available_only: availableOnly
      });
      setStations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStations();
  }, [selectedCity, selectedConnector, availableOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStations();
  };

  const openReservationModal = (charger: Charger) => {
    setSelectedCharger(charger);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours() + 1).padStart(2, '0')}:00`;
    setReservationDate(dateStr);
    setReservationTime(timeStr);
    setReservationSuccess(null);
    setReservationModalOpen(true);
  };

  const handleConfirmReservation = async () => {
    if (!selectedCharger || !reservationDate || !reservationTime) return;
    setReserving(true);
    try {
      const startDateTime = new Date(`${reservationDate}T${reservationTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour

      await evService.createReservation({
        charger_id: selectedCharger.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        notes: 'Reserved via VoltMetric Portal'
      });

      setReservationSuccess(`Slot reserved successfully for ${selectedCharger.identifier}!`);
      onRefreshNotifications();
      setTimeout(() => {
        setReservationModalOpen(false);
        loadStations();
      }, 1500);
    } catch (err: any) {
      alert(`Reservation failed: ${err.message}`);
    } finally {
      setReserving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">EV Charging Station Network</h1>
          <p className="page-subtitle">Locate high-capacity charging plazas, check live connector telemetry, and reserve slots.</p>
        </div>
        <button onClick={loadStations} className="btn btn-secondary btn-sm">
          Refresh Live Status
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label className="form-label">Search Stations</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Station name, address, code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.2rem' }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label className="form-label">City / Region</label>
            <select className="form-select" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
              <option value="">All Cities</option>
              <option value="Chennai">Chennai</option>
              <option value="Sriperumbudur">Sriperumbudur</option>
            </select>
          </div>

          <div>
            <label className="form-label">Connector Standard</label>
            <select className="form-select" value={selectedConnector} onChange={e => setSelectedConnector(e.target.value)}>
              <option value="">All Connectors</option>
              <option value="CCS2">CCS2 (DC Fast)</option>
              <option value="CHAdeMO">CHAdeMO (DC)</option>
              <option value="TYPE2">Type 2 (AC)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingBottom: '0.4rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={e => setAvailableOnly(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-emerald)' }}
              />
              Available Chargers Only
            </label>
          </div>
        </form>
      </div>

      {/* Stations List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Retrieving real-time station statuses...
        </div>
      ) : stations.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No stations match the search and filter criteria.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {stations.map(station => {
            const availableChargersCount = station.chargers.filter(c => c.status === 'AVAILABLE').length;

            return (
              <div key={station.id} className="glass-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <h2 style={{ fontSize: '1.3rem' }}>{station.name}</h2>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        {station.code}
                      </span>
                      <StatusBadge status={station.status} />
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {station.address}, {station.city} {station.state ? `, ${station.state}` : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: availableChargersCount > 0 ? 'var(--good)' : 'var(--danger)' }}>
                        {availableChargersCount} / {station.total_chargers} Available
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-Time Bay Availability</div>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                {station.amenities && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    {station.amenities.split(',').map((am, idx) => (
                      <span key={idx} style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '0.2rem 0.6rem', borderRadius: '9999px', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                        {am.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Individual Chargers Grid */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                    Station Charging Bays ({station.chargers.length})
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {station.chargers.map(charger => {
                      const isAvailable = charger.status === 'AVAILABLE';

                      return (
                        <div
                          key={charger.id}
                          style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '0.75rem'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
                                {charger.identifier}
                              </span>
                              <StatusBadge status={charger.status} />
                            </div>

                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {charger.connector_type} ({charger.current_type}) • {charger.power_kw} kW
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Rate: ₹{charger.price_per_kwh.toFixed(2)} / kWh
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
                            <button
                              onClick={() => openReservationModal(charger)}
                              disabled={!isAvailable}
                              className="btn btn-secondary btn-sm"
                              style={{ flex: 1, opacity: isAvailable ? 1 : 0.5, cursor: isAvailable ? 'pointer' : 'not-allowed' }}
                            >
                              <Calendar size={13} /> Reserve
                            </button>
                            <button
                              onClick={() => onStartSession(charger)}
                              disabled={!isAvailable}
                              className="btn btn-primary btn-sm"
                              style={{ flex: 1, opacity: isAvailable ? 1 : 0.5, cursor: isAvailable ? 'pointer' : 'not-allowed' }}
                            >
                              <Play size={13} /> Charge
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reservation Modal */}
      <Modal
        isOpen={reservationModalOpen}
        onClose={() => setReservationModalOpen(false)}
        title={`Reserve Slot: ${selectedCharger?.identifier || ''}`}
      >
        {reservationSuccess ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle size={48} color="var(--good)" style={{ marginBottom: '1rem' }} />
            <h4>Reservation Confirmed!</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{reservationSuccess}</p>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Confirm your reservation slot for <strong>{selectedCharger?.identifier}</strong> ({selectedCharger?.connector_type} {selectedCharger?.power_kw}kW) at ₹{selectedCharger?.price_per_kwh}/kWh.
            </p>

            <div className="form-group">
              <label className="form-label">Reservation Date</label>
              <input
                type="date"
                className="form-input"
                value={reservationDate}
                onChange={e => setReservationDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slot Start Time</label>
              <input
                type="time"
                className="form-input"
                value={reservationTime}
                onChange={e => setReservationTime(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setReservationModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleConfirmReservation} disabled={reserving}>
                {reserving ? 'Booking Slot...' : 'Confirm Slot Reservation'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
