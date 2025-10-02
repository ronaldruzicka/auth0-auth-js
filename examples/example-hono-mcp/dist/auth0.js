"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth0Mcp = auth0Mcp;
exports.createAuth0Mcp = createAuth0Mcp;
exports.createAuthMiddleware = createAuthMiddleware;
const auth0_api_js_1 = require("@auth0/auth0-api-js");
const errors_js_1 = require("@modelcontextprotocol/sdk/server/auth/errors.js");
const router_js_1 = require("@modelcontextprotocol/sdk/server/auth/router.js");
const factory_1 = require("hono/factory");
const http_exception_1 = require("hono/http-exception");
const tools_1 = require("./tools");
function auth0Mcp(options) {
    const a0Mcp = createAuth0Mcp(options);
    return (0, factory_1.createMiddleware)(async (c, next) => {
        // Handle OAuth metadata endpoint first
        if (c.req.path === "/.well-known/oauth-protected-resource" &&
            c.req.method === "GET") {
            const { MCP_SERVER_URL, AUTH0_DOMAIN } = c.env;
            const metadata = new auth0_api_js_1.ProtectedResourceMetadataBuilder(MCP_SERVER_URL, [`https://${AUTH0_DOMAIN}/`])
                .withScopesSupported(["openid", "profile", "email", ...tools_1.MCP_TOOL_SCOPES])
                .withJwksUri(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`)
                .build();
            return c.json(metadata.toJSON());
        }
        c.set("auth0Mcp", a0Mcp);
        await next();
    });
}
function createAuth0Mcp(opts) {
    const verify = createVerifier({
        domain: opts.domain,
        audience: opts.audience,
    });
    const requireScopes = createScopeValidator();
    const authMiddleware = createAuthMiddleware(opts.resourceServerUrl, verify);
    return {
        /**
         * Human-readable name for the protected resource (MCP server).
         */
        resourceName: opts.resourceName,
        /**
         * Wraps an MCP tool handler to enforce required OAuth scopes.
         *
         * @example
         * ```typescript
         * // Require specific scopes
         * export default requireScopes(["tool:greet"], async (params, { authInfo }) => {
         *   // Tool logic here
         * });
         *
         * // Authentication only (no scope validation)
         * export default requireScopes([], async (params, { authInfo }) => {
         *   // Tool logic here - just needs authenticated user
         * });
         */
        requireScopes,
        /**
         * Middleware for protecting MCP endpoints.
         * Validates Bearer tokens and sets auth info in the context.
         */
        authMiddleware: () => authMiddleware,
    };
}
function isNonEmptyString(value) {
    return typeof value === "string" && value.length > 0;
}
/**
 * Creates a JWT token verifier for Auth0-issued access tokens.
 *
 * This function returns a reusable `verify` function that validates JWT signatures,
 * token claims, and extracts user identity information for MCP integration using
 * the official @auth0/auth0-api-js library.
 */
function createVerifier({ domain, audience, }) {
    const apiClient = new auth0_api_js_1.ApiClient({
        domain,
        audience,
    });
    return async function verify(token) {
        try {
            const decoded = await apiClient.verifyAccessToken({
                accessToken: token,
            });
            if (!isNonEmptyString(decoded.sub)) {
                throw new errors_js_1.InvalidTokenError("Token is missing required subject (sub) claim");
            }
            let clientId = null;
            if (isNonEmptyString(decoded.client_id)) {
                clientId = decoded.client_id;
            }
            else if (isNonEmptyString(decoded.azp)) {
                clientId = decoded.azp;
            }
            if (!clientId) {
                throw new errors_js_1.InvalidTokenError("Token is missing required client identification (client_id or azp claim).");
            }
            return {
                token,
                clientId,
                scopes: typeof decoded.scope === "string"
                    ? decoded.scope.split(" ").filter(Boolean)
                    : [],
                ...(decoded.exp && { expiresAt: decoded.exp }),
                extra: {
                    sub: decoded.sub,
                    ...(isNonEmptyString(decoded.client_id) && {
                        client_id: decoded.client_id,
                    }),
                    ...(isNonEmptyString(decoded.azp) && { azp: decoded.azp }),
                    ...(isNonEmptyString(decoded.name) && { name: decoded.name }),
                    ...(isNonEmptyString(decoded.email) && { email: decoded.email }),
                },
            };
        }
        catch (error) {
            if (error instanceof auth0_api_js_1.VerifyAccessTokenError) {
                throw new errors_js_1.InvalidTokenError(error.message);
            }
            throw error;
        }
    };
}
/**
 * Returns a Hono middleware that protects MCP endpoints with Bearer token authentication.
 * This middleware validates Bearer tokens and sets auth info in the context.
 */
function createAuthMiddleware(resourceServerUrl, verifier) {
    const resourceMetadataUrl = (0, router_js_1.getOAuthProtectedResourceMetadataUrl)(resourceServerUrl);
    return (0, factory_1.createMiddleware)(async (c, next) => {
        try {
            const headers = {
                authorization: c.req.header("Authorization"),
            };
            const token = (0, auth0_api_js_1.getToken)(headers);
            const authInfo = await verifier(token);
            // Set auth info in Hono context
            c.set("auth", authInfo);
            await next();
        }
        catch (error) {
            if (error instanceof auth0_api_js_1.InvalidRequestError) {
                throw new http_exception_1.HTTPException(400, { message: 'Invalid Authorization header' });
            }
            else if (error instanceof errors_js_1.InvalidTokenError) {
                const wwwAuthValue = resourceMetadataUrl
                    ? `Bearer error="${error.errorCode}", error_description="${error.message}", resource_metadata="${resourceMetadataUrl}"`
                    : `Bearer error="${error.errorCode}", error_description="${error.message}"`;
                throw new http_exception_1.HTTPException(401, {
                    res: c.json(error.toResponseObject(), 401, {
                        "WWW-Authenticate": wwwAuthValue,
                    }),
                });
            }
            else {
                // Handle any other errors as server errors
                const serverError = new errors_js_1.ServerError("Internal Server Error");
                throw new http_exception_1.HTTPException(500, {
                    res: c.json(serverError.toResponseObject(), 500),
                });
            }
        }
    });
}
/**
 * Wraps an MCP tool handler to enforce required OAuth scopes.
 *
 * This is a higher-order function that adds scope-based authorization to MCP tools.
 * It validates that the authenticated user's JWT token contains all required scopes
 * before allowing access to the wrapped tool.
 */
function createScopeValidator() {
    /**
     * Wraps a tool handler with scope validation.
     * This function ensures that the tool can only be executed if the user has the required OAuth scopes.
     */
    return function requireScopes(requiredScopes, handler) {
        return (async (args, extra) => {
            // To support both context-only and payload+context handlers
            let context = extra;
            if (!extra) {
                context = args;
            }
            if (!context.authInfo) {
                throw new Error("Authentication information is required to execute this tool.");
            }
            const userScopes = context.authInfo.scopes;
            const hasScopes = requiredScopes.every((scope) => userScopes.includes(scope));
            if (!hasScopes) {
                throw new errors_js_1.InsufficientScopeError(`Missing required scopes: ${requiredScopes.join(", ")}`);
            }
            return handler(args, { authInfo: context.authInfo });
        });
    };
}
