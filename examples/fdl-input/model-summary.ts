import { html } from 'lit';
import Record from '../../record.js';
import Recordset from '../../recordset.js';

export const describeValue = (value: unknown): string => {
    if (typeof value === 'number' && !Number.isFinite(value))
        return `${String(value)} (number)`;
    if (value === '') return '(empty string)';
    if (value === undefined) return '(undefined)';
    return `${JSON.stringify(value)} (${Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value})`;
};
export function recordSummary(
    record: Record<any>,
    fields = Object.keys(record.values)
) {
    return html`<dl class="state-summary"
        >${fields.map(field => {
            const type = record.fieldTypeForField(field);
            return html`<dt
                    >${type.label(record.getField(field), record) || field}</dt
                ><dd
                    >${describeValue(record.getField(field))}<small
                        >${type.visible(record.getField(field), record) ? 'Visible' : 'Hidden'}
                        ·
                        ${type.required(record.getField(field), record) ? 'Required' : 'Optional'}
                        ·
                        ${type.isDisabled(record.getField(field), record) ? 'Disabled' : type.readonly(record.getField(field), record) ? 'Read-only' : 'Editable'}
                        · ${record.isValid(field) ? 'Valid' : 'Invalid'}</small
                    ></dd
                >`;
        })}</dl
    >`;
}
export function tableSummary(table: Recordset<any>) {
    const sort = (table.sortColumns as { field: string; sort: string }[])
        .map(
            column =>
                `${table.getFieldType(column.field).label() || column.field} ${column.sort === 'ascending' ? '↑' : '↓'}`
        )
        .join(', then ');
    return html`<div class="state-summary" role="status"
        ><p
            >${table.filteredCount} of ${table.allRecords.length} records match;
            ${table.currentPage.length} shown on this page.</p
        ><p
            >${sort ? `Sorted by ${sort}.` : 'Original order; no sort selected.'}</p
        ><p>Filtering preserves the source records.</p></div
    >`;
}
