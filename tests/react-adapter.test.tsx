import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { useRecordset } from '../adapters/react';
import { FdlField } from '../adapters/react/fdl-field';
import { field } from '../primitives.js';
import Record from '../record.js';
import Recordset from '../recordset.js';

type Option = { text: string; value: string };

function amountField() {
    return field
        .label('Amount')
        .inputMask(/[0-9.]/)
        .parser((value: string) => (value === '' ? null : Number(value)))
        .formatter((value: number | null) =>
            typeof value === 'number' && !Number.isNaN(value) ? value.toFixed(2) : ''
        );
}

async function flush() {
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });
}

describe('FdlField control selection', () => {
    it('chooses input, select, and textarea from field metadata through one component', async () => {
        const record = new Record(
            {
                name: field.label('Name'),
                method: field.label('Method').options([{ text: 'Email', value: 'email' }]),
                notes: field.label('Notes').rowCount(4),
            },
            { name: 'Ada', method: 'email', notes: '' }
        );
        const { container } = render(
            <>
                <FdlField record={record} field="name" />
                <FdlField record={record} field="method" />
                <FdlField record={record} field="notes" />
            </>
        );
        await flush();

        expect(screen.getByLabelText('Name').tagName).toBe('INPUT');
        expect(screen.getByLabelText('Method').tagName).toBe('SELECT');
        expect(screen.getByLabelText('Notes').tagName).toBe('TEXTAREA');
        expect((screen.getByLabelText('Notes') as HTMLTextAreaElement).rows).toBe(4);
        expect(container.querySelectorAll('.fdl-field')).toHaveLength(3);
    });

    it('renders nothing for a hidden field', () => {
        const record = new Record(
            { secret: field.label('Secret').visible(() => false) },
            { secret: '' }
        );
        const { container } = render(<FdlField record={record} field="secret" />);
        expect(container.innerHTML).toBe('');
    });
});

describe('FdlField labels and IDs', () => {
    it('gives each instance a stable unique control id and associates its label', () => {
        const name = field.label('Full name');
        const first = new Record({ name }, { name: 'Ada' });
        const second = new Record({ name }, { name: 'Grace' });
        render(
            <>
                <FdlField record={first} field="name" />
                <FdlField record={second} field="name" />
            </>
        );
        const [firstLabel, secondLabel] = screen.getAllByText('Full name') as HTMLLabelElement[];
        const firstInput = document.getElementById(firstLabel.htmlFor) as HTMLInputElement;
        const secondInput = document.getElementById(secondLabel.htmlFor) as HTMLInputElement;

        expect(firstInput.value).toBe('Ada');
        expect(secondInput.value).toBe('Grace');
        expect(firstInput.id).not.toBe(secondInput.id);
        expect(firstInput.id).not.toBe('name');
        const originalId = firstInput.id;

        act(() => first.setField('name', 'Augusta Ada'));
        expect(firstInput.id).toBe(originalId);
        expect(screen.getByLabelText('Full name', { selector: `#${originalId}` })).toBe(firstInput);
    });

    it('marks requiredness natively and in the label', () => {
        const record = new Record({ name: field.label('Name').required() }, { name: '' });
        render(<FdlField record={record} field="name" />);
        const input = screen.getByLabelText(/Name/) as HTMLInputElement;
        expect(input.required).toBe(true);
        expect(document.querySelector('label .required')?.getAttribute('aria-hidden')).toBe('true');
    });
});

describe('FdlField value synchronization', () => {
    it('reflects programmatic record changes and parses edits back into the record', () => {
        const record = new Record({ amount: amountField() }, { amount: 5 });
        const onValueChange = jest.fn();
        const withCallback = new Record(
            { amount: amountField().onValueChange(onValueChange) },
            { amount: 1 }
        );
        render(
            <>
                <FdlField record={record} field="amount" />
                <FdlField record={withCallback} field="amount" className="second" />
            </>
        );
        const [input, secondInput] = screen.getAllByLabelText('Amount') as HTMLInputElement[];
        expect(input.value).toBe('5.00');

        act(() => record.setField('amount', 7));
        expect(input.value).toBe('7.00');

        fireEvent.change(input, { target: { value: '42' } });
        expect(record.getField('amount')).toBe(42);
        expect(typeof record.getField('amount')).toBe('number');

        fireEvent.change(secondInput, { target: { value: '3' } });
        expect(onValueChange).toHaveBeenCalledWith(withCallback);
    });

    it('keeps unfinished text and the caret while typing, then reformats on blur', () => {
        const record = new Record({ amount: amountField() }, { amount: null as number | null });
        render(<FdlField record={record} field="amount" />);
        const input = screen.getByLabelText('Amount') as HTMLInputElement;

        fireEvent.change(input, { target: { value: '12.' } });
        expect(record.getField('amount')).toBe(12);
        expect(input.value).toBe('12.');

        input.setSelectionRange(1, 1);
        fireEvent.change(input, { target: { value: '12.5' } });
        expect(input.value).toBe('12.5');

        fireEvent.change(input, { target: { value: '' } });
        expect(record.getField('amount')).toBeNull();
        expect(input.value).toBe('');

        fireEvent.change(input, { target: { value: '3.5' } });
        fireEvent.blur(input);
        expect(input.value).toBe('3.50');
    });

    it('lets a programmatic change replace in-progress text', () => {
        const record = new Record({ amount: amountField() }, { amount: null as number | null });
        render(<FdlField record={record} field="amount" />);
        const input = screen.getByLabelText('Amount') as HTMLInputElement;

        fireEvent.change(input, { target: { value: '12.' } });
        act(() => record.setField('amount', 99));
        expect(input.value).toBe('99.00');
    });

    it('filters masked characters and maps the caret into the accepted text', () => {
        const record = new Record({ amount: amountField() }, { amount: null as number | null });
        render(<FdlField record={record} field="amount" />);
        const input = screen.getByLabelText('Amount') as HTMLInputElement;

        fireEvent.change(input, { target: { value: '1a2b3' } });
        expect(input.value).toBe('123');
        expect(record.getField('amount')).toBe(123);

        fireEvent.change(input, { target: { value: '1x23', selectionStart: 2, selectionEnd: 2 } });
        expect(input.value).toBe('123');
        expect(input.selectionStart).toBe(1);
        expect(input.selectionEnd).toBe(1);
    });

    it('defers parsing until text composition ends', () => {
        const record = new Record({ name: field.label('Name') }, { name: '' });
        render(<FdlField record={record} field="name" />);
        const input = screen.getByLabelText('Name') as HTMLInputElement;

        fireEvent.compositionStart(input);
        fireEvent.change(input, { target: { value: 'に' } });
        expect(record.getField('name')).toBe('');
        expect(input.value).toBe('に');
        fireEvent.compositionEnd(input);
        expect(record.getField('name')).toBe('に');
    });

    it('synchronizes checkbox inputs as booleans', () => {
        const record = new Record(
            { agree: field.label('Agree').type('checkbox') },
            { agree: false }
        );
        render(<FdlField record={record} field="agree" />);
        const checkbox = screen.getByLabelText('Agree') as HTMLInputElement;
        expect(checkbox.type).toBe('checkbox');
        expect(checkbox.checked).toBe(false);
        fireEvent.click(checkbox);
        expect(record.getField('agree')).toBe(true);
        act(() => record.setField('agree', false));
        expect(checkbox.checked).toBe(false);
    });

    it('updates dependent state such as disabled and placeholder', () => {
        const record = new Record(
            {
                locked: field,
                text: field
                    .label('Text')
                    .placeholder(r => (r.getField('locked') ? 'Locked' : 'Type here'))
                    .disabled(r => r.getField('locked')),
            },
            { locked: false, text: '' }
        );
        render(<FdlField record={record} field="text" />);
        const input = screen.getByLabelText('Text') as HTMLInputElement;
        expect(input.disabled).toBe(false);
        expect(input.placeholder).toBe('Type here');
        act(() => record.setField('locked', true));
        expect(input.disabled).toBe(true);
        expect(input.placeholder).toBe('Locked');
    });
});

describe('FdlField read-only output', () => {
    it('renders a labeled semantic output for a read-only field', () => {
        const record = new Record(
            { status: field.label('Status').readOnly().required() },
            { status: 'Approved' }
        );
        render(<FdlField record={record} field="status" />);
        const label = screen.getByText('Status') as HTMLLabelElement;
        const output = document.querySelector('output') as HTMLOutputElement;

        expect(document.querySelector('input')).toBeNull();
        expect(output.textContent).toBe('Approved');
        expect(label.htmlFor).toBe(output.id);
        expect(output.getAttribute('aria-labelledby')).toBe(label.id);
        expect(label.querySelector('.required')).toBeNull();
    });
});

describe('FdlField validation display', () => {
    it('exposes synchronous model errors only when the application asks', () => {
        const record = new Record({ name: field.label('Full name').required() }, { name: '' });
        const { rerender } = render(
            <FdlField record={record} field="name" describedBy="field-help" />
        );
        const input = screen.getByLabelText(/Full name/) as HTMLInputElement;

        expect(record.isValid('name')).toBe(false);
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        expect(input.getAttribute('aria-describedby')).toBe('field-help');
        expect(document.querySelector('.validation-error')).toBeNull();

        rerender(
            <FdlField record={record} field="name" describedBy="field-help" showValidationErrors />
        );
        const error = document.querySelector('.validation-error') as HTMLElement;
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual([
            'field-help',
            error.id,
        ]);
        expect(error.textContent).toContain('Full name is required');

        fireEvent.change(input, { target: { value: 'Ada' } });
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        expect(input.getAttribute('aria-describedby')).toBe('field-help');
        expect(document.querySelector('.validation-error')).toBeNull();
    });

    it('connects errors to read-only output', () => {
        const record = new Record(
            { status: field.label('Status').readOnly().required() },
            { status: '' }
        );
        render(<FdlField record={record} field="status" showValidationErrors />);
        const output = document.querySelector('output') as HTMLOutputElement;
        const error = document.querySelector('.validation-error') as HTMLElement;
        expect(output.getAttribute('aria-invalid')).toBe('true');
        expect(output.getAttribute('aria-describedby')).toBe(error.id);
    });
});

describe('FdlField options', () => {
    it('shows a busy, disabled select while options load and ignores stale results', async () => {
        let resolveFirst!: (options: Option[]) => void;
        let resolveSecond!: (options: Option[]) => void;
        const first = new Promise<Option[]>(resolve => {
            resolveFirst = resolve;
        });
        const second = new Promise<Option[]>(resolve => {
            resolveSecond = resolve;
        });
        const fetch = jest.fn((record: Record<any>) =>
            record.getField('zip') === '28202' ? first : second
        );
        const record = new Record(
            {
                zip: field,
                store: field.label('Pickup store').options({ fields: ['zip'], fetch }),
            },
            { zip: '28202', store: '' }
        );
        render(<FdlField record={record} field="store" />);
        const select = screen.getByLabelText('Pickup store') as HTMLSelectElement;

        expect(select.disabled).toBe(true);
        expect(select.getAttribute('aria-busy')).toBe('true');
        expect(document.querySelector('.options-spinner')).not.toBeNull();
        expect(screen.getByRole('status').textContent).toContain('Loading choices');

        act(() => record.setField('zip', '10001'));
        await act(async () => {
            resolveSecond([{ text: 'Chelsea store', value: 'chelsea' }]);
            await second;
        });
        expect(select.disabled).toBe(false);
        expect(select.hasAttribute('aria-busy')).toBe(false);
        expect(document.querySelector('.options-spinner')).toBeNull();
        expect([...select.options].map(option => option.value)).toEqual(['chelsea']);

        await act(async () => {
            resolveFirst([{ text: 'Uptown store', value: 'uptown' }]);
            await first;
        });
        await flush();
        expect([...select.options].map(option => option.value)).toEqual(['chelsea']);

        fireEvent.change(select, { target: { value: 'chelsea' } });
        expect(record.getField('store')).toBe('chelsea');
        expect(select.value).toBe('chelsea');
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('renders a control-owned prompt and defers options while disabled', async () => {
        const fetch = jest.fn(() => [{ text: 'Uptown store', value: 'uptown' }]);
        const record = new Record(
            {
                ready: field,
                store: field
                    .label('Store')
                    .disabled(r => !r.getField('ready'))
                    .options({ fetch }),
            },
            { ready: false, store: '' }
        );
        render(<FdlField record={record} field="store" selectPrompt="Select a store" />);
        const select = screen.getByLabelText('Store') as HTMLSelectElement;
        await flush();

        expect(select.disabled).toBe(true);
        expect(select.hasAttribute('aria-busy')).toBe(false);
        expect(select.options[0].textContent).toBe('Select a store');
        expect(fetch).not.toHaveBeenCalled();

        act(() => record.setField('ready', true));
        await act(async () => {
            await record.whenOptionsReady();
        });
        await flush();
        expect(select.disabled).toBe(false);
        expect([...select.options].map(option => option.value)).toEqual(['', 'uptown']);
    });

    it('does not add a prompt when the options supply an empty choice', async () => {
        const record = new Record(
            {
                method: field.label('Method').options([
                    { text: 'Choose', value: '' },
                    { text: 'Email', value: 'email' },
                ]),
            },
            { method: '' }
        );
        render(<FdlField record={record} field="method" selectPrompt="Pick one" />);
        await flush();
        const select = screen.getByLabelText('Method') as HTMLSelectElement;
        expect([...select.options].map(option => option.textContent)).toEqual(['Choose', 'Email']);
    });

    it('synchronizes multiple selections as arrays', async () => {
        const record = new Record(
            {
                colors: field
                    .label('Colors')
                    .multipleValues()
                    .options([
                        { text: 'Red', value: 'red' },
                        { text: 'Green', value: 'green' },
                        { text: 'Blue', value: 'blue' },
                    ]),
            },
            { colors: ['green'] }
        );
        render(<FdlField record={record} field="colors" selectPrompt="ignored" />);
        await flush();
        const select = screen.getByLabelText('Colors') as HTMLSelectElement;

        expect(select.multiple).toBe(true);
        expect([...select.options].map(option => option.value)).toEqual(['red', 'green', 'blue']);
        expect([...select.selectedOptions].map(option => option.value)).toEqual(['green']);

        select.options[0].selected = true;
        select.options[2].selected = true;
        fireEvent.change(select);
        expect(record.getField('colors')).toEqual(['red', 'green', 'blue']);

        act(() => record.setField('colors', ['blue']));
        expect([...select.selectedOptions].map(option => option.value)).toEqual(['blue']);
    });
});

describe('FdlField subscriptions', () => {
    it('removes its Record subscriptions on unmount', async () => {
        const record = new Record(
            { name: field.label('Name'), method: field.label('Method').options([]) },
            { name: '', method: '' }
        );
        const add = jest.spyOn(record, 'addEventListener');
        const remove = jest.spyOn(record, 'removeEventListener');
        const errors = jest.spyOn(console, 'error').mockImplementation(() => undefined);

        const { unmount } = render(
            <>
                <FdlField record={record} field="name" />
                <FdlField record={record} field="method" />
            </>
        );
        await flush();
        unmount();

        const added = add.mock.calls.map(([, listener]) => listener);
        const removed = remove.mock.calls.map(([, listener]) => listener);
        // Only the passive per-Record change counter remains.
        expect(added.filter(listener => !removed.includes(listener))).toHaveLength(1);

        act(() => record.setField('name', 'Ada'));
        await flush();
        expect(errors).not.toHaveBeenCalled();
        errors.mockRestore();
    });
});

describe('useRecordset', () => {
    function Rows({ recordset }: { recordset: Recordset<any> }) {
        const { records, totalCount, pageNumber, isLoading } = useRecordset(recordset);
        return (
            <div>
                <p data-testid="summary">
                    {isLoading ? 'loading' : `${totalCount} rows, page ${pageNumber}`}
                </p>
                <ul>
                    {records.map(record => (
                        <li key={record.getField('id')}>{record.getField('name')}</li>
                    ))}
                </ul>
            </div>
        );
    }

    it('re-renders when the recordset loads and pages', async () => {
        const recordset = new Recordset({ id: field, name: field }, () => [
            { id: 1, name: 'Ada' },
            { id: 2, name: 'Grace' },
            { id: 3, name: 'Hedy' },
        ]);
        recordset.pageSize = 2;
        render(<Rows recordset={recordset} />);

        await act(async () => {
            await recordset.requestHardUpdate();
        });
        expect(screen.getByTestId('summary').textContent).toBe('3 rows, page 1');
        expect(screen.getAllByRole('listitem').map(item => item.textContent)).toEqual([
            'Ada',
            'Grace',
        ]);

        await act(async () => {
            recordset.pageNumber = 2;
            await recordset.updating;
        });
        expect(screen.getByTestId('summary').textContent).toBe('3 rows, page 2');
        expect(screen.getAllByRole('listitem').map(item => item.textContent)).toEqual(['Hedy']);
    });
});

describe('FdlField review regressions', () => {
    it('shows no choice when the stored value matches no option', async () => {
        const record = new Record(
            {
                method: field.label('Method').options([
                    { text: 'Email', value: 'email' },
                    { text: 'Phone', value: 'phone' },
                ]),
            },
            { method: '' as string | undefined }
        );
        render(<FdlField record={record} field="method" />);
        await flush();
        const select = screen.getByLabelText('Method') as HTMLSelectElement;
        expect(select.selectedIndex).toBe(-1);

        act(() => record.setField('method', 'phone'));
        expect(select.value).toBe('phone');

        act(() => record.setField('method', undefined));
        expect(select.selectedIndex).toBe(-1);
        expect(select.selectedOptions).toHaveLength(0);
    });

    it('does not carry in-progress text to a different record', () => {
        const amount = amountField();
        const first = new Record({ amount }, { amount: null as number | null });
        const second = new Record({ amount }, { amount: 12 as number | null });
        const { rerender } = render(<FdlField record={first} field="amount" />);
        const input = screen.getByLabelText('Amount') as HTMLInputElement;

        fireEvent.change(input, { target: { value: '12.' } });
        expect(input.value).toBe('12.');
        rerender(<FdlField record={second} field="amount" />);
        expect(input.value).toBe('12.00');
    });

    it('clears a file picker when the record value is cleared', () => {
        const record = new Record(
            { attachment: field.label('Attachment').type('file').accept('.pdf') },
            { attachment: '' }
        );
        render(<FdlField record={record} field="attachment" />);
        const input = screen.getByLabelText('Attachment') as HTMLInputElement;
        expect(input.type).toBe('file');
        expect(input.accept).toBe('.pdf');

        // jsdom cannot pick a file, so stand in for the browser's picker value.
        let picked = 'C:\\fakepath\\report.pdf';
        Object.defineProperty(input, 'value', {
            configurable: true,
            get: () => picked,
            set: (next: string) => {
                picked = next;
            },
        });
        fireEvent.change(input);
        expect(record.getField('attachment')).toBe('C:\\fakepath\\report.pdf');

        act(() => record.setField('attachment', ''));
        expect(picked).toBe('');
    });
});

describe('FdlField checklist coverage', () => {
    it('uses the input type from field metadata', () => {
        const record = new Record(
            { email: field.label('Email').type('email').required() },
            { email: '' }
        );
        render(<FdlField record={record} field="email" />);
        const input = screen.getByRole('textbox', { name: /Email/ }) as HTMLInputElement;
        expect(input.type).toBe('email');
        expect(input.required).toBe(true);
    });

    it('marks required selects and textareas natively', async () => {
        const record = new Record(
            {
                method: field
                    .label('Method')
                    .required()
                    .options([{ text: 'Email', value: 'email' }]),
                notes: field.label('Notes').required().rowCount(2),
            },
            { method: 'email', notes: '' }
        );
        render(
            <>
                <FdlField record={record} field="method" />
                <FdlField record={record} field="notes" />
            </>
        );
        await flush();
        expect(
            (screen.getByRole('combobox', { name: /Method/ }) as HTMLSelectElement).required
        ).toBe(true);
        expect(
            (screen.getByRole('textbox', { name: /Notes/ }) as HTMLTextAreaElement).required
        ).toBe(true);
    });

    it('omits the label for hideLabel() and hides fields that become invisible', () => {
        const record = new Record(
            {
                show: field,
                search: field.label('Search').hideLabel(),
                extra: field.label('Extra').visible(r => r.getField('show')),
            },
            { show: true, search: '', extra: '' }
        );
        const { container } = render(
            <>
                <FdlField record={record} field="search" />
                <FdlField record={record} field="extra" />
            </>
        );
        expect(screen.queryByText('Search')).toBeNull();
        expect(container.querySelectorAll('input')).toHaveLength(2);
        expect(screen.getByLabelText('Extra').tagName).toBe('INPUT');

        act(() => record.setField('show', false));
        expect(screen.queryByText('Extra')).toBeNull();
        expect(container.querySelectorAll('input')).toHaveLength(1);
    });

    it('stops loading and restores declared disabled state when a field is disabled mid-lookup', async () => {
        let resolve!: (options: Option[]) => void;
        const fetch = jest.fn(
            () =>
                new Promise<Option[]>(done => {
                    resolve = done;
                })
        );
        const record = new Record(
            {
                locked: field,
                store: field
                    .label('Store')
                    .disabled(r => r.getField('locked'))
                    .options({ fetch }),
            },
            { locked: false, store: '' }
        );
        render(<FdlField record={record} field="store" />);
        const select = screen.getByLabelText('Store') as HTMLSelectElement;
        await flush();
        expect(select.getAttribute('aria-busy')).toBe('true');

        act(() => record.setField('locked', true));
        await flush();
        expect(select.disabled).toBe(true);
        expect(select.hasAttribute('aria-busy')).toBe(false);
        expect(screen.queryByRole('status')).toBeNull();

        await act(async () => {
            resolve([{ text: 'Stale', value: 'stale' }]);
        });
        await flush();
        expect([...select.options].map(option => option.value)).toEqual([]);
    });

    it('stops loading after a failed lookup', async () => {
        const record = new Record(
            {
                store: field.label('Store').options({
                    fetch: () => Promise.reject(new Error('offline')),
                }),
            },
            { store: '' }
        );
        render(<FdlField record={record} field="store" />);
        await flush();
        await flush();
        const select = screen.getByLabelText('Store') as HTMLSelectElement;
        expect(select.disabled).toBe(false);
        expect(select.hasAttribute('aria-busy')).toBe(false);
    });

    it('loads options once and cleans up under StrictMode', async () => {
        const fetch = jest.fn(() => Promise.resolve([{ text: 'Uptown', value: 'uptown' }]));
        const record = new Record(
            { store: field.label('Store').options({ fetch }) },
            { store: 'uptown' }
        );
        const remove = jest.spyOn(record, 'removeEventListener');
        const { unmount } = render(
            <StrictMode>
                <FdlField record={record} field="store" />
            </StrictMode>
        );
        await flush();
        const select = screen.getByLabelText('Store') as HTMLSelectElement;
        expect(select.disabled).toBe(false);
        expect(select.value).toBe('uptown');
        expect(fetch).toHaveBeenCalledTimes(1);

        unmount();
        expect(remove).toHaveBeenCalled();
    });
});
