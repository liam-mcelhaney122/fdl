import './fdl-transfer-challenge';
import { compositionLink } from './learning-continuation';
import { exampleTheme } from './example-theme';
import { LitElement, css, html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import FieldType from '../../field-type.js';
import Record from '../../record.js';
import Recordset from '../../recordset.js';
import { recordSummary } from './model-summary';
import { highlightJavaScript } from './highlight-javascript';
import './fdl-field';
import './fdl-table';

const lessons = [
    { question: 'What does a field store?', explanation: 'Start with one delivery charge. Without a parser, the text you enter is the stored value.', reference: 'type', rule: 'A field connects an input to a stored value.' },
    { question: 'How does text become a number?', explanation: 'Add a currency parser and formatter. Try $1,234.50. The model now stores a number; printed output adds currency punctuation.', reference: 'parser', rule: 'Parsing converts currency text to a number; formatting produces display text.' },
    { question: 'What makes a value valid?', explanation: 'Add requiredness and a non-negative, finite-number validator. Try -1 or clear the charge. Parsing does not establish validity.', reference: 'validator', rule: 'The record checks requiredness and the charge validator.' },
    { question: 'What changes when another field changes?', explanation: 'Make the charge visible and required only for shipping. Choose pickup: the charge is preserved and becomes optional. Its number validator remains independent of visibility.', reference: 'requiredWhen', rule: 'Delivery method determines visibility and requiredness independently.' },
    { question: 'How do the rules work across records?', explanation: 'Reuse the same definitions for a table of deliveries. Edit the current delivery above; its table row updates. Other rows show the same rules applied to different values.', reference: 'compareFunction', rule: 'A Recordset reuses the field definitions for multiple records.' },
];
const currency = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});

export class FdlLearningPath extends LitElement {
    private step = 0;
    private definitions() {
        let charge = new FieldType<any>().with.label('Delivery charge').and.textAlign('right');
        if (this.step >= 1) charge = charge.with.parser(value => String(value).trim() === '' ? undefined : Number(String(value).replace(/[$,]/g, '')))
            .and.formatter((value: unknown, _record?: unknown, context?: string) => value == null ? '' : context === 'input-focus' ? String(value) : currency.format(Number(value)));
        if (this.step >= 2) {
            charge = charge.with.validator({name: 'must be a finite, non-negative number', validate: value => value == null || (typeof value === 'number' && Number.isFinite(value) && value >= 0)});
            charge = this.step >= 3 ? charge.with.requiredWhen(record => record.getField('method') === 'ship') : charge.with.required();
        }
        if (this.step >= 3) charge = charge.with.visibleWhen(record => record.getField('method') === 'ship');
        return {
            method: new FieldType<string>().with.label('Delivery method').and.tag('select').and.options([{text: 'Ship', value: 'ship'}, {text: 'Pickup', value: 'pickup'}]),
            charge,
        };
    }
    private record = new Record(this.definitions(), {method: 'ship', charge: '$25.00' as any});
    private table = new Recordset(this.definitions(), []);
    private refresh = () => { this.updateTable(); this.requestUpdate(); };
    private updateTable() {
        this.table.setData([{...this.record.values}, {method: 'ship', charge: 12}, {method: 'pickup', charge: undefined}]);
    }
    connectedCallback() { super.connectedCallback(); this.record.addEventListener('change', this.refresh); this.updateTable(); }
    disconnectedCallback() { this.record.removeEventListener('change', this.refresh); super.disconnectedCallback(); }
    private go(step: number) {
        if (step < 0 || step >= lessons.length || step === this.step) return;
        const oldStep = this.step;
        this.step = step;
        const fields = this.definitions();
        const value = this.record.getField('charge');
        const nextValue = step === 0 ? String(value ?? '') : oldStep === 0 ? fields.charge.parse(value) : value;
        this.record.addField('charge', fields.charge, nextValue);
        this.table = new Recordset(fields, []);
        this.updateTable();
        this.requestUpdate();
        this.updateComplete.then(() => this.shadowRoot?.querySelector<HTMLElement>('#lesson-title')?.focus({preventScroll: true}));
    }
    private reset = () => {
        this.record.setFields({method:'ship', charge:this.step === 0 ? '$25.00' : 25});
        this.requestUpdate();
    };
    private code() {
        return `const charge = new FieldType().with.label('Delivery charge')
  .and.textAlign('right')${this.step >= 1 ? `
  .and.parser(value => String(value).trim() === ''
    ? undefined : Number(String(value).replace(/[$,]/g, '')))
  .and.formatter((value, record, context) => value == null
    ? '' : context === 'input-focus' ? String(value) : currency.format(value))` : ''}${this.step >= 2 ? `
  .and.validator({ name: 'must be a finite, non-negative number',
    validate: value => value == null ||
      (typeof value === 'number' && Number.isFinite(value) && value >= 0) })
  .and.${this.step >= 3 ? "requiredWhen(record => record.getField('method') === 'ship')" : 'required()'}` : ''}${this.step >= 3 ? `
  .and.visibleWhen(record => record.getField('method') === 'ship')` : ''};${this.step >= 4 ? `

const deliveries = new Recordset({ method, charge }, data);` : ''}`;
    }
    render() {
        const lesson = lessons[this.step];
        return html`<div class="lesson-toolbar"><label>Learning question<select aria-label="Learning question" .value=${String(this.step)} @change=${(event: Event) => this.go(Number((event.target as HTMLSelectElement).value))}>${lessons.map((item,index) => html`<option value=${index}>${index + 1} of ${lessons.length}: ${item.question}</option>`)}</select></label><button class="reset-lesson" @click=${this.reset}>Reset this example</button></div>
            <section aria-labelledby="lesson-title"><p class="continuity">Your entered value carries forward between questions. Reset restores this question’s starting values.</p><h2 id="lesson-title" tabindex="-1">${lesson.question}</h2><p>${lesson.explanation}</p>
                <div class="lesson-grid"><div class="lesson-controls">${this.step >= 3 ? html`<fdl-field .record=${this.record} field="method"></fdl-field>` : ''}${keyed(this.record.fieldTypeForField('charge'), html`<fdl-field .record=${this.record} field="charge" .showValidationErrors=${true}></fdl-field>`)}</div><div class="lesson-state" role="status">${recordSummary(this.record, this.step >= 3 ? ['method','charge'] : ['charge'])}</div></div>
                ${this.step >= 4 ? html`<section class="review-view"><h3>Review the same record</h3><p>Delivery: <strong>${this.record.getField('method')}</strong> · Stored charge: <code>${JSON.stringify(this.record.getField('charge'))}</code></p><p>Printed charge: <strong>${this.record.getFormattedField('charge', 'print')}</strong> · Model-only validation: <strong>${this.record.isValid() ? 'Valid' : 'Invalid'}</strong></p></section><h3>Current delivery, another shipment, and a pickup</h3><p>The table reuses these definitions over separate records. Its first row is a refreshed snapshot of the form, rather than the same record object.</p><fdl-table .recordset=${this.table}><fdl-column field="method"></fdl-column><fdl-column field="charge"></fdl-column></fdl-table>` : ''}
                <details open><summary>Rules built so far</summary><ol>${lessons.slice(0, this.step + 1).map(item => html`<li>${item.rule}</li>`)}</ol></details>
                <h3>The current definition</h3><pre><code>${highlightJavaScript(this.code())}</code></pre>
                <p><a href=${`#${lesson.reference}`}>Explore ${lesson.reference} in the modifier reference</a></p>
                ${this.step === lessons.length - 1 ? html`<section class="capabilities"><h3>Check what you can now do</h3><ul><li><a href="#parser">Predict stored numbers versus display text</a> by editing a currency value.</li><li><a href="#composition">Explain why a hidden field can remain invalid</a> by changing one independent rule.</li><li><a href="#how-it-works">Reuse definitions across a form and table</a> while distinguishing shared rules from shared record identity.</li></ul></section><details class="transfer-challenge"><summary>Optional challenge: model a cancellation request</summary><fdl-transfer-challenge></fdl-transfer-challenge></details><p><a class="continue-delivery" href=${compositionLink(this.record.values)}>Next: combine the rules and investigate their outcomes →</a></p>` : ''}
                <div class="lesson-navigation"><button class="previous-lesson" ?disabled=${this.step === 0} @click=${() => this.go(this.step - 1)}>Previous question</button><button class="next-lesson" ?disabled=${this.step === lessons.length - 1} @click=${() => this.go(this.step + 1)}>Next question</button></div>
            </section>`;
    }
    static styles = css`
        :host { display:block; line-height:1.65; }
        button { font:inherit; cursor:pointer; min-height:48px; padding:10px 16px; border:1px solid #cbd5e1; background:white; color:#1d4ed8; }
        button:focus-visible,a:focus-visible,summary:focus-visible { outline:3px solid #2563eb; outline-offset:3px; }
        button:disabled { opacity:.5; cursor:default; }
        .lesson-toolbar { display:flex; align-items:end; gap:12px; justify-content:space-between; flex-wrap:wrap; margin-bottom:24px; }
        .lesson-toolbar label { flex:1; min-width:200px; font-size:.875rem; color:#475569; }
        select { display:block; width:100%; min-height:48px; margin-top:6px; padding:8px 12px; border:1px solid #94a3b8; border-radius:6px; background:white; color:#0f172a; font:inherit; }
        .continuity { font-size:.875rem; color:#475569; }
        .review-view,.capabilities { margin:20px 0; padding:16px; border:1px solid #cbd5e1; border-radius:6px; background:#f8fafc; }
        .question { background:none; border:0; color:#1d4ed8; text-align:left; text-decoration:underline; }
        [aria-current="step"] { font-weight:bold; background:#eff6ff; }
        nav ol { padding-left:24px; } h2 { line-height:1.3; } h2:focus { outline:none; }
        .lesson-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:20px; }
        fdl-field { --field-label-width:100%; --field-control-width:100%; }
        pre { padding:16px; background:#0f172a; color:#e2e8f0; overflow:auto; font: .95rem/1.6 monospace; }
        .syntax-string,.syntax-regex { color:#a7f3d0; } .syntax-keyword { color:#c4b5fd; } .syntax-number { color:#fdba74; }
        details { margin:20px 0; } summary { cursor:pointer; padding:8px 0; }
        .lesson-grid .lesson-controls { background:white; }
        .lesson-controls fdl-field:last-child { margin-bottom:0; }
        .lesson-navigation { display:flex; justify-content:space-between; gap:12px; } a { color:#1d4ed8; }
        fdl-table { display:block; overflow-x:auto; }
        ${exampleTheme}
    `;
}
customElements.define('fdl-learning-path', FdlLearningPath);
