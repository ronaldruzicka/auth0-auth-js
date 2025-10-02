/**
 * MCP tools with scope-based authorization.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createAuth0Mcp } from "./auth0.js";
import { Auth } from "./types.js";
export declare const MCP_TOOL_SCOPES: string[];
export declare const registerTools: (mcpServer: McpServer, requireScopes: ReturnType<typeof createAuth0Mcp>["requireScopes"], authInfo: Auth) => void;
//# sourceMappingURL=tools.d.ts.map