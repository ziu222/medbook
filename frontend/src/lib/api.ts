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
  professional_title: string | null;
  years_experience: number;
  slot_duration_minutes: number;
  rating: number;
  avatar_url: string | null;
}

export interface DoctorDetail extends DoctorSummary {
  bio: string | null;
  certificates: string[];
}

export interface AvailabilitySlot {
  start_time: string;
  end_time: string;
}

export type Relationship = 'father' | 'mother' | 'child' | 'spouse' | 'sibling' | 'other';

export const RELATIONSHIP_LABELS: Record<Relationship, string> = {
  father: 'Cha',
  mother: 'Mẹ',
  child: 'Con',
  spouse: 'Vợ/chồng',
  sibling: 'Anh/chị/em',
  other: 'Khác',
};

export interface AppointmentRead {
  id: number;
  doctor_id: number;
  booking_for: 'self' | 'relative';
  patient_full_name: string;
  patient_phone_number: string | null;
  patient_national_id_last4: string | null;
  relationship: Relationship | null;
  symptoms: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  reschedule_count: number;
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
  professional_title?: string | null;
  certificates?: string[];
  years_experience: number;
  slot_duration_minutes?: 30 | 60;
  avatar_url: string | null;
}

/** Also creates the profile row on first save — the backend PUT upserts. */
export const saveMyDoctorProfile = (input: DoctorProfileInput) => put<DoctorDetail>('/api/doctor/me', input);

export const createDoctorAccount = (input: DoctorProfileInput & { email: string }) =>
  post<DoctorDetail>('/api/admin/doctors', input);

export const fetchAvailability = (doctorId: number, date: string) =>
  get<AvailabilitySlot[]>(`/api/doctors/${doctorId}/availability?date=${date}`);

export interface RelativeInput {
  fullName: string;
  relationship: Relationship;
  phoneNumber: string;
  nationalId: string;
}

export interface BookAppointmentInput {
  doctorId: number;
  appointmentDate: string;
  startTime: string;
  symptoms: string;
  /** Omitted (or 'self') books for the account holder; pass `relative` to book on someone else's behalf. */
  relative?: RelativeInput;
  /** Lets a retried/double-clicked submit replay the original booking instead of creating a duplicate. */
  clientRequestId?: string;
}

export const bookAppointment = (input: BookAppointmentInput) =>
  post<AppointmentRead>('/api/appointments', {
    doctor_id: input.doctorId,
    appointment_date: input.appointmentDate,
    start_time: input.startTime,
    symptoms: input.symptoms,
    client_request_id: input.clientRequestId ?? null,
    ...(input.relative
      ? {
          booking_for: 'relative',
          relative: {
            full_name: input.relative.fullName,
            relationship: input.relative.relationship,
            phone_number: input.relative.phoneNumber,
            national_id: input.relative.nationalId,
            consent_confirmed: true,
          },
        }
      : { booking_for: 'self' }),
  });

export const rescheduleAppointment = (appointmentId: number, appointmentDate: string, startTime: string) =>
  post<AppointmentRead>(`/api/appointments/${appointmentId}/reschedule`, {
    appointment_date: appointmentDate,
    start_time: startTime,
  });

export const startPayment = (appointmentId: number) => post<PaymentRead>(`/api/appointments/${appointmentId}/payment`, {});

export interface CancellationRead {
  appointment_id: number;
  refund_percentage: number;
  refund_status: 'not_applicable' | 'pending' | 'succeeded' | 'failed';
}

export const cancelPatientAppointment = (appointmentId: number, reason: string) =>
  post<CancellationRead>(`/api/appointments/${appointmentId}/cancel`, { reason });

export const submitDoctorReview = (appointmentId: number, score: number, comment: string) =>
  put<unknown>(`/api/appointments/${appointmentId}/review`, { score, comment: comment || null });

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

export const fetchAdminBlockedSlots = (doctorId: number, dateFrom: string, dateTo: string) =>
  get<BlockedSlot[]>(`/api/admin/doctors/${doctorId}/blocked-slots?date_from=${dateFrom}&date_to=${dateTo}`);

export const addAdminBlockedSlot = (doctorId: number, blockDate: string, startTime: string, endTime: string, reason: string) =>
  post<BlockedSlot>(`/api/admin/doctors/${doctorId}/blocked-slots`, { block_date: blockDate, start_time: startTime, end_time: endTime, reason: reason || null });

export const deleteAdminBlockedSlot = (doctorId: number, id: number) => del(`/api/admin/doctors/${doctorId}/blocked-slots/${id}`);

export interface DoctorReview {
  id: number;
  appointment_id: number;
  doctor_id: number;
  score: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export const fetchDoctorReviews = (doctorId: number, opts: { limit?: number } = {}) =>
  get<DoctorReview[]>(`/api/doctors/${doctorId}/reviews?limit=${opts.limit ?? 50}`);

export interface MedicalRecord {
  id: number;
  appointment_id: number;
  doctor_id: number;
  clinical_notes: string;
  diagnosis: string | null;
  prescription: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecordInput {
  clinical_notes: string;
  diagnosis: string | null;
  prescription: string | null;
}

/** Resolves to null when no record has been written yet (backend answers 404). */
export async function fetchMedicalRecord(appointmentId: number): Promise<MedicalRecord | null> {
  try {
    return await get<MedicalRecord>(`/api/appointments/${appointmentId}/medical-record`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export const saveMedicalRecord = (appointmentId: number, input: MedicalRecordInput) =>
  put<MedicalRecord>(`/api/doctor/appointments/${appointmentId}/medical-record`, input);

export interface RefundTierInput {
  actor_role: 'patient' | 'provider';
  min_minutes_before: number;
  refund_percentage: number;
}

export interface RefundTier extends RefundTierInput {
  id: number;
}

export interface CancellationPolicy {
  id: number;
  patient_cancel_cutoff_minutes: number;
  provider_cancel_cutoff_minutes: number | null;
  is_active: boolean;
  created_by_sub: string;
  effective_from: string;
  refund_tiers: RefundTier[];
}

export interface CancellationPolicyInput {
  patient_cancel_cutoff_minutes: number;
  provider_cancel_cutoff_minutes: number | null;
  refund_tiers: RefundTierInput[];
}

/** Resolves to null when no policy has ever been activated yet (backend answers 503). */
export async function fetchActiveCancellationPolicy(): Promise<CancellationPolicy | null> {
  try {
    return await get<CancellationPolicy>('/api/admin/cancellation-policies/active');
  } catch (err) {
    if (err instanceof ApiError && err.status === 503) return null;
    throw err;
  }
}

export const createCancellationPolicy = (input: CancellationPolicyInput) =>
  post<CancellationPolicy>('/api/admin/cancellation-policies', input);

export const activateCancellationPolicy = (policyId: number) =>
  post<CancellationPolicy>(`/api/admin/cancellation-policies/${policyId}/activate`, {});
