# Field types

Start a custom field definition with the exported `field` instance and chain
modifiers directly. Each modifier returns a new definition without changing its
source. The exported `string`, `number`, `boolean`, and `date` primitives are
reusable starting points with type-specific defaults.

```js
import { field } from 'digital-fdl';

const number = field
  .validator({
    name: 'numeric',
    validate: value => Number.isFinite(Number(value)),
  })
  .cellClass('numeric')
  .cellClass(value => value < 0 ? 'negative' : []);

const money = number
  .formatter(formatUsd)
  .parser(parseUsd)
  .minColumnWidth(50)
  .targetColumnWidth(80)
  .maxColumnWidth(200);
```

## Definitions and runtime behavior

Pass definitions directly to `Record`, `Recordset`, and `Record#addField()`.
They prepare runtime behavior automatically. The exported `FieldDefinition<T>`
type describes an accepted field definition.

```ts
import { field, Record } from 'digital-fdl';

const name = field.maxLength(100);
const requiredName = name.required(); // name stays optional
const person = new Record({ name: requiredName }, { name: '' });
person.isValid(); // false

// Inspect behavior through the record.
const nameType = person.fieldTypeForField('name');
nameType.required(); // true
nameType.format('Ada', person); // 'Ada'

// Specialize the reusable definition for another use.
const displayName = name.label('Display name');
```

A record keeps its runtime field types, including option caches and display
results. A recordset shares its runtime field types with its rows. Use
`record.fieldTypeForField(name)` or `recordset.getFieldType(name)` when you need
to inspect or invoke that behavior directly.

### Migrating direct chains

Remove sentence-style aliases (`with`, `and`, `thatIs`, `thatHas`, `andIs`,
`as`, `thatWill`, `thatUses`, and `that`). Start custom definitions with `field`
and chain modifiers directly. Pass the result to a record or recordset.
For example, `field.required()` defines a required field; use the record to
validate its value or inspect its required state. Keep reusable definitions
when you need to specialize them later.

This is a breaking API change; the sentence-style aliases and public builder
constructor export have been removed.

## Fixed and calculated settings

A field setting accepts its result directly or a synchronous callback with the
same three arguments:

```ts
import type { Record, FieldSetting, ColumnSetting, DefaultSetting } from 'digital-fdl';

// T is the stored field type; R is the record's backing-data type.
type Setting<T, Result, R = any> =
  | Result
  | ((value: T, record: Record<R>, context: string) => Result);
```

The exported `FieldSetting<T, Result, R>` type expresses this contract. Callback
parameters may be omitted when unused. `value` is the current stored value,
`record` is its owning FDL record, and `context` identifies the consumer. Settings
are resolved when read, so changes to another field are reflected on the next
read. Callbacks should be pure; they must not mutate the record or render UI.

| Field setting | Result |
| --- | --- |
| `label`, `placeholder` | `string` |
| `cellClass`, `rowClass` | `string` or `string[]` |
| `textAlign` | `'left'`, `'center'`, or `'right'` |
| `type` | A supported input type |
| `required`, `disabled`, `readOnly`, `readOnlyWhen`, `visibleWhen`, `emptyWhen` | `boolean` |
| `minLength`, `maxLength` | `number` |

```ts
const amount = field
  .label((_value, _record, context) =>
    context === 'table-header' ? 'Amount' : 'Invoice amount')
  .placeholder('Enter an amount')
  .required((_value, record) => record.getField('submitted'))
  .cellClass((value, record) =>
    value > record.getField('limit') ? ['numeric', 'over-limit'] : 'numeric');
```

The form adapter passes `"form"` for labels, placeholders, and input types. The
table passes `"table"` for cell and row classes and cell alignment, and
`"table-header"` for heading labels and alignment. For compatibility with
existing heading behavior, a non-empty table uses its first visible record for
these header settings. On an empty table, it uses an explicit column label or
the last fixed field label (then the field name), and fixed alignment or left
alignment; per-record callbacks are not invoked.

Model rules, including requiredness, emptiness, visibility, disabled/read-only
state, and length constraints, use `"model"` in the form adapter. Model validation
also uses `"model"` and evaluates the candidate being validated, which may differ
from the stored value. This keeps validation and the control's model state in
agreement. Direct getter calls default to `"model"`; callers can supply their own
string context for display settings.

Direct setting getters now take `(value, record, context?)`, for example
`fieldType.label(record.getField('amount'), record, 'form')` and
`fieldType.required(record.getField('amount'), record)`. Supply the owning record
when invoking a per-record callback directly. The existing `empty(record, field)`
convenience method delegates to `isEmpty(value, record, context?)`.

`required()`, `disabled()`, and `readOnly()` mean `true`. Repeated state settings
keep their composition rules: required, disabled, read-only, and empty rules use
any-true semantics; visibility uses all-true semantics. A later `false` does not
cancel an earlier unconditional `true`. Cell and row classes accumulate in
order. Labels and other scalar settings use the last declaration. Length
validators accumulate, so every declared length constraint remains enforced.
Specialization never changes the source field definition.

### Primitive defaults and conversion

Primitives provide starting metadata, not automatic JavaScript type conversion.
`string` supplies an empty-string default, `boolean` supplies `false`, `number`
supplies `0` and a numeric character mask, and `date` supplies a `Date` captured
when the primitives module loads. For a fresh date whenever defaults are
resolved, specialize it with `date.defaultValue(() => new Date())`.

None of these primitives adds a parser or a type validator. Add `parser(...)`
and `validator(...)` for the stored values your application requires. A native
input's `type(...)` changes the control but does not add model conversion or
validation; for example, use `boolean.type('checkbox')` for a checkbox.

### Default factories

`defaultValue` accepts a fixed value or `DefaultSetting<T, R>`:

```ts
defaultValue(value: T | null)
defaultValue(factory: (record: Record<R>, context: string) => T | null)
```

A factory receives the owning record and context, without a meaningless missing
value argument. Existing non-null values are preserved without invoking it.
The model supplies `"model"` as context. The `Record` constructor keeps the
supplied backing values as they are, including `null`, `undefined`, and omitted
fields; it does not fill them from defaults. Defaults are resolved by
`Record#clear()`, `Recordset#appendRecord()`, and partial cloning for omitted
values. Supply an initial value for every declared field when constructing a
record. For example:

```ts
const reference = field
  .defaultValue((record, context) =>
    `${record.getField('prefix')}-${context}`);
```

Clearing a record evaluates all defaults against the same pre-clear record,
then replaces its values. Appending creates a record with undefined fields
before resolving its defaults. Factories should not depend on another default
having already run. Partial clones resolve defaults for omitted fields against
the source record before constructing the clone.

### Column settings

`sortable`, `minColumnWidth`, `maxColumnWidth`, and `targetColumnWidth` accept a
fixed result or `ColumnSetting<Result>`, a function of `(context: string)`
returning that result. The table supplies `"table"`; direct column getters
accept a context string. A column has no single field value or owning record,
so the callback has no value or record parameters.

```ts
const amount = field
  .minColumnWidth(context =>
    context === 'table' ? 100 : 60)
  .sortable(true);
```

### Operations and structural configuration

Operations keep the inputs needed to do their work. Formatters receive their
current pipeline value, record, and context; parsers receive incoming input,
record, and context; templates receive formatted output, record, and `"print"`.
Comparators receive two values and return a negative number, zero, or a positive
number. Filters receive search text and a field value. Reducers receive an
array of field values (or use the built-in `'sum'`). Validators retain
`(modelValue, viewValue, record, options, field)` and may return a promise.

Options providers retain their configuration/async loading and caching
contract. Search configuration, input masks, multiple-value bounds, and range
mode are structural or operational configuration rather than per-field result
settings. Deprecated renderer modifiers retain their existing contracts; this
change does not expand those APIs.

### Migrating callbacks

Record-first callbacks now receive the value first:

```ts
// Before
.label(record => record.getField('title'))
.required(record => record.getField('submitted'))

// After
.label((_value, record) => record.getField('title'))
.required((_value, record) => record.getField('submitted'))
```

Column callbacks previously used `(_value, _record, context) => result`; change
them to `context => result`. Default factories previously used
`(_value, record, context) => value`; change them to
`(record, context) => value`. The old three-argument forms are no longer part of
these five modifiers' contracts.

Label callbacks no longer receive a previous-label argument. Compute the full
label from `(value, record, context)`; the last label declaration wins.

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
const positiveNumber = number.validator({
  name: 'positive',
  validate: value => value > 0,
});
```

Synchronous validation is available through `FieldType.validate()` and
`Record#isValid()`. Both throw if a validator returns a promise; they do not
skip it or treat pending validation as success. For asynchronous validators,
use `FieldType.validateAsync()`, `Record#isValidAsync()`, or
`Record#errorsAsync()`. Rejections propagate to the caller.

The current `Field` facade reads synchronous validity during construction and
on record changes, and `FormElement` uses that facade. A field with async
validators therefore needs an application-specific integration using the
async `Record` APIs directly.

`minLength(n)`, `maxLength(n)`, `required(predicate?)`, and
`emptyWhen(predicate)` add common validation behavior. Predicates receive the
candidate field value, owning `Record`, and `"model"` context.

## Form behavior

FDL describes reusable field behavior; it does not guarantee accessible markup
or choose a component system. The current Lit/native example interprets some
legacy renderer-oriented metadata for compatibility. See the
[adapter contract](./adapter-contract.md) before mapping these values into a
design system or another framework.

The current adapter interprets the following metadata. `tag`, `autocomplete`,
and `autofocus` are deprecated compatibility APIs; their configuration belongs
in the renderer (see [ADR-0001](./adr/0001-retire-post-jack-henry-modifiers.md)).

| Modifier | Purpose |
| --- | --- |
| `tag(name)` / `type(name)` | Choose the child element and native input type. |
| `label(value)` | Set a string label or compute one from the record. |
| `placeholder(value)`, `autocomplete(value)`, `autofocus()` | Configure common input attributes. |
| `defaultValue(valueOrFactory)` | Provide defaults for clearing a record, appending a row, and omitted values in a partial clone; constructor values are kept as supplied. |
| `disabled(predicate)`, `readOnlyWhen(predicate)`, `visibleWhen(predicate)` | Set conditional state. Use `disabled()` or `readOnly()` for an unconditional state. |
| `multipleValues(min, max)` | Declare multiple-value metadata. The native select adapter stores arrays; the declared count bounds do not add validators. |
| `options(config)` | Provide options for a select-like control. |

For a native dropdown, use `tag('select')` and option objects with `text` and
`value` properties:

```js
const contactMethod = field
  .tag('select')
  .label('Preferred contact method')
  .options([
    { text: 'Choose a method', value: '' },
    { text: 'Email', value: 'email' },
    { text: 'Phone', value: 'phone' },
  ]);
```

`options()` can also receive a regular function or an async function. Both
receive the current record:

```js
const localAssignee = field
  .options(record => directory[record.getField('department')]);

const remoteAssignee = field
  .options(async record => {
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
const users = field.options({
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
import { field, Recordset } from 'digital-fdl';

const fields = {
  name: field.compareFunction((a, b) => a.localeCompare(b)),
};

const people = new Recordset(fields, [
  { name: 'Zulu' },
  { name: 'Alpha' },
  { name: 'Mike' },
]);

await people.requestHardUpdate();
people.sortColumns = [{ field: 'name', sort: 'ascending' }];
await people.updating;
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
  name: field.filter(),
  accountCode: field.filter((text, value) =>
    value.toLowerCase().startsWith(text.toLowerCase())
  ),
};
```

## Other modifiers

Additional modifiers include `hashFunction(fn)` for matching object-valued
options and `search(config)` for search-capable option controls. `schema(name)` and
`onValueChange(fn)` are deprecated compatibility APIs. The current adapter
invokes `onValueChange` after control edits; `Record#setField()` does not invoke
it. Keep cross-field orchestration in the record or application model.

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
const status = field
  .cellClass('status-cell')
  .cellClass(value => value === 'Disputed' ? ['warning', 'needs-review'] : [])
  .rowClass('invoice-row')
  .rowClass(value => value === 'Disputed' ? 'disputed-row' : []);
```

The supported cell and row class signatures are:

```ts
cellClass(className: string)
cellClass(classNames: string[])
cellClass(classes: (value: T, record: Record<any>, context: string) => string | string[])

rowClass(className: string)
rowClass(classNames: string[])
rowClass(classes: (value: T, record: Record<any>, context: string) => string | string[])
```

The value type `T` comes from the field type. The callback can read other
fields through `record.getField(name)`, for example:

```ts
const amount = field
  .cellClass((value, record) =>
    value > record.getField('limit') ? ['warning', 'over-limit'] : [])
  .rowClass((value, record) =>
    value > record.getField('limit') ? 'over-limit-row' : []);
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
one only when the field setting resolves to true. `disabled()` always disables
a field; `disabled(predicate)` disables it only while the predicate is true.
Multiple declarations accumulate: any true predicate enables that state.
Calling either modifier without a predicate adds an unconditional rule.

`requiredWhen(predicate)` and `disabledWhen(predicate)` were removed on
2026-10-15. Rename those calls to `required(predicate)` and
`disabled(predicate)` respectively, and migrate record-first callbacks to
`(_value, record) => ...` as described above. Conditional requiredness continues to affect model validation
as well as the control's required state. Disabled fields retain their values.
