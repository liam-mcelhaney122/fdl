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

it('removes requiredness from both model validation and the displayed definition', async () => {
    const page = await openExplorer('#required');
    const root = page.shadowRoot!;
    root.querySelector<HTMLButtonElement>('.primary')!.click();
    await page.updateComplete;
    expect(root.querySelector('.result')!.textContent).toContain('required');
    root.querySelector<HTMLInputElement>('.rule-control input')!.click();
    await page.updateComplete;
    expect(root.querySelector('.result')!.textContent).toContain('record is valid');
    expect(root.querySelector('.code')!.textContent).toContain('required rule is removed');
});
it('changes the minimum-length definition while retaining the value', async () => {
    const page = await openExplorer('#minLength');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    await editField(catalog.shadowRoot!, 'longCode', 'ABC');
    catalog.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    await catalog.updateComplete;
    const rule = catalog.shadowRoot!.querySelector<HTMLSelectElement>('.minimum-rule')!;
    rule.value = '2'; rule.dispatchEvent(new Event('change'));
    await catalog.updateComplete; await page.updateComplete;
    expect(catalog.shadowRoot!.querySelector('.result')!.textContent).toContain('Valid');
    expect(catalog.shadowRoot!.querySelector('.focused-state')!.textContent).toContain('ABC');
    expect(page.shadowRoot!.querySelector('.code')!.textContent).toContain('.minLength(2)');
    page.shadowRoot!.querySelector<HTMLAnchorElement>('.modifier-list a[href="#minLength"]')!.click();
    await page.updateComplete;
    expect(page.shadowRoot!.querySelector('.code')!.textContent).toContain('.minLength(2)');
});

it('summarizes semantic state and keeps the JSON inspector collapsed', async () => {
    const page = await openExplorer('#visibleWhen');
    await editField(page.shadowRoot!, 'fulfillment', 'pickup');
    await page.updateComplete;
    expect(page.shadowRoot!.querySelector('.model .state-summary')!.textContent).toContain('Hidden · Optional');
    expect(page.shadowRoot!.querySelector('.model details')!.hasAttribute('open')).toBe(false);
});
it('explains actual sort precedence without requiring a JSON read', async () => {
    const page = await openExplorer('#compareFunction');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const table = catalog.shadowRoot!.querySelector('fdl-table') as any;
    await table.updateComplete;
    await table.recordset.requestUpdate();
    table.shadowRoot.querySelector('button[title="Sort by Last name"]').click();
    await table.recordset.requestUpdate(); await catalog.updateComplete;
    expect(catalog.shadowRoot!.querySelector('.state-summary')!.textContent).toContain('Sorted by Last name ↑');
    expect(catalog.shadowRoot!.querySelector('.state-summary')!.textContent).toContain('4 of 4');
    expect(catalog.shadowRoot!.querySelector('.focused-state details')!.hasAttribute('open')).toBe(false);
});

it('exposes an out-of-list selection and clears it only on request', async () => {
    const page = await openExplorer('#options');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    await editField(catalog.shadowRoot!, 'department', 'finance');
    await new Promise(resolve => setTimeout(resolve, 0));
    await catalog.updateComplete;
    const explanation = catalog.shadowRoot!.querySelector('.selection-explanation')!;
    expect(explanation.textContent).toContain('no longer among the available choices');
    expect(explanation.textContent).toContain('Katherine Johnson');
    expect(explanation.textContent).toContain('grace');
    catalog.shadowRoot!.querySelector<HTMLButtonElement>('.clear-selection')!.click();
    await catalog.updateComplete;
    expect(explanation.textContent).toContain('No assignee is selected');
    const state = JSON.parse(catalog.shadowRoot!.querySelector('.focused-state pre')!.textContent!);
    expect(state.assignee).toBe('');
});

it('compares validator boundary cases using the same FDL rule', async () => {
    const page = await openExplorer('#validator');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const rows = [...catalog.shadowRoot!.querySelectorAll('.case-comparison tbody tr')];
    expect(rows).toHaveLength(5);
    expect(rows[2].textContent).toContain('PRJ-1234Valid');
    expect(rows[3].textContent).toContain('must look like PRJ-1234');
});
it('compares prefix and substring matching and updates the executable rule', async () => {
    const page = await openExplorer('#filter');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const rows = catalog.shadowRoot!.querySelectorAll('.case-comparison tbody tr');
    expect(rows[2].textContent).toBe('MargaretNo matchMatch');
    await editField(catalog.shadowRoot!, 'matchRule', 'contains');
    await catalog.updateComplete; await page.updateComplete;
    expect(page.shadowRoot!.querySelector('.code')!.textContent).toContain('.includes(');
    const table = catalog.shadowRoot!.querySelector('fdl-table') as any;
    expect(table.recordset.getFieldType('name').match('ar', 'Margaret')).toBe(true);
});

it('connects original currency text to parsed, stored, and formatted representations', async () => {
    const page = await openExplorer('#parser');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const field = catalog.shadowRoot!.querySelector('fdl-field[field="money"]') as any;
    await field.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    const input = field.shadowRoot.querySelector('input') as HTMLInputElement;
    input.value = '$2345.670';
    input.dispatchEvent(new Event('input', {bubbles: true, composed: true}));
    await catalog.updateComplete;
    const stages = [...catalog.shadowRoot!.querySelectorAll('.value-pipeline li')].map(item => item.textContent);
    expect(stages[0]).toContain('$2345.670');
    expect(stages[1]).toContain('2345.67 (number)');
    expect(stages[2]).toContain('2345.67 (number)');
    expect(stages[4]).toContain('$2,345.67');
    input.value = 'bad money';
    input.dispatchEvent(new Event('input', {bubbles: true, composed: true}));
    await catalog.updateComplete;
    expect(catalog.shadowRoot!.querySelector('.value-pipeline')!.textContent).toContain('NaN (number)');
    expect(catalog.shadowRoot!.querySelector('.value-pipeline')!.textContent).toContain('Parsing alone does not validate');
});

import type { FdlSpecializationExperiment } from '../examples/fdl-input/fdl-specialization-experiment';
it('keeps the base and sibling unchanged while specializing a shared form/table definition', async () => {
    const page = await openExplorer('#how-it-works');
    const demo = page.shadowRoot!.querySelector('fdl-specialization-experiment') as FdlSpecializationExperiment;
    await demo.updateComplete;
    const states = () => [...demo.shadowRoot!.querySelectorAll('.variant-state')].map(node => node.textContent);
    expect(states()).toEqual(['Optional · Valid', 'Required · Invalid', 'Optional · Valid']);
    demo.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    await demo.updateComplete;
    expect(states()).toEqual(['Optional · Valid', 'Optional · Valid', 'Optional · Valid']);
    await editField(demo.shadowRoot!, 'base', 'A');
    await demo.updateComplete;
    expect(states()).toEqual(['Optional · Valid', 'Optional · Valid', 'Optional · Invalid']);
    const table = demo.shadowRoot!.querySelector('fdl-table') as any;
    await table.updateComplete;
    await table.recordset.requestUpdate();
    expect(table.recordset.currentPage[0].values).toEqual({base: 'A', required: 'A', sibling: 'A'});
    expect(table.recordset.getFieldType('required').required()).toBe(false);
    expect(table.recordset.getFieldType('sibling').minLength()).toBe(2);
});

import type { FdlLearningPath } from '../examples/fdl-input/fdl-learning-path';
it('builds a single example through parsing, validation, dependencies, and a collection', async () => {
    const page = await openExplorer('#learn');
    const demo = page.shadowRoot!.querySelector('fdl-learning-path') as FdlLearningPath;
    await demo.updateComplete;
    const root = demo.shadowRoot!;
    const next = async () => { root.querySelector<HTMLButtonElement>('.next-lesson')!.click(); await demo.updateComplete; };
    expect(root.querySelector('.lesson-state')!.textContent).toContain('$25.00');
    await next();
    expect(root.querySelector('.lesson-state')!.textContent).toContain('25 (number)');
    await next();
    await editField(root, 'charge', '-1'); await demo.updateComplete;
    expect(root.querySelector('.lesson-state')!.textContent).toContain('Invalid');
    await editField(root, 'charge', ''); await demo.updateComplete;
    expect(root.querySelector('.lesson-state')!.textContent).toContain('Required');
    await next();
    await editField(root, 'method', 'pickup'); await demo.updateComplete;
    expect(root.querySelector('.lesson-state')!.textContent).toContain('Hidden · Optional');
    await next();
    const table = root.querySelector('fdl-table') as any;
    await table.updateComplete; await table.recordset.requestUpdate();
    expect(table.recordset.allRecords).toHaveLength(3);
    expect(table.recordset.allRecords[0].isValid()).toBe(true);
    expect(root.querySelector('details ol')!.children).toHaveLength(5);
    expect(root.querySelector<HTMLButtonElement>('.next-lesson')!.disabled).toBe(true);
});

it('shares filter text between the comparison and the table header', async () => {
    const page = await openExplorer('#filter');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    await editField(catalog.shadowRoot!, 'filterProbe', 'gr');
    await catalog.updateComplete;
    const table = catalog.shadowRoot!.querySelector('fdl-table') as any;
    await table.updateComplete;
    await table.recordset.requestUpdate();
    await table.updateComplete;
    expect(table.shadowRoot.textContent).toContain('Grace');
    expect(table.shadowRoot.textContent).not.toContain('Margaret');
    table.shadowRoot.querySelector('[data-filter-button="name"]').click();
    await table.updateComplete;
    const search = table.shadowRoot.querySelector('[data-filter-input="name"]');
    expect(search.value).toBe('gr');
    search.value = 'ad'; search.dispatchEvent(new Event('input'));
    await catalog.updateComplete;
    const probe = catalog.shadowRoot!.querySelector('fdl-field[field="filterProbe"]') as any;
    await probe.updateComplete;
    expect(probe.shadowRoot.querySelector('input').value).toBe('ad');
});


it('resets the active learning question without losing its rules', async () => {
    const page = await openExplorer('#learn');
    const demo = page.shadowRoot!.querySelector('fdl-learning-path') as FdlLearningPath;
    await demo.updateComplete;
    const root = demo.shadowRoot!;
    const choice = root.querySelector<HTMLSelectElement>('select')!;
    choice.value = '2'; choice.dispatchEvent(new Event('change'));
    await demo.updateComplete;
    await editField(root, 'charge', '-1'); await demo.updateComplete;
    root.querySelector<HTMLButtonElement>('.reset-lesson')!.click();
    await demo.updateComplete;
    expect(root.querySelector('.lesson-state')!.textContent).toContain('25 (number)');
    expect(root.querySelector('.lesson-state')!.textContent).toContain('Required');
});


it('evaluates editable class thresholds at the boundary using the field definition', async () => {
    const page = await openExplorer('#conditionalCellClass');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    await editField(catalog.shadowRoot!, 'classThreshold', '100');
    await editField(catalog.shadowRoot!, 'classAmount', '100');
    await catalog.updateComplete; await page.updateComplete;
    expect(catalog.shadowRoot!.querySelector('.computed')!.textContent).toContain('false');
    expect(page.shadowRoot!.querySelector('.code')!.textContent).toContain('value > 100');
    const table = catalog.shadowRoot!.querySelector('fdl-table') as any;
    await table.updateComplete; await table.recordset.requestUpdate(); await table.updateComplete;
    expect([...table.shadowRoot.querySelectorAll('td.high-value')].map((cell:any) => cell.textContent.trim())).toEqual(['101']);
});
