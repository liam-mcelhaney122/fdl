import type Record from '../../record.js';
import type Recordset from '../../recordset.js';
import { RecordsetEvent } from '../../recordset.events';
import { FieldOption, FieldState, FieldStateOptions, readFieldState } from './field-state';

/**
 * The Svelte store contract. Any object with this `subscribe` method works with
 * `$store` syntax in Svelte 4 and Svelte 5 without importing Svelte at runtime.
 */
export interface Readable<T> {
    subscribe(run: (value: T) => void, invalidate?: () => void): () => void;
}

/** Field state plus option-loading state for one field. */
export interface FieldStoreValue extends FieldState {
    /** The most recent choices loaded for the current dependency values. */
    options: FieldOption[];
    /** `true` while the latest option lookup is pending. */
    optionsLoading: boolean;
    /** The rejection from the latest option lookup, if it failed. */
    optionsError?: unknown;
}

export interface FieldStore extends Readable<FieldStoreValue> {
    readonly record: Record<any>;
    readonly field: string;
    /** Parse a view value and store it in the Record, as a control edit does. */
    edit(viewValue: unknown): void;
    /** Change the application's validation-display policy for this field. */
    setShowValidationErrors(show: boolean): void;
}

type Subscriber<T> = (value: T) => void;

/**
 * A minimal readable store: `start` runs when the first subscriber arrives and
 * the function it returns runs when the last subscriber leaves.
 */
function readable<T>(
    read: () => T,
    start: (notify: () => void) => () => void
): Readable<T> & { notify(): void } {
    const subscribers = new Set<Subscriber<T>>();
    let stop: (() => void) | undefined;
    let current: T;

    function notify() {
        if (subscribers.size === 0) return;
        current = read();
        [...subscribers].forEach(run => run(current));
    }

    function subscribe(run: Subscriber<T>) {
        const subscriber: Subscriber<T> = value => run(value);
        subscribers.add(subscriber);
        if (subscribers.size === 1) {
            stop = start(notify);
            current = read();
        }
        subscriber(current);
        return function unsubscribe() {
            if (!subscribers.delete(subscriber)) return;
            if (subscribers.size === 0) {
                stop?.();
                stop = undefined;
            }
        };
    }

    return { subscribe, notify };
}

function listen(target: EventTarget, events: string[], listener: () => void) {
    events.forEach(event => target.addEventListener(event, listener));
    return function stopListening() {
        events.forEach(event => target.removeEventListener(event, listener));
    };
}

/**
 * A store whose value is the Record itself. Subscribers run after every
 * `change` event, so `$record.getField('name')` stays current in markup.
 */
export function recordStore<T>(record: Record<T>): Readable<Record<T>> {
    return readable(
        () => record,
        notify => listen(record, ['change'], notify)
    );
}

const recordsetEvents = [
    RecordsetEvent.Updated,
    RecordsetEvent.PageChanged,
    RecordsetEvent.CountsChanged,
    RecordsetEvent.Loading,
    RecordsetEvent.RecordAdded,
    RecordsetEvent.Error,
];

/**
 * A store whose value is the Recordset itself. Subscribers run when the
 * recordset reports new data, pages, counts, loading state, or errors.
 */
export function recordsetStore<T>(recordset: Recordset<T>): Readable<Recordset<T>> {
    return readable(
        () => recordset,
        notify => listen(recordset, recordsetEvents, notify)
    );
}

/**
 * A store of one field's model state. While subscribed it follows Record
 * changes and loads options through `Record.optionsForField()`, deferring the
 * lookup while the field is disabled and ignoring results from stale lookups.
 */
export function fieldStore(
    record: Record<any>,
    field: string,
    { showValidationErrors = false }: FieldStateOptions = {}
): FieldStore {
    let show = showValidationErrors;
    let options: FieldOption[] = [];
    let optionsLoading = false;
    let optionsError: unknown;
    let optionsRequest: Promise<unknown> | undefined;
    let optionsVersion = 0;

    function read(): FieldStoreValue {
        return {
            ...readFieldState(record, field, { showValidationErrors: show }),
            options,
            optionsLoading,
            optionsError,
        };
    }

    const store = readable(read, function start(notify) {
        function loadOptions() {
            const fieldType = record.fieldTypeForField(field);
            if (!fieldType.hasOptions()) return;
            if (fieldType.isDisabled(record.getField(field), record, 'model')) {
                // Invalidate pending work without fetching or erasing known choices.
                optionsVersion++;
                optionsRequest = undefined;
                optionsLoading = false;
                return;
            }
            const request = record.optionsForField(field);
            if (request === optionsRequest) return;
            optionsRequest = request;
            const version = ++optionsVersion;
            optionsLoading = true;
            optionsError = undefined;
            Promise.resolve(request).then(
                function loaded(result) {
                    // Only the latest dependency values may populate this field.
                    if (version !== optionsVersion) return;
                    options = Array.isArray(result) ? (result as FieldOption[]) : [];
                    optionsLoading = false;
                    notify();
                },
                function failed(error) {
                    if (version !== optionsVersion) return;
                    optionsError = error;
                    optionsLoading = false;
                    notify();
                }
            );
        }

        function refresh() {
            loadOptions();
            notify();
        }

        loadOptions();
        const stopListening = listen(record, ['change'], refresh);
        return function stop() {
            stopListening();
            optionsVersion++;
            optionsRequest = undefined;
            optionsLoading = false;
        };
    });

    return {
        record,
        field,
        subscribe: store.subscribe,
        edit(viewValue: unknown) {
            record.parseAndSetField(field, viewValue);
            record.fieldTypeForField(field).onValueChange(record);
        },
        setShowValidationErrors(nextShow: boolean) {
            if (show === Boolean(nextShow)) return;
            show = Boolean(nextShow);
            store.notify();
        },
    };
}
