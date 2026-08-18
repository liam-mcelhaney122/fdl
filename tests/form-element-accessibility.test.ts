import FieldType from '../field-type.js';
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
        const fieldType = new FieldType().with.label('Full name');
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
            { status: new FieldType().with.label('Status').and.readOnly() },
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
            { name: new FieldType().with.label('Full name').and.required() },
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
