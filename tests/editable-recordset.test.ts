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
