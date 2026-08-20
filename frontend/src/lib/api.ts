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

async function get<T>(path: string): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(path, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

export const fetchSpecialties = () => get<Specialty[]>('/api/specialties');

export function fetchDoctors(opts: { limit?: number; specialtyId?: number } = {}) {
  const params = new URLSearchParams({ limit: String(opts.limit ?? 12) });
  if (opts.specialtyId) params.set('specialty_id', String(opts.specialtyId));
  return get<DoctorSummary[]>(`/api/doctors?${params}`);
}
