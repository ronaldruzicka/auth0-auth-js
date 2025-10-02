"use strict";
/**
 * Exports the Hono app directly for Cloudflare Workers deployment.
 * This follows the standard Hono pattern for Workers where the app
 * is instantiated once and reused across requests.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("./server"));
/**
 * @returns Hono app configured for Cloudflare Workers deployment
 */
exports.default = server_1.default;
