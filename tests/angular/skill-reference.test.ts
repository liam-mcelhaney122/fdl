import { Component, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { field } from '../../primitives.js';
import Record from '../../record.js';
import Recordset from '../../recordset.js';
import { FdlFieldComponent, recordsetSignal } from '../../adapters/angular';
import { flushMicrotasks, setUpAngularTestEnvironment } from './angular-test-environment';

setUpAngularTestEnvironment();

// The adapter's type check deliberately omits Node types from adapter sources.
declare const require: (id: string) => any;
declare const __dirname: string;
const { readFileSync } = require('fs') as {
    readFileSync(path: string, encoding: 'utf8'): string;
};
const { join } = require('path') as { join(...parts: string[]): string };

const root = join(__dirname, '..', '..');
const referencePath = join(root, '.agents', 'skills', 'fdl', 'references', 'angular.md');

function reference() {
    return readFileSync(referencePath, 'utf8');
}

/** Every name exported from the adapter entry point, including types. */
function exportedNames() {
    const source = readFileSync(join(root, 'adapters', 'angular', 'index.ts'), 'utf8');
    const blocks = [...source.matchAll(/export (?:type )?\{([^}]*)\}/g)].map(match => match[1]);
    return blocks.flatMap(block =>
        block
            .split(',')
            .map((name: string) => name.trim())
            .filter(Boolean)
    );
}

// These mirror the reference's examples. The reference test below checks that
// their key lines still appear there verbatim.
@Component({
    selector: 'app-contact',
    imports: [FdlFieldComponent],
    template: `
        <form (submit)="submit($event)">
            <fdl-field [record]="contact" field="name" [showValidationErrors]="submitted()" />
            <fdl-field
                [record]="contact"
                field="method"
                selectPrompt="Choose a method"
                [showValidationErrors]="submitted()"
            />
            <button>Save</button>
        </form>
    `,
})
class ContactComponent {
    readonly contact = new Record(
        {
            name: field.label('Full name').required(),
            method: field
                .label('Preferred contact method')
                .required()
                .options([
                    { text: 'Email', value: 'email' },
                    { text: 'Phone', value: 'phone' },
                ]),
        },
        { name: '', method: '' }
    );
    readonly submitted = signal(false);
    saved: unknown;

    submit(event: Event) {
        event.preventDefault();
        this.submitted.set(true);
        if (this.contact.isValid()) this.saved = { ...this.contact.values };
    }
}

const orderFields = {
    item: field.label('Item'),
    amount: field
        .label('Amount')
        .columnClass('numeric')
        .parser(value => (value === '' ? 0 : Number(value))),
};

@Component({
    selector: 'app-orders',
    imports: [FdlFieldComponent],
    template: `
        <table>
            <thead>
                <tr>
                    <th scope="col">Item</th>
                    <th scope="col" [class]="amountClasses">Amount</th>
                </tr>
            </thead>
            <tbody>
                @for (row of rows().currentPage; track row) {
                    <tr>
                        <td><fdl-field [record]="row" field="item" /></td>
                        <td [class]="amountClasses"><fdl-field [record]="row" field="amount" /></td>
                    </tr>
                }
            </tbody>
            <tfoot>
                <tr>
                    <th scope="row">Total</th>
                    <td [class]="amountClasses">{{ total() }}</td>
                </tr>
            </tfoot>
        </table>
    `,
})
class OrdersComponent {
    readonly recordset = new Recordset(orderFields, [
        { item: 'Paper', amount: 12 },
        { item: 'Ink', amount: 30 },
    ]);
    readonly rows = recordsetSignal(this.recordset);
    readonly amountClasses = orderFields.amount.valueOf().columnClasses().join(' ');
    readonly total = computed(() =>
        this.rows().allRecords.reduce(
            (sum: number, row: Record<any>) => sum + Number(row.getField('amount')),
            0
        )
    );

    constructor() {
        void this.recordset.requestHardUpdate();
    }
}

async function settle(fixture: ComponentFixture<unknown>) {
    await fixture.whenStable();
    await flushMicrotasks();
    await fixture.whenStable();
}

function element(fixture: ComponentFixture<unknown>) {
    return fixture.nativeElement as HTMLElement;
}

describe('Angular skill reference', () => {
    it('exists and mentions every exported adapter API', () => {
        const text = reference();
        const names = exportedNames();
        expect(names).toEqual(expect.arrayContaining(['FdlFieldComponent', 'recordsetSignal']));
        names.forEach(name => expect(text).toContain(name));
        expect(text).toContain('@pmcelhaney/fdl/adapters/angular');
        expect(text).toContain('"maxNodeModuleJsDepth": 2');
        expect(text).toContain('ControlValueAccessor');
    });

    it('contains the examples exercised below', () => {
        const text = reference();
        [
            '<fdl-field [record]="contact" field="name" [showValidationErrors]="submitted()" />',
            'selectPrompt="Choose a method"',
            'if (this.contact.isValid()) this.saved = { ...this.contact.values };',
            '@for (row of rows().currentPage; track row) {',
            '<td [class]="amountClasses"><fdl-field [record]="row" field="amount" /></td>',
            'readonly rows = recordsetSignal(this.recordset);',
            "readonly amountClasses = orderFields.amount.valueOf().columnClasses().join(' ');",
            ".columnClass('numeric')",
            'void this.recordset.requestHardUpdate();',
        ].forEach(line => expect(text).toContain(line));
    });

    it('shows validation errors only after submit and saves valid values', async () => {
        const fixture = TestBed.createComponent(ContactComponent);
        await settle(fixture);
        const root = element(fixture);
        const name = root.querySelector('input') as HTMLInputElement;
        const method = root.querySelector('select') as HTMLSelectElement;
        expect(root.querySelector('.validation-error')).toBeNull();
        expect(method.options[0].textContent).toBe('Choose a method');

        root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
        await settle(fixture);
        expect(fixture.componentInstance.saved).toBeUndefined();
        expect(root.querySelectorAll('.validation-error')).toHaveLength(2);
        expect(name.getAttribute('aria-invalid')).toBe('true');
        expect(name.getAttribute('aria-describedby')).toBe(
            root.querySelector('.validation-error')!.id
        );

        name.value = 'Ada';
        name.dispatchEvent(new Event('input'));
        method.value = 'email';
        method.dispatchEvent(new Event('change'));
        await settle(fixture);
        expect(root.querySelector('.validation-error')).toBeNull();
        root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
        expect(fixture.componentInstance.saved).toEqual({ name: 'Ada', method: 'email' });
        fixture.destroy();
    });

    it('renders a Recordset table whose total follows row edits', async () => {
        const fixture = TestBed.createComponent(OrdersComponent);
        await fixture.componentInstance.recordset.updating;
        await settle(fixture);
        const root = element(fixture);
        const rows = root.querySelectorAll('tbody tr');
        expect(rows).toHaveLength(2);
        const total = root.querySelector('tfoot td') as HTMLElement;
        expect(total.textContent?.trim()).toBe('42');
        expect(total.className).toBe('numeric');
        expect(root.querySelector('thead th.numeric')).not.toBeNull();

        const amount = rows[1].querySelector('td.numeric input') as HTMLInputElement;
        const label = rows[1].querySelector('td.numeric label') as HTMLLabelElement;
        expect(label.htmlFor).toBe(amount.id);
        amount.value = '8';
        amount.dispatchEvent(new Event('input'));
        await settle(fixture);
        expect(total.textContent?.trim()).toBe('20');
        fixture.destroy();
    });
});
