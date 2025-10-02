import * as jose from 'jose';

interface ApiClientOptions {
    /**
     * The Auth0 domain to use for authentication.
     * @example 'example.auth0.com' (without https://)
     */
    domain: string;
    /**
     * The expected JWT Access Token audience ("aud") value.
     */
    audience: string;
    /**
     * The optional client ID of the application.
     * Required when using the `getAccessTokenForConnection` method.
     */
    clientId?: string;
    /**
     * The optional client secret of the application.
     * At least one of `clientSecret` or `clientAssertionSigningKey` is required when using the `getAccessTokenForConnection` method.
     */
    clientSecret?: string;
    /**
     * The optional client assertion signing key to use.
     * At least one of `clientSecret` or `clientAssertionSigningKey` is required when using the `getAccessTokenForConnection` method.
     */
    clientAssertionSigningKey?: string | CryptoKey;
    /**
     * The optional client assertion signing algorithm to use with the `clientAssertionSigningKey`.
     * If not provided, it will default to `RS256`.
     */
    clientAssertionSigningAlg?: string;
    /**
     * Optional, custom Fetch implementation to use.
     */
    customFetch?: typeof fetch;
}
interface AccessTokenForConnectionOptions {
    /**
     * The name of the connection to get the token for.
     */
    connection: string;
    /**
     * The access token used as the subject token to be exchanged.
     */
    accessToken: string;
    /**
     * An optional login hint to pass to the connection.
     */
    loginHint?: string;
}
interface ConnectionTokenSet {
    /**
     * The access token issued by the connection.
     */
    accessToken: string;
    /**
     * The scope granted by the connection.
     */
    scope: string | undefined;
    /**
     * The access token expiration time, represented in seconds since the Unix epoch.
     */
    expiresAt: number;
    /**
     * The name of the connection the token was requested for.
     */
    connection: string;
    /**
     * An optional login hint that was passed during the exchange.
     */
    loginHint?: string;
}
interface VerifyAccessTokenOptions {
    /**
     * The access token to verify.
     */
    accessToken: string;
    /**
     * Additional claims that are required to be present in the access token.
     * If the access token does not contain these claims, the verification will fail.
     * Apart from the claims defined in this array, the SDK will also enforce: `iss`, `aud`, `exp` and `iat`.
     */
    requiredClaims?: string[];
}

declare class ApiClient {
    #private;
    constructor(options: ApiClientOptions);
    /**
     * Verifies the provided access token.
     * @param options Options used to verify the logout token.
     * @returns
     */
    verifyAccessToken(options: VerifyAccessTokenOptions): Promise<jose.JWTPayload>;
    /**
     * Retrieves an access token for a connection.
     *
     * @param options - Options for retrieving an access token for a connection.
     *
     * @throws {TokenForConnectionError} If there was an issue requesting the access token.
     *
     * @returns The Connection Token Set, containing the access token for the connection, as well as additional information.
     */
    getAccessTokenForConnection(options: AccessTokenForConnectionOptions): Promise<ConnectionTokenSet>;
}

/**
 * RFC 9728 - OAuth 2.0 Protected Resource Metadata
 * https://datatracker.ietf.org/doc/html/rfc9728
 */
/**
 * Supported methods of sending an OAuth 2.0 bearer token
 */
declare enum BearerMethod {
    HEADER = "header",
    BODY = "body",
    QUERY = "query"
}
/**
 * Supported signing algorithms
 */
declare enum SigningAlgorithm {
    RS256 = "RS256",
    RS384 = "RS384",
    RS512 = "RS512",
    ES256 = "ES256",
    ES384 = "ES384",
    ES512 = "ES512",
    PS256 = "PS256",
    PS384 = "PS384",
    PS512 = "PS512",
    HS256 = "HS256",
    HS384 = "HS384",
    HS512 = "HS512"
}
/**
 * Grant types supported
 */
declare enum GrantType {
    AUTHORIZATION_CODE = "authorization_code",
    IMPLICIT = "implicit",
    PASSWORD = "password",
    CLIENT_CREDENTIALS = "client_credentials",
    REFRESH_TOKEN = "refresh_token",
    JWT_BEARER = "urn:ietf:params:oauth:grant-type:jwt-bearer",
    SAML2_BEARER = "urn:ietf:params:oauth:grant-type:saml2-bearer",
    DEVICE_CODE = "urn:ietf:params:oauth:grant-type:device_code"
}
/**
 * Interface for Protected Resource Metadata
 */
interface IProtectedResourceMetadata {
    resource: string;
    authorization_servers: string[];
    jwks_uri?: string;
    scopes_supported?: string[];
    bearer_methods_supported?: BearerMethod[];
    resource_signing_alg_values_supported?: SigningAlgorithm[];
    resource_name?: string;
    resource_documentation?: string;
    resource_policy_uri?: string;
    resource_tos_uri?: string;
    tls_client_certificate_bound_access_tokens?: boolean;
    authorization_details_types_supported?: string[];
    dpop_signing_alg_values_supported?: string[];
    dpop_bound_access_tokens_required?: boolean;
}
/**
 * Builder for creating a ProtectedResourceMetadata instance
 *
 * @example
 * ```typescript
 * const metadata = new ProtectedResourceMetadataBuilder('https://api.example.com', ['https://auth.example.com'])
 *   .withJwksUri('https://api.example.com/.well-known/jwks.json')
 *   .withScopesSupported(['read', 'write'])
 *   .build();
 * // serialize to json
 * const json = metadata.toJSON();
 * ```
 */
declare class ProtectedResourceMetadataBuilder {
    private readonly props;
    /**
     * Constructor for the builder
     * @param resource - The protected resource identifier (REQUIRED)
     * @param authorization_servers - Array of authorization server URLs (REQUIRED)
     */
    constructor(resource: string, authorization_servers: string[]);
    get properties(): IProtectedResourceMetadata;
    /**
     * Builds the ProtectedResourceMetadata
     */
    build(): ProtectedResourceMetadata;
    /**
     * Builder method to add JWKS URI
     */
    withJwksUri(jwks_uri: string): this;
    /**
     * Builder method to add supported scopes
     */
    withScopesSupported(scopes_supported: string[]): this;
    /**
     * Builder method to add supported bearer methods
     */
    withBearerMethodsSupported(bearer_methods_supported: BearerMethod[]): this;
    /**
     * Builder method to add supported resource signing algorithms
     */
    withResourceSigningAlgValuesSupported(resource_signing_alg_values_supported: SigningAlgorithm[]): this;
    /**
     * Builder method to add resource_name
     */
    withResourceName(resource_name: string): this;
    /**
     * Builder method to add resource documentation URL
     */
    withResourceDocumentation(resource_documentation: string): this;
    /**
     * Builder method to add resource policy URI
     */
    withResourcePolicyUri(resource_policy_uri: string): this;
    /**
     * Builder method to add resource terms of service URI
     */
    withResourceTosUri(resource_tos_uri: string): this;
    /**
     * Builder method to enable TLS client certificate bound access tokens
     */
    withTlsClientCertificateBoundAccessTokens(tls_client_certificate_bound_access_tokens: boolean): this;
    /**
     * Builder method to add supported authorization details types
     */
    withAuthorizationDetailsTypesSupported(authorization_details_types_supported: string[]): this;
    /**
     * Builder method to add supported DPoP signing algorithms
     */
    withDpopSigningAlgValuesSupported(dpop_signing_alg_values_supported: string[]): this;
    /**
     * Builder method to require DPoP bound access tokens
     */
    withDpopBoundAccessTokensRequired(dpop_bound_access_tokens_required: boolean): this;
}
declare class ProtectedResourceMetadata {
    #private;
    constructor(builder: ProtectedResourceMetadataBuilder);
    /**
     * Convert to JSON representation
     */
    toJSON(): IProtectedResourceMetadata;
}

/**
 * Error thrown when the transaction is missing.
 */
declare class MissingTransactionError extends Error {
    code: string;
    constructor(message?: string);
}
/**
 * Error thrown when verifying the access token.
 */
declare class VerifyAccessTokenError extends Error {
    code: string;
    constructor(message: string);
}
/**
 * Error thrown when request is missing a valid token or
 * multiple auth methods used
 */
declare class InvalidRequestError extends Error {
    code: string;
    constructor(message: string);
}
/**
 * Error thrown when a required argument is missing.
 */
declare class MissingRequiredArgumentError extends Error {
    code: string;
    constructor(argument: string);
}

/**
 * Header-like object that can represent headers from different HTTP frameworks
 */
type HeadersLike = Record<string, unknown> & {
    authorization?: string;
    'content-type'?: string;
};
/**
 * Query-like object for URL query parameters
 */
type QueryLike = Record<string, unknown> & {
    access_token?: string;
};
/**
 * Body-like object for form-encoded request body
 */
type BodyLike = QueryLike;
/**
 * Extracts a Bearer token from HTTP request according to RFC 6750.
 * Supports all three methods defined in the RFC:
 * - Authorization header (Section 2.1)
 * - Form-encoded body parameter (Section 2.2)
 * - URI query parameter (Section 2.3)
 *
 * @param headers - HTTP headers object
 * @param query - Query parameters object (optional)
 * @param body - Request body object (optional)
 * @returns The extracted token string
 * @throws {InvalidRequestError} When no token is found or multiple methods are used
 *
 * @example
 * ```typescript
 * // Authorization header method (recommended)
 * const token1 = getToken({ authorization: 'Bearer mF_9.B5f-4.1JqM' });
 *
 * // Query parameter method
 * const token2 = getToken({}, { access_token: 'mF_9.B5f-4.1JqM' });
 *
 * // Form body method
 * const token3 = getToken(
 *   { 'content-type': 'application/x-www-form-urlencoded' },
 *   {},
 *   { access_token: 'mF_9.B5f-4.1JqM' }
 * );
 *
 * // Express.js usage
 * const token4 = getToken(req.headers, req.query, req.body);
 * ```
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6750#section-2 - RFC 6750 Section 2
 */
declare function getToken(headers: HeadersLike, query?: QueryLike, body?: BodyLike): string;

export { type AccessTokenForConnectionOptions, ApiClient, type ApiClientOptions, BearerMethod, type ConnectionTokenSet, GrantType, type IProtectedResourceMetadata, InvalidRequestError, MissingRequiredArgumentError, MissingTransactionError, ProtectedResourceMetadataBuilder, SigningAlgorithm, VerifyAccessTokenError, type VerifyAccessTokenOptions, getToken };
