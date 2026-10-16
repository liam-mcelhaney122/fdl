/* eslint-disable import/extensions */
import { defaultProperties } from './field-type-builder';
import {
    resolveSetting,
    resolveColumnSetting,
    resolveDefaultSetting,
    resolveRecordSetting,
    resolveValueSetting,
} from './field-setting';
import { inputTypes } from './types/input-types.types';

function functionHasNoArguments(f) {
    return f.length === 0;
}

/**
 * @template [T = unknown]
 * Provides a fluent-API for building field validators used within FDL forms.
 */
// eslint-disable-next-line @treasury/filename-match-export
export default class FieldType {
    /**
     *
     * @param {import('./field-type-builder').Properties<T> | null} [properties]
     */
    constructor(properties = null) {
        /** @type {import('./field-type-builder').Properties<T>} */
        this.properties = properties ?? defaultProperties;
        this._validators = [];
        this.resultsText = {};
        this.loaded = Promise.resolve(null);
    }

    /** A finalized field type is already its own value. */
    valueOf() {
        return this;
    }

    get hasParts() {
        return false;
    }

    accept() {
        return this.properties.accept;
    }

    autocomplete() {
        return this.properties.autocomplete;
    }

    autofocus() {
        return this.properties.autofocus;
    }

    cellClasses(value, record) {
        return this.properties.cellClassFunctions.flatMap(getClasses => getClasses(value, record));
    }

    /**
     *
     * @param {import('./record').default<any>} record
     * @returns {Array}
     */
    rowClasses(record) {
        return this.properties.rowClassFunctions
            .map(getClasses => getClasses(record))
            .reduce((classesThusFar, classes) => classesThusFar.concat(classes), []);
    }

    /** Resolve column classes without selecting an owning record. */
    columnClasses() {
        return this.properties.columnClassFunctions.flatMap(getClasses => getClasses());
    }

    compare(a, b) {
        return this.properties.compareFunction(a, b);
    }

    /**
     *
     * @param {*} value
     * @param {Record} record
     * @param {*} context
     * @returns {*}
     */
    format(value, record, context = 'model') {
        let output = this.resultsText[JSON.stringify(value)] ?? value;
        this.properties.formatters.forEach(format => {
            output = format(output, record, context);
        });
        return output;
    }

    /**
     *
     * @param {*} value
     * @param {Record} record
     * @returns {*}
     */
    print(value, record) {
        return this.properties.template(this.format(value, record, 'print'), record, 'print');
    }

    parse(value, record, context = 'model') {
        let output = value;
        this.properties.parsers.forEach(parse => {
            output = parse(output, record, context);
        });
        return output;
    }

    aggregate(values) {
        return this.properties.aggregate(values);
    }

    validate(field, modelValue, viewValue, record, options) {
        /* eslint-disable no-param-reassign */
        const errors = [];
        this.properties.validators.forEach(validator => {
            const result = validator.validate(modelValue, viewValue, record, options, field);
            if (result && typeof result.then === 'function') {
                result.catch(() => {});
                throw new Error(
                    'FieldType.validate() cannot run async validators; use validateAsync() instead.'
                );
            }
            if (!result) {
                errors.push({
                    name: validator.name,
                    field,
                    modelValue,
                    viewValue,
                    record,
                    options,
                });
            }
        });

        return errors;
    }

    async validateAsync(field, modelValue, viewValue, record, options) {
        const results = await Promise.all(
            this.properties.validators.map(validator =>
                Promise.resolve(validator.validate(modelValue, viewValue, record, options, field))
            )
        );

        return results.reduce((errors, valid, index) => {
            if (!valid) {
                const validator = this.properties.validators[index];
                errors.push({
                    name: validator.name,
                    field,
                    modelValue,
                    viewValue,
                    record,
                    options,
                });
            }
            return errors;
        }, []);
    }

    defaultValue(value, record, context = 'model') {
        const configured =
            value !== null && value !== undefined
                ? value
                : resolveDefaultSetting(this.properties.defaultValue, record);
        if (this.hasMultipleValues()) {
            return configured ?? 'all';
        }
        if (this.schema() === 'range') {
            return configured ?? ['range', 0, 0];
        }
        if (value !== null && value !== undefined) {
            return value;
        }
        if (configured !== null && configured !== undefined) return configured;
        return '';
    }

    list() {
        return this.properties.list;
    }

    schema() {
        return this.properties.schema;
    }

    type(value, record, context = 'model') {
        const type = resolveRecordSetting(this.properties.type, record);
        if (!inputTypes.includes(type)) return new Error(`Invalid input type: ${type}`);
        return type;
    }

    label(value, record, context = 'model') {
        const settings = this.properties.labelFunctions;
        return resolveRecordSetting(settings[settings.length - 1] ?? '', record);
    }

    iconMessage() {
        return this.properties.iconMessage;
    }

    search() {
        return !!this.properties.search;
    }

    searchConfig() {
        return this.properties.searchConfig;
    }

    hasSearch() {
        return !!this.properties.search;
    }

    hasOptions() {
        return !!this.properties.options;
    }

    hasFilter() {
        return !!this.properties.filtering;
    }

    options(record) {
        if (!this.hasOptions()) return Promise.resolve([]);
        return this.fetchOptions(record);
    }

    fetchOptions(record) {
        const { options } = this.properties;
        const { cache, noCache } = options;
        const hash = record?.hashOfFields(this.properties.options.fields);

        if (cache && cache.hash === hash && !noCache) {
            return cache.results;
        }

        if (cache && functionHasNoArguments(options.fetch) && !noCache) {
            return cache.results;
        }

        let results = [];
        if (typeof options?.fetch === 'function') {
            let p = options?.fetch(record);

            if (!(p instanceof Promise)) {
                p = Promise.resolve(p);
            }

            results = p.then(data => {
                if (this.properties.schema === 'datepicker') {
                    return data;
                }
                return this.filterOptions(this.sortOptions(this.mapOptions(data)), record);
            });
            options.cache = {
                hash,
                results,
            };

            results.then(
                fetchData => {
                    fetchData.forEach(result => {
                        if (typeof result.value !== 'object') {
                            this.resultsText[JSON.stringify(result.value)] = result.text;
                        }
                    });
                },
                () => {}
            );
            this.loaded = results;
        }
        return results;
    }

    filterOptions(options, record) {
        return options.filter((value, index) =>
            this.properties.options.filter(value, index, record)
        );
    }

    sortOptions(options) {
        return options.sort(this.properties.options.compareFunction);
    }

    mapOptions(options) {
        if (!Array.isArray(options)) return [];
        return options.map(
            this.mapTextValue(this.properties.options.text, this.properties.options.value)
        );
    }

    // eslint-disable-next-line class-methods-use-this
    mapTextValue(textKey, valueKey) {
        return item => ({
            ...item,
            text: textKey instanceof Function ? textKey(item) : item[textKey],
            value: valueKey instanceof Function ? valueKey(item) : item[valueKey],
        });
    }

    filteredOptions(record) {
        if (Array.isArray(this.properties.options))
            return this.properties.options.filter(option => this.optionMatches(record, option));
        return null;
    }

    optionMatches(record, option) {
        if (!this.properties.optionsFilter) return true;
        const recordKey = record.values[this.properties.optionsFilter.recordKey].toString();
        const optionsKey = option[this.properties.optionsFilter.optionsKey].toString();
        return recordKey.includes(optionsKey);
    }

    hasMultipleValues() {
        return this.properties.hasMultipleValues;
    }

    minValueCount() {
        return this.properties.minValueCount;
    }

    maxValueCount() {
        return this.properties.maxValueCount;
    }

    max() {
        return this.properties.max;
    }

    isDisabled(value, record, context = 'model') {
        return this.properties.disableFunctions.some(setting =>
            resolveRecordSetting(setting, record)
        );
    }

    hasRange() {
        return this.properties.range;
    }

    getParseDynamicRange() {
        return this.properties.parseDynamicRange;
    }

    match(searchText, value) {
        return this.properties.filter(searchText, value);
    }

    minLength(value, record, context = 'model') {
        return resolveRecordSetting(this.properties.minLength, record);
    }

    maxLength(value, record, context = 'model') {
        return resolveRecordSetting(this.properties.maxLength, record);
    }

    allowInputChar(char) {
        return this.properties.allowInputChar(char);
    }

    selectionDisabledFunctions() {
        return this.properties.selectionDisabledFunctions;
    }

    required(value, record, context = 'model') {
        return this.properties.requiredFunctions.some(setting =>
            resolveRecordSetting(setting, record)
        );
    }

    onValueChange(record) {
        return this.properties.onValueChange.forEach(fn => fn(record));
    }

    visible(value, record, context = 'model') {
        return this.properties.visibleFunctions.every(setting =>
            resolveRecordSetting(setting, record)
        );
    }

    empty(record, field) {
        return this.isEmpty(record?.getField(field), record);
    }

    isEmpty(value, record, context = 'model') {
        return this.properties.emptyFunctions.some(setting =>
            resolveValueSetting(setting, value, record)
        );
    }

    readonly(value, record, context = 'model') {
        return this.properties.readonlyFunctions.some(setting =>
            resolveRecordSetting(setting, record)
        );
    }

    readonlyexception(record) {
        return this.properties.readonlyexceptionFunctions.some(fn => fn(record));
    }

    inline(record) {
        return this.properties.inlineFunctions.some(fn => fn(record));
    }

    segmented(record) {
        return this.properties.segmentedFunctions.some(fn => fn(record));
    }

    /** @deprecated Textarea sizing is a presentation concern. Move row-count configuration into fdl-field instead of FieldType. */
    rowCount() {
        return this.properties.numberOfRows;
    }

    hasRowCount() {
        return this.properties.rowCountConfigured;
    }

    placeholder(value, record, context = 'model') {
        return resolveRecordSetting(this.properties.placeholder, record);
    }

    pattern() {
        return this.properties.pattern;
    }

    formElement(elementName) {
        return this.properties.formElement(elementName);
    }

    info() {
        return this.properties.descriptions;
    }

    formatOnChange() {
        return this.properties.formatOnChange;
    }

    textAlign(value, record, context = 'model') {
        return resolveSetting(this.properties.textAlign, value, record, context);
    }

    sortable() {
        return resolveColumnSetting(this.properties.sortable);
    }

    minColumnWidth() {
        return resolveColumnSetting(this.properties.minColumnWidth);
    }

    maxColumnWidth() {
        return resolveColumnSetting(this.properties.maxColumnWidth);
    }

    targetColumnWidth() {
        return resolveColumnSetting(this.properties.targetColumnWidth);
    }

    field() {
        return this.properties.field;
    }

    additionalProperties() {
        return this.properties.additionalProperties;
    }

    step() {
        return this.properties.step;
    }

    hashFunction() {
        return this.properties.hashFunction;
    }

    hideLabel() {
        return this.properties.hideLabel;
    }

    usesCustomPrint() {
        return this.properties.usesCustomPrint;
    }
}

/** @typedef {import('./record.js').default} Record */
