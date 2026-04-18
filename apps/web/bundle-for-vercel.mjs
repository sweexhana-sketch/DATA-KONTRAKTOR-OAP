/**
 * bundle-for-vercel.mjs
 * Creates a fully self-contained CJS bundle for Vercel serverless deployment.
 * The vercel-entry.mjs is an ESM file. We use esbuild to bundle everything
 * (including react, react-dom, react-router, etc.) into a single CJS output.
 * 
 * Since the react-router build output is already ESM, esbuild handles the
 * ESM -> CJS conversion. This eliminates all "Dynamic require" and 
 * "MODULE_NOT_FOUND" errors because EVERYTHING is in one self-contained file.
 */
import { build } from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('📦 Bundling server for Vercel (Fully Self-Contained CJS)...');

const serverBuildPath = path.join(__dirname, 'build/server/index.js');
if (!fs.existsSync(serverBuildPath)) {
    console.error('❌ build/server/index.js not found! Run react-router build first.');
    process.exit(1);
}

try {
    await build({
        entryPoints: [path.join(__dirname, '__create/vercel-entry.mjs')],
        bundle: true,
        platform: 'node',
        target: 'node20',
        format: 'cjs',
        outfile: path.join(__dirname, '../../api/index.js'),
        // Only exclude native Node.js addons that can't be bundled
        external: [
            'fsevents',
            '@node-rs/*',
            // Node.js built-in modules are handled by platform:node automatically
        ],
        minify: true,
        sourcemap: true,
        logLevel: 'info',
        define: {
            'process.env.NODE_ENV': '"production"',
        },
        // Critical: resolve node: protocol imports to their bare equivalents
        alias: {
            'node:async_hooks': 'async_hooks',
            'node:buffer': 'buffer',
            'node:crypto': 'crypto',
            'node:events': 'events',
            'node:fs': 'fs',
            'node:http': 'http',
            'node:https': 'https',
            'node:net': 'net',
            'node:os': 'os',
            'node:path': 'path',
            'node:stream': 'stream',
            'node:url': 'url',
            'node:util': 'util',
            'node:zlib': 'zlib',
        },
    });
} catch (e) {
    console.error('❌ Build failed:', e.message);
    process.exit(1);
}

console.log('✅ Bundled to api/index.js (Self-Contained CJS)');
