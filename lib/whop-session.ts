// Shared helpers for the Whop paywall (used by /api/auth/* and middleware.ts).
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'whop_session';
export const PKCE_COOKIE = 'whop_pkce';
export const SESSION_MAX_AGE = 60 * 60 * 24; // 24h: access is re-checked with Whop at least daily

// Where people without access are sent (your Whop product page)
export const WHOP_PRODUCT_PAGE =
  process.env.WHOP_PRODUCT_PAGE || 'https://whop.com/kam-team-e069/cerosl-calculator-a5';

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET is missing or shorter than 32 characters');
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(whopUserId: string): Promise<string> {
  return new SignJWT({ uid: whopUserId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function readSession(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return typeof payload.uid === 'string' ? payload.uid : null;
  } catch {
    return null;
  }
}

export function getCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

export function cookie(name: string, value: string, maxAge: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function redirect(location: string, cookies: string[] = []): Response {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' });
  for (const c of cookies) headers.append('Set-Cookie', c);
  return new Response(null, { status: 302, headers });
}

export function callbackUrl(req: Request): string {
  return new URL('/api/auth/callback', req.url).toString();
}

function base64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function randomString(byteLength = 32): string {
  return base64url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export async function sha256base64url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return base64url(new Uint8Array(digest));
}

/** Asks Whop whether this user currently has access to the CerosL Calculator product. */
export async function hasProductAccess(whopUserId: string): Promise<boolean> {
  const productId = process.env.WHOP_PRODUCT_ID;
  const apiKey = process.env.WHOP_API_KEY;
  if (!productId || !apiKey) throw new Error('WHOP_PRODUCT_ID or WHOP_API_KEY is not set');

  const res = await fetch(
    `https://api.whop.com/api/v1/users/${encodeURIComponent(whopUserId)}/access/${encodeURIComponent(productId)}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  if (!res.ok) {
    console.error('Whop access check failed', res.status, await res.text());
    return false;
  }
  const data = (await res.json()) as { has_access?: boolean };
  return data.has_access === true;
}
