const fields: { [name: string]: [record: string, fields: string[]] } = {
    required: ['person', ['name']], formatter: ['money', ['amount']],
    visibleWhen: ['delivery', ['fulfillment', 'address']],
    defaultValue: ['defaultRecord', ['defaultId']], disabled: ['record', ['lockedId']],
    disabledWhen: ['record', ['approvalStatus', 'budget']], emptyWhen: ['record', ['emptyCode']],
    label: ['record', ['expenseType', 'dynamicAmount']], maxLength: ['record', ['shortCode']],
    minLength: ['record', ['longCode']], multipleValues: ['record', ['skills']],
    options: ['record', ['department', 'assignee']], parser: ['record', ['money']],
    placeholder: ['record', ['projectName']], readOnly: ['record', ['fixedOwner']],
    readOnlyWhen: ['record', ['phase', 'conditionalOwner']], requiredWhen: ['record', ['followUp', 'followUpNotes']],
    rowCount: ['record', ['comments']], type: ['record', ['dateType']], validator: ['record', ['projectCode']],
    hashFunction: ['probes', ['firstId', 'secondId']], inputMask: ['probes', ['input']],
    reducer: ['probes', ['firstAmount', 'secondAmount', 'thirdAmount']],
};
const tables: { [name: string]: [recordset: string, columns: string[]] } = {
    cellClass: ['cellClassRecordset', ['amount', 'category']],
    conditionalCellClass: ['conditionalClassRecordset', ['amount', 'label']],
    compareFunction: ['compareRecordset', ['firstName', 'lastName', 'team']],
    sortable: ['compareRecordset', ['firstName', 'lastName', 'team']],
    filter: ['filterRecordset', ['name', 'team']],
    rowClasses: ['rowClassRecordset', ['status', 'owner']],
    template: ['templateRecordset', ['invoice', 'status']],
    textAlign: ['alignRecordset', ['left', 'center', 'right']],
    maxColumnWidth: ['widthRecordsets.maxColumnWidth', ['constrained', 'flexible']],
    minColumnWidth: ['widthRecordsets.minColumnWidth', ['constrained', 'flexible']],
    targetColumnWidth: ['widthRecordsets.targetColumnWidth', ['constrained', 'flexible']],
};

/** Documentation of the example's component bindings, using Lit template syntax. */
export function exampleMarkup(name: string): string | undefined {
    if (fields[name]) {
        const [record, names] = fields[name];
        const markup = names.map(field => `<fdl-field\n  .record=\${${record}}\n  field="${field}"\n></fdl-field>`).join('\n\n');
        if (name === 'formatter') return `${markup}\n\n<div class="formatted">\n  <span>Formatted output</span>\n  <strong>\n    \${money.getFormattedField('amount', 'print')}\n  </strong>\n</div>`;
        return markup;
    }
    if (tables[name]) {
        const [recordset, columns] = tables[name];
        return `<fdl-table .recordset=\${${recordset}}>\n${columns.map(column => `  <fdl-column field="${column}"></fdl-column>`).join('\n')}\n</fdl-table>`;
    }
    if (name === 'exampleValue') return `<p>\n  \${[0, 1, 2].map(index =>\n    exampleType.exampleValue()(index)\n  ).join(', ')}\n</p>`;
    return undefined;
}
