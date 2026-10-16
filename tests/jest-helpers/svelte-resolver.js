// Jest 27 ignores package `exports` and `imports`. Svelte 5 and its runtime
// dependencies publish only through those fields, so resolve them here with
// browser conditions. Every other request keeps Jest's default resolution.
const fs = require('fs');
const path = require('path');

const exportPackages = new Set(['svelte', 'esm-env', 'clsx']);
// `require` selects the bundled CommonJS compiler; runtime entries have no such condition.
const conditions = new Set(['browser', 'development', 'import', 'require', 'default']);

function packageRoot(name, basedir) {
    let directory = basedir;
    for (;;) {
        const candidate = path.join(directory, 'node_modules', name);
        if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
        const parent = path.dirname(directory);
        if (parent === directory) return undefined;
        directory = parent;
    }
}

function enclosingPackageRoot(basedir) {
    let directory = basedir;
    for (;;) {
        if (fs.existsSync(path.join(directory, 'package.json'))) return directory;
        const parent = path.dirname(directory);
        if (parent === directory) return undefined;
        directory = parent;
    }
}

function selectTarget(target) {
    if (typeof target === 'string') return target;
    if (!target || typeof target !== 'object') return undefined;
    for (const [condition, value] of Object.entries(target)) {
        if (!conditions.has(condition)) continue;
        const selected = selectTarget(value);
        if (selected) return selected;
    }
    return undefined;
}

function resolveFromMap(root, map, key) {
    const target = selectTarget(map?.[key]);
    return target ? path.join(root, target) : undefined;
}

function svelteResolver(request, options) {
    if (request.startsWith('#')) {
        const root = enclosingPackageRoot(options.basedir);
        const manifest = root && require(path.join(root, 'package.json'));
        if (manifest && exportPackages.has(manifest.name)) {
            const resolved = resolveFromMap(root, manifest.imports, request);
            if (resolved) return resolved;
        }
    }
    const match = /^((?:@[^/]+\/)?[^/.][^/]*)(\/.*)?$/.exec(request);
    if (match && exportPackages.has(match[1])) {
        const root = packageRoot(match[1], options.basedir);
        if (root) {
            const manifest = require(path.join(root, 'package.json'));
            const resolved = resolveFromMap(root, manifest.exports, `.${match[2] ?? ''}`);
            if (resolved) return resolved;
        }
    }
    return options.defaultResolver(request, options);
}

module.exports = svelteResolver;
