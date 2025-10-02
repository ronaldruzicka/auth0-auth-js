"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTools = exports.MCP_TOOL_SCOPES = void 0;
const zod_1 = require("zod");
exports.MCP_TOOL_SCOPES = ["tool:greet", "tool:whoami"];
const greetToolInputSchema = {
    name: zod_1.z
        .string()
        .optional()
        .describe("The name to greet (defaults to 'World')"),
};
const registerTools = (mcpServer, requireScopes, authInfo) => {
    mcpServer.registerTool("greet", {
        title: "Greet Tool",
        description: "Greets a user",
        inputSchema: greetToolInputSchema,
        annotations: { readOnlyHint: false },
    }, (args, extra) => requireScopes(["tool:greet"], async (payload, { authInfo }) => {
        const name = payload.name || "World";
        const userId = authInfo.extra.sub;
        return {
            content: [
                {
                    type: "text",
                    text: `Hello, ${name}! You are authenticated as: ${userId}`,
                },
            ],
        };
    })(args, { ...extra, authInfo }));
    mcpServer.registerTool("whoami", {
        title: "Whoami Tool",
        description: "Returns the authenticated user's information",
        annotations: { readOnlyHint: false },
    }, (args, extra) => requireScopes(["tool:whoami"], async (_payload, { authInfo }) => {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        user: authInfo.extra,
                        scopes: authInfo.scopes,
                    }, null, 2),
                },
            ],
        };
    })(args, { ...extra, authInfo }));
};
exports.registerTools = registerTools;
