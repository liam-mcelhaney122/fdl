import { html } from 'lit';
import Record from '../../record.js';

type RuleState = 'visible' | 'required' | 'disabled' | 'readonly';
/** Read the same public field-state API used by the adapter, rather than reimplementing its predicate. */
export function explainDependency(
    record: Record<any>,
    field: string,
    dependency: string,
    expression: string,
    state: RuleState
) {
    const type = record.fieldTypeForField(field);
    const result =
        state === 'disabled'
            ? type.isDisabled(record.getField(field), record)
            : type[state](record.getField(field), record);
    const labels = {
        visible: ['Visible', 'Hidden'],
        required: ['Required', 'Optional'],
        disabled: ['Disabled', 'Enabled'],
        readonly: ['Read-only', 'Editable'],
    };
    return html`<div class="dependency-trace" role="status">
        <strong>Why did this field change?</strong>
        <p
            ><code>${dependency} = ${JSON.stringify(record.getField(dependency))}</code> →
            <code>${expression}</code> → <strong>${String(result)}</strong> →
            ${labels[state][result ? 0 : 1]}</p
        >
        <p
            >Stored ${field}: <code>${JSON.stringify(record.getField(field))}</code>.
            ${state === 'visible' ? 'Visibility preserves the stored value and does not determine requiredness.' : 'This state does not erase the stored value.'}</p
        >
    </div>`;
}
