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

jest.mock(
    '../../examples/fdl-input/editable-recordset-model.ts?raw',
    function () {
        return {
            __esModule: true,
            default: require('fs').readFileSync(
                require('path').join(
                    __dirname,
                    '../../examples/fdl-input/editable-recordset-model.ts'
                ),
                'utf8'
            ),
        };
    },
    { virtual: true }
);

jest.mock(
    '../../examples/fdl-input/fdl-editable-recordset.ts?raw',
    function () {
        return {
            __esModule: true,
            default: require('fs').readFileSync(
                require('path').join(
                    __dirname,
                    '../../examples/fdl-input/fdl-editable-recordset.ts'
                ),
                'utf8'
            ),
        };
    },
    { virtual: true }
);

jest.mock(
    '../../examples/fdl-input/change-rule-page.ts?raw',
    function () {
        return {
            __esModule: true,
            default: require('fs').readFileSync(
                require('path').join(__dirname, '../../examples/fdl-input/change-rule-page.ts'),
                'utf8'
            ),
        };
    },
    { virtual: true }
);

jest.mock(
    '../../examples/fdl-input/fdl-composition-experiment.ts?raw',
    function () {
        return {
            __esModule: true,
            default: require('fs').readFileSync(
                require('path').join(
                    __dirname,
                    '../../examples/fdl-input/fdl-composition-experiment.ts'
                ),
                'utf8'
            ),
        };
    },
    { virtual: true }
);

jest.mock(
    '../../examples/fdl-input/composition-model.ts?raw',
    function () {
        return {
            __esModule: true,
            default: require('fs').readFileSync(
                require('path').join(__dirname, '../../examples/fdl-input/composition-model.ts'),
                'utf8'
            ),
        };
    },
    { virtual: true }
);

jest.mock(
    '../../examples/fdl-input/fdl-specialization-experiment.ts?raw',
    function () {
        return {
            __esModule: true,
            default: require('fs').readFileSync(
                require('path').join(
                    __dirname,
                    '../../examples/fdl-input/fdl-specialization-experiment.ts'
                ),
                'utf8'
            ),
        };
    },
    { virtual: true }
);

jest.mock(
    '../../examples/fdl-input/fdl-learning-path.ts?raw',
    function () {
        return {
            __esModule: true,
            default: require('fs').readFileSync(
                require('path').join(__dirname, '../../examples/fdl-input/fdl-learning-path.ts'),
                'utf8'
            ),
        };
    },
    { virtual: true }
);
