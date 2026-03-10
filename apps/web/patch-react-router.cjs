"use strict";
const fs = require('fs');
const path = require('path');

const binPath = path.resolve(__dirname, 'node_modules', '@react-router', 'dev', 'bin.js');

try {
    if (fs.existsSync(binPath)) {
        let content = fs.readFileSync(binPath, 'utf8');
        const patchString = '\nprocess.argv = process.argv.filter(arg => arg !== "--no-typecheck");\n';

        if (!content.includes(patchString.trim())) {
            // Inject the patch right after the shebang line (or at the very start)
            if (/^#!/.test(content)) {
                content = content.replace(/^#!.*\n/, match => match + patchString);
            } else {
                content = patchString + content;
            }
            fs.writeFileSync(binPath, content, 'utf8');
            console.log('✅ Successfully patched @react-router/dev/bin.js to ignore --no-typecheck');
        } else {
            console.log('ℹ️ @react-router/dev/bin.js is already patched.');
        }
    } else {
        console.log('⚠️ @react-router/dev/bin.js not found. Skipping patch.');
    }
} catch (error) {
    console.error('❌ Failed to patch @react-router/dev/bin.js:', error);
    // Don't exit with error — let the build continue
}
