import type Record from './record.js';

/** A fixed display setting or a calculation for one field and consumer context. */
export type FieldSetting<T, Result, R = any> =
    Result | ((value: T, record: Record<R>, context: string) => Result);

/** A fixed setting or a calculation from the owning record. */
export type RecordSetting<Result, R = any> = Result | ((record: Record<R>) => Result);

/** A calculation from a field value and record; validation may supply an unstored candidate. */
export type ValueSetting<T, Result, R = any> = Result | ((value: T, record: Record<R>) => Result);

export function resolveRecordSetting<Result, R>(
    setting: RecordSetting<Result, R>,
    record: Record<R>
): Result {
    return typeof setting === 'function'
        ? (setting as (record: Record<R>) => Result)(record)
        : setting;
}

export function resolveValueSetting<T, Result, R>(
    setting: ValueSetting<T, Result, R>,
    value: T,
    record: Record<R>
): Result {
    return typeof setting === 'function'
        ? (setting as (value: T, record: Record<R>) => Result)(value, record)
        : setting;
}

/** A fixed column setting or a calculation without per-cell inputs or context. */
export type ColumnSetting<Result> = Result | (() => Result);

/** A default is created for an owning record, without an existing field value. */
export type DefaultSetting<T, R = any> = T | null | ((record: Record<R>) => T | null);

export function resolveColumnSetting<Result>(setting: ColumnSetting<Result>): Result {
    return typeof setting === 'function' ? (setting as () => Result)() : setting;
}

export function resolveDefaultSetting<T, R>(
    setting: DefaultSetting<T, R>,
    record: Record<R>
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
