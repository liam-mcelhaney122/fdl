import FieldTypeBuilder from '../field-type-builder';
import { Record } from '../index';

// Compile this contract with typecheck without evaluating intentionally invalid calls.
function checkClassModifierTypes(modifier: 'cellClass' | 'rowClass') {
    const field = new FieldTypeBuilder<number>();
    field[modifier]('amount');
    field[modifier](['amount', 'numeric']);
    field[modifier]((value, record) => {
        const amount: number = value;
        const owner: Record<any> = record;
        return amount > owner.getField('limit') ? ['warning', 'over-limit'] : [];
    });
    field[modifier]((value, record: Record<{ limit: number }>) =>
        value > record.values.limit ? 'warning' : []);
    // @ts-expect-error A callback must return a class name or names.
    field[modifier](value => value > 100);
    // @ts-expect-error A separate predicate plus class name argument is not supported.
    field[modifier](value => value > 100, 'warning');
    // @ts-expect-error Class name arrays contain only strings.
    field[modifier](['amount', 123]);
    // @ts-expect-error The callback value retains the field's number type.
    field[modifier]((value: string) => value);
}

it.each(['cellClass', 'rowClass'] as const)('%s accepts a typed record callback returning a class name', modifier => {
    const record = new Record({ limit: new FieldTypeBuilder<number>() }, { limit: 100 });
    const field = new FieldTypeBuilder<number>()[modifier]((value, owner: Record<{ limit: number }>) =>
        value > owner.values.limit ? 'warning' : []);
    const getter = modifier === 'cellClass' ? 'cellClasses' : 'rowClasses';
    expect(field.valueOf()[getter](150, record)).toEqual(['warning']);
    expect(field.valueOf()[getter](50, record)).toEqual([]);
});
