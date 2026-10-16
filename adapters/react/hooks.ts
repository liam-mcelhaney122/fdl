import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Record from '../../record.js';
import Recordset from '../../recordset.js';
import { RecordsetEvent } from '../../recordset.events';
import { FieldOptionsTracker, getFieldState, initialOptionsState } from './field-state';
import type { FieldState, OptionsState } from './field-state';

const recordEvents = ['change'];

const recordsetEvents = [
    RecordsetEvent.Loading,
    RecordsetEvent.Error,
    RecordsetEvent.Updated,
    RecordsetEvent.Changed,
    RecordsetEvent.CountsChanged,
    RecordsetEvent.PageChanged,
    RecordsetEvent.RecordAdded,
];

interface VersionEntry {
    version: number;
}

const versions = new WeakMap<EventTarget, VersionEntry>();

/**
 * A change counter for a Record or Recordset. One passive listener per target
 * advances it for the target's lifetime, so a snapshot taken during render is
 * comparable with one taken after React subscribes.
 */
function versionEntry(target: EventTarget, events: string[]): VersionEntry {
    let entry = versions.get(target);
    if (!entry) {
        const created: VersionEntry = { version: 0 };
        function advance() {
            created.version++;
        }
        events.forEach(event => target.addEventListener(event, advance));
        versions.set(target, created);
        entry = created;
    }
    return entry;
}

function useEventVersion(target: EventTarget, events: string[]): number {
    const subscribe = useCallback(
        (onStoreChange: () => void) => {
            versionEntry(target, events);
            events.forEach(event => target.addEventListener(event, onStoreChange));
            return function unsubscribe() {
                events.forEach(event => target.removeEventListener(event, onStoreChange));
            };
        },
        [target, events]
    );
    const getSnapshot = useCallback(() => versionEntry(target, events).version, [target, events]);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Subscribe to a Record's `change` events and return a number that increases
 * with every change. Use it as a memo dependency when deriving values.
 */
export function useRecordVersion(record: Record<any>): number {
    return useEventVersion(record, recordEvents);
}

/** Re-render the calling component whenever `record` announces a change. */
export function useRecord<T>(record: Record<T>): Record<T> {
    useRecordVersion(record);
    return record;
}

/** The current model state of one field, recomputed when the Record changes. */
export function useFieldState(record: Record<any>, field: string): FieldState {
    const version = useRecordVersion(record);
    return useMemo(() => getFieldState(record, field), [record, field, version]);
}

/**
 * Load a field's options with the adapter contract's loading and stale-result
 * rules. Lookups are deferred while the field is disabled.
 */
export function useFieldOptions(record: Record<any>, field: string): OptionsState {
    const version = useRecordVersion(record);
    const [state, setState] = useState<OptionsState>(() => initialOptionsState(record, field));
    const tracker = useRef<FieldOptionsTracker | undefined>(undefined);

    useEffect(() => {
        const current = new FieldOptionsTracker(record, field, setState);
        tracker.current = current;
        setState(current.state);
        current.sync();
        return function disposeTracker() {
            current.dispose();
        };
    }, [record, field]);

    useEffect(() => {
        tracker.current?.sync();
    }, [version]);

    return state;
}

export interface RecordsetSnapshot<T = unknown> {
    recordset: Recordset<T>;
    /** The records on the current page (`Recordset.currentPage`). */
    records: Record<T>[];
    isLoading: boolean;
    totalCount: number;
    filteredCount: number;
    pageNumber: number;
    pageSize: number;
}

/**
 * Subscribe to a Recordset's collection events (`updated`, `page-changed`,
 * `counts-changed`, `loading`, and related events) and return its current view.
 * Field edits inside a row are Record changes; render rows with `useRecord`
 * or `FdlField` to observe them.
 */
export function useRecordset<T>(recordset: Recordset<T>): RecordsetSnapshot<T> {
    const version = useEventVersion(recordset, recordsetEvents);
    return useMemo(
        () => ({
            recordset,
            records: [...recordset.currentPage],
            isLoading: Boolean(recordset.isLoading),
            totalCount: recordset.totalCount,
            filteredCount: recordset.filteredCount,
            pageNumber: recordset.pageNumber,
            pageSize: recordset.pageSize,
        }),
        [recordset, version]
    );
}
