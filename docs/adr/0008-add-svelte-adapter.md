# ADR-0008: Add a Svelte adapter outside the core runtime

- Status: Accepted
- Date: 2026-10-16

## Context

FDL's model is renderer-independent, but its only form adapter is the Lit
`FormElement`. Svelte applications otherwise have to rediscover the adapter
contract: control selection, stable label IDs, parsing edits, preserving the
caret during input, read-only output, option loading with stale-result
protection, and validation ARIA. The design principles forbid moving any of
that into `FieldType`, and Svelte must not become a runtime dependency of
applications that do not use it.

Svelte 5 is ESM-only and compiles `.svelte` files, while this repository tests
with Jest 27, which does not read package `exports`.

## Decision

Add the adapter in `adapters/svelte/`, outside the root runtime modules and
`index.js`. Declare `svelte@^5.20.0` as an optional peer dependency and a
development dependency.

The adapter has three layers:

- `field-state.ts`: framework-independent helpers that read a field's
  model-derived state (control choice, label, requiredness, visibility,
  disabled and read-only state, formatted and printed values, and errors under
  the application's display policy).
- `stores.ts`: `recordStore`, `recordsetStore`, and `fieldStore`, plain
  implementations of the Svelte store contract. `fieldStore` also owns option
  loading, disabled deferral, and stale-result protection, and exposes
  `edit(viewValue)` for parsing edits into the Record.
- `fieldControl` and `FdlField.svelte`: a Svelte action that synchronizes a
  native control's value and edits imperatively, and one runes-based field
  component that renders the label, control or output, loading status, and
  validation error declaratively.

Following ADR-0002, Svelte applications use one `FdlField` component for every
field. It uses `$props.id()` for per-instance IDs.

Tests compile components with a small Jest transformer around
`svelte/compiler` and resolve Svelte's `exports` with a Jest resolver limited to
Svelte and its runtime dependencies. Prettier formats `.svelte` files with
`prettier-plugin-svelte`.

## Options

- Svelte stores, an action, and one component in a separate adapter folder:
  chosen. The stores and action are usable without the component, and the
  core package stays framework-free.
- Wrap the Lit `<fdl-field>` custom element in Svelte: avoids duplicate
  behavior, but keeps Lit and shadow DOM in Svelte applications, prevents
  scoped Svelte styling and server rendering, and conflicts with the roadmap
  item to remove the Lit runtime dependency.
- Publish a separate `@pmcelhaney/fdl-svelte` package: cleaner dependency
  boundaries, but requires release infrastructure the repository does not
  have yet. The folder can be extracted later without changing its API.
- Only document a recipe: least code, but every application would reimplement
  caret preservation, stale option handling, and validation ARIA.

## Consequences

- Svelte applications get the same adapter contract as Lit without adding
  Svelte-specific modifiers to `FieldType`.
- The component uses a native `<select multiple>` for multiple values rather
  than the Lit checkbox dropdown, and does not forward deprecated
  custom-element properties such as `additionalProperties()`.
- Value synchronization lives in an action rather than `bind:value`, because a
  text control must not be rewritten while its own input is being parsed.
- The adapter ships as source; applications compile it with their Svelte
  toolchain.
- Jest configuration now includes a Svelte transformer and resolver. A future
  Jest upgrade that supports `exports` can remove the resolver.

## Advice

- Keep shared behavior in `field-state.ts` and the stores so a future adapter
  can reuse it, and keep markup, IDs, and ARIA in the component.
- When the Lit adapter's contract changes, update this adapter and its tests
  in the same change.

## References

- [Svelte adapter](../svelte-adapter.md)
- [Form adapter contract](../adapter-contract.md)
- [ADR-0002: Use one custom element for all field controls](./0002-use-one-field-custom-element.md)
