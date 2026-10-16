// Angular renders these tests with its JIT compiler, without a CLI build.
import '@angular/compiler';
import { Input, Type, provideZonelessChangeDetection } from '@angular/core';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { FdlFieldComponent } from '../../adapters/angular';

interface SignalInputDeclaration {
    name: string;
    required?: boolean;
}

/**
 * The Angular CLI's AOT compiler recognizes `input()` statically, and its JIT
 * build applies a transform that records the same metadata. This Jest setup
 * has neither, so it records that metadata the way the CLI's JIT transform does.
 */
function declareSignalInputsForJit(type: Type<unknown>, inputs: SignalInputDeclaration[]) {
    inputs.forEach(({ name, required = false }) => {
        // Signal inputs apply their own transforms, so none is recorded here.
        const metadata = { alias: name, required, transform: undefined, isSignal: true };
        (Input as (options: object) => PropertyDecorator)(metadata)(type.prototype, name);
    });
}

let initialized = false;

export function setUpAngularTestEnvironment() {
    if (!initialized) {
        getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
        declareSignalInputsForJit(FdlFieldComponent, [
            { name: 'record', required: true },
            { name: 'field', required: true },
            { name: 'showValidationErrors' },
            { name: 'selectPrompt' },
            { name: 'describedBy' },
        ]);
        initialized = true;
    }
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    });
}

/** Let pending microtasks (option lookups) settle. */
export async function flushMicrotasks() {
    await new Promise(resolve => setTimeout(resolve, 0));
}
