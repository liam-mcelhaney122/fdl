import { LitElement, html } from 'lit';
import './fdl-example';
import './delivery-form';
import modelSource from './delivery-model.ts?raw';
import formSource from './delivery-form.ts?raw';
import dataSource from './delivery-data.ts?raw';

export class FdlDeliveryExperiment extends LitElement {
    render() {
        return html`<fdl-example
            heading="See FDL in Action"
            .filenames=${['delivery-model.ts', 'delivery-form.ts', 'delivery-data.ts']}
            .sources=${{
                'delivery-model.ts': modelSource,
                'delivery-form.ts': formSource,
                'delivery-data.ts': dataSource,
            }}
        >
            <p slot="description">
                The interactive example pairs a working delivery form with an
                inspector showing its stored values and field states. The file
                tabs show the field rules in delivery-model.ts, the controls in
                delivery-form.ts, and the sample data in delivery-data.ts. Clear
                the shipping address to see required-field validation, then
                switch to pickup to see which fields become visible and
                required. Try an incomplete ZIP code to see validation and the
                disabled store selector, then enter 28202 or 10001 to load
                different pickup stores after a two-second delay. Switch back to
                shipping to see that the form keeps the address even while its
                fields are hidden.
            </p>
            <delivery-form></delivery-form>
        </fdl-example>`;
    }
}
customElements.define('fdl-delivery-experiment', FdlDeliveryExperiment);
