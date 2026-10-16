# Form adapter contract

FDL describes reusable field behavior without choosing a DOM structure or an
application interaction policy. A form adapter combines that model with an
accessible control. The application chooses workflow and presentation.

## Responsibilities

| Layer                                            | Owns                                                                                                                                                                                                       | Does not own                                                                                                          |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| FDL (`FieldType`, `Record`, and `Recordset`)     | Values, parsing, formatting, options, dependencies, requiredness, visibility, disabled and read-only state, and validation results                                                                         | DOM elements, generated IDs, focus, error-display timing, form layout, or visual styling                              |
| Form adapter (`FormElement` or another renderer) | Selecting and configuring the control, accessible labels and descriptions, semantic read-only output, translating shown model state to native and ARIA state, and sending edited values back to the Record | New business rules, when the application considers a field touched, submission policy, colors, spacing, or typography |
| Application and CSS                              | Workflow such as touched/submitted state, when validation is shown, submission and persistence, layout, theme, and visual error treatment                                                                  | Recomputing FDL validity in CSS or treating browser appearance as the business rule                                   |

Information moves in one direction:

```text
FDL business state -> adapter semantics -> application presentation
```

The adapter may expose a setting that carries an application decision, but it
must not move that policy into `FieldType`. `FormElement.showValidationErrors`
is one such setting: FDL supplies errors, the application decides when they are
shown, and the adapter creates the accessible relationship.

FDL ships three adapters that implement this contract: the Lit
[`FormElement`](./form-element.md) described below, the
[React adapter](./react-adapter.md) (`FdlField` with `useFieldState`,
`useFieldOptions`, `useRecord`, and `useRecordset`), and the
[Svelte adapter](./svelte-adapter.md) (one `FdlField` component, field stores,
and a native-control action). A change to this contract applies to all of them.

## Native `FormElement` behavior

For the built-in Lit adapter, `field` and `record` identify the model field.
After its first update, the adapter:

1. resolves the field's `FieldType`;
2. chooses a native `select` when the field provides options, a `textarea` when
   `rowCount()` is configured, and an `input` otherwise;
3. copies the formatted value and supported field state to that element;
4. creates a stable, per-instance ID and associates the visible label with it;
5. translates control events into `Record.parseAndSetField()` calls; and
6. refreshes the control when the Record announces a change.

Native `input`, `select`, and `textarea` elements receive their corresponding
properties. Native `select` options are created from `FieldType.options()`.
Read-only fields use a labeled `output` unless `usesCustomPrint()` requests the
configured child control for compatibility.

Generated IDs are adapter details. They are unique and stable for the lifetime
of an instance, but callers must not parse them or use them as domain IDs.

## Validation display

`showValidationErrors` defaults to `false`. An application can set it to
`true` after its chosen interaction boundary, such as blur, touch, or a submit
attempt. If synchronous `Record` validation then reports errors, the adapter:

- renders a connected, readable `.validation-error` element;
- sets `aria-invalid="true"` on the editable control or read-only output; and
- adds that error element's ID to `aria-describedby` without discarding other
  description IDs.

The adapter removes only its own error-description reference when the errors
are hidden or resolved. Visual treatment belongs to application CSS. A border,
icon, or color may reinforce the state, but it is not the source of validity.

## Custom child controls

The built-in adapter chooses among native controls from stable field metadata:
options imply a `select`, configured `rowCount()` implies a `textarea`, and
other fields use an `input`. Custom controls belong in a renderer-specific
adapter rather than in `FieldType` metadata.

The outer label's `for` association works directly for native labelable
elements. A custom element must implement the appropriate form-associated or
shadow-DOM accessibility behavior; receiving `label`, `id`,
`aria-invalid`, and `aria-describedby` on its host does not automatically label
an unrelated internal input.

## Current limits

- Validation display uses synchronous `Record.readableFieldErrors()`. The
  adapter does not await asynchronous validators, cancel stale requests, or
  choose how pending and server errors are displayed.
- The Lit host is not a form-associated custom element and does not use
  `ElementInternals`. Native controls inside its shadow root do not by
  themselves define application submission or persistence; submit Record data
  explicitly.
- FDL validation is authoritative. Native constraint-validation UI may provide
  useful control behavior, but browser validity is not a substitute for
  `Record.isValid()`.
- The base adapter creates one configured child control. A multiple-value
  native select also gets a checkbox dropdown with a summary, Clear, and Done.
  Other composite controls, custom focus routing, live regions, and field-level
  error summaries require a specialized adapter.
- `multipleValues(min, max)` exposes count metadata but does not enforce those
  bounds in the model or checkbox dropdown. Add an explicit validator when
  selection counts must be constrained.
- Generated IDs are stable only for the lifetime of the component instance;
  they are not persisted across removal, recreation, or server rendering.

## Table class scopes

`columnClass` expresses shared column presentation. Resolve `columnClasses()`
without a record or rendering context and attach the resulting classes to the
column's `<col>`, `<th>`, and each data `<td>`. Resolve once per column on each
render, including when no records are visible. A spanning empty-state cell has
no individual column and keeps its own classes.

For each data cell, combine its column classes with
`cellClasses(value, record)`. Cell callbacks receive only the current value and
owning record. Resolve `rowClasses(record)` for the containing row separately.
