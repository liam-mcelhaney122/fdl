import './fdl-example';
import compositionSource from './fdl-composition-experiment.ts?raw';
import compositionModelSource from './composition-model.ts?raw';
import specializationSource from './fdl-specialization-experiment.ts?raw';
import learningSource from './fdl-learning-path.ts?raw';
import { renderChangeRule } from './change-rule-page';
import { renderEditableRecordset } from './editable-recordset-page';
import { renderIntegration } from './integration-page';
import { renderQuickstart } from './quickstart-page';
import { renderCategoryOverview } from './category-overview';
import type { ExplorerRecipe } from './modifier-explorer-recipes';
import { html } from 'lit';
import './fdl-delivery-experiment';
import './fdl-specialization-experiment';
import './fdl-learning-path';
import type { LearningState } from './fdl-learning-path';
import './fdl-composition-experiment';
import { highlightJavaScript, highlightMarkup } from './highlight-javascript';

export const sitePages = [
    { id: 'home', title: 'Home' },
    { id: 'how-it-works', title: 'How it Works' },
    { id: 'quickstart', title: 'Your first form' },
    { id: 'integration', title: 'Adapter and API contracts' },
    { id: 'editable-recordset', title: 'Edit a recordset' },
    { id: 'change-a-rule', title: 'Change and test a rule' },
    { id: 'learn', title: 'Learn by exploring' },
    { id: 'composition', title: 'Combine the rules' },
    { id: 'categories', title: 'Modifier categories' },
    { id: 'contributing', title: 'Contributing' },
] as const;
export type SitePage = (typeof sitePages)[number]['id'];

const definition = `import { field, Record } from '@pmcelhaney/fdl';

const fields = {
    name: field.label('Name').required(),
};

const person = new Record(fields, { name: '' });
person.isValid(); // false

person.setField('name', 'Ada');
person.isValid(); // true`;

function renderModelDiagram(part: 'field' | 'record' | 'recordset') {
    const captions = {
        field: 'One field → one column',
        record: 'One record → one row',
        recordset: 'One recordset → the whole table',
    };
    return html`<figure class="model-diagram model-diagram--${part}">
        <table>
            <caption>${captions[part]}</caption>
            <thead
                ><tr
                    ><th scope="col">Name</th><th scope="col">City</th></tr
                ></thead
            >
            <tbody>
                <tr><td>Ada</td><td>London</td></tr>
                <tr><td>Grace</td><td>New York</td></tr>
            </tbody>
        </table>
    </figure>`;
}

export function renderSitePage(
    page: SitePage,
    learningState?: LearningState,
    compositionView?: HTMLElement,
    recipes: readonly ExplorerRecipe[] = []
) {
    if (page === 'change-a-rule') return renderChangeRule();
    if (page === 'editable-recordset') return renderEditableRecordset();
    if (page === 'integration') return renderIntegration();
    if (page === 'quickstart') return renderQuickstart();
    if (page === 'categories') return renderCategoryOverview(recipes);
    if (page === 'composition')
        return html`<article class="site-page"
            ><h1 tabindex="-1">Combine the rules</h1
            ><fdl-example
                heading="Combine the rules"
                .filenames=${['composition-model.ts', 'fdl-composition-experiment.ts']}
                .sources=${{ 'composition-model.ts': compositionModelSource, 'fdl-composition-experiment.ts': compositionSource }}
                >${compositionView ?? html`<fdl-composition-experiment></fdl-composition-experiment>`}</fdl-example
            ></article
        >`;
    if (page === 'learn')
        return html`<article class="site-page"
            ><h1 tabindex="-1">Learn by exploring</h1
            ><p class="description"
                >Build one delivery example from a field into a collection.
                Follow the questions in order or jump to the one you want to
                investigate.</p
            ><fdl-example
                heading="Learn by exploring"
                .filenames=${['fdl-learning-path.ts']}
                .sources=${{ 'fdl-learning-path.ts': learningSource }}
                ><fdl-learning-path
                    .session=${learningState}
                ></fdl-learning-path></fdl-example
        ></article>`;
    if (page === 'home')
        return html` <article class="site-page">
            <h1 tabindex="-1">Field Definition Library</h1>
            <p class="description"
                >FDL (pronounced “fiddle”) is a JavaScript and TypeScript
                library for defining how your application’s fields behave and
                applying those definitions to individual records and collections
                of records.</p
            >
            <p
                >A field definition describes how to turn input into a stored
                value, format it for display, check whether it is valid, and
                determine whether it is required, visible, or editable. These
                rules can depend on other values in the record: a delivery
                address, for example, can be required only when the customer
                chooses shipping.</p
            >
            <p
                >Without a shared model, that same rule can end up in a form’s
                input handlers, a separate validation function, and a table’s
                editing logic. FDL keeps the rule in the field definition. A
                form, a table, and a validation check can all use it, so
                changing the rule does not mean finding and updating several
                copies. You can also test it without rendering a screen.</p
            >
            <p
                >Your UI components read FDL’s field behavior and record state
                to render controls and display validation messages. The
                application chooses the layout and workflow, and CSS controls
                the appearance. You can reuse the same model across different
                interfaces.</p
            >
            <fdl-delivery-experiment></fdl-delivery-experiment>
            <h2>Three parts of the model</h2>
            <div class="model-concepts">
                <section class="model-concept" aria-labelledby="model-field">
                    <h3 id="model-field">Field</h3>
                    <p
                        >A field is a container for one element of data. Its
                        definition encapsulates rules such as what makes a value
                        valid and how to format it for display.</p
                    >
                    <p class="model-analogy">Like a column in a database.</p>
                    ${renderModelDiagram('field')}
                    <p class="model-example"
                        >The <strong>Name</strong> field has the same rules in
                        every record. For example, a name may be required and
                        displayed as text.</p
                    >
                </section>
                <section class="model-concept" aria-labelledby="model-record">
                    <h3 id="model-record">Record</h3>
                    <p
                        >A record is a collection of fields bound to particular
                        values. Each field’s rules apply to its value in that
                        record.</p
                    >
                    <p class="model-analogy">Like a row in a database.</p>
                    ${renderModelDiagram('record')}
                    <p class="model-example"
                        >One record binds <strong>Name</strong> to “Ada” and
                        <strong>City</strong> to “London”.</p
                    >
                </section>
                <section
                    class="model-concept"
                    aria-labelledby="model-recordset"
                >
                    <h3 id="model-recordset">Recordset</h3>
                    <p
                        >A recordset is a collection of records that share field
                        definitions. You can work with the collection by sorting
                        and filtering its records.</p
                    >
                    <p class="model-analogy">Like a database table or view.</p>
                    ${renderModelDiagram('recordset')}
                    <p class="model-example"
                        >These two records form a
                        <strong>People</strong> recordset, with the same
                        <strong>Name</strong> and
                        <strong>City</strong> fields.</p
                    >
                </section>
            </div>
            <h2>From model to interface</h2>
            <p>
                The Lit elements on this site bring the model to life. They
                connect fields, records, and recordsets to controls and tables
                you can interact with. These are example implementations: you
                can build your own components in React, Vue, Lit, or any other
                framework, as long as they follow the
                <a href="#integration">model and adapter contract</a>.
            </p>
            <dl class="concepts">
                <dt><code>&lt;fdl-field&gt;</code></dt>
                <dd>
                    Connects one field in a record to a labelled control. It
                    uses the field definition to format values, show available
                    choices, and reflect required, visible, disabled, and
                    read-only state. Edits go back through the record’s parser;
                    validation messages come from the model. This example
                    extends FDL’s Lit <code>FormElement</code> adapter with the
                    site’s styling.
                </dd>
                <dt><code>&lt;fdl-table&gt;</code></dt>
                <dd>
                    Presents a recordset as rows and columns, using the shared
                    field definitions for labels, formatted values, alignment,
                    and other table behavior. It provides sorting, filtering,
                    and column resizing. Its companion
                    <code>&lt;fdl-column&gt;</code> element identifies which
                    fields to show and in what order.
                </dd>
                <dt>
                    <code>&lt;fdl-record-inspector&gt;</code> and
                    <code>&lt;fdl-recordset-inspector&gt;</code>
                </dt>
                <dd>
                    Make model state visible alongside the interface. The record
                    inspector shows stored values and field state; the recordset
                    inspector shows the collection and its current view. These
                    are learning tools for seeing what changes as you interact
                    with an example.
                </dd>
            </dl>
            <p>
                Your components can look and behave differently while using the
                same model. The contract is to read values and field state from
                FDL, send user input through <code>parseAndSetField()</code>,
                and subscribe to model changes so the view stays current,
                removing those subscriptions when the component is removed.
                Components supply accessible labels, keyboard interaction, and
                validation feedback; the application chooses when to show
                errors, how to submit data, and how to style the result. The
                <a href="#integration">adapter contract</a> explains these
                responsibilities in detail.
            </p>
            <h2>A rule you can check without a UI</h2>
            <pre
                class="code markup"
            ><code>${highlightJavaScript(definition)}</code></pre>
            <p
                >The required rule is enforced by the record. A form component
                can expose that same rule on an input and display its validation
                message.</p
            >
        </article>`;
    if (page === 'how-it-works')
        return html` <article class="site-page">
            <h1 tabindex="-1">How it Works</h1>
            <p class="description"
                >Define field behavior, attach it to record values, and let a
                component translate that state into an interface.</p
            >
            <h2>1. Define a field type</h2>
            <p
                >Start with the exported <code>field</code> instance and chain
                modifiers to add rules and metadata. Each modifier returns a new
                definition, so a shared base can be specialized for different
                uses.</p
            >
            <pre
                class="code markup"
            ><code>${highlightJavaScript(`const name = field.label('Name');
const requiredName = name.required();
// name is unchanged; requiredName adds the required rule.`)}</code></pre>
            <fdl-example
                heading="One base, independent specializations"
                .filenames=${['fdl-specialization-experiment.ts']}
                .sources=${{ 'fdl-specialization-experiment.ts': specializationSource }}
                ><fdl-specialization-experiment></fdl-specialization-experiment
            ></fdl-example>
            <h2>2. Create a record</h2>
            <p
                >A record connects field definitions to actual values and
                prepares their runtime behavior automatically. Parsing converts
                input into model values. Formatting produces display values.
                Validation checks the model against the declared rules.</p
            >
            <pre
                class="code markup"
            ><code>${highlightJavaScript(`const person = new Record({ name: requiredName }, { name: '' });

person.setField('name', 'Ada');
person.isValid(); // true`)}</code></pre>
            <h2>3. Bind a component</h2
            ><p
                ><a href="#quickstart">Your first form</a> supplies the
                installation, adapter registration, and complete rendering setup
                for this binding.</p
            >
            <p
                >In these examples, <code>fdl-field</code> connects a record
                field to a native control. It handles the label, input events,
                and accessible field state. A view binds the record object using
                Lit’s property syntax:</p
            >
            <pre
                class="code markup"
            ><code>${highlightMarkup('<fdl-field .record=${person} field="name"></fdl-field>')}</code></pre>
            <p
                >The component is the integration layer. FDL does not choose
                your page layout or visual theme. Other adapters can interpret
                the model for different interfaces.
                <a href="#integration">Integrate an existing component system</a
                >: read the adapter obligations, public types, composition
                rules, and current limits.</p
            >
            <h2>4. Express dependencies as predicates</h2>
            <p
                >For rules that depend on another field, a callback reads the
                current record. For example,
                <a href="#visible">visible()</a> can show an address only when
                shipping is selected.
                <a href="#required">required()</a> separately controls whether
                that address is required.</p
            >
            <h2>5. Reuse definitions in a collection</h2>
            <p
                >A <code>Recordset</code> applies field definitions to multiple
                records.
                <a href="#editable-recordset">Edit a recordset</a> demonstrates
                actual row identity, a shared detail editor, validation,
                filtering, sorting, and scoped totals. The table example reads
                comparison, filtering, formatting, and alignment behavior from
                those definitions. Read the
                <a href="#integration">Record and Recordset API references</a>
                for loading, events, and lifecycle. Start with
                <a href="#compareFunction">compareFunction()</a> or
                <a href="#filter">filter()</a>.</p
            >
            <h2>Who owns what?</h2>
            <dl class="concepts"
                ><dt>FDL</dt
                ><dd
                    >Reusable parsing, formatting, validation, dependencies, and
                    field state.</dd
                ><dt>Component</dt
                ><dd
                    >Accessible markup, labels, keyboard interaction, focus, and
                    input events.</dd
                ><dt>Application and CSS</dt
                ><dd>Workflow, page layout, and visual presentation.</dd></dl
            >
        </article>`;
    return html` <article class="site-page">
        <h1 tabindex="-1">Contributing</h1>
        <p class="description"
            >Contributions should keep field behavior, component semantics,
            documentation, and examples consistent.</p
        >
        <h2>Get the repository</h2>
        <p
            >Start with the
            <a href="https://github.com/pmcelhaney/FDL">FDL repository</a> and
            its
            <a href="https://github.com/pmcelhaney/FDL/blob/main/AGENTS.md"
                >contributor guide</a
            >. Read the
            <a
                href="https://github.com/pmcelhaney/FDL/blob/main/docs/design-principles.md"
                >design principles</a
            >
            before changing modifiers, components, or presentation.</p
        >
        <h2>Work in an isolated checkout</h2>
        <p
            >The root checkout is reserved for integration. Check its status and
            existing worktrees before starting, preserve other tasks’ changes,
            and develop on a linked worktree and its own branch. The contributor
            guide describes the full workflow.</p
        >
        <h2>Install and run locally</h2>
        <pre class="code markup"><code>npm install
npm run docs:dev</code></pre>
        <p
            >Open the root URL printed by the local server to view this site.
            Changes to the example source update the preview.</p
        >
        <h2>Verify your changes</h2>
        <pre class="code markup"><code>npm test
npm run typecheck
npm run docs:build</code></pre>
        <p
            >Follow
            <a href="#change-a-rule"
                >a complete rule change with its source map and behavior
                tests</a
            >. Add focused coverage for behavior changes. If an exported API
            changes, update its public behavior, declarations, and documentation
            together. Check live examples in the browser, including keyboard
            interaction and narrow screens.</p
        >
        <h2>Keep the boundaries clear</h2>
        <ul
            ><li
                >Put reusable model rules in field types, records, or
                recordsets.</li
            ><li
                >Keep DOM structure, focus, and event handling in
                components.</li
            ><li>Use CSS for visual expression.</li
            ><li
                >Document adapter limitations instead of simulating unsupported
                behavior.</li
            ></ul
        >
        <h2>Submit a focused change</h2>
        <p
            >Verify and commit each coherent batch, stage only its files, and
            follow the repository’s integration workflow. Describe what changes,
            why it is needed, and how you checked it. Local previews do not
            authorize deployment.</p
        >
    </article>`;
}
