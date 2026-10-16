import { field } from '../../index';
import { exampleTheme } from './example-theme';
import { LitElement, css, html } from 'lit';
import Record from '../../record.js';
import './fdl-field';
import { highlightJavaScript } from './highlight-javascript';

export class FdlDeliveryExperiment extends LitElement {
    private activeTab: 'example' | 'code' = 'example';
    private readonly code = `import { field, Record } from 'digital-fdl';

const delivery = new Record({
  fulfillment: field.label('Delivery method')
    .tag('select')
    .options([
      { text: 'Ship to address', value: 'ship' },
      { text: 'Pick up in person', value: 'pickup' },
    ]),
  address: field.label('Shipping address')
    .visibleWhen(record => record.getField('fulfillment') === 'ship')
    .required(record => record.getField('fulfillment') === 'ship'),
}, { fulfillment: 'ship', address: '42 Orchard Street' });`;
    private delivery = new Record({
        fulfillment: field.label('Delivery method').tag('select').options([
            { text: 'Ship to address', value: 'ship' }, { text: 'Pick up in person', value: 'pickup' },
        ]),
        address: field.label('Shipping address')
            .visibleWhen(record => record.getField('fulfillment') === 'ship')
            .required(record => record.getField('fulfillment') === 'ship'),
    }, { fulfillment: 'ship', address: '42 Orchard Street' });
    private refresh = () => this.requestUpdate();
    connectedCallback() { super.connectedCallback(); this.delivery.addEventListener('change', this.refresh); }
    disconnectedCallback() { this.delivery.removeEventListener('change', this.refresh); super.disconnectedCallback(); }
    private selectTab(tab: 'example' | 'code') {
        this.activeTab = tab;
        this.requestUpdate();
    }
    render() {
        const address = this.delivery.fieldTypeForField('address');
        return html`<section aria-label="Try a delivery rule">
            <h2>Try a delivery rule</h2>
            <p>Switch to pickup. What happens to the address you already entered?</p>
            <div class="tabs" role="tablist" aria-label="Delivery example views">
                <button id="delivery-example-tab" role="tab" aria-selected=${this.activeTab === 'example'} aria-controls="delivery-example-panel" @click=${() => this.selectTab('example')}>Interactive example</button>
                <button id="delivery-code-tab" role="tab" aria-selected=${this.activeTab === 'code'} aria-controls="delivery-code-panel" @click=${() => this.selectTab('code')}>FDL code</button>
            </div>
            <div id="delivery-example-panel" class="tab-panel" role="tabpanel" aria-labelledby="delivery-example-tab" ?hidden=${this.activeTab !== 'example'}>
                <div class="experiment">
                    <div class="editor"><fdl-field .record=${this.delivery} field="fulfillment"></fdl-field><fdl-field .record=${this.delivery} field="address" .showValidationErrors=${true}></fdl-field></div>
                    <div class="state" role="status"><dl><div><dt>Delivery</dt><dd>${this.delivery.getField('fulfillment')}</dd></div><div><dt>Stored address</dt><dd>${this.delivery.getField('address') || '(empty)'}</dd></div><div><dt>Address state</dt><dd>${address.visible(this.delivery.getField('address'), this.delivery) ? 'Visible' : 'Hidden'} · ${address.required(this.delivery.getField('address'), this.delivery) ? 'Required' : 'Optional'}</dd></div><div><dt>Record validation</dt><dd>${this.delivery.isValid() ? 'Valid' : 'Invalid'}</dd></div></dl></div>
                </div>
            </div>
            <div id="delivery-code-panel" class="tab-panel" role="tabpanel" aria-labelledby="delivery-code-tab" ?hidden=${this.activeTab !== 'code'}>
                <p class="code-intro">The interactive example is driven by this FDL model:</p>
                <pre class="code"><code>${highlightJavaScript(this.code)}</code></pre>
            </div>
            <p>${address.visible(this.delivery.getField('address'), this.delivery) ? 'Shipping needs an address. Clear it to see the record enforce that rule.' : 'Pickup hides the address and makes it optional. The stored address is preserved; switch back to see it again.'}</p>
            <p><a href="#visibleWhen">Explore visibility</a> · <a href="#required">Explore requiredness</a></p>
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
        .code { margin:0; padding:20px; border-radius:var(--example-radius); background:#0f172a; color:#e2e8f0; font:0.875rem/1.7 monospace; overflow:auto; tab-size:2; }
        .experiment { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px; align-items:stretch; }
        .editor { padding:20px; border:1px solid var(--example-border); border-radius:var(--example-radius); background:white; }
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
