---
name: fdl-adapter
description: >
  Build, extend, or review a UI framework adapter for FDL (React, Angular,
  Svelte, Vue, Lit, or any other renderer) that connects FDL Records,
  FieldTypes, and Recordsets to accessible controls. Use when adding or
  changing an adapter, a field component, framework hooks/stores/signals for
  Record or Recordset state, or when reviewing such work against FDL's
  adapter contract and design principles.
---

# Build an FDL framework adapter

An adapter translates FDL model state into accessible framework components and
sends user edits back to the model. It never owns business rules. Read these
before changing code; they are the source of truth and this skill only
summarizes them:

- `AGENTS.md` (workflow, Git, ADR rules)
- `docs/design-principles.md`
- `docs/adapter-contract.md`
- `docs/form-element.md` and `form-element.ts` (the Lit reference adapter)
- `docs/adr/0002-use-one-field-custom-element.md`
- `record.js`, `field-type.js`, `recordset.js`, `recordset.events.ts`

## Boundaries

```text
business rules -> semantic state -> accessible component -> visual theme
```

- Do not add framework-specific modifiers, DOM properties, lifecycle hooks, or
  component selectors to `FieldType`. Renderer configuration stays in the
  adapter.
- Do not re-implement validation in framework validators. `Record` is
  authoritative; framework form state may mirror it, never replace it.
- Expose **one** field component (ADR-0002). It chooses the native control
  from metadata; callers never pick input/select/textarea.
- Keep the framework out of the core package: framework packages are optional
  `peerDependencies` (with `peerDependenciesMeta`) plus devDependencies.
- Put model-to-view state derivation in a small framework-independent helper
  inside the adapter folder so it is testable without the framework.

## Model API the adapter uses

| Need                      | Call                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------- |
| Field definition          | `record.fieldTypeForField(field)`                                                      |
| Subscribe to changes      | `record.addEventListener('change', fn)`; event `detail.field` names the field          |
| Recordset changes         | `updated`, `page-changed`, `counts-changed`, `loading`, `record-added` events          |
| Current value             | `record.getField(field)`                                                               |
| Editable text             | `record.getFormattedField(field, 'input-focus')`                                       |
| Read-only text            | `record.print(field)`                                                                  |
| Apply an edit             | `record.parseAndSetField(field, value)` then `fieldType.onValueChange(record)`          |
| Field state               | `fieldType.label(v, record, 'form')`, `required/visible/readonly/isDisabled(v, record, 'model')`, `placeholder(v, record, 'form')`, `type(v, record, 'form')`, `minLength`, `maxLength` |
| Control choice            | `hasOptions()` → select, `hasRowCount()` → textarea, else input                        |
| Options                   | `await record.optionsForField(field)`; `hasMultipleValues()` → array values            |
| Input filtering           | `fieldType.allowInputChar(char)`                                                       |
| Errors (sync only)        | `record.readableFieldErrors(field)`                                                    |

`v` is `record.getField(field)`. Async validators are out of scope for the
synchronous error display; document that limit rather than hiding it.

## Behavior checklist

Mirror `FormElement`; each item needs a test.

1. Control selection: select / textarea / input from metadata; input `type`
   from `fieldType.type(...)`; checkbox/radio use `checked`.
2. Stable, unique per-instance control ID; visible label's `for` targets it;
   `hideLabel()` and invisible fields render no label.
3. Invisible fields render nothing.
4. Read-only fields (unless `usesCustomPrint()`) render a labeled `<output>`
   with `record.print(field)` and `aria-labelledby`.
5. Edits go through `parseAndSetField`. While the user types, a model echo must
   not replace unfinished text (`12.`, cleared text) or move the caret; blur
   reapplies the `'input-focus'` formatted value. Programmatic record changes
   still update the control.
6. Reject characters failing `allowInputChar` (beforeinput and paste/IME
   fallback) without breaking composition.
7. `showValidationErrors` defaults to `false` and is application policy. When
   true and errors exist: render `.validation-error` with a stable ID, set
   `aria-invalid="true"`, and add (never overwrite) that ID in
   `aria-describedby`. Remove only your own reference when hidden/resolved.
8. Options: disabled fields do not fetch; while loading, disable the control,
   set `aria-busy="true"`, and show a status message; ignore stale responses;
   restore declared disabled state afterwards. Option values are strings in
   native selects. Optional renderer-owned `selectPrompt` adds an empty choice
   unless the data already has one.
9. `hasMultipleValues()` selects produce arrays.
10. Required state uses native `required` (and `aria-required` on custom
    widgets); don't communicate it only via CSS.
11. Unsubscribe every Record/Recordset listener on unmount/destroy.

## Testing

- Use Jest in `tests/` (jsdom). Test the framework-independent helper directly
  and render the real component where the toolchain allows.
- If a framework cannot render under the repo's Jest setup, isolate its config
  (separate Jest project or transformer) rather than changing other tests, and
  report precisely what remains untested.
- Assert behavior and accessibility (roles, labels, ARIA), not stored
  internals. Cover unsubscribe-on-teardown.

## Documentation and records

- Add `docs/<framework>-adapter.md` with install, usage, API, and limits.
- Link it from `README.md` and `docs/adapter-contract.md`.
- Add a `CHANGELOG.md` `Unreleased → Added` entry.
- Record the decision in a new sequential ADR under `docs/adr/` (no
  radar-blips section; no Harmel-Law citation).

## Verify before committing

```sh
npm install
npm test
npm run typecheck
npm run format:check
npm run docs:build
```

All must pass. Prefer function declarations for named functions. Commit only
your task's files with a concise imperative message.

## Review mode

When reviewing an adapter, walk the behavior checklist item by item against
the code and tests, run the verification commands, and report each gap with a
file:line reference and a concrete failure scenario. Fix confirmed gaps (with
tests) rather than only listing them when you have been asked to.
