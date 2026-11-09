// Vercel Routing Middleware: every page of the app requires an active Whop membership.
// Visitors without a valid session are sent to "Sign in with Whop" first.
import { next } from '@vercel/functions';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'whop_session';

export const config = {
  // Everything except the sign-in routes themselves
  matcher: ['/((?!api/auth/).*)']
};

function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return undefined;
}

async function readSession(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) return null;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return typeof payload.uid === 'string' ? payload.uid : null;
  } catch {
    return null;
  }
}

export default async function middleware(request: Request): Promise<Response> {
  const uid = await readSession(getCookie(request, SESSION_COOKIE));
  if (uid) return next();
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL('/api/auth/login', request.url).toString(),
      'Cache-Control': 'no-store'
    }
  });
}
