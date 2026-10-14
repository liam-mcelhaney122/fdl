import { LitElement, css, html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import FieldType from '../../field-type.js';
import Record from '../../record.js';
import Recordset from '../../recordset.js';
import './fdl-field';
import './fdl-table';

export class FdlSpecializationExperiment extends LitElement {
    private base = new FieldType<string>().with.label('Name');
    private sibling = this.base.with.minLength(2);
    private required = this.base.with.required();
    private enabled = true;
    private get definitions() { return { base: this.base, required: this.required, sibling: this.sibling }; }
    private record = new Record(this.definitions, { base: '', required: '', sibling: '' });
    private table = new Recordset(this.definitions, [{ ...this.record.values }]);
    private syncing = false;
    private sync = (event: Event) => {
        if (this.syncing) return;
        this.syncing = true;
        const field = (event as CustomEvent<{field: 'base' | 'required' | 'sibling'}>).detail.field;
        const value = this.record.getField(field);
        (['base', 'required', 'sibling'] as const).forEach(key => { if (this.record.getField(key) !== value) this.record.setField(key, value); });
        this.table.setData([{ ...this.record.values }]);
        this.syncing = false;
        this.requestUpdate();
    };
    connectedCallback() { super.connectedCallback(); this.record.addEventListener('change', this.sync); }
    disconnectedCallback() { this.record.removeEventListener('change', this.sync); super.disconnectedCallback(); }
    private toggle = () => {
        this.enabled = !this.enabled;
        this.required = this.enabled ? this.base.with.required() : this.base;
        this.record.addField('required', this.required, this.record.getField('required'));
        this.table = new Recordset(this.definitions, [{ ...this.record.values }]);
        this.requestUpdate();
    };
    render() {
        return html`<section aria-label="Explore immutable specialization"><h2>One base, independent specializations</h2>
            <p>Edit any name; all three receive the same test value. Remove the required rule from its specialization and compare the base and sibling.</p>
            <button @click=${this.toggle}>${this.enabled ? 'Remove' : 'Add'} required rule on requiredName</button>
            <div class="variants">${(['base', 'required', 'sibling'] as const).map(key => html`<section aria-label=${`${key} definition`}><h3>${key === 'base' ? 'baseName' : key === 'required' ? 'requiredName' : 'shortName'}</h3>
                <code>${key === 'base' ? "new FieldType().with.label('Name')" : key === 'required' ? this.enabled ? 'baseName.with.required()' : 'baseName' : 'baseName.with.minLength(2)'}</code>
                ${keyed(this.record.fieldTypeForField(key), html`<fdl-field .record=${this.record} field=${key} .showValidationErrors=${true}></fdl-field>`)}
                <p class="variant-state">${this.record.fieldTypeForField(key).required(this.record) ? 'Required' : 'Optional'} · ${this.record.isValid(key) ? 'Valid' : 'Invalid'}</p></section>`)}</div>
            <h3>The same definitions in a table</h3>
            <fdl-table .recordset=${this.table}><fdl-column field="base" label="baseName"></fdl-column><fdl-column field="required" label="requiredName"></fdl-column><fdl-column field="sibling" label="shortName"></fdl-column></fdl-table>
            <p role="status">The base is ${this.base.required(this.record) ? 'required' : 'optional'}; shortName still has a ${this.sibling.minLength()}-character minimum. Specializing requiredName changes neither definition.</p>
        </section>`;
    }
    static styles = css`
        :host { display:block; margin:28px 0; line-height:1.6; }
        .variants { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin:20px 0; }
        .variants section { border:1px solid #cbd5e1; padding:16px; min-width:0; }
        h2 { font-size:1.5rem; } h3 { margin:0 0 12px; font-size:1.1rem; }
        code { display:block; min-height:3.5em; overflow-wrap:anywhere; font-size:.9rem; }
        fdl-field { --field-label-width:100%; --field-control-width:100%; }
        button { font:inherit; min-height:44px; padding:8px 12px; background:#2563eb; color:white; border:0; border-radius:4px; cursor:pointer; }
        button:focus-visible { outline:3px solid #2563eb; outline-offset:3px; }
        .variant-state { background:#eff6ff; padding:8px; } fdl-table { display:block; overflow-x:auto; }
    `;
}
customElements.define('fdl-specialization-experiment', FdlSpecializationExperiment);
