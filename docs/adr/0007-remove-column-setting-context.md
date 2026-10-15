# ADR-0007: Remove context from column settings

- Status: Accepted
- Date: 2026-10-15
- Supersedes the column-setting context contract in ADR-0003 and ADR-0005

## Context

Sortability and column widths describe a column without needing a rendering
context. Their callbacks need no field value or owning record either.
Column classes already follow this scope with callbacks taking no arguments.

## Decision

Define `ColumnSetting<Result>` as a fixed result or `() => Result`. Apply this
to `sortable`, `minColumnWidth`, `maxColumnWidth`, and `targetColumnWidth`.
Their runtime getters and setting resolver also take no context. The table
calls the getters without arguments for sorting, width allocation, resizing,
and diagnostics. Resolve callbacks on each read, preserving specialization
and fixed-value behavior.

## Options

- Keep context: adds an unnecessary input and encourages consumer-specific
  policy in shared column definitions.
- Remove callbacks: loses useful calculations from application state.
- Keep callbacks without arguments: chosen to match column scope.

## Consequences and advice

Remove context parameters from callbacks and context arguments from getter
calls. Callbacks can close over application state; consumers must request an
update when that state changes. Use distinct field definitions when consumers
need different column policies. Other callback contracts remain unchanged.
