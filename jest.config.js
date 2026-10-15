module.exports = {
    setupFilesAfterEnv: ['./tests/jest-helpers/jest.init.js'],
    transformIgnorePatterns: [
        '/node_modules/(?!(@lit/reactive-element|@open-wc/testing-helpers|lit|lit-element|lit-html)/)',
    ],
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
    ],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
        '^.+\\.(js|mjs)$': 'babel-jest',
    },
};
