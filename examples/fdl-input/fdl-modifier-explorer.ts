import { field } from '../../index';
import { modifierPage } from './modifier-page-groups';
import { relatedModifierNames } from './related-modifiers';
import { displayedModifierSignatures as modifierSignatures, fieldSettingResults, recordSettingNames, columnSettingResults } from './modifier-signatures';
import { categoryIcon, categoryDescriptions } from './category-icon';
import { LitElement, css, html } from 'lit';
import { renderSitePage, sitePages, type SitePage } from './fdl-site-pages';
import { exampleSource, type ExampleSettings } from './modifier-example-source';
import { highlightJavaScript, highlightModifier } from './highlight-javascript';
import { inputText, valuePipeline } from './value-pipeline';
import { exampleTheme } from './example-theme';
import { recordSummary } from './model-summary';
import { explainDependency } from './dependency-explanation';
import { keyed } from 'lit/directives/keyed.js';
import Record from '../../record.js';
import './fdl-field';
import './fdl-modifier-catalog';
import { additionalRecipes, type ExplorerRecipe } from './modifier-explorer-recipes';

export const explorerRecipes: ExplorerRecipe[] = [
    {
        name: 'required', signature: '(predicate?)', category: 'Validation', title: 'Require a non-empty value.',
        description: 'Declare that a field needs a value. FDL carries that rule from the record to the control, so validation and the interface agree.',
        prompt: 'Legal name is always required while its rule is enabled. Follow-up notes are required only when Follow-up needed is Yes.',
        steps: ['Use required() for an unconditional rule or required(record => ...) for a conditional rule.', 'The component exposes the required state on the input.', 'Record.isValid() checks the same rule without a browser.'],
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
        note: 'Visibility does not erase a value or make it optional. If a field should be required only while visible, declare the matching required rule separately.',
        use: 'Shipping details, payment-specific fields, and branching forms.',
    },
    ...additionalRecipes,
].sort((a, b) => a.name.localeCompare(b.name, 'en'));

const recipes = explorerRecipes;

export class FdlModifierExplorer extends LitElement {
    private compositionView?: {route: string; element: HTMLElement};
    private compositionForPage() {
        if (this.page !== 'composition') return undefined;
        const route = window.location.hash;
        if (!this.compositionView || this.compositionView.route !== route) {
            this.compositionView = {route, element: document.createElement('fdl-composition-experiment')};
        }
        return this.compositionView.element;
    }
    private learningState = {step: 0, values: {method: 'ship', charge: '$25.00' as any}};
    private selected = 0;
    private navigationOpen = false;
    private get modifierName() { return recipes[this.selected].name; }
    private page: SitePage | 'modifier' = 'home';
    private checked = false;
    private requiredRule = true;
    private exampleSettings: {[name: string]: ExampleSettings} = {};
    private amountInput?: string;
    private captureAmountInput = {capture: true, handleEvent: (event: Event) => { this.amountInput = inputText(event); this.requestUpdate(); }};
    private query = '';
    private categoryTooltip = false;
    private tooltip?: {recipe: ExplorerRecipe; left: number; top: number};
    private tooltipTimer?: ReturnType<typeof setTimeout>;
    private showTooltip(event: Event, recipe: ExplorerRecipe) {
        clearTimeout(this.tooltipTimer);
        const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
        this.tooltip = {recipe, left: Math.max(8, Math.min(bounds.right + 8, window.innerWidth - 436)), top: Math.max(8, Math.min(bounds.top, window.innerHeight - 240))};
        this.requestUpdate();
    }
    private hideTooltip = () => {
        clearTimeout(this.tooltipTimer);
        this.tooltip = undefined;
        this.requestUpdate();
    };
    private deferHideTooltip = () => {
        clearTimeout(this.tooltipTimer);
        this.tooltipTimer = setTimeout(this.hideTooltip, 150);
    };

    private resetVersions: {[name: string]: number} = {};
    private selectedCategories = new Set<string>();
    private person = new Record({ name: field.label('Legal name').required(), followUp: field.label('Follow-up needed?').options([{text:'No',value:'no'},{text:'Yes',value:'yes'}]).tag('select'), followUpNotes:field.label('Follow-up notes').tag('textarea').rowCount(2).required(record => record.getField('followUp') === 'yes') }, { name: '', followUp:'no', followUpNotes:'' });
    private money = new Record({ amount: field.label('Amount').type('number').parser(value => Number(value)).formatter((value, _record?: unknown, context?: string) => context === 'input-focus' ? String(value) : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value))) }, { amount: 1250 });
    private delivery = new Record({
        fulfillment: field.label('Delivery method').tag('select').options([{ text: 'Ship to address', value: 'ship' }, { text: 'Pick up in person', value: 'pickup' }]),
        address: field.label('Shipping address').visibleWhen(record => record.getField('fulfillment') === 'ship'),
    }, { fulfillment: 'ship', address: '42 Orchard Street' });
    private refresh = () => this.requestUpdate();
    private closeCategoryMenu = (event: Event) => {
        const menu = this.shadowRoot?.querySelector<HTMLDetailsElement>('.category-filters');
        if (menu?.open && !event.composedPath().includes(menu)) menu.open = false;
    };
    private readLocation = () => {
        const route = window.location.hash.slice(1).split('?')[0];
        const aliases: {[key: string]: string} = {conditionalCellClass:'cellClass', rowClasses:'rowClass', requiredWhen:'required', disabledWhen:'disabled'};
        const hash = aliases[route] ?? route;
        const page = sitePages.find(page => page.id === hash);
        if (page || !hash) {
            this.showPage(page?.id ?? 'home', false);
            if (page?.id === 'categories') {
                const category = new URLSearchParams(window.location.hash.split('?')[1]).get('category');
                if (category) this.updateComplete.then(() => {
                    const heading = this.shadowRoot?.getElementById(category);
                    heading?.focus({preventScroll:true});
                    heading?.scrollIntoView?.({block:'start'});
                });
            }
        }
        else {
            const index = recipes.findIndex(recipe => recipe.name === hash);
            if (index >= 0) {
                this.select(index, false);
            }
            else this.showPage('home', false);
        }
    };
    private showPage(page: SitePage, updateUrl = true) {
        this.page = page;
        this.navigationOpen = false;
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
        window.addEventListener('click', this.closeCategoryMenu);
        this.readLocation();
    }
    disconnectedCallback() {
        [this.person, this.money, this.delivery].forEach(record => record.removeEventListener('change', this.refresh));
        window.removeEventListener('hashchange', this.readLocation);
        window.removeEventListener('click', this.closeCategoryMenu);
        clearTimeout(this.tooltipTimer);
        super.disconnectedCallback();
    }
    private select(index: number, updateUrl = true) {
        if (index < 0 || index >= recipes.length) return;
        const changed = this.page !== 'modifier' || !modifierPage(this.modifierName).names.includes(recipes[index].name);
        const targetChanged = this.page !== 'modifier' || this.selected !== index;
        this.page = 'modifier';
        this.navigationOpen = false;
        this.selected = index;
        if (changed) { this.exampleSettings = {}; this.categoryTooltip = false; }
        this.requestUpdate();
        this.updateComplete.then(() => this.shadowRoot?.querySelector<HTMLElement>('.modifier-list [aria-current="page"]')?.scrollIntoView?.({ block: 'nearest' }));
        if (updateUrl) {
            window.location.hash = recipes[index].name;
        }
        if (updateUrl || targetChanged) this.focusModifier(recipes[index].name);
        document.title = `${modifierPage(recipes[index].name).title || recipes[index].name} — FDL Modifier explorer`;
    }
    private focusModifier(name: string) {
        this.updateComplete.then(() => {
            const group = modifierPage(name);
            const heading = group.names[0] === name
                ? this.shadowRoot?.querySelector<HTMLElement>('h1')
                : this.shadowRoot?.getElementById(name)?.querySelector<HTMLElement>('.modifier-signature');
            heading?.focus({preventScroll:true});
            heading?.scrollIntoView?.({block:'start'});
        });
    }
    private field(record: Record<any>, field: string) {
        return keyed(record.fieldTypeForField(field), html`<fdl-field .record=${record} field=${field} .showValidationErrors=${this.checked}></fdl-field>`);
    }
    private reset(name = this.modifierName) {
        this.resetVersions[name] = (this.resetVersions[name] ?? 0) + 1;
        if (name === 'required') { this.checked = false; this.requiredRule = true; this.person.addField('name', field.label('Legal name').required(), ''); this.person.setField('followUp','no'); this.person.setField('followUpNotes',''); }
        delete this.exampleSettings[name];
        if (name === 'formatter') { this.amountInput = undefined; this.money.setField('amount', 1250); }
        if (name === 'visibleWhen') { this.delivery.setField('fulfillment', 'ship'); this.delivery.setField('address', '42 Orchard Street'); }
        this.requestUpdate();
    }
    private demo(name: string) {
        if (name === 'required') return html`
            <label class="rule-control"><input type="checkbox" .checked=${this.requiredRule} @change=${(event: Event) => {
                this.requiredRule = (event.target as HTMLInputElement).checked;
                const base = field.label('Legal name');
                this.person.addField('name', this.requiredRule ? base.required() : base, this.person.getField('name'));
                this.requestUpdate();
            }}> Require a value</label>
            ${this.field(this.person, 'name')}
            ${this.field(this.person, 'followUp')}
            ${this.field(this.person, 'followUpNotes')}
            ${explainDependency(this.person, 'followUpNotes', 'followUp', `followUp === 'yes'`, 'required')}
            <button class="primary" @click=${() => { this.checked = true; this.requestUpdate(); }}>Check record</button>
            <p class="result" role="status">${this.checked ? (this.person.isValid() ? '✓ The record is valid.' : !this.person.isValid('name') ? 'Legal name is required. Add a value to continue.' : 'Follow-up notes are required. Add notes or choose No.') : `${this.person.isValid() ? 'The model is valid.' : 'The model is invalid.'} Check record shows its validation message.`}</p>`;
        if (name === 'formatter') return html`
            <div @input=${this.captureAmountInput}>${this.field(this.money, 'amount')}</div>
            <div class="formatted"><span>Formatted output</span><strong>${this.money.getFormattedField('amount', 'print')}</strong></div>
            <p class="result">The formatter leaves the stored number unchanged.</p>${valuePipeline(this.money, 'amount', this.amountInput)}`;
        if (!['required', 'formatter', 'visibleWhen'].includes(name)) return html`<fdl-modifier-catalog modifier=${name} @example-settings-change=${(event: CustomEvent<ExampleSettings>) => { this.exampleSettings[name] = event.detail; this.requestUpdate(); }}></fdl-modifier-catalog>`;
        return html`${this.field(this.delivery, 'fulfillment')}${this.field(this.delivery, 'address')}${explainDependency(this.delivery, 'address', 'fulfillment', `fulfillment === 'ship'`, 'visible')}<p class="result" role="status">${this.delivery.getField('fulfillment') === 'ship' ? 'Shipping address is visible.' : 'Pickup selected. Shipping address is hidden.'}</p>`;
    }
    private renderModifierSection(recipe: ExplorerRecipe) {
        const source = exampleSource(recipe.name, {...this.exampleSettings[recipe.name], required: this.requiredRule});
        const standaloneDemo = ['required', 'formatter', 'visibleWhen'].includes(recipe.name);
        const model = recipe.name === 'required' ? this.person : recipe.name === 'formatter' ? this.money : this.delivery;
        return html`<section class="modifier-section" id=${recipe.name} data-modifier=${recipe.name}>
                <h2 class="modifier-signature" tabindex="-1"><code>${modifierSignatures[recipe.name]}</code></h2>
                ${fieldSettingResults[recipe.name] ? html`<p class="setting-contract">Supply a fixed value or a function of <code>${recipe.name === 'columnClass' ? '()' : recordSettingNames.has(recipe.name) ? '(record)' : ['emptyWhen', 'cellClass'].includes(recipe.name) ? '(value, record)' : '(value, record, context)'}</code>. ${recipe.name === 'columnClass' ? html` Column classes have no owning row or cell context.` : recordSettingNames.has(recipe.name) ? html` Record is the owning FDL Record. Read dependent values from the record.` : recipe.name === 'emptyWhen' ? html` Value is the candidate being checked, which may differ from the stored value; record is its owning FDL Record.` : recipe.name === 'cellClass' ? html` Value is the current stored field value; record is its owning FDL Record. No context argument is passed.` : html` Value is the current stored field value; context identifies the display consumer.`}</p>` : columnSettingResults[recipe.name] ? html`<p class="setting-contract">Supply a fixed value or a callback with no arguments: <code>()</code>. Column settings have no record, value, or context parameters.</p>` : recipe.name === 'defaultValue' ? html`<p class="setting-contract">Supply a fixed default or a factory of <code>(record)</code>. The factory receives the owning FDL Record when a missing value needs a default.</p>` : ''}
                <p class="api-reference"><a href="#integration">Public types, callback contracts, and composition rules</a></p><p class="modifier-title">${recipe.title}</p><p class="description">${recipe.description}</p>
                ${recipe.deprecation ? html`<p class="deprecation-note"><strong>Deprecated.</strong> ${recipe.deprecation} The existing modifier remains available for compatibility.</p>` : ''}
                <section class="playground" data-modifier=${recipe.name} aria-label="Interactive example">
                    <div class="section-bar"><span><i></i> ${recipe.limitation ? 'ADAPTER CONTRACT' : ['hashFunction', 'reducer'].includes(recipe.name) ? 'MODEL EXERCISE' : 'LIVE EXAMPLE'}</span>${recipe.limitation ? html`` : html`<button class="reset" @click=${() => this.reset(recipe.name)}>Reset example ↺</button>`}</div>
                    <p class="instruction">${recipe.prompt}</p>
                    <div class=${!standaloneDemo ? "demo-grid catalog-demo" : "demo-grid"}><div class="controls" role="group" aria-label="Current modifier effect">${keyed(`${recipe.name}-${this.resetVersions[recipe.name] ?? 0}`, this.demo(recipe.name))}</div>${standaloneDemo ? html`<div class="model"><p class="eyebrow">IN THE RECORD</p>${recordSummary(model)}<details><summary>Inspect full JSON</summary><pre>${JSON.stringify(model.values, null, 2)}</pre></details><div class="model-foot">Actual FDL model state</div></div>` : ''}</div>
                </section>
                <div class="details">
                <p class="source-intro">Starting values are shown below. These two files require the repository’s example adapters and their dependencies. Read <a href="#quickstart">setup and adapter prerequisites</a> before copying them. Save the model and view in the same folder within that environment. The model file exports the record and the Lit file imports it to render the core example with its current rules. The demo’s teaching panels and rule selectors are omitted.</p>
                <section class="code-section"><div class="detail-heading"><h3>Define the ${source.kind === 'Recordset' ? 'recordset' : 'record'}</h3><span><code>${source.modelFile}</code></span></div><pre class="code"><code>${highlightModifier(source.definition, recipe.name)}</code></pre></section>
                <section class="markup-section"><div class="detail-heading"><h3>Render with Lit</h3><span><code>${source.uiFile}</code></span></div>
                    <p class="markup-note">This file imports <code>${source.modelName}</code> from <code>./${source.modelFile}</code>.${source.contract ? ' This adapter has no supported control for this modifier, so the UI states that limitation.' : html` The <code>fdl-field</code> and <code>fdl-table</code> components are this site’s example adapters.`}</p><pre class="code markup"><code>${highlightJavaScript(source.ui)}</code></pre>
                </section>
                ${source.styles ? html`<section class="css-section"><div class="detail-heading"><h3>Style the example</h3><span>CSS · ${source.stylesComponent}</span></div>
                    <p class="markup-note">These rules live in <code>${source.stylesComponent}</code>’s shadow-root stylesheet (<code>static styles</code>). ${source.stylesComponent === 'fdl-field' ? 'The adapter sets the native disabled state from the field definition; CSS gives it its appearance.' : 'The field definition supplies the class; CSS gives it its appearance.'}</p>
                    <pre class="code example-css"><code>${source.styles}</code></pre>
                </section>` : ''}
                <section class="explanation"><h3>What happens</h3><ol>${recipe.steps.map(step => html`<li>${step}</li>`)}</ol><p class="use"><strong>Good for</strong>${recipe.use}</p></section></div>
                <section class="note"><div><h3>Behavior details</h3><p>${recipe.note}</p></div></section>
                <section class="related-modifiers" aria-labelledby=${`${recipe.name}-related-title`}><h3 id=${`${recipe.name}-related-title`}>Related modifiers</h3><ul>${relatedModifierNames(recipe.name).map(name => {
                    const related = recipes.find(entry => entry.name === name)!;
                    return html`<li><a href=${`#${name}`} @click=${(event: Event) => { event.preventDefault(); this.select(recipes.indexOf(related)); }}><code>.${name}()</code></a><span>${related.title}</span></li>`;
                })}</ul></section>
        </section>`;
    }
    render() {
        const recipe = recipes[this.selected];
        const group = modifierPage(recipe.name);
        const categories = [...new Set(recipes.map(entry => entry.category))].sort();
        const filtered = recipes.map((entry, index) => ({ entry, index })).filter(({ entry }) =>
            (this.selectedCategories.size === 0 || this.selectedCategories.has(entry.category)) &&
            entry.name.toLowerCase().includes(this.query.toLowerCase().trim())
        );
        const filtering = Boolean(this.query.trim() || this.selectedCategories.size);
        const pages = filtered
            .filter((item, index) => filtered.findIndex(other => modifierPage(other.entry.name).names[0] === modifierPage(item.entry.name).names[0]) === index)
            .map(item => {
                const name = filtering ? item.entry.name : modifierPage(item.entry.name).names[0];
                const index = recipes.findIndex(entry => entry.name === name);
                return {entry: recipes[index], index};
            });
        const position = pages.findIndex(item => modifierPage(item.entry.name).names.includes(recipe.name));
        const previous = position > 0 ? pages[position - 1] : undefined;
        const next = pages[position + 1];
        return html`
        <header class="masthead"><a class="brand" href="#home" aria-label="FDL home" @click=${(event: Event) => { event.preventDefault(); this.showPage('home'); }}>f<span>d</span>l<span class="brand-dot">.</span></a><span class="mast-label">FIELD DEFINITION LIBRARY</span></header>
        <div class=${`shell ${this.navigationOpen ? 'navigation-open' : ''}`}>
            <button class="mobile-browse" aria-expanded=${this.navigationOpen} aria-controls="site-navigation" @click=${() => { this.navigationOpen = !this.navigationOpen; this.requestUpdate(); }}><span>Browse modifiers</span><small>${this.page === 'modifier' ? `.${recipe.name}()` : sitePages.find(entry => entry.id === this.page)?.title}</small><span aria-hidden="true">${this.navigationOpen ? '−' : '+'}</span></button>
            <aside id="site-navigation">
            <nav class="site-nav" aria-label="Site pages">${sitePages.map(entry => html`<a href=${`#${entry.id}`} aria-current=${this.page === entry.id ? 'page' : 'false'} @click=${(event: Event) => { event.preventDefault(); this.showPage(entry.id); }}>${entry.title}</a>`)}</nav>
            <section class="modifier-navigation" aria-labelledby="modifier-navigation-title">
            <div class="modifier-tools"><div class="modifier-heading"><h2 id="modifier-navigation-title" class="eyebrow">Modifiers</h2></div>
            <div class="modifier-search-field"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m16 16 4 4"></path></svg>
            <input id="modifier-search" class="modifier-search" type="search" aria-label="Find a modifier" placeholder="Find a modifier…" .value=${this.query} @input=${(event: Event) => { this.query = (event.target as HTMLInputElement).value; this.requestUpdate(); }}></div>
            <details class="category-filters" @keydown=${(event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    const menu = event.currentTarget as HTMLDetailsElement;
                    menu.open = false;
                    menu.querySelector('summary')?.focus();
                    event.stopPropagation();
                }
            }}>
                <summary aria-label=${`Filter modifiers by category: ${this.selectedCategories.size ? [...this.selectedCategories].join(', ') : 'all categories'}`}><span>${this.selectedCategories.size === 0 ? 'All categories' : this.selectedCategories.size === 1 ? [...this.selectedCategories][0] : `${this.selectedCategories.size} categories`}</span><svg aria-hidden="true" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4"></path></svg></summary>
                <div class="category-menu">
                <fieldset class="categories">
                <legend class="visually-hidden">Filter modifiers by category</legend>
                <p class="category-hint">Select any combination.</p>
                <div class="category-options">${categories.map(category => html`<label><input type="checkbox" .checked=${this.selectedCategories.has(category)} @change=${(event: Event) => {
                    if ((event.target as HTMLInputElement).checked) this.selectedCategories.add(category);
                    else this.selectedCategories.delete(category);
                    this.requestUpdate();
                }}>${categoryIcon(category)}<span>${category}</span></label>`)}</div>
            </fieldset><div class="category-actions"><button @click=${() => { this.selectedCategories.clear(); this.requestUpdate(); }}>All categories</button><button @click=${(event: Event) => {
                const menu = (event.currentTarget as HTMLElement).closest('details')!;
                menu.open = false;
                menu.querySelector('summary')?.focus();
            }}>Done</button></div></div></details>
            ${this.query.trim() || this.selectedCategories.size ? html`<div class="filter-status"><button class="clear-filters" @click=${() => { this.query = ''; this.selectedCategories.clear(); this.requestUpdate(); }}>Clear filters</button><span class="match-count" role="status">(${filtered.length} of ${recipes.length} shown)</span></div>` : ''}
            </div>
            <nav class="modifier-list" aria-label="Modifiers">${filtered.map(({entry, index}) => html`<a href=${`#${entry.name}`} aria-describedby=${this.tooltip?.recipe.name === entry.name ? 'modifier-tooltip' : ''} @mouseenter=${(event: Event) => this.showTooltip(event, entry)} @mouseleave=${this.deferHideTooltip} @focus=${(event: Event) => this.showTooltip(event, entry)} @blur=${this.hideTooltip} @keydown=${(event: KeyboardEvent) => { if (event.key === 'Escape') this.hideTooltip(); }} aria-label=${`${entry.name} — ${entry.category}`} aria-current=${this.page === 'modifier' && this.selected === index ? 'page' : 'false'} @click=${(event: Event) => { event.preventDefault(); this.hideTooltip(); this.select(index); }}>${categoryIcon(entry.category)}<strong>${entry.name}</strong></a>`)}</nav>
            ${filtered.length === 0 ? html`<p class="empty-search">No modifiers match. Change the search or category filters.</p>` : ''}
            </section></aside>
            <main>
                ${this.page !== 'modifier' ? keyed(`${this.page}-${window.location.hash}`, renderSitePage(this.page, this.learningState, this.compositionForPage(), recipes)) : html`
                <div class="modifier-title-row"><h1 tabindex="-1">${group.title || html`.${recipe.name}<span>${recipe.signature}</span>`}</h1>
                    <div class="page-category" @mouseenter=${() => { this.categoryTooltip = true; this.requestUpdate(); }} @mouseleave=${() => { this.categoryTooltip = false; this.requestUpdate(); }}>
                        <button class="page-category-icon" aria-label=${`Category: ${recipe.category}`} aria-describedby=${this.categoryTooltip ? 'category-tooltip' : ''} @focus=${() => { this.categoryTooltip = true; this.requestUpdate(); }} @blur=${() => { this.categoryTooltip = false; this.requestUpdate(); }} @keydown=${(event: KeyboardEvent) => { if (event.key === 'Escape') { this.categoryTooltip = false; this.requestUpdate(); } }}>${categoryIcon(recipe.category)}</button>
                        ${this.categoryTooltip ? html`<span id="category-tooltip" role="tooltip"><strong>${recipe.category}</strong><span>${categoryDescriptions[recipe.category]}</span></span>` : ''}
                    </div>
                </div>
                ${group.names.length > 1 ? html`<nav class="page-sections" aria-label="On this page">${group.names.map(name => html`<a href=${`#${name}`} @click=${(event: Event) => {event.preventDefault(); this.select(recipes.findIndex(entry => entry.name === name));}}><code>.${name}()</code></a>`)}</nav>` : ''}
                ${group.names.map(name => keyed(name, this.renderModifierSection(recipes.find(entry => entry.name === name)!)))}
                <footer><button class="pager" ?disabled=${!previous} @click=${() => previous && this.select(previous.index)}>← Back${previous ? html`<small>${modifierPage(previous.entry.name).title || html`.${previous.entry.name}${previous.entry.signature}`}</small>` : ''}</button><span class="page-count">${position < 0 ? 'Current page is outside the results' : `${position + 1} of ${pages.length}`}${filtering ? html`<small>Filtered pages</small>` : ''}</span><button class="pager next" ?disabled=${!next} @click=${() => next && this.select(next.index)}>Next →${next ? html`<small>${modifierPage(next.entry.name).title || html`.${next.entry.name}${next.entry.signature}`}</small>` : ''}</button></footer>
                `}
            </main>
        </div>
        ${this.tooltip ? html`<div id="modifier-tooltip" role="tooltip" style=${`left:${this.tooltip.left}px;top:${this.tooltip.top}px`} @mouseenter=${() => clearTimeout(this.tooltipTimer)} @mouseleave=${this.deferHideTooltip}><pre><code>${modifierSignatures[this.tooltip.recipe.name]}</code></pre><p>${this.tooltip.recipe.title}</p></div>` : ''}`;
    }
    static styles = css`
        .page-sections { display:flex; min-height:0; overflow:visible; flex-wrap:wrap; gap:10px 20px; margin:0 0 32px; }
        .page-sections a { color:var(--accent); text-underline-offset:3px; }
        .deprecation-note { padding:16px 20px; border-left:4px solid #b7791f; background:#fffbeb; color:#713f12; line-height:1.65; }
        .modifier-section + .modifier-section { margin-top:56px; padding-top:40px; border-top:2px solid #cbd5e1; }
        .modifier-signature { scroll-margin-top:24px; }

        .related-modifiers { margin-top:32px; padding-top:24px; border-top:1px solid #e2e8f0; }
        .related-modifiers ul { list-style:none; padding:0; margin:0; display:grid; gap:12px; }
        .related-modifiers li { line-height:1.5; }
        .related-modifiers a { display:inline-block; color:var(--accent); padding:4px 0; }
        .related-modifiers span { display:block; color:var(--muted); font-size:1rem; }
        #modifier-tooltip { position:fixed; z-index:100; width:420px; max-width:calc(100vw - 16px); padding:14px 16px; border:1px solid #334155; border-radius:6px; background:#0f172a; color:#f8fafc; box-shadow:0 6px 20px #0f172a33; font-size:.9375rem; line-height:1.5; }
        #modifier-tooltip pre { margin:0; font: .875rem/1.6 monospace; white-space:pre-wrap; overflow-wrap:anywhere; }
        #modifier-tooltip p { margin:8px 0 0; }
        :host { display:block; min-height:100vh; background:#ffffff; color:#0f172a; font:1.125rem/1.65 Arial,Helvetica,sans-serif; --accent:#2563eb; --muted:#475569; }
        * { box-sizing:border-box; }
        a { color:inherit; }
        button,input { font:inherit; }
        button { cursor:pointer; }
        button:disabled { cursor:default; opacity:.45; }
        a:focus-visible,button:focus-visible,input:focus-visible { outline:3px solid #2563eb; outline-offset:4px; }
        h1:focus { outline:none; }
        .mobile-browse { display:none; }
        .masthead { max-width:1480px; margin:auto; padding:16px 32px; display:flex; align-items:center; gap:24px; border-bottom:1px solid #e2e8f0; }
        .brand { font-size:46px; font-weight:800; letter-spacing:-6px; text-decoration:none; line-height:1.2; }
        .brand span:first-child { color:var(--accent); }
        .brand-dot { color:#2563eb; letter-spacing:0; }
        .mast-label { font-size:.875rem; letter-spacing:.06em; }
        .catalog-link { margin-left:auto; font-size:1rem; text-underline-offset:4px; }
        .shell { display:grid; grid-template-columns:280px minmax(0,1fr); max-width:1480px; margin:auto; padding:0 32px; }
        aside { position:sticky; top:0; height:calc(100vh - 88px); height:calc(100dvh - 88px); overflow:hidden; padding:28px 24px 24px 0; display:flex; flex-direction:column; align-self:start; border-right:1px solid #e2e8f0; }
        .eyebrow { font-size:.875rem; font-weight:700; letter-spacing:.04em; color:var(--muted); margin:0 0 20px; }
        .categories legend { font-size:1rem; font-weight:600; color:var(--muted); }
        .modifier-search-field { position:relative; }
        .modifier-search-field svg { position:absolute; left:14px; top:50%; transform:translateY(-50%); width:18px; height:18px; fill:none; stroke:#64748b; stroke-width:1.75; stroke-linecap:round; pointer-events:none; }
        .modifier-search { width:100%; height:48px; padding:10px 14px 10px 42px; border:1px solid #94a3b8; border-radius:6px; background:#ffffff; color:#0f172a; font-size:1rem; }
        .category-filters { position:relative; margin-top:12px; }
        .category-filters summary { display:flex; align-items:center; justify-content:space-between; gap:8px; min-height:48px; padding:10px 14px; border:1px solid #94a3b8; border-radius:6px; background:white; font-size:1rem; cursor:pointer; list-style:none; }
        .category-filters summary::-webkit-details-marker { display:none; }
        .category-filters summary svg { width:16px; height:16px; flex-shrink:0; fill:none; stroke:#64748b; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; }
        .category-filters summary:focus-visible { outline:3px solid #2563eb; outline-offset:3px; }
        .category-menu { position:absolute; top:calc(100% + 6px); left:0; right:0; z-index:5; padding:12px; border:1px solid #cbd5e1; border-radius:6px; background:white; box-shadow:0 8px 24px #0f172a26; }
        .category-options { max-height:240px; overflow-y:auto; overscroll-behavior:contain; }
        .category-actions { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:10px; padding-top:10px; border-top:1px solid #e2e8f0; }
        .category-actions button { min-height:36px; border:0; border-radius:4px; padding:6px 8px; background:#eff6ff; color:#1d4ed8; font-size:.875rem; }
        .categories { border:0; padding:0; margin:0; }
        .visually-hidden { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
        .categories legend { padding:0; }
        .category-hint { margin:6px 0 10px; font-size:.875rem; color:var(--muted); line-height:1.5; }
        .category-options { display:grid; gap:2px; }
        .category-options label { display:flex; align-items:center; gap:10px; min-height:36px; font-size:1rem; cursor:pointer; }
        .category-options input { width:20px; height:20px; margin:0; accent-color:var(--accent); }
        .filter-status { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .clear-filters { align-self:flex-start; min-height:44px; padding:8px 0; border:0; background:none; color:var(--accent); font-size:1rem; text-decoration:underline; text-underline-offset:3px; }
        .modifier-heading { display:flex; align-items:baseline; gap:8px; margin-bottom:16px; }
        .modifier-heading .eyebrow { margin:0; }
        .match-count { font-size:.875rem; color:var(--muted); white-space:nowrap; }
        nav { display:grid; gap:6px; min-height:100px; overflow-y:auto; overscroll-behavior:contain; }
        nav a { display:flex; align-items:center; min-height:60px; padding:10px 12px; border:1px solid transparent; border-radius:4px; text-decoration:none; }
        nav a:hover { background:#f1f5f9; }
        nav a[aria-current=page] { background:#eff6ff; border-color:#93c5fd; color:#1d4ed8; box-shadow:inset 3px 0 #2563eb; }
        nav strong { font:600 .9375rem/1.5 monospace; overflow-wrap:anywhere; }
        .category-icon { width:20px; height:20px; flex-shrink:0; fill:none; stroke:currentColor; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
        .modifier-list a { min-height:44px; gap:10px; padding:8px; }
        .modifier-list .category-icon { color:var(--muted); }
        .modifier-list a[aria-current=page] .category-icon { color:var(--accent); }
        .site-nav { flex-shrink:0; min-height:0; overflow:visible; margin-bottom:24px; padding-bottom:20px; border-bottom:1px solid #cbd5e1; gap:4px; }
        .site-nav a { min-height:44px; font-size:1rem; font-weight:600; padding:8px 10px; }
        .modifier-navigation { flex:1 1 auto; display:flex; flex-direction:column; min-height:0; }
        .modifier-navigation > .modifier-tools { flex:0 1 auto; min-height:0; overflow:visible; margin-bottom:12px; }
        .modifier-list { align-content:start; flex:1 1 0; min-height:120px; overflow-y:auto; overflow-x:hidden; scrollbar-gutter:stable; overscroll-behavior:contain; }
        .site-page { max-width:75ch; }
        .site-page h1 { font-family:Arial,Helvetica,sans-serif; font-size:clamp(30px,3vw,42px); font-weight:650; }
        .site-page h2 { margin-top:32px; font-size:1.5rem; }
        .site-page p,.site-page li,.site-page dd { font-size:1.125rem; line-height:1.75; }
        .site-page a { color:var(--accent); text-underline-offset:3px; }
        .category-index { display:flex; flex-wrap:wrap; gap:12px 24px; min-height:0; overflow:visible; margin:24px 0; }
        .category-index a { display:inline-flex; align-items:center; gap:8px; }
        .category-overview-section { padding-top:12px; margin-top:32px; border-top:1px solid #dfe3ee; }
        .category-overview-section h2 { display:flex; align-items:center; gap:12px; scroll-margin-top:24px; }
        .category-modifiers { margin:24px 0; }
        .category-modifiers > div { display:grid; grid-template-columns:minmax(0, 13rem) minmax(0, 1fr); gap:12px 24px; padding:14px 0; border-top:1px solid #dfe3ee; }
        .category-modifiers dt { font-size:1rem; line-height:1.75; overflow-wrap:anywhere; }
        .category-modifiers dd { margin:0; }
        @media (max-width:700px) { .category-modifiers > div { grid-template-columns:minmax(0, 1fr); gap:4px; } }
        .site-page .code { margin:20px 0; }
        .concepts dt { margin-top:20px; font:600 1.125rem monospace; }
        .concepts dd { margin:8px 0 0; }
        .empty-search { font-size:1rem; }
        main { min-width:0; padding:32px 0 32px 40px; }
        .modifier-title-row { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin:24px 0 16px; }
        .modifier-title-row h1 { margin:0; min-width:0; }
        .page-category { position:relative; flex-shrink:0; }
        .page-category-icon { display:grid; place-items:center; width:44px; height:44px; padding:0; border:0; border-radius:6px; background:transparent; color:var(--muted); cursor:help; }
        .page-category-icon .category-icon { width:24px; height:24px; }
        .page-category-icon:hover,.page-category-icon:focus-visible { background:#f1f5f9; color:var(--accent); }
        #category-tooltip { position:absolute; top:calc(100% + 4px); right:0; z-index:10; width:280px; max-width:calc(100vw - 32px); padding:12px 16px; border-radius:5px; background:#0f172a; color:#f8fafc; font-size:.875rem; box-shadow:0 4px 12px #0f172a26; }
        #category-tooltip strong { display:block; margin-bottom:6px; }
        #category-tooltip > span { display:block; line-height:1.6; }
        h1 { margin:24px 0 16px; font:500 clamp(28px,3.2vw,44px)/1.3 monospace; letter-spacing:-1px; overflow-wrap:anywhere; scroll-margin-top:24px; }
        h1 span { color:#64748b; font-size:.75em; }
        h2 { margin:0 0 16px; font-size:1.75rem; line-height:1.35; font-weight:600; }
        .modifier-title { margin:0 0 16px; font-size:1.75rem; line-height:1.35; font-weight:600; }
        .modifier-signature { margin:0 0 24px; font:400 1rem/1.65 monospace; color:var(--muted); overflow-wrap:anywhere; }
        .modifier-signature code { font:inherit; white-space:pre-wrap; }
        .description { max-width:70ch; margin:0 0 28px; font-size:1.125rem; line-height:1.7; color:var(--muted); }
        .playground { border:1px solid var(--example-border); border-radius:var(--example-radius); background:#ffffff; overflow:hidden; }
        .playground[data-modifier="multipleValues"] { overflow:visible; }
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
        .markup-note { font-size:1rem; line-height:1.65; margin:0 0 16px; max-width:70ch; }
        .code-section .code { padding-left:0; padding-right:0; }
        .source-intro { margin:0; max-width:70ch; font-size:1rem; }
        .code-section,.explanation { min-width:0; }
        .code-section,.markup-section,.css-section { min-width:0; padding:20px; border:1px solid var(--example-border); border-radius:var(--example-radius); background:white; }
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
        .page-count { text-align:center; font-size:.875rem; }
        .page-count small { display:block; color:var(--muted); }
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
            .mobile-browse { display:flex; align-items:center; gap:12px; width:100%; min-height:48px; margin-top:16px; padding:10px 12px; border:1px solid #94a3b8; border-radius:6px; background:white; text-align:left; font-size:1rem; }
            .mobile-browse small { margin-left:auto; color:var(--muted); }
            aside { display:none; position:static; height:auto; max-height:none; overflow:visible; padding:24px 0; border-right:0; border-bottom:1px solid #e2e8f0; }
            .navigation-open aside { display:flex; }
            .category-options { grid-template-columns:1fr; gap:4px; }
            .category-options label { min-height:44px; }
            .modifier-list { flex:none; max-height:320px; min-height:0; }
            .modifier-navigation > .modifier-tools { flex:none; overflow:visible; }
            .site-nav { max-height:none; }
            main { padding:28px 0; }
            h1 { font-size:clamp(24px,5.5vw,36px); }
            h1 span { display:block; margin-top:8px; }
            h2,.modifier-title { font-size:1.5rem; }
            .modifier-signature { font-size:.9375rem; }
            .code { padding:16px; }
            .page-count { text-align:center; font-size:.875rem; }
        .page-count small { display:block; color:var(--muted); }
        .pager small { display:none; }
        }
        ${exampleTheme}
    `;
}
customElements.define('fdl-modifier-explorer', FdlModifierExplorer);
