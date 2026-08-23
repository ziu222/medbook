import type { NavKey } from '../components/Common/Header';

/**
 * URL for every nav destination. Vietnamese slugs because these are public, shareable pages on a
 * hospital site — CloudFront already rewrites extensionless paths to index.html (see
 * infra/modules/frontend/main.tf), so deep links resolve without any further infrastructure.
 */
export const PATHS = {
  home: '/',
  find: '/tim-bac-si',
  specialties: '/chuyen-khoa',
  appointments: '/lich-hen',
  profile: '/ho-so',
} as const satisfies Partial<Record<NavKey, string>>;

export const doctorPath = (id: number) => `/bac-si/${id}`;
export const specialtyPath = (slug: string) => `/chuyen-khoa/${slug}`;

/** 'ai' has no screen yet, so it stays on the homepage rather than routing nowhere. */
export function pathForNavKey(key: NavKey): string {
  return key in PATHS ? PATHS[key as keyof typeof PATHS] : PATHS.home;
}
