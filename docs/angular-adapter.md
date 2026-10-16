# Angular adapter

The Angular adapter renders FDL fields with Angular 21 standalone components
and signals. It lives in [`adapters/angular/`](../adapters/angular/) and follows
the same [adapter contract](./adapter-contract.md) as the Lit
[`FormElement`](./form-element.md). The `Record` remains the source of truth for
values, parsing, formatting, field state, options, and validation.

Angular is an optional peer dependency (`@angular/core` `^21.0.0`). The core
`@pmcelhaney/fdl` entry point does not import Angular, so applications that do
not use the adapter are unaffected.

## Installing

The adapter currently ships as TypeScript source, like the rest of this package.
Angular's compiler only builds TypeScript included in your project, so add the
adapter to your application's `tsconfig.app.json`. FDL's core modules are
JavaScript without separate declaration files, so the adapter's imports of them
also need `allowJs` and a `maxNodeModuleJsDepth` of at least `2`; otherwise a
`strict` build reports TS7016 errors:

```json
{
    "compilerOptions": {
        "allowJs": true,
        "maxNodeModuleJsDepth": 2
    },
    "include": ["src/**/*.ts", "node_modules/@pmcelhaney/fdl/adapters/angular/**/*.ts"]
}
```

Then import it from the adapter folder:

```ts
import { FdlFieldComponent, recordSignal } from '@pmcelhaney/fdl/adapters/angular';
```

A prebuilt Angular package format (partial compilation) is not published yet;
see [Current limits](#current-limits).

## One field component

Render every field with `<fdl-field>`, as recorded in
[ADR-0002](./adr/0002-use-one-field-custom-element.md). The component chooses a
native `select` when the field has options, a `textarea` when `rowCount()` is
configured, and an `input` otherwise.

```ts
import { Component, signal } from '@angular/core';
import { field, Record } from '@pmcelhaney/fdl';
import { FdlFieldComponent } from '@pmcelhaney/fdl/adapters/angular';

@Component({
    selector: 'app-contact',
    imports: [FdlFieldComponent],
    template: `
        <form (submit)="submit($event)">
            <fdl-field [record]="contact" field="name" [showValidationErrors]="submitted()" />
            <fdl-field
                [record]="contact"
                field="method"
                selectPrompt="Choose a method"
                [showValidationErrors]="submitted()"
            />
            <button>Save</button>
        </form>
    `,
})
export class ContactComponent {
    readonly contact = new Record(
        {
            name: field.label('Full name').required(),
            method: field
                .label('Preferred contact method')
                .required()
                .options([
                    { text: 'Email', value: 'email' },
                    { text: 'Phone', value: 'phone' },
                ]),
        },
        { name: '', method: '' }
    );

    readonly submitted = signal(false);

    submit(event: Event) {
        event.preventDefault();
        this.submitted.set(true);
        if (this.contact.isValid()) {
            // Persist this.contact.values.
        }
    }
}
```

| Input                  | Required | Purpose                                                                                                    |
| ---------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `record`               | Yes      | The `Record` that owns the field. Replacing it moves the component's subscription to the new record.       |
| `field`                | Yes      | The field name in `record`.                                                                                |
| `showValidationErrors` | No       | Application policy for exposing synchronous model errors. Defaults to `false`; accepts boolean attributes. |
| `selectPrompt`         | No       | Control-owned empty-choice text for a single-value select. Not added to the option data.                   |
| `describedBy`          | No       | Additional description IDs, such as help text, kept alongside the adapter's error reference.               |

The component:

- gives each instance an opaque, stable control ID and associates the visible
  label with it;
- renders a read-only field as a labeled `<output>` containing
  `Record.print()`, unless the field uses `usesCustomPrint()`;
- copies requiredness, disabled state, placeholder, input type, length
  bounds, and other supported state from the `FieldType` to the native control;
- sends edits through `Record.parseAndSetField()` and calls the field's
  `onValueChange` callbacks;
- applies `inputMask()` to typed and pasted text while preserving the caret;
- keeps unfinished text such as `12.` while the user types, then reapplies the
  `"input-focus"` format on blur; programmatic changes to another value are
  shown immediately;
- stores multiple selections as an array;
- loads choices with `Record.optionsForField()`, defers loading while the field
  is disabled, disables the select with `aria-busy="true"` and a
  “Loading choices…” status while loading, and ignores results from an older
  lookup; and
- when `showValidationErrors` is true and the field has synchronous errors,
  renders a `.validation-error` element, sets `aria-invalid="true"`, and adds the
  error's ID to `aria-describedby`.

The host element has the `fdl-field` class. Inner hooks match the Lit adapter:
`.control`, `.control-input[data-loading]`, `.options-spinner`,
`.options-loading`, `.required`, and `.validation-error`. Styling belongs to the
application; the component only styles its loading spinner.

## Signal helpers

The helpers turn FDL's `EventTarget` notifications into Angular signals. Call
them in an injection context (a constructor or field initializer), or pass
`{ injector }`. Listeners are removed when that injector's `DestroyRef` is
destroyed.

| Helper                                                | Returns                                                                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `recordSignal(record)`                                | A `Signal<Record>` that notifies on every Record `change` event.                                                      |
| `fieldValue(record, field)`                           | A signal of the field's stored value.                                                                                 |
| `fieldState(record, field, { showValidationErrors })` | A signal of `FdlFieldState`: label, requiredness, visibility, formatted text, visible errors, and so on.              |
| `recordsetSignal(recordset)`                          | A `Signal<Recordset>` that notifies after `updated`, `page-changed`, `counts-changed`, `loading`, and `record-added`. |

Each source and `field` argument may be a plain value or a signal, such as a
component input. When the source signal changes, the subscription moves to the
new object.

```ts
import { Component, computed, input } from '@angular/core';
import { Record } from '@pmcelhaney/fdl';
import { fieldState, recordSignal } from '@pmcelhaney/fdl/adapters/angular';

@Component({
    selector: 'app-summary',
    template: `<p>{{ name() }} ({{ nameState().required ? 'required' : 'optional' }})</p>`,
})
export class SummaryComponent {
    readonly record = input.required<Record<any>>();
    private readonly model = recordSignal(this.record);
    readonly name = computed(() => this.model().print('name'));
    readonly nameState = fieldState(this.record, 'name');
}
```

The value of `recordSignal()` is the same mutable `Record`; read model state
inside `computed()` or a template. A `Recordset` re-announces edits to the
records it created as `updated`, so a `computed()` over `recordsetSignal()`,
such as a column total, refreshes when a row changes. Render editable cells with
`<fdl-field>`.

## Framework-independent state

`adapters/angular/field-state.ts` does not import Angular. It contains the
translation from FDL to rendering state, so it can be tested without TestBed and
reused by other renderers:

- `readFieldState(record, field, { showValidationErrors })` returns a plain
  `FdlFieldState` snapshot;
- `FieldOptionsLoader` loads options with the disabled-state gate and stale-result
  protection;
- `acceptedInput`, `rejectsInsertion`, and `filterTextControl` apply
  `inputMask()`; and
- `readControlValue`, `isOptionSelected`, `showsSelectPrompt`, and
  `mergeDescribedBy` cover control values, selection, and ARIA descriptions.

## Forms integration

The adapter does not provide a `ControlValueAccessor`. A value accessor would
make an Angular `FormControl` a second value store and invite duplicating FDL
rules as Angular validators. Submit `record.values` after checking
`record.isValid()`, and use the application's own submitted or touched state to
set `showValidationErrors`.

## Current limits

- Validation display uses synchronous `Record.readableFieldErrors()`, like the
  Lit adapter. Errors are computed only while they are shown, so an async
  validator does not throw while `showValidationErrors` is false; await
  `record.isValidAsync()` to validate asynchronous rules.
- A multiple-value field renders a native `<select multiple>`, not the Lit
  adapter's checkbox dropdown. `multipleValues(min, max)` bounds are not enforced.
- Option values are converted to strings for native `<option>` elements; use
  string identities.
- `Record.print()` output is rendered as text. A `template()` that returns a Lit
  template is not rendered as markup by this adapter.
- Lit-specific compatibility properties such as `additionalProperties()` and
  custom child controls are not forwarded.
- The adapter is distributed as source and requires Angular 21. Publishing a
  partially compiled Angular package needs `@angular/compiler-cli`, which requires
  TypeScript 5.9 or newer; the repository's test toolchain (ts-jest 27) still
  requires TypeScript 4.

## Testing in this repository

`npm run typecheck` also runs `npm run typecheck:angular`, which checks the
adapter and its tests with TypeScript 5.9 (installed under the
`typescript-angular` alias). The core library continues to use TypeScript 4.

The Jest suites in `tests/angular/` render the component with Angular's JIT
compiler and zoneless change detection. Jest 27 cannot resolve Angular's
`exports` maps, so `jest.config.js` maps Angular imports to its bundles and
transpiles them to CommonJS. Without the Angular CLI's JIT transform, signal
inputs need their metadata declared in the test environment; a test fails if
that declaration and the component's inputs drift apart. Template type checking
(`strictTemplates`) is not run because it requires `@angular/compiler-cli`.
