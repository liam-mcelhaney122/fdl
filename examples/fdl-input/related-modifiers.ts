// Curated relationships are reciprocal: readers can compare either direction.
// Groups connect close alternatives or modifiers commonly used together.
const relationships: readonly (readonly string[])[] = [
    ['cellClass', 'rowClasses'],
    ['compareFunction', 'sortable'],
    ['compareFunction', 'filter'],
    ['defaultValue', 'placeholder'],
    ['disabled', 'disabledWhen'],
    ['readOnly', 'readOnlyWhen'],
    ['disabled', 'readOnly'],
    ['disabledWhen', 'readOnlyWhen', 'visibleWhen'],
    ['emptyWhen', 'required', 'requiredWhen'],
    ['required', 'requiredWhen', 'validator'],
    ['requiredWhen', 'visibleWhen'],
    ['formatter', 'parser', 'template'],
    ['formatter', 'textAlign'],
    ['hashFunction', 'options', 'multipleValues'],
    ['inputMask', 'parser', 'validator'],
    ['inputMask', 'type'],
    ['label', 'placeholder'],
    ['maxColumnWidth', 'minColumnWidth', 'targetColumnWidth'],
    ['maxLength', 'minLength', 'validator'],
    ['maxLength', 'rowCount'],
    ['options', 'search', 'multipleValues'],
    ['range', 'type', 'validator'],
    ['reducer', 'filter'],
    ['reducer', 'formatter'],
    ['rowCount', 'type'],
];

export function relatedModifierNames(name: string): string[] {
    return [...new Set(relationships.filter(group => group.includes(name)).flat())]
        .filter(related => related !== name)
        .sort((a, b) => a.localeCompare(b, 'en'));
}
