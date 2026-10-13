import { request } from './api';
import {
  Station, Charger, Reservation, ChargingSession,
  Payment, Notification, AdminStats
} from '../types/ev';

export const evService = {
  // Stations
  async getStations(params?: {
    q?: string;
    city?: string;
    status?: string;
    connector_type?: string;
    min_power_kw?: number;
    available_only?: boolean;
  }): Promise<Station[]> {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.city) query.append('city', params.city);
    if (params?.status) query.append('status', params.status);
    if (params?.connector_type) query.append('connector_type', params.connector_type);
    if (params?.min_power_kw) query.append('min_power_kw', params.min_power_kw.toString());
    if (params?.available_only) query.append('available_only', 'true');

    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<Station[]>(`/stations${qs}`);
  },

  async getStation(id: number): Promise<Station> {
    return request<Station>(`/stations/${id}`);
  },

  async createStation(data: Partial<Station>): Promise<Station> {
    return request<Station>('/stations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateStation(id: number, data: Partial<Station>): Promise<Station> {
    return request<Station>(`/stations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteStation(id: number): Promise<void> {
    return request<void>(`/stations/${id}`, {
      method: 'DELETE'
    });
  },

  // Chargers
  async getChargers(params?: { station_id?: number; status?: string }): Promise<Charger[]> {
    const query = new URLSearchParams();
    if (params?.station_id) query.append('station_id', params.station_id.toString());
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<Charger[]>(`/chargers${qs}`);
  },

  async updateChargerStatus(id: number, newStatus: string): Promise<Charger> {
    return request<Charger>(`/chargers/${id}/status?new_status=${newStatus}`, {
      method: 'PATCH'
    });
  },

  // Reservations
  async getReservations(): Promise<Reservation[]> {
    return request<Reservation[]>('/reservations');
  },

  async createReservation(data: {
    charger_id: number;
    start_time: string;
    end_time: string;
    notes?: string;
  }): Promise<Reservation> {
    return request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async cancelReservation(id: number): Promise<Reservation> {
    return request<Reservation>(`/reservations/${id}/cancel`, {
      method: 'PATCH'
    });
  },

  // Sessions
  async getSessions(status?: string): Promise<ChargingSession[]> {
    const qs = status ? `?status_filter=${status}` : '';
    return request<ChargingSession[]>(`/sessions${qs}`);
  },

  async getActiveSession(): Promise<ChargingSession | null> {
    return request<ChargingSession | null>('/sessions/active');
  },

  async startSession(data: {
    charger_id: number;
    reservation_id?: number;
    initial_soc?: number;
    target_soc?: number;
  }): Promise<ChargingSession> {
    return request<ChargingSession>('/sessions/start', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateProgress(id: number, data: {
    current_soc: number;
    energy_consumed_kwh: number;
    duration_seconds: number;
  }): Promise<ChargingSession> {
    return request<ChargingSession>(`/sessions/${id}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async completeSession(id: number, data: {
    current_soc: number;
    energy_consumed_kwh: number;
    duration_seconds: number;
    payment_method?: string;
  }): Promise<ChargingSession> {
    return request<ChargingSession>(`/sessions/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Payments
  async getPayments(): Promise<Payment[]> {
    return request<Payment[]>('/payments');
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return request<Notification[]>('/notifications');
  },

  async markNotificationRead(id: number): Promise<Notification> {
    return request<Notification>(`/notifications/${id}/read`, {
      method: 'PATCH'
    });
  },

  async markAllNotificationsRead(): Promise<void> {
    return request<void>('/notifications/read-all', {
      method: 'PATCH'
    });
  },

  // Admin Operations
  async getAdminStats(): Promise<AdminStats> {
    return request<AdminStats>('/admin/stats');
  },

  async getAdminActiveSessions(): Promise<ChargingSession[]> {
    return request<ChargingSession[]>('/admin/active-sessions');
  },

  async emergencyStopSession(id: number): Promise<ChargingSession> {
    return request<ChargingSession>(`/admin/sessions/${id}/stop`, {
      method: 'POST'
    });
  }
};
