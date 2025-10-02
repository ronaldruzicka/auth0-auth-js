// src/auth-client.ts
import * as client from "openid-client";
import { createRemoteJWKSet, importPKCS8, jwtVerify, customFetch as customFetch2 } from "jose";

// src/errors.ts
var NotSupportedErrorCode = /* @__PURE__ */ ((NotSupportedErrorCode2) => {
  NotSupportedErrorCode2["PAR_NOT_SUPPORTED"] = "par_not_supported_error";
  NotSupportedErrorCode2["MTLS_WITHOUT_CUSTOMFETCH_NOT_SUPPORT"] = "mtls_without_custom_fetch_not_supported";
  return NotSupportedErrorCode2;
})(NotSupportedErrorCode || {});
var NotSupportedError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.name = "NotSupportedError";
    this.code = code;
  }
};
var ApiError = class extends Error {
  cause;
  code;
  constructor(code, message, cause) {
    super(message);
    this.code = code;
    this.cause = cause && {
      error: cause.error,
      error_description: cause.error_description,
      message: cause.message
    };
  }
};
var TokenByCodeError = class extends ApiError {
  constructor(message, cause) {
    super("token_by_code_error", message, cause);
    this.name = "TokenByCodeError";
  }
};
var TokenByClientCredentialsError = class extends ApiError {
  constructor(message, cause) {
    super("token_by_client_credentials_error", message, cause);
    this.name = "TokenByClientCredentialsError";
  }
};
var TokenByRefreshTokenError = class extends ApiError {
  constructor(message, cause) {
    super("token_by_refresh_token_error", message, cause);
    this.name = "TokenByRefreshTokenError";
  }
};
var TokenForConnectionError = class extends ApiError {
  constructor(message, cause) {
    super("token_for_connection_error", message, cause);
    this.name = "TokenForConnectionErrorCode";
  }
};
var VerifyLogoutTokenError = class extends Error {
  code = "verify_logout_token_error";
  constructor(message) {
    super(message);
    this.name = "VerifyLogoutTokenError";
  }
};
var BackchannelAuthenticationError = class extends ApiError {
  code = "backchannel_authentication_error";
  constructor(cause) {
    super(
      "backchannel_authentication_error",
      "There was an error when trying to use Client-Initiated Backchannel Authentication.",
      cause
    );
    this.name = "BackchannelAuthenticationError";
  }
};
var BuildAuthorizationUrlError = class extends ApiError {
  constructor(cause) {
    super(
      "build_authorization_url_error",
      "There was an error when trying to build the authorization URL.",
      cause
    );
    this.name = "BuildAuthorizationUrlError";
  }
};
var BuildLinkUserUrlError = class extends ApiError {
  constructor(cause) {
    super(
      "build_link_user_url_error",
      "There was an error when trying to build the Link User URL.",
      cause
    );
    this.name = "BuildLinkUserUrlError";
  }
};
var BuildUnlinkUserUrlError = class extends ApiError {
  constructor(cause) {
    super(
      "build_unlink_user_url_error",
      "There was an error when trying to build the Unlink User URL.",
      cause
    );
    this.name = "BuildUnlinkUserUrlError";
  }
};
var MissingClientAuthError = class extends Error {
  code = "missing_client_auth_error";
  constructor() {
    super(
      "The client secret or client assertion signing key must be provided."
    );
    this.name = "MissingClientAuthError";
  }
};

// src/types.ts
var TokenResponse = class _TokenResponse {
  /**
   * The access token retrieved from Auth0.
   */
  accessToken;
  /**
   * The id token retrieved from Auth0.
   */
  idToken;
  /**
   * The refresh token retrieved from Auth0.
   */
  refreshToken;
  /**
   * The time at which the access token expires.
   */
  expiresAt;
  /**
   * The scope of the access token.
   */
  scope;
  /**
   * The claims of the id token.
   */
  claims;
  /**
   * The authorization details of the token response.
   */
  authorizationDetails;
  constructor(accessToken, expiresAt, idToken, refreshToken, scope, claims, authorizationDetails) {
    this.accessToken = accessToken;
    this.idToken = idToken;
    this.refreshToken = refreshToken;
    this.expiresAt = expiresAt;
    this.scope = scope;
    this.claims = claims;
    this.authorizationDetails = authorizationDetails;
  }
  /**
   * Create a TokenResponse from a TokenEndpointResponse (openid-client).
   * @param response The TokenEndpointResponse from the token endpoint.
   * @returns A TokenResponse instance.
   */
  static fromTokenEndpointResponse(response) {
    return new _TokenResponse(
      response.access_token,
      Math.floor(Date.now() / 1e3) + Number(response.expires_in),
      response.id_token,
      response.refresh_token,
      response.scope,
      response.claims(),
      response.authorization_details
    );
  }
};

// src/utils.ts
function stripUndefinedProperties(value) {
  return Object.entries(value).filter(([, value2]) => typeof value2 !== "undefined").reduce((acc, curr) => ({ ...acc, [curr[0]]: curr[1] }), {});
}

// src/auth-client.ts
var DEFAULT_SCOPES = "openid profile email offline_access";
var GRANT_TYPE_FEDERATED_CONNECTION_ACCESS_TOKEN = "urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token";
var SUBJECT_TYPE_REFRESH_TOKEN = "urn:ietf:params:oauth:token-type:refresh_token";
var SUBJECT_TYPE_ACCESS_TOKEN = "urn:ietf:params:oauth:token-type:access_token";
var REQUESTED_TOKEN_TYPE_FEDERATED_CONNECTION_ACCESS_TOKEN = "http://auth0.com/oauth/token-type/federated-connection-access-token";
var AuthClient = class {
  #configuration;
  #serverMetadata;
  #options;
  #jwks;
  constructor(options) {
    this.#options = options;
    if (options.useMtls && !options.customFetch) {
      throw new NotSupportedError(
        "mtls_without_custom_fetch_not_supported" /* MTLS_WITHOUT_CUSTOMFETCH_NOT_SUPPORT */,
        "Using mTLS without a custom fetch implementation is not supported"
      );
    }
  }
  /**
   * Initialized the SDK by performing Metadata Discovery.
   */
  async #discover() {
    if (this.#configuration && this.#serverMetadata) {
      return {
        configuration: this.#configuration,
        serverMetadata: this.#serverMetadata
      };
    }
    const clientAuth = await this.#getClientAuth();
    this.#configuration = await client.discovery(
      new URL(`https://${this.#options.domain}`),
      this.#options.clientId,
      { use_mtls_endpoint_aliases: this.#options.useMtls },
      clientAuth,
      {
        [client.customFetch]: this.#options.customFetch
      }
    );
    this.#serverMetadata = this.#configuration.serverMetadata();
    this.#configuration[client.customFetch] = this.#options.customFetch || fetch;
    return {
      configuration: this.#configuration,
      serverMetadata: this.#serverMetadata
    };
  }
  /**
   * Builds the URL to redirect the user-agent to to request authorization at Auth0.
   * @param options Options used to configure the authorization URL.
   *
   * @throws {BuildAuthorizationUrlError} If there was an issue when building the Authorization URL.
   *
   * @returns A promise resolving to an object, containing the authorizationUrl and codeVerifier.
   */
  async buildAuthorizationUrl(options) {
    const { serverMetadata } = await this.#discover();
    if (options?.pushedAuthorizationRequests && !serverMetadata.pushed_authorization_request_endpoint) {
      throw new NotSupportedError(
        "par_not_supported_error" /* PAR_NOT_SUPPORTED */,
        "The Auth0 tenant does not have pushed authorization requests enabled. Learn how to enable it here: https://auth0.com/docs/get-started/applications/configure-par"
      );
    }
    try {
      return await this.#buildAuthorizationUrl(options);
    } catch (e) {
      throw new BuildAuthorizationUrlError(e);
    }
  }
  /**
   * Builds the URL to redirect the user-agent to to link a user account at Auth0.
   * @param options Options used to configure the link user URL.
   *
   * @throws {BuildLinkUserUrlError} If there was an issue when building the Link User URL.
   *
   * @returns A promise resolving to an object, containing the linkUserUrl and codeVerifier.
   */
  async buildLinkUserUrl(options) {
    try {
      const result = await this.#buildAuthorizationUrl({
        authorizationParams: {
          ...options.authorizationParams,
          requested_connection: options.connection,
          requested_connection_scope: options.connectionScope,
          scope: "openid link_account offline_access",
          id_token_hint: options.idToken
        }
      });
      return {
        linkUserUrl: result.authorizationUrl,
        codeVerifier: result.codeVerifier
      };
    } catch (e) {
      throw new BuildLinkUserUrlError(e);
    }
  }
  /**
   * Builds the URL to redirect the user-agent to to unlink a user account at Auth0.
   * @param options Options used to configure the unlink user URL.
   *
   * @throws {BuildUnlinkUserUrlError} If there was an issue when building the Unlink User URL.
   *
   * @returns A promise resolving to an object, containing the unlinkUserUrl and codeVerifier.
   */
  async buildUnlinkUserUrl(options) {
    try {
      const result = await this.#buildAuthorizationUrl({
        authorizationParams: {
          ...options.authorizationParams,
          requested_connection: options.connection,
          scope: "openid unlink_account",
          id_token_hint: options.idToken
        }
      });
      return {
        unlinkUserUrl: result.authorizationUrl,
        codeVerifier: result.codeVerifier
      };
    } catch (e) {
      throw new BuildUnlinkUserUrlError(e);
    }
  }
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
  async backchannelAuthentication(options) {
    const { configuration, serverMetadata } = await this.#discover();
    const additionalParams = stripUndefinedProperties({
      ...this.#options.authorizationParams,
      ...options?.authorizationParams
    });
    const params = new URLSearchParams({
      scope: DEFAULT_SCOPES,
      ...additionalParams,
      client_id: this.#options.clientId,
      binding_message: options.bindingMessage,
      login_hint: JSON.stringify({
        format: "iss_sub",
        iss: serverMetadata.issuer,
        sub: options.loginHint.sub
      })
    });
    if (options.requestedExpiry) {
      params.append("requested_expiry", options.requestedExpiry.toString());
    }
    if (options.authorizationDetails) {
      params.append(
        "authorization_details",
        JSON.stringify(options.authorizationDetails)
      );
    }
    try {
      const backchannelAuthenticationResponse = await client.initiateBackchannelAuthentication(configuration, params);
      const tokenEndpointResponse = await client.pollBackchannelAuthenticationGrant(
        configuration,
        backchannelAuthenticationResponse
      );
      return TokenResponse.fromTokenEndpointResponse(tokenEndpointResponse);
    } catch (e) {
      throw new BackchannelAuthenticationError(e);
    }
  }
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
  async initiateBackchannelAuthentication(options) {
    const { configuration, serverMetadata } = await this.#discover();
    const additionalParams = stripUndefinedProperties({
      ...this.#options.authorizationParams,
      ...options?.authorizationParams
    });
    const params = new URLSearchParams({
      scope: DEFAULT_SCOPES,
      ...additionalParams,
      client_id: this.#options.clientId,
      binding_message: options.bindingMessage,
      login_hint: JSON.stringify({
        format: "iss_sub",
        iss: serverMetadata.issuer,
        sub: options.loginHint.sub
      })
    });
    if (options.requestedExpiry) {
      params.append("requested_expiry", options.requestedExpiry.toString());
    }
    if (options.authorizationDetails) {
      params.append(
        "authorization_details",
        JSON.stringify(options.authorizationDetails)
      );
    }
    try {
      const backchannelAuthenticationResponse = await client.initiateBackchannelAuthentication(configuration, params);
      return {
        authReqId: backchannelAuthenticationResponse.auth_req_id,
        expiresIn: backchannelAuthenticationResponse.expires_in,
        interval: backchannelAuthenticationResponse.interval
      };
    } catch (e) {
      throw new BackchannelAuthenticationError(e);
    }
  }
  /**
   * Exchanges the `auth_req_id` obtained from `initiateBackchannelAuthentication` for tokens.
   * 
   * @param authReqId The `auth_req_id` obtained from `initiateBackchannelAuthentication`.
   * 
   * @throws {BackchannelAuthenticationError} If there was an issue when exchanging the `auth_req_id` for tokens.
   * 
   * @returns A Promise, resolving to the TokenResponse as returned from Auth0.
   */
  async backchannelAuthenticationGrant({ authReqId }) {
    const { configuration } = await this.#discover();
    const params = new URLSearchParams({
      auth_req_id: authReqId
    });
    try {
      const tokenEndpointResponse = await client.genericGrantRequest(
        configuration,
        "urn:openid:params:grant-type:ciba",
        params
      );
      return TokenResponse.fromTokenEndpointResponse(tokenEndpointResponse);
    } catch (e) {
      throw new BackchannelAuthenticationError(e);
    }
  }
  /**
   * Retrieves a token for a connection.
   * @param options - Options for retrieving an access token for a connection.
   *
   * @throws {TokenForConnectionError} If there was an issue requesting the access token.
   *
   * @returns The access token for the connection
   */
  async getTokenForConnection(options) {
    if (options.refreshToken && options.accessToken) {
      throw new TokenForConnectionError(
        "Either a refresh or access token should be specified, but not both."
      );
    }
    let subjectTokenType = null;
    let token = null;
    if (options.refreshToken) {
      subjectTokenType = SUBJECT_TYPE_REFRESH_TOKEN;
      token = options.refreshToken;
    } else if (options.accessToken) {
      subjectTokenType = SUBJECT_TYPE_ACCESS_TOKEN;
      token = options.accessToken;
    }
    if (!token || !subjectTokenType) {
      throw new TokenForConnectionError(
        "Either a refresh or access token must be specified."
      );
    }
    const { configuration } = await this.#discover();
    const params = new URLSearchParams();
    params.append("connection", options.connection);
    params.append("subject_token_type", subjectTokenType);
    params.append("subject_token", token);
    params.append(
      "requested_token_type",
      REQUESTED_TOKEN_TYPE_FEDERATED_CONNECTION_ACCESS_TOKEN
    );
    if (options.loginHint) {
      params.append("login_hint", options.loginHint);
    }
    try {
      const tokenEndpointResponse = await client.genericGrantRequest(
        configuration,
        GRANT_TYPE_FEDERATED_CONNECTION_ACCESS_TOKEN,
        params
      );
      return {
        accessToken: tokenEndpointResponse.access_token,
        expiresAt: Math.floor(Date.now() / 1e3) + Number(tokenEndpointResponse.expires_in),
        scope: tokenEndpointResponse.scope
      };
    } catch (e) {
      throw new TokenForConnectionError(
        "There was an error while trying to retrieve an access token for a connection.",
        e
      );
    }
  }
  /**
   * Retrieves a token by exchanging an authorization code.
   * @param url The URL containing the authorization code.
   * @param options Options for exchanging the authorization code, containing the expected code verifier.
   *
   * @throws {TokenByCodeError} If there was an issue requesting the access token.
   *
   * @returns A Promise, resolving to the TokenResponse as returned from Auth0.
   */
  async getTokenByCode(url, options) {
    const { configuration } = await this.#discover();
    try {
      const tokenEndpointResponse = await client.authorizationCodeGrant(
        configuration,
        url,
        {
          pkceCodeVerifier: options.codeVerifier
        }
      );
      return TokenResponse.fromTokenEndpointResponse(tokenEndpointResponse);
    } catch (e) {
      throw new TokenByCodeError(
        "There was an error while trying to request a token.",
        e
      );
    }
  }
  /**
   * Retrieves a token by exchanging a refresh token.
   * @param options Options for exchanging the refresh token.
   *
   * @throws {TokenByRefreshTokenError} If there was an issue requesting the access token.
   *
   * @returns A Promise, resolving to the TokenResponse as returned from Auth0.
   */
  async getTokenByRefreshToken(options) {
    const { configuration } = await this.#discover();
    try {
      const tokenEndpointResponse = await client.refreshTokenGrant(
        configuration,
        options.refreshToken
      );
      return TokenResponse.fromTokenEndpointResponse(tokenEndpointResponse);
    } catch (e) {
      throw new TokenByRefreshTokenError(
        "The access token has expired and there was an error while trying to refresh it.",
        e
      );
    }
  }
  /**
   * Retrieves a token by exchanging client credentials.
   * @param options Options for retrieving the token.
   *
   * @throws {TokenByClientCredentialsError} If there was an issue requesting the access token.
   *
   * @returns A Promise, resolving to the TokenResponse as returned from Auth0.
   */
  async getTokenByClientCredentials(options) {
    const { configuration } = await this.#discover();
    try {
      const params = new URLSearchParams({
        audience: options.audience
      });
      if (options.organization) {
        params.append("organization", options.organization);
      }
      const tokenEndpointResponse = await client.clientCredentialsGrant(
        configuration,
        params
      );
      return TokenResponse.fromTokenEndpointResponse(tokenEndpointResponse);
    } catch (e) {
      throw new TokenByClientCredentialsError(
        "There was an error while trying to request a token.",
        e
      );
    }
  }
  /**
   * Builds the URL to redirect the user-agent to to request logout at Auth0.
   * @param options Options used to configure the logout URL.
   * @returns A promise resolving to the URL to redirect the user-agent to.
   */
  async buildLogoutUrl(options) {
    const { configuration, serverMetadata } = await this.#discover();
    if (!serverMetadata.end_session_endpoint) {
      const url = new URL(`https://${this.#options.domain}/v2/logout`);
      url.searchParams.set("returnTo", options.returnTo);
      url.searchParams.set("client_id", this.#options.clientId);
      return url;
    }
    return client.buildEndSessionUrl(configuration, {
      post_logout_redirect_uri: options.returnTo
    });
  }
  /**
   * Verifies whether a logout token is valid.
   * @param options Options used to verify the logout token.
   *
   * @throws {VerifyLogoutTokenError} If there was an issue verifying the logout token.
   *
   * @returns An object containing the `sid` and `sub` claims from the logout token.
   */
  async verifyLogoutToken(options) {
    const { serverMetadata } = await this.#discover();
    this.#jwks ||= createRemoteJWKSet(new URL(serverMetadata.jwks_uri), {
      [customFetch2]: this.#options.customFetch
    });
    const { payload } = await jwtVerify(options.logoutToken, this.#jwks, {
      issuer: serverMetadata.issuer,
      audience: this.#options.clientId,
      algorithms: ["RS256"],
      requiredClaims: ["iat"]
    });
    if (!("sid" in payload) && !("sub" in payload)) {
      throw new VerifyLogoutTokenError(
        'either "sid" or "sub" (or both) claims must be present'
      );
    }
    if ("sid" in payload && typeof payload.sid !== "string") {
      throw new VerifyLogoutTokenError('"sid" claim must be a string');
    }
    if ("sub" in payload && typeof payload.sub !== "string") {
      throw new VerifyLogoutTokenError('"sub" claim must be a string');
    }
    if ("nonce" in payload) {
      throw new VerifyLogoutTokenError('"nonce" claim is prohibited');
    }
    if (!("events" in payload)) {
      throw new VerifyLogoutTokenError('"events" claim is missing');
    }
    if (typeof payload.events !== "object" || payload.events === null) {
      throw new VerifyLogoutTokenError('"events" claim must be an object');
    }
    if (!("http://schemas.openid.net/event/backchannel-logout" in payload.events)) {
      throw new VerifyLogoutTokenError(
        '"http://schemas.openid.net/event/backchannel-logout" member is missing in the "events" claim'
      );
    }
    if (typeof payload.events["http://schemas.openid.net/event/backchannel-logout"] !== "object") {
      throw new VerifyLogoutTokenError(
        '"http://schemas.openid.net/event/backchannel-logout" member in the "events" claim must be an object'
      );
    }
    return {
      sid: payload.sid,
      sub: payload.sub
    };
  }
  /**
   * Gets the client authentication method based on the provided options.
   * @returns The ClientAuth object to use for client authentication.
   */
  async #getClientAuth() {
    if (!this.#options.clientSecret && !this.#options.clientAssertionSigningKey && !this.#options.useMtls) {
      throw new MissingClientAuthError();
    }
    if (this.#options.useMtls) {
      return client.TlsClientAuth();
    }
    let clientPrivateKey = this.#options.clientAssertionSigningKey;
    if (clientPrivateKey && !(clientPrivateKey instanceof CryptoKey)) {
      clientPrivateKey = await importPKCS8(
        clientPrivateKey,
        this.#options.clientAssertionSigningAlg || "RS256"
      );
    }
    return clientPrivateKey ? client.PrivateKeyJwt(clientPrivateKey) : client.ClientSecretPost(this.#options.clientSecret);
  }
  /**
   * Builds the URL to redirect the user-agent to to request authorization at Auth0.
   * @param options Options used to configure the authorization URL.
   * @returns A promise resolving to an object, containing the authorizationUrl and codeVerifier.
   */
  async #buildAuthorizationUrl(options) {
    const { configuration } = await this.#discover();
    const codeChallengeMethod = "S256";
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
    const additionalParams = stripUndefinedProperties({
      ...this.#options.authorizationParams,
      ...options?.authorizationParams
    });
    const params = new URLSearchParams({
      scope: DEFAULT_SCOPES,
      ...additionalParams,
      client_id: this.#options.clientId,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod
    });
    const authorizationUrl = options?.pushedAuthorizationRequests ? await client.buildAuthorizationUrlWithPAR(configuration, params) : await client.buildAuthorizationUrl(configuration, params);
    return {
      authorizationUrl,
      codeVerifier
    };
  }
};
export {
  AuthClient,
  BackchannelAuthenticationError,
  BuildAuthorizationUrlError,
  BuildLinkUserUrlError,
  BuildUnlinkUserUrlError,
  MissingClientAuthError,
  NotSupportedError,
  NotSupportedErrorCode,
  TokenByClientCredentialsError,
  TokenByCodeError,
  TokenByRefreshTokenError,
  TokenForConnectionError,
  TokenResponse,
  VerifyLogoutTokenError
};
//# sourceMappingURL=index.js.map