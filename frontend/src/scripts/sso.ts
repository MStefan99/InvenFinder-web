import * as oauth from 'oauth4webapi';
import appState from './store';

const algorithm = 'oidc';
const redirect_uri = window.location.origin;
const code_challenge_method = 'S256';

async function discover(issuer: URL, client_id: string, client_secret: string) {
  const as = await oauth
    .discoveryRequest(issuer, { algorithm })
    .then((response) => oauth.processDiscoveryResponse(issuer, response));

  const client: oauth.Client = { client_id };
  const clientAuth = oauth.ClientSecretPost(client_secret);

  return { as, client, clientAuth };
}

export async function login(ssoName: string): Promise<boolean> {
  const ssoConfig = appState.ssoProviders.get(ssoName);
  if (!ssoConfig) {
    return false;
  }

  const { as, client } = await discover(
    new URL(ssoConfig.issuer),
    ssoConfig.client_id,
    ssoConfig.client_secret,
  );

  const code_verifier = oauth.generateRandomCodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);

  const authorizationUrl = new URL(as.authorization_endpoint!);
  authorizationUrl.searchParams.set('client_id', client.client_id);
  authorizationUrl.searchParams.set('redirect_uri', redirect_uri);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('scope', 'openid email');
  authorizationUrl.searchParams.set('code_challenge', code_challenge);
  authorizationUrl.searchParams.set('code_challenge_method', code_challenge_method);

  sessionStorage.setItem('ssoName', ssoConfig.name);
  sessionStorage.setItem('codeVerifier', code_verifier);

  window.location.href = authorizationUrl.href;
  return true; // For TS
}

export async function getTokens(): Promise<oauth.TokenEndpointResponse | null> {
  const ssoName = sessionStorage.getItem('ssoName');
  const ssoConfig = appState.ssoProviders.get(ssoName);
  if (!ssoConfig) {
    return null;
  }

  const { as, client, clientAuth } = await discover(
    new URL(ssoConfig.issuer),
    ssoConfig.client_id,
    ssoConfig.client_secret,
  );

  const currentUrl: URL = new URL(window.location.href);
  const params = oauth.validateAuthResponse(as, client, currentUrl);

  const code_verifier = sessionStorage.getItem('codeVerifier');
  if (!code_verifier) {
    return null;
  }

  const response = await oauth.authorizationCodeGrantRequest(
    as,
    client,
    clientAuth,
    params,
    redirect_uri,
    code_verifier,
  );

  const result = await oauth.processAuthorizationCodeResponse(as, client, response);

  sessionStorage.removeItem('ssoName');

  appState.setApiKey(result.access_token);
  appState.setSsoName(ssoConfig.name);

  return result;
}
