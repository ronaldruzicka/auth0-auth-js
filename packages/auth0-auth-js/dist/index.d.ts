import { IDToken, TokenEndpointResponse, TokenEndpointResponseHelpers } from 'openid-client';

interface AuthClientOptions {
    /**
     * The Auth0 domain to use for authentication.
     * @example 'example.auth0.com' (without https://)
     */
    domain: string;
    /**
     * The client ID of the application.
     */
    clientId: string;
    /**
     * The client secret of the application.
     */
    clientSecret?: string;
    /**
     * The client assertion signing key to use.
     */
    clientAssertionSigningKey?: string | CryptoKey;
    /**
     * The client assertion signing algorithm to use.
     */
    clientAssertionSigningAlg?: string;
    /**
     * Authorization Parameters to be sent with the authorization request.
     */
    authorizationParams?: AuthorizationParameters;
    /**
     * Optional, custom Fetch implementation to use.
     */
    customFetch?: typeof fetch;
    /**
     * Indicates whether the SDK should use the mTLS endpoints if they are available.
     *
     * When set to `true`, using a `customFetch` is required.
     */
    useMtls?: boolean;
}
interface AuthorizationParameters {
    /**
     * The scope to use for the authentication request.
     */
    scope?: string;
    /**
     * The audience to use for the authentication request.
     */
    audience?: string;
    /**
     * The redirect URI to use for the authentication request, to which Auth0 will redirect the browser after the user has authenticated.
     * @example 'https://example.com/callback'
     */
    redirect_uri?: string;
    [key: string]: unknown;
}
interface BuildAuthorizationUrlOptions {
    /**
     * Indicates whether the authorization request should be done using a Pushed Authorization Request.
     */
    pushedAuthorizationRequests?: boolean;
    /**
     * Authorization Parameters to be sent with the authorization request.
     */
    authorizationParams?: AuthorizationParameters;
}
interface BuildAuthorizationUrlResult {
    /**
     * The URL to use to authenticate the user, including the query parameters.
     * Redirect the user to this URL to authenticate.
     * @example 'https://example.auth0.com/authorize?client_id=...&scope=...'
     */
    authorizationUrl: URL;
    /**
     * The code verifier that is used for the authorization request.
     */
    codeVerifier: string;
}
interface BuildLinkUserUrlOptions {
    /**
     * The connection for the user to link.
     */
    connection: string;
    /**
     * The scope for the connection.
     */
    connectionScope: string;
    /**
     * The id token of the user initiating the link.
     */
    idToken: string;
    /**
     * Additional authorization parameters to be sent with the link user request.
     */
    authorizationParams?: AuthorizationParameters;
}
interface BuildLinkUserUrlResult {
    /**
     * The URL to use to link the user, including the query parameters.
     * Redirect the user to this URL to link the user.
     * @example 'https://example.auth0.com/authorize?request_uri=urn:ietf:params:oauth:request_uri&client_id=...'
     */
    linkUserUrl: URL;
    /**
     * The code verifier that is used for the link user request.
     */
    codeVerifier: string;
}
interface BuildUnlinkUserUrlOptions {
    /**
     * The connection for the user to unlink.
     */
    connection: string;
    /**
     * The id token of the user initiating the unlink.
     */
    idToken: string;
    /**
     * Additional authorization parameters to be sent with the unlink user request.
     */
    authorizationParams?: AuthorizationParameters;
}
interface BuildUnlinkUserUrlResult {
    /**
     * The URL to use to unlink the user, including the query parameters.
     * Redirect the user to this URL to unlink the user.
     * @example 'https://example.auth0.com/authorize?request_uri=urn:ietf:params:oauth:request_uri&client_id=...'
     */
    unlinkUserUrl: URL;
    /**
     * The code verifier that is used for the unlink user request.
     */
    codeVerifier: string;
}
interface TokenByClientCredentialsOptions {
    /**
     * The audience for which the token should be requested.
     */
    audience: string;
    /**
     * The organization for which the token should be requested.
     */
    organization?: string;
}
interface TokenByRefreshTokenOptions {
    /**
     * The refresh token to use to get a token.
     */
    refreshToken: string;
}
interface TokenByCodeOptions {
    /**
     * The code verifier that is used for the authorization request.
     */
    codeVerifier: string;
}
interface TokenForConnectionOptions {
    /**
     * The connection for which a token should be requested.
     */
    connection: string;
    /**
     * Login hint to inform which connection account to use, can be useful when multiple accounts for the connection exist for the same user.
     */
    loginHint?: string;
    /**
     * The refresh token to use to get an access token for the connection.
     */
    refreshToken?: string;
    /**
     * The access token to use to get an access token for the connection.
     */
    accessToken?: string;
}
interface BuildLogoutUrlOptions {
    /**
     * The URL to which the user should be redirected after the logout.
     * @example 'https://example.com'
     */
    returnTo: string;
}
interface VerifyLogoutTokenOptions {
    /**
     * The logout token to verify.
     */
    logoutToken: string;
}
interface VerifyLogoutTokenResult {
    /**
     * The sid claim of the logout token.
     */
    sid: string;
    /**
     * The sub claim of the logout token.
     */
    sub: string;
}
interface AuthorizationDetails {
    readonly type: string;
    readonly [parameter: string]: unknown;
}
declare class TokenResponse {
    /**
     * The access token retrieved from Auth0.
     */
    accessToken: string;
    /**
     * The id token retrieved from Auth0.
     */
    idToken?: string;
    /**
     * The refresh token retrieved from Auth0.
     */
    refreshToken?: string;
    /**
     * The time at which the access token expires.
     */
    expiresAt: number;
    /**
     * The scope of the access token.
     */
    scope?: string;
    /**
     * The claims of the id token.
     */
    claims?: IDToken;
    /**
     * The authorization details of the token response.
     */
    authorizationDetails?: AuthorizationDetails[];
    constructor(accessToken: string, expiresAt: number, idToken?: string, refreshToken?: string, scope?: string, claims?: IDToken, authorizationDetails?: AuthorizationDetails[]);
    /**
     * Create a TokenResponse from a TokenEndpointResponse (openid-client).
     * @param response The TokenEndpointResponse from the token endpoint.
     * @returns A TokenResponse instance.
     */
    static fromTokenEndpointResponse(response: TokenEndpointResponse & TokenEndpointResponseHelpers): TokenResponse;
}
interface BackchannelAuthenticationOptions {
    /**
     * Human-readable message to be displayed at the consumption device and authentication device.
     * This allows the user to ensure the transaction initiated by the consumption device is the same that triggers the action on the authentication device.
     */
    bindingMessage: string;
    /**
     * The login hint to inform which user to use.
     */
    loginHint: {
        /**
         * The `sub` claim of the user that is trying to login using Client-Initiated Backchannel Authentication, and to which a push notification to authorize the login will be sent.
         */
        sub: string;
    };
    /**
     * Set a custom expiry time for the CIBA flow in seconds. Defaults to 300 seconds (5 minutes) if not set.
     */
    requestedExpiry?: number;
    /**
     * Optional authorization details to use Rich Authorization Requests (RAR).
     * @see https://auth0.com/docs/get-started/apis/configure-rich-authorization-requests
     */
    authorizationDetails?: AuthorizationDetails[];
    /**
     * Authorization Parameters to be sent with the authorization request.
     */
    authorizationParams?: AuthorizationParameters;
}

declare class AuthClient {
    #private;
    constructor(options: AuthClientOptions);
    /**
     * Builds the URL to redirect the user-agent to to request authorization at Auth0.
     * @param options Options used to configure the authorization URL.
     *
     * @throws {BuildAuthorizationUrlError} If there was an issue when building the Authorization URL.
     *
     * @returns A promise resolving to an object, containing the authorizationUrl and codeVerifier.
     */
    buildAuthorizationUrl(options?: BuildAuthorizationUrlOptions): Promise<BuildAuthorizationUrlResult>;
    /**
     * Builds the URL to redirect the user-agent to to link a user account at Auth0.
     * @param options Options used to configure the link user URL.
     *
     * @throws {BuildLinkUserUrlError} If there was an issue when building the Link User URL.
     *
     * @returns A promise resolving to an object, containing the linkUserUrl and codeVerifier.
     */
    buildLinkUserUrl(options: BuildLinkUserUrlOptions): Promise<BuildLinkUserUrlResult>;
    /**
     * Builds the URL to redirect the user-agent to to unlink a user account at Auth0.
     * @param options Options used to configure the unlink user URL.
     *
     * @throws {BuildUnlinkUserUrlError} If there was an issue when building the Unlink User URL.
     *
     * @returns A promise resolving to an object, containing the unlinkUserUrl and codeVerifier.
     */
    buildUnlinkUserUrl(options: BuildUnlinkUserUrlOptions): Promise<BuildUnlinkUserUrlResult>;
    /**
     * Authenticates using Client-Initiated Backchannel Authentication.
     *
     * This method will initialize the backchannel authentication process with Auth0, and poll the token endpoint until the authentication is complete.
     *
     * Using Client-Initiated Backchannel Authentication requires the feature to be enabled in the Auth0 dashboard.
     * @see https://auth0.com/docs/get-started/authentication-and-authorization-flow/client-initiated-backchannel-authentication-flow
     * @param options Options used to configure the backchannel authentication process.
     *
     * @throws {BackchannelAuthenticationError} If there was an issue when doing backchannel authentication.
     *
     * @returns A Promise, resolving to the TokenResponse as returned from Auth0.
     */
    backchannelAuthentication(options: BackchannelAuthenticationOptions): Promise<TokenResponse>;
    /**
     * Initiates Client-Initiated Backchannel Authentication flow by calling the `/bc-authorize` endpoint.
     * This method only initiates the authentication request and returns the `auth_req_id` to be used in subsequent calls to `backchannelAuthenticationGrant`.
     *
     * Typically, you would call this method to start the authentication process, then use the returned `auth_req_id` to poll for the token using `backchannelAuthenticationGrant`.
     *
     * @param options Options used to configure the backchannel authentication initiation.
     *
     * @throws {BackchannelAuthenticationError} If there was an issue when initiating backchannel authentication.
     *
     * @returns An object containing `authReqId`, `expiresIn`, and `interval` for polling.
     */
    initiateBackchannelAuthentication(options: BackchannelAuthenticationOptions): Promise<{
        authReqId: string;
        expiresIn: number;
        interval: number | undefined;
    }>;
    /**
     * Exchanges the `auth_req_id` obtained from `initiateBackchannelAuthentication` for tokens.
     *
     * @param authReqId The `auth_req_id` obtained from `initiateBackchannelAuthentication`.
     *
     * @throws {BackchannelAuthenticationError} If there was an issue when exchanging the `auth_req_id` for tokens.
     *
     * @returns A Promise, resolving to the TokenResponse as returned from Auth0.
     */
    backchannelAuthenticationGrant({ authReqId }: {
        authReqId: string;
    }): Promise<TokenResponse>;
    /**
     * Retrieves a token for a connection.
     * @param options - Options for retrieving an access token for a connection.
     *
     * @throws {TokenForConnectionError} If there was an issue requesting the access token.
     *
     * @returns The access token for the connection
     */
    getTokenForConnection(options: TokenForConnectionOptions): Promise<TokenResponse>;
    /**
     * Retrieves a token by exchanging an authorization code.
     * @param url The URL containing the authorization code.
     * @param options Options for exchanging the authorization code, containing the expected code verifier.
     *
     * @throws {TokenByCodeError} If there was an issue requesting the access token.
     *
     * @returns A Promise, resolving to the TokenResponse as returned from Auth0.
     */
    getTokenByCode(url: URL, options: TokenByCodeOptions): Promise<TokenResponse>;
    /**
     * Retrieves a token by exchanging a refresh token.
     * @param options Options for exchanging the refresh token.
     *
     * @throws {TokenByRefreshTokenError} If there was an issue requesting the access token.
     *
     * @returns A Promise, resolving to the TokenResponse as returned from Auth0.
     */
    getTokenByRefreshToken(options: TokenByRefreshTokenOptions): Promise<TokenResponse>;
    /**
     * Retrieves a token by exchanging client credentials.
     * @param options Options for retrieving the token.
     *
     * @throws {TokenByClientCredentialsError} If there was an issue requesting the access token.
     *
     * @returns A Promise, resolving to the TokenResponse as returned from Auth0.
     */
    getTokenByClientCredentials(options: TokenByClientCredentialsOptions): Promise<TokenResponse>;
    /**
     * Builds the URL to redirect the user-agent to to request logout at Auth0.
     * @param options Options used to configure the logout URL.
     * @returns A promise resolving to the URL to redirect the user-agent to.
     */
    buildLogoutUrl(options: BuildLogoutUrlOptions): Promise<URL>;
    /**
     * Verifies whether a logout token is valid.
     * @param options Options used to verify the logout token.
     *
     * @throws {VerifyLogoutTokenError} If there was an issue verifying the logout token.
     *
     * @returns An object containing the `sid` and `sub` claims from the logout token.
     */
    verifyLogoutToken(options: VerifyLogoutTokenOptions): Promise<VerifyLogoutTokenResult>;
}

/**
 * Interface to represent an OAuth2 error.
 */
interface OAuth2Error {
    error: string;
    error_description: string;
    message?: string;
}
/**
 * Error codes used for {@link NotSupportedError}
 */
declare enum NotSupportedErrorCode {
    PAR_NOT_SUPPORTED = "par_not_supported_error",
    MTLS_WITHOUT_CUSTOMFETCH_NOT_SUPPORT = "mtls_without_custom_fetch_not_supported"
}
/**
 * Error thrown when a feature is not supported.
 * For example, when trying to use Pushed Authorization Requests (PAR) but the Auth0 tenant was not configured to support it.
 */
declare class NotSupportedError extends Error {
    code: string;
    constructor(code: string, message: string);
}
/**
 * Base class for API errors, containing the error, error_description and message (if available).
 */
declare abstract class ApiError extends Error {
    cause?: OAuth2Error;
    code: string;
    constructor(code: string, message: string, cause?: OAuth2Error);
}
/**
 * Error thrown when trying to get an access token.
 */
declare class TokenByCodeError extends ApiError {
    constructor(message: string, cause?: OAuth2Error);
}
/**
 * Error thrown when trying to get an access token.
 */
declare class TokenByClientCredentialsError extends ApiError {
    constructor(message: string, cause?: OAuth2Error);
}
/**
 * Error thrown when trying to get an access token.
 */
declare class TokenByRefreshTokenError extends ApiError {
    constructor(message: string, cause?: OAuth2Error);
}
/**
 * Error thrown when trying to get an access token for a connection.
 */
declare class TokenForConnectionError extends ApiError {
    constructor(message: string, cause?: OAuth2Error);
}
/**
 * Error thrown when verifying the logout token.
 */
declare class VerifyLogoutTokenError extends Error {
    code: string;
    constructor(message: string);
}
/**
 * Error thrown when trying to use Client-Initiated Backchannel Authentication.
 */
declare class BackchannelAuthenticationError extends ApiError {
    code: string;
    constructor(cause?: OAuth2Error);
}
/**
 * Error thrown when trying to build the authorization URL.
 */
declare class BuildAuthorizationUrlError extends ApiError {
    constructor(cause?: OAuth2Error);
}
/**
 * Error thrown when trying to build the Link User URL.
 */
declare class BuildLinkUserUrlError extends ApiError {
    constructor(cause?: OAuth2Error);
}
/**
 * Error thrown when trying to build the Unlink User URL.
 */
declare class BuildUnlinkUserUrlError extends ApiError {
    constructor(cause?: OAuth2Error);
}
/**
 * Error thrown when Client Secret or Client Assertion Signing Key is missing.
 */
declare class MissingClientAuthError extends Error {
    code: string;
    constructor();
}

export { AuthClient, type AuthClientOptions, type AuthorizationDetails, type AuthorizationParameters, BackchannelAuthenticationError, type BackchannelAuthenticationOptions, BuildAuthorizationUrlError, type BuildAuthorizationUrlOptions, type BuildAuthorizationUrlResult, BuildLinkUserUrlError, type BuildLinkUserUrlOptions, type BuildLinkUserUrlResult, type BuildLogoutUrlOptions, BuildUnlinkUserUrlError, type BuildUnlinkUserUrlOptions, type BuildUnlinkUserUrlResult, MissingClientAuthError, NotSupportedError, NotSupportedErrorCode, type OAuth2Error, TokenByClientCredentialsError, type TokenByClientCredentialsOptions, TokenByCodeError, type TokenByCodeOptions, TokenByRefreshTokenError, type TokenByRefreshTokenOptions, TokenForConnectionError, type TokenForConnectionOptions, TokenResponse, VerifyLogoutTokenError, type VerifyLogoutTokenOptions, type VerifyLogoutTokenResult };
