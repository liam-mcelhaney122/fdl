import { LitElement, css, html } from 'lit';
import { renderSitePage, sitePages, type SitePage } from './fdl-site-pages';
import { exampleSource, type ExampleSettings } from './modifier-example-source';
import { highlightJavaScript, highlightModifier } from './highlight-javascript';
import { inputText, valuePipeline } from './value-pipeline';
import { exampleTheme } from './example-theme';
import { recordSummary } from './model-summary';
import { explainDependency } from './dependency-explanation';
import { keyed } from 'lit/directives/keyed.js';
import FieldType from '../../field-type.js';
import Record from '../../record.js';
import './fdl-field';
import './fdl-modifier-catalog';
import { additionalRecipes, type ExplorerRecipe } from './modifier-explorer-recipes';

export const explorerRecipes: ExplorerRecipe[] = [
    {
        name: 'required', signature: '()', category: 'Validation', title: 'Require a non-empty value.',
        description: 'Declare that a field needs a value. FDL carries that rule from the record to the control, so validation and the interface agree.',
        prompt: 'Leave the name empty and check the record. Then enter a name and check again.',
        steps: ['Declare the rule once with .required().', 'The component exposes the required state on the input.', 'Record.isValid() checks the same rule without a browser.'],
        note: 'Required means non-empty according to the field’s emptiness rules. It does not validate a name’s spelling or format. Use a validator for an additional business rule.',
        use: 'Names, reference numbers, and other values a record always needs.',
    },
    {
        name: 'formatter', signature: '(fn)', category: 'Display', title: 'Format a stored value for display.',
        description: 'Apply a display transformation without changing the stored value. This example formats a number as US dollars.',
        prompt: 'Change the amount. Compare the raw number in the model with its formatted output.',
        steps: ['Store a number in the record.', 'The formatter transforms it when a consumer requests a display value.', 'Calculations can continue to use the original number.'],
        note: 'Formatting is one-way. This formatter leaves the input-focus value numeric for the number control and formats the printed output. The separate parser converts edited text back into a number.',
        use: 'Currency, dates, percentages, and other human-readable representations.',
    },
    {
        name: 'visibleWhen', signature: '(predicate)', category: 'Conditional state', title: 'Show a field when its predicate is true.',
        description: 'Evaluate a predicate against the record to determine whether a field is visible. The component updates when the record changes.',
        prompt: 'Switch between shipping and pickup. The address disappears for pickup; its stored value is preserved.',
        steps: ['Read the related value from the record.', 'FDL evaluates the predicate as record values change.', 'The component includes the address only when the predicate passes.'],
        note: 'Visibility does not erase a value or make it optional. If a field should be required only while visible, declare the matching requiredWhen rule separately.',
        use: 'Shipping details, payment-specific fields, and branching forms.',
    },
    ...additionalRecipes,
];

const recipes = explorerRecipes;

export class FdlModifierExplorer extends LitElement {
    private selected = 0;
    private page: SitePage | 'modifier' = 'home';
    private checked = false;
    private requiredRule = true;
    private exampleSettings: ExampleSettings = {};
    private amountInput?: string;
    private captureAmountInput = {capture: true, handleEvent: (event: Event) => { this.amountInput = inputText(event); this.requestUpdate(); }};
    private query = '';
    private resetVersion = 0;
    private selectedCategories = new Set<string>();
    private person = new Record({ name: new FieldType<string>().with.label('Legal name').and.required() }, { name: '' });
    private money = new Record({ amount: new FieldType<number>().with.label('Amount').and.type('number').and.parser(value => Number(value)).and.formatter((value, _record?: unknown, context?: string) => context === 'input-focus' ? String(value) : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value))) }, { amount: 1250 });
    private delivery = new Record({
        fulfillment: new FieldType<string>().with.label('Delivery method').and.tag('select').and.options([{ text: 'Ship to address', value: 'ship' }, { text: 'Pick up in person', value: 'pickup' }]),
        address: new FieldType<string>().with.label('Shipping address').and.visibleWhen(record => record.getField('fulfillment') === 'ship'),
    }, { fulfillment: 'ship', address: '42 Orchard Street' });
    private refresh = () => this.requestUpdate();
    private readLocation = () => {
        const hash = window.location.hash.slice(1);
        const page = sitePages.find(page => page.id === hash);
        if (page || !hash) this.showPage(page?.id ?? 'home', false);
        else {
            const index = recipes.findIndex(recipe => recipe.name === hash);
            if (index >= 0) this.select(index, false);
            else this.showPage('home', false);
        }
    };
    private showPage(page: SitePage, updateUrl = true) {
        this.page = page;
        this.requestUpdate();
        document.title = `${sitePages.find(entry => entry.id === page)!.title} — FDL`;
        if (updateUrl) {
            window.location.hash = page;
            this.focusHeading();
        }
    }
    private focusHeading() {
        this.updateComplete.then(() => {
            const heading = this.shadowRoot?.querySelector<HTMLElement>('h1');
            heading?.focus({ preventScroll: true });
            heading?.scrollIntoView?.({ block: 'start' });
        });
    }

    connectedCallback() {
        super.connectedCallback();
        [this.person, this.money, this.delivery].forEach(record => record.addEventListener('change', this.refresh));
        window.addEventListener('hashchange', this.readLocation);
        this.readLocation();
    }
    disconnectedCallback() {
        [this.person, this.money, this.delivery].forEach(record => record.removeEventListener('change', this.refresh));
        window.removeEventListener('hashchange', this.readLocation);
        super.disconnectedCallback();
    }
    private select(index: number, updateUrl = true) {
        if (index < 0 || index >= recipes.length) return;
        const changed = this.page !== 'modifier' || this.selected !== index;
        this.page = 'modifier';
        this.selected = index;
        if (changed) this.exampleSettings = {};
        this.requestUpdate();
        this.updateComplete.then(() => this.shadowRoot?.querySelector<HTMLElement>('.modifier-list [aria-current="page"]')?.scrollIntoView?.({ block: 'nearest' }));
        if (updateUrl) {
            window.location.hash = recipes[index].name;
            this.updateComplete.then(() => {
                const heading = this.shadowRoot?.querySelector<HTMLElement>('h1');
                heading?.focus({ preventScroll: true });
                heading?.scrollIntoView({ block: 'start' });
            });
        }
        document.title = `${recipes[index].name} — FDL Modifier explorer`;
    }
    private field(record: Record<any>, field: string) {
        return keyed(record.fieldTypeForField(field), html`<fdl-field .record=${record} field=${field} .showValidationErrors=${this.checked}></fdl-field>`);
    }
    private reset() {
        this.resetVersion += 1;
        if (this.selected === 0) { this.checked = false; this.requiredRule = true; this.person.addField('name', new FieldType<string>().with.label('Legal name').and.required(), ''); }
        this.exampleSettings = {};
        if (this.selected === 1) { this.amountInput = undefined; this.money.setField('amount', 1250); }
        if (this.selected === 2) { this.delivery.setField('fulfillment', 'ship'); this.delivery.setField('address', '42 Orchard Street'); }
        this.requestUpdate();
    }
    private demo() {
        if (this.selected === 0) return html`
            <label class="rule-control"><input type="checkbox" .checked=${this.requiredRule} @change=${(event: Event) => {
                this.requiredRule = (event.target as HTMLInputElement).checked;
                const base = new FieldType<string>().with.label('Legal name');
                this.person.addField('name', this.requiredRule ? base.with.required() : base, this.person.getField('name'));
                this.requestUpdate();
            }}> Require a value</label>
            ${this.field(this.person, 'name')}
            <button class="primary" @click=${() => { this.checked = true; this.requestUpdate(); }}>Check record </button>
            <p class="result" role="status">${this.checked ? (this.person.isValid() ? '✓ The record is valid.' : 'Legal name is required. Add a value to continue.') : 'Ready to validate. Try an empty value first.'}</p>`;
        if (this.selected === 1) return html`
            <div @input=${this.captureAmountInput}>${this.field(this.money, 'amount')}</div>
            <div class="formatted"><span>Formatted output</span><strong>${this.money.getFormattedField('amount', 'print')}</strong></div>
            <p class="result">The formatter leaves the stored number unchanged.</p>${valuePipeline(this.money, 'amount', this.amountInput)}`;
        if (this.selected > 2) return html`<fdl-modifier-catalog modifier=${recipes[this.selected].name} @example-settings-change=${(event: CustomEvent<ExampleSettings>) => { this.exampleSettings = event.detail; this.requestUpdate(); }}></fdl-modifier-catalog>`;
        return html`${this.field(this.delivery, 'fulfillment')}${this.field(this.delivery, 'address')}${explainDependency(this.delivery, 'address', 'fulfillment', `fulfillment === 'ship'`, 'visible')}<p class="result" role="status">${this.delivery.getField('fulfillment') === 'ship' ? 'Shipping address is visible.' : 'Pickup selected. Shipping address is hidden.'}</p>`;
    }
    render() {
        const recipe = recipes[this.selected];
        const source = exampleSource(recipe.name, {...this.exampleSettings, required: this.requiredRule});
        const categories = [...new Set(recipes.map(entry => entry.category))].sort();
        const filtered = recipes.map((entry, index) => ({ entry, index })).filter(({ entry }) =>
            (this.selectedCategories.size === 0 || this.selectedCategories.has(entry.category)) &&
            `${entry.name} ${entry.category}`.toLowerCase().includes(this.query.toLowerCase().trim())
        );
        const model = this.selected === 0 ? this.person : this.selected === 1 ? this.money : this.delivery;
        return html`
        <header class="masthead"><a class="brand" href="#home" aria-label="FDL home" @click=${(event: Event) => { event.preventDefault(); this.showPage('home'); }}>f<span>d</span>l<span class="brand-dot">.</span></a><span class="mast-label">FIELD DEFINITION LANGUAGE</span></header>
        <div class="shell">
            <aside>
            <nav class="site-nav" aria-label="Site pages">${sitePages.map(entry => html`<a href=${`#${entry.id}`} aria-current=${this.page === entry.id ? 'page' : 'false'} @click=${(event: Event) => { event.preventDefault(); this.showPage(entry.id); }}>${entry.title}</a>`)}</nav>
            <section class="modifier-navigation" aria-labelledby="modifier-navigation-title">
            <div class="modifier-tools"><h2 id="modifier-navigation-title" class="eyebrow">Modifiers</h2>
            <label class="search-label" for="modifier-search">Find a modifier</label>
            <input id="modifier-search" class="modifier-search" type="search" placeholder="Name or category…" .value=${this.query} @input=${(event: Event) => { this.query = (event.target as HTMLInputElement).value; this.requestUpdate(); }}>
            <details class="category-filters">
                <summary>Categories${this.selectedCategories.size ? html` <span class="filter-count">(${this.selectedCategories.size} selected)</span>` : ''}</summary>
                <fieldset class="categories">
                <legend class="visually-hidden">Filter modifiers by category</legend>
                <p class="category-hint">No selection shows all categories.</p>
                <div class="category-options">${categories.map(category => html`<label><input type="checkbox" .checked=${this.selectedCategories.has(category)} @change=${(event: Event) => {
                    if ((event.target as HTMLInputElement).checked) this.selectedCategories.add(category);
                    else this.selectedCategories.delete(category);
                    this.requestUpdate();
                }}><span>${category}</span></label>`)}</div>
            </fieldset></details>
            ${this.query || this.selectedCategories.size ? html`<button class="clear-filters" @click=${() => { this.query = ''; this.selectedCategories.clear(); this.requestUpdate(); }}>Clear filters</button>` : ''}
            <p class="match-count" role="status">${filtered.length} of ${recipes.length} modifiers</p></div>
            <nav class="modifier-list" aria-label="Modifiers">${filtered.map(({entry, index}) => html`<a href=${`#${entry.name}`} aria-current=${this.page === 'modifier' && this.selected === index ? 'page' : 'false'} @click=${(event: Event) => { event.preventDefault(); this.select(index); }}><span><strong>${entry.name}</strong><small>${entry.category}</small></span></a>`)}</nav>
            ${filtered.length === 0 ? html`<p class="empty-search">No modifiers match. Change the search or category filters.</p>` : ''}
            </section></aside>
            <main>
                ${this.page !== 'modifier' ? renderSitePage(this.page) : html`
                <div class="chapter"><span>${recipe.category}</span></div>
                <h1 tabindex="-1">.${recipe.name}<span>${recipe.signature}</span></h1>
                <h2>${recipe.title}</h2><p class="description">${recipe.description}</p>
                <section class="playground" aria-label="Interactive example">
                    <div class="section-bar"><span><i></i> ${recipe.limitation ? 'ADAPTER CONTRACT' : ['hashFunction', 'inputMask', 'exampleValue', 'reducer'].includes(recipe.name) ? 'MODEL EXERCISE' : 'LIVE EXAMPLE'}</span>${recipe.limitation ? html`` : html`<button class="reset" @click=${this.reset}>Reset example ↺</button>`}</div>
                    <p class="instruction">${recipe.prompt}</p>
                    <div class=${this.selected > 2 ? "demo-grid catalog-demo" : "demo-grid"}><div class="controls" role="group" aria-label="Current modifier effect">${keyed(`${recipe.name}-${this.resetVersion}`, this.demo())}</div>${this.selected < 3 ? html`<div class="model"><p class="eyebrow">IN THE RECORD</p>${recordSummary(model)}<details><summary>Inspect full JSON</summary><pre>${JSON.stringify(model.values, null, 2)}</pre></details><div class="model-foot">Actual FDL model state</div></div>` : ''}</div>
                </section>
                <div class="details">
                <p class="source-intro">Save these as two files in the same folder. The model file exports the record and the Lit file imports it to render the core example with its current rules. The demo’s teaching panels and rule selectors are omitted.</p>
                <section class="code-section"><div class="detail-heading"><h3>Define the ${source.kind === 'Recordset' ? 'recordset' : 'record'}</h3><span><code>${source.modelFile}</code></span></div><pre class="code"><code>${highlightModifier(source.definition, recipe.name)}</code></pre><p class="code-caption">${recipe.name === 'required' && !this.requiredRule ? 'The required rule is removed; the field is optional.' : html`Highlighted lines define <code>.${recipe.name}()</code>.`}</p></section>
                <section class="markup-section"><div class="detail-heading"><h3>Render with Lit</h3><span><code>${source.uiFile}</code></span></div>
                    <p class="markup-note">This file imports <code>${source.modelName}</code> from <code>./${source.modelFile}</code>.${source.contract ? ' This adapter has no supported control for this modifier, so the UI states that limitation.' : html` The <code>fdl-field</code> and <code>fdl-table</code> components are this site’s example adapters.`}</p><pre class="code markup"><code>${highlightJavaScript(source.ui)}</code></pre>
                </section><section class="explanation"><h3>What happens</h3><ol>${recipe.steps.map(step => html`<li>${step}</li>`)}</ol><p class="use"><strong>Good for</strong>${recipe.use}</p></section></div>
                <section class="note"><div><h3>Behavior details</h3><p>${recipe.note}</p></div></section>
                <footer><button class="pager" ?disabled=${this.selected === 0} @click=${() => this.select(this.selected - 1)}>← Back${this.selected > 0 ? html`<small>.${recipes[this.selected - 1].name}${recipes[this.selected - 1].signature}</small>` : ''}</button><span class="page-count">${this.selected + 1} of ${recipes.length}</span><button class="pager next" ?disabled=${this.selected === recipes.length - 1} @click=${() => this.select(this.selected + 1)}>Next →${this.selected < recipes.length - 1 ? html`<small>.${recipes[this.selected + 1].name}${recipes[this.selected + 1].signature}</small>` : ''}</button></footer>
                `}
            </main>
        </div>`;
    }
    static styles = css`
        :host { display:block; min-height:100vh; background:#ffffff; color:#0f172a; font:1.125rem/1.65 Arial,Helvetica,sans-serif; --accent:#2563eb; --muted:#475569; }
        * { box-sizing:border-box; }
        a { color:inherit; }
        button,input { font:inherit; }
        button { cursor:pointer; }
        button:disabled { cursor:default; opacity:.45; }
        a:focus-visible,button:focus-visible,input:focus-visible { outline:3px solid #2563eb; outline-offset:4px; }
        h1:focus { outline:none; }
        .masthead { max-width:1480px; margin:auto; padding:16px 32px; display:flex; align-items:center; gap:24px; border-bottom:1px solid #e2e8f0; }
        .brand { font-size:46px; font-weight:800; letter-spacing:-6px; text-decoration:none; line-height:1.2; }
        .brand span:first-child { color:var(--accent); }
        .brand-dot { color:#2563eb; letter-spacing:0; }
        .mast-label { font-size:.875rem; letter-spacing:.06em; }
        .catalog-link { margin-left:auto; font-size:1rem; text-underline-offset:4px; }
        .shell { display:grid; grid-template-columns:280px minmax(0,1fr); max-width:1480px; margin:auto; padding:0 32px; }
        aside { position:sticky; top:0; height:calc(100vh - 88px); height:calc(100dvh - 88px); overflow:hidden; padding:28px 24px 24px 0; display:flex; flex-direction:column; align-self:start; border-right:1px solid #e2e8f0; }
        .eyebrow { font-size:.875rem; font-weight:700; letter-spacing:.04em; color:var(--muted); margin:0 0 20px; }
        .search-label,.categories legend { font-size:1rem; font-weight:600; color:var(--muted); }
        .search-label { margin-bottom:8px; }
        .modifier-search { width:100%; height:48px; padding:10px 14px; border:1px solid #94a3b8; border-radius:6px; background:#ffffff; color:#0f172a; font-size:1rem; }
        .category-filters { margin-top:16px; }
        .category-filters summary { min-height:44px; padding:8px 0; font-size:1rem; font-weight:600; cursor:pointer; }
        .category-filters summary:focus-visible { outline:3px solid #2563eb; outline-offset:3px; }
        .filter-count { font-size:.875rem; font-weight:400; color:var(--muted); }
        .categories { border:0; padding:0; margin:0; }
        .visually-hidden { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
        .categories legend { padding:0; }
        .category-hint { margin:6px 0 10px; font-size:.875rem; color:var(--muted); line-height:1.5; }
        .category-options { display:grid; gap:2px; }
        .category-options label { display:flex; align-items:center; gap:10px; min-height:36px; font-size:1rem; cursor:pointer; }
        .category-options input { width:20px; height:20px; margin:0; accent-color:var(--accent); }
        .clear-filters { align-self:flex-start; min-height:44px; padding:8px 0; border:0; background:none; color:var(--accent); font-size:1rem; text-decoration:underline; text-underline-offset:3px; }
        .match-count { margin:16px 0 10px; font-size:.875rem; color:var(--muted); }
        nav { display:grid; gap:6px; min-height:100px; overflow-y:auto; overscroll-behavior:contain; }
        nav a { display:flex; align-items:center; min-height:60px; padding:10px 12px; border:1px solid transparent; border-radius:4px; text-decoration:none; }
        nav a:hover { background:#f1f5f9; }
        nav a[aria-current=page] { background:#eff6ff; border-color:#93c5fd; color:#1d4ed8; box-shadow:inset 3px 0 #2563eb; }
        nav strong { font:600 .9375rem/1.5 monospace; overflow-wrap:anywhere; }
        nav small { display:block; font-size:.875rem; line-height:1.5; color:var(--muted); }
        .site-nav { flex-shrink:0; min-height:0; overflow:visible; margin-bottom:24px; padding-bottom:20px; border-bottom:1px solid #cbd5e1; gap:4px; }
        .site-nav a { min-height:44px; font-size:1rem; font-weight:600; padding:8px 10px; }
        .modifier-navigation { flex:1 1 auto; display:flex; flex-direction:column; min-height:0; }
        .modifier-navigation > .modifier-tools { flex:0 1 auto; min-height:0; overflow-y:auto; }
        .modifier-list { flex:1 1 0; min-height:120px; overflow-y:auto; overflow-x:hidden; scrollbar-gutter:stable; overscroll-behavior:contain; }
        .site-page { max-width:75ch; }
        .site-page h1 { font-family:Arial,Helvetica,sans-serif; font-size:clamp(30px,3vw,42px); font-weight:650; }
        .site-page h2 { margin-top:32px; font-size:1.5rem; }
        .site-page p,.site-page li,.site-page dd { font-size:1.125rem; line-height:1.75; }
        .site-page a { color:var(--accent); text-underline-offset:3px; }
        .site-page .code { margin:20px 0; }
        .concepts dt { margin-top:20px; font:600 1.125rem monospace; }
        .concepts dd { margin:8px 0 0; }
        .empty-search { font-size:1rem; }
        main { min-width:0; padding:32px 0 32px 40px; }
        .chapter { display:flex; justify-content:space-between; align-items:center; gap:12px; font-size:.875rem; color:var(--muted); }
        .chapter span:first-child { padding:4px 8px; border:1px solid #93c5fd; border-radius:3px; color:var(--accent); }
        h1 { margin:24px 0 16px; font:500 clamp(28px,3.2vw,44px)/1.3 monospace; letter-spacing:-1px; overflow-wrap:anywhere; scroll-margin-top:24px; }
        h1 span { color:#64748b; font-size:.75em; }
        h2 { margin:0 0 16px; font-size:1.75rem; line-height:1.35; font-weight:600; }
        .description { max-width:70ch; margin:0 0 28px; font-size:1.125rem; line-height:1.7; color:var(--muted); }
        .playground { border:1px solid var(--example-border); border-radius:var(--example-radius); background:#ffffff; overflow:hidden; }
        .section-bar { min-height:64px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; padding:12px 20px; border-bottom:1px solid #e2e8f0; font-size:.875rem; font-weight:600; }
        .section-bar i { display:inline-block; width:7px; height:7px; margin-right:8px; border-radius:50%; background:#2563eb; }
        .reset { min-height:44px; padding:8px; border:0; background:none; color:var(--accent); font-size:1rem; text-decoration:underline; text-underline-offset:3px; }
        .instruction { margin:20px; font-size:1.125rem; color:var(--muted); }
        .demo-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:24px; padding:0 20px 24px; }
        .catalog-demo { display:block; }
        .controls { min-width:0; }
        fdl-field { display:block; font-size:1.125rem; --field-label-width:100%; --field-control-width:100%; --label:.875rem; --field-control-font-size:1rem; }
        .primary { min-height:48px; margin-top:0; padding:10px 18px; border:1px solid var(--accent); border-radius:4px; background:var(--accent); color:white; font-size:1rem; }
        .primary:hover { background:#1d4ed8; border-color:#1d4ed8; }
        .result { margin:16px 0 0; font-size:1rem; line-height:1.65; color:var(--muted); }
        .model { align-self:start; }
        .model .eyebrow { margin-bottom:16px; }
        .model pre { margin:0; font:1rem/1.7 monospace; white-space:pre-wrap; overflow-wrap:anywhere; }
        .model-foot { margin-top:16px; padding-top:12px; border-top:1px solid #cbd5e1; font-size:.875rem; color:var(--muted); }
        summary { cursor:pointer; min-height:44px; padding:8px 0; }
        summary:focus-visible { outline:3px solid #2563eb; outline-offset:3px; }
        .details { display:grid; grid-template-columns:minmax(0,1fr); gap:28px; margin:32px 0; }
        .code-line { display:inline-block; min-width:100%; width:max-content; padding:0 20px; border-left:4px solid transparent; }
        .code .focused-line { border-left-color:#60a5fa; background:#1e3a5f; }
        .code-caption,.markup-note { font-size:1rem; line-height:1.65; margin:12px 0 0; max-width:70ch; }
        .markup-note { margin:0 0 16px; }
        .code:not(.markup) { padding-left:0; padding-right:0; }
        .source-intro { margin:0; max-width:70ch; font-size:1rem; }
        .code-section,.explanation { min-width:0; }
        .code-section,.markup-section { min-width:0; padding:20px; border:1px solid var(--example-border); border-radius:var(--example-radius); background:white; }
        .detail-heading h3 { margin:0; }
        .detail-heading { min-height:32px; margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .detail-heading span { font-size:.875rem; color:var(--muted); }
        h3 { margin:0 0 16px; font-size:1.25rem; font-weight:600; line-height:1.4; }
        .code { margin:0; padding:24px; border-radius:5px; background:#0f172a; color:#e2e8f0; font:1rem/1.75 monospace; overflow:auto; tab-size:2; }
        .explanation ol { max-width:70ch; margin:0; padding-left:1.5em; }
        .explanation li { padding-left:8px; margin-bottom:16px; font-size:1.125rem; line-height:1.75; }
        .use { max-width:70ch; margin-top:24px; padding-top:20px; border-top:1px solid #e2e8f0; font-size:1.125rem; }
        .use strong { display:block; margin-bottom:8px; }
        .note { padding:24px 0; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0; }
        .note p { max-width:70ch; margin:0; font-size:1.125rem; line-height:1.75; }
        footer { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-top:24px; }
        .pager { min-height:48px; min-width:100px; padding:8px 0; border:0; background:none; color:var(--accent); font-size:1.125rem; text-align:left; }
        .pager small { display:block; margin-top:6px; font: .875rem/1.5 monospace; overflow-wrap:anywhere; }
        .next { text-align:right; }
        .page-count { flex-shrink:0; font-size:.875rem; color:var(--muted); }
        .formatted { display:grid; gap:8px; padding:16px 0; }
        .formatted span { font-size:1rem; color:var(--muted); }
        .formatted strong { font-size:2rem; font-weight:600; }
        .syntax-comment { color:#a5b4c8; font-style:italic; }
        .syntax-string,.syntax-regex { color:#a7f3d0; }
        .syntax-keyword { color:#c4b5fd; }
        .syntax-builtin { color:#7dd3fc; }
        .syntax-function { color:#93c5fd; }
        .syntax-number,.syntax-literal { color:#fdba74; }
        .syntax-punctuation { color:#cbd5e1; }
        @media(max-height:750px) and (min-width:801px) { aside { padding-top:16px; padding-bottom:16px; } .site-nav { margin-bottom:12px; padding-bottom:12px; } }
        @media(max-width:1100px) { .shell { grid-template-columns:260px minmax(0,1fr); padding:0 24px; } main { padding-left:28px; } .demo-grid { grid-template-columns:minmax(0,1fr); } }
        @media(max-width:800px) {
            .masthead { padding:16px 20px; }
            .mast-label { display:none; }
            .shell { display:block; padding:0 20px; }
            aside { position:static; height:auto; max-height:none; overflow:visible; padding:24px 0; border-right:0; border-bottom:1px solid #e2e8f0; }
            .category-options { grid-template-columns:repeat(2,minmax(0,1fr)); gap:4px 12px; }
            .category-options label { min-height:44px; }
            .modifier-list { flex:none; max-height:320px; min-height:0; }
            .modifier-navigation > .modifier-tools { flex:none; overflow:visible; }
            .site-nav { max-height:none; }
            main { padding:28px 0; }
            h1 { font-size:clamp(24px,5.5vw,36px); }
            h1 span { display:block; margin-top:8px; }
            h2 { font-size:1.5rem; }
            .code { padding:16px; }
            .pager small { display:none; }
        }
        ${exampleTheme}
    `;
}
customElements.define('fdl-modifier-explorer', FdlModifierExplorer);
