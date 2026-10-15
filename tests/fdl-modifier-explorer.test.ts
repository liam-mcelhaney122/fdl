import { inputTypes } from '../types/input-types.types';
import { modifierPage, modifierPageGroups } from '../examples/fdl-input/modifier-page-groups';
import { relatedModifierNames } from '../examples/fdl-input/related-modifiers';
import { categoryDescriptions } from '../examples/fdl-input/category-icon';
import { displayedModifierSignatures as modifierSignatures } from '../examples/fdl-input/modifier-signatures';
import FieldType from '../field-type.js';
import { exampleSource } from '../examples/fdl-input/modifier-example-source';
import '../examples/fdl-input/fdl-modifier-explorer';
import { explorerRecipes } from '../examples/fdl-input/fdl-modifier-explorer';
import { modifierEntries, FdlModifierCatalog } from '../examples/fdl-input/fdl-modifier-catalog';
import type { FdlModifierExplorer } from '../examples/fdl-input/fdl-modifier-explorer';

beforeAll(() => { HTMLElement.prototype.scrollIntoView = jest.fn(); });

const settle = async (page: FdlModifierExplorer) => {
    await page.updateComplete;
    await Promise.all([...page.shadowRoot!.querySelectorAll('fdl-field')].map(field => (field as any).updateComplete));
};

const openPage = async (hash = '#required') => {
    window.location.hash = hash;
    const page = document.createElement('fdl-modifier-explorer') as FdlModifierExplorer;
    document.body.append(page);
    await settle(page);
    return page;
};

afterEach(() => { document.body.replaceChildren(); window.location.hash = ''; });

describe('modifier explorer', () => {
    it('shows one modifier, supports next/back and direct links, and disables boundary controls', async () => {
        const page = await openPage('#cellClass');
        const root = page.shadowRoot!;
        expect(root.querySelector('h1')!.textContent).toBe('.cellClass(classes)');
        expect(root.querySelector<HTMLButtonElement>('.pager')!.disabled).toBe(true);
        root.querySelector<HTMLButtonElement>('.next')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toContain('.compareFunction(compare)');
        root.querySelector<HTMLButtonElement>('.pager')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toBe('.cellClass(classes)');
        root.querySelector<HTMLAnchorElement>('a[href="#visibleWhen"]')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toContain('.visibleWhen(predicate)');
        expect(root.querySelector<HTMLButtonElement>('.next')!.disabled).toBe(true);
        expect(window.location.hash).toBe('#visibleWhen');
        window.location.hash = explorerRecipes[explorerRecipes.length - 1].name;
        window.dispatchEvent(new Event('hashchange'));
        await settle(page);
        expect(root.querySelector<HTMLButtonElement>('.next')!.disabled).toBe(true);
    });

    it('validates the actual FDL record and resets the demonstration', async () => {
        const page = await openPage();
        const root = page.shadowRoot!;
        root.querySelector<HTMLButtonElement>('.primary')!.click();
        await settle(page);
        expect(root.querySelector('.result')!.textContent).toContain('Legal name is required');
        const field = root.querySelector('fdl-field')!;
        const input = field.shadowRoot!.querySelector('input')!;
        input.value = 'Ada Lovelace';
        input.dispatchEvent(new Event('input'));
        await settle(page);
        expect(root.querySelector('.result')!.textContent).toContain('The record is valid');
        expect(root.querySelector('.model pre')!.textContent).toContain('Ada Lovelace');
        root.querySelector<HTMLButtonElement>('.reset')!.click();
        await settle(page);
        expect(root.querySelector('.model pre')!.textContent).toContain('"name": ""');
        expect(root.querySelector('.result')!.textContent).toContain('Check record shows its validation message');
    });

    it('loads a formatter deep link and preserves the raw number', async () => {
        const page = await openPage('#formatter');
        expect(page.shadowRoot!.querySelector('.formatted strong')!.textContent).toBe('$1,250.00');
        const input = page.shadowRoot!.querySelector('fdl-field')!.shadowRoot!.querySelector('input')!;
        expect(input.value).toBe('1250');
        input.value = '42';
        input.dispatchEvent(new Event('input'));
        await settle(page);
        expect(page.shadowRoot!.querySelector('.formatted strong')!.textContent).toBe('$42.00');
        expect(page.shadowRoot!.querySelector('.model pre')!.textContent).toContain('42');
    });

    it('updates conditional visibility through the record without losing the address', async () => {
        const page = await openPage('#visibleWhen');
        const root = page.shadowRoot!;
        const select = root.querySelector('fdl-field[field="fulfillment"]')!.shadowRoot!.querySelector('select')!;
        select.value = 'pickup';
        select.dispatchEvent(new Event('input'));
        select.dispatchEvent(new Event('change'));
        await settle(page);
        expect(root.querySelector('.result')!.textContent).toContain('Shipping address is hidden');
        expect(select.value).toBe('pickup');
        expect(root.querySelector('.model pre')!.textContent).toContain('"fulfillment": "pickup"');
        const address = root.querySelector('fdl-field[field="address"]')!;
        expect(address.shadowRoot!.querySelector('input')).toBeNull();
        expect(root.querySelector('.model pre')!.textContent).toContain('42 Orchard Street');
        select.value = 'ship';
        select.dispatchEvent(new Event('input'));
        select.dispatchEvent(new Event('change'));
        await settle(page);
        expect(address.shadowRoot!.querySelector('input')!.value).toBe('42 Orchard Street');
    });
});


describe('complete explorer', () => {
    it('covers the documented modifier inventory exactly once in alphabetical order', async () => {
        const page = await openPage();
        expect(explorerRecipes.map(recipe => recipe.name).sort()).toEqual(modifierEntries.map(entry => entry.name).sort());
        expect(new Set(explorerRecipes.map(recipe => recipe.name)).size).toBe(explorerRecipes.length);
        const names = [...page.shadowRoot!.querySelectorAll('.modifier-list strong')].map(link => link.textContent!);
        expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
    });

    it('covers all public builder modifiers outside the compatibility-only surface', () => {
        const builder = new FieldType().with as unknown as { [name: string]: unknown };
        const omitted = new Set([
            'accept', 'additionalProperties', 'autofocus', 'autocomplete', 'field', 'formElement',
            'filtering', 'formatOnChange', 'hideLabel', 'iconMessage', 'list', 'max', 'onValueChange',
            'description', 'hasSearch', 'inline', 'inlineWhen', 'parseDynamicRange', 'pattern',
            'readOnlyExceptionWhen', 'schema', 'segmented', 'selectionDisabledFunctions', 'step', 'tag', 'usesCustomPrint',
        ]);
        const expected = Object.getOwnPropertyNames(Object.getPrototypeOf(builder))
            .filter(name => !['constructor', 'copy'].includes(name) && !omitted.has(name))
            .filter(name => typeof builder[name] === 'function').sort();
        expect(explorerRecipes.map(recipe => recipe.name).sort()).toEqual(expected);
    });

    it.each(explorerRecipes.map(recipe => [recipe.name, recipe] as const))('opens the %s deep link with its example on the appropriate reference page', async (name, recipe) => {
        const page = await openPage(`#${name}`);
        const section = page.shadowRoot!.getElementById(name)!;
        expect(page.shadowRoot!.querySelectorAll('h1')).toHaveLength(1);
        expect(page.shadowRoot!.querySelector('#modifier-jump')).toBeNull();
        expect(page.shadowRoot!.querySelector('h1')!.textContent).toBe(modifierPage(name).title || `.${name}${recipe.signature}`);
        expect(section.querySelector('h2.modifier-signature')!.textContent).toBe(modifierSignatures[name]);
        const link = page.shadowRoot!.querySelector(`.modifier-list a[href="#${name}"]`)!;
        expect(link.querySelector('small')).toBeNull();
        expect(link.querySelector('.category-icon')!.getAttribute('data-category')).toBe(recipe.category);
        expect(link.querySelector('.category-icon path, .category-icon rect, .category-icon ellipse')!.namespaceURI).toBe('http://www.w3.org/2000/svg');
        expect(link.getAttribute('aria-label')).toBe(`${name} — ${recipe.category}`);
        link.dispatchEvent(new MouseEvent('mouseenter'));
        await settle(page);
        expect(page.shadowRoot!.querySelector('[role=tooltip]')!.textContent).toContain(modifierSignatures[name]);
        expect(page.shadowRoot!.querySelector('[role=tooltip]')!.textContent).toContain(recipe.title);
        link.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'}));
        await settle(page);
        expect(page.shadowRoot!.querySelector('[role=tooltip]')).toBeNull();
        const option = [...page.shadowRoot!.querySelectorAll('.category-options label')].find(label => label.textContent === recipe.category)!;
        expect(option.querySelector('.category-icon')!.getAttribute('data-category')).toBe(recipe.category);

        expect(section.querySelector('.code code')!.textContent).toBe(exampleSource(name).definition);
        expect(section.querySelector('.code .syntax-function, .code .syntax-builtin')).toBeTruthy();
        expect(section.querySelector('.focused-line')).toBeTruthy();
        expect(page.shadowRoot!.querySelector('.chapter')).toBeNull();
        const categoryButton = page.shadowRoot!.querySelector<HTMLButtonElement>('.page-category-icon')!;
        expect(categoryButton.getAttribute('aria-label')).toBe(`Category: ${recipe.category}`);
        expect(categoryButton.querySelector('.category-icon')!.getAttribute('data-category')).toBe(recipe.category);
        categoryButton.dispatchEvent(new FocusEvent('focus'));
        await settle(page);
        expect(page.shadowRoot!.querySelector('#category-tooltip strong')!.textContent).toBe(recipe.category);
        expect(page.shadowRoot!.querySelector('#category-tooltip > span')!.textContent).toBe(categoryDescriptions[recipe.category]);
        expect(categoryDescriptions[recipe.category].length).toBeGreaterThan(40);
        categoryButton.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'}));
        await settle(page);
        expect(page.shadowRoot!.querySelector('#category-tooltip')).toBeNull();
        expect(section.querySelector('.markup')!.textContent).toBe(exampleSource(name).ui);
        const css = section.querySelector('.example-css');
        if (exampleSource(name).styles) expect(css!.textContent).toBe(exampleSource(name).styles);
        else expect(css).toBeNull();
        const demo = section.querySelector('.playground')!;
        for (const codeSection of section.querySelectorAll('.code-section, .markup-section, .css-section')) {
            expect(demo.compareDocumentPosition(codeSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        }
        if (!['required', 'formatter', 'visibleWhen'].includes(name)) {
            const catalog = section.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
            await catalog.updateComplete;
            expect(catalog.shadowRoot!.querySelectorAll('[data-modifier]')).toHaveLength(1);
            expect(catalog.shadowRoot!.querySelectorAll('.cookbook-recipe')).toHaveLength(0);
            if (recipe.limitation) {
                expect(catalog.shadowRoot!.querySelector('.limitation')!.textContent).toContain('Adapter support needed');
            } else {
                expect(catalog.shadowRoot!.querySelector('.focused-state pre')!.textContent!.length).toBeGreaterThan(1);
            }
        }
    });

    it('keeps the current page and navigates within the filtered results', async () => {
        const page = await openPage();
        const root = page.shadowRoot!;
        const search = root.querySelector<HTMLInputElement>('#modifier-search')!;
        expect(root.querySelector('.match-count')).toBeNull();
        expect(search.getAttribute('aria-label')).toBe('Find a modifier');
        expect(root.querySelector('.search-label')).toBeNull();
        expect(root.querySelector('.modifier-search-field svg')!.getAttribute('aria-hidden')).toBe('true');
        search.value = 'tables';
        search.dispatchEvent(new Event('input'));
        await settle(page);
        expect(root.querySelectorAll('.modifier-list a')).toHaveLength(0);
        search.value = ' WIDTH ';

        search.dispatchEvent(new Event('input'));
        await settle(page);
        expect(root.querySelectorAll('.modifier-list a')).toHaveLength(3);
        expect(root.querySelector('.filter-status .match-count')!.textContent).toBe('(3 of 33 shown)');
        expect(root.querySelector('h1')!.textContent).toBe('.required(predicate?)');
        root.querySelector<HTMLButtonElement>('.next')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toBe('Column widths');
        expect(root.querySelector('.page-count')!.textContent).toContain('1 of 1');
        expect(root.querySelector('.page-count')!.textContent).toContain('Filtered pages');
        search.value = 'no matching modifier';
        search.dispatchEvent(new Event('input'));
        await settle(page);
        expect(root.querySelector('.empty-search')!.textContent).toContain('No modifiers match');
    });

    it('opens a modifier from the list and resets its example', async () => {
        const page = await openPage();
        const root = page.shadowRoot!;
        root.querySelector<HTMLAnchorElement>('nav a[href="#defaultValue"]')!.click();
        await settle(page);
        let catalog = root.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
        await catalog.updateComplete;
        catalog.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
        await catalog.updateComplete;
        expect(catalog.shadowRoot!.querySelector('.focused-state')!.textContent).toContain('Untitled document');
        root.querySelector<HTMLButtonElement>('.reset')!.click();
        await settle(page);
        catalog = root.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
        await catalog.updateComplete;
        expect(catalog.shadowRoot!.querySelector('.focused-state')!.textContent).toContain('Quarterly plan');
    });
});


describe('extended model exercises', () => {
    it('recomputes an aggregate when its FDL-backed input changes', async () => {
        const page = await openPage('#reducer');
        const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
        await catalog.updateComplete;
        const field = catalog.shadowRoot!.querySelector('fdl-field[field="secondAmount"]') as any;
        await field.updateComplete;
        const input = field.shadowRoot.querySelector('input') as HTMLInputElement;
        input.value = '300';
        input.dispatchEvent(new Event('input'));
        await catalog.updateComplete;
        expect(catalog.shadowRoot!.querySelector('.computed')!.textContent).toContain('$2,000.00');
        expect(catalog.shadowRoot!.querySelector('.focused-state')!.textContent).toContain('2000');
    });

    it('shows actual hydrated and sorted table rows in the state panel', async () => {
        const page = await openPage('#sortable');
        const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
        await catalog.updateComplete;
        const table = catalog.shadowRoot!.querySelector('fdl-table') as any;
        await table.updateComplete;
        await table.recordset.requestUpdate();
        await catalog.updateComplete;
        await table.updateComplete;
        expect(catalog.shadowRoot!.querySelector('.focused-state')!.textContent).toContain('Zulu');
        const sort = table.shadowRoot.querySelector('button[title="Sort by Last name"]') as HTMLButtonElement;
        sort.click();
        await table.recordset.requestUpdate();
        await catalog.updateComplete;
        const state = JSON.parse(catalog.shadowRoot!.querySelector('.focused-state pre')!.textContent!);
        expect(state.visibleRows[0].lastName).toBe('Alpha');
        expect(state.sortColumns[0].field).toBe('lastName');
        expect(table.shadowRoot.querySelector('button[title="Sort by T-shirt size"]')).toBeNull();
        expect(table.shadowRoot.textContent).toContain('T-shirt size');
        expect(state.visibleRows.map((row: any) => row.shirtSize).sort()).toEqual(['L', 'M', 'S', 'XL', 'XS', 'XXL'].sort());
        expect(state.totalRecords).toBe(6);
    });

    it('rejects an overlong value assigned directly to the model', async () => {
        const page = await openPage('#maxLength');
        const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog[modifier="maxLength"]') as FdlModifierCatalog;
        await catalog.updateComplete;
        catalog.shadowRoot!.querySelector<HTMLButtonElement>('.model-assignment')!.click();
        await catalog.updateComplete;
        const field = catalog.shadowRoot!.querySelector('fdl-field') as any;
        await field.updateComplete;
        expect(field.shadowRoot.querySelector('[aria-invalid="true"]')).toBeTruthy();
        expect(catalog.shadowRoot!.querySelector('.focused-state')!.textContent).toContain('THIS-CODE-IS-TOO-LONG');
    });
});

describe('category navigation filters', () => {
    it('keeps category choices in a dropdown and closes with Escape or an outside click', async () => {
        const page = await openPage();
        const menu = page.shadowRoot!.querySelector<HTMLDetailsElement>('.category-filters')!;
        expect(menu.open).toBe(false);
        expect(menu.querySelector('summary')!.textContent).toBe('All categories');
        menu.open = true;
        menu.querySelector<HTMLInputElement>('input')!.click();
        await settle(page);
        expect(menu.open).toBe(true);
        expect(menu.querySelector('summary')!.getAttribute('aria-label')).not.toContain('all categories');
        menu.querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true}));
        expect(menu.open).toBe(false);
        expect(page.shadowRoot!.activeElement).toBe(menu.querySelector('summary'));
        menu.open = true;
        window.dispatchEvent(new MouseEvent('click'));
        expect(menu.open).toBe(false);
    });

    it('combines categories with OR and search with AND, and clears both filters', async () => {
        const page = await openPage('#formatter');
        const root = page.shadowRoot!;
        const checkbox = (category: string) => [...root.querySelectorAll<HTMLLabelElement>('.category-options label')]
            .find(label => label.textContent!.includes(category))!.querySelector<HTMLInputElement>('input')!;
        checkbox('Validation').click();
        await settle(page);
        expect(root.querySelectorAll('.modifier-list a')).toHaveLength(explorerRecipes.filter(recipe => recipe.category === 'Validation').length);
        expect(root.querySelector('h1')!.textContent).toContain('formatter');
        expect(root.querySelector('#modifier-jump')).toBeNull();
        checkbox('Tables').click();
        await settle(page);
        expect(root.querySelectorAll('.modifier-list a')).toHaveLength(explorerRecipes.filter(recipe => ['Validation', 'Tables'].includes(recipe.category)).length);
        const search = root.querySelector<HTMLInputElement>('#modifier-search')!;
        search.value = 'required';
        search.dispatchEvent(new Event('input'));
        await settle(page);
        expect(root.querySelectorAll('.modifier-list a')).toHaveLength(1);
        root.querySelector<HTMLButtonElement>('.clear-filters')!.click();
        await settle(page);
        expect(root.querySelectorAll('.modifier-list a')).toHaveLength(explorerRecipes.length);
        expect(root.querySelectorAll('.category-options input:checked')).toHaveLength(0);
        expect(root.querySelector('.match-count')).toBeNull();
        expect(search.value).toBe('');
    });

    it('shows all categories again when the last selected category is unchecked', async () => {
        const page = await openPage();
        const root = page.shadowRoot!;
        const input = root.querySelector<HTMLInputElement>('.category-options input')!;
        input.click();
        await settle(page);
        expect(root.querySelectorAll('.modifier-list a').length).toBeLessThan(explorerRecipes.length);
        input.click();
        await settle(page);
        expect(root.querySelectorAll('.modifier-list a')).toHaveLength(explorerRecipes.length);
    });
});


describe('FDL site pages', () => {
    it('opens Home by default and separates site pages from the modifier reference', async () => {
        const page = await openPage('');
        const root = page.shadowRoot!;
        expect(root.querySelector('h1')!.textContent).toBe('Field Definition Language');
        expect(root.querySelector('.site-page')!.textContent).toContain('Recordset');
        expect(root.querySelectorAll('.site-nav a')).toHaveLength(6);
        expect(root.querySelectorAll('.modifier-list a')).toHaveLength(explorerRecipes.length);
        expect(root.querySelector('a[href="../cookbook/"]')).toBeNull();
        expect(root.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    });

    it('navigates between documentation and modifiers, and responds to history changes', async () => {
        const page = await openPage('');
        const root = page.shadowRoot!;
        root.querySelector<HTMLAnchorElement>('.site-nav a[href="#how-it-works"]')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toBe('How it Works');
        expect(window.location.hash).toBe('#how-it-works');
        root.querySelector<HTMLAnchorElement>('.site-nav a[href="#contributing"]')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toBe('Contributing');
        root.querySelector<HTMLAnchorElement>('.modifier-list a[href="#formatter"]')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toBe('.formatter(fn)');
        expect(root.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
        window.location.hash = 'home';
        window.dispatchEvent(new Event('hashchange'));
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toBe('Field Definition Language');
        expect(document.title).toBe('Home — FDL');
    });
});


it('parses formatted money input in the surviving documentation example', async () => {
    const page = await openPage('#parser');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const field = catalog.shadowRoot!.querySelector('fdl-field') as any;
    await field.updateComplete;
    const input = field.shadowRoot.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('$1,000.00');
    input.value = '$1,500.00';
    input.dispatchEvent(new Event('input'));
    await catalog.updateComplete;
    expect(catalog.shadowRoot!.querySelector('.focused-state')!.textContent).toContain('1500');
});

it('defines valid, reciprocal related links for every modifier', () => {
    const names = new Set(explorerRecipes.map(recipe => recipe.name));
    for (const recipe of explorerRecipes) {
        const related = relatedModifierNames(recipe.name);
        expect(related.length).toBeGreaterThan(0);
        expect(related).not.toContain(recipe.name);
        expect(related).toEqual([...new Set(related)].sort((a,b)=>a.localeCompare(b,'en')));
        for (const name of related) {
            expect(names.has(name)).toBe(true);
            expect(relatedModifierNames(name)).toContain(recipe.name);
        }
    }
});
it.each(explorerRecipes.map(recipe => recipe.name))('lists related modifiers on %s', async name => {
    const page = await openPage(`#${name}`);
    const section = page.shadowRoot!.getElementById(name)!.querySelector('.related-modifiers')!;
    const links = Array.from(section.querySelectorAll('a'));
    expect(section.querySelector('h3')!.textContent).toBe('Related modifiers');
    expect(links.map(link=>link.getAttribute('href'))).toEqual(relatedModifierNames(name).map(related=>`#${related}`));
    expect(section.querySelectorAll('li span').length).toBe(links.length);
});
it('links cell styling alternatives in both directions', async () => {
    expect(relatedModifierNames('cellClass')).toContain('rowClass');
    const page = await openPage('#cellClass');
    const link = page.shadowRoot!.querySelector<HTMLAnchorElement>('.related-modifiers a[href="#rowClass"]')!;
    expect(link.textContent).toBe('.rowClass()');
    link.click();await settle(page);
    expect(page.shadowRoot!.activeElement).toBe(page.shadowRoot!.querySelector('h1'));
    expect(page.shadowRoot!.querySelector('h1')!.textContent).toBe('.rowClass(classes)');
    expect(page.shadowRoot!.querySelector('.related-modifiers a[href="#cellClass"]')).not.toBeNull();
});


it('updates emptiness and validation for required and optional references as they are edited', async () => {
    const page = await openPage('#emptyWhen');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const demo = catalog.shadowRoot!.querySelector('.focused-demo')!;
    expect(demo.querySelector('button')).toBeNull();
    expect(demo.querySelectorAll('fdl-field')).toHaveLength(2);
    for (const name of ['emptyCode', 'optionalEmptyCode']) {
        const field = demo.querySelector(`fdl-field[field="${name}"]`) as any;
        await field.updateComplete;
        const input = field.shadowRoot.querySelector('input') as HTMLInputElement;
        expect(input.required).toBe(name === 'emptyCode');
        for (const [value, empty] of [['N/A', true], ['REF-42', false], ['   ', true], ['', true]] as const) {
            input.value = value;
            input.dispatchEvent(new Event('input'));
            await catalog.updateComplete;
            const status = demo.querySelector(`[role=status][data-field="${name}"]`)!.textContent!;
            expect(status).toContain(empty ? 'This field is considered empty' : 'This field is not considered empty');
            expect(status).toContain(name === 'emptyCode' && empty ? 'Invalid: Reference is required.' : 'Valid:');
        }
    }
});


it.each(modifierPageGroups)('groups $title on one page with stable sections and working member links', async group => {
    const page = await openPage(`#${group.names[0]}`);
    const root = page.shadowRoot!;
    expect(root.querySelector('h1')!.textContent).toBe(group.title);
    expect([...root.querySelectorAll('.modifier-section')].map(section => section.id)).toEqual(group.names);
    const original = root.querySelectorAll('fdl-modifier-catalog');
    const target = group.names[group.names.length - 1];
    root.querySelector<HTMLAnchorElement>(`.page-sections a[href="#${target}"]`)!.click();
    await settle(page);
    expect(window.location.hash).toBe(`#${target}`);
    expect(root.activeElement).toBe(root.getElementById(target)!.querySelector('.modifier-signature'));
    expect([...root.querySelectorAll('fdl-modifier-catalog')]).toEqual([...original]);
    expect(root.querySelector('.page-count')!.textContent).toContain('of 29');
});

it('resets one grouped example without resetting its neighbor', async () => {
    const page = await openPage('#readOnly');
    const root = page.shadowRoot!;
    const conditional = root.querySelector('fdl-modifier-catalog[modifier="readOnlyWhen"]') as FdlModifierCatalog;
    await conditional.updateComplete;
    const field = conditional.shadowRoot!.querySelector('fdl-field[field="phase"]') as any;
    await field.updateComplete;
    const select = field.shadowRoot.querySelector('select') as HTMLSelectElement;
    select.value = 'submitted';
    select.dispatchEvent(new Event('input'));
    await conditional.updateComplete;
    root.getElementById('readOnly')!.querySelector<HTMLButtonElement>('.reset')!.click();
    await settle(page);
    expect(root.querySelector('fdl-modifier-catalog[modifier="readOnlyWhen"]')).toBe(conditional);
    expect(field.record.getField('phase')).toBe('submitted');
});


it('changes textarea rows while retaining the comment and updating the example source', async () => {
    const page = await openPage('#rowCount');
    const root = page.shadowRoot!;
    let catalog = root.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const findField = async (name: string) => {
        const field = catalog.shadowRoot!.querySelector(`fdl-field[field="${name}"]`) as any;
        await field.updateComplete;
        return field;
    };
    let comments = await findField('comments');
    const textarea = comments.shadowRoot.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.rows).toBe(4);
    textarea.value = 'Keep this comment.\nAnd its second line.';
    textarea.dispatchEvent(new Event('input'));
    const choice = await findField('textareaRows');
    const select = choice.shadowRoot.querySelector('select') as HTMLSelectElement;
    expect([...select.options].map(option => option.value)).toEqual(['1', '4', '10']);
    for (const rows of [1, 4, 10]) {
        select.value = String(rows);
        select.dispatchEvent(new Event('change'));
        await catalog.updateComplete;
        await settle(page);
        comments = await findField('comments');
        expect(comments.shadowRoot.querySelector('textarea').rows).toBe(rows);
        expect(comments.shadowRoot.querySelector('textarea').value).toBe(textarea.value);
        expect(root.querySelector('.code-panel')?.textContent || root.textContent).toContain(`.rowCount(${rows})`);
    }
    root.querySelector<HTMLButtonElement>('.reset')!.click();
    await settle(page);
    catalog = root.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    comments = await findField('comments');
    expect(comments.shadowRoot.querySelector('textarea').rows).toBe(4);
});


it('shows conditional invoice templates without a balance editor', async () => {
    const page = await openPage('#template');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const table = catalog.shadowRoot!.querySelector('fdl-table') as any;
    await table.recordset.requestUpdate();
    await table.updateComplete;
    expect(catalog.shadowRoot!.querySelector('fdl-field')).toBeNull();
    expect(table.shadowRoot.querySelectorAll('.paid-balance')).toHaveLength(1);
    expect(table.shadowRoot.querySelectorAll('.due-balance')).toHaveLength(2);
    expect(table.shadowRoot.textContent).toContain('$1,250.00');
    expect(table.shadowRoot.textContent).toContain('$85.50');
});


it('previews every declared input type and keeps the source and record panel in sync', async () => {
    const page = await openPage('#type');
    const root = page.shadowRoot!;
    const catalog = root.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const selector = catalog.shadowRoot!.querySelector('fdl-field[field="inputType"]') as any;
    await selector.updateComplete;
    const select = selector.shadowRoot.querySelector('select') as HTMLSelectElement;
    expect([...select.options].map(option => option.value)).toEqual(inputTypes);
    for (const inputType of inputTypes) {
        select.value = inputType;
        select.dispatchEvent(new Event('change'));
        await catalog.updateComplete;
        await settle(page);
        const preview = catalog.shadowRoot!.querySelector('fdl-field[field="inputValue"]') as any;
        await preview.updateComplete;
        const input = preview.shadowRoot.querySelector('input') as HTMLInputElement;
        expect(input.type).toBe(inputType);
        expect(preview.record.fieldTypeForField('inputValue').type()).toBe(inputType);
        expect(root.textContent).toContain(`.type('${inputType}')`);
        expect(catalog.shadowRoot!.querySelector('.focused-state')!.textContent).toContain('Example: ' + inputType);
        if (inputType === 'checkbox' || inputType === 'radio') {
            input.click();
            await catalog.updateComplete;
            expect(preview.record.getField('inputValue')).toBe(true);
        }
    }
    root.querySelector<HTMLButtonElement>('.reset')!.click();
    await settle(page);
    const resetCatalog = root.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await resetCatalog.updateComplete;
    const preview = resetCatalog.shadowRoot!.querySelector('fdl-field[field="inputValue"]') as any;
    await preview.updateComplete;
    expect(preview.shadowRoot.querySelector('input').type).toBe('text');
});


it('lists every category and modifier once with purposes and linked relationships', async () => {
    const page = await openPage('#categories');
    const root = page.shadowRoot!;
    expect(document.title).toBe('Modifier categories — FDL');
    expect(root.querySelector('.site-nav a[href="#categories"]')!.getAttribute('aria-current')).toBe('page');
    const sections = [...root.querySelectorAll('.category-overview-section')];
    expect(sections).toHaveLength(new Set(explorerRecipes.map(recipe => recipe.category)).size);
    const listed = [...root.querySelectorAll('.category-modifiers [data-modifier]')];
    expect(listed.map(item => item.getAttribute('data-modifier')).sort()).toEqual(explorerRecipes.map(recipe => recipe.name).sort());
    for (const section of sections) {
        const category = section.querySelector('h2')!.textContent!.trim();
        expect(section.textContent).toContain(categoryDescriptions[category]);
        expect(section.querySelector('.category-relationships a')).not.toBeNull();
        const names = [...section.querySelectorAll('[data-modifier]')].map(item => item.getAttribute('data-modifier'));
        expect(names).toEqual(explorerRecipes.filter(recipe => recipe.category === category).map(recipe => recipe.name));
    }
    const validNames = new Set(explorerRecipes.map(recipe => recipe.name));
    for (const link of root.querySelectorAll<HTMLAnchorElement>('.category-overview-section a')) {
        expect(validNames.has(link.getAttribute('href')!.slice(1))).toBe(true);
    }
    window.location.hash = 'categories?category=category-validation';
    window.dispatchEvent(new Event('hashchange'));
    await settle(page);
    expect(root.activeElement?.id).toBe('category-validation');
    const modifier = root.querySelector<HTMLAnchorElement>('#category-validation')!.closest('section')!.querySelector<HTMLAnchorElement>('a[href="#emptyWhen"]')!;
    modifier.click();
    // Native anchor navigation is handled by hashchange in the browser.
    window.location.hash = 'emptyWhen';
    window.dispatchEvent(new Event('hashchange'));
    await settle(page);
    expect(root.getElementById('emptyWhen')).not.toBeNull();
});


it('marks rowCount as deprecated and points textarea sizing to fdl-field', async () => {
    const page = await openPage('#rowCount');
    const note = page.shadowRoot!.querySelector('.deprecation-note')!;
    expect(note.textContent).toContain('Deprecated.');
    expect(note.textContent).toContain('presentation concern');
    expect(note.textContent).toContain('fdl-field');
    expect(note.textContent).toContain('remains available for compatibility');
    expect(exampleSource('rowCount').definition).toContain('// Deprecated: textarea sizing belongs in fdl-field');
});

it('opens the consolidated cellClass page from its retired conditional URL', async () => {
    const page = await openPage('#conditionalCellClass');
    expect(page.shadowRoot!.querySelector('h1')!.textContent).toContain('.cellClass(');
    expect(page.shadowRoot!.querySelector('.modifier-list a[href="#conditionalCellClass"]')).toBeNull();
});

it('opens the singular rowClass page from its old plural URL', async () => {
    const page = await openPage('#rowClasses');
    expect(page.shadowRoot!.querySelector('h1')!.textContent).toBe('.rowClass(classes)');
    expect(page.shadowRoot!.querySelector('.modifier-list a[href="#rowClasses"]')).toBeNull();
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as any;
    await catalog.updateComplete;
    const table = catalog.shadowRoot.querySelector('fdl-table') as any;
    await table.recordset.requestUpdate();await table.updateComplete;
    expect(table.shadowRoot.querySelectorAll('tr.invoice-row')).toHaveLength(2);
    expect(table.shadowRoot.querySelectorAll('tr.disputed-row.needs-review')).toHaveLength(1);
});

it.each([['requiredWhen','required'],['disabledWhen','disabled']])('opens retired %s links on %s', async (oldName, name) => {
    const page = await openPage(`#${oldName}`);
    expect(page.shadowRoot!.querySelector('h1')!.textContent).toBe(`.${name}(predicate?)`);
    expect(page.shadowRoot!.querySelector(`.modifier-list a[href="#${oldName}"]`)).toBeNull();
});
