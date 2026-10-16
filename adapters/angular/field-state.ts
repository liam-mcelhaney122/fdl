/**
 * Framework-independent field state for the Angular adapter.
 *
 * Nothing in this module imports Angular. It translates FDL model state into
 * the plain values a field component needs, so the translation can be tested
 * without TestBed and reused by other renderers.
 */
import type FieldType from '../../field-type.js';
import type FdlRecord from '../../record.js';

/** The native control chosen from stable field metadata. */
export type FdlControlKind = 'input' | 'select' | 'textarea';

/** A choice returned by `Record.optionsForField()`. */
export interface FdlOption {
    text: unknown;
    value: unknown;
}

export interface FdlFieldStateOptions {
    /**
     * Application policy: expose synchronous model errors. Defaults to `false`.
     * FDL decides validity; the application decides when errors are shown.
     */
    showValidationErrors?: boolean;
}

/** A snapshot of one field, derived only from the `Record` and its `FieldType`. */
export interface FdlFieldState {
    readonly field: string;
    readonly control: FdlControlKind;
    /** The stored model value. */
    readonly value: unknown;
    /** Editable text formatted with the `"input-focus"` context. */
    readonly text: string;
    /** Read-only text from `Record.print()`; empty unless `readOnlyOutput` is true. */
    readonly printed: string;
    readonly label: string;
    readonly hideLabel: boolean;
    readonly visible: boolean;
    readonly required: boolean;
    /** The field's declared disabled state; option loading is tracked separately. */
    readonly disabled: boolean;
    readonly readonly: boolean;
    /** True when the adapter renders a labeled `<output>` instead of a control. */
    readonly readOnlyOutput: boolean;
    readonly placeholder: string;
    /** A supported native input type, or `"text"` when the declared type is invalid. */
    readonly inputType: string;
    readonly minLength?: number;
    readonly maxLength?: number;
    readonly rows?: number;
    readonly multiple: boolean;
    readonly autocomplete?: string;
    readonly autofocus: boolean;
    readonly accept?: string;
    readonly list?: string;
    readonly max?: string;
    readonly pattern?: string;
    readonly step?: string;
    /** Errors to show now: empty unless display is requested and the field is visible. */
    readonly errors: readonly string[];
}

type AnyRecord = FdlRecord<any>;

function optionalString(value: unknown): string | undefined {
    return value === undefined || value === null || value === '' ? undefined : String(value);
}

function optionalNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Convert a formatted or printed model value into DOM text. */
export function displayText(value: unknown): string {
    return value === undefined || value === null ? '' : String(value);
}

/** Choose the native control the same way the Lit `FormElement` does. */
export function controlKindFor(fieldType: FieldType<any>): FdlControlKind {
    if (fieldType.hasOptions()) return 'select';
    if (fieldType.hasRowCount()) return 'textarea';
    return 'input';
}

/** Read everything a field component renders from the model. */
export function readFieldState(
    record: AnyRecord,
    field: string,
    options: FdlFieldStateOptions = {}
): FdlFieldState {
    const fieldType = record.fieldTypeForField(field);
    const value = record.getField(field);
    const readonly = Boolean(fieldType.readonly(value, record, 'model'));
    const visible = Boolean(fieldType.visible(value, record, 'model'));
    const readOnlyOutput = readonly && !fieldType.usesCustomPrint();
    const control = controlKindFor(fieldType);
    const type = fieldType.type(value, record, 'form');
    const showErrors = Boolean(options.showValidationErrors) && visible;

    return {
        field,
        control,
        value,
        text: displayText(record.getFormattedField(field, 'input-focus')),
        printed: readOnlyOutput ? displayText(record.print(field)) : '',
        label: displayText(fieldType.label(value, record, 'form')),
        hideLabel: Boolean(fieldType.hideLabel()),
        visible,
        required: Boolean(fieldType.required(value, record, 'model')),
        disabled: Boolean(fieldType.isDisabled(value, record, 'model')),
        readonly,
        readOnlyOutput,
        placeholder: displayText(fieldType.placeholder(value, record, 'form')),
        inputType: typeof type === 'string' ? type : 'text',
        minLength: optionalNumber(fieldType.minLength(value, record, 'model')),
        maxLength: optionalNumber(fieldType.maxLength(value, record, 'model')),
        rows: control === 'textarea' ? optionalNumber(fieldType.rowCount()) : undefined,
        multiple: Boolean(fieldType.hasMultipleValues()),
        autocomplete: optionalString(fieldType.autocomplete()),
        autofocus: Boolean(fieldType.autofocus()),
        accept: optionalString(fieldType.accept()),
        list: optionalString(fieldType.list()),
        max: optionalString(fieldType.max()),
        pattern: optionalString(fieldType.pattern()),
        step: optionalString(fieldType.step()),
        errors: showErrors ? record.readableFieldErrors(field) : [],
    };
}

/** Whether an option identity is selected by the model value (string identities). */
export function isOptionSelected(state: FdlFieldState, optionValue: unknown): boolean {
    const identity = String(optionValue);
    if (state.multiple) {
        const values = Array.isArray(state.value) ? state.value : [state.value];
        return values.map(String).includes(identity);
    }
    return String(state.value ?? '') === identity;
}

/** Whether a control-owned empty prompt should be rendered before the options. */
export function showsSelectPrompt(
    state: FdlFieldState,
    options: readonly FdlOption[],
    prompt: string | undefined
): boolean {
    return (
        prompt !== undefined &&
        !state.multiple &&
        !options.some(option => String(option.value) === '')
    );
}

/** Join description IDs, dropping blanks and duplicates. Returns `null` when empty. */
export function mergeDescribedBy(...ids: Array<string | null | undefined>): string | null {
    const unique = new Set(ids.flatMap(id => (id ?? '').split(/\s+/)).filter(id => id.length > 0));
    return unique.size > 0 ? [...unique].join(' ') : null;
}

/** Characters of `text` accepted by the field's `inputMask()`. */
export function acceptedInput(fieldType: FieldType<any>, text: string): string {
    return [...text].filter(character => fieldType.allowInputChar(character)).join('');
}

/** Whether a `beforeinput` insertion contains only characters the mask rejects. */
export function rejectsInsertion(
    fieldType: FieldType<any>,
    event: { data: string | null; inputType: string; isComposing: boolean },
    composing = false
): boolean {
    return (
        !composing &&
        !event.isComposing &&
        Boolean(event.data) &&
        event.inputType.startsWith('insert') &&
        acceptedInput(fieldType, event.data ?? '') === ''
    );
}

/** Remove rejected characters from a text control while preserving the selection. */
export function filterTextControl(
    control: HTMLInputElement | HTMLTextAreaElement,
    fieldType: FieldType<any>
): void {
    const value = control.value;
    const accepted = acceptedInput(fieldType, value);
    if (accepted === value) return;
    const { selectionStart, selectionEnd, selectionDirection } = control;
    control.value = accepted;
    if (selectionStart !== null && selectionEnd !== null) {
        control.setSelectionRange(
            acceptedInput(fieldType, value.slice(0, selectionStart)).length,
            acceptedInput(fieldType, value.slice(0, selectionEnd)).length,
            selectionDirection ?? undefined
        );
    }
}

/** True for inputs whose value is text the user edits character by character. */
export function isTextControl(
    control: Element | null | undefined
): control is HTMLInputElement | HTMLTextAreaElement {
    if (control instanceof HTMLTextAreaElement) return true;
    return (
        control instanceof HTMLInputElement && !['checkbox', 'radio', 'file'].includes(control.type)
    );
}

/** Read the value an edited native control sends to `Record.parseAndSetField()`. */
export function readControlValue(control: Element): unknown {
    if (control instanceof HTMLSelectElement) {
        return control.multiple
            ? [...control.selectedOptions].map(option => option.value)
            : control.value;
    }
    if (control instanceof HTMLInputElement && ['checkbox', 'radio'].includes(control.type)) {
        return control.checked;
    }
    return (control as HTMLInputElement | HTMLTextAreaElement).value;
}

export interface FdlOptionsState {
    readonly options: readonly FdlOption[];
    readonly loading: boolean;
}

/**
 * Loads a field's options through `Record.optionsForField()`.
 *
 * Call `sync()` whenever the record changes. Loading is deferred while the
 * field is disabled, an unchanged provider request is not reloaded, and a
 * result from anything but the latest request is ignored.
 */
export class FieldOptionsLoader {
    private request?: Promise<unknown>;
    private version = 0;
    private current: FdlOptionsState = { options: [], loading: false };

    constructor(private readonly onChange: (state: FdlOptionsState) => void) {}

    get state(): FdlOptionsState {
        return this.current;
    }

    sync(record: AnyRecord, field: string): void {
        const fieldType = record.fieldTypeForField(field);
        if (!fieldType.hasOptions()) return;
        if (fieldType.isDisabled(record.getField(field), record, 'model')) {
            // Invalidate pending work without fetching or erasing the current options.
            this.version++;
            this.request = undefined;
            if (this.current.loading) this.update({ ...this.current, loading: false });
            return;
        }
        const request = record.optionsForField(field) as Promise<unknown>;
        if (request === this.request) return;
        this.request = request;
        const version = ++this.version;
        this.update({ ...this.current, loading: true });
        Promise.resolve(request).then(
            result => {
                if (version !== this.version) return;
                const options = Array.isArray(result) ? (result as FdlOption[]) : [];
                this.update({ options, loading: false });
            },
            () => {
                // A failed lookup is not an empty list of choices; keep the previous ones.
                if (version === this.version) this.update({ ...this.current, loading: false });
            }
        );
    }

    /** Ignore every pending result, for example when the component is destroyed. */
    dispose(): void {
        this.version++;
        this.request = undefined;
    }

    private update(state: FdlOptionsState) {
        this.current = state;
        this.onChange(state);
    }
}
