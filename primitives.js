/* eslint-disable @treasury/no-date */
import FieldTypeBuilder from './field-type-builder';

/** The reusable starting point for custom field definitions. */
export const field = /** @type {FieldTypeBuilder<any>} */ (new FieldTypeBuilder());

const stringBase = /** @type {FieldTypeBuilder<string>} */ (new FieldTypeBuilder());
export const string = stringBase.defaultValue('');

const booleanBase = /** @type {FieldTypeBuilder<boolean>} */ (new FieldTypeBuilder());
export const boolean = booleanBase.schema('boolean').defaultValue(false);

const numberBase = /** @type {FieldTypeBuilder<number>} */ (new FieldTypeBuilder());
export const number = numberBase
    .cellClass('numeric')
    .defaultValue(0)
    .inputMask(/[0-9$.,]/);

const dateBase = /** @type {FieldTypeBuilder<Date>} */ (new FieldTypeBuilder());
export const date = dateBase
    .cellClass('date')
    .minColumnWidth(50)
    .targetColumnWidth(80)
    .maxColumnWidth(200)
    .defaultValue(new Date());
