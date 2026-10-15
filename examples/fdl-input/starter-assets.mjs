import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';
const directory = fileURLToPath(new URL('.', import.meta.url));

export async function starterAssets() {
    const outdir = resolve(directory, '.starter-output');
    const result = await build({
        entryPoints: {'fdl-model': resolve(directory, '../../index.js'), 'fdl-field': resolve(directory, 'fdl-field.ts'), 'fdl-table': resolve(directory, 'fdl-table.ts')},
        outdir, write:false, bundle:true, splitting:true, format:'esm', target:'es2020',
        external:['lit', 'lit/*'], tsconfig:resolve(directory, '../../tsconfig.json'),
    });
    return Object.fromEntries(result.outputFiles.map(file => [relative(outdir, file.path), file.text]));
}
