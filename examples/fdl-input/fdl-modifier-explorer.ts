import { LitElement, css, html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import FieldType from '../../field-type.js';
import Record from '../../record.js';
import './fdl-field';
import './fdl-modifier-catalog';
import { additionalRecipes, type ExplorerRecipe } from './modifier-explorer-recipes';

export const explorerRecipes: ExplorerRecipe[] = [
    {
        name: 'required', signature: '()', category: 'Validation', title: 'Make the essential, essential.',
        description: 'Declare that a field needs a value. FDL carries that rule from the record to the control, so validation and the interface agree.',
        prompt: 'Leave the name empty and check the record. Then enter a name and check again.',
        code: `const fields = {\n  name: new FieldType().with\n    .label('Legal name')\n    .and.required(),\n};\n\nconst person = new Record(fields, { name: '' });\nperson.isValid(); // false until a name is entered`,
        steps: ['Declare the rule once with .required().', 'The component exposes the required state on the input.', 'Record.isValid() checks the same rule without a browser.'],
        note: 'Required means non-empty according to the field’s emptiness rules. It does not validate a name’s spelling or format. Use a validator for an additional business rule.',
        use: 'Names, reference numbers, and other values a record always needs.',
    },
    {
        name: 'formatter', signature: '(fn)', category: 'Display', title: 'Keep the value. Change the view.',
        description: 'Turn a stored value into something people can read. A number stays a number in the record, while the display adds currency and precision.',
        prompt: 'Change the amount. Compare the raw number in the model with its formatted output.',
        code: `const currency = new Intl.NumberFormat('en-US', {\n  style: 'currency', currency: 'USD',\n});\n\nconst amount = new FieldType().with\n  .label('Amount')\n  .and.type('number')\n  .and.parser(value => Number(value))\n  .and.formatter((value, _record, context) =>\n    context === 'input-focus'\n      ? String(value)\n      : currency.format(value)\n  );`,
        steps: ['Store a number in the record.', 'The formatter transforms it when a consumer requests a display value.', 'Calculations can continue to use the original number.'],
        note: 'Formatting is one-way. This formatter leaves the input-focus value numeric for the number control and formats the printed output. The separate parser converts edited text back into a number.',
        use: 'Currency, dates, percentages, and other human-readable representations.',
    },
    {
        name: 'visibleWhen', signature: '(predicate)', category: 'Conditional state', title: 'Show up when it matters.',
        description: 'Describe when a field belongs in the interface. The record supplies the context; the component follows the resulting visibility state.',
        prompt: 'Switch between shipping and pickup. The address disappears for pickup; its stored value is preserved.',
        code: `const address = new FieldType().with\n  .label('Shipping address')\n  .and.visibleWhen(record =>\n    record.getField('fulfillment') === 'ship'\n  );\n\n// The same record also contains fulfillment.\n// Switching to pickup hides the address control.`,
        steps: ['Read the related value from the record.', 'FDL evaluates the predicate as record values change.', 'The component includes the address only when the predicate passes.'],
        note: 'Visibility does not erase a value or make it optional. If a field should be required only while visible, declare the matching requiredWhen rule separately.',
        use: 'Shipping details, payment-specific fields, and branching forms.',
    },
    ...additionalRecipes,
];

const recipes = explorerRecipes;

export class FdlModifierExplorer extends LitElement {
    private selected = 0;
    private checked = false;
    private query = '';
    private resetVersion = 0;
    private person = new Record({ name: new FieldType<string>().with.label('Legal name').and.required() }, { name: '' });
    private money = new Record({ amount: new FieldType<number>().with.label('Amount').and.type('number').and.parser(value => Number(value)).and.formatter((value, _record?: unknown, context?: string) => context === 'input-focus' ? String(value) : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value))) }, { amount: 1250 });
    private delivery = new Record({
        fulfillment: new FieldType<string>().with.label('Delivery method').and.tag('select').and.options([{ text: 'Ship to address', value: 'ship' }, { text: 'Pick up in person', value: 'pickup' }]),
        address: new FieldType<string>().with.label('Shipping address').and.visibleWhen(record => record.getField('fulfillment') === 'ship'),
    }, { fulfillment: 'ship', address: '42 Orchard Street' });
    private refresh = () => this.requestUpdate();
    private readLocation = () => {
        const index = recipes.findIndex(recipe => `#${recipe.name}` === window.location.hash);
        this.select(index < 0 ? 0 : index, false);
    };

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
        this.selected = index;
        this.requestUpdate();
        this.updateComplete.then(() => this.shadowRoot?.querySelector<HTMLElement>('nav [aria-current="page"]')?.scrollIntoView?.({ block: 'nearest' }));
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
        return html`<fdl-field .record=${record} field=${field} .showValidationErrors=${this.checked}></fdl-field>`;
    }
    private reset() {
        this.resetVersion += 1;
        if (this.selected === 0) { this.checked = false; this.person.setField('name', ''); }
        if (this.selected === 1) this.money.setField('amount', 1250);
        if (this.selected === 2) { this.delivery.setField('fulfillment', 'ship'); this.delivery.setField('address', '42 Orchard Street'); }
        this.requestUpdate();
    }
    private demo() {
        if (this.selected === 0) return html`
            ${this.field(this.person, 'name')}
            <button class="primary" @click=${() => { this.checked = true; this.requestUpdate(); }}>Check record <span aria-hidden="true">↗</span></button>
            <p class="result" role="status">${this.checked ? (this.person.isValid() ? '✓ The record is valid.' : 'Legal name is required. Add a value to continue.') : 'Ready to validate. Try an empty value first.'}</p>`;
        if (this.selected === 1) return html`
            ${this.field(this.money, 'amount')}
            <div class="formatted"><span>Formatted output</span><strong>${this.money.getFormattedField('amount', 'print')}</strong></div>
            <p class="result">The formatter leaves the stored number unchanged.</p>`;
        if (this.selected > 2) return html`<fdl-modifier-catalog modifier=${recipes[this.selected].name}></fdl-modifier-catalog>`;
        return html`${this.field(this.delivery, 'fulfillment')}${this.field(this.delivery, 'address')}<p class="result" role="status">${this.delivery.getField('fulfillment') === 'ship' ? 'Shipping address is visible.' : 'Pickup selected. Shipping address is hidden.'}</p>`;
    }
    render() {
        const recipe = recipes[this.selected];
        const filtered = recipes.map((entry, index) => ({ entry, index })).filter(({ entry }) => `${entry.name} ${entry.category}`.toLowerCase().includes(this.query.toLowerCase().trim()));
        const number = (index: number) => String(index + 1).padStart(2, '0');
        const model = this.selected === 0 ? this.person : this.selected === 1 ? this.money : this.delivery;
        return html`
        <header class="masthead"><a class="brand" href="../" aria-label="FDL home">f<span>d</span>l<span class="brand-dot">.</span></a><span class="mast-label">FIELD DEFINITION LANGUAGE</span><a href="../cookbook/" class="catalog-link">Full cookbook ↗</a></header>
        <div class="shell">
            <aside><p class="eyebrow">THE MODIFIER EXPLORER</p><p class="sidebar-title">Small rules.<br>Expressive forms.</p><p class="sidebar-intro">One modifier at a time.<br>See the behavior. Read the rule.</p>
            <label class="search-label" for="modifier-search">Find a modifier</label>
            <input id="modifier-search" class="modifier-search" type="search" placeholder="Name or category…" .value=${this.query} @input=${(event: Event) => { this.query = (event.target as HTMLInputElement).value; this.requestUpdate(); }}>
            <label class="jump-label" for="modifier-jump">Jump to a modifier</label>
            <select id="modifier-jump" class="modifier-jump" @change=${(event: Event) => this.select(recipes.findIndex(entry => entry.name === (event.target as HTMLSelectElement).value))}>
                ${recipes.map(entry => html`<option value=${entry.name} .selected=${entry.name === recipe.name}>${entry.name} — ${entry.category}</option>`)}
            </select>
            <p class="match-count" role="status">${filtered.length} of ${recipes.length} modifiers</p>
            <nav aria-label="Jump to a modifier">${filtered.map(({entry, index}) => html`<a href=${`#${entry.name}`} aria-current=${this.selected === index ? 'page' : 'false'} @click=${(event: Event) => { event.preventDefault(); this.select(index); }}><span class="nav-number">${number(index)}</span><span><strong>${entry.name}</strong><small>${entry.category}</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a>`)}</nav>
            ${filtered.length === 0 ? html`<p class="empty-search">No modifiers match. Try another name or category.</p>` : ''}
            <div class="sidebar-note"><span class="sample-dot"></span> ${recipes.length} MODIFIERS<p>Three starting examples, followed by the rest of the cookbook alphabetically.</p></div></aside>
            <main>
                <div class="chapter"><span>${recipe.category}</span><span>MODIFIER ${number(this.selected)} / ${recipes.length}</span></div>
                <h1 tabindex="-1">.${recipe.name}<span>${recipe.signature}</span></h1>
                <h2>${recipe.title}</h2><p class="description">${recipe.description}</p>
                <section class="playground" aria-label="Interactive example">
                    <div class="section-bar"><span><i></i> ${recipe.limitation ? 'ADAPTER CONTRACT' : ['hashFunction', 'inputMask', 'exampleValue', 'reducer'].includes(recipe.name) ? 'MODEL EXERCISE' : 'LIVE EXAMPLE'}</span>${recipe.limitation ? html`` : html`<button class="reset" @click=${this.reset}>Reset example ↺</button>`}</div>
                    <p class="instruction">${recipe.prompt}</p>
                    <div class=${this.selected > 2 ? "demo-grid catalog-demo" : "demo-grid"}><div class="controls">${keyed(`${recipe.name}-${this.resetVersion}`, this.demo())}</div>${this.selected < 3 ? html`<div class="model"><p class="eyebrow">IN THE RECORD</p><pre aria-live="polite">${JSON.stringify(model.values, null, 2)}</pre><div class="model-foot">Actual FDL model state</div></div>` : ''}</div>
                </section>
                <div class="details"><section class="code-section"><div class="detail-heading"><h3>The definition</h3><span>JavaScript</span></div><pre class="code"><code>${recipe.code}</code></pre></section><section class="explanation"><h3>What happens</h3><ol>${recipe.steps.map(step => html`<li>${step}</li>`)}</ol><p class="use"><strong>Good for</strong>${recipe.use}</p></section></div>
                <section class="note"><span aria-hidden="true">↳</span><div><h3>A detail worth knowing</h3><p>${recipe.note}</p></div></section>
                <footer><button class="pager" ?disabled=${this.selected === 0} @click=${() => this.select(this.selected - 1)}>← Back${this.selected > 0 ? html`<small>.${recipes[this.selected - 1].name}${recipes[this.selected - 1].signature}</small>` : ''}</button><span class="page-count">${this.selected + 1} of ${recipes.length}</span><button class="pager next" ?disabled=${this.selected === recipes.length - 1} @click=${() => this.select(this.selected + 1)}>Next →${this.selected < recipes.length - 1 ? html`<small>.${recipes[this.selected + 1].name}${recipes[this.selected + 1].signature}</small>` : ''}</button></footer>
            </main>
        </div>`;
    }
    static styles = css`
        .code-section, .explanation { min-width: 0; }
        .catalog-demo { display: block !important; }
        aside { position: sticky; top: 0; max-height: 100vh; display: flex; flex-direction: column; align-self: start; }
        nav { overflow-y: auto; min-height: 120px; overscroll-behavior: contain; }
        .search-label, .jump-label { font-size: 11px; color: #626b63; margin-bottom: 8px; }
        .modifier-search, .modifier-jump { width: 100%; padding: 11px; border: 1px solid #cbd6c7; border-radius: 4px; background: #fffefa; color: #252c28; font: 12px Arial, sans-serif; }
        .modifier-search:focus-visible, .modifier-jump:focus-visible { outline: 3px solid #ad6438; outline-offset: 2px; }
        .jump-label { margin-top: 14px; }
        .match-count { font: 10px monospace; color: #626b63; }
        .empty-search { font-size: 12px; line-height: 1.8; }
        h1 { scroll-margin-top: 24px; }
        .sidebar-note { margin-top: 18px !important; }

        :host{display:block;background:#f5f3ed;color:#252c28;font-family:Arial,Helvetica,sans-serif;min-height:100vh;font-size:15px;--green:#285a46;--muted:#626b63}*{box-sizing:border-box}a{color:inherit}button,select{font:inherit}button,a{-webkit-tap-highlight-color:transparent}button{cursor:pointer}button:disabled{cursor:default;opacity:.35}a:focus-visible,button:focus-visible{outline:3px solid #ad6438;outline-offset:5px}h1:focus{outline:none}.masthead{height:92px;max-width:1440px;margin:auto;padding:0 54px;display:flex;align-items:center;border-bottom:1px solid #d8dcd3;gap:22px}.brand{text-decoration:none;font-size:46px;font-weight:800;letter-spacing:-6px}.brand span:first-child{color:var(--green)}.brand-dot{color:#b86c43;letter-spacing:0}.mast-label{font-size:10px;letter-spacing:1.8px;color:var(--muted);margin-left:10px}.catalog-link{margin-left:auto;font-size:12px;text-underline-offset:5px}.shell{display:grid;grid-template-columns:265px minmax(0,1fr);max-width:1440px;margin:auto;padding:0 54px}aside{padding:46px 28px 40px 0;border-right:1px solid #d8dcd3}.eyebrow{font-family:monospace;font-size:10px;letter-spacing:1.2px;font-weight:600;color:var(--muted);margin:0 0 22px}.sidebar-title{font-family:Georgia,serif;font-size:29px;line-height:1.15;margin:0 0 18px;letter-spacing:-.6px}.sidebar-intro{font-size:12px;line-height:1.8;color:var(--muted);margin-bottom:35px}nav{display:grid;gap:8px}nav a{display:flex;align-items:center;text-decoration:none;gap:14px;padding:15px 12px;border:1px solid transparent;border-radius:4px}nav a[aria-current=page]{background:#e3e9de;border-color:#ced9c8;color:#234e39}.nav-number{font-family:monospace;font-size:11px;color:#667a67}nav strong{font-family:monospace;font-size:13px}nav small{display:block;margin-top:6px;font-size:10px;color:var(--muted)}.nav-arrow{margin-left:auto}.sidebar-note{margin-top:64px;font-family:monospace;font-size:9px;letter-spacing:.7px;color:var(--muted);border-top:1px solid #d8dcd3;padding-top:22px}.sample-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#b86c43;margin-right:5px}.sidebar-note p{font-family:Arial,sans-serif;font-size:12px;letter-spacing:0;line-height:1.7;max-width:190px}main{min-width:0;padding:43px 0 24px 48px}.chapter{display:flex;justify-content:space-between;align-items:center;font-family:monospace;font-size:10px;letter-spacing:1px;color:var(--muted)}.chapter span:first-child{color:var(--green);border:1px solid #cbd6c7;padding:6px 9px;border-radius:3px;letter-spacing:.3px}h1{font-family:monospace;font-size:clamp(27px,3.5vw,48px);font-weight:500;letter-spacing:-2px;margin:26px 0 16px;overflow-wrap:anywhere}h1 span{color:#7d897c;font-size:.68em;letter-spacing:-1px}h2{font-family:Georgia,serif;font-size:30px;font-weight:400;letter-spacing:-.6px;margin:0 0 13px}.description{max-width:680px;color:var(--muted);font-size:14px;line-height:1.85;margin:0 0 30px}.playground{border:1px solid #d1d8ca;background:#fffefa;border-radius:6px;overflow:hidden}.section-bar{padding:13px 20px;border-bottom:1px solid #e1e4db;display:flex;justify-content:space-between;align-items:center;font-family:monospace;font-size:10px;letter-spacing:1px}.section-bar i{display:inline-block;width:6px;height:6px;background:#50865c;border-radius:50%;margin-right:7px}.reset{background:none;border:0;color:var(--muted);font-size:11px;padding:5px}.instruction{font-size:12px;line-height:1.7;color:var(--muted);margin:20px 22px 14px}.demo-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:25px;padding:0 22px 23px}.controls{min-width:0}fdl-field{display:block;font-size:13px;--field-label-width:100%;--field-control-width:100%}fdl-field::part(label){font-size:12px}.primary{background:var(--green);border:1px solid var(--green);color:white;border-radius:4px;padding:11px 16px;font-size:12px;margin-top:14px;display:flex;gap:28px}.result{font-size:11px;line-height:1.6;color:var(--muted);min-height:32px;margin-bottom:0}.model{background:#edf0e8;border:1px solid #e0e5d9;border-radius:4px;padding:20px;align-self:start;min-width:0}.model .eyebrow{font-size:9px;margin-bottom:20px}.model pre{font-size:12px;line-height:1.9;white-space:pre-wrap;overflow-wrap:anywhere;margin:0;min-height:65px}.model-foot{font-size:10px;color:var(--muted);border-top:1px solid #d7ded0;margin-top:17px;padding-top:11px}.details{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:30px;margin:30px 0 25px}.detail-heading{display:flex;justify-content:space-between;align-items:center}.detail-heading span{font-family:monospace;font-size:9px;color:var(--muted)}h3{font-size:13px;font-weight:600;margin:0 0 16px}.code{background:#222f29;color:#e1e9d9;border-radius:5px;padding:22px;font-size:11px;line-height:1.9;overflow:auto;margin:0}.explanation ol{list-style:none;counter-reset:steps;padding:0;margin:0}.explanation li{counter-increment:steps;display:flex;font-size:12px;line-height:1.7;color:var(--muted);gap:10px;margin-bottom:15px}.explanation li:before{content:counter(steps,decimal-leading-zero);font-family:monospace;font-size:10px;color:var(--green);padding-top:2px}.use{font-size:11px;color:var(--muted);line-height:1.7;border-top:1px solid #d8dcd3;padding-top:15px}.use strong{display:block;color:#303c31;margin-bottom:4px}.note{display:flex;gap:14px;border-top:1px solid #d8dcd3;border-bottom:1px solid #d8dcd3;padding:20px 0}.note>span{color:#a26640;font-size:23px}.note h3{margin-bottom:7px}.note p{font-size:12px;line-height:1.75;color:var(--muted);margin:0}footer{display:flex;justify-content:space-between;align-items:center;margin-top:22px}.pager{background:none;border:0;text-align:left;font-size:12px;color:var(--green);padding:6px 0;min-width:100px}.pager small{display:block;font-family:monospace;font-size:10px;color:var(--muted);margin-top:7px}.next{text-align:right}.page-count{font-family:monospace;font-size:10px;color:var(--muted)}.formatted{display:grid;gap:10px;padding:12px 0}.formatted span{font-size:11px;color:var(--muted)}.formatted strong{font-family:Georgia,serif;font-size:30px;font-weight:400}
        @media(min-width:1600px){main{padding-right:35px}.shell{grid-template-columns:290px minmax(0,1fr)}}
        @media(max-width:1000px){.masthead{padding:0 25px}.shell{padding:0 25px;grid-template-columns:210px minmax(0,1fr)}aside{padding-right:20px}main{padding-left:28px}.details{grid-template-columns:minmax(0,1fr)}.demo-grid{grid-template-columns:1fr}.sidebar-title{font-size:25px}}
        @media(max-width:650px){.masthead{height:72px;padding:0 20px}.mast-label{display:none}.brand{font-size:38px}.shell{display:block;padding:0 20px}aside{padding:24px 0 18px;border-right:0;border-bottom:1px solid #d8dcd3}.sidebar-title,.sidebar-intro,.sidebar-note{display:none}aside .eyebrow{margin-bottom:12px}nav{display:none}.modifier-search,.search-label,.match-count,.empty-search{display:none}.jump-label{margin-top:0}aside{position:static;max-height:none}nav a{padding:10px 8px;gap:6px;flex:1;justify-content:center}nav strong{font-size:10px}nav small,.nav-arrow,.nav-number{display:none}main{padding:25px 0}h1{font-size:clamp(18px,6vw,30px);letter-spacing:-1px}h1 span{display:block;font-size:.7em;letter-spacing:0;margin-top:10px}h2{font-size:26px}.chapter{font-size:9px}.demo-grid{gap:18px}.details{gap:22px}.code{font-size:10px;padding:16px}.description{font-size:13px}}
    `;
}
customElements.define('fdl-modifier-explorer', FdlModifierExplorer);
