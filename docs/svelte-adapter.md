# Svelte adapter

The Svelte adapter renders and edits FDL fields in Svelte 5 applications. It
honors the same [form adapter contract](./adapter-contract.md) as the Lit
`FormElement`: FDL owns field behavior, the adapter owns accessible control
semantics, and the application owns workflow and visual presentation. The
decision is recorded in [ADR-0008](./adr/0008-add-svelte-adapter.md).

The adapter lives in `adapters/svelte/`. Svelte is an optional peer dependency
(`svelte@^5.20.0`); the core package never imports it. Install Svelte in the
application and import the adapter by path:

```js
import FdlField from '@pmcelhaney/fdl/adapters/svelte/FdlField.svelte';
import { fieldStore, recordStore, recordsetStore } from '@pmcelhaney/fdl/adapters/svelte';
```

The adapter ships as Svelte and TypeScript source, like the rest of the
package. Compile it with the application's Svelte toolchain, such as Vite with
`@sveltejs/vite-plugin-svelte` or SvelteKit.

## One field component

Render every field with `FdlField`. As with `<fdl-field>`
([ADR-0002](./adr/0002-use-one-field-custom-element.md)), the component chooses
the native control from field metadata: a `select` when the field has options, a
`textarea` when `rowCount()` is configured, and an `input` otherwise. Read-only
fields render a labeled `<output>` unless `usesCustomPrint()` is set.

```svelte
<script>
    import { field, Record } from '@pmcelhaney/fdl';
    import FdlField from '@pmcelhaney/fdl/adapters/svelte/FdlField.svelte';

    const contact = new Record(
        {
            name: field.label('Full name').required(),
            method: field.label('Preferred contact method').options([
                { text: 'Email', value: 'email' },
                { text: 'Phone', value: 'phone' },
            ]),
        },
        { name: '', method: '' }
    );

    let submitted = $state(false);
</script>

<form
    onsubmit={event => {
        event.preventDefault();
        submitted = true;
    }}
>
    <FdlField record={contact} field="name" showValidationErrors={submitted} />
    <FdlField
        record={contact}
        field="method"
        selectPrompt="Choose a method"
        showValidationErrors={submitted}
    />
    <button>Save</button>
</form>
```

| Prop                   | Required | Purpose                                                                                               |
| ---------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `record`               | Yes      | The `Record` that supplies the field definition, value, and model behavior.                           |
| `field`                | Yes      | The field name to render.                                                                             |
| `showValidationErrors` | No       | Application policy. When `true`, exposes current synchronous FDL errors. Defaults to `false`.         |
| `selectPrompt`         | No       | Text for a single select's empty choice. The prompt belongs to the control, not to the model options. |
| `describedby`          | No       | Additional description IDs (such as help text) kept on the control alongside the adapter's error ID.  |

The component:

- generates a per-instance control ID with `$props.id()` and associates the
  visible label with it, so IDs also match between server rendering and
  hydration;
- marks requiredness with the native `required` attribute and a decorative
  `.required` marker in the label;
- applies the field's input type, placeholder, length bounds, disabled state,
  and other native attributes from the current record;
- sends edits through `Record.parseAndSetField()` and refreshes when the
  Record announces a change;
- keeps a text control's in-progress text and caret while its own input events
  update the record, then reapplies the `"input-focus"` formatted value on
  blur and on `change`;
- filters typing and pasted text with the field's `inputMask`;
- loads choices through `Record.optionsForField()`, disables the select and
  sets `aria-busy="true"` with a "Loading choices…" status while the latest
  lookup is pending, defers lookups while the field is disabled, and ignores
  results from stale lookups; and
- when `showValidationErrors` is true and the field has synchronous errors,
  renders a `.validation-error` element, sets `aria-invalid="true"`, and adds
  the error's ID to `aria-describedby`.

Style the component from application CSS with `:global(...)` selectors or a
wrapping class, for example `.validation-error`, `[aria-invalid='true']`, and
`.required`. The component includes only the loading-spinner styles.

## Stores

The stores implement the Svelte store contract (`subscribe` returning an
unsubscribe function) in plain JavaScript. They work with `$store` syntax in
Svelte 4 and 5 and in non-Svelte code. Each store listens to its model only
while it has subscribers and removes its listeners when the last subscriber
leaves.

| Store                                                 | Value                  | Updates on                                                                                 |
| ----------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------ |
| `recordStore(record)`                                 | The `Record`           | Every Record `change` event                                                                |
| `recordsetStore(recordset)`                           | The `Recordset`        | `updated`, `page-changed`, `counts-changed`, `loading`, `record-added`, and `error` events |
| `fieldStore(record, field, { showValidationErrors })` | A field-state snapshot | Record changes and option-lookup results                                                   |

```svelte
<script>
    import { recordStore } from '@pmcelhaney/fdl/adapters/svelte';
    let { record } = $props();
    const values = recordStore(record);
</script>

<p>Total: {$values.getFormattedField('total', 'model')}</p>
```

A field store snapshot includes the chosen `control`, `label`, `required`,
`visible`, `readonly`, `disabled`, `placeholder`, `formattedValue`,
`printedValue`, `errors`, `options`, `optionsLoading`, and `optionsError`. It
contains no generated IDs or display policy beyond `errors`, which is empty
unless validation display is enabled. Field stores also provide
`edit(viewValue)`, which parses a view value into the Record, and
`setShowValidationErrors(show)`.

Use a field store to connect an existing Svelte component library control
without moving its semantics into `FieldType`:

```svelte
<script>
    import { fieldStore } from '@pmcelhaney/fdl/adapters/svelte';
    import { Slider } from './design-system';
    let { record } = $props();
    const volume = fieldStore(record, 'volume');
</script>

<Slider
    label={$volume.label}
    value={$volume.value}
    disabled={$volume.disabled}
    onchange={event => volume.edit(event.detail)}
/>
```

## Native control action

`FdlField` uses the `fieldControl` action to bind a native `input`, `select`,
or `textarea`. Use it directly when an application needs its own markup around
a native control. The action owns value synchronization, edits, input masks,
and select options; the markup remains responsible for attributes, labels, and
ARIA.

```svelte
<script>
    import { fieldControl, fieldStore } from '@pmcelhaney/fdl/adapters/svelte';
    let { record } = $props();
    const amount = fieldStore(record, 'amount');
</script>

<label for="amount">{$amount.label}</label>
<input id="amount" use:fieldControl={{ store: amount }} required={$amount.required} />
```

`readFieldState(record, field, options)`, `controlFor(fieldType, readonly)`,
`acceptedInput(fieldType, text)`, and `visibleFieldErrors(record, field,
options)` are the framework-independent helpers behind the stores. They are
exported for adapters and tests.

## Current limits

- The adapter requires Svelte 5.20 or newer for `$props.id()`. The stores and
  action work with any Svelte version that supports the store contract and
  actions, but `FdlField.svelte` uses runes.
- Multiple-value selects render a native `<select multiple>` rather than the
  Lit adapter's checkbox dropdown. Edits are stored as arrays of option
  values.
- Native select option values are converted to strings, as in the Lit adapter.
  Use string option identities or a custom control.
- Validation display uses synchronous `Record.readableFieldErrors()`, like the
  Lit adapter. Asynchronous validation must be awaited and rendered by the
  application.
- `additionalProperties()` and other legacy custom-element properties are not
  forwarded; they are deprecated renderer-specific modifiers
  ([ADR-0001](./adr/0001-retire-post-jack-henry-modifiers.md)).
- The documentation site does not include a live Svelte example; it remains a
  Lit application.
