import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent, CompositionEvent, ReactElement } from 'react';
import Record from '../../record.js';
import {
    filterInput,
    getVisibleErrors,
    joinIds,
    needsSelectPrompt,
    selectValueFor,
} from './field-state';
import { useFieldOptions, useFieldState } from './hooks';

export interface FdlFieldProps {
    /** The Record that owns the field's value and behavior. */
    record: Record<any>;
    /** The field name in `record`. */
    field: string;
    /**
     * Expose current synchronous FDL errors. Defaults to `false`; the
     * application decides when (after blur, touch, or a submit attempt).
     */
    showValidationErrors?: boolean;
    /** Control-owned empty choice for a single select; not added to option data. */
    selectPrompt?: string;
    /** Additional description IDs kept alongside the adapter's error ID. */
    describedBy?: string;
    /** Class names for the field wrapper. */
    className?: string;
}

interface Draft {
    /** The user's text exactly as typed. */
    text: string;
    /** The model value stored for that text; the draft is shown while it is current. */
    value: unknown;
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const checkedInputTypes = ['checkbox', 'radio'];

/**
 * One React component for every FDL field (ADR-0002). It chooses a native
 * select, textarea, input, or read-only output from field metadata, labels it,
 * mirrors model state into native and ARIA state, and parses edits back into
 * the Record.
 */
export function FdlField({
    record,
    field,
    showValidationErrors = false,
    selectPrompt,
    describedBy,
    className,
}: FdlFieldProps): ReactElement | null {
    const reactId = useId();
    const controlId = `fdl-field-${reactId.replace(/[^A-Za-z0-9_-]/g, '')}`;
    const labelId = `${controlId}-label`;
    const errorId = `${controlId}-error`;
    const state = useFieldState(record, field);
    const optionsState = useFieldOptions(record, field);
    const [draft, setDraft] = useState<Draft | null>(null);
    const composing = useRef(false);
    const pendingSelection = useRef<[number, number] | null>(null);
    const textControl = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

    useIsomorphicLayoutEffect(() => {
        const selection = pendingSelection.current;
        pendingSelection.current = null;
        if (selection && textControl.current) textControl.current.setSelectionRange(...selection);
    });

    if (!state.visible) return null;

    const { fieldType } = state;
    const errors = getVisibleErrors(record, field, showValidationErrors);
    const invalid = errors.length > 0;
    const ariaDescribedBy = joinIds(describedBy, invalid && errorId);

    function commit(value: unknown) {
        record.parseAndSetField(field, value);
        fieldType.onValueChange(record);
    }

    function handleText(control: HTMLInputElement | HTMLTextAreaElement) {
        if (composing.current) {
            // Let the IME own the text until composition ends.
            setDraft({ text: control.value, value: record.getField(field) });
            return;
        }
        const filtered = filterInput(
            fieldType,
            control.value,
            control.selectionStart,
            control.selectionEnd
        );
        if (filtered.text !== control.value && filtered.selectionStart !== null) {
            pendingSelection.current = [
                filtered.selectionStart,
                filtered.selectionEnd ?? filtered.selectionStart,
            ];
        }
        commit(filtered.text);
        // Keep the user's text and caret; the record holds the parsed value.
        setDraft({ text: filtered.text, value: record.getField(field) });
    }

    function handleTextChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        handleText(event.currentTarget);
    }

    function handleCompositionStart() {
        composing.current = true;
    }

    function handleCompositionEnd(event: CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) {
        composing.current = false;
        handleText(event.currentTarget);
    }

    function handleBlur() {
        if (!composing.current) setDraft(null);
    }

    function handleCheckedChange(event: ChangeEvent<HTMLInputElement>) {
        commit(event.currentTarget.checked);
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        commit(event.currentTarget.value);
    }

    function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
        const select = event.currentTarget;
        commit(
            state.multiple ? [...select.selectedOptions].map(option => option.value) : select.value
        );
    }

    const label = state.showLabel ? (
        <label id={labelId} htmlFor={controlId}>
            {state.label}
            {state.required && !state.readOnly ? (
                <span className="required" aria-hidden="true">
                    {' *'}
                </span>
            ) : null}
        </label>
    ) : null;

    const errorMessage = invalid ? (
        <div className="validation-error" id={errorId}>
            {errors.join('. ')}
        </div>
    ) : null;

    const shared = {
        id: controlId,
        name: field,
        required: state.required,
        'aria-invalid': invalid ? ('true' as const) : undefined,
        'aria-describedby': ariaDescribedBy,
    };

    let control: ReactElement;
    if (state.control === 'output') {
        control = (
            <output
                id={controlId}
                name={field}
                aria-labelledby={state.showLabel ? labelId : undefined}
                aria-invalid={shared['aria-invalid']}
                aria-describedby={ariaDescribedBy}
            >
                {state.printedValue}
            </output>
        );
    } else if (state.control === 'select') {
        const { loading, options } = optionsState;
        control = (
            <div className="control-input" data-loading={loading ? '' : undefined}>
                <select
                    {...shared}
                    disabled={state.disabled || loading}
                    multiple={state.multiple}
                    aria-busy={loading ? 'true' : undefined}
                    value={selectValueFor(state.value, state.multiple)}
                    onChange={handleSelectChange}
                >
                    {needsSelectPrompt(selectPrompt, state.multiple, options) ? (
                        <option value="" data-select-prompt="">
                            {selectPrompt}
                        </option>
                    ) : null}
                    {options.map((option, index) => (
                        <option
                            key={`${index}:${String(option.value)}`}
                            value={String(option.value)}
                        >
                            {String(option.text)}
                        </option>
                    ))}
                </select>
                {loading ? <span className="options-spinner" aria-hidden="true" /> : null}
                {loading ? (
                    <p className="options-loading" role="status">
                        Loading choices…
                    </p>
                ) : null}
            </div>
        );
    } else {
        const draftIsCurrent = draft !== null && Object.is(record.getField(field), draft.value);
        const text = draftIsCurrent ? draft.text : state.displayValue;
        const textProps = {
            ...shared,
            ref: textControl,
            disabled: state.disabled,
            readOnly: state.readOnly,
            placeholder: state.placeholder,
            minLength: state.minLength,
            maxLength: state.maxLength,
            autoComplete: state.autoComplete,
            value: text,
            onChange: handleTextChange,
            onBlur: handleBlur,
            onCompositionStart: handleCompositionStart,
            onCompositionEnd: handleCompositionEnd,
        };
        if (state.control === 'textarea') {
            control = <textarea {...textProps} rows={state.rows} />;
        } else if (checkedInputTypes.includes(state.inputType ?? '')) {
            control = (
                <input
                    {...shared}
                    type={state.inputType}
                    disabled={state.disabled}
                    checked={Boolean(state.value)}
                    onChange={handleCheckedChange}
                />
            );
        } else if (state.inputType === 'file') {
            control = (
                <input
                    {...shared}
                    type="file"
                    disabled={state.disabled}
                    accept={state.accept}
                    multiple={state.multiple}
                    onChange={handleFileChange}
                />
            );
        } else {
            control = (
                <input
                    {...textProps}
                    type={state.inputType}
                    max={state.max}
                    step={state.step}
                    pattern={state.pattern}
                    list={state.list}
                />
            );
        }
    }

    return (
        <div className={className ? `fdl-field ${className}` : 'fdl-field'}>
            {label}
            <div className="control">
                {control}
                {errorMessage}
            </div>
        </div>
    );
}

export default FdlField;
