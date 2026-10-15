// Signatures from field-type-builder.ts; preserve the API's declared parameter types.
export const modifierSignatures: {[name: string]: string} = {
    "required": "required(predicate?: (record: Record<any>) => boolean)",
    "formatter": "formatter(fn: (value: T) => any)",
    "visibleWhen": "visibleWhen(predicate: (record: Record) => boolean)",
    "cellClass": "cellClass(classes: string | string[] | ((value: T) => string | string[] | boolean), className?: string | string[] | undefined)",
    "compareFunction": "compareFunction(fn: (a: any, b: any) => 1 | -1 | 0)",
    "defaultValue": "defaultValue(value: T | string | null)",
    "disabled": "disabled(predicate?: (record: Record<any>) => boolean)",
    "emptyWhen": "emptyWhen(predicate: (value: any) => boolean)",
    "filter": "filter(predicate?: ((searchText: string, value: any) => boolean) | undefined)",
    "hashFunction": "hashFunction<V = unknown>(fn: (values: V) => string)",
    "inputMask": "inputMask(regex: RegExp)",
    "label": "label(label: string | ((record: Record) => string))",
    "maxColumnWidth": "maxColumnWidth(width: number)",
    "maxLength": "maxLength(length: number)",
    "minColumnWidth": "minColumnWidth(width: number)",
    "minLength": "minLength(length: number)",
    "multipleValues": "multipleValues(min?: number, max?: number)",
    "options": "options<F = unknown>(optionsConfig: OptionsApi<T, F> | ((args: unknown) => T) | Promise<T> | T[])",
    "parser": "parser(fn: (value: any) => any)",
    "placeholder": "placeholder(placeholder: string)",
    "range": "range()",
    "readOnly": "readOnly()",
    "readOnlyWhen": "readOnlyWhen(predicate: (record: Record) => boolean)",
    "reducer": "reducer(nameOrFunction: string | Function)",
    "rowClass": "rowClass(classes: string | string[] | ((value: T, record: Record<any>) => string | string[]))",
    "rowCount": "rowCount(numberOfRows: number)",
    "search": "search(config: SearchConfig<T>)",
    "sortable": "sortable(sortable: boolean)",
    "targetColumnWidth": "targetColumnWidth(width: number)",
    "template": "template(fn: (field: T, record: Record<any>) => string | number | boolean | TemplateResult | Array<TemplateResult>)",
    "textAlign": "textAlign(direction: 'left' | 'center' | 'right')",
    "type": "type(type: inputType)",
    "validator": "validator(validator: Validator<T>)"
};

/** Present supported call forms separately when the implementation uses a broader signature. */
export const displayedModifierSignatures: {[name: string]: string} = {
    ...modifierSignatures,
    cellClass: '.cellClass(className: string)\n.cellClass(predicate: (value: T) => boolean, className: string)',
};
