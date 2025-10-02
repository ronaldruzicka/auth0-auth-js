import { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ZodRawShape } from "zod";
import { Auth, Env, Variables } from "./types";
export interface Auth0McpOptions {
    resourceName: string;
    resourceServerUrl: URL;
    domain: string;
    audience: string;
}
export declare function auth0Mcp(options: Auth0McpOptions): import("hono").MiddlewareHandler<{
    Bindings: Env;
    Variables: Variables;
}, string, {}>;
export declare function createAuth0Mcp(opts: Auth0McpOptions): {
    /**
     * Human-readable name for the protected resource (MCP server).
     */
    resourceName: string;
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
    requireScopes: <T extends ZodRawShape>(requiredScopes: readonly string[], handler: (args: T, extra: {
        authInfo: Auth;
    }) => Promise<CallToolResult>) => ToolCallback<T>;
    /**
     * Middleware for protecting MCP endpoints.
     * Validates Bearer tokens and sets auth info in the context.
     */
    authMiddleware: () => import("hono").MiddlewareHandler<{
        Bindings: Env;
        Variables: Variables;
    }, string, {}>;
};
/**
 * Returns a Hono middleware that protects MCP endpoints with Bearer token authentication.
 * This middleware validates Bearer tokens and sets auth info in the context.
 */
export declare function createAuthMiddleware(resourceServerUrl: URL, verifier: (token: string) => Promise<Auth>): import("hono").MiddlewareHandler<{
    Bindings: Env;
    Variables: Variables;
}, string, {}>;
//# sourceMappingURL=auth0.d.ts.map