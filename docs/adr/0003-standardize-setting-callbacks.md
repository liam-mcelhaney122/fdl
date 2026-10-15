# ADR-0003: Standardize fixed and calculated field settings

- Status: Accepted
- Date: 2026-10-15

## Context

Some modifiers accept only fixed values, some receive the record first, and
cell/row classes receive the value first. Formatters already receive value,
record, and context at runtime. These differences make related modifiers harder
to learn and leave declarations and consumer behavior inconsistent.

## Decision

Use `FieldSetting<T, Result, R>` for supported field settings: either a result or
`(value: T, record: Record<R>, context: string) => Result`. Resolve settings at
read time, with immutable specialization and each modifier's documented
composition rule. Labels use the last declaration and receive the current field
value rather than a previous label.

Use `ColumnSetting<Result>` for sortability and column widths. Its callback
receives only `(context)`, because an entire column has no single field value
or record. Keep the table's existing first-visible-record
policy for calculated heading labels/alignment; skip those callbacks on empty
tables and use fixed metadata or fallbacks.

Use `model` context for model rules and validation. Use `form`, `table`, and
`table-header` for display settings. Direct field reads default to `model` and
column reads default to `table`. Callbacks should be pure. Model validation
resolves settings against its candidate value, including custom emptiness rules
added after requiredness.

Use `DefaultSetting<T, R>` for fixed defaults or factories of `(record, context)`;
a default factory has no existing value to receive. Clearing resolves
all defaults against the pre-clear snapshot before replacing values. Appending
first creates a record with undefined fields; defaults cannot depend on another
default having run.

Keep operations' necessary inputs: comparison needs two values, filtering needs
search text, reduction needs a collection, parsing needs input, and validation
needs model/view values and validation information. Forward record/context
through value transformation pipelines. Keep structural configuration and
deprecated renderer APIs on their existing contracts.

## Options considered

- Keep the inconsistent callback signatures: smaller change, but preserves the
  learning burden and missing dynamic-setting support.
- Force every modifier into one callback: loses necessary operation inputs and
  invents a record for column-wide behavior.
- Standardize result settings and retain operation inputs: chosen because the
  signature describes the information actually available at evaluation time.

## Consequences and advice

Record-first callbacks and direct state/label getters require migration. Do not
infer callback meaning from arity; use the declared contract. Document fixed
and calculated call forms together, and test the actual consumer and model
validation in addition to stored metadata. Return a complete label instead of
using the former previous-label argument. Keep business decisions in model
rules and visual variation in display settings.

Column callbacks use context only, and default factories use record and context.
Migrate the former three-argument forms by removing unused value/record slots.
