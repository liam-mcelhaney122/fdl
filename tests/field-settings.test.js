import FieldTypeBuilder from '../field-type-builder';
import { Record, Recordset } from '../index';

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
        const base = new FieldTypeBuilder();
        const record = new Record({ amount: base }, { amount: 150 });
        const callback = jest.fn(() => result);
        const fixed = base[modifier](result);
        const calculated = base[modifier](callback);
        const args = modifier === 'rowClass' ? [record] : [150, record, 'export'];
        expect(fixed.valueOf()[getter](...args)).toEqual(result);
        expect(calculated.valueOf()[getter](...args)).toEqual(result);
        const callbackArgs = modifier === 'textAlign' ? [150, record, 'export']
            : ['emptyWhen', 'cellClass'].includes(modifier) ? [150, record] : [record];
        expect(callback).toHaveBeenLastCalledWith(...callbackArgs);
        expect(base.valueOf()[getter](150, record)).not.toEqual(result);
    });
});

it('uses the current value and record every time a setting is resolved', () => {
    const field = new FieldTypeBuilder().placeholder(record => `${record.getField('unit')}:${record.getField('amount')}`);
    const record = new Record({ amount: field, unit: new FieldTypeBuilder() }, { amount: 1, unit: 'USD' });
    expect(field.valueOf().placeholder(record.getField('amount'), record, 'form')).toBe('USD:1');
    record.setField('amount', 2);
    record.setField('unit', 'EUR');
    expect(field.valueOf().placeholder(record.getField('amount'), record, 'form')).toBe('EUR:2');
});

it('replaces labels without evaluating superseded callbacks', () => {
    const previous = jest.fn(() => { throw new Error('superseded'); });
    const base = new FieldTypeBuilder().label(previous);
    expect(base.label('Replacement').valueOf().label()).toBe('Replacement');
    expect(previous).not.toHaveBeenCalled();
});

it('uses record state, candidate values, and the final empty rule during validation', async () => {
    const required = jest.fn(record => record.getField('enabled'));
    const empty = jest.fn(value => value === 'N/A');
    const reference = new FieldTypeBuilder().required(required).emptyWhen(empty);
    const record = new Record({ reference, enabled: new FieldTypeBuilder() }, { reference: 'REF-1', enabled: true });
    expect(record.isValid('reference')).toBe(true);
    expect(record.isValid('reference', 'N/A')).toBe(false);
    expect(await record.isValidAsync('reference', 'N/A')).toBe(false);
    expect(required).toHaveBeenCalledWith(record);
    expect(empty).toHaveBeenCalledWith('N/A', record);
    record.setField('enabled', false);
    expect(record.isValid('reference', 'N/A')).toBe(true);
});

it('enforces calculated length bounds in synchronous and asynchronous model validation', async () => {
    const text = new FieldTypeBuilder().minLength(record => record.getField('minimum'))
        .maxLength(record => record.getField('maximum'));
    const record = new Record({ text, minimum: new FieldTypeBuilder(), maximum: new FieldTypeBuilder() },
        { text: 'abcd', minimum: 3, maximum: 5 });
    expect(record.isValid('text')).toBe(true);
    expect(record.isValid('text', 'ab')).toBe(false);
    expect(await record.isValidAsync('text', 'abcdef')).toBe(false);
    record.setField('minimum', 5);
    expect(record.isValid('text')).toBe(false);
});

it.each(['sortable', 'minColumnWidth', 'maxColumnWidth', 'targetColumnWidth'])('%s resolves without record, value, or context arguments', modifier => {
    const result = modifier === 'sortable' ? false : 100;
    const callback = jest.fn(() => result);
    const field = new FieldTypeBuilder()[modifier](callback);
    expect(field.valueOf()[modifier]()).toBe(result);
    expect(callback).toHaveBeenCalledWith();
    expect(new FieldTypeBuilder()[modifier](result).valueOf()[modifier]()).toBe(result);
    callback.mockReturnValue(modifier === 'sortable' ? true : 200);
    expect(field.valueOf()[modifier]()).toBe(modifier === 'sortable' ? true : 200);
});

it('supplies only the owning record to default factories', () => {
    const callback = jest.fn(record => record.getField('prefix'));
    const reference = new FieldTypeBuilder().defaultValue(callback);
    const record = new Record({ reference, prefix: new FieldTypeBuilder() }, { reference: 'old', prefix: 'INV' });
    expect(reference.valueOf().defaultValue('existing', record)).toBe('existing');
    expect(callback).not.toHaveBeenCalled();
    record.clear();
    expect(record.getField('reference')).toBe('INV');
    expect(callback).toHaveBeenCalledWith(record);
});

it('evaluates defaults against an owning record when appending to an empty recordset', async () => {
    const callback = jest.fn(record => record ? 'new' : 'missing record');
    const recordset = new Recordset({ name: new FieldTypeBuilder().defaultValue(callback) }, []);
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
    const text = new FieldTypeBuilder().parser(parser).formatter(formatter).template(template);
    const record = new Record({ text, prefix: new FieldTypeBuilder() }, { text: 'a', prefix: 'P' });
    record.parseAndSetField('text', 'b');
    expect(record.getField('text')).toBe('model:P:b');
    expect(parser).toHaveBeenCalledWith('b', record, 'model');
    expect(record.print('text')).toBe('print:print:model:P:b');
    expect(formatter).toHaveBeenCalledWith('model:P:b', record, 'print');
    expect(template).toHaveBeenCalledWith('print:model:P:b', record, 'print');
});
