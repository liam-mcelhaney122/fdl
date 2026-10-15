import { defineConfig } from 'vite';
import { starterAssets } from './starter-assets.mjs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    plugins: [{
        name:'fdl-runnable-starter',
        resolveId(id) { if (id === 'virtual:fdl-starter') return '\0fdl-starter'; },
        async load(id) { if (id === '\0fdl-starter') return `export default ${JSON.stringify(await starterAssets())}`; },
    }],
    build: {
        rollupOptions: {
            input: {
                home: resolve(directory, 'index.html'),
            },
        },
    },
});
