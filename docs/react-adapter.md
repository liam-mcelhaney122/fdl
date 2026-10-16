# React adapter

The React adapter renders FDL fields with React components and hooks. It honors
the same [form adapter contract](./adapter-contract.md) as the Lit
[`FormElement`](./form-element.md): FDL owns field behavior, the adapter owns
accessible structure and synchronization, and the application owns workflow and
presentation. The decision is recorded in
[ADR-0008](./adr/0008-add-a-react-adapter.md).

## Installation and import path

React is an optional peer dependency of `@pmcelhaney/fdl`; applications that do
not use the adapter do not install React. React 18 or newer is required for
`useId` and `useSyncExternalStore`.

```sh
npm install @pmcelhaney/fdl react react-dom
```

The adapter lives in `adapters/react/`. The package does not define an
`exports` map, so existing deep imports keep working; import the adapter by its
path:

```tsx
import { FdlField, useFieldState, useRecord, useRecordset } from '@pmcelhaney/fdl/adapters/react';
```

Like the rest of the package, the adapter is published as TypeScript source.
Use a bundler or toolchain that compiles TypeScript and TSX (for example, Vite).

## One field component

Render every field with `FdlField`. Do not create separate input, select, or
textarea components; the adapter chooses the native control from field metadata
([ADR-0002](./adr/0002-use-one-field-custom-element.md)).

```tsx
import { useState } from 'react';
import { field, Record } from '@pmcelhaney/fdl';
import { FdlField } from '@pmcelhaney/fdl/adapters/react';

const contact = new Record(
    {
        name: field.label('Full name').required(),
        method: field.label('Preferred contact method').options([
            { text: 'Email', value: 'email' },
            { text: 'Phone', value: 'phone' },
        ]),
        notes: field.label('Notes').rowCount(4),
    },
    { name: '', method: '', notes: '' }
);

export function ContactForm() {
    const [submitted, setSubmitted] = useState(false);
    return (
        <form
            noValidate
            onSubmit={event => {
                event.preventDefault();
                setSubmitted(true);
                if (contact.isValid()) save(contact.values);
            }}
        >
            <FdlField record={contact} field="name" showValidationErrors={submitted} />
            <FdlField
                record={contact}
                field="method"
                selectPrompt="Choose a method"
                showValidationErrors={submitted}
            />
            <FdlField record={contact} field="notes" />
            <button type="submit">Save</button>
        </form>
    );
}
```

| Prop                   | Required | Purpose                                                                                        |
| ---------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `record`               | Yes      | Supplies the field definition, value, and model behavior.                                      |
| `field`                | Yes      | Names the field in `record`.                                                                   |
| `showValidationErrors` | No       | Exposes current synchronous FDL errors. Defaults to `false`; the application decides when.     |
| `selectPrompt`         | No       | Adds a control-owned empty choice to a single select unless the options supply an empty one.   |
| `describedBy`          | No       | Additional description IDs; the adapter adds and removes only its own error ID alongside them. |
| `className`            | No       | Extra classes for the `.fdl-field` wrapper.                                                    |

### Behavior

- **Control selection.** Options produce a `select`, configured `rowCount()`
  produces a `textarea`, and other fields use an `input` whose `type` comes from
  `type()`. Read-only fields render a labeled `<output>` with `Record.print()`
  unless `usesCustomPrint()` is configured. Hidden fields render nothing.
- **Labels and IDs.** Each instance derives a stable, unique control ID from
  React's `useId`. The visible label's `htmlFor` references the control; a
  read-only `<output>` also references the label with `aria-labelledby`. IDs are
  adapter details; do not parse them.
- **Model state.** Requiredness, disabled state, placeholder, length limits,
  and related attributes are recomputed from the `Record` on every `change`
  event. The requiredness marker in the label is `aria-hidden`; the native
  `required` attribute carries the state.
- **Editing.** Edits call `Record.parseAndSetField()` and then the field's
  `onValueChange` callbacks. While a text input or textarea is being edited,
  the adapter keeps the user's text and caret (for example, `12.` or an empty
  numeric field) as long as the stored value is the one parsed from that text.
  Blur reapplies `getFormattedField(field, 'input-focus')`. A programmatic change
  to a different value replaces in-progress text. `inputMask()` filters typed
  and pasted characters and maps the caret into the accepted text; parsing waits
  for text composition (IME) to finish.
- **Checkboxes.** `type('checkbox')` and `type('radio')` inputs synchronize
  `checked` as a boolean.
- **Options.** Choices load through `Record.optionsForField()`. While the latest
  lookup is pending, the select is disabled, has `aria-busy="true"`, and shows a
  `role="status"` “Loading choices…” message and `.options-spinner`. Results
  from older lookups are ignored, and loading is deferred while the field is
  disabled. Option values are converted to strings for the DOM. When the stored
  value matches no option, a single select shows no choice rather than the
  first option.
- **Multiple values.** With `multipleValues()`, the adapter renders a native
  `<select multiple>` and stores an array of the selected option values.
- **Validation display.** When `showValidationErrors` is true and
  `Record.readableFieldErrors()` reports errors for a visible field, the adapter
  renders a `.validation-error` element, sets `aria-invalid="true"` on the
  control or output, and adds the error ID to `aria-describedby`.

The adapter adds no visual styles. Style `.fdl-field`, `.control`,
`.required`, `.validation-error`, `.options-loading`, `.options-spinner`, and
`[aria-invalid='true']` in application CSS.

## Hooks

| Hook                             | Returns                                                                                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useRecord(record)`              | The same `Record`, re-rendering the component on every `change` event.                                                                                    |
| `useRecordVersion(record)`       | A number that increases with each Record change; useful as a memo dependency.                                                                             |
| `useFieldState(record, field)`   | A `FieldState` snapshot: chosen control, value, `"input-focus"` display text, label, required, disabled, read-only, visible, and native attribute values. |
| `useFieldOptions(record, field)` | `{ options, loading }` with the latest-lookup and disabled-deferral rules above.                                                                          |
| `useRecordset(recordset)`        | `{ recordset, records, isLoading, totalCount, filteredCount, pageNumber, pageSize }` for the current page.                                                |

The hooks are built on `useSyncExternalStore`, so a change announced between a
render and its subscription is not missed. Use them to build a custom field
component when the native controls are not suitable, while keeping FDL as the
source of truth:

```tsx
import { useFieldState, useRecord, useRecordset } from '@pmcelhaney/fdl/adapters/react';

function Total({ record }) {
    useRecord(record);
    return <output>{record.print('total')}</output>;
}

function Reports({ recordset }) {
    const { records, isLoading, filteredCount } = useRecordset(recordset);
    if (isLoading) return <p role="status">Loading…</p>;
    return (
        <table>
            <caption>{filteredCount} reports</caption>
            <tbody>
                {records.map(record => (
                    <tr key={record.getField('id')}>
                        <td>{record.print('title')}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
```

`useRecordset` observes collection events (`updated`, `page-changed`,
`counts-changed`, `loading`, `record-added`, and `error`). Edits to fields inside
a row are Record changes; render cells with `useRecord` or `FdlField` to observe
them.

The derivation used by the hooks (`getFieldState`, `getVisibleErrors`,
`filterInput`, and `FieldOptionsTracker`) is exported from
`adapters/react/field-state.ts` and does not import React.

## Subscriptions and cleanup

Components remove their `change` listeners when they unmount. The first time a
Record or Recordset is observed, the adapter also attaches one passive listener
that counts changes; like the `Field` facade's listener, it lives as long as the
Record and is released with it.

## Current limits

- Validation display uses synchronous `Record.readableFieldErrors()`. Async
  validators are not awaited; render their results through application code.
- The multiple-value control is a native `<select multiple>`, not the Lit
  adapter's checkbox dropdown.
- File inputs are uncontrolled; the adapter stores the input's `value` on
  change and clears the picker when the Record value becomes empty, as the Lit
  adapter does.
- Deprecated and renderer-specific metadata such as `autofocus()`,
  `additionalProperties()`, and `formElement()` is not interpreted.
- Generated IDs are stable for a component instance only. React's `useId`
  matches server and client rendering when the component tree matches, but
  options still load on the client.
