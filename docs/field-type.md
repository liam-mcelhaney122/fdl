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
    .cellClass(value => (value < 0 ? 'negative' : []));

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

Settings accept a fixed result or a pure, synchronous callback. A callback's
inputs follow the scope of the setting:

| Modifiers                                                                                                                           | Callback                             | Exported setting type                         |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------- |
| `rowClass`, `label`, `placeholder`, `type`, `required`, `disabled`, `readOnly`, `readOnlyWhen`, `visible`, `minLength`, `maxLength` | `(record) => result`                 | `RecordSetting<Result, R>`                    |
| `defaultValue`                                                                                                                      | `(record) => value`                  | `DefaultSetting<T, R>`                        |
| `emptyWhen`, `cellClass`                                                                                                            | `(value, record) => result`          | `ValueSetting<T, Result, R>`                  |
| `columnClass`                                                                                                                       | `() => string or string[]`           | Fixed classes or a callback with no arguments |
| `textAlign`                                                                                                                         | `(value, record, context) => result` | `FieldSetting<T, Result, R>`                  |
| `sortable`, `minColumnWidth`, `maxColumnWidth`, `targetColumnWidth`                                                                 | `() => result`                       | `ColumnSetting<Result>`                       |

`T` is the stored field type and `R` is the record's backing-data type. Import
these types from `digital-fdl`. Record settings describe the record's state or
metadata. They can read a particular field with `record.getField(name)`.
`emptyWhen` needs the candidate value because validation can check a value
before storing it. Cell classes use their value and owning record. Alignment callbacks can also
use consumer context. A row has no single field value; its callback receives only
the record, even when the modifier is attached to a particular field.

```ts
const amount = field
    .label(record => `Amount for ${record.getField('customer')}`)
    .placeholder('Enter an amount')
    .required(record => record.getField('submitted'))
    .cellClass((value, record) =>
        value > record.getField('limit') ? ['numeric', 'over-limit'] : 'numeric'
    )
    .rowClass(record => (record.getField('overdue') ? 'overdue' : []));
```

Callbacks resolve on every read, so changes to dependencies appear on the next
read. They must not mutate the record or render UI. State and length callbacks
have no rendering context; model validation uses the same record rules as the
form. Emptiness checks additionally receive the candidate being validated.

The table passes `"table"` for cell alignment and `"table-header"`
for heading alignment. For a calculated heading label or alignment, a non-empty
table uses its first visible record. On an empty table, it uses an explicit
column label or the last fixed field label (then the field name), and fixed
alignment or left alignment; per-record callbacks are not invoked.

Most existing field-binding getters retain `(value, record, context?)`, for example
`fieldType.label(record.getField('amount'), record, 'form')` and
`fieldType.required(record.getField('amount'), record)`. Record-setting getters
forward only the record to their callbacks. `fieldType.rowClasses(record)`
takes only the record. `fieldType.cellClasses(value, record)` takes no context,
and `fieldType.columnClasses()` takes no arguments. `empty(record, field)` delegates to
`isEmpty(value, record, context?)`, whose callback receives only value and record.

`required()`, `disabled()`, and `readOnly()` mean `true`. Repeated state settings
keep their composition rules: required, disabled, read-only, and empty rules use
any-true semantics; visibility uses all-true semantics. A later `false` does not
cancel an earlier unconditional `true`. Cell, column, and row classes accumulate in
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
defaultValue(factory: (record: Record<R>) => T | null)
```

A factory receives only the owning record. Existing non-null values are preserved without invoking it.
The `Record` constructor keeps the
supplied backing values as they are, including `null`, `undefined`, and omitted
fields; it does not fill them from defaults. Defaults are resolved by
`Record#clear()`, `Recordset#appendRecord()`, and partial cloning for omitted
values. Supply an initial value for every declared field when constructing a
record. For example:

```ts
const reference = field.defaultValue(record => `${record.getField('prefix')}-draft`);
```

Clearing a record evaluates all defaults against the same pre-clear record,
then replaces its values. Appending creates a record with undefined fields
before resolving its defaults. Factories should not depend on another default
having already run. Partial clones resolve defaults for omitted fields against
the source record before constructing the clone.

### Column settings

`sortable`, `minColumnWidth`, `maxColumnWidth`, and `targetColumnWidth` accept a
fixed result or `ColumnSetting<Result>`, a callback with no arguments returning
that result. Neither callbacks nor the corresponding getters receive context,
a field value, or an owning record. Call `fieldType.sortable()`,
`fieldType.minColumnWidth()`, `fieldType.maxColumnWidth()`, and
`fieldType.targetColumnWidth()` directly.

Callbacks are resolved on each read and can close over application state.
To migrate, replace `context => result` with `() => result`, remove context
arguments from getter calls, and use separate field definitions for distinct
consumer policies.

```ts
const amount = field.minColumnWidth(() => 100).sortable(true);
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

Replace the former uniform `(value, record, context)` signature with the
contract in the table above. For example:

```ts
// Before
.rowClass((value, record) => value === 'Disputed' ? 'disputed' : [])
.required((_value, record) => record.getField('submitted'))
.defaultValue((record, context) => record.getField('prefix'))
.emptyWhen((value, record, context) => value === 'N/A')

// After
.rowClass(record => record.getField('status') === 'Disputed' ? 'disputed' : [])
.required(record => record.getField('submitted'))
.defaultValue(record => record.getField('prefix'))
.emptyWhen(value => value === 'N/A')
```

Call `fieldType.rowClasses(record)` instead of
`fieldType.rowClasses(value, record, context)`. Move any context-specific label,
placeholder, input-type, or model-rule policy into the consumer or separate field
specializations. Labels compute a complete result from the record; the last
label declaration wins. Callback meaning is never inferred from its arity.

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
`emptyWhen(predicate)` add common validation behavior. Requiredness and length callbacks receive the owning `Record`. Emptiness
predicates receive the candidate field value and owning `Record`.

## Form behavior

FDL describes reusable field behavior; it does not guarantee accessible markup
or choose a component system. The current Lit/native example interprets some
legacy renderer-oriented metadata for compatibility. See the
[adapter contract](./adapter-contract.md) before mapping these values into a
design system or another framework.

The current adapter interprets the following metadata. `autocomplete` and
`autofocus` are deprecated compatibility APIs; their configuration belongs
in the renderer (see [ADR-0001](./adr/0001-retire-post-jack-henry-modifiers.md)).

| Modifier                                                               | Purpose                                                                                                                                  |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `type(name)`                                                           | Choose the native input type for input controls.                                                                                         |
| `label(value)`                                                         | Set a string label or compute one from the record.                                                                                       |
| `placeholder(value)`, `autocomplete(value)`, `autofocus()`             | Configure common input attributes.                                                                                                       |
| `defaultValue(valueOrFactory)`                                         | Provide defaults for clearing a record, appending a row, and omitted values in a partial clone; constructor values are kept as supplied. |
| `disabled(predicate)`, `readOnlyWhen(predicate)`, `visible(predicate)` | Set conditional state. Use `disabled()` or `readOnly()` for an unconditional state.                                                      |
| `multipleValues(min, max)`                                             | Declare multiple-value metadata. The native select adapter stores arrays; the declared count bounds do not add validators.               |
| `options(config)`                                                      | Provide options for a select-like control.                                                                                               |

For the built-in adapter, providing options creates a native dropdown. Option
objects use `text` and `value` properties:

```js
const contactMethod = field.label('Preferred contact method').options([
    { text: 'Choose a method', value: '' },
    { text: 'Email', value: 'email' },
    { text: 'Phone', value: 'phone' },
]);
```

`options()` can also receive a regular function or an async function. Both
receive the current record:

```js
const localAssignee = field.options(record => directory[record.getField('department')]);

const remoteAssignee = field.options(async record => {
    const response = await fetch(
        `/assignees?department=${encodeURIComponent(record.getField('department'))}`
    );
    return response.json();
});
```

If the selected value exists in both the old and new option lists, it remains
selected. `Record` clears an unavailable single selection to `undefined` after
the latest choices resolve; multiple selections retain only available items.
Pending or failed lookups retain the current value. Disabled fields defer
record-managed loading and reconciliation until enabled. Use
`await record.whenOptionsReady()` before validating or submitting after changes.
See [selection reconciliation](./record.md#selections-and-changing-options).

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

const people = new Recordset(fields, [{ name: 'Zulu' }, { name: 'Alpha' }, { name: 'Mike' }]);

await people.requestHardUpdate();
people.sortColumns = [{ field: 'name', sort: 'ascending' }];
await people.updating;
// A table bound to people renders: Alpha, Mike, Zulu
```

Use `columnClass(classes)` for shared column classes, `cellClass(classes)` for
value-specific cell classes, and `rowClass(classes)` for
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
    accountCode: field.filter((text, value) => value.toLowerCase().startsWith(text.toLowerCase())),
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

## Cell, column, and row classes

`cellClass(classes)`, `columnClass(classes)`, and `rowClass(classes)` add classes, one declaration
at a time. Supply a class name, an array of class names, or a function returning
either. Cell callbacks receive `(value, record)`. Column callbacks take no
arguments; row callbacks receive only the record.
Return `[]` when no classes apply. Repeated calls accumulate in declaration
order without changing the source definition.

```ts
const status = field
    .columnClass('status-column')
    .cellClass('status-cell')
    .cellClass(value => (value === 'Disputed' ? ['warning', 'needs-review'] : []))
    .rowClass('invoice-row')
    .rowClass(record => (record.getField('status') === 'Disputed' ? 'disputed-row' : []));
```

The supported cell and row class signatures are:

```ts
cellClass(className: string)
cellClass(classNames: string[])
cellClass(classes: (value: T, record: Record<any>) => string | string[])

columnClass(className: string)
columnClass(classNames: string[])
columnClass(classes: () => string | string[])

rowClass(className: string)
rowClass(classNames: string[])
rowClass(classes: (record: Record<any>) => string | string[])
```

The table resolves column classes once per column on each render and applies
them to its `<col>`, `<th>`, and every `<td>`. Each data cell combines column
classes with its own `cellClass` results. Neither a value nor an owning record
exists for a whole column, so a column callback takes no arguments. Column
classes apply to `<col>` and `<th>` even on an empty table. The spanning
empty-state cell has no individual column and keeps its own classes.

Use column classes for shared presentation and cell classes for value-specific
exceptions:

```ts
const amount = field
    .textAlign('right')
    .columnClass('amount-column')
    .columnClass(['numeric', 'currency'])
    .cellClass((value, record) => (value > record.getField('limit') ? 'over-limit' : []));
```

Column classes do not propagate to individual cells through HTML automatically;
the table explicitly assigns them to each element. CSS still determines which
properties apply to each element. Column callbacks are re-evaluated on render;
a change in closed-over application state needs a consumer update.

Migrate a context-dependent `cellClass((value, record, context) => ...)` to
`columnClass(...)` for the shared classes and `cellClass((value, record) => ...)`
for the per-cell rule. The cell callback and `cellClasses` getter no longer
receive a context argument.

The value type `T` comes from the field type. The callback can read other
fields through `record.getField(name)`, for example:

```ts
const amount = field
    .cellClass((value, record) =>
        value > record.getField('limit') ? ['warning', 'over-limit'] : []
    )
    .rowClass(record =>
        record.getField('amount') > record.getField('limit') ? 'over-limit-row' : []
    );
```

The old two-argument predicate form is no longer supported. Replace
`cellClass(predicate, classes)` with
`cellClass((value, record) => predicate(value) ? classes : [])`.

`rowClasses(fn)` was renamed to `rowClass(fn)` on 2026-10-15. Rename modifier
calls to the singular form; callbacks can continue returning arrays. Consumer
methods `fieldType.cellClasses(value, record)` and
`fieldType.rowClasses(record)` still return the accumulated arrays.

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
`record => ...` as described above. Conditional requiredness continues to affect model validation
as well as the control's required state. Disabled fields retain their values.
