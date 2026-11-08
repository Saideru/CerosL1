// Step 2: Whop sends the visitor back here. Check they bought CerosL Calculator, then let them in.
import {
  PKCE_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  WHOP_PRODUCT_PAGE,
  callbackUrl,
  cookie,
  createSession,
  getCookie,
  hasProductAccess,
  redirect
} from '../../lib/whop-session';

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const code = params.get('code');
  const state = params.get('state');
  const clearPkce = cookie(PKCE_COOKIE, '', 0);

  let pkce: { verifier?: string; state?: string } = {};
  try {
    pkce = JSON.parse(getCookie(request, PKCE_COOKIE) || '{}');
  } catch {
    /* ignore */
  }

  if (!code || !state || state !== pkce.state || !pkce.verifier) {
    return redirect('/api/auth/login', [clearPkce]); // expired or tampered: start over
  }

  try {
    const tokenRes = await fetch('https://api.whop.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl(request),
        client_id: process.env.WHOP_CLIENT_ID,
        client_secret: process.env.WHOP_CLIENT_SECRET,
        code_verifier: pkce.verifier
      })
    });
    if (!tokenRes.ok) {
      console.error('Whop token exchange failed', tokenRes.status, await tokenRes.text());
      return new Response('Sign-in with Whop failed. Please try again.', { status: 502 });
    }
    const { access_token } = (await tokenRes.json()) as { access_token: string };

    const meRes = await fetch('https://api.whop.com/oauth/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const me = (await meRes.json()) as { sub?: string };
    if (!me.sub) return new Response('Could not read your Whop account.', { status: 502 });

    if (!(await hasProductAccess(me.sub))) {
      return redirect(WHOP_PRODUCT_PAGE, [clearPkce]); // no active membership or trial
    }

    const session = await createSession(me.sub);
    return redirect('/', [clearPkce, cookie(SESSION_COOKIE, session, SESSION_MAX_AGE)]);
  } catch (err) {
    console.error('Whop callback error', err);
    return new Response('Sign-in with Whop failed. Please try again.', { status: 500 });
  }
}
