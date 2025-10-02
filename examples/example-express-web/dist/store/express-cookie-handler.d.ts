import { CookieHandler, CookieSerializeOptions } from '@auth0/auth0-server-js';
import { StoreOptions } from '../types.js';
export declare class ExpressCookieHandler implements CookieHandler<StoreOptions> {
    setCookie(name: string, value: string, options?: CookieSerializeOptions, storeOptions?: StoreOptions): void;
    getCookie(name: string, storeOptions?: StoreOptions): string | undefined;
    getCookies(storeOptions?: StoreOptions): Record<string, string>;
    deleteCookie(name: string, storeOptions?: StoreOptions): void;
}
//# sourceMappingURL=express-cookie-handler.d.ts.map