import fp from 'fastify-plugin';
import { ServerClient, CookieTransactionStore, StatelessStateStore, } from '@auth0/auth0-server-js';
import { FastifyCookieHandler } from './store/fastify-cookie-handler.js';
export default fp(async function auth0Fastify(fastify, options) {
    const callbackPath = '/auth/callback';
    const redirectUri = new URL(callbackPath, options.appBaseUrl);
    const auth0Client = new ServerClient({
        domain: options.domain,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        authorizationParams: {
            redirect_uri: redirectUri.toString(),
        },
        transactionStore: new CookieTransactionStore({
            secret: options.sessionSecret,
        }, new FastifyCookieHandler()),
        stateStore: new StatelessStateStore({
            secret: options.sessionSecret,
        }, new FastifyCookieHandler()),
    });
    fastify.get('/auth/login', async (request, reply) => {
        const authorizationUrl = await auth0Client.startInteractiveLogin({
            appState: { returnTo: options.appBaseUrl },
        }, { request, reply });
        reply.redirect(authorizationUrl.href);
    });
    fastify.get('/auth/callback', async (request, reply) => {
        const { appState } = await auth0Client.completeInteractiveLogin(new URL(request.url, options.appBaseUrl), { request, reply });
        reply.redirect(appState?.returnTo ?? options.appBaseUrl);
    });
    fastify.get('/auth/logout', async (request, reply) => {
        const returnTo = options.appBaseUrl;
        const logoutUrl = await auth0Client.logout({ returnTo: returnTo.toString() }, { request, reply });
        reply.redirect(logoutUrl.href);
    });
    fastify.decorate('auth0Client', auth0Client);
});
