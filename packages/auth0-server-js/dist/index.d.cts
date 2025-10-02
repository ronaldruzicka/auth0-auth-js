import { AuthorizationDetails, AuthClient } from '@auth0/auth0-auth-js';
import { JWTPayload, JWTDecryptOptions } from 'jose';

interface ServerClientOptions<TStoreOptions = unknown> {
    domain: string;
    clientId: string;
    clientSecret?: string;
    clientAssertionSigningKey?: string | CryptoKey;
    clientAssertionSigningAlg?: string;
    authorizationParams?: AuthorizationParameters;
    transactionIdentifier?: string;
    stateIdentifier?: string;
    /**
     * Optional, custom Fetch implementation to use.
     */
    customFetch?: typeof fetch;
    transactionStore: TransactionStore<TStoreOptions>;
    stateStore: StateStore<TStoreOptions>;
    /**
     * Indicates whether the SDK should use the mTLS endpoints if they are available.
     *
     * When set to `true`, using a `customFetch` is required.
     */
    useMtls?: boolean;
}
interface UserClaims {
    sub: string;
    name?: string;
    nickname?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    email?: string;
    email_verified?: boolean;
    org_id?: string;
    [key: string]: unknown;
}
interface AuthorizationParameters {
    scope?: string;
    audience?: string;
    redirect_uri?: string;
    [key: string]: unknown;
}
interface TokenSet {
    audience: string;
    accessToken: string;
    scope: string | undefined;
    expiresAt: number;
}
interface ConnectionTokenSet {
    accessToken: string;
    scope: string | undefined;
    expiresAt: number;
    connection: string;
    loginHint?: string;
}
interface InternalStateData {
    sid: string;
    createdAt: number;
}
interface StateData extends SessionData {
    internal: InternalStateData;
}
interface SessionData {
    user: UserClaims | undefined;
    idToken: string | undefined;
    refreshToken: string | undefined;
    tokenSets: TokenSet[];
    connectionTokenSets?: ConnectionTokenSet[];
    [key: string]: unknown;
}
interface TransactionData {
    audience?: string;
    codeVerifier: string;
    [key: string]: unknown;
}
interface AbstractDataStore<TData, TStoreOptions = unknown> {
    set(identifier: string, state: TData, removeIfExists?: boolean, options?: TStoreOptions): Promise<void>;
    get(identifier: string, options?: TStoreOptions): Promise<TData | undefined>;
    delete(identifier: string, options?: TStoreOptions): Promise<void>;
}
type LogoutTokenClaims = {
    sub?: string;
    sid?: string;
};
interface StateStore<TStoreOptions = unknown> extends AbstractDataStore<StateData, TStoreOptions> {
    deleteByLogoutToken(claims: LogoutTokenClaims, options?: TStoreOptions): Promise<void>;
}
interface TransactionStore<TStoreOptions = unknown> extends AbstractDataStore<TransactionData, TStoreOptions> {
}
interface EncryptedStoreOptions {
    secret: string;
    customEncrypt?: EncryptHandler;
    customDecrypt?: DecryptHandler;
}
interface StartInteractiveLoginOptions<TAppState = unknown> {
    pushedAuthorizationRequests?: boolean;
    appState?: TAppState;
    authorizationParams?: AuthorizationParameters;
}
interface LoginBackchannelOptions {
    bindingMessage: string;
    loginHint: {
        sub: string;
    };
    authorizationParams?: AuthorizationParameters;
}
interface LoginBackchannelResult {
    authorizationDetails?: AuthorizationDetails[];
}
interface AccessTokenForConnectionOptions {
    connection: string;
    loginHint?: string;
}
interface LogoutOptions {
    returnTo: string;
}
interface StartLinkUserOptions<TAppState = unknown> {
    connection: string;
    connectionScope: string;
    appState?: TAppState;
    authorizationParams?: AuthorizationParameters;
}
interface StartUnlinkUserOptions<TAppState = unknown> {
    connection: string;
    appState?: TAppState;
    authorizationParams?: AuthorizationParameters;
}
interface SessionConfiguration {
    /**
     * A boolean indicating whether rolling sessions should be used or not.
     *
     * When enabled, the session will continue to be extended as long as it is used within the inactivity duration.
     * Once the upper bound, set via the `absoluteDuration`, has been reached, the session will no longer be extended.
     *
     * Default: `true`.
     */
    rolling?: boolean;
    /**
     * The absolute duration after which the session will expire. The value must be specified in seconds..
     *
     * Once the absolute duration has been reached, the session will no longer be extended.
     *
     * Default: 3 days.
     */
    absoluteDuration?: number;
    /**
     * The duration of inactivity after which the session will expire. The value must be specified in seconds.
     *
     * The session will be extended as long as it was active before the inactivity duration has been reached.
     *
     * Default: 1 day.
     */
    inactivityDuration?: number;
    /**
     * The options for the session cookie.
     */
    cookie?: SessionCookieOptions;
}
interface SessionStore<TStoreOptions> {
    delete(identifier: string): Promise<void>;
    set(identifier: string, stateData: StateData): Promise<void>;
    get(identifier: string): Promise<StateData | undefined>;
    deleteByLogoutToken(claims: LogoutTokenClaims, options?: TStoreOptions | undefined): Promise<void>;
}
interface SessionCookieOptions {
    /**
     * The name of the session cookie.
     *
     * Default: `__a0_session`.
     */
    name?: string;
    /**
     * The sameSite attribute of the session cookie.
     *
     * Default: `lax`.
     */
    sameSite?: 'strict' | 'lax' | 'none';
    /**
     * The secure attribute of the session cookie.
     *
     * Default: depends on the protocol of the application's base URL. If the protocol is `https`, then `true`, otherwise `false`.
     */
    secure?: boolean;
}
interface EncryptOptions {
    additionalHeaders?: {
        iat: number;
        uat: number;
        exp: number;
    };
    expiration: number;
    payload: JWTPayload;
    salt: string;
    secret: string;
}
type EncryptHandler = (options: EncryptOptions) => Promise<string>;
interface DecryptOptions {
    options?: JWTDecryptOptions;
    salt: string;
    secret: string;
    value: string;
}
type DecryptHandler = (options: DecryptOptions) => Promise<JWTPayload>;

declare class ServerClient<TStoreOptions = unknown> {
    #private;
    /**
     * The underlying `authClient` instance that can be used to interact with the Auth0 Authentication API.
     * Generally, you should prefer to use the higher-level methods exposed on the `ServerClient` instance.
     *
     * Important: the methods exposed on the `authClient` instance do not handle any session or state management.
     */
    readonly authClient: AuthClient;
    constructor(options: ServerClientOptions<TStoreOptions>);
    /**
     * Starts the interactive login process, and returns a URL to redirect the user-agent to to request authorization at Auth0.
     * @param options Optional options used to configure the interactive login process.
     * @param storeOptions Optional options used to pass to the Transaction and State Store.
     *
     * @throws {BuildAuthorizationUrlError} If there was an issue when building the Authorization URL.
     *
     * @returns A promise resolving to a URL object, representing the URL to redirect the user-agent to to request authorization at Auth0.
     */
    startInteractiveLogin(options?: StartInteractiveLoginOptions, storeOptions?: TStoreOptions): Promise<URL>;
    /**
     * Completes the interactive login process.
     * Takes an URL, extract the Authorization Code flow query parameters and requests a token.
     * @param url The URl from which the query params should be extracted to exchange for a token.
     * @param storeOptions Optional options used to pass to the Transaction and State Store.
     *
     * @throws {MissingTransactionError} When no transaction was found.
     * @throws {TokenByCodeError} If there was an issue requesting the access token.
     *
     * @returns A promise resolving to an object, containing the original appState (if present) and the authorizationDetails (when RAR was used).
     */
    completeInteractiveLogin<TAppState = unknown>(url: URL, storeOptions?: TStoreOptions): Promise<{
        appState?: TAppState;
        authorizationDetails?: AuthorizationDetails[];
    }>;
    /**
     * Starts the user linking process, and returns a URL to redirect the user-agent to to request authorization at Auth0.
     * @param options Options used to configure the user linking process.
     * @param storeOptions Optional options used to pass to the Transaction and State Store.
     *
     * @throws {MissingSessionError} If there is no active session.
     * @throws {BuildLinkUserUrlError} If there was an issue when building the Authorization URL.
     *
     * @returns A promise resolving to a URL object, representing the URL to redirect the user-agent to to request authorization at Auth0.
     */
    startLinkUser(options: StartLinkUserOptions, storeOptions?: TStoreOptions): Promise<URL>;
    /**
     * Completes the user linking process.
     * Takes an URL, extract the Authorization Code flow query parameters and requests a token.
     * @param url The URl from which the query params should be extracted to exchange for a token.
     * @param storeOptions Optional options used to pass to the Transaction and State Store.
     *
     * @throws {MissingTransactionError} When no transaction was found.
     * @throws {TokenByCodeError} If there was an issue requesting the access token.
     *
     * @returns A promise resolving to an object, containing the original appState (if present).
     */
    completeLinkUser<TAppState = unknown>(url: URL, storeOptions?: TStoreOptions): Promise<{
        appState: TAppState | undefined;
    }>;
    /**
     * Starts the user unlinking process, and returns a URL to redirect the user-agent to to initialize user unlinking at Auth0.
     * @param options Options used to configure the user unlinking process.
     * @param storeOptions Optional options used to pass to the Transaction and State Store.
     *
     * @throws {MissingSessionError} If there is no active session.
     * @throws {BuildUnlinkUserUrlError} If there was an issue when building the User Unlinking URL.
     *
     * @returns A promise resolving to a URL object, representing the URL to redirect the user-agent to to request authorization at Auth0.
     */
    startUnlinkUser(options: StartUnlinkUserOptions, storeOptions?: TStoreOptions): Promise<URL>;
    /**
     * Completes the user unlinking process.
     * Takes an URL, extract the Authorization Code flow query parameters and requests a token.
     * @param url The URl from which the query params should be extracted to exchange for a token.
     * @param storeOptions Optional options used to pass to the Transaction and State Store.
     *
     * @throws {MissingTransactionError} When no transaction was found.
     * @throws {TokenByCodeError} If there was an issue requesting the access token.
     *
     * @returns A promise resolving to an object, containing the original appState (if present).
     */
    completeUnlinkUser<TAppState = unknown>(url: URL, storeOptions?: TStoreOptions): Promise<{
        appState: TAppState | undefined;
    }>;
    /**
     * Logs in using Client-Initiated Backchannel Authentication.
     *
     * Using Client-Initiated Backchannel Authentication requires the feature to be enabled in the Auth0 dashboard.
     * @see https://auth0.com/docs/get-started/authentication-and-authorization-flow/client-initiated-backchannel-authentication-flow
     * @param options Options used to configure the backchannel login process.
     * @param storeOptions Optional options used to pass to the Transaction and State Store.
     *
     * @throws {BackchannelAuthenticationError} If there was an issue when doing backchannel authentication.
     *
     * @returns A promise resolving to an object, containing the authorizationDetails (when RAR was used).
     */
    loginBackchannel(options: LoginBackchannelOptions, storeOptions?: TStoreOptions): Promise<LoginBackchannelResult>;
    /**
     * Retrieves the user from the store, or undefined if no user found.
     * @param storeOptions Optional options used to pass to the Transaction and State Store.
     * @returns The user, or undefined if no user found in the store.
     */
    getUser(storeOptions?: TStoreOptions): Promise<UserClaims | undefined>;
    /**
     * Retrieve the user session from the store, or undefined if no session found.
     * @param storeOptions Optional options used to pass to the Transaction and State Store.
     * @returns The sessionm or undefined if no session found in the store.
     */
    getSession(storeOptions?: TStoreOptions): Promise<SessionData | undefined>;
    /**
     * Retrieves the access token from the store, or calls Auth0 when the access token is expired and a refresh token is available in the store.
     * Also updates the store when a new token was retrieved from Auth0.
     * @param storeOptions Optional options used to pass to the Transaction and State Store.
     *
     * @throws {TokenByRefreshTokenError} If the refresh token was not found or there was an issue requesting the access token.
     *
     * @returns The Token Set, containing the access token, as well as additional information.
     */
    getAccessToken(storeOptions?: TStoreOptions): Promise<TokenSet>;
    /**
     * Retrieves an access token for a connection.
     *
     * This method attempts to obtain an access token for a specified connection.
     * It first checks if a refresh token exists in the store.
     * If no refresh token is found, it throws an `AccessTokenForConnectionError` indicating
     * that the refresh token was not found.
     *
     * @param options - Options for retrieving an access token for a connection.
     * @param storeOptions Optional options used to pass to the Transaction and State Store.
     *
     * @throws {TokenForConnectionError} If the refresh token was not found or there was an issue requesting the access token.
     *
     * @returns The Connection Token Set, containing the access token for the connection, as well as additional information.
     */
    getAccessTokenForConnection(options: AccessTokenForConnectionOptions, storeOptions?: TStoreOptions): Promise<ConnectionTokenSet>;
    /**
     * Logs the user out and returns a URL to redirect the user-agent to after they log out.
     * @param options Options used to configure the logout process.
     * @param storeOptions Optional options used to pass to the Transaction and State Store.
     * @returns {URL}
     */
    logout(options: LogoutOptions, storeOptions?: TStoreOptions): Promise<URL>;
    /**
     * Handles the backchannel logout process by verifying the logout token and deleting the session from the store if the logout token was considered valid.
     * @param logoutToken The logout token to verify and use to delete the session from the store.
     * @param storeOptions Optional options used to pass to the Transaction and State Store.
     *
     * @throws {BackchannelLogoutError} If the logout token is missing.
     * @throws {VerifyLogoutTokenError} If the logout token is invalid.
     */
    handleBackchannelLogout(logoutToken: string, storeOptions?: TStoreOptions): Promise<void>;
}

/**
 * Abstract class that can be used to implement an Encrypted JWT State Store, using the 'A256CBC-HS512' encryption algorithm.
 */
declare abstract class AbstractStore<TData extends JWTPayload, TStoreOptions = unknown> implements AbstractDataStore<TData, TStoreOptions> {
    protected readonly options: EncryptedStoreOptions;
    constructor(options: EncryptedStoreOptions);
    abstract set(identifier: string, state: TData, removeIfExists?: boolean, options?: TStoreOptions | undefined): Promise<void>;
    abstract get(identifier: string, options?: TStoreOptions | undefined): Promise<TData | undefined>;
    abstract delete(identifier: string, options?: TStoreOptions | undefined): Promise<void>;
    protected encrypt<TData extends JWTPayload>(identifier: string, stateData: TData, expiration: number): Promise<string>;
    protected decrypt<TData>(identifier: string, encryptedStateData: string): Promise<TData>;
}

/**
 * Abstract class that can be used to implement an Encrypted JWT State Store, using the 'A256CBC-HS512' encryption algorithm.
 */
declare abstract class AbstractStateStore<TStoreOptions = unknown> extends AbstractStore<StateData, TStoreOptions> implements StateStore<TStoreOptions> {
    constructor(options: EncryptedStoreOptions);
    abstract deleteByLogoutToken(claims: LogoutTokenClaims, options?: TStoreOptions | undefined): Promise<void>;
}

/**
 * Abstract class that can be used to implement an Encrypted JWT Transaction Store, using the 'A256CBC-HS512' encryption algorithm.
 */
declare abstract class AbstractTransactionStore<TStoreOptions = unknown> extends AbstractStore<TransactionData, TStoreOptions> implements TransactionStore<TStoreOptions> {
    constructor(options: EncryptedStoreOptions);
}

/**
 * Options for serializing cookies.
 * These options are used when setting cookies in the store.
 */
interface CookieSerializeOptions {
    domain?: string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    partitioned?: boolean;
    priority?: "low" | "medium" | "high";
}
/**
 * Interface for handling cookies in a store.
 * Implementations of this interface should handle the specifics of cookie management in a framework-specific way.
 */
interface CookieHandler<TStoreOptions> {
    /**
     * Set a cookie using the framework specific integration.
     * @param name The name of the cookie to set.
     * @param value The value of the cookie to set.
     * @param options The options for serializing the cookie.
     * @param storeOptions The options for the store, which may include framework-specific configurations.
     */
    setCookie: (name: string, value: string, options?: CookieSerializeOptions, storeOptions?: TStoreOptions) => void;
    /**
     * Get a cookie using the framework specific integration.
     * @param name The name of the cookie to retrieve.
     * @param storeOptions The options for the store, which may include framework-specific configurations.
     * @returns The value of the cookie if it exists, or undefined if it does not.
     */
    getCookie: (name: string, storeOptions?: TStoreOptions) => string | undefined;
    /**
     * Get all cookies using the framework specific integration.
     * @param storeOptions The options for the store, which may include framework-specific configurations.
     * @returns An object containing all cookies as key-value pairs.
     */
    getCookies: (storeOptions?: TStoreOptions) => Record<string, string>;
    /**
     * Delete a cookie using the framework specific integration.
     * @param name The name of the cookie to delete.
     * @param storeOptions The options for the store, which may include framework-specific configurations.
     */
    deleteCookie: (name: string, storeOptions?: TStoreOptions) => void;
}

declare class CookieTransactionStore<TStoreOptions> extends AbstractTransactionStore<TStoreOptions> {
    #private;
    constructor(options: EncryptedStoreOptions, cookieHandler: CookieHandler<TStoreOptions>);
    set(identifier: string, transactionData: TransactionData, removeIfExists?: boolean, options?: TStoreOptions): Promise<void>;
    get(identifier: string, options?: TStoreOptions): Promise<TransactionData | undefined>;
    delete(identifier: string, options?: TStoreOptions | undefined): Promise<void>;
}

declare abstract class AbstractSessionStore<TStoreOptions> extends AbstractStateStore<TStoreOptions> {
    #private;
    constructor(options: SessionConfiguration & EncryptedStoreOptions);
    /**
     * calculateMaxAge calculates the max age of the session based on createdAt and the rolling and absolute durations.
     */
    protected calculateMaxAge(createdAt: number): number;
}

interface StatefulStateStoreOptions<TStoreOptions> extends EncryptedStoreOptions {
    store: SessionStore<TStoreOptions>;
}
declare class StatefulStateStore<TStoreOptions> extends AbstractSessionStore<TStoreOptions> {
    #private;
    constructor(options: StatefulStateStoreOptions<TStoreOptions> & SessionConfiguration, cookieHandler: CookieHandler<TStoreOptions>);
    set(identifier: string, stateData: StateData, removeIfExists?: boolean, options?: TStoreOptions | undefined): Promise<void>;
    get(identifier: string, options?: TStoreOptions | undefined): Promise<StateData | undefined>;
    delete(identifier: string, options?: TStoreOptions | undefined): Promise<void>;
    private getSessionId;
    deleteByLogoutToken(claims: LogoutTokenClaims, options?: TStoreOptions | undefined): Promise<void>;
}

declare class StatelessStateStore<TStoreOptions> extends AbstractSessionStore<TStoreOptions> {
    #private;
    constructor(options: SessionConfiguration & EncryptedStoreOptions, cookieHandler: CookieHandler<TStoreOptions>);
    set(identifier: string, stateData: StateData, removeIfExists?: boolean, options?: TStoreOptions | undefined): Promise<void>;
    get(identifier: string, options?: TStoreOptions | undefined): Promise<StateData | undefined>;
    delete(identifier: string, options?: TStoreOptions | undefined): Promise<void>;
    deleteByLogoutToken(): Promise<void>;
    private getCookieKeys;
}

/**
 * Error thrown when there is no transaction available.
 */
declare class MissingTransactionError extends Error {
    code: string;
    constructor(message?: string);
}
/**
 * Error thrown when backchannel logout fails.
 */
declare class BackchannelLogoutError extends Error {
    code: string;
    constructor(message: string);
}
/**
 * Error thrown when starting the user-linking failed.
 */
declare class StartLinkUserError extends Error {
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
 * Error thrown when a session is missing.
 */
declare class MissingSessionError extends Error {
    code: string;
    constructor(message: string);
}

export { type AbstractDataStore, AbstractStateStore, AbstractTransactionStore, type AccessTokenForConnectionOptions, type AuthorizationParameters, BackchannelLogoutError, type ConnectionTokenSet, type CookieHandler, type CookieSerializeOptions, CookieTransactionStore, type DecryptHandler, type DecryptOptions, type EncryptHandler, type EncryptOptions, type EncryptedStoreOptions, type InternalStateData, type LoginBackchannelOptions, type LoginBackchannelResult, type LogoutOptions, type LogoutTokenClaims, MissingRequiredArgumentError, MissingSessionError, MissingTransactionError, ServerClient, type ServerClientOptions, type SessionConfiguration, type SessionCookieOptions, type SessionData, type SessionStore, type StartInteractiveLoginOptions, StartLinkUserError, type StartLinkUserOptions, type StartUnlinkUserOptions, type StateData, type StateStore, StatefulStateStore, type StatefulStateStoreOptions, StatelessStateStore, type TokenSet, type TransactionData, type TransactionStore, type UserClaims };
