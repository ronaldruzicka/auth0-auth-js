import 'dotenv/config';
import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auth0 } from './auth0.js';
import { hasSession } from './utils.js';
// Fix to use __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000;
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
app.use(express.static('public'));
app.use(expressLayouts);
app.set('layout', './layout.ejs');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(cookieParser());
app.use(auth0({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    appBaseUrl: process.env.APP_BASE_URL,
    sessionSecret: process.env.AUTH0_SESSION_SECRET,
}));
// @ts-expect-error TypeScript doesnt like this
const router = new express.Router();
router.get('/', async (request, response) => {
    const user = await request.auth0Client.getUser({
        request,
        response,
    });
    return response.render('index', { isLoggedIn: !!user, user: user });
});
router.get('/public', async (request, response) => {
    const user = await request.auth0Client.getUser({
        request,
        response,
    });
    return response.render('public', {
        isLoggedIn: !!user,
        user,
    });
});
router.get('/private', hasSession, async (request, response) => {
    const user = await request.auth0Client.getUser({
        request,
        response,
    });
    return response.render('private', {
        isLoggedIn: !!user,
        user,
    });
});
app.use(router);
