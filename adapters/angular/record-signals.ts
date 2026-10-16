import {
    DestroyRef,
    Injector,
    Signal,
    assertInInjectionContext,
    computed,
    effect,
    inject,
    isSignal,
    signal,
    untracked,
} from '@angular/core';
import type FdlRecord from '../../record.js';
import type Recordset from '../../recordset.js';
import { FdlFieldState, readFieldState } from './field-state';

/** A plain value or a signal of that value, such as a component input. */
export type FdlSource<T> = T | Signal<T>;

export interface FdlSignalOptions {
    /**
     * Injector whose `DestroyRef` ends the subscription. Required when the
     * helper is called outside an injection context.
     */
    injector?: Injector;
}

export interface FdlFieldStateSignalOptions extends FdlSignalOptions {
    /** Application policy for exposing synchronous model errors. Defaults to `false`. */
    showValidationErrors?: FdlSource<boolean>;
}

/** Events after which a `Recordset`'s visible state may differ. */
export const RECORDSET_SIGNAL_EVENTS = [
    'updated',
    'page-changed',
    'counts-changed',
    'loading',
    'record-added',
] as const;

function read<T>(source: FdlSource<T>): T {
    return isSignal(source) ? source() : source;
}

function resolveInjector(caller: Function, options?: FdlSignalOptions): Injector {
    if (options?.injector) return options.injector;
    assertInInjectionContext(caller);
    return inject(Injector);
}

/**
 * Returns a signal that increments whenever `target` dispatches one of `events`.
 * Listeners are removed when the injector is destroyed or the source signal
 * switches to another target.
 */
function eventVersion(
    source: FdlSource<EventTarget | null | undefined>,
    events: readonly string[],
    injector: Injector
): Signal<number> {
    const version = signal(0);

    function bump() {
        version.update(value => value + 1);
    }

    function subscribe(target: EventTarget) {
        events.forEach(event => target.addEventListener(event, bump));
        return function unsubscribe() {
            events.forEach(event => target.removeEventListener(event, bump));
        };
    }

    if (isSignal(source)) {
        effect(
            onCleanup => {
                const target = source();
                if (!target) return;
                onCleanup(subscribe(target));
                // Observe any change made before this subscription was attached.
                untracked(bump);
            },
            { injector }
        );
    } else if (source) {
        injector.get(DestroyRef).onDestroy(subscribe(source));
    }
    return version.asReadonly();
}

/**
 * A signal of a `Record` that notifies on every `change` event.
 *
 * The value is the same mutable `Record`; read model state inside `computed()`
 * or a template, e.g. `computed(() => customer().getField('name'))`.
 */
export function recordSignal<R extends FdlRecord<any>>(
    record: FdlSource<R>,
    options?: FdlSignalOptions
): Signal<R> {
    const injector = resolveInjector(recordSignal, options);
    const version = eventVersion(record, ['change'], injector);
    return computed(
        () => {
            version();
            return read(record);
        },
        { equal: () => false }
    );
}

/** The stored value of one field, updated on every Record change. */
export function fieldValue<T = unknown>(
    record: FdlSource<FdlRecord<any>>,
    field: FdlSource<string>,
    options?: FdlSignalOptions
): Signal<T> {
    const model = recordSignal(record, { injector: resolveInjector(fieldValue, options) });
    return computed(() => model().getField(read(field)) as T);
}

/**
 * Renderer-independent state for one field (label, requiredness, visibility,
 * formatted text, visible errors, and so on), recomputed on Record changes.
 */
export function fieldState(
    record: FdlSource<FdlRecord<any>>,
    field: FdlSource<string>,
    options?: FdlFieldStateSignalOptions
): Signal<FdlFieldState> {
    const model = recordSignal(record, { injector: resolveInjector(fieldState, options) });
    return computed(() =>
        readFieldState(model(), read(field), {
            showValidationErrors: read(options?.showValidationErrors ?? false),
        })
    );
}

/**
 * A signal of a `Recordset` that notifies after it loads, pages, counts, or
 * adds records. Edits to an individual row's fields notify that row's
 * `Record`, not the `Recordset`; use `recordSignal()` or `<fdl-field>` per row.
 */
export function recordsetSignal<S extends Recordset<any>>(
    recordset: FdlSource<S>,
    options?: FdlSignalOptions
): Signal<S> {
    const injector = resolveInjector(recordsetSignal, options);
    const version = eventVersion(recordset, RECORDSET_SIGNAL_EVENTS, injector);
    return computed(
        () => {
            version();
            return read(recordset);
        },
        { equal: () => false }
    );
}
