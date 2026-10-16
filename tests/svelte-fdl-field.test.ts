import { flushSync, mount, unmount } from 'svelte';
import { compile } from 'svelte/compiler';
import FdlField from '../adapters/svelte/FdlField.svelte';
import RecordSummary from './svelte-fixtures/RecordSummary.svelte';
import FieldTypeBuilder from '../field-type-builder';
import Record from '../record.js';
import { reactiveProps } from './jest-helpers/reactive-props.svelte.js';

type Option = { text: string; value: string };

const mounted: Array<ReturnType<typeof mount>> = [];

function render(props: { [key: string]: unknown }) {
    const target = document.createElement('div');
    document.body.append(target);
    const component = mount(FdlField, { target, props });
    mounted.push(component);
    flushSync();
    return target;
}

async function settle() {
    await new Promise(resolve => setTimeout(resolve, 0));
    flushSync();
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => {
        resolve = done;
    });
    return { promise, resolve };
}

afterEach(() => {
    mounted.splice(0).forEach(component => unmount(component));
    document.body.replaceChildren();
});

it('compiles without Svelte warnings', () => {
    const { readFileSync } = jest.requireActual('fs');
    const file = 'adapters/svelte/FdlField.svelte';
    const { warnings } = compile(readFileSync(file, 'utf8'), { filename: file });
    expect(warnings).toEqual([]);
});

describe('<FdlField>', () => {
    it('chooses an input, textarea, or select from field metadata', () => {
        const record = new Record(
            {
                name: new FieldTypeBuilder(),
                notes: new FieldTypeBuilder().rowCount(4),
                status: new FieldTypeBuilder().options([{ text: 'Open', value: 'open' }]),
            },
            { name: '', notes: '', status: 'open' }
        );
        expect(render({ record, field: 'name' }).querySelector('input')).not.toBeNull();
        const notes = render({ record, field: 'notes' }).querySelector('textarea')!;
        expect(notes.rows).toBe(4);
        expect(render({ record, field: 'status' }).querySelector('select')).not.toBeNull();
    });

    it('gives each instance a stable unique control id and associates its label', () => {
        const fieldType = new FieldTypeBuilder().label('Full name').required();
        const first = new Record({ name: fieldType }, { name: 'Ada' });
        const firstTarget = render({ record: first, field: 'name' });
        const secondTarget = render({
            record: new Record({ name: fieldType }, { name: 'Grace' }),
            field: 'name',
        });
        const firstInput = firstTarget.querySelector('input')!;
        const secondInput = secondTarget.querySelector('input')!;
        const label = firstTarget.querySelector('label')!;
        const originalId = firstInput.id;

        expect(firstInput.id).not.toBe(secondInput.id);
        expect(firstInput.id).not.toBe('name');
        expect(label.htmlFor).toBe(firstInput.id);
        expect(label.textContent).toContain('Full name');
        expect(label.querySelector('.required')).not.toBeNull();
        expect(firstInput.required).toBe(true);
        expect(document.querySelectorAll(`#${firstInput.id}`)).toHaveLength(1);

        first.parseAndSetField('name', 'Augusta Ada');
        flushSync();
        expect(firstTarget.querySelector('input')).toBe(firstInput);
        expect(firstInput.id).toBe(originalId);
    });

    it('synchronizes values in both directions and parses edits', () => {
        const record = new Record(
            { age: new FieldTypeBuilder<number>().parser(Number) },
            { age: 36 }
        );
        const input = render({ record, field: 'age' }).querySelector('input')!;
        expect(input.value).toBe('36');
        input.value = '42';
        input.dispatchEvent(new Event('input'));
        expect(record.getField('age')).toBe(42);
        record.setField('age', 7);
        flushSync();
        expect(input.value).toBe('7');
    });

    it('resolves field settings from the record as dependencies change', () => {
        const record = new Record(
            {
                text: new FieldTypeBuilder<string>()
                    .label(r => `${r.getField('prefix')} name`)
                    .placeholder(r => `${r.getField('prefix')}…`)
                    .type(r => (r.getField('locked') ? 'password' : 'text'))
                    .required(r => r.getField('locked'))
                    .disabled(r => r.getField('locked'))
                    .maxLength(r => r.getField('maximum')),
                prefix: new FieldTypeBuilder(),
                locked: new FieldTypeBuilder(),
                maximum: new FieldTypeBuilder(),
            },
            { text: 'Ada', prefix: 'Given', locked: false, maximum: 10 }
        );
        const target = render({ record, field: 'text' });
        const input = target.querySelector('input')!;
        expect(input.placeholder).toBe('Given…');
        expect(input.required).toBe(false);
        record.setFields({ prefix: 'Family', locked: true, maximum: 8 });
        flushSync();
        expect(target.querySelector('label')!.textContent).toContain('Family name');
        expect(input.placeholder).toBe('Family…');
        expect(input.type).toBe('password');
        expect(input.required).toBe(true);
        expect(input.disabled).toBe(true);
        expect(input.maxLength).toBe(8);
    });

    it('preserves editing text and caret while parsing, then formats on blur', () => {
        const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
        const record = new Record(
            {
                money: new FieldTypeBuilder<number>()
                    .formatter(value => currency.format(value))
                    .parser(value => Number(String(value).replace(/[$,]/g, ''))),
            },
            { money: 1000 }
        );
        const input = render({ record, field: 'money' }).querySelector('input')!;
        expect(input.value).toBe('$1,000.00');
        input.focus();
        for (const [text, value] of [
            ['', 0],
            ['12.', 12],
            ['12.30', 12.3],
        ] as const) {
            input.value = text;
            input.setSelectionRange(text.length, text.length);
            input.dispatchEvent(new Event('input'));
            flushSync();
            expect(input.value).toBe(text);
            expect(input.selectionStart).toBe(text.length);
            expect(record.getField('money')).toBe(value);
        }
        input.value = '192.30';
        input.setSelectionRange(2, 2);
        input.dispatchEvent(new Event('input'));
        flushSync();
        expect(input.value).toBe('192.30');
        expect(input.selectionStart).toBe(2);
        input.blur();
        expect(input.value).toBe('$192.30');
        record.setField('money', 45.6);
        flushSync();
        expect(input.value).toBe('$45.60');
    });

    it('filters masked input before parsing and keeps the caret', () => {
        const record = new Record(
            { value: new FieldTypeBuilder().inputMask(/[0-9.]/) },
            { value: '' }
        );
        const input = render({ record, field: 'value' }).querySelector('input')!;
        input.value = '1a😀4.2b3';
        input.setSelectionRange(8, 8);
        input.dispatchEvent(new InputEvent('input', { inputType: 'insertFromPaste' }));
        flushSync();
        expect(input.value).toBe('14.23');
        expect(input.selectionStart).toBe(4);
        expect(record.getField('value')).toBe('14.23');
    });

    it('renders a labeled semantic output for a read-only field', () => {
        const record = new Record(
            {
                status: new FieldTypeBuilder()
                    .label('Status')
                    .readOnly()
                    .required()
                    .formatter(value => String(value).toUpperCase()),
            },
            { status: 'approved' }
        );
        const target = render({ record, field: 'status' });
        const label = target.querySelector('label')!;
        const output = target.querySelector('output')!;
        expect(target.querySelector('input')).toBeNull();
        expect(output.textContent).toBe(record.print('status'));
        expect(label.htmlFor).toBe(output.id);
        expect(label.querySelector('.required')).toBeNull();
        expect(output.getAttribute('aria-labelledby')).toBe(label.id);
    });

    it('renders nothing for a hidden field', () => {
        const record = new Record(
            { secret: new FieldTypeBuilder().label('Secret').visible(false) },
            { secret: '' }
        );
        const target = render({ record, field: 'secret' });
        expect(target.querySelector('label, input, select, textarea, output')).toBeNull();
    });

    it('lets the application control when synchronous model errors are exposed', () => {
        const record = new Record(
            { name: new FieldTypeBuilder().label('Full name').required() },
            { name: '' }
        );
        const target = document.createElement('div');
        document.body.append(target);
        const props = reactiveProps({
            record,
            field: 'name',
            showValidationErrors: false,
            describedby: 'field-help',
        });
        mounted.push(mount(FdlField, { target, props }));
        flushSync();
        const input = target.querySelector('input')!;
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        expect(input.getAttribute('aria-describedby')).toBe('field-help');
        expect(target.querySelector('.validation-error')).toBeNull();

        props.showValidationErrors = true;
        flushSync();
        const error = target.querySelector('.validation-error') as HTMLElement;
        expect(error.textContent).toContain('Full name is required');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(input.getAttribute('aria-describedby')!.split(' ')).toEqual([
            'field-help',
            error.id,
        ]);

        record.parseAndSetField('name', 'Ada');
        flushSync();
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        expect(input.getAttribute('aria-describedby')).toBe('field-help');
        expect(target.querySelector('.validation-error')).toBeNull();
    });

    it('shows busy, disabled loading state and ignores stale option results', async () => {
        const first = deferred<Option[]>();
        const second = deferred<Option[]>();
        const fetch = jest.fn((record: Record<any>) =>
            record.getField('zip') === '28202' ? first.promise : second.promise
        );
        const record = new Record(
            {
                zip: new FieldTypeBuilder(),
                store: new FieldTypeBuilder()
                    .label('Pickup store')
                    .options({ fields: ['zip'], fetch }),
            },
            { zip: '28202', store: '' }
        );
        const target = render({ record, field: 'store' });
        const select = target.querySelector('select')!;
        expect(select.disabled).toBe(true);
        expect(select.getAttribute('aria-busy')).toBe('true');
        expect(target.querySelector('.options-spinner')).not.toBeNull();
        expect(target.querySelector('[role="status"]')!.textContent).toContain('Loading choices');

        record.setField('zip', '10001');
        second.resolve([{ text: 'Chelsea store', value: 'chelsea' }]);
        await settle();
        expect(select.disabled).toBe(false);
        expect(select.hasAttribute('aria-busy')).toBe(false);
        expect(target.querySelector('.options-spinner')).toBeNull();
        expect([...select.options].map(option => option.value)).toEqual(['chelsea']);

        first.resolve([{ text: 'Uptown store', value: 'uptown' }]);
        await settle();
        expect([...select.options].map(option => option.value)).toEqual(['chelsea']);

        select.value = 'chelsea';
        select.dispatchEvent(new Event('change'));
        expect(record.getField('store')).toBe('chelsea');
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('renders a control-owned prompt and defers options while disabled', async () => {
        const fetch = jest.fn(() => [{ text: 'Uptown store', value: 'uptown' }]);
        const record = new Record(
            {
                ready: new FieldTypeBuilder(),
                store: new FieldTypeBuilder()
                    .disabled(r => !r.getField('ready'))
                    .options({ fetch }),
            },
            { ready: false, store: '' }
        );
        const target = render({ record, field: 'store', selectPrompt: 'Select a store' });
        const select = target.querySelector('select')!;
        expect(select.disabled).toBe(true);
        expect(select.options[0].textContent).toBe('Select a store');
        expect(fetch).not.toHaveBeenCalled();
        expect(target.querySelector('.options-spinner')).toBeNull();

        record.setField('ready', true);
        await record.whenOptionsReady();
        await settle();
        expect(select.disabled).toBe(false);
        expect([...select.options].map(option => option.value)).toEqual(['', 'uptown']);
    });

    it('stores multiple selected values as an array', async () => {
        const record = new Record(
            {
                colors: new FieldTypeBuilder().multipleValues().options([
                    { text: 'Red', value: 'red' },
                    { text: 'Green', value: 'green' },
                    { text: 'Blue', value: 'blue' },
                ]),
            },
            { colors: ['green'] }
        );
        const target = render({ record, field: 'colors', selectPrompt: 'Ignored' });
        await settle();
        const select = target.querySelector('select')!;
        expect(select.multiple).toBe(true);
        expect([...select.options].map(option => option.value)).toEqual(['red', 'green', 'blue']);
        expect([...select.selectedOptions].map(option => option.value)).toEqual(['green']);

        select.options[2].selected = true;
        select.dispatchEvent(new Event('change'));
        expect(record.getField('colors')).toEqual(['green', 'blue']);

        record.setField('colors', ['red']);
        flushSync();
        expect([...select.selectedOptions].map(option => option.value)).toEqual(['red']);
    });

    it('stops listening to the Record when unmounted', () => {
        const record = new Record({ name: new FieldTypeBuilder() }, { name: 'Ada' });
        const add = jest.spyOn(record, 'addEventListener');
        const remove = jest.spyOn(record, 'removeEventListener');
        const target = render({ record, field: 'name' });
        const input = target.querySelector('input')!;
        expect(add).toHaveBeenCalled();
        unmount(mounted.pop()!);
        const listeners = add.mock.calls.map(([, listener]) => listener);
        expect(remove.mock.calls.map(([, listener]) => listener)).toEqual(
            expect.arrayContaining(listeners)
        );
        record.setField('name', 'Grace');
        expect(input.value).toBe('Ada');
    });
});

it('re-renders `$record` markup when the Record changes', () => {
    const record = new Record({ name: new FieldTypeBuilder() }, { name: 'Ada' });
    const target = document.createElement('div');
    document.body.append(target);
    mounted.push(mount(RecordSummary, { target, props: { record } }));
    flushSync();
    expect(target.textContent).toBe('Ada');
    record.setField('name', 'Grace');
    flushSync();
    expect(target.textContent).toBe('Grace');
});

it('marks custom-print read-only controls as read-only', () => {
    const record = new Record(
        { code: new FieldTypeBuilder().readOnly().usesCustomPrint() },
        { code: 'A1' }
    );
    const input = render({ record, field: 'code' }).querySelector('input')!;
    expect(input.readOnly).toBe(true);
    expect(input.value).toBe('A1');
});

describe('<FdlField> prop changes', () => {
    it('follows a new record and field, and leaves the old record alone', async () => {
        const pending = deferred<Option[]>();
        const first = new Record(
            {
                name: new FieldTypeBuilder().label('First name'),
                store: new FieldTypeBuilder()
                    .label('First store')
                    .options({ fetch: () => pending.promise }),
            },
            { name: 'Ada', store: '' }
        );
        const second = new Record(
            {
                name: new FieldTypeBuilder().label('Second name'),
                notes: new FieldTypeBuilder().label('Notes').rowCount(3),
                store: new FieldTypeBuilder()
                    .label('Second store')
                    .options([{ text: 'Chelsea store', value: 'chelsea' }]),
            },
            { name: 'Grace', notes: 'Call ahead', store: 'chelsea' }
        );
        const remove = jest.spyOn(first, 'removeEventListener');
        const target = document.createElement('div');
        document.body.append(target);
        const props = reactiveProps({ record: first, field: 'store' });
        mounted.push(mount(FdlField, { target, props }));
        flushSync();
        expect(target.querySelector('select')!.getAttribute('aria-busy')).toBe('true');

        props.record = second;
        flushSync();
        await settle();
        expect(remove).toHaveBeenCalledWith('change', expect.any(Function));
        const select = target.querySelector('select')!;
        expect(target.querySelector('label')!.textContent).toBe('Second store');
        expect(select.hasAttribute('aria-busy')).toBe(false);
        expect([...select.options].map(option => option.value)).toEqual(['chelsea']);

        pending.resolve([{ text: 'Uptown store', value: 'uptown' }]);
        await settle();
        expect([...select.options].map(option => option.value)).toEqual(['chelsea']);

        props.field = 'notes';
        flushSync();
        const textarea = target.querySelector('textarea')!;
        expect(textarea.value).toBe('Call ahead');
        expect(target.querySelector('label')!.htmlFor).toBe(textarea.id);

        props.field = 'name';
        flushSync();
        const input = target.querySelector('input')!;
        expect(input.value).toBe('Grace');
        first.setField('name', 'Hedy');
        flushSync();
        expect(input.value).toBe('Grace');
        input.value = 'Mary';
        input.dispatchEvent(new Event('input'));
        expect(second.getField('name')).toBe('Mary');
        expect(first.getField('name')).toBe('Hedy');
    });

    it('updates the select prompt when the prop changes', async () => {
        const record = new Record(
            { size: new FieldTypeBuilder().options([{ text: 'Small', value: 's' }]) },
            { size: '' }
        );
        const target = document.createElement('div');
        document.body.append(target);
        const props = reactiveProps({ record, field: 'size', selectPrompt: 'Pick a size' });
        mounted.push(mount(FdlField, { target, props }));
        await settle();
        const select = target.querySelector('select')!;
        expect([...select.options].map(option => option.textContent)).toEqual([
            'Pick a size',
            'Small',
        ]);
        props.selectPrompt = 'Choose a size';
        flushSync();
        expect(select.options[0].textContent).toBe('Choose a size');
        expect(select.value).toBe('');
    });
});

describe('<FdlField> semantics', () => {
    it('renders no visible label for hideLabel() but keeps the control', () => {
        const record = new Record(
            { search: new FieldTypeBuilder().label('Search').hideLabel() },
            { search: '' }
        );
        const target = render({ record, field: 'search' });
        expect(target.querySelector('label')).toBeNull();
        expect(target.querySelector('input')).not.toBeNull();
    });

    it('binds a checkbox as a Boolean with its label', () => {
        const record = new Record(
            { agreed: new FieldTypeBuilder().label('I agree').type('checkbox').required() },
            { agreed: false }
        );
        const target = render({ record, field: 'agreed' });
        const checkbox = target.querySelector('input')!;
        expect(checkbox.type).toBe('checkbox');
        expect(checkbox.checked).toBe(false);
        expect(checkbox.required).toBe(true);
        expect(target.querySelector('label')!.htmlFor).toBe(checkbox.id);
        checkbox.click();
        expect(record.getField('agreed')).toBe(true);
        record.setField('agreed', false);
        flushSync();
        expect(checkbox.checked).toBe(false);
    });

    it('describes errors on a read-only output', () => {
        const record = new Record(
            { total: new FieldTypeBuilder().label('Total').readOnly().required() },
            { total: '' }
        );
        const target = render({ record, field: 'total', showValidationErrors: true });
        const output = target.querySelector('output')!;
        const error = target.querySelector('.validation-error')!;
        expect(error.textContent).toBe('Total is required');
        expect(output.getAttribute('aria-invalid')).toBe('true');
        expect(output.getAttribute('aria-describedby')).toBe(error.id);
    });

    it('gives each instance its own error id', () => {
        const fieldType = new FieldTypeBuilder().label('Name').required();
        const errors = [1, 2].map(() =>
            render({
                record: new Record({ name: fieldType }, { name: '' }),
                field: 'name',
                showValidationErrors: true,
            })
        );
        const [first, second] = errors.map(target => target.querySelector('.validation-error')!);
        expect(first.id).not.toBe(second.id);
        errors.forEach(target => {
            const input = target.querySelector('input')!;
            const error = target.querySelector('.validation-error')!;
            expect(input.getAttribute('aria-describedby')).toBe(error.id);
        });
    });
});
