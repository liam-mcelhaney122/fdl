# Using FDL with Angular

Agent-facing guide to the Angular adapter in `adapters/angular/`. The full
human documentation is `docs/angular-adapter.md`; the decision record is
`docs/adr/0010-add-an-angular-adapter.md`. FDL (`Record`, `Recordset`,
`FieldType`) stays the source of truth for values, parsing, formatting,
options, state, and validation. The adapter only renders and forwards edits.

## Versions and install

- Angular **21** only (`@angular/core` `^21.0.0`, optional peer dependency).
  Angular 22 is untested and outside the peer range. Angular 21 needs
  TypeScript 5.9 and Node 22.12+.
- Install the application's normal Angular 21 packages plus
  `@pmcelhaney/fdl`. The core entry point never imports Angular.
- The adapter ships as **TypeScript source**. Add it to the app's compilation,
  and enable `allowJs` with `maxNodeModuleJsDepth: 2` because FDL's core
  modules are JavaScript without declarations (otherwise `strict` builds fail
  with TS7016):

```json
{
    "compilerOptions": { "allowJs": true, "maxNodeModuleJsDepth": 2 },
    "include": ["src/**/*.ts", "node_modules/@pmcelhaney/fdl/adapters/angular/**/*.ts"]
}
```

Import path:

```ts
import {
    FdlFieldComponent,
    recordSignal,
    fieldValue,
    fieldState,
    recordsetSignal,
} from '@pmcelhaney/fdl/adapters/angular';
```

## `<fdl-field>` (`FdlFieldComponent`)

One standalone, `OnPush`, zoneless-safe component for every field. It picks
`select` (field has options), `textarea` (`rowCount()`), or `input` (type from
`type()`); read-only fields become a labeled `<output>` with `Record.print()`
(unless `usesCustomPrint()`); invisible fields render nothing.

| Input                  | Required | Meaning                                                                      |
| ---------------------- | -------- | ---------------------------------------------------------------------------- |
| `record`               | yes      | The `Record`. Replacing it moves the subscription.                           |
| `field`                | yes      | Field name in `record`.                                                      |
| `showValidationErrors` | no       | Application policy; default `false`. Boolean attribute.                      |
| `selectPrompt`         | no       | Empty first choice for single selects (skipped if data has a `''` option).   |
| `describedBy`          | no       | Extra `aria-describedby` IDs (help text); the error ID is added next to them. |

Never pick the control yourself and never add Angular validators for FDL
rules; change the `FieldType` instead.

## Showing errors on submit (application policy)

FDL decides validity; the application decides when to show it. Keep a
`submitted` signal and bind it:

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
    saved: unknown;

    submit(event: Event) {
        event.preventDefault();
        this.submitted.set(true);
        if (this.contact.isValid()) this.saved = { ...this.contact.values };
    }
}
```

With errors shown, the control gets `aria-invalid="true"`, a
`.validation-error` element, and that element's ID appended to
`aria-describedby`. Display is synchronous (`readableFieldErrors()`); await
`record.isValidAsync()` before persisting when async validators exist.

## Signal helpers

Call in an injection context (constructor or field initializer) or pass
`{ injector }`. Listeners are removed when that injector's `DestroyRef` runs.
Each source/`field` may be a plain value or a signal (for example an `input()`).

```ts
import { Component, computed, input } from '@angular/core';
import { Record } from '@pmcelhaney/fdl';
import { fieldState, fieldValue, recordSignal } from '@pmcelhaney/fdl/adapters/angular';

@Component({
    selector: 'app-summary',
    template: `{{ name() }} – {{ nameState().required ? 'required' : 'optional' }}`,
})
export class SummaryComponent {
    readonly record = input.required<Record<any>>();
    // Signal<Record>; notifies on every Record `change` event.
    private readonly model = recordSignal(this.record);
    readonly printed = computed(() => this.model().print('name'));
    // The stored value of one field.
    readonly name = fieldValue<string>(this.record, 'name');
    // FdlFieldState: label, required, visible, disabled, text, errors, ...
    readonly nameState = fieldState(this.record, 'name', { showValidationErrors: false });
}
```

Outside a component: `recordSignal(record, { injector })`.

`RECORDSET_SIGNAL_EVENTS` lists the Recordset events that refresh
`recordsetSignal()`: `updated`, `page-changed`, `counts-changed`, `loading`,
`record-added`.

## Rendering a `Recordset` table

`recordsetSignal()` refreshes after loads, paging, counts, added records, and
row edits (a Recordset re-announces edits to its records as `updated`). Call
`requestHardUpdate()` (or set `pageSize`/`pageNumber`) to load the page.
Right-align numeric columns explicitly with field configuration.

```ts
import { Component, computed } from '@angular/core';
import { field, Recordset } from '@pmcelhaney/fdl';
import { FdlFieldComponent, recordsetSignal } from '@pmcelhaney/fdl/adapters/angular';

const orderFields = {
    item: field.label('Item'),
    amount: field
        .label('Amount')
        .columnClass('numeric')
        .parser(value => (value === '' ? 0 : Number(value))),
};

@Component({
    selector: 'app-orders',
    imports: [FdlFieldComponent],
    template: `
        <table>
            <thead>
                <tr>
                    <th scope="col">Item</th>
                    <th scope="col" [class]="amountClasses">Amount</th>
                </tr>
            </thead>
            <tbody>
                @for (row of rows().currentPage; track row) {
                    <tr>
                        <td><fdl-field [record]="row" field="item" /></td>
                        <td [class]="amountClasses"><fdl-field [record]="row" field="amount" /></td>
                    </tr>
                }
            </tbody>
            <tfoot>
                <tr>
                    <th scope="row">Total</th>
                    <td [class]="amountClasses">{{ total() }}</td>
                </tr>
            </tfoot>
        </table>
    `,
})
export class OrdersComponent {
    readonly recordset = new Recordset(orderFields, [
        { item: 'Paper', amount: 12 },
        { item: 'Ink', amount: 30 },
    ]);
    readonly rows = recordsetSignal(this.recordset);
    readonly amountClasses = orderFields.amount.valueOf().columnClasses().join(' ');
    readonly total = computed(() =>
        this.rows().allRecords.reduce((sum, row) => sum + Number(row.getField('amount')), 0)
    );

    constructor() {
        void this.recordset.requestHardUpdate();
    }
}
```

Each `<fdl-field>` keeps a visible label for its accessible name. To hide it
in a table, use application CSS that hides it visually (for example a
visually-hidden rule on `td .fdl-field label`), not `hideLabel()`, which
removes the label and leaves the control unnamed.

## Dependent options and loading

Declare dependencies in the model; the component reloads choices when they
change:

```ts
store: field.label('Pickup store').options({ fields: ['zip'], fetch: r => lookupStores(r.getField('zip')) })
```

While loading, the select is disabled with `aria-busy="true"` and a
`role="status"` "Loading choices…" message; results from older lookups are
ignored; a disabled field does not fetch; a failed lookup keeps the previous
choices. Changing the component's `record` or `field` clears the old choices.

## Why there is no `ControlValueAccessor`

A value accessor would make an Angular `FormControl` a second value store and
invite duplicating FDL rules as Angular validators. Submit `record.values`
after `record.isValid()`; keep touched/submitted state in the application and
feed it to `showValidationErrors`.

## Framework-independent helpers

`adapters/angular/field-state.ts` imports no Angular. Use it for custom
renderers or tests: `readFieldState`, `controlKindFor`, `displayText`,
`FieldOptionsLoader`, `acceptedInput`, `rejectsInsertion`, `filterTextControl`,
`isTextControl`, `readControlValue`, `isOptionSelected`, `showsSelectPrompt`,
`mergeDescribedBy`. Types: `FdlFieldState`, `FdlFieldStateOptions`,
`FdlControlKind`, `FdlOption`, `FdlOptionsState`, `FdlSource`,
`FdlSignalOptions`, `FdlFieldStateSignalOptions`.

## Limits and deviations from the Lit `FormElement`

- Multiple values use a native `<select multiple>` (no checkbox dropdown);
  `multipleValues(min, max)` bounds are not enforced.
- Option values are compared as strings; use string identities.
- `Record.print()` is rendered as text; Lit `template()` results are not
  rendered as markup.
- `additionalProperties()` and other Lit-only compatibility properties are not
  forwarded; no custom child controls.
- Error display is synchronous only.
- Generated IDs (`fdl-field-control-N`) are opaque and stable only per
  instance; do not use them as domain IDs.
- No prebuilt (partially compiled) Angular package yet; compile from source as
  above.
