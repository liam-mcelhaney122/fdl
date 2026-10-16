// Match Vite's raw source imports while testing the documentation components.
jest.mock(
    '../../examples/fdl-input/delivery-model.ts?raw',
    function () {
        return {
            __esModule: true,
            default: require('fs').readFileSync(
                require('path').join(__dirname, '../../examples/fdl-input/delivery-model.ts'),
                'utf8'
            ),
        };
    },
    { virtual: true }
);
jest.mock(
    '../../examples/fdl-input/delivery-form.ts?raw',
    function () {
        return {
            __esModule: true,
            default: require('fs').readFileSync(
                require('path').join(__dirname, '../../examples/fdl-input/delivery-form.ts'),
                'utf8'
            ),
        };
    },
    { virtual: true }
);
jest.mock(
    '../../examples/fdl-input/delivery-data.ts?raw',
    function () {
        return {
            __esModule: true,
            default: require('fs').readFileSync(
                require('path').join(__dirname, '../../examples/fdl-input/delivery-data.ts'),
                'utf8'
            ),
        };
    },
    { virtual: true }
);
