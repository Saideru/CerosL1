// Vercel Routing Middleware: every page of the app requires an active Whop membership.
// Visitors without a valid session are sent to "Sign in with Whop" first.
import { next } from '@vercel/functions';
import { SESSION_COOKIE, getCookie, readSession, redirect } from './lib/whop-session.js';

export const config = {
  // Everything except the sign-in routes themselves
  matcher: ['/((?!api/auth/).*)']
};

export default async function middleware(request: Request): Promise<Response> {
  const uid = await readSession(getCookie(request, SESSION_COOKIE));
  if (uid) return next();
  return redirect('/api/auth/login');
}
