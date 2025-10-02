import { Env, Variables } from "./types";
/**
 * Middleware to enforce authentication on protected routes.
 */
export declare function requireAuth(): import("hono").MiddlewareHandler<{
    Bindings: Env;
    Variables: Variables;
}, string, {}>;
export declare function withMcpServer(): import("hono").MiddlewareHandler<{
    Bindings: Env;
    Variables: Variables;
}, string, {}>;
//# sourceMappingURL=utils.d.ts.map