import '../examples/fdl-input/fdl-editable-recordset';
import type { FdlEditableRecordset } from '../examples/fdl-input/fdl-editable-recordset';
import type { FdlField } from '../examples/fdl-input/fdl-field';
import {createShipments, applyShipmentView, shipmentTotals} from '../examples/fdl-input/editable-recordset-model';

it('preserves edited row identity across sorting and filtering, with explicitly scoped totals', async () => {
    const shipments = createShipments();
    await shipments.requestHardUpdate();
    const selected = shipments.allRecords[0];
    selected.setField('quantity', 8);
    expect(shipmentTotals(shipments.allRecords)).toEqual({quantity: 14, charge: 195});
    await applyShipmentView(shipments, '', true);
    expect(shipments.currentPage[0]).toBe(selected);
    selected.setField('status', 'hold');
    expect(selected.isValid()).toBe(false);
    expect(selected.readableRecordErrors().join(' ')).toContain('Hold reason');
    await applyShipmentView(shipments, 'ready', false);
    expect(shipments.currentPage).not.toContain(selected);
    expect(shipments.allRecords[0]).toBe(selected);
    expect(selected.getField('quantity')).toBe(8);
    expect(shipmentTotals(shipments.currentPage)).toEqual({quantity: 1, charge: 15});
    selected.setField('reason', 'Awaiting allocation');
    expect(selected.isValid()).toBe(true);
    await applyShipmentView(shipments, '', false);
    expect(shipments.currentPage).toContain(selected);
    expect(shipments.allRecords[0]).toBe(selected);
});


it('keeps selected detail values, required state, and edits attached to the selected shipment', async () => {
    const demo = document.createElement('fdl-editable-recordset') as FdlEditableRecordset;
    document.body.append(demo);
    const settle = async () => {
        await demo.updateComplete;
        await new Promise(resolve => setTimeout(resolve, 0));
        await demo.updateComplete;
        await Promise.all(Array.from(demo.shadowRoot!.querySelectorAll<FdlField>('fdl-field')).map(field => field.updateComplete));
    };
    const detail = (name: string) => Array.from(demo.shadowRoot!.querySelectorAll<FdlField>(`fdl-field[field="${name}"]`)).find(field => field.parentNode === demo.shadowRoot)!.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    const select = async (id: string) => {
        Array.from(demo.shadowRoot!.querySelectorAll<HTMLButtonElement>('tbody button')).find(button => button.textContent === id)!.click();
        await settle();
    };
    const edit = async (input: HTMLInputElement, value: string) => {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        await settle();
    };
    try {
        await settle();
        expect(detail('quantity').value).toBe('2');
        await select('S-102');
        expect(detail('quantity').value).toBe('5');
        expect(detail('reason').value).toBe('Awaiting allocation');
        expect(detail('reason').required).toBe(true);
        await edit(detail('quantity'), '7');
        expect(demo.shipments.allRecords[1].getField('quantity')).toBe(7);
        expect(demo.shipments.allRecords[0].getField('quantity')).toBe(2);
        const rowQuantity = demo.shadowRoot!.querySelectorAll<FdlField>('tbody fdl-field[field="quantity"]')[1].shadowRoot!.querySelector<HTMLInputElement>('input')!;
        expect(rowQuantity.value).toBe('7');
        await edit(rowQuantity, '9');
        expect(detail('quantity').value).toBe('9');
        await select('S-103');
        expect(detail('quantity').value).toBe('1');
        expect(detail('reason').value).toBe('');
        expect(detail('reason').required).toBe(false);
        demo.shipments.allRecords[1].setField('reason', 'Different shipment');
        await settle();
        expect(detail('reason').value).toBe('');
        await select('S-102');
        expect(detail('quantity').value).toBe('9');
        expect(detail('reason').value).toBe('Different shipment');
        expect(detail('reason').required).toBe(true);
    } finally {
        demo.remove();
    }
});
