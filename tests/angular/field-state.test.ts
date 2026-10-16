import { field } from '../../primitives.js';
import Record from '../../record.js';
import {
    FieldOptionsLoader,
    FdlOptionsState,
    acceptedInput,
    controlKindFor,
    filterTextControl,
    isOptionSelected,
    isTextControl,
    mergeDescribedBy,
    readControlValue,
    readFieldState,
    rejectsInsertion,
    showsSelectPrompt,
} from '../../adapters/angular/field-state';

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

async function settle() {
    await new Promise(resolve => setTimeout(resolve, 0));
}

describe('readFieldState', () => {
    it('chooses the control from field metadata like FormElement', () => {
        const record = new Record(
            {
                name: field.label('Name'),
                notes: field.rowCount(4),
                color: field.options([{ text: 'Red', value: 'red' }]),
            },
            { name: '', notes: '', color: '' }
        );
        expect(controlKindFor(record.fieldTypeForField('name'))).toBe('input');
        expect(readFieldState(record, 'notes')).toMatchObject({ control: 'textarea', rows: 4 });
        expect(readFieldState(record, 'color').control).toBe('select');
    });

    it('derives record-dependent state from the model', () => {
        const record = new Record(
            {
                amount: field
                    .label(r => `Amount for ${r.getField('payee')}`)
                    .required(r => r.getField('payee') !== '')
                    .disabled(r => r.getField('locked'))
                    .placeholder('0.00')
                    .minLength(1)
                    .maxLength(9)
                    .formatter(value => (value === '' ? '' : `$${value}`)),
                payee: field,
                locked: field,
            },
            { amount: 5, payee: '', locked: false }
        );
        expect(readFieldState(record, 'amount')).toMatchObject({
            field: 'amount',
            value: 5,
            text: '$5',
            label: 'Amount for ',
            required: false,
            disabled: false,
            placeholder: '0.00',
            minLength: 1,
            maxLength: 9,
            inputType: 'text',
            visible: true,
            readOnlyOutput: false,
            errors: [],
        });
        record.setFields({ payee: 'Ada', locked: true });
        expect(readFieldState(record, 'amount')).toMatchObject({
            label: 'Amount for Ada',
            required: true,
            disabled: true,
        });
    });

    it('prints read-only values for a labeled output', () => {
        const record = new Record(
            {
                status: field
                    .label('Status')
                    .readOnly()
                    .template(value => `[${value}]`),
            },
            { status: 'Approved' }
        );
        expect(readFieldState(record, 'status')).toMatchObject({
            readonly: true,
            readOnlyOutput: true,
            printed: '[Approved]',
        });
    });

    it('exposes synchronous errors only when the application asks and the field is visible', () => {
        const record = new Record(
            {
                name: field.label('Full name').required(),
                hidden: field
                    .label('Hidden')
                    .required()
                    .visible(() => false),
            },
            { name: '', hidden: '' }
        );
        expect(readFieldState(record, 'name').errors).toEqual([]);
        expect(readFieldState(record, 'name', { showValidationErrors: true }).errors).toEqual([
            'Full name is required',
        ]);
        expect(readFieldState(record, 'hidden', { showValidationErrors: true }).errors).toEqual([]);
        record.setField('name', 'Ada');
        expect(readFieldState(record, 'name', { showValidationErrors: true }).errors).toEqual([]);
    });

    it('does not run validation while errors are hidden', () => {
        const record = new Record(
            {
                name: field.validator({ name: 'remote', validate: async () => true }),
            },
            { name: '' }
        );
        expect(() => readFieldState(record, 'name')).not.toThrow();
    });

    it('falls back to a text input when the declared type is invalid', () => {
        const record = new Record({ code: field.type('nonsense' as any) }, { code: '' });
        expect(readFieldState(record, 'code').inputType).toBe('text');
    });
});

describe('select helpers', () => {
    it('matches string identities for single and multiple values', () => {
        const record = new Record(
            {
                one: field.options([{ text: 'A', value: 'a' }]),
                many: field.options([{ text: 'A', value: 'a' }]).multipleValues(),
            },
            { one: 'a', many: ['a', 'c'] }
        );
        const one = readFieldState(record, 'one');
        const many = readFieldState(record, 'many');
        expect(isOptionSelected(one, 'a')).toBe(true);
        expect(isOptionSelected(one, 'b')).toBe(false);
        expect(isOptionSelected(many, 'c')).toBe(true);
        expect(isOptionSelected(many, 'b')).toBe(false);
    });

    it('shows a control-owned prompt unless an empty option is supplied', () => {
        const record = new Record({ one: field.options([]) }, { one: '' });
        const state = readFieldState(record, 'one');
        expect(showsSelectPrompt(state, [{ text: 'A', value: 'a' }], 'Choose')).toBe(true);
        expect(showsSelectPrompt(state, [{ text: 'None', value: '' }], 'Choose')).toBe(false);
        expect(showsSelectPrompt(state, [], undefined)).toBe(false);
    });
});

describe('describedBy and input filtering', () => {
    it('merges description IDs without duplicates', () => {
        expect(mergeDescribedBy('help other', null, 'help', 'error')).toBe('help other error');
        expect(mergeDescribedBy(undefined, '')).toBeNull();
    });

    it('applies inputMask to text, insertions, and a live control while preserving the caret', () => {
        const fieldType = new Record({ n: field.inputMask(/[0-9]/) }, { n: '' }).fieldTypeForField(
            'n'
        );
        expect(acceptedInput(fieldType, '1a2b')).toBe('12');
        expect(
            rejectsInsertion(fieldType, { data: 'x', inputType: 'insertText', isComposing: false })
        ).toBe(true);
        expect(
            rejectsInsertion(fieldType, { data: '7', inputType: 'insertText', isComposing: false })
        ).toBe(false);
        expect(
            rejectsInsertion(fieldType, { data: 'x', inputType: 'insertText', isComposing: true })
        ).toBe(false);

        const input = document.createElement('input');
        document.body.append(input);
        input.value = '1a23';
        input.setSelectionRange(3, 3);
        filterTextControl(input, fieldType);
        expect(input.value).toBe('123');
        expect(input.selectionStart).toBe(2);
        input.remove();
    });

    it('reads native control values', () => {
        const select = document.createElement('select');
        select.multiple = true;
        ['a', 'b', 'c'].forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.selected = value !== 'b';
            select.append(option);
        });
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        const text = document.createElement('textarea');
        text.value = 'hello';

        expect(readControlValue(select)).toEqual(['a', 'c']);
        expect(readControlValue(checkbox)).toBe(true);
        expect(readControlValue(text)).toBe('hello');
        expect(isTextControl(text)).toBe(true);
        expect(isTextControl(checkbox)).toBe(false);
    });
});

describe('FieldOptionsLoader', () => {
    it('reports loading, ignores stale results, and does not reload an unchanged request', async () => {
        const first = deferred<{ text: string; value: string }[]>();
        const second = deferred<{ text: string; value: string }[]>();
        const fetch = jest.fn((r: Record<any>) =>
            r.getField('zip') === '28202' ? first.promise : second.promise
        );
        const record = new Record(
            { zip: field, store: field.options({ fields: ['zip'], fetch }) },
            { zip: '28202', store: '' }
        );
        const states: FdlOptionsState[] = [];
        const loader = new FieldOptionsLoader(state => states.push(state));

        loader.sync(record, 'store');
        expect(loader.state.loading).toBe(true);
        record.setField('zip', '10001');
        loader.sync(record, 'store');
        second.resolve([{ text: 'Chelsea', value: 'chelsea' }]);
        await settle();
        expect(loader.state).toEqual({
            options: [{ text: 'Chelsea', value: 'chelsea' }],
            loading: false,
        });

        first.resolve([{ text: 'Uptown', value: 'uptown' }]);
        await settle();
        expect(loader.state.options).toEqual([{ text: 'Chelsea', value: 'chelsea' }]);

        const count = states.length;
        record.setField('store', 'chelsea');
        loader.sync(record, 'store');
        expect(states).toHaveLength(count);
        await record.whenOptionsReady();
    });

    it('defers loading while disabled and abandons a pending lookup when disabled', async () => {
        const pending = deferred<{ text: string; value: string }[]>();
        const fetch = jest.fn((_record: Record<any>) => pending.promise);
        const record = new Record(
            { ready: field, store: field.disabled(r => !r.getField('ready')).options({ fetch }) },
            { ready: false, store: '' }
        );
        const loader = new FieldOptionsLoader(() => undefined);
        loader.sync(record, 'store');
        expect(fetch).not.toHaveBeenCalled();
        expect(loader.state.loading).toBe(false);

        record.setField('ready', true);
        loader.sync(record, 'store');
        expect(loader.state.loading).toBe(true);
        record.setField('ready', false);
        loader.sync(record, 'store');
        expect(loader.state.loading).toBe(false);
        pending.resolve([{ text: 'Late', value: 'late' }]);
        await settle();
        expect(loader.state.options).toEqual([]);
    });

    it('keeps previous options when a lookup fails and ignores results after dispose', async () => {
        const failing = deferred<never>();
        const record = new Record(
            { store: field.options({ fetch: (_record: Record<any>) => failing.promise }) },
            { store: '' }
        );
        const loader = new FieldOptionsLoader(() => undefined);
        loader.sync(record, 'store');
        failing.reject(new Error('offline'));
        await settle();
        expect(loader.state).toEqual({ options: [], loading: false });

        const late = deferred<{ text: string; value: string }[]>();
        const other = new Record(
            { store: field.options({ fetch: (_record: Record<any>) => late.promise }) },
            { store: '' }
        );
        loader.sync(other, 'store');
        loader.dispose();
        late.resolve([{ text: 'Late', value: 'late' }]);
        await settle();
        expect(loader.state.options).toEqual([]);
    });
});
