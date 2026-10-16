import { act, render, screen } from '@testing-library/react';
import {
    useFieldOptions,
    useFieldState,
    useRecord,
    useRecordVersion,
    useRecordset,
} from '../adapters/react';
import { field } from '../primitives.js';
import Record from '../record.js';
import Recordset from '../recordset.js';

type Option = { text: string; value: string };

async function flush() {
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });
}

function nameRecord() {
    return new Record(
        {
            locked: field,
            name: field
                .label('Name')
                .required(r => !r.getField('locked'))
                .readOnly(r => r.getField('locked')),
        },
        { locked: false, name: 'Ada' }
    );
}

describe('useRecord and useRecordVersion', () => {
    function Greeting({ record }: { record: Record<any> }) {
        useRecord(record);
        return <p data-testid="greeting">Hello {record.getField('name')}</p>;
    }

    function Version({ record }: { record: Record<any> }) {
        return <p data-testid="version">{useRecordVersion(record)}</p>;
    }

    it('re-renders on Record changes and increases the version', () => {
        const record = nameRecord();
        render(
            <>
                <Greeting record={record} />
                <Version record={record} />
            </>
        );
        const before = Number(screen.getByTestId('version').textContent);
        act(() => record.setField('name', 'Grace'));
        expect(screen.getByTestId('greeting').textContent).toBe('Hello Grace');
        expect(Number(screen.getByTestId('version').textContent)).toBeGreaterThan(before);
    });

    it('removes its change listener on unmount', () => {
        const record = nameRecord();
        const add = jest.spyOn(record, 'addEventListener');
        const remove = jest.spyOn(record, 'removeEventListener');
        const { unmount } = render(<Greeting record={record} />);
        unmount();
        const added = add.mock.calls.map(([, listener]) => listener);
        const removed = remove.mock.calls.map(([, listener]) => listener);
        // Only the passive per-Record change counter remains.
        expect(added.filter(listener => !removed.includes(listener))).toHaveLength(1);
    });
});

describe('useFieldState', () => {
    function NameState({ record }: { record: Record<any> }) {
        const state = useFieldState(record, 'name');
        return (
            <p data-testid="state">
                {[state.control, state.label, state.displayValue, String(state.required)].join('|')}
            </p>
        );
    }

    it('derives field state and recomputes it when dependencies change', () => {
        const record = nameRecord();
        render(<NameState record={record} />);
        expect(screen.getByTestId('state').textContent).toBe('input|Name|Ada|true');
        act(() => record.setField('locked', true));
        expect(screen.getByTestId('state').textContent).toBe('output|Name|Ada|false');
    });
});

describe('useFieldOptions', () => {
    function Choices({ record }: { record: Record<any> }) {
        const { options, loading } = useFieldOptions(record, 'city');
        if (loading) return <p role="status">Loading</p>;
        return (
            <ul>
                {options.map(option => (
                    <li key={String(option.value)}>{String(option.text)}</li>
                ))}
            </ul>
        );
    }

    it('reports loading, publishes only the latest lookup, and ignores results after unmount', async () => {
        const pending: Array<(options: Option[]) => void> = [];
        const fetch = jest.fn(
            () =>
                new Promise<Option[]>(resolve => {
                    pending.push(resolve);
                })
        );
        const record = new Record(
            { state: field, city: field.options({ fields: ['state'], fetch }) },
            { state: 'NC', city: '' }
        );
        const errors = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const { unmount } = render(<Choices record={record} />);
        await flush();
        expect(screen.getByRole('status').textContent).toBe('Loading');

        act(() => record.setField('state', 'NY'));
        await flush();
        const [stale, latest] = [pending[0], pending[pending.length - 1]];
        await act(async () => {
            latest([{ text: 'Albany', value: 'albany' }]);
        });
        await act(async () => {
            stale([{ text: 'Raleigh', value: 'raleigh' }]);
        });
        expect(screen.getAllByRole('listitem').map(item => item.textContent)).toEqual(['Albany']);

        act(() => record.setField('state', 'VA'));
        await flush();
        unmount();
        await act(async () => {
            pending[pending.length - 1]([{ text: 'Richmond', value: 'richmond' }]);
        });
        expect(errors).not.toHaveBeenCalled();
        errors.mockRestore();
    });
});

describe('useRecordset subscriptions', () => {
    function Count({ recordset }: { recordset: Recordset<any> }) {
        const { totalCount } = useRecordset(recordset);
        return <p data-testid="count">{totalCount}</p>;
    }

    it('removes its Recordset listeners on unmount', async () => {
        const recordset = new Recordset({ id: field }, () => [{ id: 1 }, { id: 2 }]);
        const add = jest.spyOn(recordset, 'addEventListener');
        const remove = jest.spyOn(recordset, 'removeEventListener');
        const { unmount } = render(<Count recordset={recordset} />);
        await act(async () => {
            await recordset.requestHardUpdate();
        });
        expect(screen.getByTestId('count').textContent).toBe('2');

        unmount();
        const removed = remove.mock.calls.map(([, listener]) => listener);
        const remaining = new Set(
            add.mock.calls.map(([, listener]) => listener).filter(l => !removed.includes(l))
        );
        // Only the passive per-Recordset change counter remains.
        expect(remaining.size).toBe(1);
    });
});
