import { css } from 'lit';
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
                margin: 0.5rem 0;
            }

            input,
            select,
            textarea {
                width: 100%;
                border: 1px solid #cbd2df;
                border-radius: 0.45rem;
                background: white;
                padding: 0.5rem 0.625rem;
                font: inherit;
            }

            input,
            select {
                min-height: 2.35rem;
            }

            input:focus-visible,
            select:focus-visible,
            textarea:focus-visible {
                outline: 2px solid #7657ff;
                outline-offset: 2px;
            }

            input[aria-invalid='true'],
            select[aria-invalid='true'],
            textarea[aria-invalid='true'] {
                border-color: #a42b20;
                border-width: 2px;
            }

            .validation-error {
                margin-top: 0.35rem;
                color: #a42b20;
                font-size: 0.8rem;
                font-weight: 700;
                line-height: 1.4;
            }
        `;
    }
}

customElements.define('fdl-field', FdlField);
