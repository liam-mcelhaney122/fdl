import { exampleTheme } from './example-theme';
import { LitElement, css, html } from 'lit';
import FieldType from '../../field-type.js';
import Record from '../../record.js';
import './fdl-field';

export class FdlDeliveryExperiment extends LitElement {
    private delivery = new Record({
        fulfillment: new FieldType<string>().with.label('Delivery method').and.tag('select').and.options([
            { text: 'Ship to address', value: 'ship' }, { text: 'Pick up in person', value: 'pickup' },
        ]),
        address: new FieldType<string>().with.label('Shipping address')
            .and.visibleWhen(record => record.getField('fulfillment') === 'ship')
            .and.requiredWhen(record => record.getField('fulfillment') === 'ship'),
    }, { fulfillment: 'ship', address: '42 Orchard Street' });
    private refresh = () => this.requestUpdate();
    connectedCallback() { super.connectedCallback(); this.delivery.addEventListener('change', this.refresh); }
    disconnectedCallback() { this.delivery.removeEventListener('change', this.refresh); super.disconnectedCallback(); }
    render() {
        const address = this.delivery.fieldTypeForField('address');
        return html`<section aria-label="Try a delivery rule">
            <h2>Try a delivery rule</h2>
            <p>Switch to pickup. What happens to the address you already entered?</p>
            <div class="experiment">
                <div class="editor"><fdl-field .record=${this.delivery} field="fulfillment"></fdl-field><fdl-field .record=${this.delivery} field="address" .showValidationErrors=${true}></fdl-field></div>
                <div class="state" role="status"><dl><div><dt>Delivery</dt><dd>${this.delivery.getField('fulfillment')}</dd></div><div><dt>Stored address</dt><dd>${this.delivery.getField('address') || '(empty)'}</dd></div><div><dt>Address state</dt><dd>${address.visible(this.delivery) ? 'Visible' : 'Hidden'} · ${address.required(this.delivery) ? 'Required' : 'Optional'}</dd></div><div><dt>Record validation</dt><dd>${this.delivery.isValid() ? 'Valid' : 'Invalid'}</dd></div></dl></div>
            </div>
            <p>${address.visible(this.delivery) ? 'Shipping needs an address. Clear it to see the record enforce that rule.' : 'Pickup hides the address and makes it optional. The stored address is preserved; switch back to see it again.'}</p>
            <p><a href="#visibleWhen">Explore visibility</a> · <a href="#requiredWhen">Explore requiredness</a></p>
        </section>`;
    }
    static styles = css`
        :host { display:block; margin:24px 0 32px; }
        * { box-sizing:border-box; }
        section { border:1px solid var(--example-border); border-radius:var(--example-radius); padding:24px; }
        h2 { margin:0; font-size:1.5rem; } p { line-height:1.6; }
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
