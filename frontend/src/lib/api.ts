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
  status: string;
}

export interface PaymentRead {
  appointment_id: number;
  amount_vnd: number;
  status: string;
  checkout_url: string;
}

async function get<T>(path: string): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(path, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail ?? `${path} -> ${res.status}`);
  }
  return res.json();
}

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
