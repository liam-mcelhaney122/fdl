import { FieldType, Record } from '../index';
import type { FieldSetting, ColumnSetting } from '../index';

function checkSettings() {
    const label: FieldSetting<number, string, { unit: string }> = (value, record, context) =>
        `${context}:${value}:${record.values.unit}`;
    const field = new FieldType<number>();
    field.with.label(label).and.placeholder((value, record, context) =>
        `${value}:${record.getField('unit')}:${context}`);
    field.with.required(true).and.disabled(false).and.readOnly(false).and.visibleWhen(true).and.emptyWhen(false);
    field.with.textAlign((value, _record, context) => value < 0 && context === 'table' ? 'right' : 'left');
    field.with.minLength((_value, record) => record.getField('minimum')).and.maxLength(10);
    field.with.defaultValue((value, record) => value ?? record.getField('default'));
    field.with.type((_value, _record, context) => context === 'form' ? 'number' : 'text');
    const column: ColumnSetting<number> = (value, record, context) => {
        const noValue: undefined = value;
        const noRecord: undefined = record;
        return context === 'table' && noValue === noRecord ? 100 : 200;
    };
    field.with.minColumnWidth(column).and.maxColumnWidth(column).and.targetColumnWidth(column);
    field.with.sortable((_value, _record, context) => context === 'table');
    field.with.compareFunction((a, b) => a - b);
    field.with.filter((query, value) => value === Number(query));
    field.with.reducer(values => values.reduce((a, b) => a + b, 0));
    field.with.parser((input, record, context) => Number(input) + record.getField(context));
    field.with.formatter((value, record, context) => `${value}:${context}:${record.getField('unit')}`);
    // @ts-expect-error Label callbacks receive the value first, not the record.
    field.with.label(value => value.getField('unit'));
    // @ts-expect-error Alignment callbacks must return an accepted direction.
    field.with.textAlign(() => 'diagonal');
    // @ts-expect-error State settings return booleans.
    field.with.required(() => 'yes');
    // @ts-expect-error Length settings return numbers.
    field.with.minLength(() => 'three');
    // @ts-expect-error Default callbacks return the field's model type.
    field.with.defaultValue(() => 'zero');
    // @ts-expect-error Column callbacks cannot assume an owning record.
    field.with.sortable((_value, record: Record<any>) => true);
    // @ts-expect-error Parsers produce the declared model type.
    field.with.parser(() => 'one');
    // @ts-expect-error Comparator operands retain the numeric field type.
    field.with.compareFunction((a, b) => a.localeCompare(b));
    // @ts-expect-error Filters retain the numeric field type.
    field.with.filter((query, value) => value.startsWith(query));
}

it('accepts a declared FieldSetting with a typed record', () => {
    const label: FieldSetting<number, string, { unit: string }> = (value, record, context) =>
        `${context}:${value}:${record.values.unit}`;
    const record = new Record({ unit: new FieldType<string>() }, { unit: 'USD' });
    expect(new FieldType<number>().with.label(label).label(10, record, 'form')).toBe('form:10:USD');
});
