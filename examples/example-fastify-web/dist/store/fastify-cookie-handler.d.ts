import { CookieHandler, CookieSerializeOptions } from '@auth0/auth0-server-js';
import { StoreOptions } from '../types.js';
export declare class FastifyCookieHandler implements CookieHandler<StoreOptions> {
    setCookie(name: string, value: string, options?: CookieSerializeOptions, storeOptions?: StoreOptions): void;
    getCookie(name: string, storeOptions?: StoreOptions): string | undefined;
    getCookies(storeOptions?: StoreOptions): Record<string, string>;
    deleteCookie(name: string, storeOptions?: StoreOptions): void;
}
//# sourceMappingURL=fastify-cookie-handler.d.ts.map