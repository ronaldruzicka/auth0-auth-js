"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AbstractStateStore: () => AbstractStateStore,
  AbstractTransactionStore: () => AbstractTransactionStore,
  BackchannelLogoutError: () => BackchannelLogoutError,
  CookieTransactionStore: () => CookieTransactionStore,
  MissingRequiredArgumentError: () => MissingRequiredArgumentError,
  MissingSessionError: () => MissingSessionError,
  MissingTransactionError: () => MissingTransactionError,
  ServerClient: () => ServerClient,
  StartLinkUserError: () => StartLinkUserError,
  StatefulStateStore: () => StatefulStateStore,
  StatelessStateStore: () => StatelessStateStore
});
module.exports = __toCommonJS(index_exports);

// src/errors.ts
var MissingTransactionError = class extends Error {
  code = "missing_transaction_error";
  constructor(message) {
    super(message ?? "The transaction is missing.");
    this.name = "MissingTransactionError";
  }
};
var BackchannelLogoutError = class extends Error {
  code = "backchannel_logout_error";
  constructor(message) {
    super(message);
    this.name = "BackchannelLogoutError";
  }
};
var StartLinkUserError = class extends Error {
  code = "start_link_user_error";
  constructor(message) {
    super(message);
    this.name = "StartLinkUserError";
  }
};
var MissingRequiredArgumentError = class extends Error {
  code = "missing_required_argument_error";
  constructor(argument) {
    super(`The argument '${argument}' is required but was not provided.`);
    this.name = "MissingRequiredArgumentError";
  }
};
var MissingSessionError = class extends Error {
  code = "missing_session_error";
  constructor(message) {
    super(message);
    this.name = "MissingSessionError";
  }
};

// src/state/utils.ts
function updateStateData(audience, stateDate, tokenEndpointResponse) {
  if (stateDate) {
    const isNewTokenSet = !stateDate.tokenSets.some(
      (tokenSet) => tokenSet.audience === audience && tokenSet.scope === tokenEndpointResponse.scope
    );
    const createUpdatedTokenSet = (response) => ({
      audience,
      accessToken: response.accessToken,
      scope: response.scope,
      expiresAt: Math.floor(Date.now() / 1e3) + Number(response.expiresAt)
    });
    const tokenSets = isNewTokenSet ? [...stateDate.tokenSets, createUpdatedTokenSet(tokenEndpointResponse)] : stateDate.tokenSets.map(
      (tokenSet) => tokenSet.audience === audience && tokenSet.scope === tokenEndpointResponse.scope ? createUpdatedTokenSet(tokenEndpointResponse) : tokenSet
    );
    return {
      ...stateDate,
      idToken: tokenEndpointResponse.idToken,
      refreshToken: tokenEndpointResponse.refreshToken ?? stateDate.refreshToken,
      tokenSets
    };
  } else {
    const user = tokenEndpointResponse.claims;
    return {
      user,
      idToken: tokenEndpointResponse.idToken,
      refreshToken: tokenEndpointResponse.refreshToken,
      tokenSets: [
        {
          audience,
          accessToken: tokenEndpointResponse.accessToken,
          scope: tokenEndpointResponse.scope,
          expiresAt: tokenEndpointResponse.expiresAt
        }
      ],
      internal: {
        sid: user?.sid,
        createdAt: Math.floor(Date.now() / 1e3)
      }
    };
  }
}
function updateStateDataForConnectionTokenSet(options, stateDate, tokenEndpointResponse) {
  stateDate.connectionTokenSets = stateDate.connectionTokenSets || [];
  const isNewTokenSet = !stateDate.connectionTokenSets.some(
    (tokenSet) => tokenSet.connection === options.connection && (!options.loginHint || tokenSet.loginHint === options.loginHint)
  );
  const connectionTokenSet = {
    connection: options.connection,
    loginHint: options.loginHint,
    accessToken: tokenEndpointResponse.accessToken,
    scope: tokenEndpointResponse.scope,
    expiresAt: tokenEndpointResponse.expiresAt
  };
  const connectionTokenSets = isNewTokenSet ? [...stateDate.connectionTokenSets, connectionTokenSet] : stateDate.connectionTokenSets.map(
    (tokenSet) => tokenSet.connection === options.connection && (!options.loginHint || tokenSet.loginHint === options.loginHint) ? connectionTokenSet : tokenSet
  );
  return {
    ...stateDate,
    connectionTokenSets
  };
}

// src/server-client.ts
var import_auth0_auth_js = require("@auth0/auth0-auth-js");

// src/utils.ts
var compareScopes = (scopes, requiredScopes) => {
  if (scopes === requiredScopes) {
    return true;
  }
  if (!scopes || !requiredScopes) {
    return false;
  }
  const scopesSet = new Set(scopes.trim().split(" ").filter(Boolean));
  const requiredScopesArray = requiredScopes.trim().split(" ").filter(Boolean);
  return requiredScopesArray.every((scope) => scopesSet.has(scope));
};

// src/server-client.ts
var ServerClient = class {
  #options;
  #transactionStore;
  #transactionStoreIdentifier;
  #stateStore;
  #stateStoreIdentifier;
  /**
   * The underlying `authClient` instance that can be used to interact with the Auth0 Authentication API.
   * Generally, you should prefer to use the higher-level methods exposed on the `ServerClient` instance.
   * 
   * Important: the methods exposed on the `authClient` instance do not handle any session or state management.
   */
  authClient;
  constructor(options) {
    this.#options = options;
    this.#stateStoreIdentifier = this.#options.stateIdentifier || "__a0_session";
    this.#transactionStoreIdentifier = this.#options.transactionIdentifier || "__a0_tx";
    this.#transactionStore = options.transactionStore;
    this.#stateStore = options.stateStore;
    if (!this.#options.stateStore) {
      throw new MissingRequiredArgumentError("stateStore");
    }
    if (!this.#options.transactionStore) {
      throw new MissingRequiredArgumentError("transactionStore");
    }
    this.authClient = new import_auth0_auth_js.AuthClient({
      domain: this.#options.domain,
      clientId: this.#options.clientId,
      clientSecret: this.#options.clientSecret,
      clientAssertionSigningKey: this.#options.clientAssertionSigningKey,
      clientAssertionSigningAlg: this.#options.clientAssertionSigningAlg,
      authorizationParams: this.#options.authorizationParams,
      customFetch: this.#options.customFetch,
      useMtls: this.#options.useMtls
    });
  }
  /**
   * Starts the interactive login process, and returns a URL to redirect the user-agent to to request authorization at Auth0.
   * @param options Optional options used to configure the interactive login process.
   * @param storeOptions Optional options used to pass to the Transaction and State Store.
   *
   * @throws {BuildAuthorizationUrlError} If there was an issue when building the Authorization URL.
   *
   * @returns A promise resolving to a URL object, representing the URL to redirect the user-agent to to request authorization at Auth0.
   */
  async startInteractiveLogin(options, storeOptions) {
    const redirectUri = options?.authorizationParams?.redirect_uri ?? this.#options.authorizationParams?.redirect_uri;
    if (!redirectUri) {
      throw new MissingRequiredArgumentError("authorizationParams.redirect_uri");
    }
    const { codeVerifier, authorizationUrl } = await this.authClient.buildAuthorizationUrl({
      pushedAuthorizationRequests: options?.pushedAuthorizationRequests,
      authorizationParams: {
        ...options?.authorizationParams,
        redirect_uri: redirectUri
      }
    });
    const transactionState = {
      audience: options?.authorizationParams?.audience ?? this.#options.authorizationParams?.audience,
      codeVerifier
    };
    if (options?.appState) {
      transactionState.appState = options.appState;
    }
    await this.#transactionStore.set(this.#transactionStoreIdentifier, transactionState, false, storeOptions);
    return authorizationUrl;
  }
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
  async completeInteractiveLogin(url, storeOptions) {
    const transactionData = await this.#transactionStore.get(this.#transactionStoreIdentifier, storeOptions);
    if (!transactionData) {
      throw new MissingTransactionError();
    }
    const tokenEndpointResponse = await this.authClient.getTokenByCode(url, {
      codeVerifier: transactionData.codeVerifier
    });
    const existingStateData = await this.#stateStore.get(this.#stateStoreIdentifier, storeOptions);
    const stateData = updateStateData(transactionData.audience ?? "default", existingStateData, tokenEndpointResponse);
    await this.#stateStore.set(this.#stateStoreIdentifier, stateData, true, storeOptions);
    await this.#transactionStore.delete(this.#transactionStoreIdentifier, storeOptions);
    return { appState: transactionData.appState, authorizationDetails: tokenEndpointResponse.authorizationDetails };
  }
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
  async startLinkUser(options, storeOptions) {
    const stateData = await this.#stateStore.get(this.#stateStoreIdentifier, storeOptions);
    if (!stateData || !stateData.idToken) {
      throw new MissingSessionError(
        "Unable to start the user linking process without a logged in user. Ensure to login using the SDK before starting the user linking process."
      );
    }
    const { linkUserUrl, codeVerifier } = await this.authClient.buildLinkUserUrl({
      connection: options.connection,
      connectionScope: options.connectionScope,
      idToken: stateData.idToken,
      authorizationParams: options.authorizationParams
    });
    const transactionState = {
      audience: options?.authorizationParams?.audience ?? this.#options.authorizationParams?.audience,
      codeVerifier
    };
    if (options?.appState) {
      transactionState.appState = options.appState;
    }
    await this.#transactionStore.set(this.#transactionStoreIdentifier, transactionState, false, storeOptions);
    return linkUserUrl;
  }
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
  async completeLinkUser(url, storeOptions) {
    const result = await this.completeInteractiveLogin(url, storeOptions);
    return {
      appState: result.appState
    };
  }
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
  async startUnlinkUser(options, storeOptions) {
    const stateData = await this.#stateStore.get(this.#stateStoreIdentifier, storeOptions);
    if (!stateData || !stateData.idToken) {
      throw new MissingSessionError(
        "Unable to start the user unlinking process without a logged in user. Ensure to login using the SDK before starting the user unlinking process."
      );
    }
    const { unlinkUserUrl, codeVerifier } = await this.authClient.buildUnlinkUserUrl({
      connection: options.connection,
      idToken: stateData.idToken,
      authorizationParams: options.authorizationParams
    });
    const transactionState = {
      audience: options?.authorizationParams?.audience ?? this.#options.authorizationParams?.audience,
      codeVerifier
    };
    if (options?.appState) {
      transactionState.appState = options.appState;
    }
    await this.#transactionStore.set(this.#transactionStoreIdentifier, transactionState, false, storeOptions);
    return unlinkUserUrl;
  }
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
  async completeUnlinkUser(url, storeOptions) {
    const result = await this.completeInteractiveLogin(url, storeOptions);
    return {
      appState: result.appState
    };
  }
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
  async loginBackchannel(options, storeOptions) {
    const tokenEndpointResponse = await this.authClient.backchannelAuthentication({
      bindingMessage: options.bindingMessage,
      loginHint: options.loginHint,
      authorizationParams: options.authorizationParams
    });
    const existingStateData = await this.#stateStore.get(this.#stateStoreIdentifier, storeOptions);
    const stateData = updateStateData(
      this.#options.authorizationParams?.audience ?? "default",
      existingStateData,
      tokenEndpointResponse
    );
    await this.#stateStore.set(this.#stateStoreIdentifier, stateData, true, storeOptions);
    return {
      authorizationDetails: tokenEndpointResponse.authorizationDetails
    };
  }
  /**
   * Retrieves the user from the store, or undefined if no user found.
   * @param storeOptions Optional options used to pass to the Transaction and State Store.
   * @returns The user, or undefined if no user found in the store.
   */
  async getUser(storeOptions) {
    const stateData = await this.#stateStore.get(this.#stateStoreIdentifier, storeOptions);
    return stateData?.user;
  }
  /**
   * Retrieve the user session from the store, or undefined if no session found.
   * @param storeOptions Optional options used to pass to the Transaction and State Store.
   * @returns The sessionm or undefined if no session found in the store.
   */
  async getSession(storeOptions) {
    const stateData = await this.#stateStore.get(this.#stateStoreIdentifier, storeOptions);
    if (stateData) {
      const { internal, ...sessionData } = stateData;
      return sessionData;
    }
  }
  /**
   * Retrieves the access token from the store, or calls Auth0 when the access token is expired and a refresh token is available in the store.
   * Also updates the store when a new token was retrieved from Auth0.
   * @param storeOptions Optional options used to pass to the Transaction and State Store.
   *
   * @throws {TokenByRefreshTokenError} If the refresh token was not found or there was an issue requesting the access token.
   *
   * @returns The Token Set, containing the access token, as well as additional information.
   */
  async getAccessToken(storeOptions) {
    const stateData = await this.#stateStore.get(this.#stateStoreIdentifier, storeOptions);
    const audience = this.#options.authorizationParams?.audience ?? "default";
    const scope = this.#options.authorizationParams?.scope;
    const tokenSet = stateData?.tokenSets.find(
      (tokenSet2) => tokenSet2.audience === audience && (!scope || compareScopes(tokenSet2.scope, scope))
    );
    if (tokenSet && tokenSet.expiresAt > Date.now() / 1e3) {
      return tokenSet;
    }
    if (!stateData?.refreshToken) {
      throw new import_auth0_auth_js.TokenByRefreshTokenError(
        "The access token has expired and a refresh token was not provided. The user needs to re-authenticate."
      );
    }
    const tokenEndpointResponse = await this.authClient.getTokenByRefreshToken({
      refreshToken: stateData.refreshToken
    });
    const existingStateData = await this.#stateStore.get(this.#stateStoreIdentifier, storeOptions);
    const updatedStateData = updateStateData(audience, existingStateData, tokenEndpointResponse);
    await this.#stateStore.set(this.#stateStoreIdentifier, updatedStateData, false, storeOptions);
    return {
      accessToken: tokenEndpointResponse.accessToken,
      scope: tokenEndpointResponse.scope,
      expiresAt: tokenEndpointResponse.expiresAt,
      audience
    };
  }
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
  async getAccessTokenForConnection(options, storeOptions) {
    const stateData = await this.#stateStore.get(this.#stateStoreIdentifier, storeOptions);
    const connectionTokenSet = stateData?.connectionTokenSets?.find(
      (tokenSet) => tokenSet.connection === options.connection
    );
    if (connectionTokenSet && connectionTokenSet.expiresAt > Date.now() / 1e3) {
      return connectionTokenSet;
    }
    if (!stateData?.refreshToken) {
      throw new import_auth0_auth_js.TokenForConnectionError(
        "A refresh token was not found but is required to be able to retrieve an access token for a connection."
      );
    }
    const tokenEndpointResponse = await this.authClient.getTokenForConnection({
      connection: options.connection,
      loginHint: options.loginHint,
      refreshToken: stateData.refreshToken
    });
    const updatedStateData = updateStateDataForConnectionTokenSet(options, stateData, tokenEndpointResponse);
    await this.#stateStore.set(this.#stateStoreIdentifier, updatedStateData, false, storeOptions);
    return {
      accessToken: tokenEndpointResponse.accessToken,
      scope: tokenEndpointResponse.scope,
      expiresAt: tokenEndpointResponse.expiresAt,
      connection: options.connection,
      loginHint: options.loginHint
    };
  }
  /**
   * Logs the user out and returns a URL to redirect the user-agent to after they log out.
   * @param options Options used to configure the logout process.
   * @param storeOptions Optional options used to pass to the Transaction and State Store.
   * @returns {URL}
   */
  async logout(options, storeOptions) {
    await this.#stateStore.delete(this.#stateStoreIdentifier, storeOptions);
    return this.authClient.buildLogoutUrl(options);
  }
  /**
   * Handles the backchannel logout process by verifying the logout token and deleting the session from the store if the logout token was considered valid.
   * @param logoutToken The logout token to verify and use to delete the session from the store.
   * @param storeOptions Optional options used to pass to the Transaction and State Store.
   *
   * @throws {BackchannelLogoutError} If the logout token is missing.
   * @throws {VerifyLogoutTokenError} If the logout token is invalid.
   */
  async handleBackchannelLogout(logoutToken, storeOptions) {
    if (!logoutToken) {
      throw new BackchannelLogoutError("Missing Logout Token");
    }
    const logoutTokenClaims = await this.authClient.verifyLogoutToken({ logoutToken });
    await this.#stateStore.deleteByLogoutToken(logoutTokenClaims, storeOptions);
  }
};

// src/encryption/index.ts
var import_jose = require("jose");
var ENC = "A256CBC-HS512";
var ALG = "dir";
var DIGEST = "SHA-256";
var BIT_LENGTH = 512;
var HKDF_INFO = "derived cookie encryption secret";
var encoder;
async function deriveEncryptionSecret(secret, salt, kid) {
  encoder ||= new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), "HKDF", false, ["deriveBits"]);
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        hash: DIGEST,
        info: encoder.encode(HKDF_INFO),
        salt: encoder.encode(`${salt}${kid}`)
      },
      key,
      BIT_LENGTH
    )
  );
}
async function encrypt({ expiration, salt, secret, payload }) {
  const kid = crypto.randomUUID();
  const encryptionSecret = await deriveEncryptionSecret(secret, salt, kid);
  return await new import_jose.EncryptJWT(payload).setProtectedHeader({ enc: ENC, alg: ALG, kid }).setExpirationTime(expiration).encrypt(encryptionSecret);
}
async function decrypt({ salt, secret, value }) {
  const res = await (0, import_jose.jwtDecrypt)(
    value,
    async (protectedHeader) => {
      if (!protectedHeader.kid) {
        throw new Error('Missing "kid" in JWE header');
      }
      return await deriveEncryptionSecret(secret, salt, protectedHeader.kid);
    },
    { clockTolerance: 15 }
  );
  return res.payload;
}

// src/store/abstract-store.ts
var AbstractStore = class {
  options;
  constructor(options) {
    this.options = options;
  }
  async encrypt(identifier, stateData, expiration) {
    return this.options.customEncrypt ? await this.options.customEncrypt({
      expiration,
      payload: stateData,
      salt: identifier,
      secret: this.options.secret
    }) : await encrypt({ expiration, payload: stateData, salt: identifier, secret: this.options.secret });
  }
  async decrypt(identifier, encryptedStateData) {
    return this.options.customDecrypt ? await this.options.customDecrypt({
      salt: identifier,
      secret: this.options.secret,
      value: encryptedStateData
    }) : await decrypt({ salt: identifier, secret: this.options.secret, value: encryptedStateData });
  }
};

// src/store/abstract-state-store.ts
var AbstractStateStore = class extends AbstractStore {
  constructor(options) {
    super(options);
  }
};

// src/store/abstract-transaction-store.ts
var AbstractTransactionStore = class extends AbstractStore {
  constructor(options) {
    super(options);
  }
};

// src/store/cookie-transaction-store.ts
var CookieTransactionStore = class extends AbstractTransactionStore {
  #cookieHandler;
  constructor(options, cookieHandler) {
    super(options);
    this.#cookieHandler = cookieHandler;
  }
  async set(identifier, transactionData, removeIfExists, options) {
    const maxAge = 60 * 60;
    const cookieOpts = { httpOnly: true, sameSite: "lax", path: "/", maxAge };
    const expiration = Math.floor(Date.now() / 1e3 + maxAge);
    const encryptedStateData = await this.encrypt(identifier, transactionData, expiration);
    this.#cookieHandler.setCookie(identifier, encryptedStateData, cookieOpts, options);
  }
  async get(identifier, options) {
    const cookieValue = this.#cookieHandler.getCookie(identifier, options);
    if (cookieValue) {
      return await this.decrypt(identifier, cookieValue);
    }
  }
  async delete(identifier, options) {
    this.#cookieHandler.deleteCookie(identifier, options);
  }
};

// src/store/abstract-session-store.ts
var AbstractSessionStore = class extends AbstractStateStore {
  #rolling;
  #absoluteDuration;
  #inactivityDuration;
  constructor(options) {
    super(options);
    this.#rolling = options.rolling ?? true;
    this.#absoluteDuration = options.absoluteDuration ?? 60 * 60 * 24 * 3;
    this.#inactivityDuration = options.inactivityDuration ?? 60 * 60 * 24 * 1;
  }
  /**
   * calculateMaxAge calculates the max age of the session based on createdAt and the rolling and absolute durations.
   */
  calculateMaxAge(createdAt) {
    if (!this.#rolling) {
      return this.#absoluteDuration;
    }
    const now = Date.now() / 1e3 | 0;
    const expiresAt = Math.min(now + this.#inactivityDuration, createdAt + this.#absoluteDuration);
    const maxAge = expiresAt - now;
    return maxAge > 0 ? maxAge : 0;
  }
};

// src/store/stateful-state-store.ts
var generateId = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
};
var StatefulStateStore = class extends AbstractSessionStore {
  #store;
  #cookieOptions;
  #cookieHandler;
  constructor(options, cookieHandler) {
    super(options);
    this.#store = options.store;
    this.#cookieOptions = options.cookie;
    this.#cookieHandler = cookieHandler;
  }
  async set(identifier, stateData, removeIfExists, options) {
    let sessionId = await this.getSessionId(identifier, options);
    if (sessionId && removeIfExists) {
      await this.#store.delete(sessionId);
      sessionId = generateId();
    }
    sessionId ??= generateId();
    const maxAge = this.calculateMaxAge(stateData.internal.createdAt);
    const cookieOpts = {
      httpOnly: true,
      sameSite: this.#cookieOptions?.sameSite ?? "lax",
      path: "/",
      secure: this.#cookieOptions?.secure,
      maxAge
    };
    const expiration = Date.now() / 1e3 + maxAge;
    const encryptedStateData = await this.encrypt(
      identifier,
      {
        id: sessionId
      },
      expiration
    );
    await this.#store.set(sessionId, stateData);
    this.#cookieHandler.setCookie(identifier, encryptedStateData, cookieOpts, options);
  }
  async get(identifier, options) {
    const sessionId = await this.getSessionId(identifier, options);
    if (sessionId) {
      const stateData = await this.#store.get(sessionId);
      if (!stateData) {
        this.#cookieHandler.deleteCookie(identifier, options);
      }
      return stateData;
    }
  }
  async delete(identifier, options) {
    const sessionId = await this.getSessionId(identifier, options);
    if (sessionId) {
      await this.#store.delete(sessionId);
    }
    this.#cookieHandler.deleteCookie(identifier, options);
  }
  async getSessionId(identifier, options) {
    const cookieValue = this.#cookieHandler.getCookie(identifier, options);
    if (cookieValue) {
      const sessionCookie = await this.decrypt(identifier, cookieValue);
      return sessionCookie.id;
    }
  }
  deleteByLogoutToken(claims, options) {
    return this.#store.deleteByLogoutToken(claims, options);
  }
};

// src/store/stateless-state-store.ts
var StatelessStateStore = class extends AbstractSessionStore {
  #cookieOptions;
  #cookieHandler;
  constructor(options, cookieHandler) {
    super(options);
    this.#cookieOptions = options.cookie;
    this.#cookieHandler = cookieHandler;
  }
  async set(identifier, stateData, removeIfExists, options) {
    const maxAge = this.calculateMaxAge(stateData.internal.createdAt);
    const cookieOpts = {
      httpOnly: true,
      sameSite: this.#cookieOptions?.sameSite ?? "lax",
      path: "/",
      secure: this.#cookieOptions?.secure ?? true,
      maxAge
    };
    const expiration = Math.floor(Date.now() / 1e3 + maxAge);
    const encryptedStateData = await this.encrypt(identifier, stateData, expiration);
    const chunkSize = 3072;
    const chunkCount = Math.ceil(encryptedStateData.length / chunkSize);
    const chunks = [...Array(chunkCount).keys()].map((i) => ({
      value: encryptedStateData.substring(i * chunkSize, (i + 1) * chunkSize),
      name: `${identifier}.${i}`
    }));
    chunks.forEach((chunk) => {
      this.#cookieHandler.setCookie(chunk.name, chunk.value, cookieOpts, options);
    });
    const existingCookieKeys = this.getCookieKeys(identifier, options);
    const cookieKeysToRemove = existingCookieKeys.filter((key) => !chunks.some((chunk) => chunk.name === key));
    cookieKeysToRemove.forEach((key) => {
      this.#cookieHandler.deleteCookie(key, options);
    });
  }
  async get(identifier, options) {
    const cookieKeys = this.getCookieKeys(identifier, options);
    const encryptedStateData = cookieKeys.map((key) => ({
      index: parseInt(key.split(".")[1], 10),
      value: this.#cookieHandler.getCookie(key, options)
    })).sort((a, b) => a.index - b.index).map((item) => item.value).join("");
    if (encryptedStateData) {
      return await this.decrypt(identifier, encryptedStateData);
    }
  }
  async delete(identifier, options) {
    const cookieKeys = this.getCookieKeys(identifier, options);
    for (const key of cookieKeys) {
      this.#cookieHandler.deleteCookie(key, options);
    }
  }
  deleteByLogoutToken() {
    throw new Error(
      "Backchannel logout is not available when using Stateless Storage. Use Stateful Storage by providing a `sessionStore`"
    );
  }
  getCookieKeys(identifier, options) {
    return Object.keys(this.#cookieHandler.getCookies(options)).filter((key) => key.startsWith(identifier));
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AbstractStateStore,
  AbstractTransactionStore,
  BackchannelLogoutError,
  CookieTransactionStore,
  MissingRequiredArgumentError,
  MissingSessionError,
  MissingTransactionError,
  ServerClient,
  StartLinkUserError,
  StatefulStateStore,
  StatelessStateStore
});
//# sourceMappingURL=index.cjs.map