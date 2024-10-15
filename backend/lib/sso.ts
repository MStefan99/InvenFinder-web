import { path } from '../deps.ts';

const configPath = path.join(
	path.fromFileUrl(import.meta.url),
	'..',
	'..',
	'sso.json',
);

type SsoProvider = {
	name: string;
	issuer: string;
	client_id: string;
	client_secret: string;
};

type SsoConfiguration = {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint?: string;
	userinfo_endpoint?: string;
	jwks_uri: string;
	registration_endpoint?: string;
	scopes_supported?: string[];
	response_types_supported: string[];
	response_modes_supported?: string[];
	grant_types_supported?: string[];
	acr_values_supported?: string[];
	subject_types_supported: string[];
	id_token_signing_alg_values_supported: string[];
	id_token_encryption_alg_values_supported?: string[];
	id_token_encryption_enc_values_supported?: string[];
	userinfo_signing_alg_values_supported?: string[];
	userinfo_encryption_alg_values_supported?: string[];
	userinfo_encryption_enc_values_supported?: string[];
	request_object_signing_alg_values_supported?: string[];
	request_object_encryption_alg_values_supported?: string[];
	request_object_encryption_enc_values_supported?: string[];
	token_endpoint_auth_methods_supported?: string[];
	token_endpoint_auth_signing_alg_values_supported?: string[];
	display_values_supported?: string[];
	claim_types_supported?: string[];
	claims_supported?: string[];
	service_documentation?: string;
	claims_locales_supported?: string[];
	ui_locales_supported?: string[];
	claims_parameter_supported?: boolean;
	request_parameter_supported?: boolean;
	request_uri_parameter_supported?: boolean;
	require_request_uri_registration?: boolean;
	op_policy_url?: string;
	op_tos_url?: string;
};

type UserInfo = {
	sub: string;
	username: string;
	email?: string;
	groups?: string[];
};

export const ssoProviders = new Map<string, SsoProvider>();
const ssoConfigurations = new Map<string, SsoConfiguration>();

export async function initSSO(): Promise<void> {
	try {
		const decoder = new TextDecoder();
		const data = await Deno.readFile(configPath);
		const providers = JSON.parse(decoder.decode(data));

		for (const provider of providers) {
			ssoProviders.set(provider.name, provider);

			const res = await fetch(
				provider.issuer + '/.well-known/openid-configuration',
			);
			if (res.ok) {
				ssoConfigurations.set(provider.name, await res.json());
			}
		}
	} catch {
		// No providers added
	}
}

export async function getUserInfo(
	ssoProviderName: string,
	token: string,
): Promise<UserInfo | null> {
	const config = ssoConfigurations.get(ssoProviderName);

	if (!config?.userinfo_endpoint) {
		return null;
	}

	const res = await fetch(config.userinfo_endpoint, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!res.ok) {
		return null;
	}

	return await res.json();
}
