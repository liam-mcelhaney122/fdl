/* eslint-disable import/no-cycle */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable lines-between-class-members */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable max-classes-per-file */
import { TemplateResult } from 'lit';
import type Record from './record.js';
import _FieldType from './field-type.js';
import {
    FieldSetting,
    ColumnSetting,
    DefaultSetting,
    RecordSetting,
    ValueSetting,
    resolveRecordSetting,
    resolveValueSetting,
} from './field-setting';
import { inputType } from './types/input-types.types';

function classCallback<Args extends unknown[]>(
    classes: string | string[] | ((...args: Args) => string | string[])
): (...args: Args) => string | string[] {
    if (typeof classes === 'function') return classes;
    const fixed = Array.isArray(classes) ? [...classes] : classes;
    return () => fixed;
}

function caseInsensitiveTextMatch(searchText: string, value: any) {
    return String(value ?? '')
        .toLowerCase()
        .includes(searchText.toLowerCase());
}

const defaultTrueFunction = () => true;

function printFunction(fn?: Function | boolean) {
    if (typeof fn === 'undefined') {
        return '<none>';
    }
    return typeof fn === 'function' ? fn.name || fn.toString() : String(fn);
}

function defaultCompareFunction<T = unknown>(a: T, b: T) {
    if (a === b) {
        return 0;
    }

    return a < b ? -1 : 1;
}

function defaultEmptyFunction(value: unknown) {
    if (typeof value === 'string') return value.replace(/\s/g, '').length === 0;
    return value == null || value === '';
}

type FetchFn<T, FetchArgs = Record<any>> = (args: FetchArgs) => T[] | Promise<T[]>;
type FunctionCollection = { [fnName: string]: Function };

interface OptionsApi<T = unknown, F = Record<any>> {
    data?: T[] | Promise<T[]>;
    fetch?: FetchFn<T, F>;
    text?: string | ((data: T) => string);
    value?: string | ((data: T) => any);
    compareFunction?: Function;
    filter?: Function;
    fields?: Array<any>;
    hideSelectAll?: boolean;
    noCache?: boolean;
}

type BooleanPredicate = (value: any) => boolean;

type ValidatorFunction<T> = (
    modelValue: any,
    viewValue: any,
    record: Record<T>,
    options: OptionsApi,
    field: any
) => boolean | Promise<boolean>;

interface Validator<T> {
    name: string;
    validate: ValidatorFunction<T>;
}

interface SearchConfig<T = unknown> {
    title?: string;
    columns?: Array<{ label: string; field: keyof T; fieldType?: _FieldType<any> }>;
    filters?: { (record: Record): boolean };
}

interface FormElement<T> {
    name: string;
    // eslint-disable-next-line no-use-before-define
    properties: Partial<Properties<T>>;
}

type AutoComplete =
    | 'off'
    | 'on'
    | 'name'
    | 'honorific-prefix'
    | 'given-name'
    | 'additional-name'
    | 'family-name'
    | 'honorific-suffix'
    | 'nickname'
    | 'email'
    | 'username'
    | 'new-password'
    | 'current-password'
    | 'one-time-code'
    | 'tel'
    | 'street-address'
    | 'address-line1'
    | 'address-line2'
    | 'address-level2'
    | 'address-level1'
    | 'postal-code'
    | 'country-name'
    | 'organization';

export interface Properties<T = unknown> {
    accept: string;
    additionalProperties: { [key: string]: any };
    aggregate: Function | string;
    allowInputChar?: (char: string) => boolean;
    autocomplete?: AutoComplete;
    autofocus: boolean;
    cellClassFunctions: Array<(value: T, record: Record<any>) => string | string[]>;
    columnClassFunctions: Array<() => string | string[]>;
    compareFunction: (a: any, b: any) => number;
    defaultValue?: DefaultSetting<any>;
    descriptions: Array<string>;
    disableFunctions: Array<RecordSetting<boolean>>;
    emptyFunctions: Array<ValueSetting<any, boolean>>;
    field?: string;
    filter: (searchText: string, value: any) => boolean;
    filtering?: boolean;
    formatOnChange: boolean;
    formatters: Array<Function>;
    formElement: FormElement<T> | null;
    hashFunction: (a: any) => any;
    hasMultipleValues: boolean;
    hideLabel: boolean;
    iconMessage: string | null;
    inline: boolean;
    inlineFunctions: Array<BooleanPredicate>;
    labelFunctions: Array<RecordSetting<string>>;
    list?: string;
    max?: number;
    maxColumnWidth?: ColumnSetting<number>;
    /**
     * https://www.w3schools.com/tags/att_input_maxlength.asp
     */
    maxLength: RecordSetting<number>;
    maxValueCount: number;
    minColumnWidth: ColumnSetting<number>;
    minLength?: RecordSetting<number>;
    minValueCount: number;
    numberOfRows: number;
    rowCountConfigured: boolean;
    onValueChange: Array<Function>;
    options: OptionsApi | null;
    parseDynamicRange: boolean;
    parsers: Array<Function>;
    pattern?: RegExp;
    placeholder: RecordSetting<string>;
    range: boolean;
    readonly: boolean;
    readonlyexception: boolean;
    readonlyexceptionFunctions: Array<BooleanPredicate>;
    readonlyFunctions: Array<RecordSetting<boolean>>;
    required: boolean;
    requiredFunctions: Array<RecordSetting<boolean>>;
    rowClassFunctions: Array<(record: Record<any>) => string | string[]>;
    schema: string;
    search: boolean;
    searchConfig?: SearchConfig<T>;
    segmented: boolean;
    segmentedFunctions: Array<BooleanPredicate>;
    selectionDisabledFunctions: FunctionCollection;
    x?: boolean;
    sortable?: ColumnSetting<boolean>;
    specificDate?: boolean;
    step?: number;
    targetColumnWidth?: ColumnSetting<number>;
    template: Function;
    textAlign: FieldSetting<any, 'left' | 'center' | 'right'>;
    type: RecordSetting<string>;
    usesCustomPrint: boolean;
    validators: Array<Validator<T>>;
    visible: boolean;
    visibleFunctions: Array<RecordSetting<boolean>>;
}

export const defaultProperties: Properties = {
    accept: '',
    additionalProperties: {},
    aggregate: () => '',
    allowInputChar: () => true,
    autocomplete: 'off',
    autofocus: false,
    cellClassFunctions: [],
    columnClassFunctions: [],
    compareFunction: defaultCompareFunction,
    descriptions: [],
    disableFunctions: [() => false],
    emptyFunctions: [defaultEmptyFunction],
    filter: (_searchText: string, _value: any) => true,
    formatters: [],
    formatOnChange: false,
    formElement: null,
    hashFunction: (a: any) => a,
    hasMultipleValues: false,
    hideLabel: false,
    iconMessage: null,
    inline: false,
    inlineFunctions: [() => false],
    labelFunctions: [],
    // maxColumnWidth: 30,
    /**
     * https://www.w3schools.com/tags/att_input_maxlength.asp
     */
    maxLength: 524288,
    maxValueCount: 1,
    minColumnWidth: 30,
    minValueCount: 1,
    numberOfRows: 1,
    rowCountConfigured: false,
    onValueChange: [],
    options: null,
    parseDynamicRange: false,
    parsers: [],
    placeholder: '',
    range: false,
    readonly: false,
    readonlyexception: false,
    readonlyexceptionFunctions: [() => false],
    readonlyFunctions: [() => false],
    required: false,
    requiredFunctions: [() => false],
    rowClassFunctions: [],
    schema: 'simple',
    search: false,
    segmented: false,
    segmentedFunctions: [() => false],
    selectionDisabledFunctions: {},
    sortable: true,
    template: (value: any) => value,
    textAlign: 'left',
    type: 'text',
    usesCustomPrint: false,
    validators: [],
    visible: true,
    visibleFunctions: [() => true],
};

export default class FieldTypeBuilder<T = unknown> {
    constructor(private properties: Properties<any> = defaultProperties) {}

    /** Start a new immutable definition from an existing runtime field type. */
    static from<T>(fieldType: _FieldType<T>): FieldTypeBuilder<T> {
        return new FieldTypeBuilder<T>(fieldType.properties);
    }

    private copy(): FieldTypeBuilder<T> {
        return new FieldTypeBuilder<T>({ ...this.properties });
    }

    /** Finalize a definition with independent runtime state and option caches. */
    valueOf(): _FieldType<T> {
        const properties = { ...this.properties };
        if (properties.options) {
            properties.options = { ...properties.options };
            delete (properties.options as OptionsApi & { cache?: unknown }).cache;
        }
        return new _FieldType<T>(properties);
    }

    /** @deprecated Use a renderer-specific input configuration instead. */
    accept(string: string) {
        const copy = this.copy();
        copy.properties.accept = string;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `accept: ${copy.properties.accept}}`,
        ];
        return copy;
    }

    /** @deprecated Use a renderer-specific input configuration instead. */
    autofocus() {
        const copy = this.copy();
        copy.properties.autofocus = true;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `autofocus: ${copy.properties.autofocus}}`,
        ];
        return copy;
    }

    /** @deprecated Use a renderer-specific input configuration instead. */
    list(id: string) {
        const copy = this.copy();
        copy.properties.list = id;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `list: ${copy.properties.list}}`,
        ];
        return copy;
    }

    /** @deprecated Use a renderer-specific input configuration instead. */
    max(number: number) {
        const copy = this.copy();
        copy.properties.max = number;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `max: ${copy.properties.max}}`,
        ];
        return copy;
    }

    /** @deprecated Use a renderer-specific input configuration instead. */
    pattern(p: RegExp) {
        const copy = this.copy();
        copy.properties.pattern = p;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `pattern: ${copy.properties.pattern}}`,
        ];
        return copy;
    }

    /** @deprecated Use a renderer-specific input configuration instead. */
    step(increment: number) {
        const copy = this.copy();
        copy.properties.step = increment;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `step: ${copy.properties.step}}`,
        ];
        return copy;
    }

    /**
     * Adds a new custom validator to a field type
     */
    validator(validator: Validator<T>) {
        const copy = this.copy();
        copy.properties.validators = [...copy.properties.validators, validator];
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `validator: ${validator.name}}`,
        ];
        return copy;
    }

    formatter(fn: (value: T, record: Record<any>, context: string) => any) {
        const copy = this.copy();
        copy.properties.formatters = [...copy.properties.formatters, fn];
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `formatter: ${printFunction(fn)}}`,
        ];
        return copy;
    }

    /**

     * Provide a transform function to the current `FieldType` that is applied during rendering.
     * Can be used to achieve a view over the original data or to generate a new value entirely.
     *
     * Also supports Lit's `html` tag to render custom markup in a cell.
     *

     * @param fn Transform function that receives a copy of the field data 
     * and returns a transformed result.
     */
    template(
        fn: (
            field: T,
            record: Record<any>,
            context: string
        ) => string | number | boolean | TemplateResult | Array<TemplateResult>
    ) {
        const copy = this.copy();
        copy.properties.template = fn;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `template: ${printFunction(fn)}}`,
        ];
        return copy;
    }

    /**
     * @deprecated Use renderer-specific integration instead.
     */
    formElement(name: string, properties = {}) {
        const copy = this.copy();
        copy.properties.formElement = { name, properties };
        copy.properties.descriptions = [...copy.properties.descriptions, `form element: ${name}}`];
        return copy;
    }

    parser(fn: (value: any, record: Record<any>, context: string) => T) {
        const copy = this.copy();
        copy.properties.parsers = [fn, ...copy.properties.parsers];
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `parser: ${printFunction(fn)}}`,
        ];
        return copy;
    }

    /** Add cell classes directly or compute them from the field value and record. */
    cellClass(classes: ValueSetting<T, string | string[]>) {
        const copy = this.copy();
        const getClasses = classCallback(classes);
        copy.properties.cellClassFunctions = [...copy.properties.cellClassFunctions, getClasses];
        return copy;
    }

    /** Add classes shared by the entire column, without a row or cell context. */
    columnClass(classes: string | string[] | (() => string | string[])) {
        const copy = this.copy();
        copy.properties.columnClassFunctions = [
            ...copy.properties.columnClassFunctions,
            classCallback(classes),
        ];
        return copy;
    }

    textAlign(direction: FieldSetting<T, 'left' | 'center' | 'right'>) {
        const copy = this.copy();
        copy.properties.textAlign = direction;
        return copy;
    }

    /** Add row classes directly or compute them from the owning record. */
    rowClass(classes: RecordSetting<string | string[]>) {
        const copy = this.copy();
        const getClasses = classCallback(classes);
        copy.properties.rowClassFunctions = [...copy.properties.rowClassFunctions, getClasses];
        return copy;
    }

    compareFunction(fn: (a: T, b: T) => number) {
        const copy = this.copy();
        copy.properties.compareFunction = fn;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `compare function: ${printFunction(fn)}}`,
        ];
        return copy;
    }

    hashFunction<V = unknown>(fn: (values: V) => string) {
        const copy = this.copy();
        copy.properties.hashFunction = fn;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `equality function: ${printFunction(fn)}}`,
        ];
        return copy;
    }

    /** @deprecated Label visibility belongs to the renderer, not the field definition. */
    hideLabel() {
        const copy = this.copy();
        copy.properties.hideLabel = true;
        return copy;
    }

    /** @deprecated Custom print behavior belongs to the renderer. */
    usesCustomPrint() {
        const copy = this.copy();
        copy.properties.usesCustomPrint = true;
        return copy;
    }

    /**
     *
     * @param width
     */
    minColumnWidth(width: ColumnSetting<number>) {
        const copy = this.copy();
        copy.properties.minColumnWidth = width;
        copy.properties.x = true;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `min column width: ${width}`,
        ];
        return copy;
    }

    /**
     *
     * @param width
     */
    maxColumnWidth(width: ColumnSetting<number>) {
        const copy = this.copy();
        copy.properties.maxColumnWidth = width;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `max column width: ${width}`,
        ];
        return copy;
    }

    /**
     *
     * @param width
     */
    targetColumnWidth(width: ColumnSetting<number>) {
        const copy = this.copy();
        copy.properties.targetColumnWidth = width;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `target column width: ${width}`,
        ];
        return copy;
    }

    /**
     *
     * @param sortable
     */
    sortable(sortable: ColumnSetting<boolean>) {
        const copy = this.copy();
        copy.properties.sortable = sortable;
        copy.properties.descriptions = [...copy.properties.descriptions, `sortable: ${sortable}`];
        return copy;
    }

    reducer(nameOrFunction: 'sum' | ((values: T[]) => unknown)) {
        const copy = this.copy();
        if (nameOrFunction === 'sum') {
            copy.properties.aggregate = (values: Array<any>) => values.reduce((a, b) => a + b, 0);
        } else {
            copy.properties.aggregate = nameOrFunction as Function;
        }
        return copy;
    }

    defaultValue(value: DefaultSetting<T>) {
        const copy = this.copy();
        copy.properties.defaultValue = value;
        copy.properties.descriptions = [...copy.properties.descriptions, `default value: ${value}`];
        return copy;
    }

    /**
     * @deprecated
     * @param name
     */
    schema(name: string) {
        const copy = this.copy();
        copy.properties.schema = name;
        copy.properties.descriptions = [...copy.properties.descriptions, `schema: ${name}`];
        return copy;
    }

    type(type: RecordSetting<inputType>) {
        const copy = this.copy();
        copy.properties.type = type;
        copy.properties.descriptions = [...copy.properties.descriptions, `type: ${type}`];
        return copy;
    }

    /**
     * provides a label to our omega-field component.
     * @param label
     */
    label(label: RecordSetting<string>) {
        const copy = this.copy();
        copy.properties.labelFunctions = [...copy.properties.labelFunctions, label];
        copy.properties.descriptions = [...copy.properties.descriptions, `label: ${label}`];
        return copy;
    }

    /**
     * @deprecated Tooltip presentation belongs to the renderer.
     * Supply a message to be used with an information icon tooltip for fields displayed in Omega forms.
     */
    iconMessage(message: string) {
        const copy = this.copy();
        copy.properties.iconMessage = message;
        return copy;
    }

    /** @deprecated Browser autocomplete behavior belongs to the renderer. */
    autocomplete(string: AutoComplete) {
        const copy = this.copy();
        copy.properties.autocomplete = string;
        copy.properties.descriptions = [...copy.properties.descriptions, `autocomplete`];
        return copy;
    }

    /** @deprecated Option-control filtering belongs to the renderer or integration layer. */
    filtering() {
        const copy = this.copy();
        copy.properties.filtering = true;
        copy.properties.descriptions = [...copy.properties.descriptions, `filtering`];
        return copy;
    }

    options<O = T, F = Record<any>>(
        optionsConfig:
            | OptionsApi<O, F>
            | ((record: Record<any>) => O[] | Promise<O[]>)
            | Promise<O[]>
            | Array<O>
    ) {
        const copy = this.copy();
        if (!optionsConfig) return copy;

        let config = optionsConfig;

        if (config instanceof Function) {
            config = {
                // Preserve callback arity: record-dependent functions must invalidate their cache.
                fetch: optionsConfig as unknown as FetchFn<O, F>,
            };
        }

        if (config instanceof Promise || Array.isArray(config)) {
            config = { data: config };
        }

        const cfg = config as OptionsApi<any, any>;

        const data = cfg.data;
        copy.properties.options = {
            fetch: data ? () => Promise.resolve(data) : cfg.fetch,
            text: cfg.text || 'text',
            value: cfg.value || 'value',
            noCache: cfg.noCache || false,
            compareFunction: cfg.compareFunction,
            filter: cfg.filter ?? (() => true),
            fields: cfg.fields,
            hideSelectAll: cfg.hideSelectAll,
        };
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `options (${Object.keys(optionsConfig)})`,
        ];

        return copy;
    }

    /**
     *
     * @param {number} [min=1]
     * @param {number}[max=4]
     * @returns
     */
    multipleValues(min = 1, max = Number.MAX_SAFE_INTEGER) {
        const copy = this.copy();
        copy.properties.hasMultipleValues = true;
        copy.properties.minValueCount = min;
        copy.properties.maxValueCount = max;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `multiple values (${min} to ${max})`,
        ];
        return copy;
    }

    /** Disable the field always, or when the field setting resolves to true. */
    disabled(predicate: RecordSetting<boolean> = true) {
        const copy = this.copy();
        copy.properties.disableFunctions = [...copy.properties.disableFunctions, predicate];
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            predicate === true ? 'disabled' : `disabled when ${printFunction(predicate)}`,
        ];
        return copy;
    }

    range() {
        const copy = this.copy();
        copy.properties.range = true;
        copy.properties.specificDate = false;
        copy.properties.descriptions = [...copy.properties.descriptions, `range`];
        return copy;
    }

    /** @deprecated Use parser(...) to convert dynamic range input into the stored value. */
    parseDynamicRange() {
        const copy = this.copy();
        copy.properties.parseDynamicRange = true;
        copy.properties.descriptions = [...copy.properties.descriptions, `parse dynamic range`];
        return copy;
    }

    visible(predicate: RecordSetting<boolean>) {
        const copy = this.copy();
        copy.properties.visibleFunctions = [...copy.properties.visibleFunctions, predicate];
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `visible when ${printFunction(predicate)}}`,
        ];
        return copy;
    }

    /** @deprecated Use visible(predicate) instead. */
    visibleWhen(predicate: RecordSetting<boolean>) {
        return this.visible(predicate);
    }

    emptyWhen(predicate: ValueSetting<T, boolean>) {
        const copy = this.copy();
        copy.properties.emptyFunctions = [...copy.properties.emptyFunctions, predicate];
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `empty when ${printFunction(predicate)}`,
        ];
        return copy;
    }

    /** Render a read-only value always, or when a record setting resolves to true. */
    readOnly(predicate: RecordSetting<boolean> = true) {
        const copy = this.copy();
        copy.properties.readonlyFunctions = [...copy.properties.readonlyFunctions, predicate];
        copy.properties.descriptions = [...copy.properties.descriptions, `read only`];
        return copy;
    }

    /**
     * Sets a field to inline
     * @deprecated Inline layout is no longer part of the cookbook's supported modifier surface.
     *
     */
    inline() {
        const copy = this.copy();
        copy.properties.inlineFunctions = [...copy.properties.inlineFunctions, defaultTrueFunction];
        copy.properties.descriptions = [...copy.properties.descriptions, `inline`];
        return copy;
    }

    /**
     * Sets a field to inline based on a conditional expression
     * @param {{(record:Record) : boolean}} predicate - Conditional expression that should return true when a field should be inline
     * @deprecated Inline layout is no longer part of the cookbook's supported modifier surface.
     */
    inlineWhen(predicate: (record: Record<any>) => boolean) {
        const copy = this.copy();
        copy.properties.inlineFunctions = [...copy.properties.inlineFunctions, predicate];
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `inline when ${printFunction(predicate)}}`,
        ];
        return copy;
    }

    /** @deprecated Use a renderer-specific control configuration instead. */
    segmented() {
        const copy = this.copy();
        copy.properties.segmentedFunctions = [
            ...copy.properties.segmentedFunctions,
            defaultTrueFunction,
        ];
        copy.properties.descriptions = [...copy.properties.descriptions, `segmented`];
        return copy;
    }

    /**
     * @deprecated Composite-control read-only exceptions belong to the renderer.
     * Determines whether an exception exists for another read only condition.
     * For example, if a field has multiple sub-components with different read-only conditions
     * @param {{(record:Record) : boolean}} predicate
     */
    readOnlyExceptionWhen(predicate: (record: Record<any>) => boolean) {
        const copy = this.copy();
        copy.properties.readonlyexceptionFunctions = [
            ...copy.properties.readonlyexceptionFunctions,
            predicate,
        ];
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `read only exception when ${printFunction(predicate)}}`,
        ];
        return copy;
    }

    /** Require a non-empty value always, or when the field setting resolves to true. */
    required(predicate: RecordSetting<boolean> = true) {
        const copy = this.copy();
        copy.properties.requiredFunctions = [...copy.properties.requiredFunctions, predicate];
        copy.properties.validators = [
            ...copy.properties.validators,
            {
                name: 'is required',
                validate: (
                    modelValue: any,
                    viewValue: any,
                    record: Record<any>,
                    options: OptionsApi,
                    field: any
                ) =>
                    !resolveRecordSetting(predicate, record) ||
                    !(record?.fieldTypeForField(field) ?? copy).properties.emptyFunctions.some(
                        (fn: ValueSetting<T, boolean>) =>
                            resolveValueSetting(fn, modelValue, record)
                    ),
            },
        ];
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            predicate === true ? 'required' : `required when ${printFunction(predicate)}`,
        ];
        return copy;
    }

    search(config: SearchConfig<T>) {
        const copy = this.copy();
        copy.properties.search = true;
        copy.properties.searchConfig = config;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `search config: ${config}`,
        ];
        return copy;
    }

    /** @deprecated Use search(config) to configure search behavior instead. */
    hasSearch() {
        const copy = this.copy();
        copy.properties.search = true;
        copy.properties.descriptions = [...copy.properties.descriptions, `has search`];
        return copy;
    }

    /** Defines how a table filter term matches this field's value. */
    filter(predicate?: (searchText: string, value: T) => boolean) {
        const copy = this.copy();
        copy.properties.filter = predicate ?? caseInsensitiveTextMatch;
        copy.properties.filtering = true;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `filter: ${printFunction(predicate)}`,
        ];
        return copy;
    }

    /**
     * Accepts input characters matching a regular expression; other characters are ignored by input adapters
     * @param {RegExp} regex
     */
    inputMask(regex: RegExp) {
        const copy = this.copy();
        const characterPattern = new RegExp(regex.source, regex.flags.replace(/[gy]/g, ''));
        copy.properties.allowInputChar = (char: string) =>
            [...char].length !== 1 || characterPattern.test(char);
        copy.properties.descriptions = [...copy.properties.descriptions, `input mask: ${regex}`];
        return copy;
    }

    /** @deprecated Configure choice disabling in the renderer or form adapter. */
    selectionDisabledFunctions(functions: FunctionCollection) {
        const copy = this.copy();
        copy.properties.selectionDisabledFunctions = functions;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `selectionDisabledFunctions: ${functions}`,
        ];
        return copy;
    }

    /**
     * Sets the number of rows on a field
     * @deprecated Textarea sizing is a presentation concern. Move row-count configuration into fdl-field instead of FieldType.
     * @param {number} numberOfRows
     */
    rowCount(numberOfRows: number) {
        const copy = this.copy();
        copy.properties.numberOfRows = numberOfRows;
        copy.properties.rowCountConfigured = true;
        copy.properties.descriptions = [...copy.properties.descriptions, `${numberOfRows} rows`];
        return copy;
    }

    /**
     * Sets the placeholder on a field
     * @param {string} placeholder - Placeholder value
     */
    placeholder(placeholder: RecordSetting<string>) {
        const copy = this.copy();
        copy.properties.placeholder = placeholder;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `placeholder = "${placeholder}"`,
        ];
        return copy;
    }

    /**
     * Sets the minimum length on a field
     * @param {number} length - Minimum length
     */
    minLength(length: RecordSetting<number>) {
        const copy = this.copy();
        copy.properties.minLength = length;
        const minLengthValidator = {
            name: `minimum length is ${length}`,
            validate: (value: any, _viewValue: any, record: Record<any>) => {
                if (!value) return true;
                return value.length >= resolveRecordSetting(length, record);
            },
        };
        copy.properties.validators = [...copy.properties.validators, minLengthValidator];
        copy.properties.descriptions = [...copy.properties.descriptions, `minlength = ${length}`];
        return copy;
    }

    /**
     *
     * @param {number} length
     */
    maxLength(length: RecordSetting<number>) {
        const copy = this.copy();
        copy.properties.maxLength = length;
        const maxLengthValidator = {
            name: `maximum length is ${length}`,
            validate: (value: any, _viewValue: any, record: Record<any>) => {
                if (!value) return true;
                const valueString = value.toString();
                return valueString.length <= resolveRecordSetting(length, record);
            },
        };
        copy.properties.validators = [...copy.properties.validators, maxLengthValidator];
        copy.properties.descriptions = [...copy.properties.descriptions, `maxlength = ${length}`];
        return copy;
    }

    /**
     *
     * @param {string} text
     */
    description(text: string) {
        const copy = this.copy();
        copy.properties.descriptions = [...copy.properties.descriptions, text];
        return copy;
    }

    /** @deprecated Formatting policy belongs to the renderer and value pipeline. */
    formatOnChange() {
        const copy = this.copy();
        copy.properties.formatOnChange = true;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            'format input value on keydown',
        ];
        return copy;
    }

    /** @deprecated Express derived values through record/model behavior instead. */
    onValueChange(fn: Function) {
        const copy = this.copy();
        copy.properties.descriptions = [...copy.properties.descriptions, 'on value change'];
        copy.properties.onValueChange = [...copy.properties.onValueChange, fn];
        return copy;
    }

    /**
     * @deprecated Field definitions should be bound by the record/renderer, not by an alias.
     * The field used on this field type's record / recordset
     */
    field(field: string) {
        const copy = this.copy();
        copy.properties.field = field;
        copy.properties.descriptions = [...copy.properties.descriptions, `field = ${field}`];
        return copy;
    }

    /** @deprecated Avoid passing arbitrary renderer properties through the field definition. */
    additionalProperties(additionalProperties: any) {
        const copy = this.copy();
        copy.properties.additionalProperties = additionalProperties;
        copy.properties.descriptions = [
            ...copy.properties.descriptions,
            `additional properties = ${additionalProperties}`,
        ];
        return copy;
    }
}
