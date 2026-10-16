import { acceptedInput, FieldOption } from './field-state';
import type { FieldStore, FieldStoreValue } from './stores';

export type NativeFieldControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export interface FieldControlParameters {
    /** The field store created by `fieldStore(record, field)`. */
    store: FieldStore;
    /** Text for a single select's empty choice. The prompt is not model option data. */
    selectPrompt?: string;
}

export interface FieldControlAction {
    update(parameters: FieldControlParameters): void;
    destroy(): void;
}

const uncheckedInputTypes = ['checkbox', 'radio', 'file'];

function isTextControl(node: NativeFieldControl): node is HTMLInputElement | HTMLTextAreaElement {
    if (node instanceof HTMLTextAreaElement) return true;
    return node instanceof HTMLInputElement && !uncheckedInputTypes.includes(node.type);
}

function isCheckable(node: NativeFieldControl): node is HTMLInputElement {
    return node instanceof HTMLInputElement && ['checkbox', 'radio'].includes(node.type);
}

/** Read the view value a native control currently holds. */
export function controlValue(node: NativeFieldControl): unknown {
    if (node instanceof HTMLSelectElement && node.multiple) {
        return [...node.selectedOptions].map(option => option.value);
    }
    if (isCheckable(node)) return node.checked;
    return node.value;
}

/**
 * Svelte action that keeps a native `input`, `select`, or `textarea` in sync
 * with a field store and sends edits back through `Record.parseAndSetField()`.
 *
 * Value synchronization is imperative because a text control must keep the
 * user's in-progress text and caret while its own input events update the
 * Record. Attributes such as `required` and `disabled` belong in markup.
 */
export function fieldControl(
    node: NativeFieldControl,
    parameters: FieldControlParameters
): FieldControlAction {
    let { store, selectPrompt } = parameters;
    let state: FieldStoreValue | undefined;
    let renderedOptions: FieldOption[] | undefined;
    let renderedPrompt: string | undefined;
    let composing = false;
    let parsingNativeInput = false;
    let unsubscribe = store.subscribe(sync);

    function syncSelect(select: HTMLSelectElement, current: FieldStoreValue) {
        select.multiple = current.multiple;
        const prompt = current.multiple ? undefined : selectPrompt;
        if (current.options !== renderedOptions || prompt !== renderedPrompt) {
            renderedOptions = current.options;
            renderedPrompt = prompt;
            const suppliedEmpty = current.options.some(option => String(option.value) === '');
            const choices = current.options.map(option => {
                const choice = document.createElement('option');
                choice.value = String(option.value);
                choice.textContent = String(option.text);
                return choice;
            });
            if (prompt !== undefined && !suppliedEmpty) {
                const empty = document.createElement('option');
                empty.value = '';
                empty.textContent = prompt;
                empty.setAttribute('data-select-prompt', '');
                choices.unshift(empty);
            }
            select.replaceChildren(...choices);
        }
        if (select.multiple) {
            const value = current.value;
            const selected = (Array.isArray(value) ? value : [value]).map(String);
            [...select.options].forEach(option => {
                option.selected = selected.includes(option.value);
            });
        } else {
            select.value = String(current.value ?? '');
        }
    }

    function sync(current: FieldStoreValue) {
        state = current;
        if (node instanceof HTMLSelectElement) {
            syncSelect(node, current);
        } else if (isCheckable(node)) {
            node.checked = Boolean(current.value);
        } else if (node instanceof HTMLInputElement && node.type === 'file') {
            // Browsers only allow clearing a file picker programmatically.
            if (!current.value) node.value = '';
        } else if (!parsingNativeInput && node.value !== current.formattedValue) {
            // An input echo must not replace unfinished text or move the caret.
            node.value = current.formattedValue;
        }
    }

    function filterNativeInput() {
        if (!state || !isTextControl(node)) return;
        const value = node.value;
        const accepted = acceptedInput(state.fieldType, value);
        if (accepted === value) return;
        const { selectionStart, selectionEnd, selectionDirection } = node;
        node.value = accepted;
        if (selectionStart !== null && selectionEnd !== null) {
            node.setSelectionRange(
                acceptedInput(state.fieldType, value.slice(0, selectionStart)).length,
                acceptedInput(state.fieldType, value.slice(0, selectionEnd)).length,
                selectionDirection ?? undefined
            );
        }
    }

    function handleEdit(event: Event) {
        if (composing || (event as InputEvent).isComposing) return;
        filterNativeInput();
        parsingNativeInput = event.type === 'input' && isTextControl(node);
        try {
            store.edit(controlValue(node));
        } finally {
            parsingNativeInput = false;
        }
    }

    function handleBeforeInput(event: Event) {
        if (!state || !isTextControl(node)) return;
        const input = event as InputEvent;
        if (
            !composing &&
            !input.isComposing &&
            input.data &&
            input.inputType?.startsWith('insert') &&
            acceptedInput(state.fieldType, input.data) === ''
        ) {
            event.preventDefault();
        }
    }

    function handleBlur() {
        // Leaving the field reapplies the formatted ("input-focus") representation.
        if (state && isTextControl(node)) node.value = state.formattedValue;
    }

    function handleCompositionStart() {
        composing = true;
    }

    function handleCompositionEnd() {
        composing = false;
        node.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const listeners: [string, (event: Event) => void][] = [
        ['input', handleEdit],
        ['change', handleEdit],
        ['blur', handleBlur],
        ['beforeinput', handleBeforeInput],
        ['compositionstart', handleCompositionStart],
        ['compositionend', handleCompositionEnd],
    ];
    listeners.forEach(([event, listener]) => node.addEventListener(event, listener));

    return {
        update(next: FieldControlParameters) {
            const promptChanged = next.selectPrompt !== selectPrompt;
            selectPrompt = next.selectPrompt;
            if (next.store !== store) {
                unsubscribe();
                store = next.store;
                renderedOptions = undefined;
                unsubscribe = store.subscribe(sync);
            } else if (promptChanged && state) {
                sync(state);
            }
        },
        destroy() {
            unsubscribe();
            listeners.forEach(([event, listener]) => node.removeEventListener(event, listener));
        },
    };
}
