export class ExpressCookieHandler {
    setCookie(name, value, options, storeOptions) {
        if (!storeOptions) {
            throw new Error('StoreOptions not provided');
        }
        storeOptions.response.cookie(name, value, options || {});
    }
    getCookie(name, storeOptions) {
        if (!storeOptions) {
            throw new Error('StoreOptions not provided');
        }
        return storeOptions.request.cookies[name];
    }
    getCookies(storeOptions) {
        if (!storeOptions) {
            throw new Error('StoreOptions not provided');
        }
        return storeOptions.request.cookies;
    }
    deleteCookie(name, storeOptions) {
        if (!storeOptions) {
            throw new Error('StoreOptions not provided');
        }
        storeOptions.response.clearCookie(name);
    }
}
