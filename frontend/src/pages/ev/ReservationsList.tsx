import React, { useState, useEffect } from 'react';
import { CalendarClock, Play, XCircle } from 'lucide-react';
import { Reservation, Charger } from '../../types/ev';
import { evService } from '../../services/evService';
import { StatusBadge } from '../../components/StatusBadge';

interface ReservationsListProps {
  onStartSession: (charger: Charger) => void;
  onRefreshNotifications: () => void;
}

export const ReservationsList: React.FC<ReservationsListProps> = ({
  onStartSession,
  onRefreshNotifications
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const data = await evService.getReservations();
      setReservations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this reservation slot?')) return;
    try {
      await evService.cancelReservation(id);
      onRefreshNotifications();
      loadReservations();
    } catch (err: any) {
      alert(`Cancel failed: ${err.message}`);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Slot Reservations</h1>
          <p className="page-subtitle">Manage upcoming and past charger bay bookings</p>
        </div>
        <button onClick={loadReservations} className="btn btn-secondary btn-sm">
          Refresh
        </button>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading reservations...
          </div>
        ) : reservations.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CalendarClock size={36} style={{ marginBottom: '0.75rem' }} />
            <p>No reservations found. Reserve a slot from the Stations catalog.</p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Charger Bay</th>
                  <th>Slot Window</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(res => {
                  const isConfirmed = res.status === 'CONFIRMED';
                  return (
                    <tr key={res.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{res.id}</td>
                      <td>
                        <strong>{res.charger?.identifier || 'Bay'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {res.charger?.connector_type} • {res.charger?.power_kw} kW
                        </div>
                      </td>
                      <td>
                        <div>{new Date(res.start_time).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(res.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} —{' '}
                          {new Date(res.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={res.status} />
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {res.notes || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {isConfirmed && res.charger && (
                            <button
                              onClick={() => onStartSession(res.charger!)}
                              className="btn btn-primary btn-sm"
                            >
                              <Play size={12} /> Start Session
                            </button>
                          )}
                          {isConfirmed && (
                            <button
                              onClick={() => handleCancel(res.id)}
                              className="btn btn-danger btn-sm"
                            >
                              <XCircle size={12} /> Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
