# Field types

A `FieldType` describes how a value is displayed, parsed, validated, and
presented. Field types are immutable: every modifier returns a new definition,
so a shared type can be extended safely for a single use.

```js
import { FieldType } from 'digital-fdl';

const number = new FieldType().with
  .validator({
    name: 'numeric',
    validate: value => Number.isFinite(Number(value)),
  })
  .and.cellClass('numeric')
  .and.cellClass(value => value < 0 ? 'negative' : []);

const money = number.with
  .formatter(formatUsd)
  .and.parser(parseUsd)
  .and.minColumnWidth(50)
  .and.targetColumnWidth(80)
  .and.maxColumnWidth(200);
```

`with`, `and`, and the other sentence-style aliases (`thatIs`, `thatHas`, and
so on) are interchangeable builder entry points. They do not mutate the
original field type.

## Value transforms and validation

`formatter(fn)` transforms values for display. Formatters run in the order they
are added. `parser(fn)` transforms input before it is stored; parsers also run
in order. When a field accepts formatted input, pair its formatter with an
appropriate parser.

```js
const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatUsd(value) {
  return currency.format(value);
}

function parseUsd(value) {
  return Number(value.replace(/[$,]/g, ''));
}
```

`validator()` accepts an object with a `name` and `validate` function. The
function receives `(modelValue, viewValue, record, options, field)` and returns
either `true`/`false` or a promise of `true`/`false`.

```js
const positiveNumber = number.with.validator({
  name: 'positive',
  validate: value => value > 0,
});
```

Synchronous validation is available through `FieldType.validate()` and
`Record#isValid()`. For a field type containing an asynchronous validator, use
`FieldType.validateAsync()`, `Record#isValidAsync()`, or the corresponding
`Field` methods.

`minLength(n)`, `maxLength(n)`, `required(predicate?)`, and
`emptyWhen(predicate)` add common validation behavior. Predicates receive the
current `Record` unless the modifier states otherwise.

## Form behavior

FDL describes reusable field behavior; it does not guarantee accessible markup
or choose a component system. The current Lit/native example interprets some
legacy renderer-oriented metadata for compatibility. See the
[adapter contract](./adapter-contract.md) before mapping these values into a
design system or another framework.

Use the following modifiers to describe input controls:

| Modifier | Purpose |
| --- | --- |
| `tag(name)` / `type(name)` | Choose the child element and native input type. |
| `label(value)` | Set a string label or compute one from the record. |
| `placeholder(value)`, `autocomplete(value)`, `autofocus()` | Configure common input attributes. |
| `defaultValue(value)` | Provide the value used by `Record#clear()` and new records. |
| `disabled(predicate)`, `readOnlyWhen(predicate)`, `visibleWhen(predicate)` | Set conditional state. Use `disabled()` or `readOnly()` for an unconditional state. |
| `multipleValues(min, max)` | Model the field as an array of values. |
| `options(config)` | Provide options for a select-like control. |

For a native dropdown, use `tag('select')` and option objects with `text` and
`value` properties:

```js
const contactMethod = new FieldType().with
  .tag('select')
  .and.label('Preferred contact method')
  .and.options([
    { text: 'Choose a method', value: '' },
    { text: 'Email', value: 'email' },
    { text: 'Phone', value: 'phone' },
  ]);
```

`options()` can also receive a regular function or an async function. Both
receive the current record:

```js
const localAssignee = new FieldType()
  .with.options(record => directory[record.getField('department')]);

const remoteAssignee = new FieldType()
  .with.options(async record => {
    const response = await fetch(`/assignees?department=${encodeURIComponent(record.getField('department'))}`);
    return response.json();
  });
```

If the selected value exists in both the old and new option lists, it remains
selected. Refreshing choices does not reset the record value. When a value is
absent from the new list, the application decides whether to clear it.

`options()` also accepts `{ data, text, value, compareFunction, filter, fields
}` or `{ fetch, ... }`. `fetch` receives the current record and may return an
array or a promise. `fields` limits cache invalidation to the listed record
fields.

```js
const users = new FieldType().with.options({
  fetch: record => userService.fetchUsers(record.getField('companyId')),
  fields: ['companyId'],
  text: user => user.name,
  value: user => user.id,
});
```

## Table behavior

For tables, use `compareFunction(fn)` to define how a column's values are
ordered. The table uses that comparator when its sort state includes the
column:

```js
import { FieldType, Recordset } from 'digital-fdl';

const fields = {
  name: new FieldType().with.compareFunction((a, b) => a.localeCompare(b)),
};

const people = new Recordset(fields, [
  { name: 'Zulu' },
  { name: 'Alpha' },
  { name: 'Mike' },
]);

people.sortColumns = [{ field: 'name', sort: 'ascending' }];
// A table bound to people renders: Alpha, Mike, Zulu
```

Use `cellClass(classes)` for cell CSS classes and `rowClass(classes)` for
classes on the containing row. Both accept a string, an array, or a function
returning either. The column-width modifiers shown in the first example
provide sizing guidance.
`template(fn)` customizes the printed representation; it can return a Lit
template for rich cell content.

Use `filter()` to make a table column filterable with case-insensitive text
matching. Pass a matcher when the field needs different behavior; it receives
the entered text and each candidate value. The table combines active column
filters with AND semantics and preserves any predicate already assigned to the
`Recordset`.

```js
const fields = {
  name: new FieldType().with.filter(),
  accountCode: new FieldType().with.filter((text, value) =>
    value.toLowerCase().startsWith(text.toLowerCase())
  ),
};
```

## Other modifiers

Additional modifiers include `hashFunction(fn)` for matching object-valued options,
`onValueChange(fn)` for reactions to value changes, and
`search(config)` for search-capable option controls. `schema(name)` is retained
for compatibility and should be avoided in new code.

Custom Lit field controls should extend [`FormElement`](./form-element.md),
which applies a field type's form-related modifiers to its child control.

## Removed sample-data modifier

`exampleValue()` was removed on 2026-10-15. Keep fixtures and sample-data
factories in application or test code, separate from field definitions.
For generated demo rows, pass a row factory to
[`ExampleRecordset`](./recordset.md#examplerecordset).

## Input character masks

`inputMask(regex)` accepts only input characters matching the regular expression;
other characters are ignored. The native form adapter applies the mask to typing,
pasted text, and completed text composition before parsing and storing the value.
For example, `inputMask(/[0-9.]/)` accepts digits and periods.

A character mask is not whole-value validation: multiple periods still match
that mask. Use `validator(...)` for complete-value rules. Programmatic record
assignments bypass input filtering.

## Removed focus-selection modifier

`selectOnFocus()` was removed on 2026-10-15. Text selection on focus belongs to
components and form adapters. Remove `.selectOnFocus()` from field definitions
and, where needed, handle focus and select the input's text in the component.
There is no replacement FDL modifier.

## Removed toggle-presentation modifier

`toggle()` was removed on 2026-10-15. Remove `.toggle()` from field definitions
and choose checkbox or switch presentation in the component or form adapter.
The component owns labeling, keyboard interaction, and accessible checked state.
There is no replacement FDL modifier.

## Deprecated textarea sizing modifier

`rowCount(rows)` is deprecated. Textarea sizing is a presentation concern and
row-count configuration needs to move into `fdl-field`, separate from the field
model. The existing modifier and adapter behavior remain available for
compatibility while that component configuration is introduced.

## Consolidated cell classes

`cellClass(classes)` and `rowClass(classes)` each add classes, one declaration
at a time. Supply a class name, an array of class names, or a function returning
either. Both callbacks receive the field value and containing FDL record.
Return `[]` when no classes apply. Repeated calls accumulate in declaration
order without changing the source definition.

```ts
const status = new FieldType<string>()
  .with.cellClass('status-cell')
  .and.cellClass(value => value === 'Disputed' ? ['warning', 'needs-review'] : [])
  .and.rowClass('invoice-row')
  .and.rowClass(value => value === 'Disputed' ? 'disputed-row' : []);
```

The supported cell-class signatures are:

```ts
cellClass(className: string)
cellClass(classNames: string[])
cellClass(classes: (value: T, record: Record<any>) => string | string[])
```

The value type `T` comes from the field type. The callback can read other
fields through `record.getField(name)`, for example:

```ts
const amount = new FieldType<number>()
  .with.cellClass((value, record) =>
    value > record.getField('limit') ? ['warning', 'over-limit'] : []);
```

The old two-argument predicate form is no longer supported. Replace
`cellClass(predicate, classes)` with
`cellClass((value, record) => predicate(value) ? classes : [])`.

`rowClasses(fn)` was renamed to `rowClass(fn)` on 2026-10-15. Rename modifier
calls to the singular form; callbacks can continue returning arrays. Consumer
methods `fieldType.cellClasses(value, record)` and
`fieldType.rowClasses(value, record)` still return the accumulated arrays.

`conditionalCellClass(predicate, className)` was removed on 2026-10-15. Rename
those calls to `cellClass(value => predicate(value) ? className : [])`.

## Consolidated required and disabled rules

`required()` always requires a non-empty value; `required(predicate)` requires
one only when the record predicate returns true. `disabled()` always disables
a field; `disabled(predicate)` disables it only while the predicate is true.
Multiple declarations accumulate: any true predicate enables that state.
Calling either modifier without a predicate adds an unconditional rule.

`requiredWhen(predicate)` and `disabledWhen(predicate)` were removed on
2026-10-15. Rename those calls to `required(predicate)` and
`disabled(predicate)` respectively; their predicate arguments and behavior
remain the same. Conditional requiredness continues to affect model validation
as well as the control's required state. Disabled fields retain their values.
