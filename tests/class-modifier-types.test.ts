import { FieldType, Record } from '../index';

// Compile this contract with typecheck without evaluating intentionally invalid calls.
function checkClassModifierTypes(modifier: 'cellClass' | 'rowClass') {
    const field = new FieldType<number>();
    field.with[modifier]('amount');
    field.with[modifier](['amount', 'numeric']);
    field.with[modifier]((value, record) => {
        const amount: number = value;
        const owner: Record<any> = record;
        return amount > owner.getField('limit') ? ['warning', 'over-limit'] : [];
    });
    field.with[modifier]((value, record: Record<{ limit: number }>) =>
        value > record.values.limit ? 'warning' : []);
    // @ts-expect-error A callback must return a class name or names.
    field.with[modifier](value => value > 100);
    // @ts-expect-error A separate predicate plus class name argument is not supported.
    field.with[modifier](value => value > 100, 'warning');
    // @ts-expect-error Class name arrays contain only strings.
    field.with[modifier](['amount', 123]);
    // @ts-expect-error The callback value retains the field's number type.
    field.with[modifier]((value: string) => value);
}

it.each(['cellClass', 'rowClass'] as const)('%s accepts a typed record callback returning a class name', modifier => {
    const record = new Record({ limit: new FieldType<number>() }, { limit: 100 });
    const field = new FieldType<number>().with[modifier]((value, owner: Record<{ limit: number }>) =>
        value > owner.values.limit ? 'warning' : []);
    const getter = modifier === 'cellClass' ? 'cellClasses' : 'rowClasses';
    expect(field[getter](150, record)).toEqual(['warning']);
    expect(field[getter](50, record)).toEqual([]);
});
