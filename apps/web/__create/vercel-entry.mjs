/**
 * vercel-entry.mjs
 * Entry point for Vercel serverless deployment.
 */
import { handle } from 'hono/vercel';
// @ts-ignore
import rrBuild from '../build/server/index.js';

// The default export of the server build is the Hono app
const app = rrBuild.default || rrBuild;

export const config = { runtime: 'nodejs' };
export default handle(app);
