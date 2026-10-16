import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import * as adapter from '../adapters/react';
import { FdlField, useRecordset } from '../adapters/react';
import { field } from '../primitives.js';
import Record from '../record.js';
import Recordset from '../recordset.js';

// The TypeScript config does not load Node types; Jest provides these at runtime.
declare const require: (id: string) => any;
declare const __dirname: string;

const referencePath = require('path').join(__dirname, '../.agents/skills/fdl/references/react.md');

async function flush() {
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });
}

describe('React skill reference', () => {
    const reference: string = require('fs').readFileSync(referencePath, 'utf8');

    it('exists and documents every exported hook and the import path', () => {
        const hooks = Object.keys(adapter).filter(name => /^use[A-Z]/.test(name));
        expect(hooks.sort()).toEqual([
            'useFieldOptions',
            'useFieldState',
            'useRecord',
            'useRecordVersion',
            'useRecordset',
        ]);
        hooks.forEach(hook => expect(reference).toContain(`${hook}(`));
        expect(reference).toContain("from '@pmcelhaney/fdl/adapters/react'");
        expect(reference).toContain('<FdlField');
    });

    it('shows the same submit-gated validation pattern this test runs', () => {
        expect(reference).toContain('showValidationErrors={submitted}');
        expect(reference).toContain('if (contact.isValid()) onSave(contact.values);');
        expect(reference).toContain('<form noValidate onSubmit={handleSubmit}>');
    });

    it('runs the form pattern: errors appear only after submit and save waits for validity', async () => {
        const contact = new Record(
            {
                name: field.label('Full name').required(),
                method: field
                    .label('Contact method')
                    .required()
                    .options([
                        { text: 'Email', value: 'email' },
                        { text: 'Phone', value: 'phone' },
                    ]),
            },
            { name: '', method: '' }
        );

        function ContactForm({ onSave }: { onSave: (values: unknown) => void }) {
            const [submitted, setSubmitted] = useState(false);
            function handleSubmit(event: FormEvent) {
                event.preventDefault();
                setSubmitted(true);
                if (contact.isValid()) onSave(contact.values);
            }
            return (
                <form noValidate onSubmit={handleSubmit}>
                    <FdlField record={contact} field="name" showValidationErrors={submitted} />
                    <FdlField
                        record={contact}
                        field="method"
                        selectPrompt="Choose a method"
                        showValidationErrors={submitted}
                    />
                    <button type="submit">Save</button>
                </form>
            );
        }

        const onSave = jest.fn();
        render(<ContactForm onSave={onSave} />);
        await flush();
        const name = screen.getByLabelText(/Full name/) as HTMLInputElement;
        const method = screen.getByLabelText(/Contact method/) as HTMLSelectElement;
        expect(name.hasAttribute('aria-invalid')).toBe(false);
        expect(method.options[0].textContent).toBe('Choose a method');

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(onSave).not.toHaveBeenCalled();
        expect(name.getAttribute('aria-invalid')).toBe('true');
        const error = document.getElementById(name.getAttribute('aria-describedby') as string);
        expect(error?.className).toBe('validation-error');

        fireEvent.change(name, { target: { value: 'Ada' } });
        fireEvent.change(method, { target: { value: 'email' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(onSave).toHaveBeenCalledWith({ name: 'Ada', method: 'email' });
        expect(document.querySelector('.validation-error')).toBeNull();
    });

    it('runs the dependent options pattern', async () => {
        const fetchStores = jest.fn((zip: string) =>
            Promise.resolve([{ text: `Store ${zip}`, value: `s${zip}` }])
        );
        const order = new Record(
            {
                zip: field.label('ZIP').inputMask(/[0-9]/).maxLength(5),
                store: field
                    .label('Pickup store')
                    .disabled(r => String(r.getField('zip')).length !== 5)
                    .options({
                        fields: ['zip'],
                        fetch: r => fetchStores(r.getField('zip')),
                    }),
            },
            { zip: '', store: '' }
        );
        render(
            <>
                <FdlField record={order} field="zip" />
                <FdlField record={order} field="store" />
            </>
        );
        await flush();
        const store = screen.getByLabelText('Pickup store') as HTMLSelectElement;
        expect(store.disabled).toBe(true);
        expect(fetchStores).not.toHaveBeenCalled();

        fireEvent.change(screen.getByLabelText('ZIP'), { target: { value: '2a8202' } });
        expect(order.getField('zip')).toBe('28202');
        await flush();
        expect(store.disabled).toBe(false);
        expect([...store.options].map(option => option.value)).toEqual(['s28202']);
    });

    it('runs the Recordset table pattern', async () => {
        expect(reference).toContain('useRecordset(recordset)');

        function Reports({ recordset }: { recordset: Recordset<any> }) {
            const { records, isLoading, filteredCount, pageNumber } = useRecordset(recordset);
            useEffect(() => {
                recordset.requestHardUpdate();
            }, [recordset]);
            if (isLoading) return <p role="status">Loading…</p>;
            return (
                <table>
                    <caption>
                        {filteredCount} reports, page {pageNumber}
                    </caption>
                    <tbody>
                        {records.map(record => (
                            <tr key={String(record.getField('id'))}>
                                <td>{record.print('title')}</td>
                                <td>
                                    <FdlField record={record} field="amount" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        const recordset = new Recordset(
            { id: field, title: field, amount: field.label('Amount') },
            () => [
                { id: 1, title: 'Q1', amount: '10' },
                { id: 2, title: 'Q2', amount: '20' },
                { id: 3, title: 'Q3', amount: '30' },
            ]
        );
        recordset.pageSize = 2;
        render(<Reports recordset={recordset} />);
        await act(async () => {
            await recordset.updating;
        });
        await flush();
        expect(screen.getByRole('table').querySelector('caption')?.textContent).toBe(
            '3 reports, page 1'
        );
        expect(screen.getAllByLabelText('Amount')).toHaveLength(2);

        await act(async () => {
            recordset.pageNumber = 2;
            await recordset.updating;
        });
        expect(screen.getByRole('table').querySelector('caption')?.textContent).toBe(
            '3 reports, page 2'
        );
        expect(screen.getByRole('cell', { name: 'Q3' })).toBeTruthy();
    });
});
