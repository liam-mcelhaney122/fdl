import { field } from '../../index';
import { exampleTheme } from './example-theme';
import { LitElement, css, html } from 'lit';
import Record from '../../record.js';
import './fdl-field';
import { highlightJavaScript } from './highlight-javascript';
import {
    deliveryMethodOptions,
    shippingStateOptions,
    storesByZip,
} from './delivery-data';

const statusPaths = {
    Hidden: 'M3 3l18 18 M10 5a12 12 0 0 1 12 7s-1 2-3 4 M14 19C6 20 2 12 2 12s1-2 4-4 M10 10a3 3 0 0 0 4 4',
    Disabled: 'M8 11V7a4 4 0 0 1 8 0v4 M5 11h14v10H5z M12 15v2',
    Required: 'M12 4v16 M5 8l14 8 M5 16l14-8',
    Invalid: 'M12 3L2 21h20z M12 9v5 M12 17v1',
};

function statusIcon(status: keyof typeof statusPaths) {
    return html`<span
        class="status-icon"
        role="img"
        aria-label=${status}
        title=${status}
    >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d=${statusPaths[status]}></path>
        </svg>
    </span>`;
}

function whenDeliveryMethodRequiresAddress(record: Record<any>) {
    return record.getField('fulfillment') === 'ship';
}

function whenPickingUp(record: Record<any>) {
    return record.getField('fulfillment') === 'pickup';
}

function isValidZip(zip: unknown) {
    return typeof zip === 'string' && /^[0-9]{5}$/.test(zip);
}

function whenZipIsInvalid(record: Record<any>) {
    return !isValidZip(record.getField('zip'));
}

async function loadStoresForZip(zip: string) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return storesByZip[zip] || [];
}

const pickupStoreOptions = {
    fields: ['zip'],
    fetch: (record: Record<any>) => loadStoresForZip(record.getField('zip')),
};
const postalZipValidator = {
    name: 'must contain five digits',
    validate: (zip: unknown) => isValidZip(zip),
};

export class FdlDeliveryExperiment extends LitElement {
    private activeTab: 'example' | 'code' = 'example';
    private readonly code = `import { field, Record } from 'digital-fdl';
import {
    deliveryMethodOptions,
    shippingStateOptions,
    storesByZip,
} from './delivery-data';

function whenDeliveryMethodRequiresAddress(record) {
    return record.getField('fulfillment') === 'ship';
}

function whenPickingUp(record) {
    return record.getField('fulfillment') === 'pickup';
}

function isValidZip(zip) {
    return typeof zip === 'string' && /^[0-9]{5}$/.test(zip);
}

function whenZipIsInvalid(record) {
    return !isValidZip(record.getField('zip'));
}

async function loadStoresForZip(zip) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return storesByZip[zip] || [];
}

const pickupStoreOptions = {
    fields: ['zip'],
    fetch: record => loadStoresForZip(record.getField('zip')),
};
const postalZipValidator = {
    name: 'must contain five digits',
    validate: zip => isValidZip(zip),
};

export const delivery = new Record(
    // prettier-ignore
    {
        fulfillment: field
            .label('Delivery method')
            .options(deliveryMethodOptions),
        address: field
            .label('Shipping address')
            .visible(whenDeliveryMethodRequiresAddress)
            .required(whenDeliveryMethodRequiresAddress),
        city: field
            .label('City')
            .visible(whenDeliveryMethodRequiresAddress)
            .required(whenDeliveryMethodRequiresAddress),
        state: field
            .label('State')
            .visible(whenDeliveryMethodRequiresAddress)
            .required(whenDeliveryMethodRequiresAddress)
            .options(shippingStateOptions),
        zip: field
            .label('ZIP code')
            .required()
            .validator(postalZipValidator),
        store: field
            .label('Pickup store')
            .visible(whenPickingUp)
            .disabled(whenZipIsInvalid)
            .required(whenPickingUp)
            .options(pickupStoreOptions),
    },
    {
        fulfillment: 'ship',
        address: '42 Orchard Street',
        city: 'Charlotte',
        state: 'NC',
        zip: '28202',
        store: '',
    }
);`;
    private readonly litCode = `import { LitElement, html } from 'lit';
import { delivery } from './delivery-model';
import './fdl-field';

export class DeliveryForm extends LitElement {
    render() {
        return html\`
            <fdl-field .record=\${delivery} field="fulfillment"></fdl-field>
            <fdl-field .record=\${delivery} field="address"></fdl-field>
            <fdl-field .record=\${delivery} field="city"></fdl-field>
            <fdl-field .record=\${delivery} field="state"></fdl-field>
            <fdl-field .record=\${delivery} field="zip"></fdl-field>
            <fdl-field
                .record=\${delivery}
                field="store"
                select-prompt="Select a store"
            ></fdl-field>
        \`;
    }
}

customElements.define('delivery-form', DeliveryForm);`;
    private readonly dataCode = `export const deliveryMethodOptions = [
    { text: 'Ship to address', value: 'ship' },
    { text: 'Pick up from store', value: 'pickup' },
];

const stateOptions = [
    ['AL', 'Alabama'],
    ['AK', 'Alaska'],
    ['AZ', 'Arizona'],
    ['AR', 'Arkansas'],
    ['CA', 'California'],
    ['CO', 'Colorado'],
    ['CT', 'Connecticut'],
    ['DE', 'Delaware'],
    ['DC', 'District of Columbia'],
    ['FL', 'Florida'],
    ['GA', 'Georgia'],
    ['HI', 'Hawaii'],
    ['ID', 'Idaho'],
    ['IL', 'Illinois'],
    ['IN', 'Indiana'],
    ['IA', 'Iowa'],
    ['KS', 'Kansas'],
    ['KY', 'Kentucky'],
    ['LA', 'Louisiana'],
    ['ME', 'Maine'],
    ['MD', 'Maryland'],
    ['MA', 'Massachusetts'],
    ['MI', 'Michigan'],
    ['MN', 'Minnesota'],
    ['MS', 'Mississippi'],
    ['MO', 'Missouri'],
    ['MT', 'Montana'],
    ['NE', 'Nebraska'],
    ['NV', 'Nevada'],
    ['NH', 'New Hampshire'],
    ['NJ', 'New Jersey'],
    ['NM', 'New Mexico'],
    ['NY', 'New York'],
    ['NC', 'North Carolina'],
    ['ND', 'North Dakota'],
    ['OH', 'Ohio'],
    ['OK', 'Oklahoma'],
    ['OR', 'Oregon'],
    ['PA', 'Pennsylvania'],
    ['RI', 'Rhode Island'],
    ['SC', 'South Carolina'],
    ['SD', 'South Dakota'],
    ['TN', 'Tennessee'],
    ['TX', 'Texas'],
    ['UT', 'Utah'],
    ['VT', 'Vermont'],
    ['VA', 'Virginia'],
    ['WA', 'Washington'],
    ['WV', 'West Virginia'],
    ['WI', 'Wisconsin'],
    ['WY', 'Wyoming'],
].map(([value, text]) => ({ text, value }));

// Sample data only: this example does not call a store-location service.
export const storesByZip: { [zip: string]: { text: string; value: string }[] } =
    {
        '28202': [
            { text: 'Uptown store', value: 'uptown' },
            { text: 'South End store', value: 'south-end' },
        ],
        '10001': [
            { text: 'Chelsea store', value: 'chelsea' },
            { text: 'Midtown store', value: 'midtown' },
        ],
    };

export const shippingStateOptions = [
    { text: 'Select a state', value: '' },
    ...stateOptions,
];`;

    private delivery = new Record(
        // prettier-ignore
        {
            fulfillment: field
                .label('Delivery method')
                .options(deliveryMethodOptions),
            address: field
                .label('Shipping address')
                .visible(whenDeliveryMethodRequiresAddress)
                .required(whenDeliveryMethodRequiresAddress),
            city: field
                .label('City')
                .visible(whenDeliveryMethodRequiresAddress)
                .required(whenDeliveryMethodRequiresAddress),
            state: field
                .label('State')
                .visible(whenDeliveryMethodRequiresAddress)
                .required(whenDeliveryMethodRequiresAddress)
                .options(shippingStateOptions),
            zip: field
                .label('ZIP code')
                .required()
                .validator(postalZipValidator),
            store: field
                .label('Pickup store')
                .visible(whenPickingUp)
                .disabled(whenZipIsInvalid)
                .required(whenPickingUp)
                .options(pickupStoreOptions),
        },
        {
            fulfillment: 'ship',
            address: '42 Orchard Street',
            city: 'Charlotte',
            state: 'NC',
            zip: '28202',
            store: '',
        }
    );
    private refresh = () => this.requestUpdate();
    connectedCallback() {
        super.connectedCallback();
        this.delivery.addEventListener('change', this.refresh);
    }
    disconnectedCallback() {
        this.delivery.removeEventListener('change', this.refresh);
        super.disconnectedCallback();
    }
    private selectTab(tab: 'example' | 'code') {
        this.activeTab = tab;
        this.requestUpdate();
    }
    render() {
        const pickup = whenPickingUp(this.delivery);
        const zip = this.delivery.getField('zip');
        const ready = isValidZip(zip);
        const stores = storesByZip[zip] || [];
        const store = this.delivery.getField('store');
        const availableStore = stores.find(option => option.value === store);
        const instruction =
            this.delivery.getField('fulfillment') === 'ship'
                ? this.delivery.getField('address')
                    ? 'Shipping needs an address. Clear it to see the record enforce that rule.'
                    : 'Switch to pickup.'
                : !ready
                  ? 'Enter a five-digit ZIP code to choose a pickup store.'
                  : !stores.length
                    ? 'No sample stores for this ZIP code. Try 28202 or 10001.'
                    : availableStore
                      ? 'Pickup is ready. Change the ZIP code to see the available stores change.'
                      : 'Choose a store to complete your pickup details.';
        return html`<section aria-label="Try a delivery rule">
            <h2>Try a delivery rule</h2>
            <div
                class="tabs"
                role="tablist"
                aria-label="Delivery example views"
            >
                <button
                    id="delivery-example-tab"
                    role="tab"
                    aria-selected=${this.activeTab === 'example'}
                    aria-controls="delivery-example-panel"
                    @click=${() => this.selectTab('example')}
                    >Interactive example</button
                >
                <button
                    id="delivery-code-tab"
                    role="tab"
                    aria-selected=${this.activeTab === 'code'}
                    aria-controls="delivery-code-panel"
                    @click=${() => this.selectTab('code')}
                    >FDL code</button
                >
            </div>
            <div
                id="delivery-example-panel"
                class="tab-panel"
                role="tabpanel"
                aria-labelledby="delivery-example-tab"
                ?hidden=${this.activeTab !== 'example'}
            >
                <p class="instruction">${instruction}</p>
                <div class="experiment">
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
                    <div class="state">
                        <table>
                            <caption>Field state</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Field</th>
                                    <th scope="col">Stored value</th>
                                    <th scope="col">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(
                                    [
                                        'fulfillment',
                                        'address',
                                        'city',
                                        'state',
                                        'zip',
                                        'store',
                                    ] as const
                                ).map(name => {
                                    const type =
                                        this.delivery.fieldTypeForField(name);
                                    const value = this.delivery.getField(name);
                                    return html`<tr data-field=${name}>
                                        <th scope="row"
                                            >${type.label(value, this.delivery)}</th
                                        >
                                        <td
                                            >${name === 'store' ? availableStore?.text || value || '(empty)' : value || '(empty)'}</td
                                        >
                                        <td
                                            ><span class="field-status">
                                                ${!type.visible(value, this.delivery) ? statusIcon('Hidden') : ''}
                                                ${type.isDisabled(value, this.delivery) ? statusIcon('Disabled') : ''}
                                                ${type.required(value, this.delivery) ? statusIcon('Required') : ''}
                                                ${!this.delivery.isValid(name) ? statusIcon('Invalid') : ''}
                                            </span></td
                                        >
                                    </tr>`;
                                })}
                            </tbody>
                        </table>
                        <div class="legend" aria-label="Status icon legend">
                            <p>Icon legend</p>
                            <ul>
                                ${Object.keys(statusPaths).map(status => html`<li>${statusIcon(status as keyof typeof statusPaths)}<span>${status}</span></li>`)}
                            </ul>
                        </div>
                        <p class="validation" role="status"
                            >Record validation:
                            <strong
                                >${this.delivery.isValid() ? 'Valid' : 'Invalid'}</strong
                            >
                        </p>
                    </div>
                </div>
            </div>
            <div
                id="delivery-code-panel"
                class="tab-panel"
                role="tabpanel"
                aria-labelledby="delivery-code-tab"
                ?hidden=${this.activeTab !== 'code'}
            >
                <p class="code-intro"
                    >The interactive example is driven by this FDL model and Lit
                    view:</p
                >
                <h3><code>delivery-model.ts</code></h3>
                <p>
                    Defines the delivery fields, conditional shipping and pickup
                    rules, ZIP code validation, and store lookup by ZIP code.
                </p>
                <pre
                    class="code"
                ><code>${highlightJavaScript(this.code)}</code></pre>
                <h3><code>delivery-form.ts</code></h3>
                <p>
                    Connects the delivery model to FDL field components in a Lit
                    view, so each control reflects the model’s rules.
                </p>
                <pre
                    class="code"
                ><code>${highlightJavaScript(this.litCode)}</code></pre>
                <h3><code>delivery-data.ts</code></h3>
                <p>
                    Supplies delivery methods, US state options, and sample
                    pickup stores for ZIP codes 28202 and 10001.
                </p>
                <pre
                    class="code"
                ><code>${highlightJavaScript(this.dataCode)}</code></pre>
            </div>
        </section>`;
    }
    static styles = css`
        :host {
            display: block;
            margin: 24px 0 32px;
        }
        * {
            box-sizing: border-box;
        }
        section {
            border: 1px solid var(--example-border);
            border-radius: var(--example-radius);
            padding: 24px;
        }
        h2 {
            margin: 0;
            font-size: 1.5rem;
        }
        p {
            line-height: 1.6;
        }
        .tabs {
            display: flex;
            gap: 4px;
            margin: 20px 0 0;
            border-bottom: 1px solid var(--example-border);
        }
        .tabs button {
            border: 0;
            border-bottom: 3px solid transparent;
            border-radius: 4px 4px 0 0;
            padding: 10px 14px;
            background: transparent;
            color: #475569;
            cursor: pointer;
            font: inherit;
            font-weight: 600;
        }
        .tabs button[aria-selected='true'] {
            border-bottom-color: #2563eb;
            color: #1d4ed8;
            background: #eff6ff;
        }
        .tabs button:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: 2px;
        }
        .tab-panel {
            padding-top: 20px;
        }
        .code-intro {
            margin-top: 0;
        }
        h3 {
            margin: 24px 0 10px;
            font-size: 1rem;
        }
        .code {
            margin: 0;
            padding: 20px;
            border-radius: var(--example-radius);
            background: #0f172a;
            color: #e2e8f0;
            font: 0.875rem/1.7 monospace;
            overflow: auto;
            tab-size: 2;
        }
        .syntax-comment {
            color: #a5b4c8;
            font-style: italic;
        }
        .syntax-string,
        .syntax-regex {
            color: #a7f3d0;
        }
        .syntax-keyword {
            color: #c4b5fd;
        }
        .syntax-builtin {
            color: #7dd3fc;
        }
        .syntax-function {
            color: #93c5fd;
        }
        .syntax-number,
        .syntax-literal {
            color: #fdba74;
        }
        .syntax-punctuation {
            color: #cbd5e1;
        }
        .experiment {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 20px;
            align-items: start;
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
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 0.875rem;
            line-height: 1.5;
        }
        caption {
            text-align: left;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 12px;
        }
        th,
        td {
            padding: 12px 6px;
            border-bottom: 1px solid var(--example-border);
            text-align: left;
            vertical-align: top;
            overflow-wrap: anywhere;
        }
        thead th {
            color: #64748b;
            font-size: 0.8125rem;
        }
        th:first-child {
            width: 30%;
            padding-left: 0;
        }
        th:last-child {
            width: 110px;
        }
        .field-status {
            display: flex;
            gap: 6px;
        }
        .status-icon {
            display: inline-flex;
            flex: 0 0 20px;
            width: 20px;
            height: 20px;
            color: #475569;
        }
        .status-icon svg {
            width: 100%;
            height: 100%;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.75;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
        .legend {
            margin-top: 20px;
            font-size: 0.8125rem;
            color: #475569;
        }
        .legend p {
            margin: 0 0 8px;
            font-weight: 600;
        }
        .legend ul {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px 16px;
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .legend li {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .validation {
            padding-top: 16px;
            border-top: 1px solid var(--example-border);
            font-size: 0.875rem;
            margin-bottom: 0;
        }
        p {
            margin: 16px 0;
        }
        section > p:last-child {
            margin-bottom: 0;
        }
        @media (max-width: 480px) {
            section {
                padding: 16px;
            }
            .editor,
            .state {
                padding: 16px;
            }
        }
        a {
            color: #1d4ed8;
        }
        a:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: 3px;
        }
        @media (max-width: 1000px) {
            .experiment {
                grid-template-columns: 1fr;
            }
        }
        ${exampleTheme}
    `;
}
customElements.define('fdl-delivery-experiment', FdlDeliveryExperiment);
