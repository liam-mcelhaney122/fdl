# ADR-0002 — Use one custom element for all field controls

## Date

2026-07-30

## Status

Accepted

## Decision

**Expose one `<fdl-field>` custom element for editing any FDL field. The
component chooses and creates the appropriate native control from the field's
metadata; consumers do not choose a field-specific custom element.**

The component owns the mapping from field metadata to accessible HTML and the
synchronization between that control and its `Record`. Input, select, and
textarea remain internal rendering choices. The current native adapter chooses
a select when a field provides options, a textarea when `rowCount()` is
configured, and an input otherwise.

This decision does not reverse the deprecation of DOM-specific `FieldType`
modifiers. A future adapter may derive the native control from stable field
semantics or renderer-local configuration. That evolution must preserve the
single `<fdl-field>` API at the call site.

## Context

The form example had evolved into separate `<fdl-input>` and `<fdl-select>`
custom elements. Its callers also passed a `control` attribute when they needed
a textarea. This made consumers repeat a rendering decision that the field
definition already described and split identical label, state, event, record,
and styling behavior across multiple wrappers.

The original design used one `<fdl-field>` element. `FormElement` resolved the
field's `FieldType`, created its configured child control, copied the field
state into that control, and synchronized edits back to the `Record`. Restoring
that boundary aligns the example with the intended dependency direction:

```text
business rules -> semantic state -> accessible component -> visual theme
```

The decision is limited to the outer field-component API. It does not require
every field to use identical markup, nor does it prevent the component layer
from supporting richer interactions when their semantics require them.

## Applicable principles

- **Keep business rules, UI semantics, and visual presentation orthogonal.**
  FDL provides field behavior and state; the component selects accessible
  structure; CSS supplies appearance.
- **Keep dependency flow moving forward.** A consumer should provide a field
  and record, not inspect model metadata and reproduce renderer branching.
- **Keep modifiers renderer-independent.** The stable decision is the unified
  component boundary, not a control selector in model vocabulary.
- **Use the model as the source of truth for model behavior.** Requiredness,
  visibility, disabled state, parsing, formatting, and validation continue to
  come from `FieldType` and `Record`.

## Options considered

### One `<fdl-field>` that builds the native control from metadata

This is the selected option.

Pros:

- gives consumers one stable API for every field;
- keeps native-control selection in the component semantics layer;
- centralizes labels, state propagation, events, record synchronization, and
  shared styling;
- allows a field's rendering metadata to change without changing its call
  site; and
- matches the original implementation and the existing responsibilities of
  `FormElement`.

Cons:

- makes `<fdl-field>` responsible for control-specific setup and behavior;
- requires its styles and tests to cover every supported native control; and
- requires a clear renderer-side mapping as DOM-specific field modifiers are
  retired.

### Separate custom elements for input, select, and textarea fields

Pros:

- allows each wrapper to contain narrowly targeted styles; and
- makes the native control visible in the outer tag name.

Cons:

- forces consumers to branch on field metadata;
- duplicates a common field-component contract across several elements;
- allows wrappers to drift in accessibility, events, state handling, and
  visual treatment; and
- makes changing a field's interaction require editing both metadata and
  markup.

### One field element with a caller-supplied `control` override

Pros:

- retains a single custom-element name; and
- allows a view to override the native control directly.

Cons:

- creates two competing sources of truth;
- requires every caller to understand renderer details; and
- permits markup and field metadata to disagree.

## Consequences

- The public example uses `<fdl-field>` for input, select, and textarea fields.
- Field definitions or renderer-local mappings determine the native child;
  catalog render functions no longer choose a custom-element type or pass a
  `control` override.
- `<fdl-input>` and `<fdl-select>` are removed rather than maintained as
  aliases, so any code copied from the example must migrate to `<fdl-field>`.
- Shared field presentation lives in one component stylesheet, while selectors
  may still target the native control where their semantics differ.
- Tests must verify representative input, select, and textarea paths through
  the same custom element.
- Richer controls may require additional internal rendering strategies, but
  they must not fragment the outer API into one custom element per field type.
- The adapter derives native control selection from field metadata without
  exposing a control-selector modifier in the reusable model.

## Advice

- **Patrick McElhaney, 2026-07-30:** The original implementation used one
  `<fdl-field>` that built the appropriate native control from field metadata.
  Record that design and refactor the field-specific components back to it.

## References

- [FDL design principles](../design-principles.md)
- [FormElement documentation](../form-element.md)
