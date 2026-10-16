# ADR-0010: Add an Angular adapter

- Status: Accepted
- Date: 2026-10-16

## Context

FDL describes field behavior independently of any renderer, but its only form
adapter is the Lit `FormElement`. Angular applications need the same contract:
one field component, accessible labels and validation state, edits parsed by the
`Record`, and the model as the source of validity. `Record` and `Recordset` are
`EventTarget`s, which Angular cannot observe without a bridge.

The repository's tests run on Jest 27 and ts-jest 27, which require
TypeScript 4. Current Angular releases need newer tooling: Angular 22 requires
TypeScript 6.0 and Node 22.22.3, and Angular 21 (in long-term support) requires
TypeScript 5.9 and Node 22.12. The core package must not depend on Angular at runtime.

## Decision

Add an Angular 21 adapter in `adapters/angular/`:

- `FdlFieldComponent` (`<fdl-field>`) is one standalone, `OnPush` component
  with signal inputs `record`, `field`, `showValidationErrors`, `selectPrompt`,
  and `describedBy`. It mirrors the Lit adapter's control selection, IDs,
  read-only output, validation display, input masking, and option loading.
- `recordSignal`, `fieldValue`, `fieldState`, and `recordsetSignal` convert
  Record and Recordset events into signals and remove their listeners through
  `DestroyRef`.
- `field-state.ts` holds model-to-rendering translation without importing
  Angular.

Declare `@angular/core` `^21.0.0` as an optional peer dependency. Type-check the
adapter with TypeScript 5.9, installed as the `typescript-angular` alias, while
the core keeps TypeScript 4. Test the component in the existing Jest setup with
Angular's JIT compiler and zoneless change detection.

Do not provide a `ControlValueAccessor`; Angular forms would become a second
value store and invite duplicating FDL rules as Angular validators.

## Options

- Angular 22: current, but requires TypeScript 6 and a newer Node 22 patch than
  the repository documents.
- Upgrade Jest, ts-jest, and TypeScript repository-wide: removes the alias, but
  changes every existing test's toolchain to add one adapter.
- Publish a separate Angular package built with `ng-packagr`: produces the
  standard Angular package format, but adds a second package and release process.
- Test only the framework-independent helpers: avoids Angular in Jest, but
  leaves rendering, ARIA, and subscription cleanup untested.
- Angular 21 in this package with an isolated compiler and JIT tests: chosen.

## Consequences and advice

Angular applications use the same `<fdl-field>` call site as Lit consumers, and
the adapter contract now has two implementations. The adapter ships as
TypeScript source, so applications must include it in their compilation and,
because FDL's core modules are JavaScript without declarations, enable
`allowJs` with `maxNodeModuleJsDepth`.
Template type checking is not run because `@angular/compiler-cli` requires
TypeScript 5.9 as the root `typescript` package. JIT tests declare signal-input
metadata that the Angular CLI would generate, with a test that detects drift.

When the repository moves to a TypeScript 5-compatible Jest toolchain, remove
the alias, add `@angular/compiler-cli`, and consider publishing a partially
compiled build. Add Angular 22 to the peer range only after testing it. Keep
model behavior in `FieldType` and `Record`; do not add Angular-specific
modifiers.
