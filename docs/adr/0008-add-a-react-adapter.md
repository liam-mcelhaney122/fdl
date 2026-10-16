# ADR-0008 — Add a React adapter beside the Lit adapter

## Date

2026-10-16

## Status

Accepted

## Decision

**Provide a React adapter in `adapters/react/` that implements the form adapter
contract with one `FdlField` component and hooks built on
`useSyncExternalStore`. React is an optional peer dependency; the core model
does not import it.**

The adapter has three layers:

- `field-state.ts` derives renderable field state, visible errors, masked
  input, and option loading from `FieldType` and `Record` without importing
  React;
- `hooks.ts` subscribes React to Record and Recordset events
  (`useRecord`, `useRecordVersion`, `useFieldState`, `useFieldOptions`, and
  `useRecordset`); and
- `fdl-field.tsx` renders the accessible native control.

Applications import it from `@pmcelhaney/fdl/adapters/react`. The package keeps
its current resolution rules instead of adding an `exports` map.

## Context

Roadmap item 7 calls for a parallel React implementation that uses the same
declarative FDL model. The Lit `FormElement` already defines the behavior an
adapter must provide: control selection from field metadata, stable label and
control association, labeled read-only output, application-controlled
validation display with ARIA state, text editing that does not overwrite the
user's text or caret, masked input, select prompts, multiple values, and
option loading that ignores stale results and waits while a field is disabled.

`Record` is an `EventTarget` that announces every change, and `Recordset`
announces collection updates. Those events are enough for an external-store
subscription; no model change is required.

The package has no build step and publishes TypeScript sources, and its
existing consumers import some files by path. An `exports` map would restrict
those deep imports.

## Applicable principles

- **No framework-specific modifiers on `FieldType`.** The adapter reads
  existing field metadata and keeps renderer configuration, such as the select
  prompt and extra description IDs, in component props.
- **One field component API** ([ADR-0002](./0002-use-one-field-custom-element.md)).
  React callers render `FdlField` for every field.
- **The model is the source of truth.** Validity, requiredness, parsing, and
  options come from `Record`; the adapter only translates them.
- **Forward dependency direction.** React depends on FDL; FDL does not depend
  on React.

## Options considered

### Hooks plus one `FdlField` component in `adapters/react/`

This is the selected option.

Pros:

- idiomatic React: controlled native elements, `useId`, and
  `useSyncExternalStore`;
- the framework-independent helper can be tested without rendering and could be
  shared by other adapters;
- hooks let applications build specialized controls while keeping FDL as the
  source of truth; and
- React stays optional for consumers who use only the model or Lit.

Cons:

- a second adapter must track contract changes made to `FormElement`;
- consumers need a TypeScript-aware toolchain, as with the existing sources; and
- the adapter path is longer than a dedicated subpath export.

### Wrap the Lit `<fdl-field>` custom element in React

Pros:

- reuses one implementation of control behavior.

Cons:

- keeps Lit as a runtime dependency for React applications, which conflicts
  with roadmap item 4;
- shadow DOM separates React-rendered labels and descriptions from the control;
  and
- React's custom-element property and event handling adds glue without
  improving accessibility.

### Publish a separate `@pmcelhaney/fdl-react` package

Pros:

- separate versioning and a clear dependency boundary.

Cons:

- requires release infrastructure the repository does not have yet; and
- separates the adapter from the contract tests it must stay aligned with.

## Consequences

- `react` and `react-dom` are optional `peerDependencies` (React 18 or 19) and
  development dependencies for tests. `tsconfig.json` enables
  `"jsx": "react-jsx"`.
- Jest covers the adapter in `tests/react-adapter.test.tsx` and
  `tests/react-field-state.test.ts`, mirroring the Lit accessibility tests.
- Contract changes must be applied to both adapters, and
  [the adapter contract](../adapter-contract.md) names both.
- The React adapter uses a native `<select multiple>` instead of the Lit
  checkbox dropdown and does not interpret deprecated renderer-specific
  metadata.
- Each observed Record or Recordset receives one passive change-counting
  listener for its lifetime; per-component subscriptions are removed on
  unmount.

## Advice

- Keep model-derived computation in `field-state.ts` so it stays testable and
  framework-independent.
- Add an `exports` subpath only together with a build step or an explicit
  decision about existing deep imports.

## References

- [React adapter](../react-adapter.md)
- [Form adapter contract](../adapter-contract.md)
- [FDL design principles](../design-principles.md)
