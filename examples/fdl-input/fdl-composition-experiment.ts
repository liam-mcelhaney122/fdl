import { LitElement, css, html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import FieldType from '../../field-type.js';
import Record from '../../record.js';
import { exampleTheme } from './example-theme';
import { highlightJavaScript } from './highlight-javascript';
import { addressCases, addressCase, compositionFields, compositionRecord, compositionDefinition, defaultCompositionRules, type CompositionRules } from './composition-model';
import './fdl-field';

export class FdlCompositionExperiment extends LitElement {
    private configuration = new Record({
        visibility: new FieldType<string>().with.label('Show the address').and.tag('select').and.options([{text: 'For shipping only', value: 'shipping'}, {text: 'For both delivery methods', value: 'all'}]),
        requiredness: new FieldType<string>().with.label('Require an address').and.tag('select').and.options([{text: 'For shipping only', value: 'shipping'}, {text: 'Always', value: 'always'}, {text: 'Never', value: 'never'}]),
        validation: new FieldType<string>().with.label('Check the address format').and.tag('select').and.options([{text: 'Street number and name', value: 'on'}, {text: 'No format check', value: 'off'}]),
    }, {...defaultCompositionRules});
    private get rules(): CompositionRules { return this.configuration.values as CompositionRules; }
    private record = compositionRecord(this.rules, 'ship', '42 Orchard Street');
    private appliedRules = JSON.stringify(this.rules);
    private refresh = () => this.requestUpdate();
    private changeRules = () => {
        const key = JSON.stringify(this.rules);
        if (key === this.appliedRules) return;
        this.appliedRules = key;
        this.record.addField('address', compositionFields(this.rules).address, this.record.getField('address'));
        this.requestUpdate();
    };
    connectedCallback() {
        super.connectedCallback();
        this.configuration.addEventListener('change', this.changeRules);
        this.record.addEventListener('change', this.refresh);
    }
    disconnectedCallback() {
        this.configuration.removeEventListener('change', this.changeRules);
        this.record.removeEventListener('change', this.refresh);
        super.disconnectedCallback();
    }
    private selectCase(method: string, value: string) {
        this.record.setFields({fulfillment: method, address: value});
        this.updateComplete.then(() => {
            const heading = this.shadowRoot?.querySelector<HTMLElement>('#selected-case-title');
            heading?.focus({preventScroll: true});
            heading?.scrollIntoView?.({block: 'nearest'});
        });
    }
    private reset = () => {
        this.configuration.setFields({...defaultCompositionRules});
        this.record.setFields({fulfillment: 'ship', address: '42 Orchard Street'});
    };
    private outcomes() {
        return html`<p class="scroll-hint">Scroll the comparison horizontally to see all three address cases.</p><div class="outcomes" role="region" aria-label="Delivery outcome comparison" tabindex="0"><table><caption>Two delivery methods × three kinds of stored address</caption>
            <thead><tr><th scope="col">Delivery method</th>${addressCases.map(sample => html`<th scope="col">${sample.title}<small>${sample.value || '(empty string)'}</small></th>`)}</tr></thead>
            <tbody>${['ship', 'pickup'].map(method => html`<tr><th scope="row">${method === 'ship' ? 'Shipping' : 'Pickup'}</th>${addressCases.map(sample => {
                const record = compositionRecord(this.rules, method, sample.value);
                const type = record.fieldTypeForField('address');
                const selected = this.record.getField('fulfillment') === method && addressCase(this.record.getField('address')) === sample.id;
                const hiddenInvalid = !type.visible(record) && !record.isValid();
                return html`<td><button class="case" data-method=${method} data-address-case=${sample.id} aria-pressed=${selected} @click=${() => this.selectCase(method, sample.value)}>
                    <strong>${record.isValid() ? 'Valid record' : 'Invalid record'}</strong><span>${type.visible(record) ? 'Visible' : 'Hidden'} · ${type.required(record) ? 'Required' : 'Optional'}</span>${hiddenInvalid ? html`<em>Hidden, but still invalid</em>` : ''}<span class="case-action">${selected ? 'Selected kind of case' : 'Inspect this case →'}</span>
                </button></td>`;
            })}</tr>`)}</tbody></table></div>`;
    }
    private explanation() {
        const type = this.record.fieldTypeForField('address');
        const method = this.record.getField('fulfillment');
        const value = this.record.getField('address');
        const visible = type.visible(this.record);
        const required = type.required(this.record);
        const errors: string[] = this.record.readableFieldErrors('address');
        return html`<div class="state" role="status"><h3>Why this result?</h3><ol>
            <li><strong>Visibility:</strong> ${this.rules.visibility === 'all' ? 'Both delivery methods show the address.' : html`The shipping predicate is <code>${String(method === 'ship')}</code>.`} The control is ${visible ? 'visible' : 'hidden'}.</li>
            <li><strong>Requiredness:</strong> ${this.rules.requiredness === 'always' ? 'The required rule always applies.' : this.rules.requiredness === 'never' ? 'No required rule is declared.' : html`The shipping predicate is <code>${String(method === 'ship')}</code>.`} The address is ${required ? 'required' : 'optional'}.</li>
            <li><strong>Format:</strong> ${this.rules.validation === 'off' ? 'No format validator is declared.' : value === '' ? 'The format validator accepts an empty value; requiredness is checked separately.' : addressCase(value) === 'numbered' ? 'The stored address passes the street-number check.' : 'The stored address fails the street-number check.'}</li>
        </ol><p class="verdict"><strong>${this.record.isValid() ? 'The record is valid.' : 'The record is invalid.'}</strong></p>
            ${errors.length ? html`<ul class="errors">${errors.map(error => html`<li>${error}</li>`)}</ul>` : ''}
            ${!visible && errors.length ? html`<p class="surprise">Hiding the control leaves the value and its validation rules in the model. Switch to shipping to edit it, or change the rules above.</p>` : ''}
            <p>Stored address: <code>${JSON.stringify(value)}</code>. Switching delivery method preserves it.</p>
        </div>`;
    }
    render() {
        return html`<section aria-labelledby="composition-title"><div class="title-row"><h2 id="composition-title">How do independent rules combine?</h2><button class="reset" @click=${this.reset}>Reset experiment</button></div>
            <p>Change one rule and compare all six outcomes. Visibility, requiredness, and validity are independent decisions.</p>
            <section class="rule-controls" aria-label="Choose the rules"><h3>1. Choose the rules</h3><div class="rule-workspace">${['visibility','requiredness','validation'].map(field => html`<fdl-field .record=${this.configuration} field=${field}></fdl-field>`)}</div></section>
            <section aria-label="Compare all outcomes"><h3>2. Compare the possibilities</h3><p>Each cell runs a real FDL record with the rules above. Select a cell to inspect its exact example. When you edit the form, the grid highlights the matching kind of case.</p>${this.outcomes()}</section>
            <section class="selected-case" aria-labelledby="selected-case-title"><h3 id="selected-case-title" tabindex="-1">3. Inspect the selected case</h3><div class="case-workspace"><div class="editor">
                <fdl-field .record=${this.record} field="fulfillment"></fdl-field>
                ${keyed(this.record.fieldTypeForField('address'), html`<fdl-field .record=${this.record} field="address" .showValidationErrors=${true}></fdl-field>`)}
                <p>Try your own address. The number check is an illustrative format rule, not proof that an address exists or accepts deliveries.</p>
            </div>${this.explanation()}</div></section>
            <section class="definition"><h3>The resulting definition</h3><pre><code>${highlightJavaScript(compositionDefinition(this.rules))}</code></pre><p>This is the address definition used by every case and by the live form.</p></section>
            <details class="questions"><summary>Questions to investigate</summary><ul><li>Does hiding a field make it optional? Choose Always under requiredness, then inspect Pickup × Empty.</li><li>Does optional mean any value is allowed? Choose Never under requiredness and inspect an address without a number.</li><li>Which rule would you change to get the behavior you intended? Compare switching off the format check with showing the field for both delivery methods.</li></ul></details>
        </section>`;
    }
    static styles = css`
        :host { display:block; line-height:1.65; color:#0f172a; }
        * { box-sizing:border-box; } h2 { margin:0; font-size:1.5rem; line-height:1.3; } h3 { font-size:1.125rem; margin:0 0 16px; line-height:1.4; }
        p { margin:0 0 20px; } section + section { margin-top:28px; }
        .title-row { display:flex; align-items:start; justify-content:space-between; gap:16px; margin-bottom:20px; }
        button { font:inherit; cursor:pointer; min-height:48px; }
        .reset { flex-shrink:0; border:1px solid #cbd5e1; background:white; color:#1d4ed8; padding:8px 12px; }
        .rule-workspace { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; margin:0; align-items:start; }
        .case-workspace { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.2fr); gap:20px; margin:24px 0; align-items:start; }
        .definition,.editor { border:1px solid var(--example-border); border-radius:var(--example-radius); padding:20px; min-width:0; }
        .rule-controls fdl-field { margin-bottom:0; } .definition { margin-top:0; }
        fdl-field { --field-label-width:100%; --field-control-width:100%; }
        pre { margin:0 0 16px; padding:16px; background:#0f172a; color:#e2e8f0; overflow:auto; font:.875rem/1.65 monospace; border-radius:6px; white-space:pre-wrap; overflow-wrap:anywhere; }
        .definition p,.editor p { font-size:.875rem; color:#475569; margin-bottom:0; }
        .scroll-hint { display:none; font-size:.875rem; color:#475569; }
        .outcomes { overflow-x:auto; } table { border-collapse:separate; border-spacing:0; width:100%; table-layout:fixed; font-size:.875rem; }
        caption { text-align:left; font-weight:600; padding:0 0 12px; color:#475569; }
        th { padding:12px 8px; text-align:left; vertical-align:top; overflow-wrap:anywhere; } th:first-child { width:100px; position:sticky; left:0; background:white; z-index:1; }
        th small { display:block; margin-top:8px; font-weight:400; line-height:1.5; color:#64748b; }
        td { vertical-align:top; padding:4px; height:1px; } .case { display:flex; flex-direction:column; gap:8px; width:100%; min-height:152px; height:100%; padding:12px; text-align:left; border:1px solid var(--example-border); background:white; font-size:.875rem; line-height:1.5; overflow-wrap:anywhere; }
        .case:hover { border-color:#2563eb; } .case[aria-pressed="true"] { border:2px solid #2563eb; padding:11px; background:#eff6ff; }
        .case-action { margin-top:auto; color:#1d4ed8; } .case em { color:#9a3412; font-style:normal; }
        .state ol { margin:0; padding-left:20px; font-size:1rem; } .state li { margin-bottom:12px; }
        .state p { font-size:1rem; } .state p:last-child { margin-bottom:0; } .verdict { margin:20px 0 12px; }
        .errors { color:#9f2920; padding-left:20px; } .surprise { padding-top:12px; border-top:1px solid var(--example-border); }
        .questions { border-top:1px solid var(--example-border); padding-top:12px; } summary { cursor:pointer; min-height:44px; padding:8px 0; }
        button:focus-visible,summary:focus-visible,.outcomes:focus-visible,#selected-case-title:focus { outline:3px solid #2563eb; outline-offset:3px; } #selected-case-title { scroll-margin-top:20px; }
        .syntax-string,.syntax-regex { color:#a7f3d0; } .syntax-keyword { color:#c4b5fd; } .syntax-builtin { color:#7dd3fc; } .syntax-number { color:#fdba74; }
        @media(max-width:1100px) { .case-workspace { grid-template-columns:1fr; } }
        @media(max-width:700px) { .rule-workspace { grid-template-columns:1fr; } .title-row { flex-direction:column; } .definition,.editor { padding:16px; } table { min-width:560px; } .scroll-hint { display:block; } }
        ${exampleTheme}
    `;
}
customElements.define('fdl-composition-experiment', FdlCompositionExperiment);
