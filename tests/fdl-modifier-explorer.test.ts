import '../examples/fdl-input/fdl-modifier-explorer';
import type { FdlModifierExplorer } from '../examples/fdl-input/fdl-modifier-explorer';

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
        expect(root.querySelector<HTMLButtonElement>('.next')!.disabled).toBe(true);
        expect(window.location.hash).toBe('#visibleWhen');
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
