import { compositionRecord, compositionDefinition, addressCases, addressCase, type CompositionRules } from '../examples/fdl-input/composition-model';
import '../examples/fdl-input/fdl-composition-experiment';
import type { FdlCompositionExperiment } from '../examples/fdl-input/fdl-composition-experiment';

beforeAll(() => { HTMLElement.prototype.scrollIntoView = jest.fn(); });
afterEach(() => document.body.replaceChildren());

// All 12 rule combinations, with each method/address case. This catches accidental
// coupling, particularly validators that incorrectly stop running on hidden values.
const combinations: CompositionRules[] = [];
for (const visibility of ['all','shipping'] as const) for (const requiredness of ['never','shipping','always'] as const) for (const validation of ['off','on'] as const) combinations.push({visibility,requiredness,validation});
it.each(combinations)('keeps rules independent for %j', rules => {
    for (const method of ['ship','pickup']) for (const sample of addressCases) {
        const record = compositionRecord(rules, method, sample.value);
        const type = record.fieldTypeForField('address');
        const required = rules.requiredness === 'always' || (rules.requiredness === 'shipping' && method === 'ship');
        const invalid = (required && sample.id === 'empty') || (rules.validation === 'on' && sample.id === 'unnumbered');
        expect(type.visible(undefined, record)).toBe(rules.visibility === 'all' || method === 'ship');
        expect(type.required(undefined, record)).toBe(required);
        expect(record.isValid()).toBe(!invalid);
        expect(record.getField('address')).toBe(sample.value);
    }
});
it('keeps whitespace in the unnumbered class and rejects it when format checking is enabled', () => {
    const record = compositionRecord({visibility:'shipping',requiredness:'never',validation:'on'}, 'pickup', '   ');
    expect(addressCase('   ')).toBe('unnumbered');
    expect(record.isValid()).toBe(false);
});
it('renders definitions that reflect the independently enabled rules', () => {
    const simple = compositionDefinition({visibility:'all',requiredness:'never',validation:'off'});
    expect(simple).not.toMatch(/visibleWhen|required|validator/);
    const full = compositionDefinition({visibility:'shipping',requiredness:'always',validation:'on'});
    expect(full).toContain('.visibleWhen(');
    expect(full).toContain('.required()');
    expect(full).toContain('.validator(');
    expect(full).toContain('/^\\d+\\s+\\S/');
});
const openDemo = async () => {
    const demo = document.createElement('fdl-composition-experiment') as FdlCompositionExperiment;
    document.body.append(demo);
    await demo.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    return demo;
};
const edit = async (demo: FdlCompositionExperiment, fieldName: string, value: string) => {
    const field = demo.shadowRoot!.querySelector(`fdl-field[field="${fieldName}"]`) as any;
    await field.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    const input = field.shadowRoot.querySelector('select,input') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
    await demo.updateComplete;
};
const selectCase = async (demo: FdlCompositionExperiment, method: string, sample: string) => {
    demo.shadowRoot!.querySelector<HTMLButtonElement>(`.case[data-method="${method}"][data-address-case="${sample}"]`)!.click();
    await demo.updateComplete;
    await Promise.resolve();
};
it('loads the exact selected case and exposes hidden validation failures', async () => {
    const demo = await openDemo();
    expect(demo.shadowRoot!.querySelectorAll('.case')).toHaveLength(6);
    await selectCase(demo, 'pickup', 'unnumbered');
    const root = demo.shadowRoot!;
    expect(root.activeElement?.id).toBe('selected-case-title');
    expect(root.querySelector('.state')!.textContent).toContain('The record is invalid.');
    expect(root.querySelector('.state')!.textContent).toContain('Orchard Street');
    expect(root.querySelector('.surprise')!.textContent).toContain('Hiding the control leaves the value');
    const field = root.querySelector('fdl-field[field="address"]') as any;
    await field.updateComplete;
    expect(field.shadowRoot.querySelector('input')).toBeNull();
    await edit(demo, 'validation', 'off');
    expect(root.querySelector('.state')!.textContent).toContain('The record is valid.');
    expect(root.querySelector('.state')!.textContent).toContain('Orchard Street');
    expect(root.querySelector('.definition pre')!.textContent).not.toContain('.validator(');
    expect(root.querySelector('.case[aria-pressed="true"]')!.getAttribute('data-address-case')).toBe('unnumbered');
});
it('lets readers inspect hidden requiredness, reveal the field, and edit back into the overview', async () => {
    const demo = await openDemo();
    await edit(demo, 'requiredness', 'always');
    await selectCase(demo, 'pickup', 'empty');
    expect(demo.shadowRoot!.querySelector('.state')!.textContent).toContain('The record is invalid.');
    await edit(demo, 'visibility', 'all');
    await edit(demo, 'address', '99 Pine Road');
    const root = demo.shadowRoot!;
    expect(root.querySelector('.state')!.textContent).toContain('The record is valid.');
    expect(root.querySelector('.state')!.textContent).toContain('99 Pine Road');
    const selected = root.querySelector('.case[aria-pressed="true"]')!;
    expect(selected.getAttribute('data-method')).toBe('pickup');
    expect(selected.getAttribute('data-address-case')).toBe('numbered');
    root.querySelector<HTMLButtonElement>('.reset')!.click();
    await demo.updateComplete;
    expect(root.querySelector('.state')!.textContent).toContain('42 Orchard Street');
    expect(root.querySelector('.definition')!.textContent).toContain('.required(');
    expect(root.querySelector('.case[aria-pressed="true"]')!.getAttribute('data-method')).toBe('ship');
});


it('keeps custom cases and compares saved rules with changed rules',async()=>{
 const demo=await openDemo();
 await edit(demo,'address','Orchard Street');
 await edit(demo,'fulfillment','pickup');
 demo.shadowRoot!.querySelector<HTMLButtonElement>('.keep-case')!.click();await demo.updateComplete;
 await edit(demo,'validation','off');await demo.updateComplete;
 const cells=demo.shadowRoot!.querySelectorAll('.collected-cases tbody td');
 expect(cells[0].textContent).toContain('Hidden · Optional · Invalid');
 expect(cells[1].textContent).toContain('Hidden · Optional · Valid');
 expect(cells[1].textContent).toContain('Format check: street number → off');
 demo.shadowRoot!.querySelector<HTMLButtonElement>('.collected-cases button')!.click();await demo.updateComplete;
 expect(demo.shadowRoot!.querySelector('.state')!.textContent).toContain('The record is invalid');
 expect(demo.shadowRoot!.querySelector('.collected-cases')!.textContent).toContain('Rules unchanged');
});

it('preserves kept cases when resetting rules and the current example',async()=>{
 const demo=await openDemo();await edit(demo,'address','Orchard Street');
 demo.shadowRoot!.querySelector<HTMLButtonElement>('.keep-case')!.click();await demo.updateComplete;
 await edit(demo,'validation','off');
 demo.shadowRoot!.querySelector<HTMLButtonElement>('.reset')!.click();await demo.updateComplete;
 expect(demo.shadowRoot!.querySelector('.collected-cases')!.textContent).toContain('Orchard Street');
 expect(demo.shadowRoot!.querySelector('.state')!.textContent).toContain('42 Orchard Street');
 const buttons=Array.from(demo.shadowRoot!.querySelectorAll<HTMLButtonElement>('.collected-cases button'));
 buttons.find(button=>button.textContent==='Clear kept cases')!.click();await demo.updateComplete;
 expect(demo.shadowRoot!.querySelector('.collected-cases')).toBeNull();
});
