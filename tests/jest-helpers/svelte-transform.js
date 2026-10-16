// Compile Svelte components and rune modules (`*.svelte.js`) for Jest, then let
// Babel convert the ESM output to the CommonJS modules that Jest 27 executes.
const { compile, compileModule } = require('svelte/compiler');
const babelJest = require('babel-jest').default ?? require('babel-jest');

const babelTransformer = babelJest.createTransformer();

function process(source, filename, ...rest) {
    const options = { filename, generate: 'client', dev: false };
    const { js } = filename.endsWith('.svelte')
        ? compile(source, options)
        : compileModule(source, options);
    return babelTransformer.process(js.code, filename, ...rest);
}

function getCacheKey(source, filename, ...rest) {
    return `svelte:${babelTransformer.getCacheKey(source, filename, ...rest)}`;
}

module.exports = { process, getCacheKey };
