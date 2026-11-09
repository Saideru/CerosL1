// Clears the Whop paywall session (visit /api/auth/logout).
import { SESSION_COOKIE, WHOP_PRODUCT_PAGE, cookie, redirect } from '../../lib/whop-session.js';

export function GET(): Response {
  return redirect(WHOP_PRODUCT_PAGE, [cookie(SESSION_COOKIE, '', 0)]);
}
