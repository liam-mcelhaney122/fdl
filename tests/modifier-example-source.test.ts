import { inputTypes, type inputType } from '../types/input-types.types';
import { html, render } from 'lit';
import * as ts from 'typescript';
import FieldType from '../field-type.js';
import { field } from '../index';
import Record from '../record.js';
import Recordset from '../recordset.js';
import { explorerRecipes } from '../examples/fdl-input/fdl-modifier-explorer';
import { exampleSource, type ExampleSettings } from '../examples/fdl-input/modifier-example-source';

function runExample(name: string, settings: ExampleSettings = {}) {
    const source = exampleSource(name, settings);
    const modules: {[path: string]: any} = {
        'digital-fdl': {field, Record, Recordset},
        lit: {html, render},
        './fdl-field': {}, './fdl-table': {},
    };
    function execute(code: string) {
        const compiled = ts.transpileModule(code, {
            compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
        }).outputText;
        const exports = {};
        new Function('require', 'exports', compiled)((path: string) => {
            if (!(path in modules)) throw new Error(`Unresolved example import: ${path}`);
            return modules[path];
        }, exports);
        return exports as any;
    }
    const modelModule = execute(source.definition);
    expect(modelModule[source.modelName]).toBeDefined();
    modules[`./${source.modelFile}`] = modelModule;
    // Separate module scopes ensure the UI can only see explicitly imported names.
    const uiModule = execute(`${source.ui}\nexport {container, update};`);
    return {model: modelModule[source.modelName], ...uiModule} as {model: any; container: HTMLElement; update: () => void};
}

afterEach(() => { document.body.innerHTML = ''; });

it.each(explorerRecipes.map(recipe => recipe.name))('runs the %s model and Lit UI as separate modules', async name => {
    const source = exampleSource(name);
    expect(source.definition).not.toMatch(/FieldTypeBuilder|valueOf\(/);
    const {model, container} = runExample(name);
    expect(model).toBeInstanceOf(exampleSource(name).kind === 'Recordset' ? Recordset : Record);
    expect(container.textContent!.trim().length + container.querySelectorAll('fdl-field, fdl-table').length).toBeGreaterThan(0);
    for (const field of container.querySelectorAll('fdl-field')) {
        expect((field as any).record).toBe(model);
        expect(model.fieldTypeForField(field.getAttribute('field'))).toBeInstanceOf(FieldType);
    }
    const table = container.querySelector('fdl-table');
    if (table) expect((table as any).recordset).toBe(model);
    await Promise.resolve();
});

it('validates the same required record rendered by Lit and rerenders after edits', () => {
    const {model, container} = runExample('required');
    container.querySelector('button')!.click();
    expect(container.querySelector('[role=status]')!.textContent).toContain('required');
    model.setField('name', 'Ada');
    expect(container.querySelector('[role=status]')!.textContent).toContain('Valid.');
    expect((container.querySelector('fdl-field') as any).showValidationErrors).toBe(true);
});

it('includes changed rules in complete working definitions', () => {
    expect(runExample('required', {required:false}).model.isValid()).toBe(true);
    const {model} = runExample('minLength', {minimum:2});
    model.setField('longCode', 'ab');
    expect(model.isValid()).toBe(true);
    expect(runExample('rowCount', {rows:10}).model.fieldTypeForField('comments').rowCount()).toBe(10);
    expect(exampleSource('filter', {filterMode:'contains'}).definition).toContain('.includes(');
});

it('shows the declared default when the Lit clear button is used', () => {
    const {model, container} = runExample('defaultValue');
    container.querySelector('button')!.click();
    expect(model.getField('documentTitle')).toBe('Untitled document');
});

it('exports the same weekday expenses, dollar formatting, and strict threshold', async () => {
    const {model, container} = runExample('cellClass', {threshold:125.25});
    await model.requestUpdate();
    expect(model.getData()).toEqual([
        {day:'Monday',amount:85.5}, {day:'Tuesday',amount:142.75},
        {day:'Wednesday',amount:60}, {day:'Thursday',amount:100}, {day:'Friday',amount:125.25},
    ]);
    expect([...container.querySelectorAll('fdl-column')].map(column=>column.getAttribute('field'))).toEqual(['day','amount']);
    expect(model.createRecord({day:'Monday',amount:85.5}).getFormattedField('amount','print')).toBe('$85.50');
    expect(model.getFieldType('amount').cellClasses(125.25)).toEqual(['amount-cell']);
    expect(model.getFieldType('amount').cellClasses(142.75)).toEqual(['amount-cell', 'high-value', 'over-limit']);
});

it('exports a named size comparator and sorts sizes in domain order rather than alphabetically', async () => {
    const {model,container}=runExample('compareFunction');
    const size=model.getFieldType('shirtSize');
    expect(['XL','S','XXL','L','XS','M'].sort((a,b)=>size.compare(a,b))).toEqual(['XS','S','M','L','XL','XXL']);
    expect(size.compare('M','M')).toBe(0);
    expect([...container.querySelectorAll('fdl-column')].map(column=>column.getAttribute('field'))).toEqual(['firstName','lastName','shirtSize']);
    const source=exampleSource('compareFunction');
    expect(source.definition).toContain('function compareShirtSizes(left, right)');
    expect(source.definition).toContain('.compareFunction(compareShirtSizes)');
});


it('shows how the same empty value affects required and optional field validation', () => {
    const {model, container} = runExample('emptyWhen');
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelectorAll('fdl-field')).toHaveLength(2);
    for (const field of ['emptyCode', 'optionalEmptyCode']) {
        for (const [value, empty] of [['N/A', true], ['REF-42', false], ['   ', true], ['', true]] as const) {
            model.setField(field, value);
            const status = container.querySelector(`[role=status][data-field="${field}"]`)!.textContent!;
            expect(status).toContain(empty ? 'This field is considered empty' : 'This field is not considered empty');
            expect(status).toContain(field === 'emptyCode' && empty ? 'Invalid: Reference is required.' : 'Valid:');
            expect(model.isValid(field)).toBe(field === 'optionalEmptyCode' || !empty);
            expect(model.getField(field)).toBe(value);
        }
    }
    expect(model.fieldTypeForField('emptyCode').required(model)).toBe(true);
    expect(model.fieldTypeForField('optionalEmptyCode').required(model)).toBe(false);
});


it('exports working function and async options with a shared value that stays selected', async () => {
    const {model, container} = runExample('options');
    for (const department of ['engineering', 'finance']) {
        model.setField('department', department);
        for (const field of ['assignee', 'asyncAssignee']) {
            const choices = await model.fieldTypeForField(field).options(model);
            expect(choices).toContainEqual({text:'Margaret Hamilton', value:'margaret'});
            expect(choices.map((choice: any) => choice.value)).toContain(department === 'engineering' ? 'grace' : 'katherine');
            expect(model.getField(field)).toBe('margaret');
        }
    }
    expect(container.querySelectorAll('fdl-field')).toHaveLength(3);
});


it('exports a T-shirt order table with sorting disabled for sizes', async () => {
    const {model, container} = runExample('sortable');
    await model.requestUpdate();
    expect(model.getData()).toHaveLength(6);
    expect(model.getFieldType('shirtSize').sortable()).toBe(false);
    expect(model.getFieldType('firstName').sortable()).toBe(true);
    expect([...container.querySelectorAll('fdl-column')].map(column => column.getAttribute('field'))).toEqual(['firstName', 'lastName', 'shirtSize']);
});


it('renders conditional invoice balances without changing the stored number', async () => {
    const {model, container, update} = runExample('template');
    await model.requestUpdate();
    update();
    const first = model.allRecords[0];
    const cell = document.createElement('div');
    render(first.print('balance'), cell);
    expect(cell.querySelector('.due-balance')!.textContent).toBe('$1,250.00Payment due');
    expect(first.getField('balance')).toBe(1250);
    first.setField('balance', 0);
    render(first.print('balance'), cell);
    expect(cell.querySelector('.paid-balance')!.textContent).toBe('✓ Paid in full');
    expect(first.getField('balance')).toBe(0);
    first.setField('balance', 85.5);
    render(first.print('balance'), cell);
    expect(cell.querySelector('.due-balance')!.textContent).toBe('$85.50Payment due');
    expect(container.querySelector('fdl-field')).toBeNull();
    expect(exampleSource('template').styles).toContain('.paid-balance');
});


it.each(inputTypes)('exports a working definition and Lit binding for input type %s', inputType => {
    const {model, container} = runExample('type', {inputType:inputType as inputType});
    expect(model.fieldTypeForField('inputValue').type()).toBe(inputType);
    expect((container.querySelector('fdl-field') as any).record).toBe(model);
    if (['number', 'range'].includes(inputType)) {
        model.parseAndSetField('inputValue', '63');
        expect(model.getField('inputValue')).toBe(63);
    }
});


it('demonstrates simple email validation and accumulated quantity and username rules', () => {
    const {model, container} = runExample('validator');
    const cases: {[field: string]: [unknown, boolean][]} = {
        email: [['ada@',false], ['ada@example',false], ['a@@example.com',false], ['ada lovelace@example.com',false], ['ada@example.com',true], ['ada+notes@example.co.uk',true]],
        orderQuantity: [[2.5,false], [0,false], [13,false], [1,true], [12,true]],
        username: [['7bad-name',false], ['ada-name',false], ['7ada',false], ['ada_7',true]],
    };
    for (const [field, values] of Object.entries(cases)) {
        for (const [value, valid] of values) {
            model.setField(field, value);
            expect(model.isValid(field)).toBe(valid);
        }
    }
    model.setField('username','7bad-name');
    expect(model.readableFieldErrors('username')).toHaveLength(2);
    for (const button of container.querySelectorAll('button')) button.click();
    expect(container.querySelectorAll('fdl-field')).toHaveLength(3);
    expect([...container.querySelectorAll('[role=status]')].map(status => status.textContent)).toEqual([
        expect.stringContaining('Valid.'), expect.stringContaining('Valid.'), expect.stringContaining('must start with a letter'),
    ]);
    for (const field of container.querySelectorAll('fdl-field')) expect((field as any).showValidationErrors).toBe(true);
});

it('exports rowClass declarations with fixed and returned array classes', async () => {
    const {model} = runExample('rowClass');
    await model.requestUpdate();
    const status = model.getFieldType('status');
    expect(status.rowClasses('Disputed')).toEqual(['invoice-row', 'disputed-row', 'needs-review']);
    expect(status.rowClasses('Paid')).toEqual(['invoice-row']);
});

it('shows both required forms and validates conditional notes in the runnable UI', () => {
    const {model,container} = runExample('required');
    model.setField('name','Ada Lovelace');
    model.setField('followUp','yes');
    container.querySelector('button')!.click();
    expect(model.isValid()).toBe(false);
    expect(container.querySelector('[role="status"]')!.textContent).toContain('Follow-up notes');
    model.setField('followUp','no');
    expect(model.isValid()).toBe(true);
    expect(container.querySelector('[role="status"]')!.textContent).toContain('Valid.');
});

it('exports unconditional and conditional disabled rules together', () => {
    const {model} = runExample('disabled');
    expect(model.fieldTypeForField('lockedId').isDisabled(undefined, model)).toBe(true);
    expect(model.fieldTypeForField('budget').isDisabled(undefined, model)).toBe(false);
    model.setField('approvalStatus','approved');
    expect(model.fieldTypeForField('budget').isDisabled(undefined, model)).toBe(true);
    expect(model.getField('budget')).toBe(5000);
});
