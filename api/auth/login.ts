// Step 1: send the visitor to Whop to sign in.
import { PKCE_COOKIE, callbackUrl, cookie, randomString, redirect, sha256base64url } from '../../lib/whop-session';

export async function GET(request: Request): Promise<Response> {
  const verifier = randomString(32);
  const state = randomString(16);

  const url = new URL('https://api.whop.com/oauth/authorize');
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.WHOP_CLIENT_ID || '',
    redirect_uri: callbackUrl(request),
    scope: 'openid profile',
    state,
    nonce: randomString(16),
    code_challenge: await sha256base64url(verifier),
    code_challenge_method: 'S256'
  }).toString();

  return redirect(url.toString(), [cookie(PKCE_COOKIE, JSON.stringify({ verifier, state }), 600)]);
}
