export const exampleFields: { [name: string]: [record: string, fields: string[]] } = {
    required: ['person', ['name','followUp','followUpNotes']], formatter: ['money', ['amount']],
    visible: ['delivery', ['fulfillment', 'address']],
    defaultValue: ['defaultRecord', ['documentTitle']], disabled: ['record', ['lockedId','approvalStatus','budget']],
    emptyWhen: ['record', ['emptyCode', 'optionalEmptyCode']],
    label: ['record', ['expenseType', 'dynamicAmount']], maxLength: ['record', ['shortCode']],
    minLength: ['record', ['longCode']], multipleValues: ['record', ['skills']],
    options: ['record', ['department', 'assignee', 'asyncAssignee']], parser: ['record', ['money']],
    placeholder: ['record', ['projectName']], readOnly: ['record', ['fixedOwner']],
    readOnlyWhen: ['record', ['phase', 'conditionalOwner']],
    rowCount: ['record', ['comments']], type: ['record', ['inputValue']], validator: ['record', ['email', 'orderQuantity', 'username']],
    hashFunction: ['probes', ['firstId', 'secondId']], inputMask: ['probes', ['input']],
    reducer: ['probes', ['firstAmount', 'secondAmount', 'thirdAmount']],
};
export const exampleTables: { [name: string]: [recordset: string, columns: string[]] } = {
    columnClass: ['columnClassRecordset', ['day', 'amount']],
    cellClass: ['cellClassRecordset', ['day', 'amount']],
    compareFunction: ['compareRecordset', ['firstName', 'lastName', 'shirtSize']],
    sortable: ['compareRecordset', ['firstName', 'lastName', 'shirtSize']],
    filter: ['filterRecordset', ['name', 'team']],
    rowClass: ['rowClassRecordset', ['status', 'owner']],
    template: ['templateRecordset', ['invoice', 'balance']],
    textAlign: ['alignRecordset', ['left', 'center', 'right']],
    maxColumnWidth: ['widthRecordset', ['constrained', 'flexible']],
    minColumnWidth: ['widthRecordset', ['constrained', 'flexible']],
    targetColumnWidth: ['widthRecordset', ['constrained', 'flexible']],
};

/** Documentation of the example's component bindings, using Lit template syntax. */
export function exampleMarkup(name: string): string | undefined {
    if (exampleFields[name]) {
        const [record, names] = exampleFields[name];
        const markup = names.map(field => `<fdl-field\n  .record=\${${record}}\n  field="${field}"\n></fdl-field>`).join('\n\n');
        if (name === 'formatter') return `${markup}\n\n<div class="formatted">\n  <span>Formatted output</span>\n  <strong>\n    \${money.getFormattedField('amount', 'print')}\n  </strong>\n</div>`;
        return markup;
    }
    if (exampleTables[name]) {
        const [recordset, columns] = exampleTables[name];
        return `<fdl-table .recordset=\${${recordset}}>\n${columns.map(column => `  <fdl-column field="${column}"></fdl-column>`).join('\n')}\n</fdl-table>`;
    }
    return undefined;
}
