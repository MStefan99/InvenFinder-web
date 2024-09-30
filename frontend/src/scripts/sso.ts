import * as oauth from 'oauth4webapi';
import appState from './store';

// Prerequisites

const algorithm = 'oidc';
const redirect_uri = window.location.origin;

// End of prerequisites

const code_challenge_method = 'S256';

async function discover(issuer: URL, client_id: string, client_secret: string) {
	const as = await oauth
		.discoveryRequest(issuer, {algorithm})
		.then((response) => oauth.processDiscoveryResponse(issuer, response));

	const client: oauth.Client = {
		client_id,
		client_secret,
		token_endpoint_auth_method: 'client_secret_basic'
	};

	return {as, client};
}

export async function login(issuer: string, client_id: string, client_secret: string) {
	const {as, client} = await discover(new URL(issuer), client_id, client_secret);

	const code_verifier = oauth.generateRandomCodeVerifier();
	const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);

	const authorizationUrl = new URL(as.authorization_endpoint!);
	authorizationUrl.searchParams.set('client_id', client.client_id);
	authorizationUrl.searchParams.set('redirect_uri', redirect_uri);
	authorizationUrl.searchParams.set('response_type', 'code');
	authorizationUrl.searchParams.set('scope', 'openid email groups');
	authorizationUrl.searchParams.set('code_challenge', code_challenge);
	authorizationUrl.searchParams.set('code_challenge_method', code_challenge_method);

	sessionStorage.setItem('issuer', issuer);
	sessionStorage.setItem('client_id', client_id);
	sessionStorage.setItem('client_secret', client_secret);
	sessionStorage.setItem('code_verifier', code_verifier);

	window.location.href = authorizationUrl.href;
}

export async function getTokens() {
	const issuer = new URL(sessionStorage.getItem('issuer'));
	const client_id = sessionStorage.getItem('client_id');
	const client_secret = sessionStorage.getItem('client_secret');

	const {as, client} = await discover(issuer, client_id, client_secret);

	const currentUrl: URL = new URL(window.location.href);
	const params = oauth.validateAuthResponse(as, client, currentUrl);
	if (oauth.isOAuth2Error(params)) {
		console.error('Error Response', params);
		throw new Error(); // Handle OAuth 2.0 redirect error
	}

	const code_verifier = sessionStorage.getItem('code_verifier');
	if (!code_verifier) {
		return;
	}

	const response = await oauth.authorizationCodeGrantRequest(
		as,
		client,
		params,
		redirect_uri,
		code_verifier
	);

	let challenges: oauth.WWWAuthenticateChallenge[] | undefined;
	if ((challenges = oauth.parseWwwAuthenticateChallenges(response))) {
		for (const challenge of challenges) {
			console.error('WWW-Authenticate Challenge', challenge);
		}
		throw new Error(); // Handle WWW-Authenticate Challenges as needed
	}

	const result = await oauth.processAuthorizationCodeOpenIDResponse(as, client, response);
	if (oauth.isOAuth2Error(result)) {
		console.error('Error Response', result);
		throw new Error(); // Handle OAuth 2.0 response body error
	}

	sessionStorage.removeItem('issuer');
	sessionStorage.removeItem('client_id');
	sessionStorage.removeItem('client_secret');
	sessionStorage.removeItem('code_verifier');

	appState.setApiKey(result.access_token);
	appState.setSSOURL(issuer.origin);

	// const claims = oauth.getValidatedIdTokenClaims(result);
	// console.log('ID Token Claims', claims);
}
