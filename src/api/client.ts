export type ApiRole = 'passenger' | 'driver' | 'admin';

const TOKEN_KEY = 'shuttle_api_token';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const apiToken = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const token = apiToken.get();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`/api${path}`, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, payload.error || payload.message || 'API request failed');
  return payload as T;
}

export async function apiLogin(role: ApiRole, username: string, password: string) {
  const result = await api<{ token: string; user: Record<string, unknown> }>(`/auth/${role}/login`, {
    method: 'POST', body: JSON.stringify({ username, password }),
  });
  apiToken.set(result.token);
  return result.user;
}

export async function apiRegisterPassenger(input: {
  name: string;
  username: string;
  password: string;
  user_type: string;
  phone: string;
  email: string;
}) {
  return api<{ status: string; user_id: number }>('/auth/passenger/register', {
    method: 'POST', body: JSON.stringify(input),
  });
}

export async function apiAdminMasters() {
  return api<{
    employees: Record<string, unknown>[];
    positions: Record<string, unknown>[];
    departments: Record<string, unknown>[];
    permissions: Record<string, unknown>[];
    vehicles: Record<string, unknown>[];
    vehicleTypes: Record<string, unknown>[];
    routes: Record<string, unknown>[];
    stops: Record<string, unknown>[];
    routeStops: Record<string, unknown>[];
    trips: Record<string, unknown>[];
  }>('/admin/masters');
}

export async function apiCreateTrips(input: {
  route_id: number;
  service_date: string;
  departure_times: string[];
  driver_id: string;
  vehicle_id: string;
}) {
  return api<{ trips: Record<string, unknown>[] }>('/admin/trips/batch', {
    method: 'POST', body: JSON.stringify(input),
  });
}

export async function apiUpdateTrip(tripId: number, input: {
  route_id: number;
  service_date: string;
  departure_time: string;
  driver_id: string;
  vehicle_id: string;
}) {
  return api<{ trip: Record<string, unknown> }>(`/admin/trips/${tripId}`, {
    method: 'PUT', body: JSON.stringify(input),
  });
}

export async function apiCreateRoute(input: { name: string; status?: number }) {
  return api<{ route: Record<string, unknown> }>('/admin/routes', {
    method: 'POST', body: JSON.stringify(input),
  });
}

export async function apiUpdateRoute(routeId: number, input: { name: string; status?: number }) {
  return api<{ route: Record<string, unknown> }>(`/admin/routes/${routeId}`, {
    method: 'PUT', body: JSON.stringify(input),
  });
}

export async function apiDeleteRoute(routeId: number) {
  return api<{ route_id: number; deleted: boolean }>(`/admin/routes/${routeId}`, {
    method: 'DELETE',
  });
}

export async function apiCreateStop(input: { name: string; description?: string; status?: number }) {
  return api<{ stop: Record<string, unknown> }>('/admin/stops', {
    method: 'POST', body: JSON.stringify(input),
  });
}

export async function apiUpdateStop(stopId: number, input: { name: string; description?: string; status?: number }) {
  return api<{ stop: Record<string, unknown> }>(`/admin/stops/${stopId}`, {
    method: 'PUT', body: JSON.stringify(input),
  });
}

export async function apiDeleteStop(stopId: number) {
  return api<{ stop_id: number; deleted: boolean }>(`/admin/stops/${stopId}`, {
    method: 'DELETE',
  });
}

export async function apiCreateRouteStop(routeId: number, input: {
  stop_id: number;
  stop_order: number;
  minutes_from_prev: number;
}) {
  return api<{ routeStop: Record<string, unknown> }>(`/admin/routes/${routeId}/stops`, {
    method: 'POST', body: JSON.stringify(input),
  });
}

export async function apiUpdateRouteStop(routeId: number, routeStopId: number, input: {
  stop_id: number;
  stop_order: number;
  minutes_from_prev: number;
}) {
  return api<{ routeStop: Record<string, unknown> }>(`/admin/routes/${routeId}/stops/${routeStopId}`, {
    method: 'PUT', body: JSON.stringify(input),
  });
}

export async function apiDeleteRouteStop(routeId: number, routeStopId: number) {
  return api<{ route_id: number; route_stop_id: number; deleted: boolean }>(`/admin/routes/${routeId}/stops/${routeStopId}`, {
    method: 'DELETE',
  });
}

export async function apiCreateVehicleType(name: 'รถตู้' | 'รถบัส') {
  return api<{ vehicleType: Record<string, unknown> }>('/admin/vehicle-types', {
    method: 'POST', body: JSON.stringify({ name }),
  });
}

export async function apiCreateVehicle(input: {
  vehicle_id: string;
  license_plate: string;
  type: 'รถตู้' | 'รถบัส';
  capacity: number;
}) {
  return api<{ vehicle: Record<string, unknown> }>('/admin/vehicles', {
    method: 'POST', body: JSON.stringify(input),
  });
}

export async function apiUpdateVehicle(vehicleId: string, input: {
  license_plate: string;
  type: 'รถตู้' | 'รถบัส';
  capacity: number;
}) {
  return api<{ vehicle: Record<string, unknown> }>(`/admin/vehicles/${encodeURIComponent(vehicleId)}`, {
    method: 'PUT', body: JSON.stringify(input),
  });
}

export async function apiSetVehicleStatus(vehicleId: string, status: 0 | 1) {
  return api<{ vehicle_id: string; status: number }>(`/admin/vehicles/${encodeURIComponent(vehicleId)}/status`, {
    method: 'POST', body: JSON.stringify({ status }),
  });
}

export async function apiCreateEmployee(input: {
  fullname: string;
  username: string;
  password: string;
  phone: string;
  email: string;
  department_id: number;
  position_id: number;
}) {
  return api<{ employee: Record<string, unknown> }>('/admin/employees', {
    method: 'POST', body: JSON.stringify(input),
  });
}

export async function apiUpdateEmployee(employeeId: string, input: {
  fullname: string;
  username: string;
  password?: string;
  phone: string;
  email: string;
  department_id: number;
  position_id: number;
}) {
  return api<{ employee: Record<string, unknown> }>(`/admin/employees/${encodeURIComponent(employeeId)}`, {
    method: 'PUT', body: JSON.stringify(input),
  });
}

export async function apiHideEmployee(employeeId: string) {
  return api<{ employee_id: string; hidden: boolean }>(`/admin/employees/${encodeURIComponent(employeeId)}/hide`, { method: 'POST' });
}

export async function apiCreatePosition(name: string) {
  return api<{ position: Record<string, unknown> }>('/admin/positions', {
    method: 'POST', body: JSON.stringify({ name }),
  });
}

export async function apiUpdatePosition(positionId: number, name: string) {
  return api<{ position: Record<string, unknown> }>(`/admin/positions/${positionId}`, {
    method: 'PUT', body: JSON.stringify({ name }),
  });
}

export async function apiCreateDepartment(name: string) {
  return api<{ department: Record<string, unknown> }>('/admin/departments', {
    method: 'POST', body: JSON.stringify({ name }),
  });
}

export async function apiUpdateDepartment(departmentId: number, name: string) {
  return api<{ department: Record<string, unknown> }>(`/admin/departments/${departmentId}`, {
    method: 'PUT', body: JSON.stringify({ name }),
  });
}

export async function apiHideAdminRecord(entity: 'position' | 'department' | 'permission', recordKey: string | number) {
  return api<{ entity: string; record_key: string; hidden: boolean }>('/admin/visibility/hide', {
    method: 'POST', body: JSON.stringify({ entity, record_key: String(recordKey) }),
  });
}

export async function apiUpdateTripStatus(tripId: number, status: 0 | 1) {
  return api<{ trip_id: number; status: number }>(`/admin/trips/${tripId}/status`, {
    method: 'POST', body: JSON.stringify({ status }),
  });
}

export async function apiUpsertPermission(input: {
  position_id: number;
  screen_code: string;
  can_view: boolean;
  can_edit: boolean;
}) {
  return api<{ permission: Record<string, unknown> }>('/admin/permissions', {
    method: 'POST', body: JSON.stringify(input),
  });
}

export async function apiHideBooking(bookingId: number) {
  return api<{ booking_id: number; hidden: boolean }>(`/bookings/${bookingId}/hide`, { method: 'POST' });
}
