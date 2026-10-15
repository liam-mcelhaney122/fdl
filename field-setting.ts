import type Record from './record.js';

/** A fixed setting or a value resolved for one field in a record. */
export type FieldSetting<T, Result, R = any> =
    | Result
    | ((value: T, record: Record<R>, context: string) => Result);

/** A column has no single field value or owning record. */
export type ColumnSetting<Result> =
    | Result
    | ((context: string) => Result);

/** A default is created for an owning record, without an existing field value. */
export type DefaultSetting<T, R = any> =
    | T
    | null
    | ((record: Record<R>, context: string) => T | null);

export function resolveColumnSetting<Result>(setting: ColumnSetting<Result>, context: string): Result {
    return typeof setting === 'function'
        ? (setting as (context: string) => Result)(context)
        : setting;
}

export function resolveDefaultSetting<T, R>(
    setting: DefaultSetting<T, R>, record: Record<R>, context: string
): T | null {
    return typeof setting === 'function'
        ? (setting as (record: Record<R>, context: string) => T | null)(record, context)
        : setting;
}

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
