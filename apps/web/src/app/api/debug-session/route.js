import { auth } from "@/auth";

export async function GET(request) {
    try {
        const session = await auth();
        const headers = Object.fromEntries(request.headers.entries());

        // Mask sensitive headers
        if (headers.cookie) {
            headers.hasCookie = true;
            delete headers.cookie;
        }

        return Response.json({
            authenticated: !!session,
            session: session || null,
            message: session ? "Authenticated" : "Not Authenticated",
            headers: headers, // Useful for checking Vercel headers like x-forwarded-host
            env: {
                AUTH_URL: process['env'].AUTH_URL ? "set" : "not set",
                VERCEL: process['env'].VERCEL ? "set" : "not set",
                NODE_ENV: process['env'].NODE_ENV
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
