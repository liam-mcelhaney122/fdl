import FieldTypeBuilder from '../field-type-builder';
import { Record } from '../index';
import type { RecordSetting, ColumnSetting, DefaultSetting } from '../index';

function checkSettings() {
    const label: RecordSetting<string, { unit: string }> = record => record.values.unit;
    const field = new FieldTypeBuilder<number>();
    field.label(label).placeholder(record => record.getField('unit'));
    field.required(true).disabled(false).readOnly(false).visible(true).emptyWhen(false);
    field.textAlign((value, _record, context) =>
        value < 0 && context === 'table' ? 'right' : 'left'
    );
    field.minLength(record => record.getField('minimum')).maxLength(10);
    const factory: DefaultSetting<number, { default: number }> = record => record.values.default;
    field.defaultValue(factory);
    field.type(record => (record.getField('numeric') ? 'number' : 'text'));
    const column: ColumnSetting<number> = () => 100;
    field.minColumnWidth(column).maxColumnWidth(column).targetColumnWidth(column);
    field.sortable(() => true);
    field.compareFunction((a, b) => a - b);
    field.filter((query, value) => value === Number(query));
    field.reducer(values => values.reduce((a, b) => a + b, 0));
    field.parser((input, record, context) => Number(input) + record.getField(context));
    field.formatter((value, record, context) => `${value}:${context}:${record.getField('unit')}`);
    // @ts-expect-error Label callbacks receive only a record.
    field.label((value: number, record: Record<any>) => 'label');
    // @ts-expect-error Alignment callbacks must return an accepted direction.
    field.textAlign(() => 'diagonal');
    // @ts-expect-error State settings return booleans.
    field.required(() => 'yes');
    // @ts-expect-error Length settings return numbers.
    field.minLength(() => 'three');
    // @ts-expect-error Default callbacks return the field's model type.
    field.defaultValue(() => 'zero');
    // @ts-expect-error Column callbacks accept no arguments.
    field.sortable((_value: undefined, _record: undefined, context: string) => true);
    // @ts-expect-error Column callbacks do not receive context.
    field.sortable((context: string) => true);
    // @ts-expect-error Column width callbacks do not receive context.
    field.maxColumnWidth((context: string) => 100);
    // @ts-expect-error Preferred-width callbacks do not receive context.
    field.targetColumnWidth((context: string) => 100);
    // @ts-expect-error Column getters accept no context.
    field.valueOf().minColumnWidth('table');
    // @ts-expect-error Default factories accept only a record.
    field.defaultValue((_value: number, record: Record<any>, context: string) => 0);
    // @ts-expect-error Column callbacks do not receive a record.
    field.minColumnWidth((record: Record<any>) => 100);
    // @ts-expect-error Empty predicates receive value and record, without a display context.
    field.emptyWhen((value: number, record: Record<any>, context: string) => true);
    // @ts-expect-error Parsers produce the declared model type.
    field.parser(() => 'one');
    // @ts-expect-error Comparator operands retain the numeric field type.
    field.compareFunction((a, b) => a.localeCompare(b));
    // @ts-expect-error Filters retain the numeric field type.
    field.filter((query, value) => value.startsWith(query));
}

it('accepts a declared RecordSetting with a typed record', () => {
    const label: RecordSetting<string, { unit: string }> = record => record.values.unit;
    const record = new Record({ unit: new FieldTypeBuilder<string>() }, { unit: 'USD' });
    expect(new FieldTypeBuilder<number>().label(label).valueOf().label(10, record, 'form')).toBe(
        'USD'
    );
});
