import {LitElement,css,html} from 'lit';
import {keyed} from 'lit/directives/keyed.js';
import FieldType from '../../field-type.js';
import Record from '../../record.js';
import {cancellationFields,cancellationDefinition,checkCancellation,type CancellationRules} from './cancellation-model';
import {highlightJavaScript} from './highlight-javascript';
import {exampleTheme} from './example-theme';
import './fdl-field';

export class FdlTransferChallenge extends LitElement {
    private configuration=new Record({
        visibility:new FieldType<string>().with.label('Show cancellation reason').and.tag('select').and.options([{text:'Always',value:'always'},{text:'Only when Cancelled',value:'cancelled'}]),
        requiredness:new FieldType<string>().with.label('Require cancellation reason').and.tag('select').and.options([{text:'Never',value:'never'},{text:'Always',value:'always'},{text:'Only when Cancelled',value:'cancelled'}]),
    },{visibility:'always',requiredness:'never'});
    private get rules(){return this.configuration.values as CancellationRules;}
    private record=new Record(cancellationFields(this.rules),{status:'cancelled',reason:''});
    private results?:ReturnType<typeof checkCancellation>;
    private refresh=()=>this.requestUpdate();
    private changeRules=()=>{this.record.addField('reason',cancellationFields(this.rules).reason,this.record.getField('reason'));this.results=undefined;this.requestUpdate();};
    connectedCallback(){super.connectedCallback();this.configuration.addEventListener('change',this.changeRules);this.record.addEventListener('change',this.refresh);}
    disconnectedCallback(){this.configuration.removeEventListener('change',this.changeRules);this.record.removeEventListener('change',this.refresh);super.disconnectedCallback();}
    private reset=()=>{this.configuration.setFields({visibility:'always',requiredness:'never'});this.record.setFields({status:'cancelled',reason:''});this.results=undefined;this.requestUpdate();};
    render(){return html`<h3>Try it in another domain</h3><p>A request needs a cancellation reason only when its status is Cancelled. Hide the reason for Active requests, but preserve it when the status changes.</p><p>Choose rules, try the form, then check all four cases. No new modifiers are needed.</p>
    <div class="grid"><section aria-label="Choose cancellation rules">${['visibility','requiredness'].map(field=>html`<fdl-field .record=${this.configuration} field=${field}></fdl-field>`)}</section><section aria-label="Try the cancellation form"><fdl-field .record=${this.record} field="status"></fdl-field>${keyed(this.record.fieldTypeForField('reason'),html`<fdl-field .record=${this.record} field="reason" .showValidationErrors=${true}></fdl-field>`)}<p>Stored reason: <code>${JSON.stringify(this.record.getField('reason'))}</code> · Record ${this.record.isValid()?'valid':'invalid'}</p></section></div>
    <div class="actions"><button class="check-challenge" @click=${()=>{this.results=checkCancellation(this.rules);this.requestUpdate();}}>Check all cases</button><button @click=${this.reset}>Reset challenge</button></div>
    ${this.results?html`<section class="challenge-results" role="status"><h3>${this.results.every(result=>result.passes)?'All four cases match the requested behavior':'Some cases need different rules'}</h3><ul>${this.results.map(({sample,actual,passes})=>html`<li>${sample.status} · ${sample.reason?'with a reason':'empty reason'}: <strong>${passes?'Matches':'Needs a change'}</strong><br>Actual: ${actual.visible?'visible':'hidden'}, ${actual.required?'required':'optional'}, ${actual.valid?'valid':'invalid'}. Expected: ${sample.visible?'visible':'hidden'}, ${sample.required?'required':'optional'}, ${sample.valid?'valid':'invalid'}.</li>`)}</ul></section>`:''}
    <details><summary>Hint</summary><p>Visibility and requiredness are independent. Both should read the request status. Hiding a field preserves its stored value.</p></details><details><summary>Inspect a solution</summary><pre><code>${highlightJavaScript(cancellationDefinition({visibility:'cancelled',requiredness:'cancelled'}))}</code></pre></details>
    <h3>Your current definition</h3><pre><code>${highlightJavaScript(cancellationDefinition(this.rules))}</code></pre>`;}
    static styles=css`:host{display:block;font-size:1rem;line-height:1.6}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}section{min-width:0}fdl-field{--field-label-width:100%;--field-control-width:100%}button{font:inherit;min-height:44px;padding:8px 16px;border:1px solid #94a3b8;border-radius:4px;background:white;color:#1d4ed8;cursor:pointer}.actions{display:flex;gap:12px;flex-wrap:wrap}.check-challenge{background:#2563eb;color:white;border-color:#2563eb}button:focus-visible,summary:focus-visible{outline:3px solid #2563eb;outline-offset:3px}details{margin:16px 0}summary{cursor:pointer;padding:8px 0}.challenge-results{padding:16px;margin-top:16px;background:#eff6ff;border-radius:6px}li{margin-bottom:12px}pre{padding:16px;overflow:auto;white-space:pre-wrap;background:#0f172a;color:#f8fafc;font:.875rem/1.6 monospace}.syntax-string{color:#a7f3d0}.syntax-keyword{color:#c4b5fd}h3{font-size:1.125rem}${exampleTheme}`;
}
customElements.define('fdl-transfer-challenge',FdlTransferChallenge);
