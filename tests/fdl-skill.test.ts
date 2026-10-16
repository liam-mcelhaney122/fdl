/// <reference types="node" />
import fs from 'fs';
import path from 'path';
import { boolean, date, email, field, number, Record, Recordset, string } from '../index';

// The agent skill teaches these behaviors; keep its claims executable.
const skillPath = path.join(__dirname, '../.agents/skills/fdl/SKILL.md');

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function formatUsd(value: number) {
    return usd.format(value);
}

function parseUsd(text: unknown) {
    return Number(String(text).replace(/[$,]/g, ''));
}

const money = number.formatter(formatUsd).parser(parseUsd).textAlign('right');

const paymentAmount = money
    .label('Amount')
    .required()
    .validator({ name: 'must be positive', validate: (value: number) => value > 0 });

function isUnitedStates(record: Record<any>) {
    return record.getField('country') === 'US';
}

describe('fdl agent skill', () => {
    it('has front matter naming the skill and when to use it', () => {
        const skill = fs.readFileSync(skillPath, 'utf8');
        expect(skill).toMatch(/^---\nname: fdl\ndescription: >\n/);
        expect(skill).toContain('Use when');
    });

    it('specializes definitions without changing the source', () => {
        const name = field.maxLength(100);
        const requiredName = name.required();
        const optional = new Record({ name }, { name: '' });
        const required = new Record({ name: requiredName }, { name: '' });
        expect(optional.isValid()).toBe(true);
        expect(required.isValid()).toBe(false);
    });

    it('parses user input, formats output, and validates the money example', () => {
        const record = new Record({ amount: paymentAmount }, { amount: 0 });
        expect(record.isValid('amount')).toBe(false);
        record.parseAndSetField('amount', '$1,234.50');
        expect(record.getField('amount')).toBe(1234.5);
        expect(record.print('amount')).toBe('$1,234.50');
        expect(record.isValid()).toBe(true);
        expect(record.fieldTypeForField('amount').textAlign(1, record, 'table')).toBe('right');
    });

    it('documents primitive defaults without type conversion', () => {
        const record = new Record({ s: string, n: number, b: boolean, d: date }, {} as any);
        record.clear();
        expect(record.getField('s')).toBe('');
        expect(record.getField('n')).toBe(0);
        expect(record.getField('b')).toBe(false);
        expect(record.getField('d')).toBeInstanceOf(Date);
        expect(record.parse('n', '42')).toBe('42');
    });

    it('applies conditional requiredness and visibility from the record', () => {
        const record = new Record(
            {
                country: string.label('Country').required(),
                state: string.label('State').required(isUnitedStates).visible(isUnitedStates),
            },
            { country: 'US', state: '' }
        );
        const state = record.fieldTypeForField('state');
        expect(record.isValid('state')).toBe(false);
        expect(record.readableFieldErrors('state')).toEqual(['State is required']);
        expect(state.visible('', record, 'model')).toBe(true);
        record.setField('country', 'CA');
        expect(record.isValid('state')).toBe(true);
        expect(state.visible('', record, 'model')).toBe(false);
    });

    it('keeps any-true rules and accumulates validators', () => {
        const record = new Record(
            {
                code: string
                    .required()
                    .required(() => false)
                    .minLength(2)
                    .maxLength(3),
            },
            { code: '' }
        );
        expect(record.fieldTypeForField('code').required('', record, 'model')).toBe(true);
        record.setField('code', 'ABCD');
        expect(record.isValid('code')).toBe(false);
        record.setField('code', 'AB');
        expect(record.isValid('code')).toBe(true);
    });

    it('clears an unavailable selection once options settle', async () => {
        const stores: { [zip: string]: { id: string; name: string }[] } = {
            '10001': [{ id: 'nyc', name: 'Manhattan' }],
            '60601': [{ id: 'chi', name: 'Loop' }],
        };
        const record = new Record(
            {
                zip: string,
                store: field
                    .label('Store')
                    .required()
                    .options({
                        fetch: (r: Record<any>) => stores[r.getField('zip')] ?? [],
                        fields: ['zip'],
                        text: (store: { name: string }) => store.name,
                        value: (store: { id: string }) => store.id,
                    }),
            },
            { zip: '10001', store: 'nyc' }
        );
        await record.whenOptionsReady();
        expect(record.getField('store')).toBe('nyc');
        record.setField('zip', '60601');
        await record.whenOptionsReady();
        expect(record.getField('store')).toBeUndefined();
        expect(record.isValid('store')).toBe(false);
    });

    it('throws from synchronous validation when a validator is async', async () => {
        const record = new Record(
            {
                username: string.validator({
                    name: 'is available',
                    validate: async () => true,
                }),
            },
            { username: 'ada' }
        );
        expect(() => record.isValid()).toThrow();
        await expect(record.isValidAsync()).resolves.toBe(true);
    });

    it('fires change on setField but not on direct value mutation', () => {
        const record = new Record({ name: string }, { name: 'Ada' });
        const changed: string[] = [];
        record.addEventListener('change', event => {
            changed.push((event as CustomEvent).detail.field);
        });
        record.setField('name', 'Ada');
        (record.values as any).name = 'Grace';
        expect(changed).toEqual(['name']);
        record.reset();
        expect(record.getField('name')).toBe('Ada');
    });

    it('only validates fields present in the initial values', () => {
        const record = new Record({ name: string.required() }, {} as any);
        expect(record.isValid()).toBe(true);
        expect(record.isValid('name')).toBe(false);
    });

    it('validates email syntax only for the email preset', () => {
        const record = new Record({ email }, { email: 'not-an-email' });
        expect(record.isValid()).toBe(false);
        record.setField('email', 'ada@example.com');
        expect(record.isValid()).toBe(true);
    });

    it('loads, sorts, filters, and pages a client-side recordset', async () => {
        const invoices = new Recordset(
            { id: string, customer: string.filter(), amount: money.sortable(true) },
            [
                { id: '1', customer: 'Ada', amount: 20 },
                { id: '2', customer: 'Grace', amount: -5 },
                { id: '3', customer: 'Alan', amount: 50 },
            ]
        );
        expect(invoices.allRecords).toHaveLength(0);
        await invoices.requestHardUpdate();
        invoices.sortColumns = [{ field: 'amount', sort: 'descending' }] as any;
        invoices.filter = (record: Record<any>) => record.getField('amount') > 0;
        invoices.pageSize = 1;
        await invoices.updating;
        expect(invoices.filteredCount).toBe(2);
        expect(invoices.currentPage.map(record => record.getField('id'))).toEqual(['3']);
        invoices.pageNumber = 2;
        await invoices.updating;
        expect(invoices.pageIndex).toBe(1);
        expect(invoices.currentPage.map(record => record.getField('id'))).toEqual(['1']);
    });
});
