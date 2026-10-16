# Using FDL with Svelte

Use this reference when an application renders FDL `Record`s or `Recordset`s
with Svelte 5. The adapter connects model state to accessible native controls;
business rules stay in field definitions. The full API is in
`docs/svelte-adapter.md`; tests in `tests/svelte-*.test.ts` keep this file's
examples working.

## Install and import

- Svelte is an optional peer dependency: install `svelte@^5.20.0` (the version
  that added `$props.id()`) next to `@pmcelhaney/fdl`.
- The adapter ships as `.svelte` and TypeScript source. Compile it with the
  application's Svelte toolchain (Vite with `@sveltejs/vite-plugin-svelte`, or
  SvelteKit). The core package never imports Svelte.

```js
import { field, Record, Recordset } from '@pmcelhaney/fdl';
import FdlField from '@pmcelhaney/fdl/adapters/svelte/FdlField.svelte';
import {
    fieldControl,
    fieldStore,
    recordStore,
    recordsetStore,
} from '@pmcelhaney/fdl/adapters/svelte';
```

## `FdlField`: one component for every field

Render every field with `<FdlField record={...} field="name" />`. Do not choose
`input`, `select`, or `textarea` yourself: options produce a `select`,
`rowCount()` a `textarea`, anything else an `input` with the field's `type()`,
and read-only fields a labeled `<output>`. Invisible fields render nothing.

| Prop                   | Purpose                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `record`, `field`      | Required. The Record and field name. Both may change after mounting.    |
| `showValidationErrors` | Application policy; defaults to `false`. See the next section.          |
| `selectPrompt`         | Empty first choice for a single select (control text, not model data). |
| `describedby`          | Extra description IDs (help text); the adapter adds its error ID.       |

The component generates per-instance IDs, associates the label, sets native
`required`, `disabled`, `readonly`, `placeholder`, length bounds, and `pattern`,
parses edits with `Record.parseAndSetField()`, keeps in-progress text and the
caret while typing, reformats on blur, and filters keys with `inputMask()`.

## Show validation errors on submit

When errors appear is application policy. Keep a flag in the application and
pass it to every field. FDL validation is authoritative, so put `novalidate` on
the form: the adapter renders native controls, and without it a native
`required` control blocks the `submit` event and shows the browser's message
instead of FDL's.

```svelte
<script>
    import { field, Record } from '@pmcelhaney/fdl';
    import FdlField from '@pmcelhaney/fdl/adapters/svelte/FdlField.svelte';

    async function findStores(zip) {
        const response = await fetch(`/api/stores?zip=${zip}`);
        return response.json(); // [{ text: 'Uptown', value: 'uptown' }, ...]
    }

    const order = new Record(
        {
            name: field.label('Full name').required(),
            zip: field.label('ZIP code').inputMask(/[0-9]/).maxLength(5),
            store: field
                .label('Pickup store')
                .required()
                .disabled(record => String(record.getField('zip')).length !== 5)
                .options({
                    fields: ['zip'],
                    fetch: record => findStores(record.getField('zip')),
                }),
        },
        { name: '', zip: '', store: '' }
    );

    let submitted = $state(false);
    let saved = $state(false);

    function submit(event) {
        event.preventDefault();
        submitted = true;
        saved = order.isValid();
    }
</script>

<form novalidate onsubmit={submit}>
    <FdlField record={order} field="name" showValidationErrors={submitted} />
    <FdlField record={order} field="zip" showValidationErrors={submitted} />
    <FdlField
        record={order}
        field="store"
        selectPrompt="Choose a store"
        showValidationErrors={submitted}
    />
    <button>Place order</button>
    <p role="status">{saved ? 'Order placed.' : ''}</p>
</form>
```

With `showValidationErrors` true and synchronous errors present, the field
renders `.validation-error`, sets `aria-invalid="true"`, and adds the error's ID
to `aria-describedby` (keeping `describedby`). Async validators are not shown;
await `record.isValidAsync()` and render those results yourself.

## Dependent options and loading

Declare dependencies in the model, as `store` does above:
`options({ fields, fetch })` refetches when a listed field changes, and
`disabled(...)` defers lookups until the field can be edited. While the latest
lookup is pending, `FdlField` disables the select, sets `aria-busy="true"`, and
shows a "Loading choices…" status; it ignores results from stale lookups and
restores the declared disabled state afterwards. Option values become strings
in native selects, so use string option values. `multipleValues()` renders a
native `<select multiple>` and stores an array.

## Stores

All stores follow the Svelte store contract (`subscribe` calls back
synchronously with the current value and returns an unsubscribe function), so
use them with `$store`. They attach model listeners only while subscribed and
remove them when the last subscriber leaves. Create them with `$derived(...)`
when the Record comes from a prop.

- `recordStore(record)`: value is the Record; updates on every `change`.
  Use it for derived text: `{$order.getFormattedField('total', 'model')}`.
- `recordsetStore(recordset)`: value is the Recordset; updates on `updated`,
  `page-changed`, `counts-changed`, `loading`, `record-added`, and `error`,
  including edits to records in the set.
- `fieldStore(record, field, { showValidationErrors })`: value is a snapshot
  (`control`, `label`, `required`, `visible`, `readonly`, `disabled`,
  `formattedValue`, `printedValue`, `errors`, `options`, `optionsLoading`,
  `optionsError`, ...). `edit(viewValue)` parses a view value into the Record,
  and `setShowValidationErrors(show)` changes the policy.

## Your own markup: `fieldStore` plus `fieldControl`

Use the `fieldControl` action on a native `input`, `select`, or `textarea` when
the application needs its own markup. The action owns value sync, parsing,
input masks, and select options; your markup owns the label, attributes, and
ARIA. For a non-native widget, call `store.edit(value)` from its change event
instead of using the action.

```svelte
<script>
    import { fieldControl, fieldStore } from '@pmcelhaney/fdl/adapters/svelte';

    let { record } = $props();
    const amount = $derived(fieldStore(record, 'amount', { showValidationErrors: true }));
    const id = $props.id();
</script>

{#if $amount.visible}
    <label for="{id}-amount">{$amount.label}</label>
    <input
        id="{id}-amount"
        inputmode="decimal"
        use:fieldControl={{ store: amount }}
        required={$amount.required}
        disabled={$amount.disabled}
        aria-invalid={$amount.errors.length > 0 ? 'true' : undefined}
        aria-describedby={$amount.errors.length > 0 ? `${id}-amount-error` : undefined}
    />
    {#if $amount.errors.length > 0}
        <p id="{id}-amount-error" class="validation-error">{$amount.errors.join('. ')}</p>
    {/if}
{/if}
```

## Render a `Recordset` table

Subscribe to the Recordset and render `currentPage`. Edits inside rows notify
the store, so totals stay current. Right-align numeric columns in examples.

```svelte
<script>
    import FdlField from '@pmcelhaney/fdl/adapters/svelte/FdlField.svelte';
    import { recordsetStore } from '@pmcelhaney/fdl/adapters/svelte';

    let { recordset } = $props();
    const rows = $derived(recordsetStore(recordset));
    const total = $derived(
        $rows.currentPage.reduce((sum, record) => sum + Number(record.getField('amount')), 0)
    );

    $effect(() => {
        recordset.requestHardUpdate();
    });
</script>

<table>
    <thead>
        <tr><th scope="col">Item</th><th scope="col" class="numeric">Amount</th></tr>
    </thead>
    <tbody>
        {#each $rows.currentPage as record (record)}
            <tr>
                <th scope="row">{record.print('item')}</th>
                <td class="numeric"><FdlField {record} field="amount" /></td>
            </tr>
        {/each}
    </tbody>
    <tfoot>
        <tr><th scope="row">Total</th><td class="numeric">{total}</td></tr>
    </tfoot>
</table>
<p role="status">{$rows.isLoading ? 'Loading rows…' : ''}</p>
<button disabled={$rows.pageNumber <= 1} onclick={() => (recordset.pageNumber -= 1)}>
    Previous page
</button>
<button
    disabled={$rows.lastRecordNumberOnPage >= $rows.filteredCount}
    onclick={() => (recordset.pageNumber += 1)}
>
    Next page
</button>

<style>
    .numeric {
        text-align: right;
    }
</style>
```

## Limits and deviations from the Lit adapter

- Requires Svelte 5.20+ for `FdlField` (runes, `$props.id()`); the stores and
  action follow the plain store and action contracts.
- `multipleValues()` uses a native `<select multiple>`, not Lit's checkbox
  dropdown.
- Only synchronous errors (`Record.readableFieldErrors()`) are displayed.
- Each `FdlField` shows its field label, including inside table cells. For
  header-based labeling, use `fieldControl` with your own markup.
- Server rendering outputs labels and attributes; control values and select
  options arrive from the action after hydration.
- `accept()`, `autofocus()`, `additionalProperties()`, and other deprecated
  renderer modifiers are not forwarded. Do not add Svelte-specific modifiers
  to `FieldType`.
