import { getAccessToken } from './auth';

export interface Specialty {
  id: number;
  name: string;
  slug: string;
}

export interface Facility {
  id: number;
  name: string;
  address: string;
  phone_number: string | null;
  rating: number;
}

export const fetchFacilities = (opts: { limit?: number } = {}) => get<Facility[]>(`/api/facilities?limit=${opts.limit ?? 50}`);

export interface DoctorSummary {
  id: number;
  display_name: string;
  specialty: Specialty;
  facility: Facility | null;
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
  provider: string;
  amount_vnd: number;
  status: string;
  expires_at: string;
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

async function del(path: string): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(path, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new ApiError(res.status, detail?.detail ?? `${path} -> ${res.status}`);
  }
}

export const fetchSpecialties = () => get<Specialty[]>('/api/specialties');

export function fetchDoctors(opts: { limit?: number; specialtyId?: number } = {}) {
  const params = new URLSearchParams({ limit: String(opts.limit ?? 12) });
  if (opts.specialtyId) params.set('specialty_id', String(opts.specialtyId));
  return get<DoctorSummary[]>(`/api/doctors?${params}`);
}

export const fetchDoctor = (id: number) => get<DoctorDetail>(`/api/doctors/${id}`);

/** Resolves to null when the doctor account has no profile row yet (backend answers 404). */
export async function fetchMyDoctorProfile(): Promise<DoctorDetail | null> {
  try {
    return await get<DoctorDetail>('/api/doctor/me');
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export interface DoctorProfileInput {
  specialty_id: number;
  facility_id: number | null;
  display_name: string;
  bio: string | null;
  clinic_name: string | null;
  years_experience: number;
  consultation_fee_vnd: number | null;
  avatar_url: string | null;
}

/** Also creates the profile row on first save — the backend PUT upserts. */
export const saveMyDoctorProfile = (input: DoctorProfileInput) => put<DoctorDetail>('/api/doctor/me', input);

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

export function fetchDoctorAppointments(opts: { date?: string; status?: string; limit?: number } = {}) {
  const params = new URLSearchParams({ limit: String(opts.limit ?? 20) });
  if (opts.date) params.set('date', opts.date);
  if (opts.status) params.set('status', opts.status);
  return get<AppointmentRead[]>(`/api/doctor/appointments?${params}`);
}

export const cancelDoctorAppointment = (appointmentId: number, reason: string) =>
  post<unknown>(`/api/doctor/appointments/${appointmentId}/cancel`, { reason });

export const completeAppointment = (appointmentId: number) =>
  post<AppointmentRead>(`/api/doctor/appointments/${appointmentId}/complete`, {});

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

export interface SymptomClassification {
  urgent: boolean;
  specialty_id: number | null;
  specialty_name: string | null;
  reason: string;
  emergency_message: string | null;
}

export interface DoctorRecommendation {
  doctor_id: number;
  doctor_name: string;
  specialty_name: string;
  facility_name: string | null;
  rating: number;
  available_slots: string[];
  factors: string[];
}

export interface RecommendationRead {
  classification: SymptomClassification;
  doctors: DoctorRecommendation[];
}

export const recommendDoctors = (description: string, appointmentDate: string) =>
  post<RecommendationRead>('/api/recommendations/doctors', {
    description,
    appointment_date: appointmentDate,
  });

export interface ChatReply {
  reply: string;
  tools_used: string[];
}

/** The actual Gemini-backed chatbot — stateless per call, no server-side conversation memory. */
export const sendChatMessage = (message: string) => post<ChatReply>('/api/chat', { message });

export interface WorkingDay {
  id: number;
  work_date: string;
  start_time: string;
  end_time: string;
}

export const fetchWorkingDays = (dateFrom: string, dateTo: string) =>
  get<WorkingDay[]>(`/api/doctor/schedules?date_from=${dateFrom}&date_to=${dateTo}`);

export const addWorkingInterval = (workDate: string, startTime: string, endTime: string) =>
  post<WorkingDay>(`/api/doctor/schedules/${workDate}`, { start_time: startTime, end_time: endTime });

export const closeWorkingDay = (workDate: string) => del(`/api/doctor/schedules/${workDate}`);

export interface BlockedSlot {
  id: number;
  block_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
}

export const fetchBlockedSlots = (dateFrom: string, dateTo: string) =>
  get<BlockedSlot[]>(`/api/doctor/blocked-slots?date_from=${dateFrom}&date_to=${dateTo}`);

export const addBlockedSlot = (blockDate: string, startTime: string, endTime: string, reason: string) =>
  post<BlockedSlot>('/api/doctor/blocked-slots', { block_date: blockDate, start_time: startTime, end_time: endTime, reason: reason || null });

export const deleteBlockedSlot = (id: number) => del(`/api/doctor/blocked-slots/${id}`);
