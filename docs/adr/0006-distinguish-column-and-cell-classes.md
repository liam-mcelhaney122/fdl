# ADR-0006: Distinguish column classes from cell classes

- Status: Accepted
- Date: 2026-10-15
- Supersedes the cell-class context signature in ADR-0005

## Context

A whole column and an individual cell have different presentation scopes.
Passing context to a cell callback makes callers branch on rendering location
when declaring shared column presentation. A column has no single value or
owning record, including when a table is empty.

## Decision

Add `columnClass(classes)` with a string, string array, or callback taking no
arguments and returning either. Repeated declarations accumulate in order,
copy supplied arrays, and preserve immutable specialization. Expose results
through `FieldType#columnClasses()` without arguments.

The table resolves shared classes once per column per render and explicitly
assigns them to that column's `col`, `th`, and every data `td`. Data cells also
receive their own cell classes. A spanning empty-state cell has no individual
column, so it retains its own classes. Column headings and col elements receive
the shared classes even with no data rows.

Use `ValueSetting<T, string | string[]>` for `cellClass`; callbacks and the
`cellClasses(value, record)` getter receive no context. Row classes continue
to receive the record. Other modifier contracts remain as defined in ADR-0005.

## Options

- Keep rendering context on cell classes: requires branching to express shared
  column presentation and does not model the column as a separate scope.
- Apply classes only to `col`: HTML does not propagate class membership to
  headings and data cells.
- Define explicit column scope: chosen to express shared presentation directly
  while preserving value-dependent cell rules.

## Consequences and advice

Move shared presentation to `columnClass(...)` and value-specific exceptions
to `cellClass((value, record) => ...)`. Do not select an arbitrary record for
column callbacks. Callbacks can close over application state; consumers must
render again to reflect a change. CSS owns the visual effect and which
properties apply to each element; FDL only supplies the semantic class intent.
