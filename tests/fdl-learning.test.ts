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
