import { Component, isSignal, reflectComponentType, signal, ɵSIGNAL } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { field } from '../../primitives.js';
import Record from '../../record.js';
import { FdlFieldComponent } from '../../adapters/angular';
import { flushMicrotasks, setUpAngularTestEnvironment } from './angular-test-environment';

setUpAngularTestEnvironment();

interface FieldInputs {
    record: Record<any>;
    field: string;
    showValidationErrors?: boolean;
    selectPrompt?: string;
    describedBy?: string;
}

async function renderField(inputs: FieldInputs) {
    const fixture = TestBed.createComponent(FdlFieldComponent);
    Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
    await settle(fixture);
    return fixture;
}

async function settle(fixture: ComponentFixture<unknown>) {
    await fixture.whenStable();
    await flushMicrotasks();
    await fixture.whenStable();
}

function query<E extends Element>(fixture: ComponentFixture<unknown>, selector: string) {
    return (fixture.nativeElement as HTMLElement).querySelector(selector) as E;
}

function type(control: HTMLInputElement | HTMLTextAreaElement, text: string) {
    control.focus();
    control.value = text;
    control.setSelectionRange(text.length, text.length);
    control.dispatchEvent(new Event('input', { bubbles: true }));
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(res => {
        resolve = res;
    });
    return { promise, resolve };
}

describe('FdlFieldComponent', () => {
    it('declares every signal input for the JIT test environment', () => {
        const fixture = TestBed.createComponent(FdlFieldComponent);
        const instance = fixture.componentInstance as unknown as { [key: string]: unknown };
        const signalInputs = Object.keys(instance).filter(key => {
            const value = instance[key];
            return isSignal(value) && 'applyValueToInputSignal' in (value as any)[ɵSIGNAL];
        });
        const declared = reflectComponentType(FdlFieldComponent)!.inputs.map(i => i.propName);
        expect(declared.sort()).toEqual(signalInputs.sort());
        fixture.destroy();
    });

    it('chooses input, textarea, or select from field metadata', async () => {
        const record = new Record(
            {
                name: field.label('Name'),
                notes: field.label('Notes').rowCount(3),
                color: field.label('Color').options([{ text: 'Red', value: 'red' }]),
            },
            { name: '', notes: '', color: 'red' }
        );
        const input = await renderField({ record, field: 'name' });
        const textarea = await renderField({ record, field: 'notes' });
        const select = await renderField({ record, field: 'color' });

        expect(query(input, 'input')).not.toBeNull();
        expect(query<HTMLTextAreaElement>(textarea, 'textarea').rows).toBe(3);
        expect(query(textarea, 'input')).toBeNull();
        expect(query<HTMLSelectElement>(select, 'select').value).toBe('red');
    });

    it('gives each instance a stable unique control id and associates its label', async () => {
        const record = new Record({ name: field.label('Full name').required() }, { name: 'Ada' });
        const first = await renderField({ record, field: 'name' });
        const second = await renderField({ record, field: 'name' });
        const firstInput = query<HTMLInputElement>(first, 'input');
        const secondInput = query<HTMLInputElement>(second, 'input');
        const label = query<HTMLLabelElement>(first, 'label');
        const id = firstInput.id;

        expect(id).toMatch(/^fdl-field-control-\d+$/);
        expect(id).not.toBe(secondInput.id);
        expect(label.htmlFor).toBe(id);
        expect(label.textContent).toContain('Full name');
        expect(query(first, '.required')).not.toBeNull();
        expect(firstInput.required).toBe(true);
        expect(firstInput.name).toBe('name');

        record.setField('name', 'Augusta Ada');
        await settle(first);
        expect(query<HTMLInputElement>(first, 'input')).toBe(firstInput);
        expect(firstInput.id).toBe(id);
    });

    it('synchronizes values in both directions and parses edits', async () => {
        const record = new Record(
            {
                amount: field
                    .label('Amount')
                    .parser(value => (value === '' ? null : Number(value)))
                    .formatter(value => (value === null ? '' : Number(value).toFixed(2))),
            },
            { amount: 5 }
        );
        const fixture = await renderField({ record, field: 'amount' });
        const input = query<HTMLInputElement>(fixture, 'input');
        expect(input.value).toBe('5.00');

        type(input, '42');
        expect(record.getField('amount')).toBe(42);

        record.setField('amount', 7);
        await settle(fixture);
        expect(input.value).toBe('7.00');
    });

    it('does not replace in-progress text or move the caret on an input echo, and reformats on blur', async () => {
        const record = new Record(
            {
                amount: field
                    .parser(value => (value === '' ? null : Number(value)))
                    .formatter(value => (value === null ? '' : String(value))),
            },
            { amount: 1 }
        );
        const fixture = await renderField({ record, field: 'amount' });
        const input = query<HTMLInputElement>(fixture, 'input');

        type(input, '12.');
        await settle(fixture);
        expect(record.getField('amount')).toBe(12);
        expect(input.value).toBe('12.');
        expect(input.selectionStart).toBe(3);

        type(input, '');
        await settle(fixture);
        expect(record.getField('amount')).toBeNull();
        expect(input.value).toBe('');

        type(input, '12.50');
        await settle(fixture);
        input.dispatchEvent(new Event('blur'));
        expect(input.value).toBe('12.5');
    });

    it('filters characters rejected by inputMask while keeping the caret', async () => {
        const record = new Record({ digits: field.inputMask(/[0-9]/) }, { digits: '' });
        const fixture = await renderField({ record, field: 'digits' });
        const input = query<HTMLInputElement>(fixture, 'input');
        input.focus();
        input.value = '1x2';
        input.setSelectionRange(2, 2);
        input.dispatchEvent(new Event('input'));
        expect(input.value).toBe('12');
        expect(input.selectionStart).toBe(1);
        expect(record.getField('digits')).toBe('12');

        const rejected = new InputEvent('beforeinput', {
            data: 'x',
            inputType: 'insertText',
            cancelable: true,
        });
        input.dispatchEvent(rejected);
        expect(rejected.defaultPrevented).toBe(true);
    });

    it('renders a labeled semantic output for a read-only field', async () => {
        const record = new Record(
            { status: field.label('Status').readOnly() },
            { status: 'Approved' }
        );
        const fixture = await renderField({ record, field: 'status' });
        const label = query<HTMLLabelElement>(fixture, 'label');
        const output = query<HTMLOutputElement>(fixture, 'output');

        expect(query(fixture, 'input')).toBeNull();
        expect(output.textContent).toBe('Approved');
        expect(label.htmlFor).toBe(output.id);
        expect(output.getAttribute('aria-labelledby')).toBe(label.id);
        expect(query(fixture, '.required')).toBeNull();
    });

    it('hides the field when the model says it is not visible', async () => {
        const record = new Record(
            { shown: field, detail: field.label('Detail').visible(r => r.getField('shown')) },
            { shown: false, detail: '' }
        );
        const fixture = await renderField({ record, field: 'detail' });
        expect(query(fixture, 'label')).toBeNull();
        expect(query(fixture, 'input')).toBeNull();
        record.setField('shown', true);
        await settle(fixture);
        expect(query(fixture, 'input')).not.toBeNull();
    });

    it('lets the application control when synchronous model errors are exposed', async () => {
        const record = new Record({ name: field.label('Full name').required() }, { name: '' });
        const fixture = await renderField({ record, field: 'name', describedBy: 'field-help' });
        const input = query<HTMLInputElement>(fixture, 'input');

        expect(record.isValid('name')).toBe(false);
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        expect(input.getAttribute('aria-describedby')).toBe('field-help');
        expect(query(fixture, '.validation-error')).toBeNull();

        fixture.componentRef.setInput('showValidationErrors', true);
        await settle(fixture);
        const error = query<HTMLElement>(fixture, '.validation-error');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual([
            'field-help',
            error.id,
        ]);
        expect(error.textContent).toContain('Full name is required');

        type(input, 'Ada');
        await settle(fixture);
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        expect(input.getAttribute('aria-describedby')).toBe('field-help');
        expect(query(fixture, '.validation-error')).toBeNull();
    });

    it('exposes errors on a read-only output', async () => {
        const record = new Record(
            { status: field.label('Status').readOnly().required() },
            { status: '' }
        );
        const fixture = await renderField({ record, field: 'status', showValidationErrors: true });
        const output = query<HTMLOutputElement>(fixture, 'output');
        const error = query<HTMLElement>(fixture, '.validation-error');
        expect(output.getAttribute('aria-invalid')).toBe('true');
        expect(output.getAttribute('aria-describedby')).toBe(error.id);
    });

    it('disables a busy select while options load and ignores stale results', async () => {
        const first = deferred<{ text: string; value: string }[]>();
        const second = deferred<{ text: string; value: string }[]>();
        const fetch = jest.fn((r: Record<any>) =>
            r.getField('zip') === '28202' ? first.promise : second.promise
        );
        const record = new Record(
            {
                zip: field,
                store: field.label('Pickup store').options({ fields: ['zip'], fetch }),
            },
            { zip: '28202', store: '' }
        );
        const fixture = await renderField({ record, field: 'store' });
        const select = query<HTMLSelectElement>(fixture, 'select');
        expect(select.disabled).toBe(true);
        expect(select.getAttribute('aria-busy')).toBe('true');
        expect(query(fixture, '.options-spinner')).not.toBeNull();
        expect(query(fixture, '[role="status"]').textContent).toContain('Loading choices');

        record.setField('zip', '10001');
        await settle(fixture);
        second.resolve([{ text: 'Chelsea store', value: 'chelsea' }]);
        await settle(fixture);
        expect(select.disabled).toBe(false);
        expect(select.hasAttribute('aria-busy')).toBe(false);
        expect(query(fixture, '.options-spinner')).toBeNull();
        expect([...select.options].map(option => option.value)).toEqual(['chelsea']);

        first.resolve([{ text: 'Uptown store', value: 'uptown' }]);
        await settle(fixture);
        expect([...select.options].map(option => option.value)).toEqual(['chelsea']);

        select.value = 'chelsea';
        select.dispatchEvent(new Event('change'));
        await settle(fixture);
        expect(record.getField('store')).toBe('chelsea');
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(select.value).toBe('chelsea');
    });

    it('renders a control-owned prompt and defers options for a disabled select', async () => {
        const fetch = jest.fn(() => [{ text: 'Uptown store', value: 'uptown' }]);
        const record = new Record(
            {
                ready: field,
                store: field.disabled(r => !r.getField('ready')).options({ fetch }),
            },
            { ready: false, store: '' }
        );
        const fixture = await renderField({
            record,
            field: 'store',
            selectPrompt: 'Select a store',
        });
        const select = query<HTMLSelectElement>(fixture, 'select');
        expect(select.disabled).toBe(true);
        expect(select.options[0].textContent).toBe('Select a store');
        expect(fetch).not.toHaveBeenCalled();

        record.setField('ready', true);
        await record.whenOptionsReady();
        await settle(fixture);
        expect(select.disabled).toBe(false);
        expect([...select.options].map(option => option.value)).toEqual(['', 'uptown']);
        expect(select.value).toBe('');
    });

    it('stores multiple selections as an array', async () => {
        const record = new Record(
            {
                tags: field
                    .label('Tags')
                    .options([
                        { text: 'Red', value: 'red' },
                        { text: 'Green', value: 'green' },
                        { text: 'Blue', value: 'blue' },
                    ])
                    .multipleValues(),
            },
            { tags: ['green'] }
        );
        const fixture = await renderField({ record, field: 'tags' });
        const select = query<HTMLSelectElement>(fixture, 'select');
        expect(select.multiple).toBe(true);
        expect([...select.selectedOptions].map(option => option.value)).toEqual(['green']);

        select.options[0].selected = true;
        select.options[2].selected = true;
        select.dispatchEvent(new Event('change'));
        expect(record.getField('tags')).toEqual(['red', 'green', 'blue']);
        await settle(fixture);
        expect([...select.selectedOptions].map(option => option.value)).toEqual([
            'red',
            'green',
            'blue',
        ]);

        record.setField('tags', ['blue']);
        await settle(fixture);
        expect([...select.selectedOptions].map(option => option.value)).toEqual(['blue']);
    });

    it('edits a boolean checkbox through its checked state', async () => {
        const record = new Record(
            { agree: field.label('Agree').type('checkbox') },
            { agree: false }
        );
        const fixture = await renderField({ record, field: 'agree' });
        const checkbox = query<HTMLInputElement>(fixture, 'input');
        expect(checkbox.type).toBe('checkbox');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        expect(record.getField('agree')).toBe(true);
        await settle(fixture);
        expect(checkbox.checked).toBe(true);
        record.setField('agree', false);
        await settle(fixture);
        expect(checkbox.checked).toBe(false);
    });

    it('follows a replaced record and stops listening when destroyed', async () => {
        const fieldTypes = { name: field.label('Name') };
        const first = new Record(fieldTypes, { name: 'Ada' });
        const second = new Record(fieldTypes, { name: 'Grace' });
        const fixture = await renderField({ record: first, field: 'name' });
        const input = query<HTMLInputElement>(fixture, 'input');

        const removeFirst = jest.spyOn(first, 'removeEventListener');
        fixture.componentRef.setInput('record', second);
        await settle(fixture);
        expect(removeFirst).toHaveBeenCalledWith('change', expect.any(Function));
        expect(input.value).toBe('Grace');

        const removeSecond = jest.spyOn(second, 'removeEventListener');
        fixture.destroy();
        expect(removeSecond).toHaveBeenCalledWith('change', expect.any(Function));
        expect(() => second.setField('name', 'Hopper')).not.toThrow();
    });

    it('works inside a host template with property bindings', async () => {
        const record = new Record({ name: field.label('Name').required() }, { name: '' });

        @Component({
            imports: [FdlFieldComponent],
            template: `<fdl-field
                [record]="record"
                field="name"
                [showValidationErrors]="submitted()"
            />`,
        })
        class HostComponent {
            record = record;
            submitted = signal(false);
        }

        const fixture = TestBed.createComponent(HostComponent);
        await settle(fixture);
        expect(query(fixture, 'fdl-field input')).not.toBeNull();
        expect(query(fixture, '.validation-error')).toBeNull();
        fixture.componentInstance.submitted.set(true);
        await settle(fixture);
        expect(query(fixture, '.validation-error')?.textContent).toContain('Name is required');
    });
});

describe('FdlFieldComponent checklist coverage', () => {
    it('uses the declared input type and renders no label for hideLabel()', async () => {
        const record = new Record(
            { email: field.label('Email').type('email').hideLabel() },
            { email: '' }
        );
        const fixture = await renderField({ record, field: 'email' });
        expect(query<HTMLInputElement>(fixture, 'input').type).toBe('email');
        expect(query(fixture, 'label')).toBeNull();
    });

    it('keeps a usesCustomPrint() read-only field read-only in its native control', async () => {
        const record = new Record(
            {
                code: field.label('Code').readOnly().usesCustomPrint(),
                notes: field.label('Notes').rowCount(2).readOnly().usesCustomPrint(),
            },
            { code: 'A1', notes: 'Fixed' }
        );
        const code = await renderField({ record, field: 'code' });
        const notes = await renderField({ record, field: 'notes' });
        expect(query(code, 'output')).toBeNull();
        expect(query<HTMLInputElement>(code, 'input').readOnly).toBe(true);
        expect(query<HTMLTextAreaElement>(notes, 'textarea').readOnly).toBe(true);
    });

    it('waits for composition to end before filtering and committing', async () => {
        const record = new Record({ digits: field.inputMask(/[0-9]/) }, { digits: '' });
        const fixture = await renderField({ record, field: 'digits' });
        const input = query<HTMLInputElement>(fixture, 'input');
        input.focus();
        input.dispatchEvent(new Event('compositionstart'));
        const composed = new InputEvent('beforeinput', {
            data: 'x',
            inputType: 'insertCompositionText',
            cancelable: true,
        });
        input.dispatchEvent(composed);
        expect(composed.defaultPrevented).toBe(false);
        input.value = '1x';
        input.dispatchEvent(new Event('input'));
        expect(input.value).toBe('1x');
        expect(record.getField('digits')).toBe('');

        input.dispatchEvent(new Event('compositionend'));
        expect(input.value).toBe('1');
        expect(record.getField('digits')).toBe('1');
    });

    it('runs onValueChange callbacks after an edit', async () => {
        const onValueChange = jest.fn();
        const record = new Record({ name: field.onValueChange(onValueChange) }, { name: '' });
        const fixture = await renderField({ record, field: 'name' });
        type(query<HTMLInputElement>(fixture, 'input'), 'Ada');
        expect(onValueChange).toHaveBeenCalledWith(record);
    });

    it('marks a select natively required and compares non-string option values as strings', async () => {
        const record = new Record(
            {
                size: field
                    .label('Size')
                    .required()
                    .options([
                        { text: 'Small', value: 1 },
                        { text: 'Large', value: 2 },
                    ])
                    .parser(value => Number(value)),
            },
            { size: 2 }
        );
        const fixture = await renderField({ record, field: 'size', selectPrompt: 'Choose' });
        const select = query<HTMLSelectElement>(fixture, 'select');
        expect(select.required).toBe(true);
        expect([...select.options].map(option => option.value)).toEqual(['', '1', '2']);
        expect(select.value).toBe('2');
        select.value = '1';
        select.dispatchEvent(new Event('change'));
        expect(record.getField('size')).toBe(1);
    });

    it('omits the prompt when the data has an empty choice or the select is multiple', async () => {
        const record = new Record(
            {
                one: field.options([
                    { text: 'None', value: '' },
                    { text: 'A', value: 'a' },
                ]),
                many: field.options([{ text: 'A', value: 'a' }]).multipleValues(),
            },
            { one: '', many: [] }
        );
        const one = await renderField({ record, field: 'one', selectPrompt: 'Choose' });
        const many = await renderField({ record, field: 'many', selectPrompt: 'Choose' });
        expect(query(one, '[data-select-prompt]')).toBeNull();
        expect(query<HTMLSelectElement>(one, 'select').options[0].textContent).toBe('None');
        expect(query(many, '[data-select-prompt]')).toBeNull();
    });

    it('selects every initial value of a multiple-value field', async () => {
        const record = new Record(
            {
                tags: field
                    .options([
                        { text: 'Red', value: 'red' },
                        { text: 'Green', value: 'green' },
                        { text: 'Blue', value: 'blue' },
                    ])
                    .multipleValues(),
            },
            { tags: ['red', 'blue'] }
        );
        const fixture = await renderField({ record, field: 'tags' });
        const select = query<HTMLSelectElement>(fixture, 'select');
        expect([...select.selectedOptions].map(option => option.value)).toEqual(['red', 'blue']);
    });

    it('does not show another field’s choices after the field input changes', async () => {
        const record = new Record(
            {
                color: field.label('Color').options([{ text: 'Red', value: 'red' }]),
                locked: field
                    .label('Locked')
                    .disabled(true)
                    .options([{ text: 'Never', value: 'never' }]),
            },
            { color: 'red', locked: '' }
        );
        const fixture = await renderField({ record, field: 'color' });
        expect([...query<HTMLSelectElement>(fixture, 'select').options].map(o => o.value)).toEqual([
            'red',
        ]);
        fixture.componentRef.setInput('field', 'locked');
        await settle(fixture);
        const select = query<HTMLSelectElement>(fixture, 'select');
        expect(select.name).toBe('locked');
        expect(select.disabled).toBe(true);
        expect(select.options).toHaveLength(0);
    });

    it('ignores an options lookup that settles after the component is destroyed', async () => {
        const pending = deferred<{ text: string; value: string }[]>();
        const record = new Record(
            {
                store: field
                    .label('Store')
                    .options({ fetch: (_r: Record<any>) => pending.promise }),
            },
            { store: '' }
        );
        const fixture = await renderField({ record, field: 'store' });
        const select = query<HTMLSelectElement>(fixture, 'select');
        expect(select.getAttribute('aria-busy')).toBe('true');
        fixture.destroy();
        pending.resolve([{ text: 'Late', value: 'late' }]);
        await flushMicrotasks();
        expect(select.options).toHaveLength(0);
        expect(() => record.setField('store', 'late')).not.toThrow();
    });
});
