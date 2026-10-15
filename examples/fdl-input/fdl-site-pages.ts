import { html } from 'lit';
import './fdl-delivery-experiment';
import './fdl-specialization-experiment';
import './fdl-learning-path';
import type {LearningState} from './fdl-learning-path';
import './fdl-composition-experiment';
import { highlightJavaScript, highlightMarkup } from './highlight-javascript';

export const sitePages = [
    { id: 'home', title: 'Home' },
    { id: 'how-it-works', title: 'How it Works' },
    { id: 'learn', title: 'Learn by exploring' },
    { id: 'composition', title: 'Combine the rules' },
    { id: 'contributing', title: 'Contributing' },
] as const;
export type SitePage = typeof sitePages[number]['id'];

const definition = `import { FieldType, Record } from 'digital-fdl';

const fields = {
  name: new FieldType()
    .with.label('Name')
    .and.required(),
};

const person = new Record(fields, { name: '' });
person.isValid(); // false

person.setField('name', 'Ada');
person.isValid(); // true`;

export function renderSitePage(page: SitePage, learningState?: LearningState, compositionView?: HTMLElement) {
    if (page === 'composition') return html`<article class="site-page"><h1 tabindex="-1">Combine the rules</h1>${compositionView ?? html`<fdl-composition-experiment></fdl-composition-experiment>`}</article>`;
    if (page === 'learn') return html`<article class="site-page"><h1 tabindex="-1">Learn by exploring</h1><p class="description">Build one delivery example from a field into a collection. Follow the questions in order or jump to the one you want to investigate.</p><fdl-learning-path .session=${learningState}></fdl-learning-path></article>`;
    if (page === 'home') return html`
        <article class="site-page">
            <h1 tabindex="-1">Field Definition Language</h1>
            <p class="description">Define field rules once. Use them consistently in forms, tables, and validation.</p>
            <fdl-delivery-experiment></fdl-delivery-experiment><p><a href="#learn">Build this understanding one question at a time →</a> · <a href="#visibleWhen?section=starter">Run a complete example locally</a></p>
            <section class="task-links" aria-labelledby="task-links-title"><h2 id="task-links-title">What are you trying to do?</h2><ul>
                <li><a href="#requiredWhen">Require an answer only when another answer needs it</a></li>
                <li><a href="#parser">Turn currency input into a stored number</a></li>
                <li><a href="#options">Refresh choices when a related field changes</a></li>
                <li><a href="#validator">Check a value against a business rule</a></li>
                <li><a href="#how-it-works">Reuse field definitions in forms and tables</a></li>
            </ul></section>
            <h2>What belongs in FDL?</h2>
            <p>FDL (pronounced “fiddle”) is a JavaScript and TypeScript library for modeling fields, records, and collections of records independently of the interface that displays them.</p>
            <p>A complex form often repeats the same rules in input handlers, validation, review screens, and tables. FDL puts reusable behavior in field definitions: how to parse an input, format a value, validate it, or determine its state from other fields.</p>
            <p>A component reads those definitions to render an accessible control. The application chooses the layout and workflow, and CSS controls the appearance.</p>
            <h2>Three parts of the model</h2>
            <dl class="concepts">
                <dt>FieldType</dt><dd>Defines a field’s behavior. Modifiers such as <a href="#required">required()</a> and <a href="#formatter">formatter()</a> return specialized definitions without changing the original.</dd>
                <dt>Record</dt><dd>Connects field definitions to values. Use it to read or update a field, parse input, request a formatted value, or validate the record.</dd>
                <dt>Recordset</dt><dd>Manages a collection of records, including fetching, sorting, filtering, and pagination. A table can consume the same field definitions as a form.</dd>
            </dl>
            <h2>A rule you can check without a UI</h2>
            <pre class="code markup"><code>${highlightJavaScript(definition)}</code></pre>
            <p>The required rule is enforced by the record. A form component can expose that same rule on an input and display its validation message.</p>
            <h2>Explore the examples</h2>
            <p><a href="#composition">Combine visibility, requiredness, and validation</a> to investigate all six delivery cases at once, then inspect any one in a live form.</p>
            <p>Read <a href="#how-it-works">How it Works</a> for the model-to-component flow. Use the modifier list to open an individual example, change its inputs, inspect its stored values, and read the definition and rendering markup.</p>
            <p>These examples use Lit components. FDL’s model behavior can also be used without a browser. Some modifiers require adapter support; their pages identify what the current example can demonstrate.</p>
            <p>The package is <code>digital-fdl</code>. Source code and development instructions are available on <a href="https://github.com/pmcelhaney/FDL">GitHub</a>.</p>
        </article>`;
    if (page === 'how-it-works') return html`
        <article class="site-page">
            <h1 tabindex="-1">How it Works</h1>
            <p class="description">Define field behavior, attach it to record values, and let a component translate that state into an interface.</p>
            <h2>1. Define a field type</h2>
            <p>A <code>FieldType</code> holds rules and metadata. Each modifier returns a new definition, so a shared base can be specialized for different uses.</p>
            <pre class="code markup"><code>${highlightJavaScript(`const name = new FieldType()
  .with.label('Name');
const requiredName = name
  .with.required();
// name is unchanged; requiredName adds the required rule.`)}</code></pre>
            <fdl-specialization-experiment></fdl-specialization-experiment>
            <h2>2. Create a record</h2>
            <p>A record connects those definitions to actual values. Parsing converts input into model values. Formatting produces display values. Validation checks the model against the declared rules.</p>
            <pre class="code markup"><code>${highlightJavaScript(`const person = new Record(
  { name: requiredName },
  { name: '' }
);

person.setField('name', 'Ada');
person.isValid(); // true`)}</code></pre>
            <h2>3. Bind a component</h2>
            <p>In these examples, <code>fdl-field</code> connects a record field to a native control. It handles the label, input events, and accessible field state. A view binds the record object using Lit’s property syntax:</p>
            <pre class="code markup"><code>${highlightMarkup('<fdl-field .record=${person} field="name"></fdl-field>')}</code></pre>
            <p>The component is the integration layer. FDL does not choose your page layout or visual theme. Other adapters can interpret the model for different interfaces.</p>
            <h2>4. Express dependencies as predicates</h2>
            <p>For rules that depend on another field, a callback reads the current record. For example, <a href="#visibleWhen">visibleWhen()</a> can show an address only when shipping is selected. <a href="#requiredWhen">requiredWhen()</a> separately controls whether that address is required.</p>
            <h2>5. Reuse definitions in a collection</h2>
            <p>A <code>Recordset</code> applies field definitions to multiple records. The table example reads comparison, filtering, formatting, and alignment behavior from those definitions. Start with <a href="#compareFunction">compareFunction()</a> or <a href="#filter">filter()</a>.</p>
            <h2>Who owns what?</h2>
            <dl class="concepts"><dt>FDL</dt><dd>Reusable parsing, formatting, validation, dependencies, and field state.</dd><dt>Component</dt><dd>Accessible markup, labels, keyboard interaction, focus, and input events.</dd><dt>Application and CSS</dt><dd>Workflow, page layout, and visual presentation.</dd></dl>
        </article>`;
    return html`
        <article class="site-page">
            <h1 tabindex="-1">Contributing</h1>
            <p class="description">Contributions should keep field behavior, component semantics, documentation, and examples consistent.</p>
            <h2>Get the repository</h2>
            <p>Start with the <a href="https://github.com/pmcelhaney/FDL">FDL repository</a> and its <a href="https://github.com/pmcelhaney/FDL/blob/main/AGENTS.md">contributor guide</a>. Read the <a href="https://github.com/pmcelhaney/FDL/blob/main/docs/design-principles.md">design principles</a> before changing modifiers, components, or presentation.</p>
            <h2>Work in an isolated checkout</h2>
            <p>The root checkout is reserved for integration. Check its status and existing worktrees before starting, preserve other tasks’ changes, and develop on a linked worktree and its own branch. The contributor guide describes the full workflow.</p>
            <h2>Install and run locally</h2>
            <pre class="code markup"><code>npm install
npm run docs:dev</code></pre>
            <p>Open the root URL printed by the local server to view this site. Changes to the example source update the preview.</p>
            <h2>Verify your changes</h2>
            <pre class="code markup"><code>npm test
npm run typecheck
npm run docs:build</code></pre>
            <p>Add focused coverage for behavior changes. If an exported API changes, update its public behavior, declarations, and documentation together. Check live examples in the browser, including keyboard interaction and narrow screens.</p>
            <h2>Keep the boundaries clear</h2>
            <ul><li>Put reusable model rules in field types, records, or recordsets.</li><li>Keep DOM structure, focus, and event handling in components.</li><li>Use CSS for visual expression.</li><li>Document adapter limitations instead of simulating unsupported behavior.</li></ul>
            <h2>Submit a focused change</h2>
            <p>Verify and commit each coherent batch, stage only its files, and follow the repository’s integration workflow. Describe what changes, why it is needed, and how you checked it. Local previews do not authorize deployment.</p>
        </article>`;
}
