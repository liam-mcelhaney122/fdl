import { html } from 'lit';
const reference = (file: string) => `https://github.com/pmcelhaney/FDL/blob/main/${file}`;

export function renderIntegration() {
    return html`<article class="site-page"><h1 tabindex="-1">Adapter and API contracts</h1>
      <p class="description">Keep business behavior in the model and translate it into your component system’s accessible interface.</p>
      <h2>Public references</h2>
      <ul>
        <li><a href=${reference('docs/field-type.md')}>FieldType API, exported setting types, and modifier composition</a></li>
        <li><a href=${reference('docs/record.md')}>Record API: parsing, validation, change events, and reset</a></li>
        <li><a href=${reference('docs/recordset.md')}>Recordset API: loading, identity, sorting, filtering, and pagination</a></li>
        <li><a href=${reference('docs/adapter-contract.md')}>Detailed adapter contract and current limits</a></li>
        <li><a href=${reference('docs/form-element.md')}>Lit FormElement integration</a></li>
        <li><a href=${reference('index.d.ts')}>Public TypeScript exports</a> and <a href=${reference('field-type-builder.ts')}>builder callback and configuration types</a></li>
        <li><a href=${reference('docs/design-principles.md')}>Design principles and prohibited shortcuts</a></li>
      </ul>
      <p>These links open repository references on main. For this local checkout’s exact contracts, read the same paths locally.</p>
      <h2>Legacy example configuration</h2><p>The current Lit adapter reads <code>tag()</code> for control selection and <code>rowCount()</code> for textarea sizing. Both are deprecated compatibility APIs, not the recommended reusable model contract. New adapters should keep element choice and sizing in renderer configuration and styles. Their continued use in these demonstrations preserves the existing adapter’s behavior.</p>
      <h2>Composition rules</h2>
      <table><thead><tr><th>Modifier kind</th><th>Composition</th></tr></thead><tbody>
        <tr><td>All modifiers</td><td>Return a new definition; the source definition is unchanged. Records prepare builders at their input boundary.</td></tr>
        <tr><td>Parsers and formatters</td><td>Run as ordered pipelines; each receives the preceding result.</td></tr>
        <tr><td>Validators</td><td>Accumulate named rules. Requiredness and visibility remain independent.</td></tr>
        <tr><td>Visibility predicates</td><td>All declared predicates must pass.</td></tr>
        <tr><td>Scalar settings</td><td>A later setting replaces the earlier value; inspect each modifier’s reference for exceptions and accumulation rules.</td></tr>
      </tbody></table>
      <h2>Map model state to component obligations</h2>
      <table><thead><tr><th>Model information</th><th>Adapter responsibility</th></tr></thead><tbody>
        <tr><td>Label and descriptions</td><td>Give the interactive control an accessible name; forward relationships into custom controls’ internal DOM. A label on a custom-element host does not automatically name an internal input.</td></tr>
        <tr><td>Requiredness and validation errors</td><td>Expose required state, readable error text, aria-invalid, and a real description relationship. The application chooses blur, touched, or submit timing; changing an attribute does not enforce a business rule.</td></tr>
        <tr><td>Disabled and read-only</td><td>Use native disabled behavior where appropriate and a labelled output or suitable read-only control. Neither state supplies authorization.</td></tr>
        <tr><td>Visibility</td><td>Remove unavailable controls from interaction. Preserve model values unless application policy explicitly clears them. Decide where focus goes when a focused control disappears.</td></tr>
        <tr><td>Options and edited values</td><td>Implement the chosen control’s keyboard pattern. Send edits through parseAndSetField and subscribe to Record changes; unsubscribe when the view unmounts.</td></tr>
      </tbody></table>
      <h2>Application decisions and current limits</h2>
      <p>Your application owns submission, routing, persistence, validation-display timing, pending requests, and server errors. The Lit adapter displays synchronous validation; it does not await asynchronous validators or resolve stale requests. Its shadow-root controls do not define application submission. Custom composite controls, error summaries, live announcements, and focus routing need deliberate integration.</p>
      <p>Choose an announcement policy: show errors after an appropriate interaction, connect them to their fields, and decide when a summary or live status should announce changes. Avoid announcing every keystroke. Test the actual result with your target assistive technologies.</p>
      <h2>Verify an adapter</h2>
      <ul><li>Use only a keyboard to enter, correct, and submit values; verify native and composite control patterns.</li><li>Check names, descriptions, requiredness, and error announcements with a screen reader.</li><li>Change conditional state while a related control has focus; verify focus recovery and retained data.</li><li>Check read-only and disabled transitions, zoom, reflow, forced colors, and visible focus in the chosen design system.</li></ul>
      <p>DOM relationships are useful evidence, but do not establish how assistive technologies announce an interface. Start with <a href="#quickstart">Your first form</a> and adapt its integration to your components.</p>
    </article>`;
}
