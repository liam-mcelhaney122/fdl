import {
    acceptedInput,
    controlFor,
    fieldControl,
    fieldStore,
    FieldStoreValue,
    readFieldState,
    recordsetStore,
    recordStore,
} from '../adapters/svelte';
import FieldTypeBuilder from '../field-type-builder';
import Record from '../record.js';
import Recordset from '../recordset.js';

type Option = { text: string; value: string };

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => {
        resolve = done;
    });
    return { promise, resolve };
}

async function flushPromises() {
    await new Promise(resolve => setTimeout(resolve, 0));
}

describe('Svelte adapter field state', () => {
    it('chooses the same native control as FormElement from field metadata', () => {
        expect(controlFor(new FieldTypeBuilder().valueOf(), false)).toBe('input');
        expect(controlFor(new FieldTypeBuilder().rowCount(4).valueOf(), false)).toBe('textarea');
        expect(controlFor(new FieldTypeBuilder().options([]).valueOf(), false)).toBe('select');
        expect(controlFor(new FieldTypeBuilder().options([]).valueOf(), true)).toBe('output');
    });

    it('reads model state without choosing timing or DOM details', () => {
        const record = new Record(
            {
                name: new FieldTypeBuilder()
                    .label(r => `Name for ${r.getField('kind')}`)
                    .required(r => r.getField('kind') === 'person')
                    .placeholder('Ada Lovelace')
                    .minLength(2)
                    .formatter(value => String(value).toUpperCase()),
                kind: new FieldTypeBuilder(),
            },
            { name: 'ada', kind: 'person' }
        );
        const state = readFieldState(record, 'name');
        expect(state).toMatchObject({
            control: 'input',
            label: 'Name for person',
            showLabel: true,
            required: true,
            visible: true,
            readonly: false,
            disabled: false,
            placeholder: 'Ada Lovelace',
            minLength: 2,
            formattedValue: 'ADA',
            errors: [],
        });
        expect(state).not.toHaveProperty('id');
    });

    it('exposes synchronous errors only under the application display policy', () => {
        const record = new Record(
            { name: new FieldTypeBuilder().label('Full name').required() },
            { name: '' }
        );
        expect(readFieldState(record, 'name').errors).toEqual([]);
        expect(readFieldState(record, 'name', { showValidationErrors: true }).errors).toEqual([
            'Full name is required',
        ]);
    });

    it('filters text with the field input mask', () => {
        const fieldType = new FieldTypeBuilder().inputMask(/[0-9.]/).valueOf();
        expect(acceptedInput(fieldType, '1a😀4.2b3')).toBe('14.23');
    });
});

describe('Svelte store contract', () => {
    it('notifies record subscribers on every change until they unsubscribe', () => {
        const record = new Record({ name: new FieldTypeBuilder() }, { name: 'Ada' });
        const names: string[] = [];
        const unsubscribe = recordStore(record).subscribe(current =>
            names.push(current.getField('name'))
        );
        record.setField('name', 'Grace');
        unsubscribe();
        record.setField('name', 'Hedy');
        expect(names).toEqual(['Ada', 'Grace']);
    });

    it('notifies recordset subscribers for page, count, and loading events', async () => {
        const recordset = new Recordset({ name: new FieldTypeBuilder() }, [
            { name: 'Ada' },
            { name: 'Grace' },
        ]);
        const counts: number[] = [];
        const unsubscribe = recordsetStore(recordset).subscribe(current =>
            counts.push(current.totalCount)
        );
        await recordset.requestHardUpdate();
        expect(counts.length).toBeGreaterThan(1);
        expect(counts[counts.length - 1]).toBe(2);
        const seen = counts.length;
        unsubscribe();
        recordset.dispatchEvent(new CustomEvent('page-changed'));
        expect(counts).toHaveLength(seen);
    });

    it('removes its Record listener when the last subscriber leaves', () => {
        const record = new Record({ name: new FieldTypeBuilder() }, { name: 'Ada' });
        const add = jest.spyOn(record, 'addEventListener');
        const remove = jest.spyOn(record, 'removeEventListener');
        const store = fieldStore(record, 'name');
        const first = store.subscribe(() => undefined);
        const second = store.subscribe(() => undefined);
        expect(add).toHaveBeenCalledTimes(1);
        first();
        expect(remove).not.toHaveBeenCalled();
        second();
        second();
        expect(remove).toHaveBeenCalledWith('change', add.mock.calls[0][1]);
    });

    it('parses edits and changes the validation policy without a new store', () => {
        const record = new Record(
            {
                age: new FieldTypeBuilder<number | null>()
                    .label('Age')
                    .required()
                    .parser(value => (value === '' ? null : Number(value))),
            },
            { age: null }
        );
        const store = fieldStore(record, 'age');
        const states: FieldStoreValue[] = [];
        const unsubscribe = store.subscribe(state => states.push(state));
        store.edit('42');
        expect(record.getField('age')).toBe(42);
        store.edit('');
        store.setShowValidationErrors(true);
        expect(states[states.length - 1].errors).toEqual(['Age is required']);
        unsubscribe();
    });

    it('loads options, ignores stale results, and defers lookups while disabled', async () => {
        const first = deferred<Option[]>();
        const second = deferred<Option[]>();
        const fetch = jest.fn((record: Record<any>) =>
            record.getField('zip') === '28202' ? first.promise : second.promise
        );
        const record = new Record(
            {
                zip: new FieldTypeBuilder(),
                locked: new FieldTypeBuilder(),
                store: new FieldTypeBuilder()
                    .disabled(r => r.getField('locked'))
                    .options({ fields: ['zip'], fetch }),
            },
            { zip: '28202', locked: false, store: '' }
        );
        let state!: FieldStoreValue;
        const unsubscribe = fieldStore(record, 'store').subscribe(current => {
            state = current;
        });
        expect(state.optionsLoading).toBe(true);

        record.setField('zip', '10001');
        second.resolve([{ text: 'Chelsea store', value: 'chelsea' }]);
        await flushPromises();
        expect(state.optionsLoading).toBe(false);
        expect(state.options.map(option => option.value)).toEqual(['chelsea']);

        first.resolve([{ text: 'Uptown store', value: 'uptown' }]);
        await flushPromises();
        expect(state.options.map(option => option.value)).toEqual(['chelsea']);

        record.setField('locked', true);
        expect(state.disabled).toBe(true);
        expect(state.optionsLoading).toBe(false);
        expect(state.options.map(option => option.value)).toEqual(['chelsea']);
        expect(fetch).toHaveBeenCalledTimes(2);
        unsubscribe();
    });

    it('reports a failed lookup without leaving the field loading', async () => {
        const failure = new Error('offline');
        const record = new Record(
            {
                store: new FieldTypeBuilder().options({
                    fetch: () => Promise.reject(failure),
                }),
            },
            { store: '' }
        );
        let state!: FieldStoreValue;
        const unsubscribe = fieldStore(record, 'store').subscribe(current => {
            state = current;
        });
        await flushPromises();
        expect(state.optionsLoading).toBe(false);
        expect(state.optionsError).toBe(failure);
        unsubscribe();
    });
});

describe('fieldControl action', () => {
    it('binds a native input in both directions and stops on destroy', () => {
        const record = new Record({ name: new FieldTypeBuilder() }, { name: 'Ada' });
        const input = document.createElement('input');
        const action = fieldControl(input, { store: fieldStore(record, 'name') });
        expect(input.value).toBe('Ada');
        input.value = 'Grace';
        input.dispatchEvent(new Event('input'));
        expect(record.getField('name')).toBe('Grace');
        record.setField('name', 'Hedy');
        expect(input.value).toBe('Hedy');

        action.destroy();
        record.setField('name', 'Katherine');
        expect(input.value).toBe('Hedy');
        input.value = 'Mary';
        input.dispatchEvent(new Event('input'));
        expect(record.getField('name')).toBe('Katherine');
    });

    it('moves to a new store when its parameters change', () => {
        const first = new Record({ name: new FieldTypeBuilder() }, { name: 'Ada' });
        const second = new Record({ name: new FieldTypeBuilder() }, { name: 'Grace' });
        const input = document.createElement('input');
        const action = fieldControl(input, { store: fieldStore(first, 'name') });
        action.update({ store: fieldStore(second, 'name') });
        expect(input.value).toBe('Grace');
        first.setField('name', 'Hedy');
        expect(input.value).toBe('Grace');
        action.destroy();
    });

    it('blocks rejected typing before it reaches the control', () => {
        const record = new Record(
            { value: new FieldTypeBuilder().inputMask(/[0-9.]/) },
            { value: '12.3' }
        );
        const input = document.createElement('input');
        const action = fieldControl(input, { store: fieldStore(record, 'value') });
        const rejected = new InputEvent('beforeinput', {
            data: 'x',
            inputType: 'insertText',
            cancelable: true,
        });
        input.dispatchEvent(rejected);
        expect(rejected.defaultPrevented).toBe(true);
        const accepted = new InputEvent('beforeinput', {
            data: '4',
            inputType: 'insertText',
            cancelable: true,
        });
        input.dispatchEvent(accepted);
        expect(accepted.defaultPrevented).toBe(false);
        action.destroy();
    });

    it('waits for composition to finish before filtering and storing input', () => {
        const record = new Record(
            { value: new FieldTypeBuilder().inputMask(/[0-9.]/) },
            { value: '12.3' }
        );
        const input = document.createElement('input');
        const action = fieldControl(input, { store: fieldStore(record, 'value') });
        input.dispatchEvent(new Event('compositionstart'));
        input.value = '12あ4';
        input.dispatchEvent(new InputEvent('input', { isComposing: true }));
        expect(record.getField('value')).toBe('12.3');
        input.dispatchEvent(new Event('compositionend'));
        expect(input.value).toBe('124');
        expect(record.getField('value')).toBe('124');
        action.destroy();
    });

    it('synchronizes checkbox state as a Boolean and leaves file pickers alone', () => {
        const record = new Record(
            {
                agreed: new FieldTypeBuilder().type('checkbox'),
                file: new FieldTypeBuilder().type('file'),
            },
            { agreed: false, file: 'C:\\fakepath\\notes.txt' }
        );
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        const file = document.createElement('input');
        file.type = 'file';
        document.body.append(checkbox, file);
        const checkboxAction = fieldControl(checkbox, { store: fieldStore(record, 'agreed') });
        const fileAction = fieldControl(file, { store: fieldStore(record, 'file') });
        checkbox.click();
        expect(record.getField('agreed')).toBe(true);
        record.setField('agreed', false);
        expect(checkbox.checked).toBe(false);
        expect(file.value).toBe('');
        expect(() => file.dispatchEvent(new Event('blur'))).not.toThrow();
        checkboxAction.destroy();
        fileAction.destroy();
        document.body.replaceChildren();
    });
});
