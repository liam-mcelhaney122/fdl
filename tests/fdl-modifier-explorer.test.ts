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
        const page = await openPage();
        const root = page.shadowRoot!;
        expect(root.querySelector('h1')!.textContent).toContain('.required()');
        expect(root.querySelector<HTMLButtonElement>('.pager')!.disabled).toBe(true);
        root.querySelector<HTMLButtonElement>('.next')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toContain('.formatter(fn)');
        expect(root.querySelectorAll('fdl-field')).toHaveLength(1);
        root.querySelector<HTMLButtonElement>('.pager')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toContain('.required()');
        root.querySelector<HTMLAnchorElement>('a[href="#visibleWhen"]')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toContain('.visibleWhen(predicate)');
        expect(root.querySelector<HTMLButtonElement>('.next')!.disabled).toBe(false);
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
        expect(root.querySelector('.result')!.textContent).toContain('Ready to validate');
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
    it('covers the cookbook inventory exactly once', () => {
        expect(explorerRecipes.map(recipe => recipe.name).sort()).toEqual(modifierEntries.map(entry => entry.name).sort());
        expect(new Set(explorerRecipes.map(recipe => recipe.name)).size).toBe(explorerRecipes.length);
    });

    it.each(explorerRecipes.map(recipe => [recipe.name, recipe] as const))('opens the %s deep link with one focused example or explicit contract limit', async (name, recipe) => {
        const page = await openPage(`#${name}`);
        expect(page.shadowRoot!.querySelectorAll('h1')).toHaveLength(1);
        expect(page.shadowRoot!.querySelector('#modifier-jump')).toBeNull();
        expect(page.shadowRoot!.querySelector('h1')!.textContent).toBe(`.${name}${recipe.signature}`);
        expect(page.shadowRoot!.querySelector('.code code')!.textContent).toBe(recipe.code);
        expect(page.shadowRoot!.querySelector('.code .syntax-function, .code .syntax-builtin')).toBeTruthy();
        expect(page.shadowRoot!.querySelector('.focused-line')).toBeTruthy();
        expect(page.shadowRoot!.querySelector('.chapter')!.textContent).not.toContain('MODIFIER');
        if (!recipe.limitation) expect(page.shadowRoot!.querySelector('.markup')!.textContent).toContain('<');
        if (!['required', 'formatter', 'visibleWhen'].includes(name)) {
            const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
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

    it('filters the index without changing the current page or sequence', async () => {
        const page = await openPage();
        const root = page.shadowRoot!;
        const search = root.querySelector<HTMLInputElement>('#modifier-search')!;
        search.value = 'width';
        search.dispatchEvent(new Event('input'));
        await settle(page);
        expect(root.querySelectorAll('nav a')).toHaveLength(3);
        expect(root.querySelector('h1')!.textContent).toContain('required');
        root.querySelector<HTMLButtonElement>('.next')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toContain('formatter');
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
        expect(catalog.shadowRoot!.querySelector('.focused-state')!.textContent).toContain('Pending assignment');
        root.querySelector<HTMLButtonElement>('.reset')!.click();
        await settle(page);
        catalog = root.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
        await catalog.updateComplete;
        expect(catalog.shadowRoot!.querySelector('.focused-state')!.textContent).toContain('REQ-1042');
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
        expect(state.totalRecords).toBe(4);
    });

    it('rejects an overlong value assigned directly to the model', async () => {
        const page = await openPage('#maxLength');
        const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
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
    it('combines categories with OR and search with AND, and clears both filters', async () => {
        const page = await openPage('#formatter');
        const root = page.shadowRoot!;
        const checkbox = (category: string) => [...root.querySelectorAll<HTMLLabelElement>('.category-options label')]
            .find(label => label.textContent!.includes(category))!.querySelector<HTMLInputElement>('input')!;
        checkbox('Validation').click();
        await settle(page);
        expect(root.querySelectorAll('nav a')).toHaveLength(explorerRecipes.filter(recipe => recipe.category === 'Validation').length);
        expect(root.querySelector('h1')!.textContent).toContain('formatter');
        expect(root.querySelector('#modifier-jump')).toBeNull();
        checkbox('Tables').click();
        await settle(page);
        expect(root.querySelectorAll('nav a')).toHaveLength(explorerRecipes.filter(recipe => ['Validation', 'Tables'].includes(recipe.category)).length);
        const search = root.querySelector<HTMLInputElement>('#modifier-search')!;
        search.value = 'required';
        search.dispatchEvent(new Event('input'));
        await settle(page);
        expect(root.querySelectorAll('nav a')).toHaveLength(2);
        root.querySelector<HTMLButtonElement>('.clear-filters')!.click();
        await settle(page);
        expect(root.querySelectorAll('nav a')).toHaveLength(explorerRecipes.length);
        expect(root.querySelectorAll('.category-options input:checked')).toHaveLength(0);
        expect(search.value).toBe('');
    });

    it('shows all categories again when the last selected category is unchecked', async () => {
        const page = await openPage();
        const root = page.shadowRoot!;
        const input = root.querySelector<HTMLInputElement>('.category-options input')!;
        input.click();
        await settle(page);
        expect(root.querySelectorAll('nav a').length).toBeLessThan(explorerRecipes.length);
        input.click();
        await settle(page);
        expect(root.querySelectorAll('nav a')).toHaveLength(explorerRecipes.length);
    });
});
