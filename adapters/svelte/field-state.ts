import type FieldType from '../../field-type.js';
import type Record from '../../record.js';

/** The semantic element an adapter renders for a field. */
export type FieldControl = 'input' | 'select' | 'textarea' | 'output';

export interface FieldOption {
    text: unknown;
    value: unknown;
}

export interface FieldStateOptions {
    /** Application policy: expose synchronous model errors. Defaults to `false`. */
    showValidationErrors?: boolean;
}

/**
 * A renderer-independent snapshot of the model state that one field control shows.
 * It contains no DOM IDs, timing policy, or styling decisions.
 */
export interface FieldState {
    field: string;
    fieldType: FieldType<any>;
    value: unknown;
    control: FieldControl;
    /** The native input type, when the field declares one. */
    inputType?: string;
    label?: string;
    showLabel: boolean;
    required: boolean;
    visible: boolean;
    readonly: boolean;
    /** The field's declared disabled state, not including option loading. */
    disabled: boolean;
    placeholder?: string;
    multiple: boolean;
    rows?: number;
    minLength?: number;
    maxLength?: number;
    autocomplete?: string;
    pattern?: string;
    step?: unknown;
    max?: unknown;
    list?: string;
    /** Display text for an editable control (`"input-focus"` context). */
    formattedValue: string;
    /** Display text for a read-only output. */
    printedValue: string;
    /** Synchronous model errors that the adapter should currently display. */
    errors: string[];
}

function defined<T>(value: T | null | undefined): T | undefined {
    return value === null || value === undefined ? undefined : value;
}

function text(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
}

function patternSource(pattern: unknown): string | undefined {
    if (pattern instanceof RegExp) return pattern.source;
    return typeof pattern === 'string' && pattern ? pattern : undefined;
}

/** Choose the native control for a field, matching the Lit `FormElement`. */
export function controlFor(fieldType: FieldType<any>, readonly: boolean): FieldControl {
    if (readonly && !fieldType.usesCustomPrint()) return 'output';
    if (fieldType.hasOptions()) return 'select';
    if (fieldType.hasRowCount()) return 'textarea';
    return 'input';
}

/** Keep only characters that the field's `inputMask` accepts. */
export function acceptedInput(fieldType: FieldType<any>, input: string): string {
    return [...input].filter(character => fieldType.allowInputChar(character)).join('');
}

/** Errors to expose under the application's display policy. */
export function visibleFieldErrors(
    record: Record<any>,
    field: string,
    options: FieldStateOptions = {}
): string[] {
    if (!options.showValidationErrors) return [];
    const fieldType = record.fieldTypeForField(field);
    if (!fieldType.visible(record.getField(field), record, 'model')) return [];
    return record.readableFieldErrors(field);
}

/** Read the current model state for one field of a Record. */
export function readFieldState(
    record: Record<any>,
    field: string,
    options: FieldStateOptions = {}
): FieldState {
    const fieldType = record.fieldTypeForField(field);
    const value = record.getField(field);
    const readonly = Boolean(fieldType.readonly(value, record, 'model'));
    const label = fieldType.label(value, record, 'form');
    const type = fieldType.type(value, record, 'form');
    const visible = Boolean(fieldType.visible(value, record, 'model'));
    const control = controlFor(fieldType, readonly);
    return {
        field,
        fieldType,
        value,
        control,
        inputType: typeof type === 'string' && type ? type : undefined,
        label: label ? String(label) : undefined,
        showLabel: Boolean(label) && !fieldType.hideLabel() && visible,
        required: Boolean(fieldType.required(value, record, 'model')),
        visible,
        readonly,
        disabled: Boolean(fieldType.isDisabled(value, record, 'model')),
        placeholder: fieldType.placeholder(value, record, 'form') || undefined,
        multiple: Boolean(fieldType.hasMultipleValues()),
        rows: fieldType.hasRowCount() ? defined(fieldType.rowCount()) : undefined,
        minLength: defined(fieldType.minLength(value, record, 'model')),
        maxLength: defined(fieldType.maxLength(value, record, 'model')),
        autocomplete: defined(fieldType.autocomplete()),
        pattern: patternSource(fieldType.pattern()),
        step: defined(fieldType.step()),
        max: defined(fieldType.max()),
        list: defined(fieldType.list()),
        formattedValue:
            control === 'output' ? '' : text(record.getFormattedField(field, 'input-focus')),
        printedValue: control === 'output' ? text(record.print(field)) : '',
        errors: visibleFieldErrors(record, field, options),
    };
}
