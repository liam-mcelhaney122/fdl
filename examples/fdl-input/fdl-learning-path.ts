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
        return html`<nav aria-label="Learning questions"><ol>${lessons.map((item, index) => html`<li><button class="question" aria-current=${index === this.step ? 'step' : 'false'} @click=${() => this.go(index)}>${item.question}</button></li>`)}</ol></nav>
            <section aria-labelledby="lesson-title"><p>Step ${this.step + 1} of ${lessons.length}</p><h2 id="lesson-title" tabindex="-1">${lesson.question}</h2><p>${lesson.explanation}</p>
                <div class="lesson-grid"><div>${this.step >= 3 ? html`<fdl-field .record=${this.record} field="method"></fdl-field>` : ''}${keyed(this.record.fieldTypeForField('charge'), html`<fdl-field .record=${this.record} field="charge" .showValidationErrors=${true}></fdl-field>`)}</div><div class="lesson-state" role="status">${recordSummary(this.record, this.step >= 3 ? ['method','charge'] : ['charge'])}</div></div>
                ${this.step >= 4 ? html`<h3>Current delivery, another shipment, and a pickup</h3><fdl-table .recordset=${this.table}><fdl-column field="method"></fdl-column><fdl-column field="charge"></fdl-column></fdl-table>` : ''}
                <details open><summary>Rules built so far</summary><ol>${lessons.slice(0, this.step + 1).map(item => html`<li>${item.rule}</li>`)}</ol></details>
                <h3>The current definition</h3><pre><code>${highlightJavaScript(this.code())}</code></pre>
                <p><a href=${`#${lesson.reference}`}>Explore ${lesson.reference} in the modifier reference</a></p>
                <div class="lesson-navigation"><button class="previous-lesson" ?disabled=${this.step === 0} @click=${() => this.go(this.step - 1)}>Previous question</button><button class="next-lesson" ?disabled=${this.step === lessons.length - 1} @click=${() => this.go(this.step + 1)}>Next question</button></div>
            </section>`;
    }
    static styles = css`
        :host { display:block; line-height:1.65; }
        button { font:inherit; cursor:pointer; min-height:44px; padding:8px 12px; }
        button:focus-visible,a:focus-visible,summary:focus-visible { outline:3px solid #2563eb; outline-offset:3px; }
        button:disabled { opacity:.5; cursor:default; }
        .question { background:none; border:0; color:#1d4ed8; text-align:left; text-decoration:underline; }
        [aria-current="step"] { font-weight:bold; background:#eff6ff; }
        nav ol { padding-left:24px; } h2 { line-height:1.3; } h2:focus { outline:none; }
        .lesson-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:20px; }
        .lesson-state { padding:16px; background:#f1f5f9; } fdl-field { --field-label-width:100%; --field-control-width:100%; }
        pre { padding:16px; background:#0f172a; color:#e2e8f0; overflow:auto; font: .95rem/1.6 monospace; }
        .syntax-string,.syntax-regex { color:#a7f3d0; } .syntax-keyword { color:#c4b5fd; } .syntax-number { color:#fdba74; }
        details { margin:20px 0; } summary { cursor:pointer; padding:8px 0; }
        .lesson-navigation { display:flex; justify-content:space-between; gap:12px; } a { color:#1d4ed8; }
        fdl-table { display:block; overflow-x:auto; }
    `;
}
customElements.define('fdl-learning-path', FdlLearningPath);
