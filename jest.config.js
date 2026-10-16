// Angular ships ES-module bundles with `exports`-only subpaths, which Jest 27
// cannot resolve itself. Map them to their bundles and transpile those bundles
// to CommonJS for Node only; no other test imports Angular.
const angularBundleTransform = [
    'babel-jest',
    {
        babelrc: false,
        configFile: false,
        presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
    },
];

module.exports = {
    setupFilesAfterEnv: [
        './tests/jest-helpers/jest.init.js',
        './tests/jest-helpers/raw-sources.js',
    ],
    transformIgnorePatterns: [
        '/node_modules/(?!(@angular|@lit/reactive-element|@open-wc/testing-helpers|lit|lit-element|lit-html|svelte|esm-env|clsx)/)',
    ],
    resolver: './tests/jest-helpers/svelte-resolver.js',
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node', 'svelte'],
    moduleNameMapper: {
        '^@angular/core/primitives/([a-z-]+)$':
            '<rootDir>/node_modules/@angular/core/fesm2022/primitives-$1.mjs',
        '^@angular/([a-z-]+)$': '<rootDir>/node_modules/@angular/$1/fesm2022/$1.mjs',
        '^@angular/([a-z-]+)/([a-z-]+)$': '<rootDir>/node_modules/@angular/$1/fesm2022/$2.mjs',
    },
    watchman: false,
    testEnvironment: 'jsdom',
    verbose: false,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['lcov', 'text-summary'],
    coverageThreshold: {
        global: {
            lines: 1,
            statements: 1,
            functions: 1,
            branches: 1,
        },
    },
    reporters: ['default'],
    roots: ['./tests'],

    collectCoverageFrom: [
        './*.{js,ts}',
        './filters/*.js',
        './helpers/*.js',
        './utilities/*.{js,ts}',
        './adapters/**/*.{js,ts,tsx}',
    ],
    globals: {
        'ts-jest': {
            // The Angular adapter is type-checked with TypeScript 5.9 by
            // `npm run typecheck:angular`; ts-jest's TypeScript 4 only transpiles it.
            diagnostics: { exclude: ['**/adapters/angular/**', '**/tests/angular/**'] },
        },
    },
    transform: {
        '/node_modules/@angular/.+\\.mjs$': angularBundleTransform,
        '^.+\\.svelte\\.js$': './tests/jest-helpers/svelte-transform.js',
        '^.+\\.tsx?$': 'ts-jest',
        '^.+\\.(js|mjs)$': 'babel-jest',
        '^.+\\.svelte$': './tests/jest-helpers/svelte-transform.js',
    },
};
