---
name: fdl
description: >
  Use FDL (@pmcelhaney/fdl, "fiddle") to model forms and tables: define
  reusable field definitions with chained modifiers, connect them to values
  with Record, manage collections with Recordset, and read validation,
  formatting, options, and dependent state from the model. Use when writing
  or changing application code, examples, tests, or docs that define fields,
  validate records, build dependent/conditional forms, load select options,
  or sort, filter, and paginate tabular data with FDL.
---

# Use FDL

FDL puts each business rule in one declarative field definition so forms,
validation, tables, and printed output all interpret it the same way. The model
owns behavior (parsing, formatting, validation, requiredness, visibility,
options, comparison). Components own accessible markup; CSS owns appearance.

The docs in this repository are the source of truth; read the relevant one
before relying on a detail here:
`docs/field-type.md`, `docs/record.md`, `docs/recordset.md`,
`docs/form-element.md`, `docs/adapter-contract.md`, `docs/design-principles.md`.

## Install and import

```sh
npm install @pmcelhaney/fdl          # published package
npm install /absolute/path/to/FDL    # a local checkout
```

```js
import { field, string, number, boolean, date, Record, Recordset } from '@pmcelhaney/fdl';
import { email, firstName, fieldDefinitions } from '@pmcelhaney/fdl'; // presets
```

TypeScript types: `FieldDefinition<T>`, `RecordSetting`, `ValueSetting`,
`FieldSetting`, `ColumnSetting`, `DefaultSetting`.

## 1. Define fields

Start from `field` or a primitive and chain modifiers. Every modifier returns a
**new** definition; the source is never mutated, so build a baseline and
specialize it.

```js
const money = number
    .formatter(value => usd.format(value))
    .parser(text => Number(String(text).replace(/[$,]/g, '')))
    .textAlign('right');

const paymentAmount = money
    .label('Amount')
    .required()
    .validator({ name: 'must be positive', validate: value => value > 0 });
```

Primitives are starting metadata, not type conversion:
`string` defaults to `''`, `boolean` to `false`, `number` to `0` with a numeric
input mask, `date` to a `Date` captured at module load (use
`date.defaultValue(() => new Date())` for a fresh one). None adds a parser or
type validator; add them yourself. `type('email')` etc. changes the native
control only and adds no validation.

Presets (`name`, `firstName`, `lastName`, `email`, `phoneNumber`,
`streetAddress`, `city`, `state`, `postalCode`, `country`, `organization`,
`username`, …) supply labels and autocomplete intent and are optional until you
call `.required()`. Only `email` validates syntax.

### Callback scopes

Settings take a fixed value or a pure, synchronous callback. The callback's
arguments depend on the modifier — never guess from arity:

| Modifiers                                                                                      | Callback                          |
| ---------------------------------------------------------------------------------------------- | --------------------------------- |
| `label`, `placeholder`, `type`, `required`, `disabled`, `readOnly`, `visible`, `minLength`, `maxLength`, `rowClass` | `record => result`     |
| `defaultValue`                                                                                 | `record => value`                 |
| `emptyWhen`, `cellClass`                                                                       | `(value, record) => result`       |
| `textAlign`                                                                                    | `(value, record, context) => result` |
| `columnClass`, `sortable`, `minColumnWidth`, `maxColumnWidth`, `targetColumnWidth`             | `() => result`                    |
| `validator({ name, validate })`                                                                | `(modelValue, viewValue, record, options, field) => boolean \| Promise<boolean>` |
| `formatter` / `parser`                                                                         | `(value, record, context) => value` (pipelines run in order) |

Read other fields with `record.getField('name')`. Callbacks must not mutate the
record or render UI.

### Composition rules

- `required`, `disabled`, `readOnly`, `emptyWhen`: any true rule wins; a later
  `false` does not cancel an earlier unconditional rule.
- `visible`: all rules must be true.
- Validators, length rules, formatters, parsers, and cell/column/row classes
  accumulate in order. Labels and other scalars: last declaration wins.

### Conditional and dependent fields

```js
const fields = {
    country: string.label('Country').required(),
    state: string
        .label('State')
        .required(record => record.getField('country') === 'US')
        .visible(record => record.getField('country') === 'US'),
    store: field.label('Store').required().options({
        fetch: record => api.storesNear(record.getField('zip')),
        fields: ['zip'],          // only refetch when zip changes
        text: store => store.name,
        value: store => store.id,
    }),
};
```

Options accept an array of `{ text, value }`, a (possibly async) function of
the record, or `{ data | fetch, text, value, fields, filter, compareFunction }`.
Disabled fields don't load options. When choices change, the record clears a
selection that is no longer available (multiple selections keep the survivors).

Other useful modifiers: `minLength`, `maxLength`, `emptyWhen`, `inputMask(/[0-9.]/)`
(per-character filter, not whole-value validation), `multipleValues(min, max)`
(metadata only; add a validator to enforce counts), `compareFunction`,
`filter()`, `reducer('sum' | fn)`, `template(fn)` for printed output,
`cellClass`/`columnClass`/`rowClass`, column-width modifiers.

Avoid deprecated or removed APIs: sentence-style aliases (`with`, `thatIs`, …),
`requiredWhen`/`disabledWhen` (use `required(fn)`/`disabled(fn)`),
`rowClasses` (use `rowClass`), `conditionalCellClass`, `exampleValue`,
`selectOnFocus`, `toggle`; `rowCount`, `autocomplete`, `autofocus`, `schema`,
`onValueChange` are deprecated compatibility APIs (see
`docs/adr/0001-retire-post-jack-henry-modifiers.md`).

## 2. Connect values with Record

```js
const payment = new Record(fields, { country: 'US', state: '', store: undefined });
```

- The constructor stores values **as given** — no parsing, no defaults. Supply
  a value for every declared field; whole-record validation only iterates keys
  present in the values object.
- `getField(name)` / `setField(name, value)` read/write raw values (dot paths
  supported). `setField` does not parse or validate.
- `parseAndSetField(name, userInput)` parses then stores — use it for UI input.
- `print(name)` → display value (formatters with `'print'`, then `template`).
  `getFormattedField(name, 'input-focus')` → editable text.
- `record.field(name)` → `Field` facade: `value` (printed; assigning parses),
  `rawValue`, `valid`, `invalid`.
- Events: `change` (`event.detail.field`) on every `setField`, including
  same-value writes; mutating `record.values` directly does **not** fire it.
- `reset()` → initial values; `clear()` → field defaults; `hasChanged`.
- `fieldTypeForField(name)` → runtime `FieldType` for inspection, e.g.
  `ft.required(record.getField(name), record, 'model')`.

### Validation

```js
await payment.whenOptionsReady();          // after changes affecting options
payment.isValid();                         // whole record
payment.isValid('state');                  // one field
payment.readableFieldErrors('state');      // ['State is required', ...]
payment.readableRecordErrors();
await payment.isValidAsync();              // required if any validator is async
```

Synchronous APIs (`isValid`, `errors`, `readableFieldErrors`) **throw** when a
validator returns a promise. Use `isValidAsync` / `errorsAsync` for async rules.
Disabled/read-only state affects consumers, not programmatic writes.

## 3. Collections with Recordset

```js
const invoices = new Recordset(
    { id: string, customer: string.filter(), amount: money.sortable(true) },
    async ({ parameters, startIndex, pageSize, page, sort }) => api.invoices(...)
    // or a plain array of rows, or { data, totalCount, summary }
);

await invoices.requestHardUpdate();        // required for the first load
invoices.sortColumns = [{ field: 'amount', sort: 'descending' }];
invoices.filter = record => record.getField('amount') > 0;
invoices.pageSize = 25;
await invoices.updating;                   // setters schedule an update
invoices.currentPage;                      // Record[] for the visible page
```

If the fetch returns every row (`totalCount === data.length`), sorting,
filtering, and paging happen client-side; otherwise the fetch must honor
`startIndex`/`pageSize`/`sort`. `pageNumber` is 1-based, `pageIndex` 0-based.
Changing `parameters` does not refetch client-side data — call
`requestHardUpdate()`. Events: `updated`, `page-changed`, `counts-changed`,
`loading`, `record-added` (see `RecordsetEvent`). Also: `allRecords`,
`filteredCount`, `totalCount`, `isLoading`, `hasChanged`, `appendRecord()`,
`deleteRecord()`, `getFieldType(name)`.

## 4. Render

FDL has no required UI framework. Either:

- use the Lit field component pattern: extend `FormElement`
  (`form-element.ts`) once as `<fdl-field>` and render
  `<fdl-field field="state" .record=${record} .showValidationErrors=${submitted}>`
  for every field — it picks input/select/textarea from metadata
  (`docs/form-element.md`); or
- write your own components that follow `docs/adapter-contract.md`: read state
  from the `FieldType`/`Record`, send edits through `parseAndSetField`,
  subscribe to `change`, and let the application decide when errors are shown.

Do not put business rules in components or CSS, and do not add renderer-
specific modifiers to field definitions.

### Framework adapters

When the application uses a UI framework, check `references/` next to this
skill for a file named after it (for example `references/react.md`,
`references/angular.md`, `references/svelte.md`). If one exists, read it
before writing components: it covers that adapter's install path, field
component, state hooks/stores/signals, and limits. If none exists, the
framework has no packaged adapter yet; follow the adapter contract above.

## Pitfalls checklist

- Forgot a parser for a formatted or non-string input → stored strings.
- Called `isValid()` with an async validator → throws.
- Validated right after a change without `await record.whenOptionsReady()`.
- Omitted a field from initial values → skipped by whole-record validation.
- Expected `setField` to parse, or `type()`/`inputMask()` to validate.
- Mutated `record.values` directly → no `change` event, stale UI.
- Expected `Recordset` to load on construction → call `requestHardUpdate()`.
- Used a removed modifier from older examples.
