import { field } from '../../index';
import { exampleTheme } from './example-theme';
import { LitElement, css, html } from 'lit';
import Record from '../../record.js';
import './fdl-field';
import { highlightJavaScript } from './highlight-javascript';

function whenDeliveryMethodRequiresAddress(record: Record<any>) {
    return record.getField('fulfillment') === 'ship';
}

const stateOptions = [
    ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
    ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
    ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
    ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
    ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
    ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
    ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
    ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
    ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
    ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
    ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
    ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
    ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
].map(([value, text]) => ({ text, value }));

// Sample data only: this example does not call a store-location service.
const storesByZip: { [zip: string]: { text: string; value: string }[] } = {
    '28202': [{ text: 'Uptown store', value: 'uptown' }, { text: 'South End store', value: 'south-end' }],
    '10001': [{ text: 'Chelsea store', value: 'chelsea' }, { text: 'Midtown store', value: 'midtown' }],
};

function whenPickingUp(record: Record<any>) {
    return record.getField('fulfillment') === 'pickup';
}

function hasValidZip(record: Record<any>) {
    return /^[0-9]{5}$/.test(record.getField('zip') || '');
}

function whenReadyToChooseStore(record: Record<any>) {
    return whenPickingUp(record) && hasValidZip(record);
}

function storesForZip(record: Record<any>) {
    return storesByZip[record.getField('zip')] || [];
}

async function loadStoresForZip(record: Record<any>) {
    const stores = whenReadyToChooseStore(record) ? storesForZip(record) : [];
    if (whenReadyToChooseStore(record)) await new Promise(resolve => setTimeout(resolve, 2000));
    return [{ text: 'Select a store', value: '' }, ...stores];
}

export class FdlDeliveryExperiment extends LitElement {
    private activeTab: 'example' | 'code' = 'example';
    private readonly code = `import { field, Record } from 'digital-fdl';

function whenDeliveryMethodRequiresAddress(record) {
  return record.getField('fulfillment') === 'ship';
}

const stateOptions = [
    ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
    ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
    ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
    ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
    ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
    ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
    ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
    ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
    ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
    ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
    ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
    ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
    ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
].map(([value, text]) => ({ text, value }));

// Sample data only: this example does not call a store-location service.
const storesByZip = {
    '28202': [{ text: 'Uptown store', value: 'uptown' }, { text: 'South End store', value: 'south-end' }],
    '10001': [{ text: 'Chelsea store', value: 'chelsea' }, { text: 'Midtown store', value: 'midtown' }],
};

function whenPickingUp(record) {
    return record.getField('fulfillment') === 'pickup';
}

function hasValidZip(record) {
    return /^[0-9]{5}$/.test(record.getField('zip') || '');
}

function whenReadyToChooseStore(record) {
    return whenPickingUp(record) && hasValidZip(record);
}

function storesForZip(record) {
    return storesByZip[record.getField('zip')] || [];
}

async function loadStoresForZip(record) {
    const stores = whenReadyToChooseStore(record) ? storesForZip(record) : [];
    if (whenReadyToChooseStore(record)) await new Promise(resolve => setTimeout(resolve, 2000));
    return [{ text: 'Select a store', value: '' }, ...stores];
}

const deliveryMethod = field.label('Delivery method')
    .options([
      { text: 'Ship to address', value: 'ship' },
      { text: 'Pick up from store', value: 'pickup' },
    ]);
const shippingAddress = field.label('Shipping address')
    .visible(whenDeliveryMethodRequiresAddress)
    .required(whenDeliveryMethodRequiresAddress);

const shippingCity = field.label('City')
    .visible(whenDeliveryMethodRequiresAddress)
    .required(whenDeliveryMethodRequiresAddress);
const shippingState = field.label('State')
    .visible(whenDeliveryMethodRequiresAddress)
    .required(whenDeliveryMethodRequiresAddress)
    .options([{ text: 'Select a state', value: '' }, ...stateOptions]);
const postalZip = field.label('ZIP code')
    .required()
    .validator({
        name: 'must contain five digits',
        validate: (value, _view, record) => !value || hasValidZip(record),
    });
const pickupStore = field.label('Pickup store')
    .visible(whenPickingUp)
    .disabled(record => !hasValidZip(record))
    .required(whenPickingUp)
    .options({ fields: ['zip', 'fulfillment'], fetch: loadStoresForZip })
    .validator({
        name: 'must be available for this ZIP code',
        validate: (value, _view, record) => !whenPickingUp(record) || !value || storesForZip(record).some(store => store.value === value),
    });

export const delivery = new Record({
  fulfillment: deliveryMethod,
  address: shippingAddress,
  city: shippingCity,
  state: shippingState,
  zip: postalZip,
  store: pickupStore,
}, { fulfillment: 'ship', address: '42 Orchard Street', city: 'Charlotte', state: 'NC', zip: '28202', store: '' });`;
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
            <fdl-field .record=\${delivery} field="store"></fdl-field>
        \`;
    }
}

customElements.define('delivery-form', DeliveryForm);`;
    private deliveryMethod = field.label('Delivery method').options([
        { text: 'Ship to address', value: 'ship' }, { text: 'Pick up from store', value: 'pickup' },
    ]);
    private shippingAddress = field.label('Shipping address')
        .visible(whenDeliveryMethodRequiresAddress)
        .required(whenDeliveryMethodRequiresAddress);
    private shippingCity = field.label('City')
        .visible(whenDeliveryMethodRequiresAddress)
        .required(whenDeliveryMethodRequiresAddress);
    private shippingState = field.label('State')
        .visible(whenDeliveryMethodRequiresAddress)
        .required(whenDeliveryMethodRequiresAddress)
        .options([{ text: 'Select a state', value: '' }, ...stateOptions]);
    private postalZip = field.label('ZIP code')
        .required()
        .validator({
            name: 'must contain five digits',
            validate: (value, _view, record) => !value || hasValidZip(record),
        });
    private pickupStore = field.label('Pickup store')
        .visible(whenPickingUp)
        .disabled(record => !hasValidZip(record))
        .required(whenPickingUp)
        .options({ fields: ['zip', 'fulfillment'], fetch: loadStoresForZip })
        .validator({
            name: 'must be available for this ZIP code',
            validate: (value, _view, record) => !whenPickingUp(record) || !value || storesForZip(record).some(store => store.value === value),
        });
    private delivery = new Record({
        fulfillment: this.deliveryMethod,
        address: this.shippingAddress,
        city: this.shippingCity,
        state: this.shippingState,
        zip: this.postalZip,
        store: this.pickupStore,
    }, { fulfillment: 'ship', address: '42 Orchard Street', city: 'Charlotte', state: 'NC', zip: '28202', store: '' });
    private refresh = () => this.requestUpdate();
    connectedCallback() { super.connectedCallback(); this.delivery.addEventListener('change', this.refresh); }
    disconnectedCallback() { this.delivery.removeEventListener('change', this.refresh); super.disconnectedCallback(); }
    private selectTab(tab: 'example' | 'code') {
        this.activeTab = tab;
        this.requestUpdate();
    }
    render() {
        const address = this.delivery.fieldTypeForField('address');
        const pickup = whenPickingUp(this.delivery);
        const ready = whenReadyToChooseStore(this.delivery);
        const store = this.delivery.getField('store');
        const availableStore = storesForZip(this.delivery).find(option => option.value === store);
        const instruction = this.delivery.getField('fulfillment') === 'ship'
            ? this.delivery.getField('address') ? 'Shipping needs an address. Clear it to see the record enforce that rule.' : 'Switch to pickup.'
            : !ready ? 'Enter a five-digit ZIP code to choose a pickup store.'
            : !storesForZip(this.delivery).length ? 'No sample stores for this ZIP code. Try 28202 or 10001.'
            : store && !availableStore ? 'Your stored selection is unavailable for this ZIP code. Choose another store.'
            : availableStore ? 'Pickup is ready. Change the ZIP code to see the available stores change.'
            : 'Choose a store to complete your pickup details.';
        return html`<section aria-label="Try a delivery rule">
            <h2>Try a delivery rule</h2>
            <div class="tabs" role="tablist" aria-label="Delivery example views">
                <button id="delivery-example-tab" role="tab" aria-selected=${this.activeTab === 'example'} aria-controls="delivery-example-panel" @click=${() => this.selectTab('example')}>Interactive example</button>
                <button id="delivery-code-tab" role="tab" aria-selected=${this.activeTab === 'code'} aria-controls="delivery-code-panel" @click=${() => this.selectTab('code')}>FDL code</button>
            </div>
            <div id="delivery-example-panel" class="tab-panel" role="tabpanel" aria-labelledby="delivery-example-tab" ?hidden=${this.activeTab !== 'example'}>
                <p class="instruction">${instruction}</p>
                <div class="experiment">
                    <div class="editor">
                        <fdl-field .record=${this.delivery} field="fulfillment"></fdl-field>
                        <fdl-field .record=${this.delivery} field="address" .showValidationErrors=${true}></fdl-field>
                        <fdl-field .record=${this.delivery} field="city" .showValidationErrors=${true}></fdl-field>
                        <fdl-field .record=${this.delivery} field="state" .showValidationErrors=${true}></fdl-field>
                        <fdl-field .record=${this.delivery} field="zip" .showValidationErrors=${true}></fdl-field>
                        ${pickup ? html`<p class="sample-note">Sample store lookup (2-second delay): try ZIP code <strong>28202</strong> or <strong>10001</strong>.</p>` : ''}
                        <fdl-field .record=${this.delivery} field="store" .showValidationErrors=${true}></fdl-field>
                    </div>
                    <div class="state" role="status"><dl><div><dt>Delivery</dt><dd>${this.delivery.getField('fulfillment')}</dd></div><div><dt>Stored address</dt><dd>${this.delivery.getField('address') || '(empty)'}</dd></div><div><dt>Address state</dt><dd>${address.visible(this.delivery.getField('address'), this.delivery) ? 'Visible' : 'Hidden'} · ${address.required(this.delivery.getField('address'), this.delivery) ? 'Required' : 'Optional'}</dd></div><div><dt>Stored city</dt><dd>${this.delivery.getField('city') || '(empty)'}</dd></div><div><dt>Stored state</dt><dd>${this.delivery.getField('state') || '(empty)'}</dd></div><div><dt>Stored ZIP code</dt><dd>${this.delivery.getField('zip') || '(empty)'}</dd></div><div><dt>Store state</dt><dd>${pickup ? 'Visible' : 'Hidden'} · ${hasValidZip(this.delivery) ? 'Enabled' : 'Disabled'} · ${pickup ? 'Required' : 'Optional'}</dd></div><div><dt>Stored store</dt><dd>${availableStore?.text || store || '(empty)'}</dd></div><div><dt>Record validation</dt><dd>${this.delivery.isValid() ? 'Valid' : 'Invalid'}</dd></div></dl></div>
                </div>
            </div>
            <div id="delivery-code-panel" class="tab-panel" role="tabpanel" aria-labelledby="delivery-code-tab" ?hidden=${this.activeTab !== 'code'}>
                <p class="code-intro">The interactive example is driven by this FDL model and Lit view:</p>
                <h3><code>delivery-model.ts</code></h3>
                <pre class="code"><code>${highlightJavaScript(this.code)}</code></pre>
                <h3><code>delivery-form.ts</code></h3>
                <pre class="code"><code>${highlightJavaScript(this.litCode)}</code></pre>
            </div>
        </section>`;
    }
    static styles = css`
        :host { display:block; margin:24px 0 32px; }
        * { box-sizing:border-box; }
        section { border:1px solid var(--example-border); border-radius:var(--example-radius); padding:24px; }
        h2 { margin:0; font-size:1.5rem; } p { line-height:1.6; }
        .tabs { display:flex; gap:4px; margin:20px 0 0; border-bottom:1px solid var(--example-border); }
        .tabs button { border:0; border-bottom:3px solid transparent; border-radius:4px 4px 0 0; padding:10px 14px; background:transparent; color:#475569; cursor:pointer; font:inherit; font-weight:600; }
        .tabs button[aria-selected="true"] { border-bottom-color:#2563eb; color:#1d4ed8; background:#eff6ff; }
        .tabs button:focus-visible { outline:3px solid #2563eb; outline-offset:2px; }
        .tab-panel { padding-top:20px; }
        .code-intro { margin-top:0; }
        h3 { margin:24px 0 10px; font-size:1rem; }
        .code { margin:0; padding:20px; border-radius:var(--example-radius); background:#0f172a; color:#e2e8f0; font:0.875rem/1.7 monospace; overflow:auto; tab-size:2; }
        .syntax-comment { color:#a5b4c8; font-style:italic; }
        .syntax-string,.syntax-regex { color:#a7f3d0; }
        .syntax-keyword { color:#c4b5fd; }
        .syntax-builtin { color:#7dd3fc; }
        .syntax-function { color:#93c5fd; }
        .syntax-number,.syntax-literal { color:#fdba74; }
        .syntax-punctuation { color:#cbd5e1; }
        .experiment { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px; align-items:stretch; }
        .editor { padding:20px; border:1px solid var(--example-border); border-radius:var(--example-radius); background:white; }
        .sample-note { font-size:.875rem; color:#475569; }
        .editor fdl-field:last-child { margin-bottom:0; }
        fdl-field { --field-label-width:100%; --field-control-width:100%; }
        dl { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px 16px; margin:0; } dt { font-size:.8125rem; font-weight:600; color:#64748b; line-height:1.5; } dd { margin:6px 0 0; font-size:1rem; line-height:1.5; }
        p { margin:16px 0; } section > p:last-child { margin-bottom:0; }
        @media(max-width:480px) { section { padding:16px; } .editor,.state { padding:16px; } }
        a { color:#1d4ed8; } a:focus-visible { outline:3px solid #2563eb; outline-offset:3px; }
        @media(max-width:1000px) { .experiment { grid-template-columns:1fr; } }
        ${exampleTheme}
    `;
}
customElements.define('fdl-delivery-experiment', FdlDeliveryExperiment);
