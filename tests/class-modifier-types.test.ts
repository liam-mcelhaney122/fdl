import FieldTypeBuilder from '../field-type-builder';
import { Record } from '../index';

function checkClassModifierTypes() {
    const field = new FieldTypeBuilder<number>();
    field.cellClass((value, record) => (value > record.getField('limit') ? 'warning' : []));
    field.rowClass((record: Record<{ limit: number }>) =>
        record.values.limit > 100 ? 'warning' : []
    );
    field.rowClass('amount').rowClass(['numeric']);
    field
        .columnClass('amount')
        .columnClass(['numeric'])
        .columnClass(() => ['currency']);
    // @ts-expect-error Column callbacks take no context.
    field.columnClass((context: string) => context);
    // @ts-expect-error Column callbacks have no owning record.
    field.columnClass((record: Record<any>) => 'amount');
    // @ts-expect-error Column class arrays contain only strings.
    field.columnClass(['amount', 123]);
    // @ts-expect-error Column callbacks return class names.
    field.columnClass(() => false);
    // @ts-expect-error Cell callbacks receive value and record without context.
    field.cellClass((value: number, record: Record<any>, context: string) => 'amount');
    // @ts-expect-error Row callbacks receive only a record.
    field.rowClass((value: number, record: Record<any>) => 'warning');
    // @ts-expect-error Row callbacks receive a record, not a field value.
    field.rowClass((value: number) => 'warning');
    // @ts-expect-error Class name arrays contain only strings.
    field.rowClass(['amount', 123]);
    // @ts-expect-error A callback must return class names.
    field.cellClass(value => value > 100);
    // @ts-expect-error Cell callbacks retain the model value type.
    field.cellClass((value: string) => value);
}

it('resolves row classes from a typed record without a field value', () => {
    const record = new Record({ limit: new FieldTypeBuilder<number>() }, { limit: 150 });
    const field = new FieldTypeBuilder<number>().rowClass((owner: Record<{ limit: number }>) =>
        owner.values.limit > 100 ? 'warning' : []
    );
    expect(field.valueOf().rowClasses(record)).toEqual(['warning']);
    record.setField('limit', 50);
    expect(field.valueOf().rowClasses(record)).toEqual([]);
});
