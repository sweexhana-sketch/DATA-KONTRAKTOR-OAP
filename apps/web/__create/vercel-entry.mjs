/**
 * vercel-entry.mjs
 * Entry point for Vercel serverless(Node.js runtime) deployment.
 *
 * The hono/vercel adapter's handle() calls new URL(req.url) internally.
 * Vercel's Node.js runtime passes request URLs as relative paths (e.g. "/"),
 * which causes "Invalid URL" errors. We patch the incoming request to
 * build a proper absolute URL before handing it to Hono.
 */
import { Hono } from 'hono';
// @ts-ignore
import rrBuild from '../build/server/index.js';

// The default export of the server build is the Hono app
const app = rrBuild.default || rrBuild;

/**
 * Vercel Node.js serverless handler.
 * Manually wraps the request into a proper Web-standard Request with
 * an absolute URL so that Hono processes it correctly.
 */
async function handler(req, res) {
    try {
        // Build an absolute URL from host header + relative path
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers['host'] || 'localhost';
        const pathname = req.url || '/';
        const url = `${protocol}://${host}${pathname}`;

        // Collect the body for non-GET/HEAD requests
        let body = undefined;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            body = await new Promise((resolve) => {
                const chunks = [];
                req.on('data', (chunk) => chunks.push(chunk));
                req.on('end', () => resolve(Buffer.concat(chunks)));
            });
        }

        // Build standard Web Request
        const webReq = new Request(url, {
            method: req.method,
            headers: req.headers,
            body: body?.length ? body : undefined,
        });

        // Dispatch to the Hono app
        const webRes = await app.fetch(webReq, { env: process.env });

        // Convert Web Response → Node.js ServerResponse
        res.statusCode = webRes.status;
        webRes.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });
        const buf = await webRes.arrayBuffer();
        res.end(Buffer.from(buf));
    } catch (err) {
        console.error('[vercel-entry] Error:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
    }
}

export const config = { runtime: 'nodejs' };
export default handler;
