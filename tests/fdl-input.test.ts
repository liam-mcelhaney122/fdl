import FieldType from '../field-type.js';
import Record from '../record.js';
import '../examples/fdl-input/fdl-field';

type TestElement = HTMLElement & { updateComplete: Promise<boolean> };

const settle = async (element: TestElement) => {
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
    await element.updateComplete;
};

describe('<fdl-field>', () => {
    it('creates and initializes the native input from the record field type', async () => {
        const record = new Record(
            {
                name: new FieldType().with
                    .label('Full name')
                    .and.placeholder('Ada Lovelace')
                    .and.required(),
            },
            { name: 'Ada' }
        );

        const element = document.createElement('fdl-field') as HTMLElement & {
            field: string;
            record: Record;
            updateComplete: Promise<boolean>;
        };
        element.field = 'name';
        element.record = record;
        document.body.append(element);

        await element.updateComplete;
        await new Promise(resolve => setTimeout(resolve, 0));
        await element.updateComplete;

        const input = element.shadowRoot?.querySelector('input');
        expect(input?.value).toBe('Ada');
        expect(input?.placeholder).toBe('Ada Lovelace');
        expect(input?.required).toBe(true);
        expect(element.shadowRoot?.querySelector('label')?.textContent).toContain('Full name');

        element.remove();
    });

    it('adds the multiple attribute to a native select for multipleValues()', async () => {
        const record = new Record(
            {
                colors: new FieldType().with
                    .tag('select')
                    .and.multipleValues()
                    .and.options([
                        { text: 'Blue', value: 'blue' },
                        { text: 'Green', value: 'green' },
                    ]),
            },
            { colors: 'blue' }
        );
        const element = document.createElement('fdl-field') as HTMLElement & {
            field: string;
            record: Record;
            updateComplete: Promise<boolean>;
        };
        element.field = 'colors';
        element.record = record;
        document.body.append(element);

        await element.updateComplete;
        await new Promise(resolve => setTimeout(resolve, 0));
        await element.updateComplete;

        const select = element.shadowRoot?.querySelector('select');
        expect(select?.hasAttribute('multiple')).toBe(true);
        expect((select as HTMLSelectElement)?.multiple).toBe(true);
        element.remove();
    });

    it('round-trips every selected value between a multi-select and its record', async () => {
        const record = new Record({ colors: new FieldType().with.tag('select').and.multipleValues().and.options([
            { text: 'Blue', value: 'blue' }, { text: 'Green', value: 'green' },
        ]) }, { colors: ['blue', 'green'] });
        const element = document.createElement('fdl-field') as TestElement & { record: Record; field: string };
        element.record = record;
        element.field = 'colors';
        document.body.append(element);
        await settle(element);
        const select = element.shadowRoot!.querySelector('select')!;
        expect([...select.selectedOptions].map(option => option.value)).toEqual(['blue', 'green']);
        select.options[0].selected = false;
        select.dispatchEvent(new Event('input'));
        select.dispatchEvent(new Event('change'));
        await settle(element);
        expect(record.values.colors).toEqual(['green']);
        expect([...select.selectedOptions].map(option => option.value)).toEqual(['green']);
        record.setField('colors', ['blue', 'green']);
        await settle(element);
        expect([...select.selectedOptions].map(option => option.value)).toEqual(['blue', 'green']);
        select.options[0].selected = false;
        select.options[1].selected = false;
        select.dispatchEvent(new Event('change'));
        await settle(element);
        expect(record.values.colors).toEqual([]);
        element.remove();
    });

    it('creates a textarea without assigning an unsupported input type', async () => {
        const record = new Record(
            { notes: new FieldType().with.tag('textarea').and.rowCount(3) },
            { notes: '' }
        );
        const element = document.createElement('fdl-field') as HTMLElement & {
            field: string;
            record: Record;
            updateComplete: Promise<boolean>;
        };
        element.field = 'notes';
        element.record = record;
        document.body.append(element);

        await element.updateComplete;
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(element.shadowRoot?.querySelector('textarea')?.rows).toBe(3);
        element.remove();
    });

    it('creates a native select from the field metadata and loads its options', async () => {
        const record = new Record(
            {
                status: new FieldType().with
                    .tag('select')
                    .and.options([
                        { text: 'Draft', value: 'draft' },
                        { text: 'Approved', value: 'approved' },
                    ]),
            },
            { status: 'approved' }
        );
        const element = document.createElement('fdl-field') as HTMLElement & {
            field: string;
            record: Record;
            updateComplete: Promise<boolean>;
        };
        element.field = 'status';
        element.record = record;
        document.body.append(element);

        await element.updateComplete;
        await new Promise(resolve => setTimeout(resolve, 0));
        await element.updateComplete;

        const select = element.shadowRoot?.querySelector('select');
        expect(select?.value).toBe('approved');
        expect([...select?.options ?? []].map(option => option.textContent)).toEqual([
            'Draft',
            'Approved',
        ]);
        expect(element.shadowRoot?.querySelector('input')).toBeNull();
        element.remove();
    });

    it('does not render a field when visibleWhen() returns false', async () => {
        const record = new Record(
            { address: new FieldType().with.label('Address').and.visibleWhen(() => false) },
            { address: '' }
        );
        const element = document.createElement('fdl-field') as HTMLElement & {
            field: string;
            record: Record;
            updateComplete: Promise<boolean>;
        };
        element.field = 'address';
        element.record = record;
        document.body.append(element);

        await element.updateComplete;
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(element.shadowRoot?.querySelector('label')).toBeNull();
        expect(element.shadowRoot?.querySelector('input')).toBeNull();
        element.remove();
    });
});
