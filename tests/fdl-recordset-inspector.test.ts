import { field } from '../index';
import Recordset from '../recordset.js';
import '../examples/fdl-input/fdl-recordset-inspector';

function data() {
    return new Recordset(
        {
            name: field.label('Name').required(),
            amount: field.type('number').formatter(value => `$${value}`),
            enabled: field,
            missing: field,
        },
        [
            { name: 'Zulu', amount: 0, enabled: false },
            { name: 'Alpha', amount: 12, enabled: true },
            { name: '', amount: 3, enabled: false },
        ]
    );
}

async function inspect(recordset?: Recordset<any>) {
    if (recordset) await recordset.requestUpdate();
    const inspector = document.createElement('fdl-recordset-inspector');
    inspector.recordset = recordset;
    document.body.append(inspector);
    await inspector.updateComplete;
    return inspector;
}

afterEach(() => document.body.replaceChildren());

it('shows raw values, row validity and counts, with selectable field order', async () => {
    const inspector = await inspect(data());
    const root = inspector.shadowRoot!;
    expect(root.querySelector('.counts')!.textContent!.replace(/\s+/g, ' ')).toContain(
        '3 of 3 records match'
    );
    expect(root.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(root.querySelector('[data-field="amount"]')!.textContent!.trim()).toBe('0');
    expect(root.querySelector('[data-field="enabled"]')!.textContent!.trim()).toBe('false');
    expect(root.querySelector('[data-field="missing"]')!.textContent!.trim()).toBe('(undefined)');
    expect(
        root.querySelector('tbody tr:last-child .row-status [aria-label="Invalid"]')
    ).toBeTruthy();
    inspector.fields = ['amount', 'name'];
    await inspector.updateComplete;
    expect([...root.querySelectorAll('thead th')].map(cell => cell.textContent)).toEqual([
        '',
        'Row',
        'amount',
        'name',
    ]);
});

it('tracks sorting, filtering, paging and edits without a parent update', async () => {
    const recordset = data();
    const inspector = await inspect(recordset);
    const root = inspector.shadowRoot!;
    await recordset.sort({ field: 'name', sort: 'ascending' });
    recordset.pageSize = 1;
    await recordset.requestUpdate();
    await inspector.updateComplete;
    expect(root.querySelector('.counts')!.textContent!.replace(/\s+/g, ' ')).toContain(
        'Sorted by name ↑'
    );
    expect(root.querySelectorAll('tbody tr')).toHaveLength(1);
    recordset.pageNumber = 2;
    await recordset.requestUpdate();
    await inspector.updateComplete;
    expect(root.querySelector('tbody th')!.textContent!.trim()).toBe('2');
    expect(root.querySelector('[data-field="name"]')!.textContent!.trim()).toBe('Alpha');
    recordset.currentPage[0].setField('amount', 42);
    await inspector.updateComplete;
    expect(root.querySelector('[data-field="amount"]')!.textContent!.trim()).toBe('42');
    recordset.filter = function noMatches() {
        return false;
    };
    await recordset.requestUpdate();
    await inspector.updateComplete;
    expect(root.textContent).toContain('No records on this page.');
    expect(root.querySelector('.counts')!.textContent!.replace(/\s+/g, ' ')).toContain(
        '0 of 3 records match'
    );
    expect(recordset.allRecords).toHaveLength(3);
});

it('collapses accessibly and reopens with current data', async () => {
    const recordset = data();
    const inspector = await inspect(recordset);
    const button = inspector.shadowRoot!.querySelector('button')!;
    button.click();
    await inspector.updateComplete;
    expect(inspector.hasAttribute('collapsed')).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Inspect recordset');
    expect(inspector.shadowRoot!.getElementById('recordset-details')!.hidden).toBe(true);
    recordset.allRecords[0].setField('name', 'Updated');
    button.click();
    await inspector.updateComplete;
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(inspector.shadowRoot!.querySelector('[data-field="name"]')!.textContent!.trim()).toBe(
        'Updated'
    );
});

it('releases subscriptions on replacement and disconnect, and reconnects', async () => {
    const first = data();
    const second = data();
    await second.requestUpdate();
    const inspector = await inspect(first);
    const removeSet = jest.spyOn(first, 'removeEventListener');
    const removeRow = jest.spyOn(first.allRecords[0], 'removeEventListener');
    inspector.recordset = second;
    await inspector.updateComplete;
    expect(removeSet).toHaveBeenCalledWith('page-changed', expect.any(Function));
    expect(removeRow).toHaveBeenCalledWith('change', expect.any(Function));
    const removeSecond = jest.spyOn(second, 'removeEventListener');
    inspector.remove();
    expect(removeSecond).toHaveBeenCalledWith('updated', expect.any(Function));
    second.allRecords[0].setField('name', 'Reconnected');
    document.body.append(inspector);
    await inspector.updateComplete;
    expect(inspector.shadowRoot!.textContent).toContain('Reconnected');
});

it('supports an unbound inspector and an empty recordset assigned later', async () => {
    const inspector = await inspect();
    expect(inspector.shadowRoot!.textContent).toContain('No recordset selected.');
    const empty = new Recordset<any>({ name: field }, []);
    await empty.requestUpdate();
    inspector.recordset = empty;
    await inspector.updateComplete;
    expect(inspector.shadowRoot!.textContent).toContain('No records on this page.');
    expect(inspector.shadowRoot!.textContent!.replace(/\s+/g, ' ')).toContain(
        '0 of 0 records match'
    );
});

it('distinguishes server totals from loaded rows', async () => {
    const recordset = new Recordset<any>({ name: field }, function fetchPage() {
        return { data: [{ name: 'Loaded row' }], totalCount: 100 };
    });
    await recordset.requestHardUpdate();
    const inspector = await inspect(recordset);
    const counts = inspector
        .shadowRoot!.querySelector('.counts')!
        .textContent!.replace(/\s+/g, ' ');
    expect(counts).toContain('100 of 100 records match');
    expect(counts).toContain('1 shown on this page');
    expect(counts).toContain('1 records loaded');
    const state = JSON.parse(inspector.shadowRoot!.querySelector('pre')!.textContent!);
    expect(state.totalRecords).toBe(100);
    expect(state.loadedRecords).toBe(1);
});

it('uses the record inspector icons and legend for field and row states', async () => {
    const recordset = new Recordset<any>(
        {
            name: field
                .required()
                .disabled()
                .readOnly()
                .visible(() => false),
        },
        [{ name: '' }]
    );
    const inspector = await inspect(recordset);
    const root = inspector.shadowRoot!;
    expect(
        [...root.querySelectorAll('[data-field="name"] [role="img"]')].map(icon =>
            icon.getAttribute('aria-label')
        )
    ).toEqual(['Hidden', 'Disabled', 'Read-only', 'Required', 'Invalid']);
    expect(root.querySelector('tbody .row-status [aria-label="Invalid"]')).toBeTruthy();
    expect(
        [...root.querySelectorAll('.legend [role="img"]')].map(icon =>
            icon.getAttribute('aria-label')
        )
    ).toEqual(['Hidden', 'Disabled', 'Read-only', 'Required', 'Invalid']);
    recordset.allRecords[0].setField('name', 'Ada');
    await inspector.updateComplete;
    expect(root.querySelector('[data-field="name"] [aria-label="Invalid"]')).toBeNull();
    expect(root.querySelector('tbody .row-status [aria-label="Invalid"]')).toBeNull();
});

it('observes inserted rows and releases removed rows', async () => {
    const recordset = data();
    const inspector = await inspect(recordset);
    const added = recordset.createRecord({ name: 'Added', amount: 7, enabled: true });
    recordset.insertRecord(added);
    await inspector.updateComplete;
    added.setField('name', 'Edited insertion');
    await inspector.updateComplete;
    expect(inspector.shadowRoot!.querySelector('tbody')!.textContent).toContain('Edited insertion');
    const remove = jest.spyOn(added, 'removeEventListener');
    recordset.deleteRecord(added);
    await inspector.updateComplete;
    expect(remove).toHaveBeenCalledWith('change', expect.any(Function));
    expect(inspector.shadowRoot!.querySelector('tbody')!.textContent).not.toContain(
        'Edited insertion'
    );
});

it('shows only applicable icons on the left without a validation column or valid labels', async () => {
    const inspector = await inspect(data());
    const root = inspector.shadowRoot!;
    const headers = [...root.querySelectorAll('thead th')].map(cell => cell.textContent);
    expect(headers[0]).toBe('');
    expect(headers).not.toContain('Validation');
    expect(root.querySelector('[aria-label="Valid"]')).toBeNull();
    expect(root.querySelector('tbody tr:first-child .row-status')!.textContent!.trim()).toBe('');
    expect(
        root.querySelector('tbody tr:last-child td:first-child [aria-label="Invalid"]')
    ).toBeTruthy();
    const name = root.querySelector('[data-field="name"] .stored-cell')!;
    expect(name.firstElementChild!.classList.contains('field-status')).toBe(true);
    expect(name.lastElementChild!.textContent).toBe('Zulu');
});
