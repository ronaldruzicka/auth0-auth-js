export async function hasSession(request, response, next) {
    const session = await request.auth0Client.getSession({
        request,
        response,
    });
    if (!session) {
        response.redirect(`/auth/login?returnTo=${request.url}`);
    }
    else {
        next();
    }
}
