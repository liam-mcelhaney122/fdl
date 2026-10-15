import { LitElement, css, html } from 'lit';
import FieldType from '../../field-type.js';
import Record from '../../record.js';
import { addressCases, compositionRecord, defaultCompositionRules, type CompositionRules } from './composition-model';
import { exampleTheme } from './example-theme';
import './fdl-field';

const choice = (label: string, options: {text:string;value:string}[]) => new FieldType<string>().with.label(label).and.tag('select').and.options(options);
export class FdlPrediction extends LitElement {
    static properties = {rules:{attribute:false}};
    rules: CompositionRules = {...defaultCompositionRules};
    private guesses = new Record({
        method:choice('Case delivery',[{text:'Shipping',value:'ship'},{text:'Pickup',value:'pickup'}]),
        sample:choice('Case address',addressCases.map(sample=>({text:sample.title,value:sample.id}))),
        visible:choice('Predict visibility',[{text:'Choose…',value:''},{text:'Visible',value:'true'},{text:'Hidden',value:'false'}]).with.required(),
        required:choice('Predict requiredness',[{text:'Choose…',value:''},{text:'Required',value:'true'},{text:'Optional',value:'false'}]).with.required(),
        valid:choice('Predict validity',[{text:'Choose…',value:''},{text:'Valid',value:'true'},{text:'Invalid',value:'false'}]).with.required(),
    }, {method:'pickup',sample:'unnumbered',visible:'',required:'',valid:''});
    private result?: {visible:boolean;required:boolean;valid:boolean};
    private refresh = () => { this.result=undefined; this.requestUpdate(); };
    connectedCallback() { super.connectedCallback(); this.guesses.addEventListener('change',this.refresh); }
    disconnectedCallback() { this.guesses.removeEventListener('change',this.refresh); super.disconnectedCallback(); }
    willUpdate(changes: Map<string,unknown>) {
        const previous=changes.get('rules') as CompositionRules | undefined;
        if(changes.has('rules') && (!previous || (['visibility','requiredness','validation'] as const).some(key=>previous[key]!==this.rules[key]))) this.result=undefined;
    }
    private reveal = () => {
        const sample=addressCases.find(sample=>sample.id===this.guesses.getField('sample'))!;
        const record=compositionRecord(this.rules,this.guesses.getField('method'),sample.value), type=record.fieldTypeForField('address');
        this.result={visible:type.visible(record),required:type.required(record),valid:record.isValid()}; this.requestUpdate();
    };
    render() {
        return html`<p>Use the current rules above. Choose a case and predict each result, then ask the FDL model to check it. This is optional practice; the comparison remains available.</p>
        <div class="choices">${['method','sample','visible','required','valid'].map(field=>html`<fdl-field .record=${this.guesses} field=${field}></fdl-field>`)}</div>
        <button ?disabled=${!this.guesses.isValid()} @click=${this.reveal}>Reveal model result</button>
        ${this.result ? html`<section role="status"><h3>What the model says</h3><ul>${(['visible','required','valid'] as const).map(key=>html`<li><strong>${key === 'visible' ? 'Visibility' : key === 'required' ? 'Requiredness' : 'Validity'}</strong>: ${key==='visible' ? this.result![key]?'Visible':'Hidden' : key==='required' ? this.result![key]?'Required':'Optional' : this.result![key]?'Valid':'Invalid'} — ${String(this.result![key])===this.guesses.getField(key)?'matches your prediction':'differs from your prediction'}</li>`)}</ul><p>Visibility and requiredness read the delivery method independently. Validity checks the stored address even when its control is hidden. Change one rule above and try again.</p></section>` : ''}`;
    }
    static styles=css`
        :host{display:block;font-size:1rem;line-height:1.6} .choices{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px} fdl-field{--field-label-width:100%;--field-control-width:100%} button{font:inherit;min-height:44px;padding:8px 16px;border:0;border-radius:4px;background:#2563eb;color:white;cursor:pointer}button:disabled{opacity:.5;cursor:default}button:focus-visible{outline:3px solid #2563eb;outline-offset:3px}section{padding:16px;margin-top:16px;background:#eff6ff;border-radius:6px}h3{margin:0} ${exampleTheme}
    `;
}
customElements.define('fdl-prediction',FdlPrediction);
