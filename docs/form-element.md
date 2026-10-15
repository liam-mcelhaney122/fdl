# Form elements

`FormElement` is the Lit base class for FDL field controls. Extend it when you
need a custom element that presents one field from a `Record`.

The base class owns the FDL integration:

- it requires a `record` and `field` property;
- it resolves the field's `FieldType` after the first update;
- it creates the child control named by `FieldType.tag()`;
- it copies the field value and modifiers (`label`, `required`, `disabled`,
  `placeholder`, and so on) to that child;
- it loads `FieldType.options()` when the field has options; and
- it listens for child events and synchronizes the value back to the record;
- it gives each instance a stable, unique control ID and associates the rendered
  label with that control; and
- when requested by the adapter, it exposes synchronous model validation through
  an error message and the control's ARIA state.

The complete ownership boundary is documented in the
[form adapter contract](./adapter-contract.md).

## Properties

| Property | Required | Purpose |
| --- | --- | --- |
| `field` | Yes | Names the field in `record` that this instance renders. |
| `record` | Yes | Supplies the field definition, value, and model behavior. |
| `showValidationErrors` | No | When `true`, exposes current synchronous FDL errors in the UI and accessibility tree. Defaults to `false`; the application or adapter decides when to set it. The corresponding attribute is `show-validation-errors`. |

## A unified field component

Applications should expose one field custom element and let `FormElement`
create the native control named by the field metadata. Preserve the base
stylesheet by overriding its static getter, not by assigning a static class
field:

```ts
import { css } from 'lit';
import FormElement from '../form-element';

export class FdlField extends FormElement {
  static get styles() {
    return css`
      ${FormElement.styles}

      input, select, textarea {
        border: 1px solid #9ca3af;
        border-radius: 0.25rem;
        padding: 0.5rem;
      }
    `;
  }
}

customElements.define('fdl-field', FdlField);
```

Always use that component as the outer form control and pass the record and
field. The `FieldType` tag names the native child created inside it:

```ts
const contactMethod = new FieldType().with
  .tag('select')
  .and.label('Preferred contact method')
  .and.options([
    { text: 'Choose a method', value: '' },
    { text: 'Email', value: 'email' },
    { text: 'Phone', value: 'phone' },
  ]);

const record = new Record({ contactMethod }, { contactMethod: '' });
```

```ts
html`<fdl-field field="contactMethod" .record=${record}></fdl-field>`
```

Do not create separate `<fdl-input>`, `<fdl-select>`, or `<fdl-textarea>` APIs.
Use `tag('input')`, `tag('select')`, or `tag('textarea')` in the field metadata
and keep `<fdl-field>` stable at the call site.

## Labels, IDs, and read-only values

`FormElement` creates an opaque control ID for each component instance. The ID
is stable for that instance and is not the field name. Do not select controls or
encode business behavior by relying on its generated value. The visible label's
`for` attribute references that ID.

Read-only fields that do not use a custom print control render their printed
value in a semantic `<output>`. The label references the output and the output
also names the label with `aria-labelledby`. This keeps the read-only value and
its label connected without pretending the value is editable.

## Choosing when to show validation

FDL determines whether the current record value is valid. The application owns
the interaction policy for when an error should be shown—for example, after a
field is touched or after the first submission attempt. Express that decision
through the adapter property:

```ts
html`<fdl-field
  field="contactMethod"
  .record=${record}
  .showValidationErrors=${submissionAttempted}
></fdl-field>`
```

When the property is true and the field has synchronous model errors,
`FormElement` renders a readable `.validation-error` element, sets
`aria-invalid="true"` on the control, and connects the two with
`aria-describedby`. When the property is false or the value becomes valid, it
removes that error element and the ARIA state. CSS may style
`.validation-error`, `[aria-invalid="true"]`, or both, but must not decide
whether the model is valid.

This behavior uses `Record.readableFieldErrors()`, so it covers synchronous FDL
validators only. Applications that use asynchronous validators must await the
async Record APIs and render their result through an application-specific
adapter. See [Current limits](./adapter-contract.md#current-limits).

## Native dropdowns

For a native `select`, `FormElement` converts the option objects returned by
`.options(...)` into `<option>` nodes. Each option should provide `text` and
`value` (or use the documented `options({ data, text, value })` mapping).
Include an empty option when the field starts empty, and use `.required()` or
`.requiredWhen(...)` if choosing an option is part of validation.

See the working example in [`examples/fdl-input`](../examples/fdl-input/) for
the unified `fdl-field`, conditional validation, and a live `Record` preview.

When a select field has `multipleValues()`, the adapter presents a checkbox
dropdown. Its summary shows the selected option or the number selected. Users
can check any combination, clear the selection, and close with Done, Escape,
or a click outside. Changes synchronize with the record as an array. Required,
validation, and disabled state are exposed on the dropdown trigger.
