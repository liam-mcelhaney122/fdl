// Signatures from field-type-builder.ts; preserve the API's declared parameter types.
export const modifierSignatures: {[name: string]: string} = {
    "required": "required(predicate?: FieldSetting<T, boolean>)",
    "formatter": "formatter(fn: (value: T, record: Record<any>, context: string) => any)",
    "visibleWhen": "visibleWhen(predicate: FieldSetting<T, boolean>)",
    "cellClass": "cellClass(classes: FieldSetting<T, string | string[]>)",
    "compareFunction": "compareFunction(fn: (a: T, b: T) => number)",
    "defaultValue": "defaultValue(value: DefaultSetting<T>)",
    "disabled": "disabled(predicate?: FieldSetting<T, boolean>)",
    "emptyWhen": "emptyWhen(predicate: FieldSetting<T, boolean>)",
    "filter": "filter(predicate?: ((searchText: string, value: T) => boolean) | undefined)",
    "hashFunction": "hashFunction<V = unknown>(fn: (values: V) => string)",
    "inputMask": "inputMask(regex: RegExp)",
    "label": "label(label: FieldSetting<T, string>)",
    "maxColumnWidth": "maxColumnWidth(width: ColumnSetting<number>)",
    "maxLength": "maxLength(length: FieldSetting<T, number>)",
    "minColumnWidth": "minColumnWidth(width: ColumnSetting<number>)",
    "minLength": "minLength(length: FieldSetting<T, number>)",
    "multipleValues": "multipleValues(min?: number, max?: number)",
    "options": "options<F = unknown>(optionsConfig: OptionsApi<T, F> | ((args: unknown) => T) | Promise<T> | T[])",
    "parser": "parser(fn: (value: any, record: Record<any>, context: string) => T)",
    "placeholder": "placeholder(placeholder: FieldSetting<T, string>)",
    "range": "range()",
    "readOnly": "readOnly(predicate?: FieldSetting<T, boolean>)",
    "readOnlyWhen": "readOnlyWhen(predicate: FieldSetting<T, boolean>)",
    "reducer": "reducer(nameOrFunction: \"sum\" | ((values: T[]) => unknown))",
    "rowClass": "rowClass(classes: FieldSetting<T, string | string[]>)",
    "rowCount": "rowCount(numberOfRows: number)",
    "search": "search(config: SearchConfig<T>)",
    "sortable": "sortable(sortable: ColumnSetting<boolean>)",
    "targetColumnWidth": "targetColumnWidth(width: ColumnSetting<number>)",
    "template": "template(fn: (field: T, record: Record<any>, context: string) => string | number | boolean | TemplateResult | Array<TemplateResult>)",
    "textAlign": "textAlign(direction: FieldSetting<T, 'left' | 'center' | 'right'>)",
    "type": "type(type: FieldSetting<T, inputType>)",
    "validator": "validator(validator: Validator<T>)"
};

/** Result types for settings shown as fixed and calculated call forms. */
export const fieldSettingResults: {[name: string]: string} = {
    "cellClass": "string | string[]",
    "rowClass": "string | string[]",
    "label": "string",
    "required": "boolean",
    "disabled": "boolean",
    "visibleWhen": "boolean",
    "readOnly": "boolean",
    "readOnlyWhen": "boolean",
    "emptyWhen": "boolean",
    "minLength": "number",
    "maxLength": "number",
    "placeholder": "string",
    "textAlign": "'left' | 'center' | 'right'",
    "type": "inputType"
};

export const columnSettingResults: {[name: string]: string} = {
    "minColumnWidth": "number",
    "maxColumnWidth": "number",
    "targetColumnWidth": "number",
    "sortable": "boolean"
};

export const displayedModifierSignatures: {[name: string]: string} = { ...modifierSignatures };
for (const [name, result] of Object.entries(fieldSettingResults)) {
    displayedModifierSignatures[name] = [
        ...(['required', 'disabled', 'readOnly'].includes(name) ? [`.${name}()`] : []),
        ...(result === 'string | string[]'
            ? [`.${name}(className: string)`, `.${name}(classNames: string[])`]
            : [`.${name}(setting: ${result})`]),
        `.${name}(setting: (value: T, record: Record<any>, context: string) => ${result})`,
    ].join('\n');
}
for (const [name, result] of Object.entries(columnSettingResults)) {
    displayedModifierSignatures[name] = `.${name}(setting: ${result})\n.${name}(setting: (context: string) => ${result})`;
}

displayedModifierSignatures.defaultValue = '.defaultValue(value: T | null)\n.defaultValue(factory: (record: Record<any>, context: string) => T | null)';
