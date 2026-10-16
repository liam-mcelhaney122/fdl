/** Closely related modifiers share a reference page while keeping individual deep links. */
export const modifierPageGroups = [
    { title: 'Text length', names: ['minLength', 'maxLength'] },
    {
        title: 'Column widths',
        names: ['minColumnWidth', 'targetColumnWidth', 'maxColumnWidth'],
    },
];

export function modifierPage(name: string) {
    return (
        modifierPageGroups.find(group => group.names.includes(name)) ?? {
            title: '',
            names: [name],
        }
    );
}
