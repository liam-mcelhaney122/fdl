import { html, render } from 'lit';
import * as ts from 'typescript';
import FieldType from '../field-type.js';
import Record from '../record.js';
import Recordset from '../recordset.js';
import { explorerRecipes } from '../examples/fdl-input/fdl-modifier-explorer';
import { exampleSource, type ExampleSettings } from '../examples/fdl-input/modifier-example-source';

function runExample(name: string, settings: ExampleSettings = {}) {
    const source = exampleSource(name, settings);
    const modules: {[path: string]: any} = {
        'digital-fdl': {FieldType, Record, Recordset},
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
    expect(exampleSource('filter', {filterMode:'contains'}).definition).toContain('.includes(');
});

it('shows the declared default when the Lit clear button is used', () => {
    const {model, container} = runExample('defaultValue');
    container.querySelector('button')!.click();
    expect(model.getField('defaultId')).toBe('Pending assignment');
});

it('generates the next examples through its declared factory', () => {
    const {container} = runExample('exampleValue');
    container.querySelector('button')!.click();
    expect(container.textContent).toContain('Sample contact 4, Sample contact 5, Sample contact 6');
});
