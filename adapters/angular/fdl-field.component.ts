import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    booleanAttribute,
    computed,
    effect,
    inject,
    input,
    signal,
    untracked,
} from '@angular/core';
import type FdlRecord from '../../record.js';
import deepEquals from '../../utilities/deep-equality';
import {
    FdlFieldState,
    FdlOption,
    FieldOptionsLoader,
    filterTextControl,
    isOptionSelected,
    isTextControl,
    mergeDescribedBy,
    readControlValue,
    readFieldState,
    rejectsInsertion,
    showsSelectPrompt,
} from './field-state';
import { recordSignal } from './record-signals';

let nextFieldId = 0;

/**
 * One Angular component for every FDL field (see ADR-0002).
 *
 * It chooses a native `select`, `textarea`, or `input` from the field's
 * metadata, renders read-only fields as a labeled `<output>`, and sends edits
 * back through `Record.parseAndSetField()`. The `Record` remains the source of
 * truth for values, state, and validation.
 */
@Component({
    selector: 'fdl-field',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'fdl-field' },
    template: `
        @let s = state();
        @if (s.visible) {
            @if (hasLabel()) {
                <label [id]="labelId" [attr.for]="controlId"
                    >{{ s.label }}
                    @if (s.required && !s.readonly) {
                        <span class="required">&nbsp;*</span>
                    }
                </label>
            }
            <div class="control">
                @if (s.readOnlyOutput) {
                    <output
                        [id]="controlId"
                        [attr.name]="s.field"
                        [attr.aria-labelledby]="hasLabel() ? labelId : null"
                        [attr.aria-invalid]="invalid() ? 'true' : null"
                        [attr.aria-describedby]="describedByIds()"
                        >{{ s.printed }}</output
                    >
                } @else {
                    <div class="control-input" [attr.data-loading]="loading() ? '' : null">
                        @switch (s.control) {
                            @case ('select') {
                                <select
                                    [id]="controlId"
                                    [name]="s.field"
                                    [multiple]="s.multiple"
                                    [disabled]="s.disabled || loading()"
                                    [required]="s.required"
                                    [attr.autocomplete]="s.autocomplete ?? null"
                                    [attr.aria-busy]="loading() ? 'true' : null"
                                    [attr.aria-invalid]="invalid() ? 'true' : null"
                                    [attr.aria-describedby]="describedByIds()"
                                    (change)="commit($event)"
                                >
                                    @if (showPrompt()) {
                                        <option
                                            value=""
                                            data-select-prompt
                                            [selected]="isSelected('')"
                                            >{{ selectPrompt() }}</option
                                        >
                                    }
                                    @for (option of options(); track $index) {
                                        <option
                                            [value]="optionValue(option)"
                                            [selected]="isSelected(option.value)"
                                            >{{ option.text }}</option
                                        >
                                    }
                                </select>
                            }
                            @case ('textarea') {
                                <textarea
                                    [id]="controlId"
                                    [value]="controlText()"
                                    [name]="s.field"
                                    [disabled]="s.disabled"
                                    [required]="s.required"
                                    [attr.rows]="s.rows ?? null"
                                    [attr.placeholder]="s.placeholder || null"
                                    [attr.minlength]="s.minLength ?? null"
                                    [attr.maxlength]="s.maxLength ?? null"
                                    [attr.autocomplete]="s.autocomplete ?? null"
                                    [attr.aria-invalid]="invalid() ? 'true' : null"
                                    [attr.aria-describedby]="describedByIds()"
                                    (beforeinput)="filterInsertion($event)"
                                    (compositionstart)="composing = true"
                                    (compositionend)="endComposition($event)"
                                    (input)="commit($event)"
                                    (change)="commit($event)"
                                    (blur)="reformat($event)"
                                ></textarea>
                            }
                            @default {
                                <input
                                    [id]="controlId"
                                    [name]="s.field"
                                    [type]="s.inputType"
                                    [value]="controlText()"
                                    [checked]="!!s.value"
                                    [disabled]="s.disabled"
                                    [required]="s.required"
                                    [attr.placeholder]="s.placeholder || null"
                                    [attr.minlength]="s.minLength ?? null"
                                    [attr.maxlength]="s.maxLength ?? null"
                                    [attr.autocomplete]="s.autocomplete ?? null"
                                    [attr.autofocus]="s.autofocus ? '' : null"
                                    [attr.accept]="s.accept ?? null"
                                    [attr.list]="s.list ?? null"
                                    [attr.max]="s.max ?? null"
                                    [attr.pattern]="s.pattern ?? null"
                                    [attr.step]="s.step ?? null"
                                    [attr.aria-invalid]="invalid() ? 'true' : null"
                                    [attr.aria-describedby]="describedByIds()"
                                    (beforeinput)="filterInsertion($event)"
                                    (compositionstart)="composing = true"
                                    (compositionend)="endComposition($event)"
                                    (input)="commit($event)"
                                    (change)="commit($event)"
                                    (blur)="reformat($event)"
                                />
                            }
                        }
                        @if (loading()) {
                            <span class="options-spinner" aria-hidden="true"></span>
                        }
                    </div>
                    @if (loading()) {
                        <p class="options-loading" role="status">Loading choices…</p>
                    }
                }
                @if (invalid()) {
                    <div class="validation-error" [id]="errorId">{{ s.errors.join('. ') }}</div>
                }
            </div>
        }
    `,
    styles: `
        .control-input {
            position: relative;
        }
        .options-spinner {
            position: absolute;
            right: 2rem;
            top: calc(50% - 8px);
            width: 16px;
            height: 16px;
            border: 2px solid currentColor;
            border-top-color: transparent;
            border-radius: 50%;
            animation: fdl-options-spin 0.7s linear infinite;
            pointer-events: none;
        }
        @keyframes fdl-options-spin {
            to {
                transform: rotate(360deg);
            }
        }
        @media (prefers-reduced-motion: reduce) {
            .options-spinner {
                animation: none;
            }
        }
    `,
})
export class FdlFieldComponent {
    /** The model that owns the field. */
    readonly record = input.required<FdlRecord<any>>();

    /** The field name in `record` that this component renders. */
    readonly field = input.required<string>();

    /**
     * Application policy: expose current synchronous model errors in the UI and
     * accessibility tree. Defaults to `false`.
     */
    readonly showValidationErrors = input(false, { transform: booleanAttribute });

    /** Control-owned empty-choice text for a single-value select. */
    readonly selectPrompt = input<string | undefined>(undefined);

    /** Extra description IDs (such as help text) kept alongside the error reference. */
    readonly describedBy = input<string | undefined>(undefined);

    /** Opaque per-instance IDs; stable for the component's lifetime. */
    protected readonly controlId = `fdl-field-control-${++nextFieldId}`;
    protected readonly labelId = `${this.controlId}-label`;
    protected readonly errorId = `${this.controlId}-error`;

    private readonly model = recordSignal(this.record);

    protected readonly state = computed<FdlFieldState>(() =>
        readFieldState(this.model(), this.field(), {
            showValidationErrors: this.showValidationErrors(),
        })
    );

    protected readonly options = signal<readonly FdlOption[]>([]);
    protected readonly loading = signal(false);

    protected readonly hasLabel = computed(() => {
        const state = this.state();
        return state.label !== '' && !state.hideLabel;
    });

    protected readonly invalid = computed(() => this.state().errors.length > 0);

    protected readonly describedByIds = computed(() =>
        mergeDescribedBy(this.describedBy(), this.invalid() ? this.errorId : null)
    );

    protected readonly showPrompt = computed(() =>
        showsSelectPrompt(this.state(), this.options(), this.selectPrompt())
    );

    protected composing = false;

    /** Text the user is typing and the model value it parsed to. */
    private readonly edited = signal<{ text: string; value: unknown } | undefined>(undefined);

    /**
     * The value bound to a native input or textarea. While the user's text
     * still parses to the model value, it is kept as typed, so an input echo
     * cannot replace an unfinished value such as `12.` or move the caret.
     * A programmatic change to another value shows the formatted model text.
     */
    protected readonly controlText = computed(() => {
        const state = this.state();
        const edited = this.edited();
        if (state.control === 'input' && ['checkbox', 'radio'].includes(state.inputType)) {
            return 'on';
        }
        // Browsers only allow a file picker's value to be cleared programmatically.
        if (state.control === 'input' && state.inputType === 'file') return '';
        if (edited && deepEquals(state.value, edited.value)) return edited.text;
        return state.text;
    });

    private readonly optionsLoader = new FieldOptionsLoader(state => {
        this.options.set(state.options);
        this.loading.set(state.loading);
    });

    constructor() {
        effect(() => {
            const record = this.model();
            const field = this.field();
            untracked(() => this.optionsLoader.sync(record, field));
        });
        inject(DestroyRef).onDestroy(() => this.optionsLoader.dispose());
    }

    protected optionValue(option: FdlOption): string {
        return String(option.value);
    }

    protected isSelected(value: unknown): boolean {
        return isOptionSelected(this.state(), value);
    }

    protected filterInsertion(event: Event): void {
        const fieldType = this.record().fieldTypeForField(this.field());
        if (
            typeof InputEvent !== 'undefined' &&
            event instanceof InputEvent &&
            rejectsInsertion(fieldType, event, this.composing)
        ) {
            event.preventDefault();
        }
    }

    protected endComposition(event: Event): void {
        this.composing = false;
        this.commit(event);
    }

    /** Parse the control's value into the Record. */
    protected commit(event: Event): void {
        if (this.composing || (event as InputEvent).isComposing) return;
        const control = event.target as HTMLElement;
        const record = this.record();
        const field = this.field();
        const fieldType = record.fieldTypeForField(field);
        const text = isTextControl(control);
        if (text) filterTextControl(control, fieldType);
        record.parseAndSetField(field, readControlValue(control));
        if (text) this.edited.set({ text: control.value, value: record.getField(field) });
        fieldType.onValueChange(record);
    }

    /** Leaving a text control reapplies its formatted representation. */
    protected reformat(event: Event): void {
        this.edited.set(undefined);
        const control = event.target as HTMLElement;
        if (isTextControl(control)) control.value = this.state().text;
    }
}
