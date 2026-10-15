# ADR-0005: Scope modifier callback inputs to their operation

- Status: Accepted; cell-class context superseded by [ADR-0006](./0006-distinguish-column-and-cell-classes.md)
- Date: 2026-10-15
- Supersedes the uniform field-setting and default-factory signatures in ADR-0003

## Context

ADR-0003 applied `(value, record, context)` to most calculated settings. This
made record state and row presentation look dependent on a particular field
value, and offered rendering context to model rules. Unused placeholder
arguments obscured the information each operation actually needs.

## Decision

Use `RecordSetting<Result, R>` with `(record)` for row classes, labels,
placeholders, input types, requiredness, visibility, disabled/read-only state,
and length bounds. Default factories also receive only the record.

Use `ValueSetting<T, Result, R>` with `(value, record)` for emptiness. Its value
can be an unstored validation candidate. Retain `FieldSetting` with
`(value, record, context)` for cell classes and alignment, and retain that
signature for formatter, parser, and template pipelines. Column settings retain
`(context)` because a column has no owning record. Comparison, filtering,
reduction, options, validators, structural settings, and deprecated modifiers
keep their operation-specific contracts.

Use `rowClasses(record)` for runtime row-class resolution. Existing field-binding
getters keep their call forms but pass only the declared callback inputs.
Fixed values, immutable specialization, composition, and read-time evaluation
remain supported. Do not infer callback semantics from its parameter count.

## Options

- Retain one uniform signature: easy to memorize, but misrepresents row and
  record scope and invites context-dependent model rules.
- Remove all callbacks: loses useful calculated metadata and model rules.
- Match inputs to scope: chosen to express each operation's real dependencies.

## Consequences and advice

This changes public callback contracts. Migrate record settings by removing the
value/context slots; read a particular value explicitly from the record. Remove
context from default factories and emptiness predicates. Supply the record to
`rowClasses`. Define separate field specializations or consumer policies when
presentation differs by context outside cell display and value pipelines.

Requiredness and length validation must use the same record rules as consumers.
Emptiness must check the candidate value, including rules added after required.
Keep types, documentation, runnable examples, and adapter tests in agreement.
