/* eslint-disable @typescript-eslint/ban-ts-comment */
import { LitElement, PropertyValues, html, css, nothing } from 'lit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { property, state, customElement } from 'lit/decorators.js';
import FieldType from './field-type.js';
import Record from './record.js';
import { ListeningElementMixin } from './utilities/listening-element';
import { Events } from './types/events.types';

const ListeningElement = ListeningElementMixin(LitElement);
let nextFormElementId = 0;

class FormElement extends ListeningElement {
    constructor() {
        super();
        this.field = '';
        this.showValidationErrors = false;
    }

    dispatchEvent: any;

    @property({ type: String, reflect: true })
    public field: string;

    @property({ type: Object })
    public record?: Record<any>;

    /**
     * Whether this adapter should expose the field's synchronous model validation errors.
     * Applications own the interaction policy that decides when to enable it.
     */
    @property({ type: Boolean, attribute: 'show-validation-errors' })
    public showValidationErrors: boolean;

    /** Empty-choice text belongs to this control, not to the option data. */
    @property({ type: String, attribute: 'select-prompt' })
    public selectPrompt?: string;

    private readonly controlId = `form-element-control-${++nextFormElementId}`;

    private readonly labelId = `${this.controlId}-label`;

    private readonly errorId = `${this.controlId}-error`;

    @state()
    private fieldType?: FieldType;

    @state()
    private element?: any;

    async firstUpdated() {
        if (!this.record) throw new Error('OmegaFormElement: record is required');
        if (!this.field) throw new Error('OmegaFormElement: field is required');
        this.fieldType = this.record.fieldTypeForField(this.field);
        const controlTag = this.fieldType.hasOptions()
            ? 'select'
            : this.fieldType.hasRowCount()
              ? 'textarea'
              : 'input';
        this.element = document.createElement(controlTag);
        this.syncSelectPrompt();
        this.addListenersToElement();
        this.addListenersToRecord();
        await this.destructureFieldType();
    }

    private optionsRequest?: Promise<unknown>;
    private optionsRequestVersion = 0;

    private composing = false;
    private parsingNativeInput = false;

    private get nativeTextControl(): HTMLInputElement | HTMLTextAreaElement | undefined {
        return this.element instanceof HTMLInputElement ||
            this.element instanceof HTMLTextAreaElement
            ? this.element
            : undefined;
    }

    private acceptedInput(text: string) {
        return [...text].filter(character => this.fieldType?.allowInputChar(character)).join('');
    }

    private filterNativeInput() {
        const control = this.nativeTextControl;
        if (!control) return;
        const value = control.value;
        const accepted = this.acceptedInput(value);
        if (accepted === value) return;
        const { selectionStart, selectionEnd, selectionDirection } = control;
        control.value = accepted;
        if (selectionStart !== null && selectionEnd !== null) {
            control.setSelectionRange(
                this.acceptedInput(value.slice(0, selectionStart)).length,
                this.acceptedInput(value.slice(0, selectionEnd)).length,
                selectionDirection ?? undefined
            );
        }
    }

    addListenersToElement() {
        if (this.nativeTextControl) {
            this.listenTo(this.element, 'blur', () => {
                if (!['checkbox', 'radio', 'file'].includes(this.element.type)) {
                    this.element.value = this.record?.getFormattedField(this.field, 'input-focus');
                }
            });
            this.listenTo(this.element, 'beforeinput', (event: Event) => {
                if (!(event instanceof InputEvent)) return;
                if (
                    !this.composing &&
                    !event.isComposing &&
                    event.data &&
                    event.inputType.startsWith('insert') &&
                    this.acceptedInput(event.data) === ''
                ) {
                    event.preventDefault();
                }
            });
            this.listenTo(this.element, 'compositionstart', () => {
                this.composing = true;
            });
            this.listenTo(this.element, 'compositionend', () => {
                this.composing = false;
                this.element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
            });
        }
        Events.forEach(e => {
            this.listenTo(this.element, e, async (event: any) => {
                if (this.composing || event.isComposing) return;
                this.filterNativeInput();
                let value;
                if (event.detail) {
                    value = event.detail.value ?? event.detail.values ?? event.detail;
                } else if (this.element instanceof HTMLSelectElement && this.element.multiple) {
                    value = [...this.element.selectedOptions].map(option => option.value);
                } else if (
                    this.element instanceof HTMLInputElement &&
                    ['checkbox', 'radio'].includes(this.element.type)
                ) {
                    value = this.element.checked;
                } else {
                    value = event.target.value;
                }
                // An input echo must not replace an unfinished decimal, cleared text, or the caret.
                this.parsingNativeInput = e === 'input' && Boolean(this.nativeTextControl);
                try {
                    // @ts-ignore
                    this.record?.parseAndSetField(this.field, value);
                } finally {
                    this.parsingNativeInput = false;
                }
                this.fieldType?.onValueChange(this.record);
                this.element.dispatchEvent(new CustomEvent('update', { detail: { value, event } }));
            });
        });
    }

    private closeMultipleMenu = (event: Event) => {
        const menu = this.shadowRoot?.querySelector<HTMLDetailsElement>('.multiple-values');
        if (menu?.open && !event.composedPath().includes(menu)) menu.open = false;
    };

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('click', this.closeMultipleMenu);
    }

    disconnectedCallback() {
        document.removeEventListener('click', this.closeMultipleMenu);
        super.disconnectedCallback();
    }

    private finishMultipleSelection(event: Event) {
        const menu = (event.currentTarget as HTMLElement).closest('details')!;
        menu.open = false;
        menu.querySelector('summary')?.focus();
    }

    private renderMultipleSelect(select: HTMLSelectElement) {
        const selected = [...select.selectedOptions];
        const invalid = this.visibleValidationErrors().length > 0;
        select.hidden = true;
        return html`<div class="control">
            ${select}
            <details
                class="multiple-values"
                ?data-disabled=${select.disabled}
                @keydown=${(event: KeyboardEvent) => {
                    if (event.key === 'Escape') {
                        this.finishMultipleSelection(event);
                        event.stopPropagation();
                    }
                }}
            >
                <summary
                    id=${`${this.controlId}-trigger`}
                    aria-labelledby=${`${this.labelId} ${this.controlId}-selection`}
                    aria-disabled=${select.disabled ? 'true' : nothing}
                    aria-required=${select.required ? 'true' : nothing}
                    aria-invalid=${invalid ? 'true' : nothing}
                    aria-describedby=${invalid ? this.errorId : nothing}
                    tabindex=${select.disabled ? '-1' : '0'}
                    @click=${(event: Event) => {
                        if (select.disabled) event.preventDefault();
                    }}
                >
                    <span id=${`${this.controlId}-selection`}
                        >${selected.length === 0 ? 'Select…' : selected.length === 1 ? selected[0].textContent : `${selected.length} selected`}</span
                    >
                    <svg aria-hidden="true" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4"></path></svg>
                </summary>
                <div class="multiple-menu">
                    <fieldset ?disabled=${select.disabled}>
                        <legend class="visually-hidden"
                            >${this.fieldType?.label(this.record?.getField(this.field), this.record, 'form')}</legend
                        >
                        <p class="multiple-hint">Select any combination.</p>
                        <div class="multiple-options"
                            >${[...select.options].map(
                                option =>
                                    html` <label
                                        ><input
                                            type="checkbox"
                                            .checked=${option.selected}
                                            ?disabled=${option.disabled}
                                            @change=${(event: Event) => {
                                                option.selected = (
                                                    event.target as HTMLInputElement
                                                ).checked;
                                                select.dispatchEvent(new Event('input'));
                                            }}
                                        /><span>${option.textContent}</span></label
                                    >`
                            )}
                        </div>
                    </fieldset>
                    <div class="multiple-actions">
                        <button
                            type="button"
                            ?disabled=${select.disabled}
                            @click=${() => {
                                [...select.options].forEach(option => {
                                    option.selected = false;
                                });
                                select.dispatchEvent(new Event('input'));
                            }}
                            >Clear selection</button
                        >
                        <button type="button" @click=${this.finishMultipleSelection}>Done</button>
                    </div>
                </div>
            </details>
            ${this.renderValidationErrors()}
        </div>`;
    }

    addListenersToRecord() {
        // @ts-ignore
        this.listenTo(this.record, 'change', async () => this.destructureFieldType());
        // @ts-ignore
        // this.listenTo(this.record, 'blur', async () => this.destructureFieldType());
    }

    async destructureFieldType() {
        /**
         * used to conform to a components API where the property may not
         * be assignable via a field type modifier
         */
        const properties = this.fieldType?.additionalProperties() ?? {};
        Object.keys(properties).forEach((key: string) => {
            this.element[key] = properties[key];
        });
        /**
         * assign all standard properties we can from the modifiers
         */
        if (this.element instanceof HTMLInputElement) {
            const type = this.fieldType?.type(
                this.record?.getField(this.field),
                this.record,
                'form'
            );
            if (typeof type === 'string') this.element.type = type;
        }
        // Native selects use option identities, not formatted labels. Keep all
        // selected identities intact between native input and change events.
        if (this.element instanceof HTMLSelectElement) {
            this.element.multiple = this.fieldType?.hasMultipleValues() ?? false;
            this.syncSelectValue();
        } else if (
            this.element instanceof HTMLInputElement &&
            ['checkbox', 'radio'].includes(this.element.type)
        ) {
            this.element.checked = Boolean(this.record?.getField(this.field));
        } else if (this.element instanceof HTMLInputElement && this.element.type === 'file') {
            // Browsers only allow clearing a file picker programmatically.
            if (!this.record?.getField(this.field)) this.element.value = '';
        } else if (!this.parsingNativeInput) {
            // @ts-ignore
            this.element.value = this.record?.getFormattedField(this.field, 'input-focus');
        }
        this.element.id = this.controlId;
        this.element.required = this.fieldType?.required(
            this.record?.getField(this.field),
            this.record,
            'model'
        );
        this.element.visible = this.fieldType?.visible(
            this.record?.getField(this.field),
            this.record,
            'model'
        );
        this.element.readonly = this.fieldType?.readonly(
            this.record?.getField(this.field),
            this.record,
            'model'
        );
        this.element.label = this.fieldType?.label(
            this.record?.getField(this.field),
            this.record,
            'form'
        );
        this.element.inline = this.fieldType?.inline(this.record);
        this.element.segmented = this.fieldType?.segmented(this.record);
        this.element.empty = this.fieldType?.empty(this.record, this.field);
        this.element.disabled =
            Boolean(this.element.loading) ||
            this.fieldType?.isDisabled(this.record?.getField(this.field), this.record, 'model');
        this.element.name = this.field;
        this.element.rows = this.fieldType?.rowCount();
        this.element.maxLength = this.fieldType?.maxLength(
            this.record?.getField(this.field),
            this.record,
            'model'
        );
        this.element.minLength = this.fieldType?.minLength(
            this.record?.getField(this.field),
            this.record,
            'model'
        );
        this.element.placeholder = this.fieldType?.placeholder(
            this.record?.getField(this.field),
            this.record,
            'form'
        );
        if (this.element instanceof HTMLSelectElement) {
            this.element.toggleAttribute('multiple', this.fieldType?.hasMultipleValues() ?? false);
        } else {
            this.element.multiple = this.fieldType?.hasMultipleValues();
        }
        this.element.accept = this.fieldType?.accept();
        this.element.autocomplete = this.fieldType?.autocomplete();
        this.element.autofocus = this.fieldType?.autofocus();
        // `list` is an attribute on native inputs; assigning it as a property
        // expects an HTMLDataListElement and silently drops a string id.
        const list = this.fieldType?.list();
        if (list) this.element.setAttribute('list', list);
        else this.element.removeAttribute('list');
        this.element.max = this.fieldType?.max();
        this.element.pattern = this.fieldType?.pattern();
        this.element.step = this.fieldType?.step();
        this.element.hashFunction = this.fieldType?.hashFunction();
        this.element.record = this.record;

        /**
         * some uglier APIs we should attempt to clean up in omega/field-type - these don't really
         * follow form elements standard html attributes
         */
        this.element.fieldModel = this.record?.field(this.field);
        this.element.field = this.record?.field(this.field); // weird name here, we need to deprecate this and fieldModel
        this.element.formatOnChange = this.fieldType?.formatOnChange();
        this.element.searchConfig = this.fieldType?.searchConfig();
        this.element.hasSearch = this.fieldType?.hasSearch();
        this.element.hasFilter = this.fieldType?.hasFilter();
        this.element.readonlyexception = this.fieldType?.readonlyexception(this.record);
        this.element.readOnly = this.fieldType?.readonly(
            this.record?.getField(this.field),
            this.record,
            'model'
        ); // case change only on omega-frequency - should update there and remove this
        this.element.readOnlyException = this.fieldType?.readonlyexception(this.record); // case change only on omega-frequency - should update there and remove this
        this.element.parseDynamicRange = this.fieldType?.getParseDynamicRange();
        this.element.dateDisabledFunction =
            this.fieldType?.selectionDisabledFunctions().dateDisabledFunction;
        this.element.hideSelectAll = this.fieldType?.properties.options?.hideSelectAll;
        this.element.maxValueCount = this.fieldType?.maxValueCount();

        if (
            this.fieldType?.hasOptions() &&
            this.fieldType.isDisabled(this.record?.getField(this.field), this.record)
        ) {
            // Invalidate pending UI work without fetching or erasing its options.
            this.optionsRequestVersion++;
            this.optionsRequest = undefined;
            this.element.loading = false;
            this.element.removeAttribute('aria-busy');
            this.element.disabled = true;
        } else if (this.fieldType?.hasOptions()) {
            const request = this.record!.optionsForField(this.field);
            if (request !== this.optionsRequest) {
                this.optionsRequest = request;
                const version = ++this.optionsRequestVersion;
                this.element.loading = true;
                this.element.disabled = true;
                this.element.setAttribute('aria-busy', 'true');
                this.requestUpdate();
                try {
                    const options = (await request) as Array<{ text: unknown; value: unknown }>;
                    // Only the latest dependency values may populate this control.
                    if (version !== this.optionsRequestVersion) return;
                    if (this.element instanceof HTMLSelectElement) {
                        this.element.replaceChildren(
                            ...options.map(option => {
                                const nativeOption = document.createElement('option');
                                nativeOption.value = String(option.value);
                                nativeOption.textContent = String(option.text);
                                return nativeOption;
                            })
                        );
                        this.syncSelectPrompt();
                        this.syncSelectValue();
                    } else {
                        this.element.options = options;
                        this.element.items = options;
                        this.element.radios = options;
                    }
                } finally {
                    if (version === this.optionsRequestVersion) {
                        this.element.loading = false;
                        this.element.disabled = this.fieldType.isDisabled(
                            this.record?.getField(this.field),
                            this.record,
                            'model'
                        );
                        this.element.removeAttribute('aria-busy');
                        this.requestUpdate();
                    }
                }
            }
        }
        this.updateValidationAccessibility();
        this.requestUpdate();
    }

    private syncSelectPrompt() {
        if (!(this.element instanceof HTMLSelectElement) || this.fieldType?.hasMultipleValues())
            return;
        let prompt = this.element.querySelector(
            'option[data-select-prompt]'
        ) as HTMLOptionElement | null;
        const suppliedEmpty = [...this.element.options].some(
            option => option !== prompt && option.value === ''
        );
        if (suppliedEmpty || this.selectPrompt === undefined) {
            prompt?.remove();
            return;
        }
        if (!prompt) {
            prompt = document.createElement('option');
            prompt.value = '';
            prompt.setAttribute('data-select-prompt', '');
            this.element.prepend(prompt);
        }
        prompt.textContent = this.selectPrompt;
    }

    private syncSelectValue() {
        const select = this.element as HTMLSelectElement;
        const value = (this.record as any)?.getField(this.field);
        if (select.multiple) {
            const selectedValues = (Array.isArray(value) ? value : [value]).map(String);
            [...select.options].forEach(option => {
                option.selected = selectedValues.includes(option.value);
            });
        } else {
            select.value = String(value ?? '');
        }
    }

    protected updated(changedProperties: PropertyValues<this>) {
        if (changedProperties.has('selectPrompt')) this.syncSelectPrompt();
        if (changedProperties.has('showValidationErrors')) {
            this.updateValidationAccessibility();
        }
    }

    private visibleValidationErrors() {
        if (!this.showValidationErrors || !this.record || !this.fieldType) return [];
        if (!this.fieldType.visible(this.record?.getField(this.field), this.record, 'model'))
            return [];
        return this.record.readableFieldErrors(this.field);
    }

    private updateValidationAccessibility() {
        if (!this.element) return;
        const hasVisibleErrors = this.visibleValidationErrors().length > 0;
        if (hasVisibleErrors) this.element.setAttribute('aria-invalid', 'true');
        else this.element.removeAttribute('aria-invalid');

        const describedBy = new Set(
            (this.element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
        );
        describedBy.delete(this.errorId);
        if (hasVisibleErrors) describedBy.add(this.errorId);

        if (describedBy.size > 0) {
            this.element.setAttribute('aria-describedby', [...describedBy].join(' '));
        } else {
            this.element.removeAttribute('aria-describedby');
        }
    }

    renderRequired() {
        if (!this.fieldType) return nothing;
        if (!this.fieldType?.required(this.record?.getField(this.field), this.record, 'model'))
            return nothing;
        if (this.fieldType?.readonly(this.record?.getField(this.field), this.record, 'model'))
            return nothing;
        return html`<span class="required">&nbsp;*</span>`;
    }

    renderLabel() {
        if (!this.record) return nothing;
        if (!this.fieldType?.label(this.record?.getField(this.field), this.record, 'form'))
            return nothing;
        if (this.fieldType?.hideLabel()) return nothing;
        if (!this.fieldType?.visible(this.record?.getField(this.field), this.record, 'model'))
            return nothing;
        return html`<label
            id=${this.labelId}
            for=${this.controlId}
            @click=${() => this.shadowRoot?.querySelector<HTMLElement>('.multiple-values summary')?.focus()}
            >${this.fieldType?.label(this.record?.getField(this.field), this.record, 'form')}${this.renderRequired()}<slot
                name="label"
            ></slot
        ></label>`;
    }

    renderValidationErrors() {
        const errors = this.visibleValidationErrors();
        if (errors.length === 0) return nothing;
        return html`<div class="validation-error" id=${this.errorId}>${errors.join('. ')}</div>`;
    }

    // eslint-disable-next-line sonarjs/cognitive-complexity
    renderElement() {
        if (!this.record) return nothing;
        if (!this.element) return nothing;
        if (!this.fieldType?.visible(this.record?.getField(this.field), this.record, 'model'))
            return nothing;
        if (this.element.readonly && !this.fieldType?.usesCustomPrint()) {
            const hasVisibleErrors = this.visibleValidationErrors().length > 0;
            return html`<div class="control">
                <output
                    id=${this.controlId}
                    name=${this.field}
                    aria-labelledby=${this.labelId}
                    aria-invalid=${hasVisibleErrors ? 'true' : nothing}
                    aria-describedby=${hasVisibleErrors ? this.errorId : nothing}
                    >${this.record.print(this.field)}</output
                >
                ${this.renderValidationErrors()}
            </div>`;
        }
        if (this.element instanceof HTMLSelectElement && this.element.multiple)
            return this.renderMultipleSelect(this.element);
        this.element.hidden = false;
        return html`<div class="control">
            <div class="control-input" ?data-loading=${this.element.loading}>
                ${this.element}
                ${this.element.loading ? html`<span class="options-spinner" aria-hidden="true"></span>` : nothing}
            </div>
            ${this.element.loading ? html`<p class="options-loading" role="status">Loading choices…</p>` : nothing}
            ${this.renderValidationErrors()}
        </div>`;
    }

    render() {
        return [this.renderLabel(), this.renderElement()];
    }

    static get styles() {
        return css`
            * {
                box-sizing: border-box;
            }
            :host {
                display: flex;
                flex-flow: row;
                flex-wrap: var(--field-flex-wrap, wrap);
                align-items: center;
                color: var(--field-color);
                font-weight: var(--field-font-weight);
            }
            :host([no-align]) {
                align-items: unset;
            }
            :host([no-align]) .label {
                padding-top: 7px;
            }
            .control {
                font-size: var(--field-control-font-size);
                font-weight: var(--field-control-font-weight);
                flex: var(--field-control-width, 250px) 3 1;
            }
            .control-input {
                position: relative;
            }
            .control-input[data-loading] select {
                padding-right: 3.5rem;
            }
            .options-spinner {
                position: absolute;
                right: 2rem;
                top: calc(50% - 8px);
                width: 16px;
                height: 16px;
                border: 2px solid #94a3b8;
                border-top-color: #2563eb;
                border-radius: 50%;
                animation: options-spin 0.7s linear infinite;
                pointer-events: none;
            }
            .options-loading {
                margin: 6px 0 0;
                font-size: 0.875rem;
            }
            @keyframes options-spin {
                to {
                    transform: rotate(360deg);
                }
            }
            @media (prefers-reduced-motion: reduce) {
                .options-spinner {
                    animation: none;
                }
            }
            .multiple-values {
                position: relative;
            }
            .multiple-values summary {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                min-height: 48px;
                padding: 10px 14px;
                border: 1px solid #94a3b8;
                border-radius: 6px;
                background: white;
                font: inherit;
                cursor: pointer;
                list-style: none;
            }
            .multiple-values summary::-webkit-details-marker {
                display: none;
            }
            .multiple-values summary svg {
                width: 16px;
                height: 16px;
                flex-shrink: 0;
                fill: none;
                stroke: #64748b;
                stroke-width: 1.5;
                stroke-linecap: round;
                stroke-linejoin: round;
            }
            .multiple-values summary:focus-visible {
                outline: 3px solid #2563eb;
                outline-offset: 3px;
            }
            .multiple-values summary[aria-invalid='true'] {
                border-color: #a42b20;
            }
            .multiple-values[data-disabled] summary {
                background: #e2e8f0;
                border-style: dashed;
                color: #475569;
                cursor: not-allowed;
            }
            .multiple-menu {
                position: absolute;
                z-index: 10;
                inset: calc(100% + 6px) 0 auto;
                min-width: 240px;
                padding: 12px;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                background: white;
                box-shadow: 0 12px 28px #0f172a24;
            }
            .multiple-menu fieldset {
                border: 0;
                padding: 0;
                margin: 0;
            }
            .visually-hidden {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip-path: inset(50%);
                white-space: nowrap;
            }
            .multiple-hint {
                margin: 6px 0 10px;
                font-size: 0.875rem;
                color: #475569;
                line-height: 1.5;
            }
            .multiple-options {
                display: grid;
                gap: 2px;
                max-height: 240px;
                overflow: auto;
            }
            .multiple-options label {
                display: flex;
                align-items: center;
                gap: 10px;
                min-height: 36px;
                margin: 0;
                font-size: 1rem;
                cursor: pointer;
            }
            .multiple-options input[type='checkbox'] {
                width: 20px;
                height: 20px;
                min-height: 0;
                padding: 0;
                margin: 0;
                accent-color: #2563eb;
                flex-shrink: 0;
            }
            .multiple-actions {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                margin-top: 12px;
                border-top: 1px solid #e2e8f0;
                padding-top: 8px;
            }
            .multiple-actions button {
                min-height: 36px;
                border: 0;
                background: none;
                color: #2563eb;
                font: inherit;
                text-decoration: underline;
                cursor: pointer;
            }
            .required {
                color: var(--error);
            }
            label {
                flex: 1 1 var(--field-label-width, 200px);
                font-size: var(--label, 14px);
                font-weight: var(--label-font-weight, 400);
                color: var(--label-color);
                margin-bottom: var(--field-label-margin-bottom, 4px);
                max-width: var(--field-label-max-width, none);
            }
        `;
    }
}

export const FormElementTagName = 'form-element';
// @ts-ignore
customElements.define('form-element', FormElement);
export default FormElement;
