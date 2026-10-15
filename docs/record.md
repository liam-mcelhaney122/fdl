# Record

A `Record` combines a map of field names and field definitions with one
object of values. Start definitions with `field` or a primitive and chain
modifiers, then pass them directly to the constructor. The record connects their
rules to values and is the model passed to FDL form controls.
Use `fieldTypeForField(name)` to inspect a field's runtime behavior.

```js
import { Record, string } from 'digital-fdl';

const account = new Record(
  {
    name: string.label('Account name'),
    accountNumber: string,
  },
  {
    name: 'Checking',
    accountNumber: '92120391',
  }
);
```

`addField(name, definition, value)` uses the same conversion. The input map is
not changed. `fieldTypeForField(name)` returns the finalized `FieldType`, so
runtime methods such as `required()` evaluate state rather than add modifiers.

## Working with fields

Prefer `record.field(name)` in components and other UI code. It returns a
`Field` object that exposes printed and raw values, validity, and the runtime
field type. For example, assigning `field.value` parses the displayed value
before storing it, while `field.rawValue` reads or writes the stored value.

```js
const name = account.field('name');

name.value; // formatted value for display
name.rawValue; // 'Checking'
name.valid; // true or false
```

`getField()` and `setField()` remain useful for model or service code. Both
support dot-separated paths for nested values.

```js
account.setField('name', 'Savings');
account.getField('name'); // 'Savings'
```

`setField()` stores the supplied value directly, without parsing or rejecting
invalid values. Use `parseAndSetField(name, input)` to parse first, and call
validation explicitly. Disabled and read-only state affects consumers; it does
not block programmatic assignments.

## Change events and lifecycle

Calling `setField()` dispatches a `change` `CustomEvent` with the changed field in
`event.detail.field`. `announceBlur(field)` dispatches a `blur` `CustomEvent`
with the same detail shape. Assigning the existing value still dispatches `change`; mutating
`record.values` directly does not.

```js
account.addEventListener('change', event => {
  console.log(event.detail.field);
});

account.setField('name', 'Savings');
```

`reset()` restores the initial values supplied to the constructor. `clear()`
replaces each value with its field type's default value. `hasChanged` reports
whether the current values differ from those initial values.

The constructor uses the supplied values without parsing or applying defaults.
Include an initial value for every declared field: whole-record validation
iterates keys in the values object, so an omitted field is not checked by
`isValid()` (it can still be checked with `isValid(fieldName)`).

## Validation and display

`isValid()` checks the entire record; `isValid(fieldName)` checks one field.
Use `errors()`, `errorCount()`, or `hasErrors()` when the individual validation
errors are needed. `print(fieldName)` formats a value for display, and
`parse(fieldName, value)` applies that field's parsers.

```js
if (!account.isValid()) {
  console.log(account.readableRecordErrors());
}

account.print('name');
```

`fieldTypeForField(name)` returns the `FieldType` definition for integrations
that need it directly.

`getFormattedField(fieldName, context)` runs the formatter pipeline without
applying a template. Its default context is `"model"`. The `Field` facade
exposes `focusedInputValue` and `blurredInputValue` using `"input-focus"` and
`"input-blur"` respectively. The current native adapter requests `"input-focus"`
when synchronizing editable text, including on blur; it does not switch to
`"input-blur"` automatically. `print(fieldName)` formats with `"print"`
and then applies `template(...)`, so its result may be a Lit template rather
than a string. `record.field(name).value` also uses that printed representation.
`parse(fieldName, input)` uses `"model"` and returns the parsed value without
storing it.

Synchronous validation throws when it encounters a promise-returning validator.
Use `await record.isValidAsync(fieldName?)` or `await record.errorsAsync()` for
asynchronous rules. The `Field` facade and the built-in form adapter currently
require synchronous validators; see [validation limits](./field-type.md#value-transforms-and-validation).
