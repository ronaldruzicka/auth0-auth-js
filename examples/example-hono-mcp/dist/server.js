"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fetch_to_node_1 = require("fetch-to-node");
const hono_1 = require("hono");
const cors_1 = require("hono/cors");
const http_exception_1 = require("hono/http-exception");
const logger_1 = require("hono/logger");
const auth0_1 = require("./auth0");
const utils_1 = require("./utils");
const MCP_SERVER_RESOURCE_NAME = "Example Hono MCP Server";
const app = new hono_1.Hono();
app.use("*", (0, logger_1.logger)(), (0, cors_1.cors)({
    origin: "*", // Allow requests from any origin. Adjust as needed for production.
    exposeHeaders: ["Mcp-Session-Id"],
    allowHeaders: ["Content-Type", "mcp-session-id"],
}), (c, next) => {
    const { AUTH0_AUDIENCE, AUTH0_DOMAIN, MCP_SERVER_URL } = c.env;
    if (!MCP_SERVER_URL) {
        throw new Error("MCP_SERVER_URL is required");
    }
    if (!AUTH0_DOMAIN) {
        throw new Error("AUTH0_DOMAIN is required");
    }
    return (0, auth0_1.auth0Mcp)({
        resourceName: MCP_SERVER_RESOURCE_NAME,
        resourceServerUrl: new URL(MCP_SERVER_URL),
        domain: AUTH0_DOMAIN,
        audience: AUTH0_AUDIENCE,
    })(c, next);
});
// MCP endpoint with authentication
app.post("/mcp", (0, utils_1.requireAuth)(), (0, utils_1.withMcpServer)(), async (c) => {
    try {
        const { req, res } = (0, fetch_to_node_1.toReqRes)(c.req.raw);
        await c.get("mcpTransport")?.handleRequest(req, res, await c.req.json());
        return await (0, fetch_to_node_1.toFetchResponse)(res);
    }
    catch (err) {
        console.error("Error handling MCP request:", err);
        return c.json({
            jsonrpc: "2.0",
            error: {
                code: -32603,
                message: "Internal server error",
            },
            id: null,
        });
    }
});
app.all("/mcp", () => {
    throw new http_exception_1.HTTPException(405, {
        message: "Method Not Allowed",
        res: new Response("Method Not Allowed", {
            status: 405,
            headers: {
                Allow: "POST",
            },
        }),
    });
});
app.onError((err, c) => {
    if (err instanceof http_exception_1.HTTPException) {
        return err.getResponse();
    }
    // fallback error response (MCP routes handle their own errors)
    return c.json({
        error: "Internal Server Error",
        message: err.message,
    }, 500);
});
exports.default = app;
