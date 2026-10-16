/**
 * Angular adapter for FDL. Requires `@angular/core` 21 (an optional peer
 * dependency); the core `@pmcelhaney/fdl` entry point does not import Angular.
 */
export { FdlFieldComponent } from './fdl-field.component';
export {
    fieldState,
    fieldValue,
    recordSignal,
    recordsetSignal,
    RECORDSET_SIGNAL_EVENTS,
} from './record-signals';
export type { FdlFieldStateSignalOptions, FdlSignalOptions, FdlSource } from './record-signals';
export {
    FieldOptionsLoader,
    acceptedInput,
    controlKindFor,
    displayText,
    filterTextControl,
    isOptionSelected,
    isTextControl,
    mergeDescribedBy,
    readControlValue,
    readFieldState,
    rejectsInsertion,
    showsSelectPrompt,
} from './field-state';
export type {
    FdlControlKind,
    FdlFieldState,
    FdlFieldStateOptions,
    FdlOption,
    FdlOptionsState,
} from './field-state';
