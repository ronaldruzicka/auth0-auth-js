import type { FastifyInstance } from 'fastify';
import { ServerClient } from '@auth0/auth0-server-js';
import type { StoreOptions } from './types.js';
declare module 'fastify' {
    interface FastifyInstance {
        auth0Client: ServerClient<StoreOptions> | undefined;
    }
}
export interface Auth0FastifyOptions {
    domain: string;
    clientId: string;
    clientSecret: string;
    appBaseUrl: string;
    sessionSecret: string;
}
declare const _default: (fastify: FastifyInstance, options: Auth0FastifyOptions) => Promise<void>;
export default _default;
//# sourceMappingURL=auth0.d.ts.map