import { FieldType, Record, Recordset } from '../index';

const settings = [
    ['label', 'label', 'Amount'],
    ['placeholder', 'placeholder', 'Enter an amount'],
    ['textAlign', 'textAlign', 'right'],
    ['type', 'type', 'number'],
    ['minLength', 'minLength', 2],
    ['maxLength', 'maxLength', 10],
    ['required', 'required', true],
    ['disabled', 'isDisabled', true],
    ['visibleWhen', 'visible', false],
    ['readOnly', 'readonly', true],
    ['readOnlyWhen', 'readonly', true],
    ['emptyWhen', 'isEmpty', true],
    ['cellClass', 'cellClasses', ['amount', 'numeric']],
    ['rowClass', 'rowClasses', ['amount-row']],
];

describe.each(settings)('%s field setting', (modifier, getter, result) => {
    it('resolves a fixed value and a callback with the same field binding', () => {
        const base = new FieldType();
        const record = new Record({ amount: base }, { amount: 150 });
        const callback = jest.fn(() => result);
        const fixed = base.with[modifier](result);
        const calculated = base.with[modifier](callback);
        expect(fixed[getter](150, record, 'export')).toEqual(result);
        expect(calculated[getter](150, record, 'export')).toEqual(result);
        expect(callback).toHaveBeenLastCalledWith(150, record, 'export');
        expect(base[getter](150, record)).not.toEqual(result);
    });
});

it('uses the current value and record every time a setting is resolved', () => {
    const field = new FieldType().with.placeholder((value, record, context) =>
        `${context}:${record.getField('unit')}:${value}`);
    const record = new Record({ amount: field, unit: new FieldType() }, { amount: 1, unit: 'USD' });
    expect(field.placeholder(record.getField('amount'), record, 'form')).toBe('form:USD:1');
    record.setField('amount', 2);
    record.setField('unit', 'EUR');
    expect(field.placeholder(record.getField('amount'), record, 'form')).toBe('form:EUR:2');
});

it('replaces labels without evaluating superseded callbacks', () => {
    const previous = jest.fn(() => { throw new Error('superseded'); });
    const base = new FieldType().with.label(previous);
    expect(base.with.label('Replacement').label()).toBe('Replacement');
    expect(previous).not.toHaveBeenCalled();
});

it('uses model context, candidate values, and the final empty rule during validation', async () => {
    const required = jest.fn((value, record, context) => record.getField('enabled') && context === 'model');
    const empty = jest.fn((value, _record, context) => value === 'N/A' && context === 'model');
    const reference = new FieldType().with.required(required).and.emptyWhen(empty);
    const record = new Record({ reference, enabled: new FieldType() }, { reference: 'REF-1', enabled: true });
    expect(record.isValid('reference')).toBe(true);
    expect(record.isValid('reference', 'N/A')).toBe(false);
    expect(await record.isValidAsync('reference', 'N/A')).toBe(false);
    expect(required).toHaveBeenCalledWith('N/A', record, 'model');
    expect(empty).toHaveBeenCalledWith('N/A', record, 'model');
    record.setField('enabled', false);
    expect(record.isValid('reference', 'N/A')).toBe(true);
});

it('enforces calculated length bounds in synchronous and asynchronous model validation', async () => {
    const text = new FieldType().with.minLength((_value, record, context) =>
        context === 'model' ? record.getField('minimum') : 0)
        .and.maxLength((_value, record) => record.getField('maximum'));
    const record = new Record({ text, minimum: new FieldType(), maximum: new FieldType() },
        { text: 'abcd', minimum: 3, maximum: 5 });
    expect(record.isValid('text')).toBe(true);
    expect(record.isValid('text', 'ab')).toBe(false);
    expect(await record.isValidAsync('text', 'abcdef')).toBe(false);
    record.setField('minimum', 5);
    expect(record.isValid('text')).toBe(false);
});

it.each(['sortable', 'minColumnWidth', 'maxColumnWidth', 'targetColumnWidth'])('%s resolves without choosing a row', modifier => {
    const result = modifier === 'sortable' ? false : 100;
    const callback = jest.fn(context => context === 'export' ? result : undefined);
    const field = new FieldType().with[modifier](callback);
    expect(field[modifier]('export')).toBe(result);
    expect(callback).toHaveBeenCalledWith('export');
});

it('supplies the owning record and model context to default factories', () => {
    const callback = jest.fn((record, context) => `${context}:${record.getField('prefix')}`);
    const reference = new FieldType().with.defaultValue(callback);
    const record = new Record({ reference, prefix: new FieldType() }, { reference: 'old', prefix: 'INV' });
    expect(reference.defaultValue('existing', record)).toBe('existing');
    expect(callback).not.toHaveBeenCalled();
    record.clear();
    expect(record.getField('reference')).toBe('model:INV');
    expect(callback).toHaveBeenCalledWith(record, 'model');
});

it('evaluates defaults against an owning record when appending to an empty recordset', async () => {
    const callback = jest.fn((record, context) => record && context === 'model' ? 'new' : 'missing record');
    const recordset = new Recordset({ name: new FieldType().with.defaultValue(callback) }, []);
    await recordset.loaded;
    recordset.appendRecord();
    expect(recordset.allRecords[0].getField('name')).toBe('new');
    expect(callback.mock.calls[0][0]).toBe(recordset.allRecords[0]);
    expect(recordset.allRecords[0].hasChanged).toBe(false);
});

it('passes the record and context through parser and formatter pipelines', () => {
    const parser = jest.fn((value, record, context) => `${context}:${record.getField('prefix')}:${value}`);
    const formatter = jest.fn((value, _record, context) => `${context}:${value}`);
    const template = jest.fn((value, _record, context) => `${context}:${value}`);
    const text = new FieldType().with.parser(parser).and.formatter(formatter).and.template(template);
    const record = new Record({ text, prefix: new FieldType() }, { text: 'a', prefix: 'P' });
    record.parseAndSetField('text', 'b');
    expect(record.getField('text')).toBe('model:P:b');
    expect(parser).toHaveBeenCalledWith('b', record, 'model');
    expect(record.print('text')).toBe('print:print:model:P:b');
    expect(formatter).toHaveBeenCalledWith('model:P:b', record, 'print');
    expect(template).toHaveBeenCalledWith('print:model:P:b', record, 'print');
});
