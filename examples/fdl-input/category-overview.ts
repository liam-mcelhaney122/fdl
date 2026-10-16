import { html } from 'lit';
import { categoryIcon, categoryDescriptions } from './category-icon';
import type { ExplorerRecipe } from './modifier-explorer-recipes';

const modifier = (name: string) =>
    html`<a href=${`#${name}`}><code>.${name}()</code></a>`;
export const categoryId = (name: string) =>
    `category-${name.toLowerCase().replace(/\s+/g, '-')}`;

const relationships = {
    Values: html`<p
            >${modifier('defaultValue')} supplies a starting or reset value;
            ${modifier('parser')} transforms incoming input into the value
            stored in the record. ${modifier('hashFunction')} identifies object
            values by a stable key, while ${modifier('reducer')} combines values
            across records.</p
        ><p
            >For a money field, use a parser to turn entered text into a number,
            a reducer to total numbers, and ${modifier('formatter')} from
            Display to show currency.</p
        >`,
    Input: html`<p
            >${modifier('label')} identifies a field and
            ${modifier('placeholder')} offers a temporary hint.
            ${modifier('type')} selects a native input mode, while
            ${modifier('rowCount')} is deprecated because textarea sizing
            belongs in <code>fdl-field</code>. ${modifier('options')} supplies
            choices; ${modifier('multipleValues')} allows several choices to be
            stored.</p
        ><p
            >${modifier('inputMask')} filters individual input characters. Pair
            it with ${modifier('parser')} to convert accepted input and
            ${modifier('validator')} to check the complete stored value. A
            character mask alone cannot decide whether a value is valid.</p
        >`,
    Validation: html`<p
            >${modifier('emptyWhen')} defines what counts as empty.
            ${modifier('required')} requires a non-empty value, either always or
            when its optional field setting resolves to true.
            ${modifier('minLength')} and ${modifier('maxLength')} constrain
            length, and ${modifier('validator')} adds application-specific
            checks.</p
        ><p
            >For a reference field, declare that “N/A” counts as empty, require
            a value when a reference is needed, and add a validator for its
            format. Requiredness and format are separate rules; all applicable
            validators must pass.</p
        >`,
    'Conditional state': html`<p
            >${modifier('disabled')} disables a field always or according to its
            optional field setting. ${modifier('readOnly')} accepts a fixed or
            calculated read-only state. ${modifier('visible')} determines
            whether a consumer shows the field.</p
        ><p
            >A submitted request can remain visible and read-only; an
            unavailable action can be disabled. For a shipping-only address,
            combine visibility with ${modifier('required')} from Validation.
            Hiding a field preserves its value and does not make it optional.</p
        >`,
    Display: html`<p
            >${modifier('formatter')} transforms a stored value into a display
            value. ${modifier('template')} receives that formatted value and the
            record, then produces the final printed content, including
            conditional labels or rich markup.</p
        ><p
            >For an invoice balance, a formatter produces “$42.50”; a template
            chooses between that amount with “Payment due” and a “Paid in full”
            badge. The stored balance remains a number. ${modifier('parser')}
            handles conversion in the other direction when input is edited.</p
        >`,
    Tables: html`<p
            >${modifier('compareFunction')} defines value ordering, and
            ${modifier('sortable')} controls whether a heading offers a sort
            action. ${modifier('filter')} defines how search text matches field
            values. These affect the view of a recordset while preserving its
            source records.</p
        ><p
            >${modifier('columnClass')} shares classes across a column, its
            heading, and its cells. ${modifier('cellClass')} adds value-specific
            cell classes, and ${modifier('rowClass')} adds classes to the entire
            row. Both accept a string, an array, or a function returning either;
            repeated calls accumulate. CSS gives those classes their
            appearance.</p
        ><p
            >${modifier('textAlign')} aligns headings and cells.
            ${modifier('minColumnWidth')} and ${modifier('maxColumnWidth')}
            bound resizing, while ${modifier('targetColumnWidth')} supplies a
            preferred starting width. For T-shirt orders, a comparator supplies
            size order; for expenses, conditional cell classes call attention to
            amounts above a limit.</p
        >`,
    'Adapter contracts': html`<p
            >${modifier('range')} declares range metadata and
            ${modifier('search')} describes a search-capable selection
            interface. Both need a compatible adapter to supply the interaction;
            the site's native example adapter does not implement these
            contracts.</p
        ><p
            >These declarations do not themselves provide range validation or a
            search service. Use ${modifier('validator')} for model-enforced
            constraints, and ${modifier('options')} for the available choices.
            See each modifier page for its integration limits.</p
        >`,
};

export function renderCategoryOverview(recipes: readonly ExplorerRecipe[]) {
    const categories = [
        'Values',
        'Input',
        'Validation',
        'Conditional state',
        'Display',
        'Tables',
        'Adapter contracts',
    ] as const;
    return html`<article class="site-page category-overview">
        <h1 tabindex="-1">Modifier categories</h1>
        <p class="description"
            >Find the kind of rule you need, see how its modifiers work
            together, then open an example to try it.</p
        >
        <p
            >Categories describe a modifier's main purpose. A field can combine
            modifiers from several categories: input becomes a stored value,
            validation checks it, and consumers interpret its state and
            presentation.</p
        >
        <nav class="category-index" aria-label="Categories on this page"
            >${categories.map(category => html`<a href=${`#categories?category=${categoryId(category)}`}>${categoryIcon(category)}<span>${category}</span></a>`)}</nav
        >
        ${categories.map(
            category =>
                html`<section
                    class="category-overview-section"
                    aria-labelledby=${categoryId(category)}
                >
                    <h2 id=${categoryId(category)} tabindex="-1"
                        >${categoryIcon(category)}${category}</h2
                    >
                    <p>${categoryDescriptions[category]}</p>
                    <div class="category-relationships"
                        >${relationships[category]}</div
                    >
                    <dl class="category-modifiers"
                        >${recipes
                            .filter(recipe => recipe.category === category)
                            .map(
                                recipe =>
                                    html`<div data-modifier=${recipe.name}>
                                        <dt>${modifier(recipe.name)}</dt
                                        ><dd>${recipe.description}</dd>
                                    </div>`
                            )}</dl
                    >
                </section>`
        )}
    </article>`;
}
