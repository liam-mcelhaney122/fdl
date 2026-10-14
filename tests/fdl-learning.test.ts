import '../examples/fdl-input/fdl-delivery-experiment';
import type { FdlDeliveryExperiment } from '../examples/fdl-input/fdl-delivery-experiment';

afterEach(() => document.body.replaceChildren());

it('explores delivery visibility and requiredness without discarding the address', async () => {
    const demo = document.createElement('fdl-delivery-experiment') as FdlDeliveryExperiment;
    document.body.append(demo);
    await demo.updateComplete;
    const field = demo.shadowRoot!.querySelector('fdl-field[field="fulfillment"]') as any;
    await field.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    const select = field.shadowRoot.querySelector('select') as HTMLSelectElement;
    select.value = 'pickup';
    select.dispatchEvent(new Event('input'));
    select.dispatchEvent(new Event('change'));
    await demo.updateComplete;
    expect(demo.shadowRoot!.querySelector('.state')!.textContent).toContain('Hidden · Optional');
    expect(demo.shadowRoot!.querySelector('.state')!.textContent).toContain('42 Orchard Street');
    select.value = 'ship';
    select.dispatchEvent(new Event('input'));
    select.dispatchEvent(new Event('change'));
    await demo.updateComplete;
    const address = demo.shadowRoot!.querySelector('fdl-field[field="address"]') as any;
    await address.updateComplete;
    const input = address.shadowRoot.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('42 Orchard Street');
    input.value = '';
    input.dispatchEvent(new Event('input'));
    await demo.updateComplete;
    expect(demo.shadowRoot!.querySelector('.state')!.textContent).toContain('Invalid');
});

import '../examples/fdl-input/fdl-modifier-explorer';
import type { FdlModifierExplorer } from '../examples/fdl-input/fdl-modifier-explorer';
import type { FdlModifierCatalog } from '../examples/fdl-input/fdl-modifier-catalog';

beforeAll(() => { HTMLElement.prototype.scrollIntoView = jest.fn(); });
const openExplorer = async (hash: string) => {
    window.location.hash = hash;
    const page = document.createElement('fdl-modifier-explorer') as FdlModifierExplorer;
    document.body.append(page);
    await page.updateComplete;
    return page;
};
const editField = async (root: ShadowRoot, name: string, value: string) => {
    const field = root.querySelector(`fdl-field[field="${name}"]`) as any;
    await field.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    const input = field.shadowRoot.querySelector('input,select,textarea') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
};
it('explains the actual visibility result and retained value', async () => {
    const page = await openExplorer('#visibleWhen');
    await editField(page.shadowRoot!, 'fulfillment', 'pickup');
    await page.updateComplete;
    const trace = page.shadowRoot!.querySelector('.dependency-trace')!.textContent!;
    expect(trace).toContain('false');
    expect(trace).toContain('Hidden');
    expect(trace).toContain('42 Orchard Street');
});
it('explains conditional requiredness as the dependency changes', async () => {
    const page = await openExplorer('#requiredWhen');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    await editField(catalog.shadowRoot!, 'followUp', 'yes');
    await catalog.updateComplete;
    expect(catalog.shadowRoot!.querySelector('.dependency-trace')!.textContent).toContain('true → Required');
    await editField(catalog.shadowRoot!, 'followUp', 'no');
    await catalog.updateComplete;
    expect(catalog.shadowRoot!.querySelector('.dependency-trace')!.textContent).toContain('false → Optional');
});
