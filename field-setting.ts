import type Record from './record.js';

/** A fixed display setting or a calculation for one cell and consumer context. */
export type FieldSetting<T, Result, R = any> =
    | Result
    | ((value: T, record: Record<R>, context: string) => Result);

/** A fixed setting or a calculation from the owning record. */
export type RecordSetting<Result, R = any> = Result | ((record: Record<R>) => Result);

/** A value rule also sees an unstored validation candidate. */
export type ValueSetting<T, Result, R = any> = Result | ((value: T, record: Record<R>) => Result);

export function resolveRecordSetting<Result, R>(
    setting: RecordSetting<Result, R>, record: Record<R>
): Result {
    return typeof setting === 'function' ? (setting as (record: Record<R>) => Result)(record) : setting;
}

export function resolveValueSetting<T, Result, R>(
    setting: ValueSetting<T, Result, R>, value: T, record: Record<R>
): Result {
    return typeof setting === 'function' ? (setting as (value: T, record: Record<R>) => Result)(value, record) : setting;
}

/** A column has no single field value or owning record. */
export type ColumnSetting<Result> =
    | Result
    | ((context: string) => Result);

/** A default is created for an owning record, without an existing field value. */
export type DefaultSetting<T, R = any> =
    | T
    | null
    | ((record: Record<R>) => T | null);

export function resolveColumnSetting<Result>(setting: ColumnSetting<Result>, context: string): Result {
    return typeof setting === 'function'
        ? (setting as (context: string) => Result)(context)
        : setting;
}

export function resolveDefaultSetting<T, R>(
    setting: DefaultSetting<T, R>, record: Record<R>
): T | null {
    return typeof setting === 'function'
        ? (setting as (record: Record<R>) => T | null)(record)
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
