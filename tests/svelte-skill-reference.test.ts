import { flushSync, mount, unmount } from 'svelte';
import { compile } from 'svelte/compiler';
import * as adapter from '../adapters/svelte';
import FieldTypeBuilder from '../field-type-builder';
import Record from '../record.js';
import Recordset from '../recordset.js';

const { readFileSync } = jest.requireActual('fs');
const { transformSync } = jest.requireActual('@babel/core');

const reference: string = readFileSync('.agents/skills/fdl/references/svelte.md', 'utf8');
const examples = [...reference.matchAll(/```svelte\n([\s\S]*?)```/g)].map(match => match[1]);

// Map the package imports in the reference to this checkout.
const packageModules: { [specifier: string]: () => unknown } = {
    '@pmcelhaney/fdl': () => jest.requireActual('../index.js'),
    '@pmcelhaney/fdl/adapters/svelte': () => jest.requireActual('../adapters/svelte'),
    '@pmcelhaney/fdl/adapters/svelte/FdlField.svelte': () =>
        jest.requireActual('../adapters/svelte/FdlField.svelte'),
};

function requireForExample(specifier: string) {
    if (packageModules[specifier]) return packageModules[specifier]();
    if (specifier === 'svelte' || specifier.startsWith('svelte/')) {
        return jest.requireActual(specifier);
    }
    throw new Error(`The reference example imports an unexpected module: ${specifier}`);
}

/** Compile a Svelte example from the reference and return its component. */
function componentFrom(source: string, name: string) {
    const { js, warnings } = compile(source, { filename: `${name}.svelte`, generate: 'client' });
    expect(warnings.map((warning: { message: string }) => warning.message)).toEqual([]);
    const { code } = transformSync(js.code, {
        babelrc: false,
        configFile: false,
        filename: `${name}.js`,
        presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
    });
    const module = { exports: {} as { default?: unknown } };
    new Function('require', 'module', 'exports', code)(requireForExample, module, module.exports);
    return module.exports.default as Parameters<typeof mount>[0];
}

const mounted: Array<ReturnType<typeof mount>> = [];

function render(component: Parameters<typeof mount>[0], props: object = {}) {
    const target = document.createElement('div');
    document.body.append(target);
    mounted.push(mount(component, { target, props }));
    flushSync();
    return target;
}

async function settle() {
    await new Promise(resolve => setTimeout(resolve, 0));
    flushSync();
}

function type(input: HTMLInputElement, text: string) {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    flushSync();
}

afterEach(() => {
    mounted.splice(0).forEach(component => unmount(component));
    document.body.replaceChildren();
    delete (globalThis as { fetch?: unknown }).fetch;
});

describe('Svelte skill reference', () => {
    it('exists and covers every exported store, action, and the field component', () => {
        const exported = ['recordStore', 'recordsetStore', 'fieldStore', 'fieldControl'];
        exported.forEach(name => {
            expect(adapter).toHaveProperty(name);
            expect(reference).toContain(`\`${name}`);
        });
        expect(reference).toContain('FdlField');
        expect(reference).toContain('@pmcelhaney/fdl/adapters/svelte/FdlField.svelte');
        expect(reference).toContain('svelte@^5.20.0');
        expect(examples).toHaveLength(3);
    });

    it('shows errors on submit and loads dependent options as the main example says', async () => {
        const fetch = jest.fn(async (url: string) => ({
            json: async () =>
                url.endsWith('28202') ? [{ text: 'Uptown store', value: 'uptown' }] : [],
        }));
        (globalThis as { fetch?: unknown }).fetch = fetch;
        const target = render(componentFrom(examples[0], 'OrderForm'));
        const form = target.querySelector('form')!;
        const [name, zip] = [...target.querySelectorAll('input')];
        const select = target.querySelector('select')!;

        expect(form.noValidate).toBe(true);
        expect(target.querySelector('.validation-error')).toBeNull();
        expect(select.disabled).toBe(true);
        expect(select.options[0].textContent).toBe('Choose a store');
        expect(fetch).not.toHaveBeenCalled();

        form.dispatchEvent(new Event('submit', { cancelable: true }));
        flushSync();
        expect(name.getAttribute('aria-invalid')).toBe('true');
        expect(name.getAttribute('aria-describedby')).toBe(
            target.querySelector(`#${name.id} ~ .validation-error`)!.id
        );
        expect(target.textContent).toContain('Full name is required');
        expect(target.querySelector('[role="status"]')!.textContent).toBe('');

        type(name, 'Ada');
        expect(name.hasAttribute('aria-invalid')).toBe(false);
        type(zip, '28a202');
        expect(zip.value).toBe('28202');
        expect(fetch).toHaveBeenCalledWith('/api/stores?zip=28202');
        expect(select.getAttribute('aria-busy')).toBe('true');
        await settle();
        await settle();
        expect(select.disabled).toBe(false);
        expect([...select.options].map(option => option.value)).toEqual(['', 'uptown']);

        select.value = 'uptown';
        select.dispatchEvent(new Event('change'));
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        flushSync();
        expect(target.querySelector('.validation-error')).toBeNull();
        expect(target.querySelector('[role="status"]')!.textContent).toBe('Order placed.');
    });

    it('builds custom markup with fieldStore and fieldControl', () => {
        const record = new Record(
            {
                amount: new FieldTypeBuilder<number | null>()
                    .label('Amount')
                    .required()
                    .parser(value => (value === '' ? null : Number(value))),
            },
            { amount: 12 }
        );
        const target = render(componentFrom(examples[1], 'AmountField'), { record });
        const input = target.querySelector('input')!;
        expect(target.querySelector('label')!.htmlFor).toBe(input.id);
        expect(input.value).toBe('12');
        expect(input.required).toBe(true);

        type(input, '');
        expect(record.getField('amount')).toBeNull();
        const error = target.querySelector('.validation-error')!;
        expect(error.textContent).toBe('Amount is required');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(input.getAttribute('aria-describedby')).toBe(error.id);
    });

    it('renders a Recordset table that follows row edits', async () => {
        const recordset = new Recordset(
            {
                item: new FieldTypeBuilder().label('Item'),
                amount: new FieldTypeBuilder<number>().label('Amount').parser(Number),
            },
            [
                { item: 'Paper', amount: 3 },
                { item: 'Ink', amount: 4 },
            ]
        );
        const target = render(componentFrom(examples[2], 'AmountTable'), { recordset });
        await recordset.updating;
        await settle();
        const rows = [...target.querySelectorAll('tbody tr')];
        expect(rows.map(row => row.querySelector('th')!.textContent)).toEqual(['Paper', 'Ink']);
        expect(target.querySelector('tfoot td')!.textContent).toBe('7');

        type(rows[1].querySelector('input')!, '10');
        expect(target.querySelector('tfoot td')!.textContent).toBe('13');
        expect(target.querySelector('tfoot td')!.className).toContain('numeric');
    });
});
