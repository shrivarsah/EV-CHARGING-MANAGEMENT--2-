export type ChargerStatus = 'AVAILABLE' | 'RESERVED' | 'CHARGING' | 'MAINTENANCE' | 'OFFLINE';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';
export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Charger {
  id: number;
  station_id: number;
  identifier: string;
  connector_type: string; // CCS2, TYPE2, CHADEMO, GBT
  power_kw: number;
  current_type: 'AC' | 'DC';
  price_per_kwh: number;
  status: ChargerStatus;
  created_at: string;
  updated_at: string;
}

export interface Station {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  state?: string | null;
  latitude: number;
  longitude: number;
  total_chargers: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  amenities: string;
  created_at: string;
  chargers: Charger[];
}

export interface Reservation {
  id: number;
  user_id: number;
  charger_id: number;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  notes?: string | null;
  created_at: string;
  charger?: Charger | null;
}

export interface ChargingSession {
  id: number;
  user_id: number;
  charger_id: number;
  reservation_id?: number | null;
  start_time: string;
  end_time?: string | null;
  status: SessionStatus;
  initial_soc: number;
  current_soc: number;
  target_soc: number;
  energy_consumed_kwh: number;
  duration_seconds: number;
  total_amount: number;
  created_at: string;
  charger?: Charger | null;
}

export interface Payment {
  id: number;
  session_id: number;
  user_id: number;
  transaction_ref: string;
  amount: number;
  payment_method: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  is_read: boolean;
  created_at: string;
}

export interface AdminStats {
  total_stations: number;
  total_chargers: number;
  available_chargers: number;
  active_sessions: number;
  total_energy_kwh: number;
  total_revenue: number;
  utilization_rate: number;
}
