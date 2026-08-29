export type DoctorNavKey = 'overview' | 'schedule' | 'appointments' | 'profile';

export const DOCTOR_PATHS = {
  overview: '/quan-ly',
  schedule: '/quan-ly/lich-lam-viec',
  appointments: '/quan-ly/cuoc-hen',
  profile: '/quan-ly/ho-so',
} as const satisfies Record<DoctorNavKey, string>;

export const doctorPathForNavKey = (key: DoctorNavKey): string => DOCTOR_PATHS[key];
