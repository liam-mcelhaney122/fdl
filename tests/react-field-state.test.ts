import {
    FieldOptionsTracker,
    editableControlFor,
    filterInput,
    getFieldState,
    getVisibleErrors,
} from '../adapters/react/field-state';
import { field } from '../primitives.js';
import Record from '../record.js';

type Option = { text: string; value: string };

describe('React adapter field state', () => {
    it('derives control, label, and model state without a renderer', () => {
        const record = new Record(
            {
                name: field
                    .label(r => `Name for ${r.getField('kind')}`)
                    .required(r => r.getField('kind') === 'person')
                    .placeholder('Ada Lovelace')
                    .maxLength(20),
                kind: field.options([{ text: 'Person', value: 'person' }]),
                notes: field.rowCount(3),
                status: field.label('Status').readOnly(),
                hidden: field.label('Hidden').hideLabel(),
            },
            { name: 'Ada', kind: 'person', notes: '', status: 'Open', hidden: '' }
        );

        const name = getFieldState(record, 'name');
        expect(name.control).toBe('input');
        expect(name.label).toBe('Name for person');
        expect(name.required).toBe(true);
        expect(name.placeholder).toBe('Ada Lovelace');
        expect(name.maxLength).toBe(20);
        expect(name.displayValue).toBe('Ada');

        expect(getFieldState(record, 'kind').control).toBe('select');
        expect(getFieldState(record, 'notes').control).toBe('textarea');
        expect(getFieldState(record, 'notes').rows).toBe(3);
        expect(getFieldState(record, 'status').control).toBe('output');
        expect(getFieldState(record, 'status').printedValue).toBe('Open');
        expect(getFieldState(record, 'hidden').showLabel).toBe(false);
        expect(editableControlFor(record.fieldTypeForField('status'))).toBe('input');

        record.setField('kind', 'pet');
        expect(getFieldState(record, 'name').required).toBe(false);
    });

    it('returns errors only when shown and visible', () => {
        const record = new Record(
            {
                name: field.label('Name').required(),
                gone: field
                    .label('Gone')
                    .required()
                    .visible(() => false),
            },
            { name: '', gone: '' }
        );
        expect(getVisibleErrors(record, 'name', false)).toEqual([]);
        expect(getVisibleErrors(record, 'name', true)).toEqual(['Name is required']);
        expect(getVisibleErrors(record, 'gone', true)).toEqual([]);
    });

    it('filters masked input and maps the selection', () => {
        const fieldType = new Record(
            { zip: field.inputMask(/[0-9]/) },
            { zip: '' }
        ).fieldTypeForField('zip');
        expect(filterInput(fieldType, '12a3', 3, 4)).toEqual({
            text: '123',
            selectionStart: 2,
            selectionEnd: 3,
        });
        expect(filterInput(fieldType, '123', 1, 1)).toEqual({
            text: '123',
            selectionStart: 1,
            selectionEnd: 1,
        });
    });
});

describe('FieldOptionsTracker', () => {
    it('publishes only the latest lookup and defers while disabled', async () => {
        const pending: Array<(options: Option[]) => void> = [];
        const fetch = jest.fn(
            () =>
                new Promise<Option[]>(resolve => {
                    pending.push(resolve);
                })
        );
        const record = new Record(
            {
                zip: field,
                locked: field,
                store: field
                    .disabled(r => r.getField('locked'))
                    .options({ fields: ['zip'], fetch }),
            },
            { zip: '1', locked: false, store: '' }
        );
        const states: Array<{ loading: boolean; options: unknown[] }> = [];
        const tracker = new FieldOptionsTracker(record, 'store', state => states.push(state));

        tracker.sync();
        expect(tracker.state.loading).toBe(true);
        tracker.sync(); // the cached request is not reloaded
        record.setField('zip', '2');
        tracker.sync();
        const callsBeforeLock = fetch.mock.calls.length;

        pending[pending.length - 1]([{ text: 'Newest', value: 'new' }]);
        await Promise.resolve();
        await Promise.resolve();
        expect(tracker.state).toEqual({
            options: [{ text: 'Newest', value: 'new' }],
            loading: false,
        });

        pending[0]([{ text: 'Stale', value: 'old' }]);
        await Promise.resolve();
        await Promise.resolve();
        expect(tracker.state.options).toEqual([{ text: 'Newest', value: 'new' }]);

        record.setField('locked', true);
        record.setField('zip', '3');
        tracker.sync();
        expect(fetch.mock.calls.length).toBe(callsBeforeLock);
        expect(tracker.state.loading).toBe(false);

        tracker.dispose();
        record.setField('locked', false);
        tracker.sync();
        expect(states.every(state => Array.isArray(state.options))).toBe(true);
    });
});
