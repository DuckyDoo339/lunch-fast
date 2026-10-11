export type Role = 'owner' | 'rider';

export type Page =
  | 'dashboard'
  | 'customers'
  | 'orders'
  | 'routes'
  | 'reports'
  | 'jobs'
  | 'navigation'
  | 'delivery';

export interface Session {
  role: Role;
  rider: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  note: string;
}

export interface Order {
  id: number;
  customer: number;
  boxes: number;
  status: string;
  reason?: string;
}

export interface Rider {
  id: number;
  name: string;
}

export interface DeliveryRoute {
  rider: number;
  ids: number[];
}

export interface HistoryEntry {
  at: string;
  message: string;
}

export interface Settings {
  delay: number;
  depart: string;
  shop?: { lat: number; lng: number };
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface AppState {
  customers: Customer[];
  orders: Order[];
  riders: Rider[];
  routes: DeliveryRoute[];
  history: HistoryEntry[];
  settings: Settings;
}

export interface MenuItem {
  page: Page;
  label: string;
}

export interface DeliveryPoint {
  id: number;
  d: number;
  minutes: number;
}

export interface RouteMetrics {
  distance: number;
  deliveries: DeliveryPoint[];
  time: number;
  source: 'road' | 'estimate';
}

export interface RoadEntry {
  geometry: { coordinates: [number, number][] };
  legs: number[];
  at: number;
}

export type RoadData = Record<string, RoadEntry>;

export interface RouteContext {
  orders: Order[];
  customers: Customer[];
  settings: Settings;
  shop: LatLng;
}
