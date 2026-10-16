import { css } from 'lit';
import { disabledFieldStyles } from './field-example-styles';
import { exampleTheme } from './example-theme';
import FormElement from '../../form-element';

/**
 * The example's single FDL field component.
 *
 * FormElement resolves the field metadata, creates the configured native
 * control, and synchronizes it with the Record. This subclass supplies only
 * the example's visual treatment across all supported native controls.
 */
export class FdlField extends FormElement {
    static get styles() {
        return css`
            ${FormElement.styles}

            :host {
                --field-label-width: 9rem;
                --field-control-width: 18rem;
                --label: 0.875rem;
                --label-color: #475569;
                --label-font-weight: 600;
                --field-label-margin-bottom: 8px;
                --field-control-font-size: 1rem;
                margin: 0 0 16px;
            }

            input,
            select,
            textarea {
                width: 100%;
                border: 1px solid #94a3b8;
                border-radius: 6px;
                background: white;
                padding: 10px 14px;
                font: inherit;
                line-height: 1.5;
                color: #0f172a;
            }

            input,
            select {
                height: var(--example-control-height, 48px);
                min-height: var(--example-control-height, 48px);
            }

            input:focus-visible,
            select:focus-visible,
            textarea:focus-visible {
                outline: 2px solid #2563eb;
                outline-offset: 2px;
            }

            input[aria-invalid='true'],
            select[aria-invalid='true'],
            textarea[aria-invalid='true'] {
                border-color: #a42b20;
                box-shadow: inset 0 0 0 1px #a42b20;
            }

            input[type='checkbox'],
            input[type='radio'] {
                width: 1.25rem;
                height: 1.25rem;
                min-height: 0;
                padding: 0;
                accent-color: #5b52d6;
            }
            input[type='range'] {
                padding: 0;
                accent-color: #5b52d6;
            }
            input[type='color'] {
                padding: 0.25rem;
            }
            input[type='file'] {
                height: auto;
            }

            select[multiple] {
                height: auto;
                min-height: 144px;
            }
            textarea {
                resize: vertical;
            }

            .validation-error {
                margin-top: 0.35rem;
                color: #a42b20;
                font-size: 1rem;
                font-weight: 700;
                line-height: 1.4;
            }
            ${exampleTheme}
            ${disabledFieldStyles}
        `;
    }
}

customElements.define('fdl-field', FdlField);
