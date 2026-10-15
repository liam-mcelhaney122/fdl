import FieldType from '../field-type.js';
import Recordset from '../recordset.js';
import Record from '../record.js';
import { resizeColumnWidths } from '../examples/fdl-input/fdl-table';

type TestTable = HTMLElement & {
    recordset: Recordset<any>;
    updateComplete: Promise<boolean>;
    requestUpdate(): void;
};

const rows = (table: TestTable) =>
    [...(table.shadowRoot?.querySelectorAll('tbody tr') ?? [])].map(row =>
        [...row.querySelectorAll('td')].map(cell => cell.textContent?.trim())
    );

const settle = async (table: TestTable) => {
    await Promise.resolve();
    await Promise.resolve();
    await table.updateComplete;
};

describe('<fdl-table>', () => {
    it.each(['cellClass', 'rowClass'] as const)('%s evaluates classes with each row record and updates them when another field changes', async modifier => {
        const classForAmount = jest.fn((value: number, record: Record<any>) =>
            value > record.getField('limit') ? ['warning', 'over-limit'] : []);
        const recordset = new Recordset(
            {
                amount: new FieldType<number>().with[modifier]('amount').and[modifier](['numeric']).and[modifier](classForAmount),
                limit: new FieldType<number>(),
            },
            [{ amount: 150, limit: 100 }, { amount: 150, limit: 200 }]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = '<fdl-column field="amount"></fdl-column>';
        document.body.append(table);
        await settle(table);

        const targets = () => [...table.shadowRoot!.querySelectorAll(modifier === 'cellClass' ? 'tbody td' : 'tbody tr')];
        expect(targets().map(target => target.className)).toEqual(['amount numeric warning over-limit', 'amount numeric']);
        expect(classForAmount).toHaveBeenCalledWith(150, recordset.currentPage[0], 'table');
        expect(classForAmount).toHaveBeenCalledWith(150, recordset.currentPage[1], 'table');

        recordset.currentPage[0].setField('limit', 200);
        await settle(table);
        expect(targets().map(target => target.className)).toEqual(['amount numeric', 'amount numeric']);
        table.remove();
    });

    it('resizes the left column and distributes the difference to columns on its right', () => {
        expect(
            resizeColumnWidths(
                [150, 100, 100],
                [{ min: 50 }, { min: 80 }, { min: 50 }],
                0,
                40
            )
        ).toEqual([190, 80, 80]);
    });

    it('stops a resize at the configured column limits', () => {
        expect(
            resizeColumnWidths(
                [150, 100],
                [{ min: 100, max: 160 }, { min: 90, max: 110 }],
                0,
                30
            )
        ).toEqual([160, 90]);
        expect(
            resizeColumnWidths(
                [150, 100],
                [{ min: 100, max: 160 }, { min: 90, max: 110 }],
                0,
                -30
            )
        ).toEqual([140, 110]);
    });

    it('exposes column width constraints and supports keyboard resizing', async () => {
        const recordset = new Recordset(
            {
                left: new FieldType().with
                    .label('Amount')
                    .and.minColumnWidth(100)
                    .and.maxColumnWidth(180),
                right: new FieldType().with.minColumnWidth(80).and.maxColumnWidth(120),
            },
            [{ left: 'Left', right: 'Right' }]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.setAttribute('show-width-diagnostics', '');
        table.innerHTML = `
            <fdl-column field="left"></fdl-column>
            <fdl-column field="right"></fdl-column>
        `;
        document.body.append(table);
        await settle(table);

        const headers = table.shadowRoot?.querySelectorAll<HTMLTableCellElement>('th');
        headers![0].getBoundingClientRect = () => ({ width: 150 } as DOMRect);
        headers![1].getBoundingClientRect = () => ({ width: 100 } as DOMRect);

        const press = async (key: string, shiftKey = false) => {
            const handle = table.shadowRoot?.querySelector<HTMLElement>('.resize-handle');
            const event = new KeyboardEvent('keydown', {
                bubbles: true,
                cancelable: true,
                key,
                shiftKey,
            });
            handle?.dispatchEvent(event);
            await table.updateComplete;
            return event;
        };

        expect(await press('ArrowRight')).toHaveProperty('defaultPrevented', true);
        let handle = table.shadowRoot?.querySelector<HTMLElement>('.resize-handle');
        expect(handle?.tabIndex).toBe(0);
        expect(handle?.getAttribute('role')).toBe('separator');
        expect(handle?.getAttribute('aria-orientation')).toBe('vertical');
        expect(handle?.getAttribute('aria-label')).toBe('Resize Amount column');
        expect(handle?.getAttribute('aria-valuemin')).toBe('130');
        expect(handle?.getAttribute('aria-valuemax')).toBe('170');
        expect(handle?.getAttribute('aria-valuenow')).toBe('151');

        await press('ArrowRight', true);
        expect(table.shadowRoot?.querySelectorAll('col')[0].getAttribute('style')).toContain(
            'width:161px'
        );
        expect(table.shadowRoot?.querySelectorAll('col')[1].getAttribute('style')).toContain(
            'width:89px'
        );

        await press('End');
        handle = table.shadowRoot?.querySelector<HTMLElement>('.resize-handle');
        expect(handle?.getAttribute('aria-valuenow')).toBe('170');
        expect(table.shadowRoot?.querySelectorAll('col')[1].getAttribute('style')).toContain(
            'width:80px'
        );

        expect(table.shadowRoot!.querySelector('.width-diagnostics')!.textContent).toContain('170px');
        expect(table.shadowRoot!.querySelector('.width-diagnostics [role=status]')!.textContent).toContain('neighboring column');
        await press('Home');
        handle = table.shadowRoot?.querySelector<HTMLElement>('.resize-handle');
        expect(handle?.getAttribute('aria-valuenow')).toBe('130');
        expect(table.shadowRoot?.querySelectorAll('col')[1].getAttribute('style')).toContain(
            'width:120px'
        );

        await press('ArrowLeft');
        expect(table.shadowRoot?.querySelectorAll('col')[0].getAttribute('style')).toContain(
            'width:130px'
        );

        table.remove();
    });

    it('continues tracking a drag after rendering replaces the resize handle', async () => {
        const recordset = new Recordset(
            {
                left: new FieldType().with.minColumnWidth(100),
                right: new FieldType().with.minColumnWidth(80),
            },
            [{ left: 'Left', right: 'Right' }]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = `
            <fdl-column field="left"></fdl-column>
            <fdl-column field="right"></fdl-column>
        `;
        document.body.append(table);
        await settle(table);

        const columns = table.shadowRoot?.querySelectorAll<HTMLTableColElement>('col');
        expect(columns).toHaveLength(2);
        columns![0].getBoundingClientRect = () => ({ width: 150 } as DOMRect);
        columns![1].getBoundingClientRect = () => ({ width: 100 } as DOMRect);
        const handle = table.shadowRoot?.querySelector<HTMLElement>('.resize-handle');

        handle?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 100 }));
        window.dispatchEvent(new MouseEvent('pointermove', { clientX: 120 }));
        await table.updateComplete;

        expect(table.shadowRoot?.querySelectorAll('col')[0].getAttribute('style')).toContain(
            'width:170px'
        );
        expect(table.shadowRoot?.querySelectorAll('col')[1].getAttribute('style')).toContain(
            'width:80px'
        );

        window.dispatchEvent(new MouseEvent('pointerup'));
        table.remove();
    });

    it('supports mouse dragging when pointer events are unavailable', async () => {
        const recordset = new Recordset(
            {
                left: new FieldType().with.minColumnWidth(100),
                right: new FieldType().with.minColumnWidth(80),
            },
            [{ left: 'Left', right: 'Right' }]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = `
            <fdl-column field="left"></fdl-column>
            <fdl-column field="right"></fdl-column>
        `;
        document.body.append(table);
        await settle(table);

        const columns = table.shadowRoot?.querySelectorAll<HTMLTableColElement>('col');
        columns![0].getBoundingClientRect = () => ({ width: 150 } as DOMRect);
        columns![1].getBoundingClientRect = () => ({ width: 100 } as DOMRect);
        const handle = table.shadowRoot?.querySelector<HTMLElement>('.resize-handle');

        handle?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100 }));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120 }));
        await table.updateComplete;

        expect(table.shadowRoot?.querySelectorAll('col')[0].getAttribute('style')).toContain(
            'width:170px'
        );
        expect(table.shadowRoot?.querySelectorAll('col')[1].getAttribute('style')).toContain(
            'width:80px'
        );

        window.dispatchEvent(new MouseEvent('mouseup'));
        table.remove();
    });

    it('measures rendered header cells when col elements have no layout boxes', async () => {
        const recordset = new Recordset(
            {
                left: new FieldType().with.minColumnWidth(100),
                right: new FieldType().with.minColumnWidth(80),
            },
            [{ left: 'Left', right: 'Right' }]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = `
            <fdl-column field="left"></fdl-column>
            <fdl-column field="right"></fdl-column>
        `;
        document.body.append(table);
        await settle(table);

        const columns = table.shadowRoot?.querySelectorAll<HTMLTableColElement>('col');
        columns![0].getBoundingClientRect = () => ({ width: 0 } as DOMRect);
        columns![1].getBoundingClientRect = () => ({ width: 0 } as DOMRect);
        const headers = table.shadowRoot?.querySelectorAll<HTMLTableCellElement>('th');
        headers![0].getBoundingClientRect = () => ({ width: 150 } as DOMRect);
        headers![1].getBoundingClientRect = () => ({ width: 100 } as DOMRect);
        const handle = table.shadowRoot?.querySelector<HTMLElement>('.resize-handle');

        handle?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100 }));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120 }));
        await table.updateComplete;

        expect(table.shadowRoot?.querySelectorAll('col')[0].getAttribute('style')).toContain(
            'width:170px'
        );
        expect(table.shadowRoot?.querySelectorAll('col')[1].getAttribute('style')).toContain(
            'width:80px'
        );

        window.dispatchEvent(new MouseEvent('mouseup'));
        table.remove();
    });

    it('renders recordset fields through declarative columns', async () => {
        const recordset = new Recordset(
            {
                firstName: new FieldType().with.label('First name'),
                lastName: new FieldType().with.label('Last name'),
            },
            [
                { firstName: 'Ada', lastName: 'Lovelace' },
                { firstName: 'Grace', lastName: 'Hopper' },
            ]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = `
            <fdl-column field="firstName"></fdl-column>
            <fdl-column field="lastName"></fdl-column>
        `;
        document.body.append(table);

        await table.updateComplete;
        await settle(table);

        expect(
            [...(table.shadowRoot?.querySelectorAll('th') ?? [])].map(header =>
                header.textContent?.trim()
            )
        ).toEqual(['First name', 'Last name']);
        expect(rows(table)).toEqual([
            ['Ada', 'Lovelace'],
            ['Grace', 'Hopper'],
        ]);

        table.remove();
    });

    it('promotes the newest sort while retaining earlier sorts as tie-breakers', async () => {
        const compare = (left: string, right: string) =>
            left.localeCompare(right) as -1 | 0 | 1;
        const recordset = new Recordset(
            {
                firstName: new FieldType<string>().with.compareFunction(compare),
                lastName: new FieldType<string>().with.compareFunction(compare),
            },
            [
                { firstName: 'Ada', lastName: 'Zulu' },
                { firstName: 'Grace', lastName: 'Alpha' },
                { firstName: 'Ada', lastName: 'Mike' },
                { firstName: 'Grace', lastName: 'Beta' },
            ]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = `
            <fdl-column field="firstName"></fdl-column>
            <fdl-column field="lastName"></fdl-column>
        `;
        document.body.append(table);

        await table.updateComplete;
        await settle(table);

        const headers = table.shadowRoot?.querySelectorAll<HTMLButtonElement>('th button');
        headers?.[1].click();
        await settle(table);
        headers?.[0].click();
        await settle(table);

        expect(recordset.sortColumns).toEqual([
            { field: 'firstName', sort: 'ascending' },
            { field: 'lastName', sort: 'ascending' },
        ]);
        expect(rows(table)).toEqual([
            ['Ada', 'Mike'],
            ['Ada', 'Zulu'],
            ['Grace', 'Alpha'],
            ['Grace', 'Beta'],
        ]);
        expect(headers?.[0].title).toContain('sort priority 1');
        expect(headers?.[1].title).toContain('sort priority 2');

        headers?.[0].click();
        await settle(table);
        expect(rows(table)).toEqual([
            ['Grace', 'Alpha'],
            ['Grace', 'Beta'],
            ['Ada', 'Mike'],
            ['Ada', 'Zulu'],
        ]);

        // An existing secondary sort toggles and becomes the primary sort.
        headers?.[1].click();
        await settle(table);
        expect(recordset.sortColumns).toEqual([
            {field:'lastName',sort:'descending'},
            {field:'firstName',sort:'descending'},
        ]);
        expect(rows(table)).toEqual([
            ['Ada','Zulu'], ['Ada','Mike'], ['Grace','Beta'], ['Grace','Alpha'],
        ]);
        expect(headers?.[1].title).toContain('sort priority 1');
        expect(headers?.[0].title).toContain('sort priority 2');
        expect(headers?.[1].closest('th')!.getAttribute('aria-sort')).toBe('descending');
        expect(headers?.[0].closest('th')!.hasAttribute('aria-sort')).toBe(false);

        // Further clicks alternate directions without removing either sort.
        headers?.[1].click();
        await settle(table);
        expect(recordset.sortColumns).toEqual([
            {field:'lastName',sort:'ascending'},
            {field:'firstName',sort:'descending'},
        ]);
        expect(rows(table)).toEqual([
            ['Grace','Alpha'], ['Grace','Beta'], ['Ada','Mike'], ['Ada','Zulu'],
        ]);
        headers?.[0].click();
        await settle(table);
        expect(recordset.sortColumns).toEqual([
            {field:'firstName',sort:'ascending'},
            {field:'lastName',sort:'ascending'},
        ]);
        expect(rows(table)).toEqual([
            ['Ada','Mike'], ['Ada','Zulu'], ['Grace','Alpha'], ['Grace','Beta'],
        ]);
        table.remove();
    });

    it('does not sort fields configured with sortable(false)', async () => {
        const recordset = new Recordset(
            { name: new FieldType().with.sortable(false) },
            [{ name: 'Zulu' }, { name: 'Alpha' }]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = '<fdl-column field="name"></fdl-column>';
        document.body.append(table);

        await table.updateComplete;
        await settle(table);

        expect(table.shadowRoot?.querySelector('th button')).toBeNull();
        expect(recordset.sortColumns).toEqual([]);

        table.remove();
    });

    it('filters a column from an accessible header control', async () => {
        const recordset = new Recordset(
            {
                name: new FieldType().with.label('Name').and.filter(),
                team: new FieldType().with.label('Team'),
            },
            [
                { name: 'Ada', team: 'Research' },
                { name: 'Grace', team: 'Platform' },
                { name: 'Margaret', team: 'Research' },
            ]
        );
        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = `
            <fdl-column field="name"></fdl-column>
            <fdl-column field="team"></fdl-column>
        `;
        document.body.append(table);
        await settle(table);

        expect(table.shadowRoot?.querySelector('[aria-label="Filter Team"]')).toBeNull();
        const filterButton = table.shadowRoot?.querySelector<HTMLButtonElement>(
            '[aria-label="Filter Name"]'
        );
        filterButton?.click();
        await table.updateComplete;

        expect(filterButton?.getAttribute('aria-expanded')).toBe('true');
        const input = table.shadowRoot?.querySelector<HTMLInputElement>('[data-filter-input="name"]');
        expect(table.shadowRoot?.activeElement).toBe(input);
        input?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
        await table.updateComplete;
        expect(table.shadowRoot?.querySelector('[role="dialog"]')).toBeNull();
        expect(table.shadowRoot?.activeElement).toBe(filterButton);

        filterButton?.click();
        await table.updateComplete;
        const reopenedInput = table.shadowRoot?.querySelector<HTMLInputElement>(
            '[data-filter-input="name"]'
        );
        reopenedInput!.value = 'gr';
        reopenedInput?.dispatchEvent(new InputEvent('input', { bubbles: true }));
        await recordset.requestUpdate();
        await settle(table);

        expect(rows(table)).toEqual([['Grace', 'Platform']]);
        expect(table.shadowRoot?.querySelector('.filter-chip')?.textContent).toContain(
            'Name: “gr”'
        );
        expect(filterButton?.classList.contains('filtered')).toBe(true);

        table.shadowRoot?.querySelector<HTMLButtonElement>('.filter-chip')?.click();
        await recordset.requestUpdate();
        await settle(table);
        expect(rows(table)).toEqual([
            ['Ada', 'Research'],
            ['Grace', 'Platform'],
            ['Margaret', 'Research'],
        ]);

        table.remove();
    });

    it('combines column filters with an application-owned Recordset filter', async () => {
        const recordset = new Recordset(
            {
                name: new FieldType<string>().with.filter((text, value) =>
                    value.toLowerCase().startsWith(text.toLowerCase())
                ),
                team: new FieldType().with.filter(),
            },
            [
                { name: 'Ada', team: 'Research' },
                { name: 'Grace', team: 'Research' },
                { name: 'Margaret', team: 'Platform' },
            ]
        );
        const applicationFilter = (record: any) => record.getField('team') === 'Research';
        recordset.filter = applicationFilter;
        await recordset.requestUpdate();

        const table = document.createElement('fdl-table') as TestTable;
        table.recordset = recordset;
        table.innerHTML = `
            <fdl-column field="name"></fdl-column>
            <fdl-column field="team"></fdl-column>
        `;
        document.body.append(table);
        await settle(table);

        const setColumnFilter = async (field: string, value: string) => {
            table.shadowRoot
                ?.querySelector<HTMLButtonElement>(`[aria-label="Filter ${field[0].toUpperCase()}${field.slice(1)}"]`)
                ?.click();
            await table.updateComplete;
            const input = table.shadowRoot?.querySelector<HTMLInputElement>(
                `[data-filter-input="${field}"]`
            );
            input!.value = value;
            input?.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await recordset.requestUpdate();
            await settle(table);
        };

        await setColumnFilter('name', 'gr');
        expect(rows(table)).toEqual([['Grace', 'Research']]);

        await setColumnFilter('team', 'search');
        expect(rows(table)).toEqual([['Grace', 'Research']]);
        expect(table.shadowRoot?.querySelectorAll('.filter-chip')).toHaveLength(2);

        table.shadowRoot?.querySelector<HTMLButtonElement>('.clear-all')?.click();
        await recordset.requestUpdate();
        await settle(table);
        expect(recordset.filter).toBe(applicationFilter);
        expect(rows(table)).toEqual([
            ['Ada', 'Research'],
            ['Grace', 'Research'],
        ]);

        table.remove();
    });
});


it.each([true, false])('aligns table headings and cells for sortable=%s', async sortable => {
    const recordset = new Recordset(Object.fromEntries((['left', 'center', 'right'] as const).map(alignment => [
        alignment, new FieldType().with.label(alignment).and.textAlign(alignment).and.sortable(sortable),
    ])), [{left:'Ada', center:'Ada', right:'Ada'}]);
    const table = document.createElement('fdl-table') as TestTable;
    table.recordset = recordset;
    table.innerHTML = '<fdl-column field="left"></fdl-column><fdl-column field="center"></fdl-column><fdl-column field="right"></fdl-column>';
    document.body.append(table);
    await table.updateComplete;
    await recordset.requestUpdate();
    await settle(table);
    expect([...table.shadowRoot!.querySelectorAll('th')].map(header => header.style.textAlign)).toEqual(['left', 'center', 'right']);
    expect([...table.shadowRoot!.querySelectorAll('tbody td')].map(cell => (cell as HTMLElement).style.textAlign)).toEqual(['left', 'center', 'right']);
    expect(table.shadowRoot!.querySelectorAll('.sort-button')).toHaveLength(sortable ? 3 : 0);
    table.remove();
});

it('resolves column settings without a row and field settings with header and cell contexts', async () => {
    const width = jest.fn((_value: undefined, _record: undefined, context: string) => context === 'table' ? 120 : 0);
    const sortable = jest.fn((_value: undefined, _record: undefined, context: string) => context === 'table');
    const label = jest.fn((value: number, _record: Record<any>, context: string) => `${context}:${value}`);
    const amount = new FieldType<number>().with.label(label).and.minColumnWidth(width)
        .and.maxColumnWidth(200).and.targetColumnWidth(150).and.sortable(sortable)
        .and.textAlign((_value, _record, context) => context === 'table' ? 'right' : 'center');
    const recordset = new Recordset({ amount }, [{ amount: 150 }]);
    const table = document.createElement('fdl-table') as TestTable;
    table.recordset = recordset;
    table.innerHTML = '<fdl-column field="amount"></fdl-column>';
    document.body.append(table);
    await settle(table);
    expect(width).toHaveBeenCalledWith(undefined, undefined, 'table');
    expect(sortable).toHaveBeenCalledWith(undefined, undefined, 'table');
    expect(label).toHaveBeenCalledWith(150, recordset.currentPage[0], 'table-header');
    expect(table.shadowRoot!.querySelector('col')!.style.minWidth).toBe('120px');
    expect((table.shadowRoot!.querySelector('th') as HTMLElement).style.textAlign).toBe('center');
    expect((table.shadowRoot!.querySelector('td') as HTMLElement).style.textAlign).toBe('right');
    table.remove();
});

it('renders an empty table without invoking per-record header settings', async () => {
    const callback = jest.fn((_value: number, _record: Record<any>) => { throw new Error('no record'); });
    const amount = new FieldType<number>().with.label(callback).and.textAlign(callback);
    const recordset = new Recordset<{ amount: number }>({ amount }, []);
    const table = document.createElement('fdl-table') as TestTable;
    table.recordset = recordset;
    table.innerHTML = '<fdl-column field="amount"></fdl-column>';
    document.body.append(table);
    await settle(table);
    expect(table.shadowRoot!.textContent).toContain('No rows to display.');
    expect(callback).not.toHaveBeenCalled();
    table.remove();
});
