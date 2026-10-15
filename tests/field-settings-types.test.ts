import FieldTypeBuilder from '../field-type-builder';
import { Record } from '../index';
import type { FieldSetting, ColumnSetting, DefaultSetting } from '../index';

function checkSettings() {
    const label: FieldSetting<number, string, { unit: string }> = (value, record, context) =>
        `${context}:${value}:${record.values.unit}`;
    const field = new FieldTypeBuilder<number>();
    field.label(label).placeholder((value, record, context) =>
        `${value}:${record.getField('unit')}:${context}`);
    field.required(true).disabled(false).readOnly(false).visibleWhen(true).emptyWhen(false);
    field.textAlign((value, _record, context) => value < 0 && context === 'table' ? 'right' : 'left');
    field.minLength((_value, record) => record.getField('minimum')).maxLength(10);
    const factory: DefaultSetting<number, { default: number }> = (record, context) =>
        context === 'model' ? record.values.default : 0;
    field.defaultValue(factory);
    field.type((_value, _record, context) => context === 'form' ? 'number' : 'text');
    const column: ColumnSetting<number> = context => context === 'table' ? 100 : 200;
    field.minColumnWidth(column).maxColumnWidth(column).targetColumnWidth(column);
    field.sortable(context => context === 'table');
    field.compareFunction((a, b) => a - b);
    field.filter((query, value) => value === Number(query));
    field.reducer(values => values.reduce((a, b) => a + b, 0));
    field.parser((input, record, context) => Number(input) + record.getField(context));
    field.formatter((value, record, context) => `${value}:${context}:${record.getField('unit')}`);
    // @ts-expect-error Label callbacks receive the value first, not the record.
    field.label(value => value.getField('unit'));
    // @ts-expect-error Alignment callbacks must return an accepted direction.
    field.textAlign(() => 'diagonal');
    // @ts-expect-error State settings return booleans.
    field.required(() => 'yes');
    // @ts-expect-error Length settings return numbers.
    field.minLength(() => 'three');
    // @ts-expect-error Default callbacks return the field's model type.
    field.defaultValue(() => 'zero');
    // @ts-expect-error Column callbacks accept only context, without placeholder arguments.
    field.sortable((_value: undefined, _record: undefined, context: string) => true);
    // @ts-expect-error Default factories accept record and context, without a value argument.
    field.defaultValue((_value: number, record: Record<any>, context: string) => 0);
    // @ts-expect-error The first column callback argument is the context string.
    field.minColumnWidth((record: Record<any>) => 100);
    // @ts-expect-error Parsers produce the declared model type.
    field.parser(() => 'one');
    // @ts-expect-error Comparator operands retain the numeric field type.
    field.compareFunction((a, b) => a.localeCompare(b));
    // @ts-expect-error Filters retain the numeric field type.
    field.filter((query, value) => value.startsWith(query));
}

it('accepts a declared FieldSetting with a typed record', () => {
    const label: FieldSetting<number, string, { unit: string }> = (value, record, context) =>
        `${context}:${value}:${record.values.unit}`;
    const record = new Record({ unit: new FieldTypeBuilder<string>() }, { unit: 'USD' });
    expect(new FieldTypeBuilder<number>().label(label).valueOf().label(10, record, 'form')).toBe('form:10:USD');
});
