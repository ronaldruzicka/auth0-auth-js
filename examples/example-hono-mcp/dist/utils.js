"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.withMcpServer = withMcpServer;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const factory_1 = require("hono/factory");
const http_exception_1 = require("hono/http-exception");
const tools_1 = require("./tools");
/**
 * Middleware to enforce authentication on protected routes.
 */
function requireAuth() {
    return (0, factory_1.createMiddleware)(async (c, next) => {
        const authMiddleware = c.get("auth0Mcp").authMiddleware();
        return await authMiddleware(c, next);
    });
}
function withMcpServer() {
    return (0, factory_1.createMiddleware)(async (c, next) => {
        try {
            const { resourceName, requireScopes } = c.get("auth0Mcp");
            // In stateless mode, create a new instance of transport and server for each request
            // to ensure complete isolation. A single instance would cause request ID collisions
            // when multiple clients connect concurrently.
            const mcpServer = new mcp_js_1.McpServer({
                name: resourceName,
                version: "1.0.0",
            });
            // Register tools
            const authInfo = c.get("auth");
            (0, tools_1.registerTools)(mcpServer, requireScopes, authInfo);
            const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
            });
            await mcpServer.connect(transport);
            // Store server and transport in Hono context
            c.set("mcpServer", mcpServer);
            c.set("mcpTransport", transport);
            await next();
            // Cleanup after processing request
            transport.close();
        }
        catch (err) {
            console.error("Error handling MCP request:", err);
            throw new http_exception_1.HTTPException(500, {
                message: "Error setting up MCP server",
            });
        }
    });
}
