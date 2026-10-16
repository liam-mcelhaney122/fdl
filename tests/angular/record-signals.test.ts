import {
    ApplicationRef,
    EnvironmentInjector,
    computed,
    createEnvironmentInjector,
    signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { field } from '../../primitives.js';
import Record from '../../record.js';
import Recordset from '../../recordset.js';
import {
    fieldState,
    fieldValue,
    recordSignal,
    recordsetSignal,
} from '../../adapters/angular/record-signals';
import { setUpAngularTestEnvironment } from './angular-test-environment';

setUpAngularTestEnvironment();

function childInjector() {
    return createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
}

function makeRecord() {
    return new Record(
        { name: field.label('Name').required(), nickname: field },
        { name: '', nickname: '' }
    );
}

describe('recordSignal', () => {
    it('notifies dependents on every Record change and unsubscribes on destroy', () => {
        const record = makeRecord();
        const injector = childInjector();
        const removeListener = jest.spyOn(record, 'removeEventListener');
        const model = recordSignal(record, { injector });
        const name = computed(() => model().getField('name'));

        expect(model()).toBe(record);
        expect(name()).toBe('');
        record.setField('name', 'Ada');
        expect(name()).toBe('Ada');

        injector.destroy();
        expect(removeListener).toHaveBeenCalledWith('change', expect.any(Function));
        record.setField('name', 'Grace');
        expect(name()).toBe('Ada');
    });

    it('requires an injection context or an explicit injector', () => {
        expect(() => recordSignal(makeRecord())).toThrow();
        const model = TestBed.runInInjectionContext(() => recordSignal(makeRecord()));
        expect(model().getField('name')).toBe('');
    });

    it('follows a signal source and moves its listener to the new Record', async () => {
        const first = makeRecord();
        const second = makeRecord();
        const source = signal(first);
        const injector = childInjector();
        const model = recordSignal(source, { injector });
        const name = computed(() => model().getField('name'));
        const appRef = TestBed.inject(ApplicationRef);
        appRef.tick();

        first.setField('name', 'Ada');
        expect(name()).toBe('Ada');

        source.set(second);
        appRef.tick();
        expect(name()).toBe('');
        second.setField('name', 'Grace');
        expect(name()).toBe('Grace');

        const removeListener = jest.spyOn(second, 'removeEventListener');
        injector.destroy();
        expect(removeListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
});

describe('fieldValue and fieldState', () => {
    it('derive one field from the Record with an application-owned error policy', () => {
        const record = makeRecord();
        const injector = childInjector();
        const show = signal(false);
        const name = fieldValue<string>(record, 'name', { injector });
        const state = fieldState(record, 'name', { injector, showValidationErrors: show });

        expect(state().errors).toEqual([]);
        show.set(true);
        expect(state().errors).toEqual(['Name is required']);
        record.setField('name', 'Ada');
        expect(name()).toBe('Ada');
        expect(state()).toMatchObject({ value: 'Ada', errors: [] });
        injector.destroy();
    });
});

describe('recordsetSignal', () => {
    it('notifies after recordset updates and stops after destroy', async () => {
        const recordset = new Recordset({ name: field }, [{ name: 'Ada' }, { name: 'Grace' }]);
        const injector = childInjector();
        const rows = recordsetSignal(recordset, { injector });
        const names = computed(() => rows().currentPage.map(r => r.getField('name')));
        expect(names()).toEqual([]);

        await recordset.requestHardUpdate();
        expect(names()).toEqual(['Ada', 'Grace']);

        recordset.pageSize = 1;
        await recordset.updating;
        expect(names()).toEqual(['Ada']);
        recordset.pageNumber = 2;
        await recordset.updating;
        expect(names()).toEqual(['Grace']);

        const removeListener = jest.spyOn(recordset, 'removeEventListener');
        injector.destroy();
        expect(removeListener).toHaveBeenCalledWith('updated', expect.any(Function));
        expect(removeListener).toHaveBeenCalledWith('page-changed', expect.any(Function));
    });
});
