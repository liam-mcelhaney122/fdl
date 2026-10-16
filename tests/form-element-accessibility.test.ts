import FieldTypeBuilder from '../field-type-builder';
import FormElement from '../form-element';
import Record from '../record.js';

const testTag = 'test-accessible-form-element';

if (!customElements.get(testTag)) {
    customElements.define(testTag, class extends FormElement {});
}

type TestFormElement = FormElement & {
    updateComplete: Promise<boolean>;
};

async function renderField(record: Record, field: string, showValidationErrors = false) {
    const element = document.createElement(testTag) as TestFormElement;
    element.field = field;
    element.record = record;
    element.showValidationErrors = showValidationErrors;
    document.body.append(element);

    await element.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    await element.updateComplete;
    return element;
}

afterEach(() => {
    document.body.replaceChildren();
});

describe('FormElement accessibility', () => {
    it('gives each instance a stable unique control id and associates its label', async () => {
        const fieldType = new FieldTypeBuilder().label('Full name');
        const first = await renderField(new Record({ name: fieldType }, { name: 'Ada' }), 'name');
        const second = await renderField(
            new Record({ name: fieldType }, { name: 'Grace' }),
            'name'
        );

        const firstInput = first.shadowRoot?.querySelector('input') as HTMLInputElement;
        const secondInput = second.shadowRoot?.querySelector('input') as HTMLInputElement;
        const firstLabel = first.shadowRoot?.querySelector('label') as HTMLLabelElement;
        const secondLabel = second.shadowRoot?.querySelector('label') as HTMLLabelElement;
        const originalFirstId = firstInput.id;

        expect(firstInput.id).toMatch(/^form-element-control-\d+$/);
        expect(secondInput.id).toMatch(/^form-element-control-\d+$/);
        expect(firstInput.id).not.toBe(secondInput.id);
        expect(firstLabel.htmlFor).toBe(firstInput.id);
        expect(secondLabel.htmlFor).toBe(secondInput.id);
        expect(first.shadowRoot?.querySelectorAll(`#${firstInput.id}`)).toHaveLength(1);
        expect(second.shadowRoot?.querySelectorAll(`#${secondInput.id}`)).toHaveLength(1);

        first.record?.parseAndSetField('name', 'Augusta Ada');
        await first.updateComplete;
        expect(firstInput.id).toBe(originalFirstId);
    });

    it('renders a labeled semantic output for a read-only field', async () => {
        const record = new Record(
            { status: new FieldTypeBuilder().label('Status').readOnly() },
            { status: 'Approved' }
        );
        const element = await renderField(record, 'status');

        const label = element.shadowRoot?.querySelector('label') as HTMLLabelElement;
        const output = element.shadowRoot?.querySelector('output') as HTMLOutputElement;

        expect(element.shadowRoot?.querySelector('input')).toBeNull();
        expect(output.value).toBe('Approved');
        expect(label.htmlFor).toBe(output.id);
        expect(output.getAttribute('aria-labelledby')).toBe(label.id);
    });

    it('lets the adapter control when synchronous model errors are exposed', async () => {
        const record = new Record(
            { name: new FieldTypeBuilder().label('Full name').required() },
            { name: '' }
        );
        const element = await renderField(record, 'name');
        const input = element.shadowRoot?.querySelector('input') as HTMLInputElement;

        expect(record.isValid('name')).toBe(false);
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        expect(input.hasAttribute('aria-describedby')).toBe(false);
        expect(element.shadowRoot?.querySelector('.validation-error')).toBeNull();

        input.setAttribute('aria-describedby', 'field-help');
        element.showValidationErrors = true;
        await element.updateComplete;

        const error = element.shadowRoot?.querySelector('.validation-error') as HTMLElement;
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual([
            'field-help',
            error.id,
        ]);
        expect(error.isConnected).toBe(true);
        expect(error.textContent).toContain('Full name is required');

        record.parseAndSetField('name', 'Ada');
        await element.updateComplete;

        expect(input.hasAttribute('aria-invalid')).toBe(false);
        expect(input.getAttribute('aria-describedby')).toBe('field-help');
        expect(element.shadowRoot?.querySelector('.validation-error')).toBeNull();
    });
});

it('resolves field settings from the current value and record as dependencies change', async () => {
    const label = jest.fn((record: Record<any>) => `${record.getField('prefix')}:${record.getField('text')}`);
    const required = jest.fn((record: Record<any>) => record.getField('locked'));
    const text = new FieldTypeBuilder<string>().label(label)
        .placeholder(record => `${record.getField('prefix')}:${record.getField('text')}`)
        .type(record => record.getField('locked') ? 'password' : 'text')
        .required(required)
        .disabled(record => record.getField('locked'))
        .minLength(record => record.getField('minimum'))
        .maxLength(record => record.getField('maximum'));
    const record = new Record({ text, prefix: new FieldTypeBuilder(), locked: new FieldTypeBuilder(), minimum: new FieldTypeBuilder(), maximum: new FieldTypeBuilder() },
        { text: 'Ada', prefix: 'Name', locked: false, minimum: 2, maximum: 10 });
    const element = await renderField(record, 'text');
    const input = element.shadowRoot!.querySelector('input')!;
    expect(input.placeholder).toBe('Name:Ada');
    expect(element.shadowRoot!.querySelector('label')!.textContent).toContain('Name:Ada');
    expect(input.minLength).toBe(2);
    expect(input.maxLength).toBe(10);
    expect(input.required).toBe(false);
    expect(input.disabled).toBe(false);
    record.setFields({ prefix: 'Person', locked: true, minimum: 4, maximum: 8 });
    await element.updateComplete;
    expect(input.placeholder).toBe('Person:Ada');
    expect(input.type).toBe('password');
    expect(input.minLength).toBe(4);
    expect(input.maxLength).toBe(8);
    expect(input.required).toBe(true);
    expect(input.disabled).toBe(true);
    expect(record.isValid('text')).toBe(false);
    expect(label).toHaveBeenCalledWith(record);
    expect(required).toHaveBeenCalledWith(record);
});


it('shows a spinner, busy state, and disabled select while options load, and ignores stale results', async () => {
    let resolveFirst!: (options: { text: string; value: string }[]) => void;
    let resolveSecond!: (options: { text: string; value: string }[]) => void;
    const first = new Promise<{ text: string; value: string }[]>(resolve => { resolveFirst = resolve; });
    const second = new Promise<{ text: string; value: string }[]>(resolve => { resolveSecond = resolve; });
    const fetch = jest.fn((record: Record<any>) => record.getField('zip') === '28202' ? first : second);
    const record = new Record({
        zip: new FieldTypeBuilder(),
        store: new FieldTypeBuilder().label('Pickup store').options({ fields: ['zip'], fetch }),
    }, { zip: '28202', store: '' });
    const element = await renderField(record, 'store');
    const select = element.shadowRoot!.querySelector('select')!;
    expect(select.disabled).toBe(true);
    expect(select.getAttribute('aria-busy')).toBe('true');
    expect(element.shadowRoot!.querySelector('.options-spinner')).not.toBeNull();
    expect(element.shadowRoot!.querySelector('[role="status"]')!.textContent).toContain('Loading choices');
    // Changes during the initial request must be observed immediately.
    record.setField('zip', '10001');
    await element.updateComplete;
    resolveSecond([{ text: 'Chelsea store', value: 'chelsea' }]);
    await record.fieldTypeForField('store').options(record);
    await element.updateComplete;
    expect(select.disabled).toBe(false);
    expect(select.hasAttribute('aria-busy')).toBe(false);
    expect(element.shadowRoot!.querySelector('.options-spinner')).toBeNull();
    expect([...select.options].map(option => option.value)).toEqual(['chelsea']);
    resolveFirst([{ text: 'Uptown store', value: 'uptown' }]);
    await first;
    await new Promise(resolve => setTimeout(resolve, 0));
    await element.updateComplete;
    expect([...select.options].map(option => option.value)).toEqual(['chelsea']);
    record.setField('store', 'chelsea');
    await element.updateComplete;
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(select.disabled).toBe(false);
    expect(select.value).toBe('chelsea');
});
