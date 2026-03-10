/**
 * bundle-for-vercel.mjs
 * Post-build script that bundles the React Router + Hono server for Vercel.
 * Strategy: ESM bundle with externalized core dependencies.
 */
import { build } from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('📦 Bundling server for Vercel deployment (ESM + External)...');

// Ensure the build/server directory has the output from react-router build
const serverBuildPath = path.join(__dirname, 'build/server/index.js');
if (!fs.existsSync(serverBuildPath)) {
    console.error('❌ build/server/index.js not found! Run npm run build first.');
    process.exit(1);
}

// Bundle the server build + handler into a single ESM file
// We externalize core packages to avoid bundling complexities and dynamic requires
try {
    await build({
        entryPoints: [path.join(__dirname, '__create/vercel-entry.mjs')],
        bundle: true,
        platform: 'node',
        target: 'node20',
        format: 'esm',
        outfile: path.join(__dirname, '../../api/index.mjs'),
        external: [
            'fsevents',
            '@node-rs/*',
            'virtual:react-router/server-build',
            'react',
            'react-dom',
            'react-dom/server',
            'react-router',
            '@react-router/node',
            'isbot',
            '@auth/core',
            '@hono/auth-js',
            '@neondatabase/serverless',
            'hono',
            'hono/vercel',
            'node:*'
        ],
        // No mocking of @hono/node-server here to be safe
        minify: true,
        sourcemap: true,
        logLevel: 'info',
        define: {
            'process.env.NODE_ENV': '"production"'
        },
    });
} catch (e) {
    console.error('❌ Esbuild Build Failed:');
    process.exit(1);
}

console.log('✅ Server bundled to ../../api/index.mjs');
