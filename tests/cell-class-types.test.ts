import { FieldType, Record } from '../index';

// Compile this contract with typecheck without evaluating intentionally invalid calls.
function checkCellClassTypes() {
    const field = new FieldType<number>();
    field.with.cellClass('amount');
    field.with.cellClass(['amount', 'numeric']);
    field.with.cellClass((value, record) => {
        const amount: number = value;
        const owner: Record<any> = record;
        return amount > owner.getField('limit') ? ['warning', 'over-limit'] : [];
    });
    field.with.cellClass((value, record: Record<{ limit: number }>) =>
        value > record.values.limit ? 'warning' : []);
    // @ts-expect-error A callback must return a class name or names.
    field.with.cellClass(value => value > 100);
    // @ts-expect-error The old predicate plus class name signature is removed.
    field.with.cellClass(value => value > 100, 'warning');
    // @ts-expect-error Class name arrays contain only strings.
    field.with.cellClass(['amount', 123]);
    // @ts-expect-error The callback value retains the field's number type.
    field.with.cellClass((value: string) => value);
}

it('accepts a typed record callback returning a class name', () => {
    const record = new Record({ limit: new FieldType<number>() }, { limit: 100 });
    const field = new FieldType<number>().with.cellClass((value, owner: Record<{ limit: number }>) =>
        value > owner.values.limit ? 'warning' : []);
    expect(field.cellClasses(150, record)).toEqual(['warning']);
    expect(field.cellClasses(50, record)).toEqual([]);
});
