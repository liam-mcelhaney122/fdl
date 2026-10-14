import FieldType from '../field-type.js';
import Record from '../record.js';
import '../examples/fdl-input/fdl-field';
import '../examples/fdl-input/fdl-input-demo';
import '../examples/fdl-input/fdl-cookbook-page';

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

describe('<fdl-input-demo>', () => {
    it('presents the cookbook as a separate page', async () => {
        const element = document.createElement('fdl-input-demo') as HTMLElement & {
            updateComplete: Promise<boolean>;
        };
        document.body.append(element);
        await element.updateComplete;

        expect(element.shadowRoot?.querySelector('fdl-modifier-catalog')).toBeNull();
        expect(element.shadowRoot?.querySelector('a[href="./cookbook/"]')?.textContent).toContain('cookbook');
        expect(element.shadowRoot?.querySelector('h1')?.textContent).toContain('Forms that adapt to the work.');
        element.remove();
    });

    it('renders every public field type modifier once in alphabetical order', async () => {
        const element = document.createElement('fdl-cookbook-page') as HTMLElement & {
            updateComplete: Promise<boolean>;
        };
        document.body.append(element);

        await element.updateComplete;

        const cookbookSections = [
            ...(element.shadowRoot?.querySelectorAll(
                'fdl-payment-workflow, fdl-modifier-catalog'
            ) ?? []),
        ];
        expect(cookbookSections.map(section => section.localName)).toEqual([
            'fdl-payment-workflow',
            'fdl-modifier-catalog',
        ]);

        const catalog = element.shadowRoot?.querySelector('fdl-modifier-catalog') as HTMLElement & {
            updateComplete: Promise<boolean>;
        };
        expect(catalog).toBeTruthy();
        await catalog.updateComplete;

        const builder = new FieldType().with as unknown as { [name: string]: unknown };
        const omittedModifiers = new Set([
            'accept', 'additionalProperties', 'autofocus', 'autocomplete', 'field', 'formElement',
            'filtering', 'formatOnChange', 'hideLabel', 'iconMessage', 'list', 'max', 'onValueChange',
            'description', 'hasSearch', 'inline', 'inlineWhen', 'parseDynamicRange', 'pattern',
            'readOnlyExceptionWhen', 'schema', 'segmented', 'selectionDisabledFunctions', 'step', 'tag', 'usesCustomPrint',
        ]);
        const expectedModifiers = Object.getOwnPropertyNames(Object.getPrototypeOf(builder))
            .filter(name => name !== 'constructor' && name !== 'copy')
            .filter(name => !omittedModifiers.has(name))
            .filter(name => typeof builder[name] === 'function')
            .sort((left, right) => left.localeCompare(right));
        const cards = [...(catalog.shadowRoot?.querySelectorAll<HTMLElement>('[data-modifier]') ?? [])];
        const renderedModifiers = cards.map(card => card.dataset.modifier as string);

        expect(renderedModifiers).toEqual(expectedModifiers);
        expect(new Set(renderedModifiers).size).toBe(renderedModifiers.length);
        expect(renderedModifiers).toEqual(
            [...renderedModifiers].sort((left, right) => left.localeCompare(right))
        );

        cards.forEach(card => {
            expect(card.dataset.status).toMatch(/^(live|placeholder)$/);
            expect(card.textContent?.trim().length).toBeGreaterThan(
                (card.dataset.modifier?.length ?? 0) + 20
            );
            if (card.dataset.status === 'live') {
                expect(card.querySelector('.demo')).not.toBeNull();
                expect(card.querySelector('details')).not.toBeNull();
            } else {
                expect(card.querySelector('.placeholder-body')?.textContent).toContain('Intent:');
                expect(card.querySelector('.placeholder-body')?.textContent).toContain(
                    'Why there is no live example:'
                );
            }
        });

        expect(catalog.shadowRoot?.querySelector('[data-modifier="inline"]')).toBeNull();
        expect(catalog.shadowRoot?.querySelector('[data-modifier="inlineWhen"]')).toBeNull();
        expect(catalog.shadowRoot?.querySelector('[data-modifier="segmented"]')).toBeNull();

        [
            'cellClass',
            'compareFunction',
            'conditionalCellClass',
            'formatter',
            'rowClasses',
            'template',
            'textAlign',
            'minColumnWidth',
            'maxColumnWidth',
            'targetColumnWidth',
        ].forEach(modifier => {
            expect(
                catalog.shadowRoot?.querySelector(
                    `[data-modifier="${modifier}"] fdl-table`
                )
            ).not.toBeNull();
        });

        expect(
            catalog.shadowRoot?.querySelector('[data-modifier="label"] fdl-table')
        ).toBeNull();

        const cookbookControls = [
            ...(catalog.shadowRoot?.querySelectorAll('fdl-field') ?? []),
        ];
        expect(catalog.shadowRoot?.querySelectorAll('input, select, textarea')).toHaveLength(0);
        expect(cookbookControls.length).toBeGreaterThan(0);
        cookbookControls.forEach(control => expect(control.getAttribute('field')).toBeTruthy());

        const cellClassTable = catalog.shadowRoot?.querySelector<HTMLElement>(
            '[data-modifier="cellClass"] fdl-table'
        ) as HTMLElement & { updateComplete: Promise<boolean> };
        await cellClassTable.updateComplete;
        expect(cellClassTable.shadowRoot?.querySelectorAll('tbody td.amount-cell')).toHaveLength(2);
        expect(cellClassTable.shadowRoot?.querySelectorAll('tbody td:not(.amount-cell)')).toHaveLength(2);

        element.remove();
    });

    it('keeps representative catalog examples interactive', async () => {
        const element = document.createElement('fdl-cookbook-page') as HTMLElement & {
            updateComplete: Promise<boolean>;
        };
        document.body.append(element);
        await element.updateComplete;

        const catalog = element.shadowRoot?.querySelector('fdl-modifier-catalog') as HTMLElement & {
            updateComplete: Promise<boolean>;
        };
        await catalog.updateComplete;

        const defaultCard = catalog.shadowRoot?.querySelector<HTMLElement>(
            '[data-modifier="defaultValue"]'
        );
        (defaultCard?.querySelector('button') as HTMLButtonElement).click();
        await catalog.updateComplete;
        expect(defaultCard?.textContent).toContain('Current record value: Pending assignment');

        const visibleCard = catalog.shadowRoot?.querySelector<HTMLElement>(
            '[data-modifier="visibleWhen"]'
        );
        const fulfillment = visibleCard?.querySelector(
            'fdl-field[field="fulfillment"]'
        ) as HTMLElement & { updateComplete: Promise<boolean> };
        // The adapter finishes asynchronous options setup after its Lit render.
        await settle(fulfillment);
        const select = fulfillment.shadowRoot?.querySelector('select') as HTMLSelectElement;
        select.value = 'pickup';
        select.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await new Promise(resolve => setTimeout(resolve, 0));
        await catalog.updateComplete;
        expect(visibleCard?.querySelector('fdl-field[field="address"]')?.shadowRoot?.querySelector('input')).toBeNull();

        element.remove();
    });

    it('demonstrates formatted money input being parsed into the raw record value', async () => {
        const element = document.createElement('fdl-cookbook-page') as HTMLElement & {
            updateComplete: Promise<boolean>;
        };
        document.body.append(element);
        await element.updateComplete;

        const catalog = element.shadowRoot?.querySelector('fdl-modifier-catalog') as HTMLElement & {
            updateComplete: Promise<boolean>;
        };
        await catalog.updateComplete;

        const parserCard = catalog.shadowRoot?.querySelector<HTMLElement>('[data-modifier="parser"]');
        const inputControl = parserCard?.querySelector('fdl-field') as HTMLElement & {
            updateComplete: Promise<boolean>;
        };
        await inputControl.updateComplete;
        const input = inputControl.shadowRoot?.querySelector('input') as HTMLInputElement;

        expect(input.value).toBe('$1,000.00');
        input.value = '$1,500.00';
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        await new Promise(resolve => setTimeout(resolve, 0));
        await catalog.updateComplete;

        expect(parserCard?.textContent).toContain('Raw stored value: 1500');
        element.remove();
    });

});

describe('<fdl-payment-workflow>', () => {
    it('lets the FDL record activate and deactivate ACH-only fields', async () => {
        const workflow = document.createElement('fdl-payment-workflow') as TestElement;
        document.body.append(workflow);
        await settle(workflow);

        const methodField = workflow.shadowRoot?.querySelector(
            'fdl-field[field="method"]'
        ) as TestElement;
        const routingField = workflow.shadowRoot?.querySelector(
            'fdl-field[field="routingNumber"]'
        ) as TestElement;
        await settle(methodField);
        await settle(routingField);

        const routingInput = routingField.shadowRoot?.querySelector('input');
        expect(routingInput).not.toBeNull();
        expect(routingInput?.required).toBe(true);
        expect(workflow.shadowRoot?.textContent).toContain('ACH account rules are active.');

        const methodSelect = methodField.shadowRoot?.querySelector('select') as HTMLSelectElement;
        methodSelect.value = 'check';
        methodSelect.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        await settle(workflow);
        await settle(routingField);

        expect(routingField.shadowRoot?.querySelector('input')).toBeNull();
        expect(workflow.shadowRoot?.textContent).toContain('ACH account rules are inactive.');

        workflow.remove();
    });

    it('uses model validation to gate review and reuses formatting for table and export', async () => {
        const workflow = document.createElement('fdl-payment-workflow') as TestElement;
        document.body.append(workflow);
        await settle(workflow);

        const routingField = workflow.shadowRoot?.querySelector(
            'fdl-field[field="routingNumber"]'
        ) as TestElement;
        await settle(routingField);
        const routingInput = routingField.shadowRoot?.querySelector('input') as HTMLInputElement;
        routingInput.value = '123';
        routingInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        await settle(workflow);

        workflow.shadowRoot?.querySelector<HTMLButtonElement>('.primary')?.click();
        await settle(workflow);
        await settle(routingField);
        expect(workflow.shadowRoot?.querySelector('.error-summary')?.textContent).toContain(
            'Routing number: must be a valid 9-digit ABA number'
        );
        const routingErrorId = routingInput.getAttribute('aria-describedby');
        expect(routingInput.getAttribute('aria-invalid')).toBe('true');
        expect(routingErrorId).toBeTruthy();
        expect(routingField.shadowRoot?.getElementById(routingErrorId!)?.textContent).toContain(
            'Routing number must be a valid 9-digit ABA number'
        );
        expect(workflow.shadowRoot?.querySelector('fdl-table')).toBeNull();

        routingInput.value = '021000021';
        routingInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        await settle(workflow);
        workflow.shadowRoot?.querySelector<HTMLButtonElement>('.primary')?.click();
        await settle(workflow);

        const reviewTable = workflow.shadowRoot?.querySelector('fdl-table') as TestElement;
        expect(reviewTable).toBeTruthy();
        await settle(reviewTable);
        expect(reviewTable.shadowRoot?.querySelector('tbody')?.textContent).toContain('$2,450.00');
        expect(reviewTable.shadowRoot?.querySelector('tbody')?.textContent).toContain('ACH transfer');

        const exportPreview = workflow.shadowRoot?.querySelector('[data-export-preview]');
        expect(exportPreview?.textContent).toContain('"$2,450.00"');
        expect(exportPreview?.textContent).toContain('"ACH transfer"');

        workflow.remove();
    });
});
