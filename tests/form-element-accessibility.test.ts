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
    const label = jest.fn((value: string, record: Record<any>, context: string) => `${context}:${record.getField('prefix')}:${value}`);
    const required = jest.fn((_value: string, record: Record<any>, context: string) => context === 'model' && record.getField('locked'));
    const text = new FieldTypeBuilder<string>().label(label)
        .placeholder((value, record, context) => `${context}:${record.getField('prefix')}:${value}`)
        .type((_value, record) => record.getField('locked') ? 'password' : 'text')
        .required(required)
        .disabled((_value, record) => record.getField('locked'))
        .minLength((_value, record) => record.getField('minimum'))
        .maxLength((_value, record) => record.getField('maximum'));
    const record = new Record({ text, prefix: new FieldTypeBuilder(), locked: new FieldTypeBuilder(), minimum: new FieldTypeBuilder(), maximum: new FieldTypeBuilder() },
        { text: 'Ada', prefix: 'Name', locked: false, minimum: 2, maximum: 10 });
    const element = await renderField(record, 'text');
    const input = element.shadowRoot!.querySelector('input')!;
    expect(input.placeholder).toBe('form:Name:Ada');
    expect(element.shadowRoot!.querySelector('label')!.textContent).toContain('form:Name:Ada');
    expect(input.minLength).toBe(2);
    expect(input.maxLength).toBe(10);
    expect(input.required).toBe(false);
    expect(input.disabled).toBe(false);
    record.setFields({ prefix: 'Person', locked: true, minimum: 4, maximum: 8 });
    await element.updateComplete;
    expect(input.placeholder).toBe('form:Person:Ada');
    expect(input.type).toBe('password');
    expect(input.minLength).toBe(4);
    expect(input.maxLength).toBe(8);
    expect(input.required).toBe(true);
    expect(input.disabled).toBe(true);
    expect(record.isValid('text')).toBe(false);
    expect(label).toHaveBeenCalledWith('Ada', record, 'form');
    expect(required).toHaveBeenCalledWith('Ada', record, 'model');
});
