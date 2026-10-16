import '../examples/fdl-input/fdl-delivery-experiment';
import type { FdlDeliveryExperiment } from '../examples/fdl-input/fdl-delivery-experiment';

afterEach(() => document.body.replaceChildren());

it('explores delivery visibility and requiredness without discarding the address', async () => {
    const demo = document.createElement('fdl-delivery-experiment') as FdlDeliveryExperiment;
    document.body.append(demo);
    await demo.updateComplete;
    expect(demo.shadowRoot!.querySelector('.instruction')!.textContent).toBe('Shipping needs an address. Clear it to see the record enforce that rule.');
    const field = demo.shadowRoot!.querySelector('fdl-field[field="fulfillment"]') as any;
    await field.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    const select = field.shadowRoot.querySelector('select') as HTMLSelectElement;
    select.value = 'pickup';
    select.dispatchEvent(new Event('input'));
    select.dispatchEvent(new Event('change'));
    await demo.updateComplete;
    expect(demo.shadowRoot!.querySelector('.instruction')!.textContent).toBe('Enter a five-digit ZIP code to choose a pickup store.');
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
    expect(demo.shadowRoot!.querySelector('.instruction')!.textContent).toBe('Switch to pickup.');
    expect(demo.shadowRoot!.querySelector('.state')!.textContent).toContain('Invalid');
});

it('requires a ZIP before revealing stores and validates pickup against the current choices', async () => {
    const demo = document.createElement('fdl-delivery-experiment') as FdlDeliveryExperiment;
    document.body.append(demo);
    await demo.updateComplete;
    const root = demo.shadowRoot!;
    const storeField = root.querySelector('fdl-field[field="store"]') as any;
    const record = storeField.record;
    function storeVisible() {
        return record.fieldTypeForField('store').visible(record.getField('store'), record);
    }
    await editField(root, 'fulfillment', 'pickup');
    await demo.updateComplete;
    expect(record.isValid()).toBe(false);
    expect(storeVisible()).toBe(false);
    await editField(root, 'zip', '2820');
    await demo.updateComplete;
    expect(storeVisible()).toBe(false);
    expect(record.isValid()).toBe(false);
    await editField(root, 'zip', 'abcde');
    await demo.updateComplete;
    expect(storeVisible()).toBe(false);
    await editField(root, 'zip', '28202');
    await demo.updateComplete;
    await editField(root, 'store', 'uptown');
    await demo.updateComplete;
    expect(storeVisible()).toBe(true);
    expect(record.isValid()).toBe(true);
    expect(root.querySelector('.state')!.textContent).toContain('Uptown store');
    await editField(root, 'zip', '10001');
    await demo.updateComplete;
    expect(record.getField('store')).toBe('uptown');
    expect(record.isValid()).toBe(false);
    expect(root.querySelector('.instruction')!.textContent).toContain('unavailable');
    await editField(root, 'store', 'chelsea');
    await demo.updateComplete;
    expect(record.isValid()).toBe(true);
    await editField(root, 'zip', '01234');
    await demo.updateComplete;
    expect(record.getField('zip')).toBe('01234');
    expect(record.isValid()).toBe(false);
    expect(root.querySelector('.instruction')!.textContent).toContain('No sample stores');
    await editField(root, 'zip', '');
    await demo.updateComplete;
    expect(storeVisible()).toBe(false);
    expect(record.isValid()).toBe(false);
    await editField(root, 'fulfillment', 'ship');
    await demo.updateComplete;
    expect(record.isValid()).toBe(true);
    expect(record.getField('address')).toBe('42 Orchard Street');
    expect(record.getField('store')).toBe('chelsea');
});

it('reveals the FDL delivery model behind the interactive example', async () => {
    const demo = document.createElement('fdl-delivery-experiment') as FdlDeliveryExperiment;
    document.body.append(demo);
    await demo.updateComplete;
    const codeTab = demo.shadowRoot!.querySelector<HTMLButtonElement>('#delivery-code-tab')!;
    codeTab.click();
    await demo.updateComplete;
    expect(codeTab.getAttribute('aria-selected')).toBe('true');
    const codePanel = demo.shadowRoot!.querySelector('#delivery-code-panel')!;
    expect(codePanel.textContent).not.toContain('// delivery-model.ts');
    expect(codePanel.textContent).toContain('export const delivery = new Record');
    expect(codePanel.textContent).not.toContain('// delivery-form.ts');
    expect(codePanel.textContent).toContain("import { delivery } from './delivery-model';");
    expect(codePanel.textContent).toContain('const deliveryMethod = field.label');
    expect(codePanel.textContent).toContain('const shippingAddress = field.label');
    expect(codePanel.textContent).toContain('function whenDeliveryMethodRequiresAddress(record)');
    expect(codePanel.textContent).toContain('.visible(whenDeliveryMethodRequiresAddress)');
    expect(codePanel.textContent).toContain('.required(whenDeliveryMethodRequiresAddress)');
    expect(codePanel.textContent).toContain('<fdl-field .record=${delivery} field="fulfillment"></fdl-field>');
    expect(codePanel.querySelectorAll('.syntax-keyword, .syntax-builtin, .syntax-string').length).toBeGreaterThan(0);
    expect(demo.shadowRoot!.querySelector('#delivery-example-panel')!.hasAttribute('hidden')).toBe(true);
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
    const page = await openExplorer('#visible');
    await editField(page.shadowRoot!, 'fulfillment', 'pickup');
    await page.updateComplete;
    const trace = page.shadowRoot!.querySelector('.dependency-trace')!.textContent!;
    expect(trace).toContain('false');
    expect(trace).toContain('Hidden');
    expect(trace).toContain('42 Orchard Street');
});
it('explains conditional requiredness as the dependency changes', async () => {
    const page = await openExplorer('#required');
    await editField(page.shadowRoot!, 'followUp', 'yes');
    await page.updateComplete;
    expect(page.shadowRoot!.querySelector('.dependency-trace')!.textContent).toContain('true → Required');
    await editField(page.shadowRoot!, 'followUp', 'no');
    await page.updateComplete;
    expect(page.shadowRoot!.querySelector('.dependency-trace')!.textContent).toContain('false → Optional');
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
    const page = await openExplorer('#visible');
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
    expect(catalog.shadowRoot!.querySelector('.state-summary')!.textContent).toContain('6 of 6');
    expect(catalog.shadowRoot!.querySelector('.focused-state details')!.hasAttribute('open')).toBe(false);
});

it('exposes an out-of-list selection and clears it only on request', async () => {
    const page = await openExplorer('#options');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    await editField(catalog.shadowRoot!, 'assignee', 'grace');
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

it('offers email, quantity, and username validator examples', async () => {
    const page = await openExplorer('#validator');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const sections = [...catalog.shadowRoot!.querySelectorAll('.validator-example')];
    expect(sections.map(section => section.querySelector('h3')!.textContent)).toEqual(['Email address', 'Order quantity', 'Username']);
    for (const section of sections) {
        section.querySelector<HTMLButtonElement>('button')!.click();
    }
    await catalog.updateComplete;
    const fields = [...catalog.shadowRoot!.querySelectorAll('fdl-field')] as any[];
    await Promise.all(fields.map(field => field.updateComplete));
    expect(fields[0].shadowRoot.textContent).toContain('must be a valid email address');
    expect(fields[1].shadowRoot.textContent).toContain('must be a whole number');
    expect(fields[2].shadowRoot.textContent).toContain('must start with a letter');
    expect(fields[2].shadowRoot.textContent).toContain('must contain only letters, numbers, or underscores');
});
it('compares prefix and substring matching and updates the executable rule', async () => {
    const page = await openExplorer('#filter');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    expect(catalog.shadowRoot!.querySelector('.case-comparison')).toBeNull();
    const initialTable = catalog.shadowRoot!.querySelector('fdl-table') as any;
    expect(initialTable.recordset.getFieldType('name').match('ar', 'Margaret')).toBe(false);
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


it('highlights fixed weekday expenses above the adjustable threshold and formats dollars', async () => {
    const page = await openExplorer('#cellClass');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog[modifier="cellClass"]') as FdlModifierCatalog;
    await catalog.updateComplete;
    expect(catalog.shadowRoot!.querySelector('fdl-field[field="classAmount"]')).toBeNull();
    const table = catalog.shadowRoot!.querySelector('fdl-table') as any;
    const rows = async () => {
        await table.recordset.requestUpdate();await table.updateComplete;
        return Array.from(table.shadowRoot.querySelectorAll('tbody tr') as NodeListOf<HTMLTableRowElement>);
    };
    let rendered = await rows();
    expect(rendered.map(row=>row.querySelector('td')!.textContent!.trim())).toEqual(['Monday','Tuesday','Wednesday','Thursday','Friday']);
    expect(rendered.map(row=>row.querySelectorAll('td')[1].textContent!.trim())).toEqual(['$85.50','$142.75','$60.00','$100.00','$125.25']);
    const highlighted = () => [...table.shadowRoot.querySelectorAll('td.high-value')].map((cell:any)=>cell.textContent.trim());
    expect(highlighted()).toEqual(['$142.75','$125.25']);
    expect(table.shadowRoot.querySelectorAll('td.amount-cell')).toHaveLength(5);
    await editField(catalog.shadowRoot!, 'classThreshold', '125.25');
    await catalog.updateComplete;await page.updateComplete;rendered=await rows();
    expect(highlighted()).toEqual(['$142.75']);
    expect(rendered.map(row=>row.querySelectorAll('td')[1].textContent!.trim())).toEqual(['$85.50','$142.75','$60.00','$100.00','$125.25']);
    expect(page.shadowRoot!.getElementById('cellClass')!.querySelector('.code')!.textContent).toContain('value > 125.25');
});

it('sorts the live T-shirt size column in size order and highlights all comparator calls',async()=>{
    const page=await openExplorer('#compareFunction');
    const catalog=page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;await catalog.updateComplete;
    const table=catalog.shadowRoot!.querySelector('fdl-table') as any;await table.updateComplete;await table.recordset.requestUpdate();
    table.shadowRoot.querySelector('button[title="Sort by T-shirt size"]').click();
    await table.recordset.requestUpdate();await table.updateComplete;
    expect([...table.shadowRoot.querySelectorAll('tbody tr')].map((row:any)=>row.querySelectorAll('td')[2].textContent.trim())).toEqual(['XS','S','M','L','XL','XXL']);
    const focused=page.shadowRoot!.querySelectorAll('.code .focused-line');
    expect([...focused].filter(line=>line.textContent!.includes('.compareFunction('))).toHaveLength(3);
    expect(catalog.shadowRoot!.querySelector('.case-comparison')!.textContent).toContain('XS → S → M → L → XL → XXL');
});


it('keeps a shared selection in both function and async-function options after the department changes', async () => {
    const page = await openExplorer('#options');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const fields = ['assignee', 'asyncAssignee'].map(name => catalog.shadowRoot!.querySelector(`fdl-field[field="${name}"]`) as any);
    for (const department of ['engineering', 'finance', 'engineering']) {
        if (department !== 'engineering' || fields[0].record.getField('department') !== department) {
            await editField(catalog.shadowRoot!, 'department', department);
        }
        await Promise.all(fields.map(field => field.record.fieldTypeForField(field.field).options(field.record)));
        await Promise.all(fields.map(field => field.updateComplete));
        await catalog.updateComplete;
        for (const field of fields) {
            const select = field.shadowRoot.querySelector('select') as HTMLSelectElement;
            expect(select.value).toBe('margaret');
            expect(select.selectedOptions[0].textContent).toBe('Margaret Hamilton');
            expect(field.record.getField(field.field)).toBe('margaret');
        }
    }
    expect(page.shadowRoot!.querySelector('.code')!.textContent).toContain('.options(async record =>');
    expect(page.shadowRoot!.querySelector('.code')!.textContent).toContain('.options(record =>');
});
