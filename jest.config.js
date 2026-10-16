module.exports = {
    setupFilesAfterEnv: ['./tests/jest-helpers/jest.init.js', './tests/jest-helpers/raw-sources.js'],
    transformIgnorePatterns: [
        '/node_modules/(?!(@lit/reactive-element|@open-wc/testing-helpers|lit|lit-element|lit-html|svelte|esm-env|clsx)/)',
    ],
    resolver: './tests/jest-helpers/svelte-resolver.js',
    moduleFileExtensions: ['js', 'mjs', 'ts', 'tsx', 'json', 'node', 'svelte'],
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
        './adapters/**/*.{js,ts}',
    ],
    transform: {
        '^.+\\.svelte\\.js$': './tests/jest-helpers/svelte-transform.js',
        '^.+\\.tsx?$': 'ts-jest',
        '^.+\\.(js|mjs)$': 'babel-jest',
        '^.+\\.svelte$': './tests/jest-helpers/svelte-transform.js',
    },
};
