// Cognito Managed Login (Hosted UI), OAuth2 authorization-code + PKCE.
// There is no password API — the backend only verifies Cognito-issued JWTs (see backend/app/core/auth.py).

const DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN as string | undefined;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined;
const REDIRECT_URI = (import.meta.env.VITE_COGNITO_REDIRECT_URI as string | undefined) ?? `${window.location.origin}/auth/callback`;
const LOGOUT_URI = (import.meta.env.VITE_COGNITO_LOGOUT_URI as string | undefined) ?? `${window.location.origin}/`;
const SCOPES = 'openid email profile';

const VERIFIER_KEY = 'medbook.pkce_verifier';
const TOKENS_KEY = 'medbook.tokens';

interface StoredTokens {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_at: number;
}

function requireConfig(): { domain: string; clientId: string } {
  if (!DOMAIN || !CLIENT_ID) {
    throw new Error('Cognito chưa được cấu hình — thiếu VITE_COGNITO_DOMAIN / VITE_COGNITO_CLIENT_ID (xem frontend/.env.example)');
  }
  return { domain: DOMAIN, clientId: CLIENT_ID };
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function pkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}

async function redirectTo(path: 'login' | 'signup', loginHint?: string): Promise<void> {
  const { domain, clientId } = requireConfig();
  const { verifier, challenge } = await pkcePair();
  sessionStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  if (loginHint) params.set('login_hint', loginHint);
  window.location.assign(`${domain}/${path}?${params}`);
}

export const redirectToLogin = (loginHint?: string) => redirectTo('login', loginHint);
export const redirectToSignup = (loginHint?: string) => redirectTo('signup', loginHint);

/** Call on the /auth/callback route. Exchanges ?code= for tokens and stores them. */
export async function handleAuthCallback(): Promise<void> {
  const url = new URL(window.location.href);
  const error = url.searchParams.get('error');
  if (error) throw new Error(url.searchParams.get('error_description') ?? error);

  const code = url.searchParams.get('code');
  if (!code) return;

  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  if (!verifier) throw new Error('Thiếu PKCE verifier, vui lòng đăng nhập lại');

  const { domain, clientId } = requireConfig();
  const res = await fetch(`${domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });
  if (!res.ok) throw new Error(`Đổi mã xác thực thất bại: ${res.status}`);

  const data = await res.json();
  const tokens: StoredTokens = {
    access_token: data.access_token,
    id_token: data.id_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  sessionStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

// ponytail: no silent refresh — refresh_token is stored but unused. Add a refresh-on-401
// (grant_type=refresh_token) once sessions expiring mid-use is an actual complaint.
export function getAccessToken(): string | null {
  const raw = sessionStorage.getItem(TOKENS_KEY);
  if (!raw) return null;
  const tokens: StoredTokens = JSON.parse(raw);
  if (Date.now() >= tokens.expires_at) {
    sessionStorage.removeItem(TOKENS_KEY);
    return null;
  }
  return tokens.access_token;
}

export const isAuthenticated = (): boolean => getAccessToken() !== null;

interface IdTokenClaims {
  email?: string;
  name?: string;
  'cognito:groups'?: string[];
}

/**
 * Claims off the stored ID token. Read-only display only — the backend verifies its own copy,
 * so nothing here is trusted for authorisation. Email lives here rather than in user_profiles.
 */
export function getIdTokenClaims(): IdTokenClaims | null {
  const raw = sessionStorage.getItem(TOKENS_KEY);
  if (!raw) return null;
  try {
    const { id_token }: StoredTokens = JSON.parse(raw);
    const payload = id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    // atob yields a latin1 byte string — decoding it as UTF-8 is what keeps "Trọng Nghĩa"
    // from arriving as "TrÃ¡Â»ng NghÄ©a".
    const bytes = Uint8Array.from(atob(payload), (ch) => ch.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export type UserRole = 'patient' | 'doctor' | 'admin';

/** Display-only, like getIdTokenClaims — the backend re-checks the role on every request. */
export function getUserRole(): UserRole | null {
  const groups = getIdTokenClaims()?.['cognito:groups'] ?? [];
  return (['doctor', 'admin', 'patient'] as const).find((role) => groups.includes(role)) ?? null;
}

export function logout(): void {
  sessionStorage.removeItem(TOKENS_KEY);
  const { domain, clientId } = requireConfig();
  const params = new URLSearchParams({ client_id: clientId, logout_uri: LOGOUT_URI });
  window.location.assign(`${domain}/logout?${params}`);
}
