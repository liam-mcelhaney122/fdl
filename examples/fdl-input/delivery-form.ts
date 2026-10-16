// Connects the delivery model to field controls and a record inspector.
import { LitElement, css, html } from 'lit';
import { createDelivery } from './delivery-model';
import { exampleTheme } from './example-theme';
import './fdl-field';
import './fdl-record-inspector';

export class DeliveryForm extends LitElement {
    private delivery = createDelivery();
    private readonly refresh = this.handleChange.bind(this);
    private handleChange() {
        this.requestUpdate();
    }
    connectedCallback() {
        super.connectedCallback();
        this.delivery.addEventListener('change', this.refresh);
    }
    disconnectedCallback() {
        this.delivery.removeEventListener('change', this.refresh);
        super.disconnectedCallback();
    }
    render() {
        const pickup = this.delivery.getField('fulfillment') === 'pickup';
        return html` <div class="experiment">
            <div class="editor">
                <fdl-field
                    .record=${this.delivery}
                    field="fulfillment"
                ></fdl-field>
                <fdl-field
                    .record=${this.delivery}
                    field="address"
                    .showValidationErrors=${true}
                ></fdl-field>
                <fdl-field
                    .record=${this.delivery}
                    field="city"
                    .showValidationErrors=${true}
                ></fdl-field>
                <fdl-field
                    .record=${this.delivery}
                    field="state"
                    .showValidationErrors=${true}
                ></fdl-field>
                <fdl-field
                    .record=${this.delivery}
                    field="zip"
                    .showValidationErrors=${true}
                ></fdl-field>
                ${pickup ? html`<p class="sample-note">Sample store lookup (2-second delay): try ZIP code <strong>28202</strong> or <strong>10001</strong>.</p>` : ''}
                <fdl-field
                    .record=${this.delivery}
                    field="store"
                    select-prompt="Select a store"
                    .showValidationErrors=${true}
                ></fdl-field>
            </div>
            <fdl-record-inspector
                .record=${this.delivery}
            ></fdl-record-inspector>
        </div>`;
    }
    static styles = css`
        :host {
            display: block;
        }
        * {
            box-sizing: border-box;
        }
        .experiment {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 20px;
            align-items: start;
        }
        .experiment:has(fdl-record-inspector[collapsed]) {
            grid-template-columns: minmax(0, 1fr) auto;
        }
        .editor {
            padding: 20px;
            border: 1px solid var(--example-border);
            border-radius: var(--example-radius);
            background: white;
        }
        .sample-note {
            font-size: 0.875rem;
            color: #475569;
        }
        .editor fdl-field:last-child {
            margin-bottom: 0;
        }
        fdl-field {
            --field-label-width: 100%;
            --field-control-width: 100%;
        }
        @media (max-width: 1000px) {
            .experiment,
            .experiment:has(fdl-record-inspector[collapsed]) {
                grid-template-columns: 1fr;
            }
        }
        @media (max-width: 480px) {
            .editor {
                padding: 16px;
            }
        }
        ${exampleTheme}
    `;
}
customElements.define('delivery-form', DeliveryForm);
