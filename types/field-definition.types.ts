import type FieldType from '../field-type.js';
import type FieldTypeBuilder from '../field-type-builder';

/** A reusable definition or an already finalized runtime field type. */
export type FieldDefinition<T = unknown> = FieldType<T> | FieldTypeBuilder<T>;
