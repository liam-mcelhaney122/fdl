# ADR-0004: Chain modifiers directly on field type builders

## Status

Accepted — 2026-10-15.

## Context

Field definitions previously alternated between `FieldTypeBuilder` and
`FieldType` after every modifier. Sentence-style aliases such as `with` and
`and` selected the builder API. That distinction was necessary because a
modifier and a runtime getter can share a name: `required()` either declares a
rule or evaluates it, depending on the receiver.

The aliases make declarations longer and obscure where construction ends and
runtime use begins. Reusable primitives also need to remain safe to specialize
without changing other definitions.

## Decision

- Export an immutable `field` instance and typed primitives. Keep the
  `FieldTypeBuilder` class internal to the implementation.
- Keep modifiers on builders. Each modifier returns a new builder, allowing
  chains such as `string.required().maxLength(100)`.
- Keep finalization internal to model input boundaries. Each finalization
  creates a runtime `FieldType` with independent option caches and result text.
- Give `FieldType` an identity `valueOf()` method.
- Let `Record`, `Recordset`, and `Record#addField()` accept either kind of
  definition and call `valueOf()` at their input boundary. Runtime consumers
  receive finalized field types.
- Remove sentence-style aliases. Specialize reusable definitions directly
  instead of converting runtime types back into definitions.

## Options considered

Adding modifiers to `FieldType` itself would collide with runtime methods such
as `required()`, `label()`, and `options(record)`. Requiring explicit finalization
at every record declaration would expose a conversion the model can perform
reliably. Retaining the aliases would preserve two construction syntaxes and
leave the original alternating return types in place.

## Consequences and advice

This is a breaking API change. Definition authors remove aliases and use
`field` rather than a constructor for custom definitions. Pass chains directly
to records and recordsets. Obtain runtime behavior through
`Record#fieldTypeForField()` or `Recordset#getFieldType()`; consumers do not need
to know the builder class or call `valueOf()`.

Keep reusable definitions as builders. Keep a finalized type when repeatedly
loading options so its runtime cache remains useful. A recordset finalizes its
builders once and shares those types with its rows. Already finalized types
retain their identity when supplied to the model.
