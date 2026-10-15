import FieldTypeBuilder from '../field-type-builder';
import { FieldType, field, Record, Recordset, string, number, boolean, date } from '../index';
import type { FieldDefinition } from '../index';
import * as publicApi from '../index';

it('chains modifiers into builders and explicitly finalizes runtime behavior', () => {
    const definition = string.required().maxLength(5).label('Name');
    expect(definition).toBeInstanceOf(FieldTypeBuilder);
    const type = definition.valueOf();
    expect(type).toBeInstanceOf(FieldType);
    expect(type.valueOf()).toBe(type);
    expect(type.required()).toBe(true);
    expect(type.label()).toBe('Name');
    expect(type.maxLength()).toBe(5);
    expect(type.validate('name', 'Too long', 'Too long', undefined, undefined)).toHaveLength(1);
});

it('specializes reusable builders without changing the baseline or siblings', () => {
    const base = string.maxLength(5).cellClass('name');
    const first = base.required().cellClass('first');
    const second = base.label('Nickname').cellClass('second');
    expect(base.valueOf().required()).toBe(false);
    expect(first.valueOf().required()).toBe(true);
    expect(second.valueOf().required()).toBe(false);
    expect(base.valueOf().cellClasses()).toEqual(['name']);
    expect(first.valueOf().cellClasses()).toEqual(['name', 'first']);
    expect(second.valueOf().cellClasses()).toEqual(['name', 'second']);
    expect(string.valueOf().maxLength()).toBe(524288);
});

it('normalizes mixed inputs once without changing the caller map', () => {
    const builder = string.required();
    const finalize = jest.spyOn(builder, 'valueOf');
    const id = string.readOnly().valueOf();
    const fields = { name: builder, id };
    const record = new Record(fields, { name: '', id: 'ID-1' });
    expect(record.fieldTypeForField('name')).toBeInstanceOf(FieldType);
    expect(record.fieldTypeForField('id')).toBe(id);
    expect(record.isValid('name')).toBe(false);
    record.setField('name', 'Ada');
    expect(record.isValid('name')).toBe(true);
    expect(finalize).toHaveBeenCalledTimes(1);
    expect(fields.name).toBe(builder);
});

it('finalizes definitions added to a record', () => {
    const record = new Record({ name: string }, { name: '' });
    record.addField('reference', string.required().label('Reference'), '');
    expect(record.fieldTypeForField('reference')).toBeInstanceOf(FieldType);
    expect(record.isValid('reference')).toBe(false);
    record.field('reference').value = 'REF-1';
    expect(record.isValid('reference')).toBe(true);
});

it('normalizes a recordset once and shares runtime types with its rows', async () => {
    const builder = number.defaultValue(3).compareFunction((a, b) => a - b);
    const finalize = jest.spyOn(builder, 'valueOf');
    const table = new Recordset({ amount: builder }, [{ amount: 2 }, { amount: 1 }]);
    await table.requestUpdate();
    const type = table.getFieldType('amount');
    expect(type).toBeInstanceOf(FieldType);
    for (const record of table.allRecords) expect(record.fieldTypeForField('amount')).toBe(type);
    table.appendRecord();
    expect(table.allRecords[2].getField('amount')).toBe(3);
    expect(finalize).toHaveBeenCalledTimes(1);
    const copy = table.clone();
    expect(copy.getFieldType('amount')).toBeInstanceOf(FieldType);
    expect(copy.getFieldType('amount')).not.toBe(type);
    expect(copy.getFieldType('amount').compare(1, 2)).toBeLessThan(0);
});

it('isolates option caches and result text across finalizations and specializations', async () => {
    const fetch = jest.fn(() => [{ text: 'Ada', value: 'ada' }]);
    const builder = string.options({ fetch });
    const record = new Record({}, {});
    const first = builder.valueOf();
    await first.options();
    await first.options();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(first.format('ada', record)).toBe('Ada');

    const second = builder.valueOf();
    const derived = FieldTypeBuilder.from(first).label('Owner').valueOf();
    expect(second.format('ada', record)).toBe('ada');
    expect(derived.format('ada', record)).toBe('ada');
    await second.options();
    await derived.options();
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(first.label()).toBe('');
    expect(derived.label()).toBe('Owner');
});

it('keeps builder caches independent when reused across records', async () => {
    const fetch = jest.fn(() => [{ text: 'Yes', value: 'yes' }]);
    const fields = { choice: string.options({ fetch }) };
    const first = new Record(fields, { choice: 'yes' });
    const second = new Record(fields, { choice: 'yes' });
    await first.fieldTypeForField('choice').options(first);
    expect(second.print('choice')).toBe('yes');
    await second.fieldTypeForField('choice').options(second);
    expect(first.print('choice')).toBe('Yes');
    expect(second.print('choice')).toBe('Yes');
    expect(fetch).toHaveBeenCalledTimes(2);
});

it('exports typed builder primitives and removes sentence aliases', () => {
    for (const primitive of [string, number, boolean, date]) {
        expect(primitive).toBeInstanceOf(FieldTypeBuilder);
        expect(primitive.valueOf()).toBeInstanceOf(FieldType);
        for (const alias of ['with', 'and', 'thatIs', 'thatHas', 'andIs', 'as', 'thatWill', 'thatUses', 'that']) {
            expect(primitive).not.toHaveProperty(alias);
            expect(primitive.valueOf()).not.toHaveProperty(alias);
        }
    }
});

// Compile public type contracts without running intentionally invalid calls.
function checkDefinitionTypes() {
    const builder: FieldTypeBuilder<number> = number.required().parser(Number);
    const type: FieldType<number> = builder.valueOf();
    const derived: FieldTypeBuilder<number> = FieldTypeBuilder.from(type).required();
    const inferred = FieldTypeBuilder.from(type).required();
    inferred.compareFunction((a, b) => a - b);
    // @ts-expect-error Finalized types retain their model type when converted back to builders.
    inferred.parser(() => 'wrong type');
    const definition: FieldDefinition<number> = derived;
    new Record({ amount: definition, finalized: type }, { amount: 1, finalized: 2 });
    new Recordset({ amount: definition }, [{ amount: 1 }]);
    // @ts-expect-error Modifiers retain the primitive's numeric value type throughout the chain.
    number.required().formatter(value => value.toUpperCase());
    // @ts-expect-error String primitives keep string comparator arguments.
    string.required().compareFunction((a, b) => a - b);
    // @ts-expect-error Runtime methods are available after finalization.
    builder.format(1);
    // @ts-expect-error Finalized field types have no sentence-style builder entry point.
    type.with.required();
}


it('exports a reusable field instance without exposing the builder constructor', () => {
    expect(publicApi).not.toHaveProperty('FieldTypeBuilder');
    expect(field).toBeInstanceOf(FieldTypeBuilder);
    const name = field.label('Name');
    const requiredName = name.required();
    const nickname = name.label('Nickname');
    const person = new Record({ plain: field, name: requiredName, nickname },
        { plain: '', name: '', nickname: '' });

    expect(person.isValid('plain')).toBe(true);
    expect(person.isValid('name')).toBe(false);
    expect(person.isValid('nickname')).toBe(true);
    expect(person.fieldTypeForField('name').label()).toBe('Name');
    expect(person.fieldTypeForField('nickname').label()).toBe('Nickname');
    person.setField('name', 'Ada');
    expect(person.isValid()).toBe(true);

    const other = new Record({ name, plain: field }, { name: '', plain: '' });
    expect(other.isValid()).toBe(true);
    expect(other.fieldTypeForField('plain').label()).toBe('');
});

it('uses custom field chains directly in recordsets and added fields', async () => {
    const amount: FieldDefinition<number> = field.parser(Number).defaultValue(0)
        .validator({ name: 'positive', validate: value => value > 0 });
    const table = new Recordset({ amount }, [{ amount: 2 }, { amount: -1 }]);
    await table.requestUpdate();
    expect(table.allRecords[0].isValid()).toBe(true);
    expect(table.allRecords[1].isValid()).toBe(false);
    const record = new Record({}, {});
    record.addField('amount', amount, 3);
    expect(record.isValid()).toBe(true);
    expect(record.fieldTypeForField('amount').parse('4')).toBe(4);
});
