import { LitElement, html } from 'lit';
import { createAccount } from './conditional-validation-model';
import { highlightJavaScript } from './highlight-javascript';
import './fdl-field';

export class FdlConditionalValidation extends LitElement {
    private account = createAccount();
    private refresh = () => this.requestUpdate();
    connectedCallback() {super.connectedCallback(); this.account.addEventListener('change', this.refresh);}
    disconnectedCallback() {this.account.removeEventListener('change', this.refresh); super.disconnectedCallback();}
    render() {
        return html`<p>Change Country code from US to CA. Try Tax ID <code>CA123456</code>, then <code>invalid</code>. Return to US: the hidden value remains stored, and its format no longer blocks validation.</p>
          <fdl-field .record=${this.account} field="country" .showValidationErrors=${true}></fdl-field>
          <fdl-field .record=${this.account} field="taxId" .showValidationErrors=${true}></fdl-field>
          <p role="status">${this.account.isValid() ? 'Valid account.' : this.account.readableRecordErrors().join('. ')}</p>
          <table><caption>Review the same Record, including retained data</caption><thead><tr><th>Country</th><th>Stored Tax ID</th></tr></thead><tbody><tr><td>${this.account.getFormattedField('country', 'print')}</td><td>${this.account.getFormattedField('taxId', 'print') || '(empty)'}</td></tr></tbody></table>`;
    }
}
customElements.define('fdl-conditional-validation', FdlConditionalValidation);

export const conditionalRuleSource = `import { field, Record } from 'digital-fdl';
const isInternational = record => record.getField('country') !== 'US';
export const accountFields = {
  country: field.label('Country code').required(),
  taxId: field.label('Tax ID')
    .required(isInternational)
    .visibleWhen(isInternational)
    .validator({
      name: 'must contain two uppercase letters followed by six digits',
      validate: (value, _viewValue, record) =>
        !isInternational(record) || value === '' || /^[A-Z]{2}\\d{6}$/.test(String(value)),
    }),
};
export const account = new Record(accountFields, {country: 'US', taxId: ''});`;
export function renderValidatorContract() {
    return html`<section><h3>Validator callback contract</h3>
      <pre class="code"><code>validate(modelValue, viewValue, record, options, field)
  =&gt; boolean | Promise&lt;boolean&gt;</code></pre>
      <p>The first argument is the stored model value; the second is the consumer-supplied view value (Record validation passes null); the third is the owning Record. The fourth is the consumer-supplied options API, which may be absent during Record validation, and the fifth identifies the field. Use the third argument for cross-field rules. Synchronous <code>isValid()</code> throws if a validator returns a Promise. Use the explicit async validation API for async rules; this example adapter supports synchronous rules.</p>
      <p>Validators accumulate. Conditional requiredness does not condition a validator, and hiding a field does not disable validation. Accept empty values in a format rule when requiredness should decide emptiness separately.</p>
      <pre class="code"><code>${highlightJavaScript(conditionalRuleSource)}</code></pre>
      <fdl-conditional-validation></fdl-conditional-validation>
      <p><a href="#change-a-rule">Trace this change through the model, consumers, and behavior tests.</a></p>
    </section>`;
}
export function renderChangeRule() {
    return html`<article class="site-page"><h1 tabindex="-1">Change and test a rule</h1><p class="description">Add a conditional tax ID without moving business policy into your components.</p>
      ${renderValidatorContract()}
      <h2>Follow the authority from definition to consumers</h2>
      <p><code>conditional-validation-model.ts</code> exports <code>accountFields</code>. The editor and review table above consume one Record constructed from those definitions. Separate Records can share definitions while retaining independent values. Keep the tax-ID condition in the model; the table requests formatted values, and the existing field adapter reads visibility, requiredness, and errors.</p>
      <table><thead><tr><th>Change</th><th>Where to work and verify</th></tr></thead><tbody>
        <tr><td>Domain rule</td><td><code>examples/fdl-input/conditional-validation-model.ts</code>; behavior tests in <code>tests/conditional-validation.test.ts</code>.</td></tr>
        <tr><td>Form and review consumers</td><td><code>examples/fdl-input/change-rule-page.ts</code>; keep subscriptions, labels, and error relationships in the adapter. Check conditional state and retained values in the live example.</td></tr>
        <tr><td>New public library API, if needed</td><td><code>field-type-builder.ts</code>, <code>field-type.js</code>, <code>types/</code>, <code>index.d.ts</code>, and the API docs. This domain rule uses existing APIs and needs no library type change.</td></tr>
        <tr><td>Missing semantic capability</td><td><code>form-element.ts</code> and <code>tests/form-element-accessibility.test.ts</code>. A new business rule alone does not require adapter changes.</td></tr>
        <tr><td>Visual treatment</td><td>Your design system’s styles. Preserve its existing controls and theme.</td></tr>
      </tbody></table>
      <h2>Test behavior without a browser</h2>
      <pre class="code"><code>${highlightJavaScript(`import { createAccount } from '../examples/fdl-input/conditional-validation-model';
it.each([
  ['US', '', true], ['US', 'invalid', true],
  ['CA', '', false], ['CA', 'CA123456', true], ['CA', 'invalid', false],
])('validates %s / %s', (country, taxId, valid) => {
  expect(createAccount(country, taxId).isValid()).toBe(valid);
});
it('keeps values when the condition changes', () => {
  const account = createAccount('CA', 'invalid');
  expect(account.isValid()).toBe(false);
  account.setField('country', 'US');
  expect(account.isValid()).toBe(true);
  expect(account.getField('taxId')).toBe('invalid');
});`)}</code></pre>
      <p>Run <code>npm test -- --runInBand tests/conditional-validation.test.ts</code>, <code>npm run typecheck</code>, and <code>npm run docs:build</code>. Test visibility and requiredness independently of validity, plus both directions of the country transition. Use <code>tests/fdl-composition.test.ts</code> for a broader rule-combination example and the <a href="#integration">adapter checks</a> for semantic verification.</p>
    </article>`;
}
