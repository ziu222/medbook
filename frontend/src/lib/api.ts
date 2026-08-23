import { getAccessToken } from './auth';

export interface Specialty {
  id: number;
  name: string;
  slug: string;
}

export interface DoctorSummary {
  id: number;
  display_name: string;
  specialty: Specialty;
  clinic_name: string | null;
  years_experience: number;
  rating: number;
  consultation_fee_vnd: number | null;
  avatar_url: string | null;
}

export interface DoctorDetail extends DoctorSummary {
  bio: string | null;
}

export interface AvailabilitySlot {
  start_time: string;
  end_time: string;
}

export interface AppointmentRead {
  id: number;
  doctor_id: number;
  booking_for: string;
  patient_full_name: string;
  patient_phone_number: string | null;
  symptoms: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
}

export interface PaymentRead {
  appointment_id: number;
  amount_vnd: number;
  status: string;
  checkout_url: string;
}

/** Carries the HTTP status so callers can tell "no profile yet" (404) from a real failure. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function get<T>(path: string): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(path, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  if (!res.ok) throw new ApiError(res.status, `${path} -> ${res.status}`);
  return res.json();
}

async function send<T>(method: 'POST' | 'PUT', path: string, body: unknown): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { method, headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new ApiError(res.status, detail?.detail ?? `${path} -> ${res.status}`);
  }
  return res.json();
}

const post = <T>(path: string, body: unknown) => send<T>('POST', path, body);
const put = <T>(path: string, body: unknown) => send<T>('PUT', path, body);

export const fetchSpecialties = () => get<Specialty[]>('/api/specialties');

export function fetchDoctors(opts: { limit?: number; specialtyId?: number } = {}) {
  const params = new URLSearchParams({ limit: String(opts.limit ?? 12) });
  if (opts.specialtyId) params.set('specialty_id', String(opts.specialtyId));
  return get<DoctorSummary[]>(`/api/doctors?${params}`);
}

export const fetchDoctor = (id: number) => get<DoctorDetail>(`/api/doctors/${id}`);

export const fetchAvailability = (doctorId: number, date: string) =>
  get<AvailabilitySlot[]>(`/api/doctors/${doctorId}/availability?date=${date}`);

export interface BookAppointmentInput {
  doctorId: number;
  appointmentDate: string;
  startTime: string;
  symptoms: string;
}

export const bookAppointment = (input: BookAppointmentInput) =>
  post<AppointmentRead>('/api/appointments', {
    doctor_id: input.doctorId,
    appointment_date: input.appointmentDate,
    start_time: input.startTime,
    symptoms: input.symptoms,
    booking_for: 'self',
  });

export const startPayment = (appointmentId: number) => post<PaymentRead>(`/api/appointments/${appointmentId}/payment`, {});

export const fetchMyAppointments = () => get<AppointmentRead[]>('/api/appointments/me');

export interface UserProfile {
  cognito_sub: string;
  display_name: string;
  phone_number: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileInput {
  display_name: string;
  phone_number: string | null;
  date_of_birth: string | null;
}

/**
 * Resolves to null when the account has no profile row yet — the backend answers 404 there,
 * and that is the normal state for someone who just registered, not an error.
 */
export async function fetchMyProfile(): Promise<UserProfile | null> {
  try {
    return await get<UserProfile>('/api/users/me');
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export const saveMyProfile = (input: UserProfileInput) => put<UserProfile>('/api/users/me', input);
