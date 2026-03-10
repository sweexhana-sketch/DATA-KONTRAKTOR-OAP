/**
 * vercel-entry.mjs
 * Entry point for Vercel serverless deployment.
 */
import { handle } from 'hono/vercel';
// @ts-ignore
import rrBuild from '../build/server/index.js';

// The default export of the server build is the Hono app
const app = rrBuild.default || rrBuild;

// Defensive middleware to polyfill headers.get on the raw request if needed
app.use('*', async (c, next) => {
    const rawReq = c.req.raw;
    if (rawReq && rawReq.headers && typeof rawReq.headers.get !== 'function') {
        const headersObj = rawReq.headers;
        rawReq.headers.get = (name) => headersObj[name.toLowerCase()] || null;
    }
    await next();
});

export const config = { runtime: 'nodejs' };
export default handle(app);
