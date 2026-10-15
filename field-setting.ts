import type Record from './record.js';

/** A fixed setting or a value resolved for one field in a record. */
export type FieldSetting<T, Result, R = any> =
    | Result
    | ((value: T, record: Record<R>, context: string) => Result);

/** A column has no single field value or owning record. */
export type ColumnSetting<Result> =
    | Result
    | ((value: undefined, record: undefined, context: string) => Result);

export function resolveSetting<T, R, Result>(
    setting: Result | ((value: T, record: R, context: string) => Result),
    value: T,
    record: R,
    context = 'model'
): Result {
    return typeof setting === 'function'
        ? (setting as (value: T, record: R, context: string) => Result)(value, record, context)
        : setting;
}
