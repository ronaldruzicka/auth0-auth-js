import { ServerClient } from '@auth0/auth0-server-js';
import { StoreOptions } from './types.js';
export interface Auth0ExpressOptions {
    domain: string;
    clientId: string;
    clientSecret: string;
    appBaseUrl: string;
    sessionSecret: string;
}
declare module 'express' {
    interface Request {
        auth0Client: ServerClient<StoreOptions>;
    }
}
export declare function auth0(options: Auth0ExpressOptions): any;
//# sourceMappingURL=auth0.d.ts.map