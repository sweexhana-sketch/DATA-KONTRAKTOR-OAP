/**
 * vercel-entry.mjs
 * Entry point for Vercel serverless deployment.
 */
import { handle } from 'hono/vercel';
import { createRequestHandler } from 'react-router';
// @ts-ignore
import * as rrBuild from '../build/server/index.js';
// Import the app directly from our source code to avoid side-effects
// that might be present in the bundled React Router server build.
import { app } from './index.ts';

// Attach React Router handler for non-API routes on Vercel
// ESM imports of CommonJS sometimes put everything inside .default
// ESM imports of CommonJS sometimes put everything inside .default
const finalBuild = rrBuild.default ? { ...rrBuild.default } : { ...rrBuild };
if (!finalBuild.future) {
    finalBuild.future = { v8_middleware: true };
}
const rrHandler = createRequestHandler(finalBuild, 'production');
app.all('*', async (c) => {
    return rrHandler(c.req.raw);
});

export const config = { runtime: 'nodejs' };
export default handle(app);

