/**
 * Framework-independent translation of FDL field state for the React adapter.
 *
 * Nothing in this module imports React. It reads `FieldType` and `Record`
 * through their public APIs so the derivation can be tested without rendering.
 */
import FieldType from '../../field-type.js';
import Record from '../../record.js';

/** The semantic element chosen for a field. */
export type FieldControl = 'input' | 'select' | 'textarea' | 'output';

export interface FieldOption {
    text: unknown;
    value: unknown;
}

/** A snapshot of the model state an accessible field component needs. */
export interface FieldState {
    fieldType: FieldType;
    /** The editable native control chosen from field metadata, or `output` when read-only. */
    control: FieldControl;
    /** The stored model value. */
    value: unknown;
    /** The `"input-focus"` formatted text used by editable text controls. */
    displayValue: string;
    /** The `Record.print()` text used by read-only output. */
    printedValue: string;
    label: string;
    /** Whether a visible label should be rendered. */
    showLabel: boolean;
    visible: boolean;
    required: boolean;
    disabled: boolean;
    readOnly: boolean;
    multiple: boolean;
    hasOptions: boolean;
    inputType?: string;
    placeholder?: string;
    rows?: number;
    minLength?: number;
    maxLength?: number;
    max?: string;
    step?: number;
    pattern?: string;
    autoComplete?: string;
    list?: string;
    accept?: string;
}

/** The native control chosen from stable field metadata (ADR-0002). */
export function editableControlFor(fieldType: FieldType): 'input' | 'select' | 'textarea' {
    if (fieldType.hasOptions()) return 'select';
    if (fieldType.hasRowCount()) return 'textarea';
    return 'input';
}

function toText(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value);
}

function optional<T>(value: T | null | undefined | ''): T | undefined {
    return value === null || value === undefined || value === '' ? undefined : value;
}

function optionalNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Derive the renderable state of `field` from the current Record values. */
export function getFieldState(record: Record<any>, field: string): FieldState {
    const fieldType = record.fieldTypeForField(field);
    const value = record.getField(field);
    const readOnly = Boolean(fieldType.readonly(value, record, 'model'));
    const label = toText(fieldType.label(value, record, 'form'));
    const visible = Boolean(fieldType.visible(value, record, 'model'));
    const type = fieldType.type(value, record, 'form');
    const pattern = fieldType.pattern() as unknown;
    const max = fieldType.max() as unknown;
    const control =
        readOnly && !fieldType.usesCustomPrint() ? 'output' : editableControlFor(fieldType);
    return {
        fieldType,
        control,
        value,
        displayValue: toText(record.getFormattedField(field, 'input-focus')),
        printedValue: control === 'output' ? toText(record.print(field)) : '',
        label,
        showLabel: visible && label !== '' && !fieldType.hideLabel(),
        visible,
        required: Boolean(fieldType.required(value, record, 'model')),
        disabled: Boolean(fieldType.isDisabled(value, record, 'model')),
        readOnly,
        multiple: Boolean(fieldType.hasMultipleValues()),
        hasOptions: fieldType.hasOptions(),
        inputType: typeof type === 'string' ? type : undefined,
        placeholder: optional(toText(fieldType.placeholder(value, record, 'form'))),
        rows: fieldType.hasRowCount() ? optionalNumber(fieldType.rowCount()) : undefined,
        minLength: optionalNumber(fieldType.minLength(value, record, 'model')),
        maxLength: optionalNumber(fieldType.maxLength(value, record, 'model')),
        max: optional(max === undefined || max === null ? undefined : String(max)),
        step: optionalNumber(fieldType.step()),
        pattern: pattern instanceof RegExp ? pattern.source : optional(pattern as string),
        autoComplete: optional(fieldType.autocomplete() as string),
        list: optional(fieldType.list() as string),
        accept: optional(fieldType.accept() as string),
    };
}

/**
 * The synchronous model errors to expose. The application decides when to show
 * them (`show`); hidden fields never expose errors. Async validators are not
 * awaited, matching the Lit adapter.
 */
export function getVisibleErrors(record: Record<any>, field: string, show: boolean): string[] {
    if (!show) return [];
    const fieldType = record.fieldTypeForField(field);
    if (!fieldType.visible(record.getField(field), record, 'model')) return [];
    return record.readableFieldErrors(field);
}

/** Keep only characters accepted by `inputMask()` / `allowInputChar`. */
export function acceptedInput(fieldType: FieldType, text: string): string {
    return [...text].filter(character => fieldType.allowInputChar(character)).join('');
}

export interface FilteredInput {
    text: string;
    selectionStart: number | null;
    selectionEnd: number | null;
}

/** Filter typed or pasted text and map the caret into the filtered text. */
export function filterInput(
    fieldType: FieldType,
    text: string,
    selectionStart: number | null,
    selectionEnd: number | null
): FilteredInput {
    const accepted = acceptedInput(fieldType, text);
    if (accepted === text) return { text, selectionStart, selectionEnd };
    return {
        text: accepted,
        selectionStart:
            selectionStart === null
                ? null
                : acceptedInput(fieldType, text.slice(0, selectionStart)).length,
        selectionEnd:
            selectionEnd === null
                ? null
                : acceptedInput(fieldType, text.slice(0, selectionEnd)).length,
    };
}

/** Native select value(s) for a model value: option identities become strings. */
export function selectValueFor(value: unknown, multiple: boolean): string | string[] {
    if (multiple) {
        const values = Array.isArray(value) ? value : [value];
        return values.filter(item => item !== null && item !== undefined).map(String);
    }
    return toText(value);
}

/** Whether a control-owned prompt should be added before the model's options. */
export function needsSelectPrompt(
    prompt: string | undefined,
    multiple: boolean,
    options: FieldOption[]
): boolean {
    if (prompt === undefined || multiple) return false;
    return !options.some(option => toText(option.value) === '');
}

/** Join description IDs, dropping blanks and duplicates. */
export function joinIds(...ids: Array<string | undefined | false>): string | undefined {
    const unique = new Set(
        ids.flatMap(id => (id ? id.split(/\s+/) : [])).filter(id => id.length > 0)
    );
    return unique.size > 0 ? [...unique].join(' ') : undefined;
}

export interface OptionsState {
    options: FieldOption[];
    loading: boolean;
}

/** The options state before any lookup has been requested. */
export function initialOptionsState(record: Record<any>, field: string): OptionsState {
    const fieldType = record.fieldTypeForField(field);
    return {
        options: [],
        loading:
            fieldType.hasOptions() &&
            !fieldType.isDisabled(record.getField(field), record, 'model'),
    };
}

/**
 * Loads a field's options through `Record.optionsForField()`.
 *
 * Call `sync()` after every Record change. Lookups are deferred while the field
 * is disabled, a repeated (cached) request is not reloaded, and only the latest
 * request may publish options or clear the loading state.
 */
export class FieldOptionsTracker {
    private request?: Promise<unknown>;

    private version = 0;

    private disposed = false;

    state: OptionsState;

    constructor(
        private readonly record: Record<any>,
        private readonly field: string,
        private readonly onChange: (state: OptionsState) => void
    ) {
        this.state = initialOptionsState(record, field);
    }

    sync(): void {
        if (this.disposed) return;
        const fieldType = this.record.fieldTypeForField(this.field);
        if (!fieldType.hasOptions()) return;
        if (fieldType.isDisabled(this.record.getField(this.field), this.record, 'model')) {
            // Invalidate pending work without fetching or erasing loaded options.
            this.version++;
            this.request = undefined;
            if (this.state.loading) this.publish({ ...this.state, loading: false });
            return;
        }
        const request = this.record.optionsForField(this.field) as Promise<unknown>;
        if (request === this.request) return;
        this.request = request;
        const version = ++this.version;
        if (!this.state.loading) this.publish({ ...this.state, loading: true });
        Promise.resolve(request).then(
            options => {
                if (!this.isCurrent(version)) return;
                this.publish({
                    options: Array.isArray(options) ? (options as FieldOption[]) : [],
                    loading: false,
                });
            },
            () => {
                // A failed lookup keeps the previous choices.
                if (this.isCurrent(version)) this.publish({ ...this.state, loading: false });
            }
        );
    }

    dispose(): void {
        this.disposed = true;
        this.version++;
    }

    private isCurrent(version: number) {
        return !this.disposed && version === this.version;
    }

    private publish(state: OptionsState) {
        this.state = state;
        this.onChange(state);
    }
}
