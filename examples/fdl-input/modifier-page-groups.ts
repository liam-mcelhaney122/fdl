/** Closely related modifiers share a reference page while keeping individual deep links. */
export const modifierPageGroups = [
    {title: 'Cell classes', names: ['cellClass', 'conditionalCellClass']},
    {title: 'Disabled fields', names: ['disabled', 'disabledWhen']},
    {title: 'Text length', names: ['minLength', 'maxLength']},
    {title: 'Column widths', names: ['minColumnWidth', 'targetColumnWidth', 'maxColumnWidth']},
    {title: 'Read-only fields', names: ['readOnly', 'readOnlyWhen']},
    {title: 'Required fields', names: ['required', 'requiredWhen']},
];

export function modifierPage(name: string) {
    return modifierPageGroups.find(group => group.names.includes(name)) ?? {title: '', names: [name]};
}
