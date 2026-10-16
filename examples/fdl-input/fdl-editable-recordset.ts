import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { keyed } from 'lit/directives/keyed.js';
import { createShipments, applyShipmentView, shipmentCharge, shipmentTotals } from './editable-recordset-model';
import type Record from '../../record';
import './fdl-field';

export class FdlEditableRecordset extends LitElement {
    readonly shipments = createShipments();
    private selected?: Record<any>;
    private status = '';
    private descending = false;
    private ready = false;
    private refresh = () => this.requestUpdate();
    connectedCallback() {
        super.connectedCallback();
        this.shipments.addEventListener('updated', this.refresh);
        this.shipments.addEventListener('page-changed', this.refresh);
        if (!this.ready) void this.load();
    }
    disconnectedCallback() {
        this.shipments.removeEventListener('updated', this.refresh);
        this.shipments.removeEventListener('page-changed', this.refresh);
        super.disconnectedCallback();
    }
    private async load() {
        await this.shipments.requestHardUpdate();
        this.selected = this.shipments.allRecords[0];
        this.ready = true;
        this.requestUpdate();
    }
    render() {
        if (!this.ready) return html`<p role="status">Loading shipments…</p>`;
        const all = shipmentTotals(this.shipments.allRecords);
        const visible = shipmentTotals(this.shipments.currentPage);
        return html`<p>Edit cells or select a shipment’s detail editor. Both editors use the same Record object. Set Status to <code>hold</code> to require a reason.</p>
          <div class="view-controls"><label>Show status <select @change=${(e: Event) => {this.status = (e.target as HTMLSelectElement).value;}}><option value="">All</option><option>ready</option><option>hold</option></select></label>
          <label><input type="checkbox" @change=${(e: Event) => {this.descending = (e.target as HTMLInputElement).checked;}}> Highest quantity first</label>
          <button @click=${() => applyShipmentView(this.shipments, this.status, this.descending)}>Apply view</button></div>
          <p>Edits update values, errors, and totals immediately. Rows keep their current position and membership until Apply view; an edited row may then move or leave the filtered view. Its Record and unsaved data remain in All records and in the selected detail editor.</p>
          <div class="table-scroll"><table><caption>Editable shipments — use Tab to move between controls</caption><thead><tr><th>Shipment</th><th>Quantity</th><th>Unit price</th><th>Status</th><th>Hold reason</th><th>Charge</th><th>Validation</th></tr></thead><tbody>
          ${repeat(this.shipments.currentPage, row => row, row => html`<tr><th><button @click=${() => {this.selected = row; this.requestUpdate();}} aria-pressed=${this.selected === row}>${row.getField('id')}</button></th>
            ${(['quantity', 'unitPrice', 'status', 'reason'] as const).map(name => html`<td><fdl-field .record=${row} field=${name} .showValidationErrors=${true}></fdl-field></td>`)}
            <td class="numeric">${shipmentCharge(row).toFixed(2)}</td><td>${row.isValid() ? 'Valid' : row.readableRecordErrors().join('. ')}</td></tr>`)}
          </tbody></table></div>
          <p role="status">All records: ${all.quantity} units / $${all.charge.toFixed(2)}. Visible records: ${visible.quantity} units / $${visible.charge.toFixed(2)}.</p>
          <h2>Selected shipment: ${this.selected?.getField('id')}</h2>
          ${this.selected ? keyed(this.selected, html`<fdl-field .record=${this.selected} field="quantity" .showValidationErrors=${true}></fdl-field><fdl-field .record=${this.selected} field="reason" .showValidationErrors=${true}></fdl-field>`) : ''}
          <details><summary>All records, including filtered-out edits</summary><pre>${JSON.stringify(this.shipments.allRecords.map(row => row.values), null, 2)}</pre></details>`;
    }
    static styles = css`:host{display:block} .table-scroll{overflow:auto} table{border-collapse:collapse;width:100%}caption{text-align:left;padding:12px 0}th,td{padding:12px;border:1px solid #cbd5e1;vertical-align:top;text-align:left}.numeric{text-align:right;font-variant-numeric:tabular-nums}fdl-field{min-width:140px;--field-control-width:100%;--field-label-width:auto} .view-controls{display:flex;flex-wrap:wrap;gap:16px;align-items:center}button,select{font:inherit;padding:8px}button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid #2563eb;outline-offset:3px}p{line-height:1.65}pre{white-space:pre-wrap}`;
}
customElements.define('fdl-editable-recordset', FdlEditableRecordset);
