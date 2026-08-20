export const AVATAR_COLORS = ['var(--brand)', 'var(--coral)', 'var(--forest)', 'var(--gold)'];

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarColorFor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}
