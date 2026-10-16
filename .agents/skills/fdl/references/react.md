# Using FDL with React

Agent guide for rendering FDL `Record`s and `Recordset`s with the React adapter.
Full docs: `docs/react-adapter.md`; contract: `docs/adapter-contract.md`.

## Install and import

React 18+ is an optional peer dependency (`useId`, `useSyncExternalStore`).

```sh
npm install @pmcelhaney/fdl react react-dom
```

There is no `exports` map; import the adapter by path. It ships as TypeScript
source, so the app's bundler must compile TS/TSX (Vite works).

```tsx
import { field, Record, Recordset } from '@pmcelhaney/fdl';
import {
    FdlField,
    useFieldOptions,
    useFieldState,
    useRecord,
    useRecordVersion,
    useRecordset,
} from '@pmcelhaney/fdl/adapters/react';
```

Rules:

- Keep business rules in the `Record`'s field definitions. Do not add React
  validators, `required` props, or per-field state that duplicates FDL.
- Use one `FdlField` per field. Never choose `<input>`/`<select>`/`<textarea>`
  yourself; the adapter picks it from metadata (`options()` → select,
  `rowCount()` → textarea, otherwise input with `type()`; read-only → `<output>`).
- Create a `Record` once (module scope, `useState(() => new Record(...))`, or
  `useMemo`), never on every render.

## `FdlField` props

| Prop                   | Purpose                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| `record` (required)    | The `Record` that owns the value and rules.                                |
| `field` (required)     | Field name in `record`.                                                    |
| `showValidationErrors` | Default `false`. Application policy: set `true` after submit/blur/touch.   |
| `selectPrompt`         | Empty first choice for a single select (skipped if options have `''`).     |
| `describedBy`          | Extra `aria-describedby` IDs (help text); the adapter appends its own.     |
| `className`            | Extra classes on the `.fdl-field` wrapper.                                 |

It renders `.fdl-field > label + .control > (control, .validation-error)` with no
styles. Style `.required`, `.validation-error`, `.options-loading`,
`.options-spinner`, and `[aria-invalid='true']` in app CSS.

## Form with errors shown on submit

When to show errors is the application's decision. Keep a `submitted` flag and
check `record.isValid()` (FDL is authoritative; use `noValidate`).

```tsx
const contact = new Record(
    {
        name: field.label('Full name').required(),
        method: field.label('Contact method').required().options([
            { text: 'Email', value: 'email' },
            { text: 'Phone', value: 'phone' },
        ]),
    },
    { name: '', method: '' }
);

function ContactForm({ onSave }: { onSave: (values: unknown) => void }) {
    const [submitted, setSubmitted] = useState(false);
    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setSubmitted(true);
        if (contact.isValid()) onSave(contact.values);
    }
    return (
        <form noValidate onSubmit={handleSubmit}>
            <FdlField record={contact} field="name" showValidationErrors={submitted} />
            <FdlField
                record={contact}
                field="method"
                selectPrompt="Choose a method"
                showValidationErrors={submitted}
            />
            <button type="submit">Save</button>
        </form>
    );
}
```

With errors shown, the control gets `aria-invalid="true"` and its
`aria-describedby` references the `.validation-error` element. Only synchronous
errors (`record.readableFieldErrors`) are shown; display async validator results
yourself.

## Dependent options and loading

Declare dependencies in FDL; `FdlField` does the rest. While the latest lookup
is pending the select is disabled, `aria-busy="true"`, and shows a
`role="status"` "Loading choices…". Stale responses are ignored; disabled fields
do not fetch. Values that are no longer offered are cleared by the `Record`.

```tsx
const order = new Record(
    {
        zip: field.label('ZIP').inputMask(/[0-9]/).maxLength(5),
        store: field
            .label('Pickup store')
            .disabled(r => String(r.getField('zip')).length !== 5)
            .options({ fields: ['zip'], fetch: r => fetchStores(r.getField('zip')) }),
    },
    { zip: '', store: '' }
);
```

## Hooks (for custom components)

```tsx
// Re-render on any change of the Record.
function Total({ record }: { record: Record<any> }) {
    useRecord(record);
    return <output>{record.print('total')}</output>;
}

// A number that increases with each change; use as a memo dependency.
function Summary({ record }: { record: Record<any> }) {
    const version = useRecordVersion(record);
    const text = useMemo(() => record.print('total'), [record, version]);
    return <p>{text}</p>;
}

// Derived field state: control, label, displayValue, required, disabled, readOnly, visible…
function Hint({ record }: { record: Record<any> }) {
    const { label, required, visible } = useFieldState(record, 'name');
    return visible ? <p>{label}{required ? ' (required)' : ''}</p> : null;
}

// Options with the same loading/stale rules as FdlField.
function StoreList({ record }: { record: Record<any> }) {
    const { options, loading } = useFieldOptions(record, 'store');
    if (loading) return <p role="status">Loading stores…</p>;
    return <ul>{options.map(o => <li key={String(o.value)}>{String(o.text)}</li>)}</ul>;
}
```

All hooks use `useSyncExternalStore`, unsubscribe on unmount, and work under
`StrictMode`.

## Recordset tables

`useRecordset(recordset)` returns `{ recordset, records, isLoading, totalCount,
filteredCount, pageNumber, pageSize }` for the current page and re-renders on
collection events (`updated`, `page-changed`, `counts-changed`, `loading`,
`record-added`, `error`). Row field edits are Record changes, so render cells
with `FdlField` or a component that calls `useRecord`. Right-align numeric
columns in examples via your own CSS.

```tsx
function Reports({ recordset }: { recordset: Recordset<any> }) {
    const { records, isLoading, filteredCount, pageNumber } = useRecordset(recordset);
    useEffect(() => {
        recordset.requestHardUpdate();
    }, [recordset]);
    if (isLoading) return <p role="status">Loading…</p>;
    return (
        <table>
            <caption>
                {filteredCount} reports, page {pageNumber}
            </caption>
            <tbody>
                {records.map(record => (
                    <tr key={String(record.getField('id'))}>
                        <td>{record.print('title')}</td>
                        <td>
                            <FdlField record={record} field="amount" />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
```

Page with `recordset.pageNumber = n` (or `pageSize`); the hook re-renders when
`page-changed` fires.

## Limits and deviations from the Lit adapter

- Multiple values use a native `<select multiple>` (array values), not Lit's
  checkbox dropdown.
- File inputs are uncontrolled (value stored on change; cleared when the Record
  value empties).
- Validation display is synchronous only.
- `autofocus()`, `additionalProperties()`, and `formElement()` are ignored.
- IDs come from `useId`: unique per instance, never parse them. Options load on
  the client only.
- The first observation of a Record/Recordset adds one passive change-counter
  listener that lives as long as the object.
