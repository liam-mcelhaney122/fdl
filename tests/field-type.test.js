import FieldTypeBuilder from '../field-type-builder';
import Record from '../record.js';

describe('FieldType', () => {
    describe('validate(modelValue, viewValue, record, options)', () => {
        const oddNumberValidator = {
            name: 'must-be-odd',
            validate(modelValue) {
                return modelValue % 2 === 0;
            },
        };

        const badAccountTypeValidator = {
            name: 'bad-account-type',
            validate(modelValue, viewValue, record, options) {
                const { accountType } = record;
                return modelValue === options.validAccountNumbers[accountType];
            },
        };

        const badAccountTypeAsyncValidator = {
            name: 'bad-account-type',
            async validate(modelValue, viewValue, record, options) {
                const { accountType } = record;
                return Promise.resolve(modelValue === options.validAccountNumbers[accountType]);
            },
        };

        const accountNumber = new FieldTypeBuilder().validator(badAccountTypeValidator);
        const oddNumber = new FieldTypeBuilder().validator(oddNumberValidator);

        const invalidRecord = {
            accountNumber: '1111',
            accountType: 'DR',
        };

        const options = {
            validAccountNumbers: {
                CR: '1111',
                DR: '2222',
            },
        };
        it('validates a field', () => {
            const errors = accountNumber.valueOf().validate(
                'accountNumber',
                '1111',
                '1111',
                invalidRecord,
                options
            );

            expect(errors).toEqual([
                {
                    field: 'accountNumber',
                    modelValue: '1111',
                    name: 'bad-account-type',
                    options: {
                        validAccountNumbers: {
                            CR: '1111',
                            DR: '2222',
                        },
                    },
                    record: {
                        accountNumber: '1111',
                        accountType: 'DR',
                    },
                    viewValue: '1111',
                },
            ]);
        });

        it('validates a field when only the model value is passed in', () => {
            const errors = oddNumber.valueOf().validate(2);

            expect(errors).toEqual([
                {
                    field: 2,
                    modelValue: undefined,
                    name: 'must-be-odd',
                    options: undefined,
                    record: undefined,
                    viewValue: undefined,
                },
            ]);
        });

        it('validates async predicates through validateAsync', async () => {
            const fieldType = new FieldTypeBuilder().validator(badAccountTypeAsyncValidator);

            await expect(
                fieldType.valueOf().validateAsync('accountNumber', '1111', '1111', invalidRecord, options)
            ).resolves.toEqual([
                expect.objectContaining({
                    field: 'accountNumber',
                    name: 'bad-account-type',
                }),
            ]);
            await expect(
                fieldType.valueOf().validateAsync('accountNumber', '2222', '2222', invalidRecord, options)
            ).resolves.toEqual([]);
        });

        it('rejects async predicates from synchronous validation', () => {
            const fieldType = new FieldTypeBuilder().validator(badAccountTypeAsyncValidator);

            expect(() =>
                fieldType.valueOf().validate('accountNumber', '1111', '1111', invalidRecord, options)
            ).toThrow(/validateAsync/);
        });
    });

    describe('formatter', () => {
        it('default: no formatting', () => {
            const fd = new FieldTypeBuilder();
            expect(fd.valueOf().print('identity')).toEqual('identity');
        });

        it('one formatter', () => {
            const fieldType = new FieldTypeBuilder().formatter(v => v.toUpperCase());
            expect(fieldType.valueOf().format('identity')).toEqual('IDENTITY');
        });

        it('two formatters', () => {
            const fieldType = new FieldTypeBuilder()
                .formatter(v => v.toUpperCase())
                .formatter(v => `${v}small`);
            expect(fieldType.valueOf().format('big')).toEqual('BIGsmall'); // cSpell:disable-line
        });

        it('extension', () => {
            const x = new FieldTypeBuilder().formatter(v => `${v}x`);
            const xy = x.formatter(v => `${v}y`);
            expect([x.valueOf().format(''), xy.valueOf().format('')]).toEqual(['x', 'xy']);
        });

        it('record', () => {
            const greeting = new FieldTypeBuilder().formatter(
                (value, record) => `${value} ${record.getField('name')}`
            );
            const record = new Record({ name: new FieldTypeBuilder() }, { name: 'world' });
            expect(greeting.valueOf().format('hello', record)).toEqual('hello world');
        });

        it('context', () => {
            const fieldType = new FieldTypeBuilder().formatter((value, record, context) => context);

            expect(fieldType.valueOf().format(null, null, 'input-focus')).toEqual('input-focus');
        });
    });

    describe('template', () => {
        it('default: no template', () => {
            const fieldType = new FieldTypeBuilder();
            expect(fieldType.valueOf().print('identity')).toEqual('identity');
        });

        it('one template', () => {
            const fieldType = new FieldTypeBuilder().template(input => `<b>${input}</b>`);
            expect(fieldType.valueOf().print('identity')).toEqual('<b>identity</b>');
        });

        it('calls formatter with the record and context of "print"', () => {
            const greeting = new FieldTypeBuilder().formatter(
                (value, record, context) => `${value} ${context} ${record.getField('name')}`
            );
            const record = new Record({ name: new FieldTypeBuilder() }, { name: 'world' });
            expect(greeting.valueOf().print('hello', record)).toEqual('hello print world');
        });
    });

    describe('parser', () => {
        it('default: no parsing', () => {
            const fd = new FieldTypeBuilder();
            expect(fd.valueOf().parse('identity')).toEqual('identity');
        });

        it('one parser', () => {
            const fd = new FieldTypeBuilder().parser(v => v.toLowerCase());
            expect(fd.valueOf().parse('IDENTITY')).toEqual('identity');
        });

        it('two parsers', () => {
            const fd = new FieldTypeBuilder().parser(v => `${v}BIG`).parser(v => v.toLowerCase());
            expect(fd.valueOf().parse('SMALL')).toEqual('smallBIG');
        });

        it('extension', () => {
            const ed = new FieldTypeBuilder().parser(word => `${word}ed`);
            const reed = ed.parser(word => `re${word}`);
            expect([ed.valueOf().parse('test'), reed.valueOf().parse('test')]).toEqual(['tested', 'retested']);
        });
    });

    describe('cellClass', () => {
        it('default: empty', () => {
            const fd = new FieldTypeBuilder();
            expect(fd.valueOf().cellClasses()).toEqual([]);
        });

        it('one class', () => {
            const fd = new FieldTypeBuilder().cellClass('passion');
            expect(fd.valueOf().cellClasses()).toEqual(['passion']);
        });

        it('many classes', () => {
            const fd = new FieldTypeBuilder()
                .cellClass('passion')
                .cellClass('relationships')
                .cellClass('integrity')
                .cellClass('drive-for-results')
                .cellClass('excellence');
            expect(fd.valueOf().cellClasses()).toEqual([
                'passion',
                'relationships',
                'integrity',
                'drive-for-results',
                'excellence',
            ]);
        });

        it('extension', () => {
            const x = new FieldTypeBuilder().cellClass('x');
            const y = x.cellClass('y');

            expect([x.valueOf().cellClasses(), y.valueOf().cellClasses()]).toEqual([['x'], ['x', 'y']]);
        });

        it('cellClass', () => {
            const fd = new FieldTypeBuilder()
                .cellClass('number')
                .cellClass(n => n % 2 === 1 ? 'odd' : [])
                .cellClass(n => n % 2 === 0 ? 'even' : []);
            expect(fd.valueOf().cellClasses(1)).toEqual(['number', 'odd']);
            expect(fd.valueOf().cellClasses(2)).toEqual(['number', 'even']);
        });

        it('cellClass - extension', () => {
            const x = new FieldTypeBuilder().cellClass(() => 'x');
            const xy = x.cellClass(() => 'y');

            expect([x.valueOf().cellClasses(1), xy.valueOf().cellClasses(1)]).toEqual([['x'], ['x', 'y']]);
        });
    });

    it('keeps fixed and conditional classes isolated when specializing a field', () => {
        const base = new FieldTypeBuilder().cellClass('amount');
        const high = base.cellClass(value => value > 100 ? 'high' : []);
        const low = base.cellClass(value => value < 100 ? 'low' : []);
        expect(base.valueOf().cellClasses(150)).toEqual(['amount']);
        expect(high.valueOf().cellClasses(150)).toEqual(['amount', 'high']);
        expect(high.valueOf().cellClasses(50)).toEqual(['amount']);
        expect(low.valueOf().cellClasses(50)).toEqual(['amount', 'low']);
        expect(low.valueOf().cellClasses(150)).toEqual(['amount']);
    });

    it('removes the separate conditionalCellClass modifier', () => {
        expect(new FieldTypeBuilder().conditionalCellClass).toBeUndefined();
    });

    describe('rowClass(record => {...})', () => {
        it('determines which classes at runtime', () => {
            const fd = new FieldTypeBuilder()
                .rowClass(record => (record.hasError ? ['error'] : []))
                .rowClass(record => (record.speed === 'same-day' ? ['ach', 'sda'] : ['ach']));

            expect(fd.valueOf().rowClasses({ hasError: true, speed: 'same-day' })).toEqual(['error', 'ach', 'sda']);
        });

        it('extension', () => {
            const x = new FieldTypeBuilder().rowClass(() => ['x']);
            const xy = x.rowClass(() => ['y']);

            expect([x.valueOf().rowClasses(), xy.valueOf().rowClasses()]).toEqual([['x'], ['x', 'y']]);
        });
    });

    describe.each([
        ['cellClass', 'cellClasses'],
        ['rowClass', 'rowClasses'],
    ])('%s class declarations', (modifier, getter) => {
        it('accumulates strings, arrays, and callback results in declaration order', () => {
            const field = new FieldTypeBuilder()[modifier]('base')
                [modifier](value => value > 100 ? ['warning', 'over-limit'] : [])
                [modifier](['numeric', 'currency'])
                [modifier](value => value > 100 ? 'review' : []);
            expect(field.valueOf()[getter](150)).toEqual(['base', 'warning', 'over-limit', 'numeric', 'currency', 'review']);
            expect(field.valueOf()[getter](50)).toEqual(['base', 'numeric', 'currency']);
        });

        it('isolates input arrays, results, and specialized definitions', () => {
            const classes = ['base'];
            const base = new FieldTypeBuilder()[modifier](classes);
            const child = base[modifier](() => ['child', 'detail']);
            classes.push('outside');
            child.valueOf()[getter](1).push('result-only');
            expect(base.valueOf()[getter](1)).toEqual(['base']);
            expect(child.valueOf()[getter](1)).toEqual(['base', 'child', 'detail']);
        });
    });

    it('removes the plural rowClasses modifier while retaining the collection getter', () => {
        expect(new FieldTypeBuilder().rowClasses).toBeUndefined();
        expect(new FieldTypeBuilder().valueOf().rowClasses()).toEqual([]);
    });

    it('computes cell classes from the current value and containing record', () => {
        const record = new Record({ amount: new FieldTypeBuilder(), limit: new FieldTypeBuilder() }, { amount: 150, limit: 100 });
        const callback = jest.fn((value, owner) => value > owner.getField('limit') ? ['warning', 'review'] : []);
        const field = new FieldTypeBuilder().cellClass('amount').cellClass(callback);
        expect(field.valueOf().cellClasses(record.getField('amount'), record)).toEqual(['amount', 'warning', 'review']);
        expect(callback).toHaveBeenLastCalledWith(150, record);
        record.setField('limit', 200);
        expect(field.valueOf().cellClasses(record.getField('amount'), record)).toEqual(['amount']);
    });

    describe('comparator((value, record) => {...})', () => {
        describe('default', () => {
            it('first is smaller (-1)', () => {
                const fieldType = new FieldTypeBuilder();
                expect(fieldType.valueOf().compare('x', 'y')).toBeLessThan(0);
            });

            it('first is larger (+1)', () => {
                const fieldType = new FieldTypeBuilder();
                expect(fieldType.valueOf().compare(50, 10)).toBeGreaterThan(0);
            });
            it('equal (0)', () => {
                const fieldType = new FieldTypeBuilder();
                expect(fieldType.valueOf().compare('', '')).toEqual(0);
            });
        });

        describe('custom', () => {
            it('string as a number', () => {
                const data = ['02', '0001', '003'];
                const accountNumber = new FieldTypeBuilder().compareFunction((aString, bString) => {
                    const a = +aString;
                    const b = +bString;

                    if (a < b) {
                        return -1;
                    }

                    if (a > b) {
                        return 1;
                    }

                    return 0;
                });
                data.sort(accountNumber.valueOf().compare.bind(accountNumber.valueOf()));
                expect(data).toEqual(['0001', '02', '003']);
            });
        });
    });

    describe('reducer((a, b) => {...}, <starting value>)', () => {
        it('empty string by default', () => {
            const recipientName = new FieldTypeBuilder();
            expect(recipientName.valueOf().aggregate(['Alice', 'Bob', 'Eve'])).toEqual('');
        });

        it('custom aggregator', () => {
            const product = values => values.reduce((a, b) => a * b, 1);
            const recipientName = new FieldTypeBuilder().reducer(product);
            expect(recipientName.valueOf().aggregate([2, 3, 5])).toEqual(30);
        });

        it('sum shorthand', () => {
            const recipientName = new FieldTypeBuilder().reducer('sum', 0);
            expect(recipientName.valueOf().aggregate([2, 3, 5])).toEqual(10);
        });
    });

    describe('schema(name)', () => {
        it('defaults to "simple"', () => {
            expect(new FieldTypeBuilder().valueOf().schema()).toEqual('simple');
        });
        it('can be set to a string value', () => {
            const address = new FieldTypeBuilder().schema('address');
            expect(address.valueOf().schema()).toEqual('address');
        });
    });

    describe('options(config)', () => {
        it('hasOptions', () => {
            const a = new FieldTypeBuilder();
            const b = new FieldTypeBuilder().options([1, 2, 3]).valueOf();
            expect([a.valueOf().hasOptions(), b.valueOf().hasOptions()]).toEqual([false, true]);
        });

        it('array of options', async () => {
            const state = new FieldTypeBuilder().options([
                { text: 'NC', value: 'north' },
                { text: 'SC', value: 'south' },
            ]).valueOf();

            expect(await state.options()).toEqual([
                { text: 'NC', value: 'north' },
                { text: 'SC', value: 'south' },
            ]);
        });

        it('data property as an array', async () => {
            const state = new FieldTypeBuilder().options({
                data: [
                    { abbr: 'NC', location: 'north' },
                    { abbr: 'SC', location: 'south' },
                ],
                text: 'abbr',
                value: 'location',
            }).valueOf();
            expect(await state.options()).toEqual([
                { text: 'NC', value: 'north', abbr: 'NC', location: 'north' },
                { text: 'SC', value: 'south', abbr: 'SC', location: 'south' },
            ]);
        });

        it('text and value keys as functions', async () => {
            const state = new FieldTypeBuilder().options({
                data: [
                    { abbr: 'NC', location: 'north' },
                    { abbr: 'SC', location: 'south' },
                ],
                text: s => s.abbr,
                value: s => s.location,
            }).valueOf();
            expect(await state.options()).toEqual([
                { text: 'NC', value: 'north', abbr: 'NC', location: 'north' },
                { text: 'SC', value: 'south', abbr: 'SC', location: 'south' },
            ]);
        });

        it('options as a promise', async () => {
            const options = Promise.resolve([
                { text: 'NC', value: 'north' },
                { text: 'SC', value: 'south' },
            ]);
            const state = new FieldTypeBuilder().options(options).valueOf();
            expect(await state.options()).toEqual([
                { text: 'NC', value: 'north' },
                { text: 'SC', value: 'south' },
            ]);
        });

        it('data property as a promise', async () => {
            const options = Promise.resolve([
                { text: 'NC', value: 'north' },
                { text: 'SC', value: 'south' },
            ]);

            const state = new FieldTypeBuilder().options({ data: options }).valueOf();
            expect(await state.options()).toEqual([
                { text: 'NC', value: 'north' },
                { text: 'SC', value: 'south' },
            ]);
        });

        it('function with options', async () => {
            const state = new FieldTypeBuilder().options({
                fetch() {
                    return Promise.resolve([
                        { text: 'NC', value: 'north' },
                        { text: 'SC', value: 'south' },
                    ]);
                },
            }).valueOf();
            expect(await state.options()).toEqual([
                { text: 'NC', value: 'north' },
                { text: 'SC', value: 'south' },
            ]);
        });

        it('sort options with a compare function', async () => {
            const sortOptions = (a, b) => {
                const x = a.text.toString().toLowerCase();
                const y = b.text.toString().toLowerCase();
                if (x < y) {
                    return -1;
                }

                if (x > y) {
                    return 1;
                }

                return 0;
            };
            const state = new FieldTypeBuilder().options({
                data: [
                    { text: 'VA', value: 'va' },
                    { text: 'NC', value: 'nc' },
                    { text: 'SC', value: 'sc' },
                    { text: 'GA', value: 'ga' },
                ],
                compareFunction: sortOptions,
            }).valueOf();
            expect(await state.options()).toEqual([
                { text: 'GA', value: 'ga' },
                { text: 'NC', value: 'nc' },
                { text: 'SC', value: 'sc' },
                { text: 'VA', value: 'va' },
            ]);
        });

        it.each([false, true])('refreshes direct options functions when record values change (async: %s)', async asynchronous => {
            const source = record => [{text: record.getField('department'), value: 'shared'}];
            const fetch = asynchronous ? async record => source(record) : source;
            const type = new FieldTypeBuilder().options(fetch).valueOf();
            const record = new Record({department: new FieldTypeBuilder()}, {department: 'engineering'});
            expect(await type.options(record)).toEqual([{text: 'engineering', value: 'shared'}]);
            record.setField('department', 'finance');
            expect(await type.options(record)).toEqual([{text: 'finance', value: 'shared'}]);
        });

        it('continues to cache direct options functions without record arguments', async () => {
            let calls = 0;
            const fetch = () => { calls++; return [{text: 'Shared', value: 'shared'}]; };
            const type = new FieldTypeBuilder().options(fetch).valueOf();
            const record = new Record({department: new FieldTypeBuilder()}, {department: 'engineering'});
            await type.options(record);
            record.setField('department', 'finance');
            await type.options(record);
            expect(calls).toBe(1);
        });

        it('fetch with a record object', async () => {
            const state = new FieldTypeBuilder().options({
                fetch(record) {
                    if (record.getField('isDakota')) {
                        return Promise.resolve([
                            { text: 'ND', value: 'north' },
                            { text: 'SD', value: 'south' },
                        ]);
                    }
                    return Promise.resolve([
                        { text: 'NC', value: 'north' },
                        { text: 'SC', value: 'south' },
                    ]);
                },
            }).valueOf();
            const record = new Record({ isDakota: new FieldTypeBuilder() }, { isDakota: false });

            expect(await state.options(record)).toEqual([
                { text: 'NC', value: 'north' },
                { text: 'SC', value: 'south' },
            ]);

            record.setField('isDakota', true);

            expect(await state.options(record)).toEqual([
                { text: 'ND', value: 'north' },
                { text: 'SD', value: 'south' },
            ]);
        });

        it('does not recompute the options if the relevant fields have not changed', async () => {
            let timesFetched = 0;

            const state = new FieldTypeBuilder().options({
                fetch(record) {
                    return Promise.resolve([
                        { text: record.getField('label'), value: ++timesFetched },
                    ]);
                },
                fields: ['label'],
            }).valueOf();
            const record = new Record(
                { label: new FieldTypeBuilder(), irrelevant: new FieldTypeBuilder() },
                { label: 'original', irrelevant: "You're an elephant!" }
            );

            expect(await state.options(record)).toEqual([{ text: 'original', value: 1 }]);
            record.setField('irrelevant', 'I know you are but what am I?');
            expect(await state.options(record)).toEqual([{ text: 'original', value: 1 }]);
            record.setField('label', 'changed');
            expect(await state.options(record)).toEqual([{ text: 'changed', value: 2 }]);
        });

        it('does not recompute the options if the fetch function has no arguments', async () => {
            let timesFetched = 0;

            const state = new FieldTypeBuilder().options({
                fetch() {
                    return Promise.resolve([{ text: 'original', value: ++timesFetched }]);
                },
                fields: ['label'],
            }).valueOf();
            const record = new Record(
                { label: new FieldTypeBuilder(), irrelevant: new FieldTypeBuilder() },
                { label: 'original', irrelevant: "You're an elephant!" }
            );

            expect(await state.options(record)).toEqual([{ text: 'original', value: 1 }]);
            record.setField('irrelevant', 'I know you are but what am I?');
            expect(await state.options(record)).toEqual([{ text: 'original', value: 1 }]);
            record.setField('label', 'changed');
            expect(await state.options(record)).toEqual([{ text: 'original', value: 1 }]);
        });

        it('multiple values', async () => {
            const states = new FieldTypeBuilder()
                .options([
                    { text: 'NC', value: 'north' },
                    { text: 'SC', value: 'south' },
                ])
                .multipleValues().valueOf();
            expect(await states.options()).toEqual([
                { text: 'NC', value: 'north' },
                { text: 'SC', value: 'south' },
            ]);
            expect(states.valueOf().hasMultipleValues()).toEqual(true);
        });

        it('multiple values - min and max', async () => {
            const favoriteMovies = new FieldTypeBuilder().multipleValues(3, 8);
            expect(favoriteMovies.valueOf().minValueCount()).toEqual(3);
            expect(favoriteMovies.valueOf().maxValueCount()).toEqual(8);
        });
    });

    describe('column widths', () => {
        it('minColumnWidth', () => {
            const a = new FieldTypeBuilder();
            const b = a.minColumnWidth(1);
            const c = a.minColumnWidth(2);
            const d = b.minColumnWidth(3);
            expect(b.valueOf().properties.minColumnWidth).toEqual(1);
            expect(c.valueOf().properties.minColumnWidth).toEqual(2);
            expect(d.valueOf().properties.minColumnWidth).toEqual(3);
        });

        it('maxColumnWidth', () => {
            const a = new FieldTypeBuilder();
            const b = a.maxColumnWidth(1);
            const c = a.maxColumnWidth(2);
            const d = b.maxColumnWidth(3);
            expect(b.valueOf().properties.maxColumnWidth).toEqual(1);
            expect(c.valueOf().properties.maxColumnWidth).toEqual(2);
            expect(d.valueOf().properties.maxColumnWidth).toEqual(3);
        });

        it('targetColumnWidth', () => {
            const a = new FieldTypeBuilder();
            const b = a.targetColumnWidth(1);
            const c = a.targetColumnWidth(2);
            const d = b.targetColumnWidth(3);
            expect(b.valueOf().properties.targetColumnWidth).toEqual(1);
            expect(c.valueOf().properties.targetColumnWidth).toEqual(2);
            expect(d.valueOf().properties.targetColumnWidth).toEqual(3);
        });
    });

    describe('disabled', () => {
        it('not disabled by default', () => {
            const a = new FieldTypeBuilder();
            expect(a.valueOf().isDisabled()).toBe(false);
        });

        it('is disabled when any disabled function is true', () => {
            const a = new FieldTypeBuilder().disabled(() => true).disabled(() => false);
            expect(a.valueOf().isDisabled()).toBe(true);
        });

        it('alias disabled without passing a function in', () => {
            const a = new FieldTypeBuilder().disabled();
            expect(a.valueOf().isDisabled()).toBe(true);
        });
    });

    it('keeps sample-data generation outside the field type API', () => {
        const type = new FieldTypeBuilder();
        expect(type.exampleValue).toBeUndefined();
        expect(type.exampleValue).toBeUndefined();
        expect(type.valueOf().properties).not.toHaveProperty('exampleValue');
    });

    describe('filter', () => {
        it('default: do not filter (always match)', () => {
            const type = new FieldTypeBuilder();
            expect(type.valueOf().match('searchText', 'value')).toEqual(true);
        });

        it('custom filter', () => {
            const type = new FieldTypeBuilder().filter((text, value) => value.startsWith(text));

            expect(type.valueOf().hasFilter()).toEqual(true);
            expect(type.valueOf().match('searchText', 'value')).toEqual(false);
            expect(type.valueOf().match('va', 'value')).toEqual(true);
            expect(type.valueOf().match('ue', 'value')).toEqual(false);
        });

        it('default filter -- case-insensitive text match', () => {
            const type = new FieldTypeBuilder().filter();

            expect(type.valueOf().match('searchText', 'value')).toEqual(false);
            expect(type.valueOf().match('val', 'value')).toEqual(true);
            expect(type.valueOf().match('ALU', 'value')).toEqual(true);
            expect(type.valueOf().match('anything', null)).toEqual(false);
        });
    });

    describe('inputMask', () => {
        it('tests every character independently with global or sticky regexes', () => {
            for (const regex of [/[0-9]/g, /[0-9]/y]) {
                const type = new FieldTypeBuilder().inputMask(regex);
                expect(['1', '2', 'x', '3', '😀'].map(char => type.valueOf().allowInputChar(char)))
                    .toEqual([true, true, false, true, false]);
                expect(regex.lastIndex).toBe(0);
            }
        });

        it('allows input if and only if it matches a regex', () => {
            const type = new FieldTypeBuilder().inputMask(/[0-9$.,]/);
            expect(type.valueOf().allowInputChar('0')).toEqual(true);
            expect(type.valueOf().allowInputChar('x')).toEqual(false);
        });

        it('allows all input by default', () => {
            const type = new FieldTypeBuilder();
            expect(type.valueOf().allowInputChar('0')).toEqual(true);
            expect(type.valueOf().allowInputChar('x')).toEqual(true);
        });

        it('always allows input that is not a character', () => {
            const type = new FieldTypeBuilder().inputMask(/[0-9]/);
            expect(type.valueOf().allowInputChar('Left')).toEqual(true);
        });
    });

    describe('label()', () => {
        it('takes a label as a string', () => {
            const type = new FieldTypeBuilder().label('Name');
            expect(type.valueOf().label()).toEqual('Name');
        });
        it('takes a label as a function', () => {
            const type = new FieldTypeBuilder().label(() => 'Name');
            expect(type.valueOf().label()).toEqual('Name');
        });

        it('uses information from the record to build a label', () => {
            const record = new Record({ count: new FieldTypeBuilder() }, { count: 10 });
            const type = new FieldTypeBuilder().label(`${record.getField('count')} payments(s)`);
            expect(type.valueOf().label()).toEqual('10 payments(s)');
        });
        it('uses the last label declaration with the owning record', () => {
            const type = new FieldTypeBuilder()
                .label('Hello')
                .label(record => `${record.getField('title')} World`)
                .label(record => `${record.getField('title')} WORLD`);
            expect(type.valueOf().label(undefined, new Record({ title: new FieldTypeBuilder() }, { title: 'HELLO' }))).toEqual('HELLO WORLD');
        });
    });

    describe('visibleWhen', () => {
        it('is visible by default', () => {
            const type = new FieldTypeBuilder();
            expect(type.valueOf().visible()).toEqual(true);
        });
        it("isn't visible whenVisible() is false", () => {
            const type = new FieldTypeBuilder().visibleWhen(() => false);
            expect(type.valueOf().visible()).toEqual(false);
        });
    });

    describe('required', () => {
        it('is not required by default', () => {
            const type = new FieldTypeBuilder();
            expect(type.valueOf().required()).toEqual(false);
        });
        it('is required when required() is true', () => {
            const type = new FieldTypeBuilder().required(() => true);
            expect(type.valueOf().required()).toEqual(true);
        });

        it('alias required without passing a function in', () => {
            const a = new FieldTypeBuilder().required();
            expect(a.valueOf().required()).toBe(true);
        });
    });

    describe('readOnlyWhen', () => {
        it("isn't readonly() by default", () => {
            const type = new FieldTypeBuilder();
            expect(type.valueOf().readonly()).toEqual(false);
        });
        it('is readonly when readOnlyWhen returns true', () => {
            const type = new FieldTypeBuilder().readOnlyWhen(() => true);
            expect(type.valueOf().readonly()).toEqual(true);
        });

        it('alias readOnly without passing a function in', () => {
            const a = new FieldTypeBuilder().readOnly();
            expect(a.valueOf().readonly()).toBe(true);
        });
    });

    describe('Min and Max length', () => {
        let field;
        beforeEach(() => {
            field = new FieldTypeBuilder().minLength(3).maxLength(10);
        });
        it('adds a validator for min length', () => {
            const minLengthValidator = field.properties.validators.find(
                validator => validator.name === `minimum length is ${3}`
            );
            expect(minLengthValidator).toBeTruthy();
        });
        it('adds a validator for max length', () => {
            const maxLengthValidator = field.properties.validators.find(
                validator => validator.name === `maximum length is ${10}`
            );
            expect(maxLengthValidator).toBeTruthy();
        });
    });

    describe('info()', () => {
        it('reports descriptions -- used for documentation and debugging', () => {
            const account = new FieldTypeBuilder().description('a bank account');
            expect(account.valueOf().info()).toEqual(['a bank account']);
        });

        it('reports other descriptions (using disabled for an example)', () => {
            function amountIsZero() {
                return false;
            }
            const account = new FieldTypeBuilder().disabled(amountIsZero);
            expect(account.valueOf().info()).toEqual(['disabled when amountIsZero']);
        });
    });

    describe('empty', () => {
        it('should be empty when value is null, undefined or 0-length string by default', () => {
            let emptyField = new FieldTypeBuilder();
            expect(emptyField.valueOf().empty()).toBe(true);
            emptyField = new FieldTypeBuilder().defaultValue(null);
            expect(emptyField.valueOf().empty()).toBe(true);
            emptyField = new FieldTypeBuilder().defaultValue(undefined);
            expect(emptyField.valueOf().empty()).toBe(true);
            emptyField = new FieldTypeBuilder().defaultValue('    ');
            expect(emptyField.valueOf().empty()).toBe(true);
        });
    });

    it('keeps focus selection outside the field type API', () => {
        const type = new FieldTypeBuilder();
        expect(type.selectOnFocus).toBeUndefined();
        expect(type.selectOnFocus).toBeUndefined();
        expect(type.valueOf().properties).not.toHaveProperty('selectOnFocus');
    });

    describe('form element', () => {
        it('adds a form element', () => {
            const fieldType = new FieldTypeBuilder().formElement('input', {
                minLength: 1,
                maxLength: 10,
                placeholder: 'Name...',
            });
            expect(fieldType.valueOf().properties.formElement.name).toEqual('input');
            expect(fieldType.valueOf().properties.formElement.properties).toBeTruthy();
        });
    });

    it('keeps toggle presentation outside the field type API', () => {
        const type = new FieldTypeBuilder();
        expect(type.toggle).toBeUndefined();
        expect(type.toggle).toBeUndefined();
        expect(type.valueOf().properties).not.toHaveProperty('toggle');
    });

    it('handles text alignment via x.textAlign()', () => {
        const alignRight = new FieldTypeBuilder().textAlign('right');
        expect(alignRight.valueOf().textAlign()).toEqual('right');

        const alignCenter = new FieldTypeBuilder().textAlign('center');
        expect(alignCenter.valueOf().textAlign()).toEqual('center');
    });

    it('stores a row count via x.rowCount(n)', () => {
        const fiveRows = new FieldTypeBuilder().rowCount(5);
        expect(fiveRows.valueOf().rowCount()).toEqual(5);
    });

    it('knows when to be segmented using x.segmented()', () => {
        const segmentField = new FieldTypeBuilder().segmented();
        expect(segmentField.valueOf().segmented()).toEqual(true);
    });

    it('detects when a field should be inline', () => {
        const inlineField = new FieldTypeBuilder().inline();
        expect(inlineField.valueOf().inline()).toEqual(true);
    });

    it('stores a placeholder', () => {
        const withPlaceholder = new FieldTypeBuilder().placeholder('Select an option');
        expect(withPlaceholder.valueOf().placeholder()).toEqual('Select an option');
    });

    it('stores a range property', () => {
        const withRange = new FieldTypeBuilder().range();
        expect(withRange.valueOf().hasRange()).toEqual(true);
    });

    it('takes a hashFunction to determine option matches', () => {
        const withHashAndOptions = new FieldTypeBuilder()
            .options([
                { text: 'Ben', value: { name: 'Ben', id: 0 } },
                { text: 'Aaron', value: { name: 'Aaron', value: 1 } },
            ])
            .hashFunction(item => item?.id).valueOf();
        expect(withHashAndOptions.valueOf().properties.hashFunction({ name: 'Ben', id: 0 })).toEqual(0);
    });

    describe('iconMessage', () => {
        it('iconMessage as string', () => {
            const a = new FieldTypeBuilder();
            const b = a.iconMessage('some message');
            expect(b.valueOf().properties.iconMessage).toEqual('some message');
        });

        it('iconMessage as object', () => {
            const messageSettings = {
                message: 'some message',
                direction: 'bottom',
                light: true,
            };
            const a = new FieldTypeBuilder();
            const b = a.iconMessage(messageSettings);
            expect(b.valueOf().properties.iconMessage).toEqual(messageSettings);
        });
    });
    describe('onValueChange', () => {
        let user;
        let record;
        let id;
        beforeEach(() => {
            user = new FieldTypeBuilder();
            id = new FieldTypeBuilder().onValueChange(r => {
                const u = r.getField('user');
                record.setField('id', u?.id);
            });
            record = new Record(
                { user, id },
                { user: { name: 'Ben', id: 5678, company: 'Test' }, id: 1234 }
            );
        });
        it('uses onValueChange to react to field changes', () => {
            record.setField('user', { name: 'Aaron', id: 999, company: 'Test' });
            record.fieldTypeForField('id').onValueChange(record);
            expect(record.getField('id')).toEqual(999);
        });
    });

    describe('tag', () => {
        it('has a default input tag', () => {
            const field = new FieldTypeBuilder();
            expect(field.valueOf().tag()).toEqual('input');
        });
        it('sets a tag property', () => {
            const field = new FieldTypeBuilder().tag('select');
            expect(field.valueOf().tag()).toEqual('select');
        });
    });

    describe('type', () => {
        it('has a default input type', () => {
            const field = new FieldTypeBuilder();
            expect(field.valueOf().type()).toEqual('text');
        });
        it('sets a type property', () => {
            const field = new FieldTypeBuilder().type('number');
            expect(field.valueOf().type()).toEqual('number');
        });
        it('throws an error if if the type provided is not valid', () => {
            const field = new FieldTypeBuilder().type('invalid');
            expect(field.valueOf().type()).toEqual(new Error('Invalid input type: invalid'));
        });
    });
});

describe('consolidated state modifiers', () => {
    it('removes the redundant conditional modifier names', () => {
        expect(new FieldTypeBuilder().requiredWhen).toBeUndefined();
        expect(new FieldTypeBuilder().disabledWhen).toBeUndefined();
    });

    it('keeps required state and validation in sync as record dependencies change', () => {
        const required = new FieldTypeBuilder().emptyWhen(value => value === 'N/A')
            .required(record => record.getField('needsReference'));
        const record = new Record({needsReference: new FieldTypeBuilder(), reference: required}, {needsReference:false, reference:'N/A'});
        expect(required.valueOf().required(undefined, record)).toBe(false);
        expect(record.isValid('reference')).toBe(true);
        record.setField('needsReference', true);
        expect(required.valueOf().required(undefined, record)).toBe(true);
        expect(record.isValid('reference')).toBe(false);
        record.setField('reference', 'REF-42');
        expect(record.isValid('reference')).toBe(true);
        record.setField('reference', '');
        record.setField('needsReference', false);
        expect(record.isValid('reference')).toBe(true);
    });

    it('composes predicates and unconditional rules without changing their baselines', () => {
        const base = new FieldTypeBuilder();
        const conditional = base.required(record => record.getField('first'))
            .required(record => record.getField('second'))
            .disabled(record => record.getField('first'))
            .disabled(record => record.getField('second'));
        const always = conditional.required().disabled();
        const record = new Record({first:new FieldTypeBuilder(),second:new FieldTypeBuilder(),value:conditional}, {first:false,second:false,value:''});
        expect(conditional.valueOf().required(undefined, record)).toBe(false);
        expect(conditional.valueOf().isDisabled(undefined, record)).toBe(false);
        expect(always.valueOf().required(undefined, record)).toBe(true);
        expect(always.valueOf().isDisabled(undefined, record)).toBe(true);
        record.setField('second', true);
        expect(conditional.valueOf().required(undefined, record)).toBe(true);
        expect(conditional.valueOf().isDisabled(undefined, record)).toBe(true);
        expect(record.isValid('value')).toBe(false);
        expect(base.valueOf().required(undefined, record)).toBe(false);
        expect(base.valueOf().isDisabled(undefined, record)).toBe(false);
        record.setField('second', false);
        expect(record.isValid('value')).toBe(true);
    });
});
