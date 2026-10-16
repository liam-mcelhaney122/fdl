/* eslint-disable @treasury/filename-match-export */
// TODO rename this file to record.js (lowercase)

import clone from './helpers/clone.js';
import deepEquals from './utilities/deep-equality';
import FieldType from './field-type.js';
import Field from './field.js';

/**
 * @template [T = unknown]
 */
export default class Record extends EventTarget {
    /**
     * @param {Object.<string, import('./types/field-definition.types').FieldDefinition<any>>} fieldTypes
     * @param {T} values
     */
    constructor(fieldTypes, values) {
        super();
        this.cachedFields = {};
        /** @type {Object.<string, FieldType<any>>} */
        this.fieldTypes = Object.fromEntries(
            Object.entries(fieldTypes).map(([name, definition]) => [name, definition.valueOf()])
        );
        /**
         * The backing object used to hydrate the record.
         * @type {T}
         * @public
         */
        this.values =
            values || console.error('You are passing undefined values', fieldTypes, values);
        this.initialValues = clone(values);
        this.listeners = {};
        /** @type {boolean} View model property used by <omega-table> to track detail row state. */
        this.isExpanded = false;
        this.optionsRevision = 0;
        this.optionsRefresh = Promise.resolve();
        this.refreshOptions();
    }

    /**
     * Reconcile selections against the latest options, independently of any UI.
     * Calls in the same turn are coalesced; obsolete responses cannot clear values.
     * @returns {Promise<void>}
     */
    refreshOptions() {
        const revision = ++this.optionsRevision;
        this.optionsRefresh = Promise.resolve().then(async () => {
            if (revision !== this.optionsRevision) return;
            const results = await Promise.all(
                Object.entries(this.fieldTypes)
                    .filter(
                        ([field, fieldType]) =>
                            fieldType.hasOptions() &&
                            !fieldType.isDisabled(this.getField(field), this)
                    )
                    .map(async ([field, fieldType]) => {
                        try {
                            return { field, fieldType, options: await this.optionsForField(field) };
                        } catch {
                            // A failed lookup is not an empty list of available choices.
                            return undefined;
                        }
                    })
            );
            if (revision !== this.optionsRevision) return;
            const changes = {};
            for (const result of results) {
                if (!result || !Array.isArray(result.options)) continue;
                const { field, fieldType, options } = result;
                const current = this.getField(field);
                if (current === undefined || current === null || current === '') continue;
                const available = value => options.some(option => deepEquals(option.value, value));
                if (fieldType.hasMultipleValues() && Array.isArray(current)) {
                    const retained = current.filter(available);
                    if (retained.length !== current.length) changes[field] = retained;
                } else if (!available(current)) {
                    changes[field] = undefined;
                }
            }
            this.setFields(changes);
        });
        return this.optionsRefresh;
    }

    /** Load choices only when the field's declared state permits editing. */
    optionsForField(field) {
        const fieldType = this.fieldTypeForField(field);
        if (fieldType.isDisabled(this.getField(field), this)) return Promise.resolve([]);
        return fieldType.options(this);
    }

    /** Wait until option reconciliation and any resulting dependency changes settle. */
    async whenOptionsReady() {
        let pending;
        do {
            pending = this.optionsRefresh;
            await pending;
        } while (pending !== this.optionsRefresh);
    }

    get hasChanged() {
        return !deepEquals(this.initialValues, this.values);
    }

    /**
     *
     * @param {string} field
     * @param {*} context
     */
    getFormattedField(field, context) {
        return this.fieldTypeForField(field).format(this.getField(field), this, context);
    }

    /**
     *
     * @param {string} field
     * @param {number} [index]
     */
    print(field, index) {
        const value = index === undefined ? this.getField(field) : this.getField(field)[index];
        return this.fieldTypeForField(field).print(value, this);
    }

    /**
     *
     * @param {string} field
     * @param {any} value
     */
    parse(field, value) {
        return this.fieldTypeForField(field).parse(value, this, 'model');
    }

    /**
     *
     * @param {{(event:CustomEvent):any}} callback
     * @deprecated - use `this.listenTo(record,'change',callback)` instead
     */
    onChange(callback) {
        console.warn(
            "Record#onChange() is deprecated. Use this.listenTo(record, 'change', callback) instead."
        );
        this.addEventListener('change', callback);
    }

    /**
     *
     * @param {string} field
     */
    announceChange(field) {
        this.refreshOptions();
        this.dispatchEvent(new CustomEvent('change', { detail: { field } }));
    }

    /**
     *
     * @param {string} field
     */
    announceBlur(field) {
        this.dispatchEvent(new CustomEvent('blur', { detail: { field } }));
    }

    errors() {
        return Object.keys(this.values).map(key => {
            if (this.fieldTypeForField(key).hasParts) {
                return this.fieldTypeForField(key)
                    .parts()
                    .map(part =>
                        part.type.validate(part.key, this.values[key][part.key], null, this)
                    );
            }
            return this.fieldTypeForField(key).validate(key, this.values[key], null, this);
        });
    }

    async errorsAsync() {
        return Promise.all(
            Object.keys(this.values).map(key => {
                const fieldType = this.fieldTypeForField(key);
                if (fieldType.hasParts) {
                    return Promise.all(
                        fieldType
                            .parts()
                            .map(part =>
                                part.type.validateAsync(
                                    part.key,
                                    this.values[key][part.key],
                                    null,
                                    this
                                )
                            )
                    );
                }
                return fieldType.validateAsync(key, this.values[key], null, this);
            })
        );
    }

    /**
     *
     * @returns {number}
     */
    errorCount() {
        return this.errors()
            .flat()
            .reduce((a, b) => a.concat(b), []).length;
    }

    hasErrors() {
        return this.errorCount() > 0;
    }

    readableRecordErrors() {
        const fieldValidationErrors = Object.keys(this.values).map(key => {
            if (this.fieldTypeForField(key).hasParts) {
                return this.fieldTypeForField(key)
                    .parts()
                    .map(part =>
                        part.type.validate(part.key, this.values[key][part.key], null, this)
                    );
            }
            return this.fieldTypeForField(key)
                .validate(key, this.values[key], null, this)
                .map(v => ({
                    ...v,
                    label: this.fieldTypeForField(key).label(this.getField(key), this, 'model'),
                }));
        });
        return fieldValidationErrors
            .map(field => field.map(error => `${error.label}: ${error.name}`))
            .flat();
    }

    /**
     *
     * @param {*} field string
     * @returns {array}
     */
    readableFieldErrors(field) {
        return this.fieldTypeForField(field)
            .validate(field, this.values[field], null, this)
            .map(v => ({
                ...v,
                label: this.fieldTypeForField(field).label(this.getField(field), this, 'model'),
            }))
            .map(error => `${error.label} ${error.name}`)
            .flat();
    }

    /**
     * Checks the validity of a field based on the fields validators.
     *
     * @param {string} [key] Field name string
     * @param {*} [value] Value for the field, defaults to whatever is in the record.
     *
     * @returns {boolean} Returns if the field is valid
     */
    isValid(key, value = this.values[key]) {
        if (key) {
            return this.fieldTypeForField(key).validate(key, value, null, this).length === 0;
        }

        return !this.hasErrors();
    }

    async isValidAsync(key, value = this.values[key]) {
        if (key) {
            return (
                (await this.fieldTypeForField(key).validateAsync(key, value, null, this)).length ===
                0
            );
        }

        return (await this.errorsAsync()).flat(2).length === 0;
    }

    get invalidValues() {
        const invalidValues = [];
        Object.keys(this.fieldTypes).forEach(key => {
            if (!this.isValid(key)) {
                invalidValues.push(key);
            }
        });
        return invalidValues;
    }

    hasRequiredValues() {
        return !Object.keys(this.fieldTypes).some(field => {
            const fieldTypeForField = this.fieldTypes[field];
            const isFieldRequired = fieldTypeForField.required(this.getField(field), this, 'model');
            const valueIsNotZero = this.values[field] !== 0;
            const isFalsyValue = !this.values[field];
            if (isFieldRequired && !this.values[field]) {
                console.warn(field, 'is required and has a falsy value of', this.values[field]);
            }
            return isFieldRequired && valueIsNotZero && isFalsyValue;
        });
    }

    /**
     *
     * @param {string} field
     * @returns {FieldType} FieldType
     */
    fieldTypeForField(field) {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');

            const parentFieldType = this.fieldTypes[parent];

            if (parentFieldType.hasParts) {
                return this.fieldTypes[parent].parts().find(p => p.key === child).type;
            }
            return this.fieldTypeForField(parent);
        }
        return this.fieldTypes[field] || new FieldType();
    }

    /**
     * @param {string} field
     * @param {import('./types/field-definition.types').FieldDefinition<any>} fieldType
     * @param {*} value
     */
    addField(field, fieldType, value) {
        this.fieldTypes = { ...this.fieldTypes, [field]: fieldType.valueOf() };
        this.values = { ...this.values, [field]: value };
        this.announceChange(field);
    }

    /**
     *
     * @template {keyof T} R
     * @param  {R} field
     * @param {T[R]} value
     */
    setField(field, value) {
        /** @type { string[] }  */
        const parts = field.split('.');
        let target = this.values;

        while (parts.length > 1) {
            target = target[parts.shift()];
        }

        target[parts.shift()] = value;
        this.announceChange(field);
    }

    /**
     *
     * @param {object} fields
     */
    setFields(fields) {
        Object.keys(fields).forEach(field => {
            this.setField(field, fields[field]);
        });
    }

    /**
     *
     * @param {string} fieldName
     * @param {*} formattedValue
     */
    parseAndSetField(fieldName, formattedValue) {
        this.setField(fieldName, this.parse(fieldName, formattedValue));
    }

    /**
     * Gets the value of a field
     * @template {keyof T} R
     * @param {R} field
     * @returns {T[R]}
     */
    getField(field) {
        const parts = field.split('.');
        let target = this.values;
        /*
         This recursively gets nested object values,
         returning the nested property until we traverse into the final
         descendent
        */
        while (parts.length > 1) {
            target = target[parts.shift()];
        }
        return target[parts.shift()];
    }

    /**
     *
     * @param {string} field
     */
    hasField(field) {
        return this.getField(field) !== undefined;
    }

    reset() {
        this.values = clone(this.initialValues);
        Object.keys(this.values).map(field => this.announceChange(field));
    }

    clear() {
        const defaultValues = {};
        for (const [key, value] of Object.entries(this.fieldTypes)) {
            defaultValues[key] = value.defaultValue(undefined, this, 'model');
        }
        this.values = defaultValues;
        Object.keys(this.values).forEach(field => this.announceChange(field));
    }

    allowInputChar(field, char) {
        return this.fieldTypeForField(field).allowInputChar(char);
    }

    /**
     *
     * @param {string} name
     * @returns {Field}
     */
    field(name) {
        if (!this.cachedFields[name]) this.cachedFields[name] = new Field(this, name);

        return this.cachedFields[name];
    }

    /**
     *
     * @param {(keyof T)[]} [fields]
     * @returns {Record}
     */
    clone(fields) {
        /** @type {T} */
        let clonedValues;
        const proto = Object.getPrototypeOf(this.values);

        // treat POJOs as simple objects
        if (proto.constructor === Object) {
            const fieldsToClone = fields ?? Object.keys(this.fieldTypes);
            const entries = Object.entries(this.values).map(([fieldName, value]) => {
                if (!fieldsToClone.includes(fieldName)) {
                    value = this.fieldTypeForField(fieldName).defaultValue(
                        undefined,
                        this,
                        'model'
                    );
                }

                return [fieldName, value];
            });
            clonedValues = Object.fromEntries(entries);
        }
        // support class instances stored in records
        else {
            clonedValues = clone(this.values);
        }

        return new Record(this.fieldTypes, clonedValues);
    }

    hashOfFields(fields) {
        return JSON.stringify(
            Object.entries(this.values).filter(([key]) => !fields || fields.includes(key))
        );
    }
}
