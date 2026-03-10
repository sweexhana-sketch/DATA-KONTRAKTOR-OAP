/**
 * vercel-entry.mjs
 * Entry point for Vercel serverless deployment.
 * Uses the pre-compiled server build from Vite to avoid transpilation issues.
 */
import { handle } from 'hono/vercel';
// @ts-ignore
import rrBuild from '../build/server/index.js';

// The default export of the server build is the Hono app
// (as defined in apps/web/__create/entry-node.ts)
const app = rrBuild.default || rrBuild;

export const config = { runtime: 'nodejs' };
export default handle(app);
