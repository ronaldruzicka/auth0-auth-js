// src/api-client.ts
import * as oauth from "oauth4webapi";
import { createRemoteJWKSet, jwtVerify, customFetch as customFetch2 } from "jose";
import { AuthClient, TokenForConnectionError } from "@auth0/auth0-auth-js";

// src/errors.ts
var MissingTransactionError = class extends Error {
  code = "missing_transaction_error";
  constructor(message) {
    super(message ?? "The transaction is missing.");
    this.name = "MissingTransactionError";
  }
};
var VerifyAccessTokenError = class extends Error {
  code = "verify_access_token_error";
  constructor(message) {
    super(message);
    this.name = "VerifyAccessTokenError";
  }
};
var InvalidRequestError = class extends Error {
  code = "invalid_request";
  constructor(message) {
    super(message);
    this.name = "InvalidRequestError";
  }
};
var MissingRequiredArgumentError = class extends Error {
  code = "missing_required_argument_error";
  constructor(argument) {
    super(`The argument '${argument}' is required but was not provided.`);
    this.name = "MissingRequiredArgumentError";
  }
};

// src/api-client.ts
var ApiClient = class {
  #serverMetadata;
  #options;
  #jwks;
  #authClient;
  constructor(options) {
    this.#options = options;
    if (options.clientId) {
      this.#authClient = new AuthClient({
        domain: options.domain,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        clientAssertionSigningKey: options.clientAssertionSigningKey,
        clientAssertionSigningAlg: options.clientAssertionSigningAlg,
        customFetch: options.customFetch
      });
    }
    if (!this.#options.audience) {
      throw new MissingRequiredArgumentError("audience");
    }
  }
  /**
   * Initialized the SDK by performing Metadata Discovery.
   */
  async #discover() {
    if (this.#serverMetadata) {
      return {
        serverMetadata: this.#serverMetadata
      };
    }
    const issuer = new URL(`https://${this.#options.domain}`);
    const response = await oauth.discoveryRequest(issuer, {
      [oauth.customFetch]: this.#options.customFetch
    });
    this.#serverMetadata = await oauth.processDiscoveryResponse(
      issuer,
      response
    );
    return {
      serverMetadata: this.#serverMetadata
    };
  }
  /**
   * Verifies the provided access token.
   * @param options Options used to verify the logout token.
   * @returns
   */
  async verifyAccessToken(options) {
    const { serverMetadata } = await this.#discover();
    this.#jwks ||= createRemoteJWKSet(new URL(serverMetadata.jwks_uri), {
      [customFetch2]: this.#options.customFetch
    });
    try {
      const { payload } = await jwtVerify(options.accessToken, this.#jwks, {
        issuer: this.#serverMetadata.issuer,
        audience: this.#options.audience,
        algorithms: ["RS256"],
        requiredClaims: ["iat", "exp", ...options.requiredClaims || []]
      });
      return payload;
    } catch (e) {
      throw new VerifyAccessTokenError(e.message);
    }
  }
  /**
   * Retrieves an access token for a connection.
   *
   * @param options - Options for retrieving an access token for a connection.
   *
   * @throws {TokenForConnectionError} If there was an issue requesting the access token.
   *
   * @returns The Connection Token Set, containing the access token for the connection, as well as additional information.
   */
  async getAccessTokenForConnection(options) {
    if (!this.#authClient) {
      throw new TokenForConnectionError(
        "Client credentials are required to use getAccessTokenForConnection"
      );
    }
    const tokenEndpointResponse = await this.#authClient.getTokenForConnection({
      connection: options.connection,
      loginHint: options.loginHint,
      accessToken: options.accessToken
    });
    return {
      accessToken: tokenEndpointResponse.accessToken,
      scope: tokenEndpointResponse.scope,
      expiresAt: tokenEndpointResponse.expiresAt,
      connection: options.connection,
      loginHint: options.loginHint
    };
  }
};

// src/protected-resource-metadata.ts
var BearerMethod = /* @__PURE__ */ ((BearerMethod2) => {
  BearerMethod2["HEADER"] = "header";
  BearerMethod2["BODY"] = "body";
  BearerMethod2["QUERY"] = "query";
  return BearerMethod2;
})(BearerMethod || {});
var SigningAlgorithm = /* @__PURE__ */ ((SigningAlgorithm2) => {
  SigningAlgorithm2["RS256"] = "RS256";
  SigningAlgorithm2["RS384"] = "RS384";
  SigningAlgorithm2["RS512"] = "RS512";
  SigningAlgorithm2["ES256"] = "ES256";
  SigningAlgorithm2["ES384"] = "ES384";
  SigningAlgorithm2["ES512"] = "ES512";
  SigningAlgorithm2["PS256"] = "PS256";
  SigningAlgorithm2["PS384"] = "PS384";
  SigningAlgorithm2["PS512"] = "PS512";
  SigningAlgorithm2["HS256"] = "HS256";
  SigningAlgorithm2["HS384"] = "HS384";
  SigningAlgorithm2["HS512"] = "HS512";
  return SigningAlgorithm2;
})(SigningAlgorithm || {});
var GrantType = /* @__PURE__ */ ((GrantType2) => {
  GrantType2["AUTHORIZATION_CODE"] = "authorization_code";
  GrantType2["IMPLICIT"] = "implicit";
  GrantType2["PASSWORD"] = "password";
  GrantType2["CLIENT_CREDENTIALS"] = "client_credentials";
  GrantType2["REFRESH_TOKEN"] = "refresh_token";
  GrantType2["JWT_BEARER"] = "urn:ietf:params:oauth:grant-type:jwt-bearer";
  GrantType2["SAML2_BEARER"] = "urn:ietf:params:oauth:grant-type:saml2-bearer";
  GrantType2["DEVICE_CODE"] = "urn:ietf:params:oauth:grant-type:device_code";
  return GrantType2;
})(GrantType || {});
var ProtectedResourceMetadataBuilder = class {
  props;
  /**
   * Constructor for the builder
   * @param resource - The protected resource identifier (REQUIRED)
   * @param authorization_servers - Array of authorization server URLs (REQUIRED)
   */
  constructor(resource, authorization_servers) {
    if (!resource?.trim()) {
      throw new MissingRequiredArgumentError("resource");
    }
    if (!Array.isArray(authorization_servers) || authorization_servers.length === 0) {
      throw new MissingRequiredArgumentError("authorization_servers");
    }
    this.props = { resource, authorization_servers };
  }
  get properties() {
    return this.props;
  }
  /**
   * Builds the ProtectedResourceMetadata
   */
  build() {
    return new ProtectedResourceMetadata(this);
  }
  /**
   * Builder method to add JWKS URI
   */
  withJwksUri(jwks_uri) {
    this.props.jwks_uri = jwks_uri;
    return this;
  }
  /**
   * Builder method to add supported scopes
   */
  withScopesSupported(scopes_supported) {
    this.props.scopes_supported = [...scopes_supported];
    return this;
  }
  /**
   * Builder method to add supported bearer methods
   */
  withBearerMethodsSupported(bearer_methods_supported) {
    this.props.bearer_methods_supported = [...bearer_methods_supported];
    return this;
  }
  /**
   * Builder method to add supported resource signing algorithms
   */
  withResourceSigningAlgValuesSupported(resource_signing_alg_values_supported) {
    this.props.resource_signing_alg_values_supported = [...resource_signing_alg_values_supported];
    return this;
  }
  /**
   * Builder method to add resource_name
   */
  withResourceName(resource_name) {
    this.props.resource_name = resource_name;
    return this;
  }
  /**
   * Builder method to add resource documentation URL
   */
  withResourceDocumentation(resource_documentation) {
    this.props.resource_documentation = resource_documentation;
    return this;
  }
  /**
   * Builder method to add resource policy URI
   */
  withResourcePolicyUri(resource_policy_uri) {
    this.props.resource_policy_uri = resource_policy_uri;
    return this;
  }
  /**
   * Builder method to add resource terms of service URI
   */
  withResourceTosUri(resource_tos_uri) {
    this.props.resource_tos_uri = resource_tos_uri;
    return this;
  }
  /**
   * Builder method to enable TLS client certificate bound access tokens
   */
  withTlsClientCertificateBoundAccessTokens(tls_client_certificate_bound_access_tokens) {
    this.props.tls_client_certificate_bound_access_tokens = tls_client_certificate_bound_access_tokens;
    return this;
  }
  /**
   * Builder method to add supported authorization details types
   */
  withAuthorizationDetailsTypesSupported(authorization_details_types_supported) {
    this.props.authorization_details_types_supported = [...authorization_details_types_supported];
    return this;
  }
  /**
   * Builder method to add supported DPoP signing algorithms
   */
  withDpopSigningAlgValuesSupported(dpop_signing_alg_values_supported) {
    this.props.dpop_signing_alg_values_supported = [...dpop_signing_alg_values_supported];
    return this;
  }
  /**
   * Builder method to require DPoP bound access tokens
   */
  withDpopBoundAccessTokensRequired(dpop_bound_access_tokens_required) {
    this.props.dpop_bound_access_tokens_required = dpop_bound_access_tokens_required;
    return this;
  }
};
var ProtectedResourceMetadata = class {
  #resource;
  #authorization_servers;
  #jwks_uri;
  #scopes_supported;
  #bearer_methods_supported;
  #resource_signing_alg_values_supported;
  #resource_documentation;
  #resource_policy_uri;
  #resource_tos_uri;
  #resource_name;
  #tls_client_certificate_bound_access_tokens;
  #authorization_details_types_supported;
  #dpop_signing_alg_values_supported;
  #dpop_bound_access_tokens_required;
  constructor(builder) {
    const props = builder.properties;
    this.#resource = props.resource;
    this.#authorization_servers = [...props.authorization_servers];
    this.#jwks_uri = props.jwks_uri;
    this.#scopes_supported = props.scopes_supported ? [...props.scopes_supported] : void 0;
    this.#bearer_methods_supported = props.bearer_methods_supported ? [...props.bearer_methods_supported] : void 0;
    this.#resource_signing_alg_values_supported = props.resource_signing_alg_values_supported ? [...props.resource_signing_alg_values_supported] : void 0;
    this.#resource_documentation = props.resource_documentation;
    this.#resource_policy_uri = props.resource_policy_uri;
    this.#resource_tos_uri = props.resource_tos_uri;
    this.#resource_name = props.resource_name;
    this.#tls_client_certificate_bound_access_tokens = props.tls_client_certificate_bound_access_tokens;
    this.#authorization_details_types_supported = props.authorization_details_types_supported ? [...props.authorization_details_types_supported] : void 0;
    this.#dpop_signing_alg_values_supported = props.dpop_signing_alg_values_supported ? [...props.dpop_signing_alg_values_supported] : void 0;
    this.#dpop_bound_access_tokens_required = props.dpop_bound_access_tokens_required;
  }
  /**
   * Convert to JSON representation
   */
  toJSON() {
    return {
      resource: this.#resource,
      authorization_servers: [...this.#authorization_servers],
      ...this.#jwks_uri !== void 0 && { jwks_uri: this.#jwks_uri },
      ...this.#scopes_supported !== void 0 && {
        scopes_supported: [...this.#scopes_supported]
      },
      ...this.#bearer_methods_supported !== void 0 && {
        bearer_methods_supported: [...this.#bearer_methods_supported]
      },
      ...this.#resource_signing_alg_values_supported !== void 0 && {
        resource_signing_alg_values_supported: [...this.#resource_signing_alg_values_supported]
      },
      ...this.#resource_documentation !== void 0 && {
        resource_documentation: this.#resource_documentation
      },
      ...this.#resource_policy_uri !== void 0 && {
        resource_policy_uri: this.#resource_policy_uri
      },
      ...this.#resource_tos_uri !== void 0 && {
        resource_tos_uri: this.#resource_tos_uri
      },
      ...this.#resource_name !== void 0 && {
        resource_name: this.#resource_name
      },
      ...this.#tls_client_certificate_bound_access_tokens !== void 0 && {
        tls_client_certificate_bound_access_tokens: this.#tls_client_certificate_bound_access_tokens
      },
      ...this.#authorization_details_types_supported !== void 0 && {
        authorization_details_types_supported: [...this.#authorization_details_types_supported]
      },
      ...this.#dpop_signing_alg_values_supported !== void 0 && {
        dpop_signing_alg_values_supported: [...this.#dpop_signing_alg_values_supported]
      },
      ...this.#dpop_bound_access_tokens_required !== void 0 && {
        dpop_bound_access_tokens_required: this.#dpop_bound_access_tokens_required
      }
    };
  }
};

// src/token.ts
var TOKEN_RE = /^Bearer (.+)$/i;
function getToken(headers, query, body) {
  const fromHeader = getTokenFromHeader(headers);
  const fromQuery = getTokenFromQuery(query);
  const fromBody = getTokenFromBody(headers, body);
  if (!fromQuery && !fromHeader && !fromBody) {
    throw new InvalidRequestError("No Bearer token found in request");
  }
  if (+!!fromQuery + +!!fromBody + +!!fromHeader > 1) {
    throw new InvalidRequestError(
      "More than one method used for authentication"
    );
  }
  return fromQuery || fromBody || fromHeader;
}
function getTokenFromHeader(headers) {
  const authHeader = headers.authorization;
  if (typeof authHeader !== "string") {
    return void 0;
  }
  const match = authHeader.match(TOKEN_RE);
  return match?.[1];
}
function getTokenFromQuery(query) {
  const accessToken = query?.access_token;
  if (typeof accessToken === "string") {
    return accessToken;
  }
}
function getTokenFromBody(headers, body) {
  if (!body || typeof body.access_token !== "string") {
    return void 0;
  }
  const contentType = headers["content-type"];
  if (!contentType) {
    return void 0;
  }
  const isFormEncoded = contentType.toLowerCase().includes("application/x-www-form-urlencoded");
  if (!isFormEncoded) {
    return void 0;
  }
  return body.access_token;
}
export {
  ApiClient,
  BearerMethod,
  GrantType,
  InvalidRequestError,
  MissingRequiredArgumentError,
  MissingTransactionError,
  ProtectedResourceMetadataBuilder,
  SigningAlgorithm,
  VerifyAccessTokenError,
  getToken
};
//# sourceMappingURL=index.js.map