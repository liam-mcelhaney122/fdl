import { LitElement, css, html, type PropertyValues } from 'lit';
import type Recordset from '../../recordset.js';
import type Record from '../../record.js';
import {
    FdlRecordInspector,
    storedValue,
    fieldStatus,
    statusIcon,
    statusLegend,
} from './fdl-record-inspector';

const events = [
    'page-changed',
    'counts-changed',
    'updated',
    'loading',
    'error',
];

/** Read-only inspection of the current view and stored values of a recordset. */
export class FdlRecordsetInspector extends LitElement {
    static properties = {
        recordset: { attribute: false },
        fields: { attribute: false },
        collapsed: { type: Boolean, reflect: true },
    };

    recordset?: Recordset<any>;
    fields?: readonly string[];
    collapsed = false;
    private observedRecordset?: Recordset<any>;
    private observedRecords = new Set<Record<any>>();
    private readonly handleChange = this.refresh.bind(this);

    connectedCallback() {
        super.connectedCallback();
        this.observe();
        this.requestUpdate();
    }

    disconnectedCallback() {
        this.release();
        super.disconnectedCallback();
    }

    protected willUpdate(_changed: PropertyValues<this>) {
        this.observe();
    }

    private release() {
        for (const event of events)
            this.observedRecordset?.removeEventListener(
                event,
                this.handleChange
            );
        for (const record of this.observedRecords)
            record.removeEventListener('change', this.handleChange);
        this.observedRecordset = undefined;
        this.observedRecords.clear();
    }

    private observe() {
        if (this.observedRecordset !== this.recordset) {
            this.release();
            this.observedRecordset = this.recordset;
            for (const event of events)
                this.observedRecordset?.addEventListener(
                    event,
                    this.handleChange
                );
        }
        const records = new Set(this.recordset?.allRecords ?? []);
        for (const record of this.observedRecords)
            if (!records.has(record))
                record.removeEventListener('change', this.handleChange);
        for (const record of records)
            if (!this.observedRecords.has(record))
                record.addEventListener('change', this.handleChange);
        this.observedRecords = records;
    }

    private refresh() {
        this.requestUpdate();
    }

    private toggle() {
        this.collapsed = !this.collapsed;
    }

    render() {
        const recordset = this.recordset;
        const fields = this.fields ?? recordset?.fieldNames ?? [];
        const action = this.collapsed
            ? 'Inspect recordset'
            : 'Collapse recordset inspector';
        return html`<section aria-label="Recordset inspector">
            <header>
                <h3 ?hidden=${this.collapsed}>Recordset state</h3>
                <button
                    type="button"
                    aria-label=${action}
                    title=${action}
                    aria-expanded=${!this.collapsed}
                    aria-controls="recordset-details"
                    @click=${this.toggle}
                >
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <circle cx="10" cy="10" r="6"></circle>
                        <path d="m15 15 6 6"></path>
                        ${this.collapsed ? '' : html`<path d="M7 10h6"></path>`}
                    </svg>
                </button>
            </header>
            <div id="recordset-details" ?hidden=${this.collapsed}>
                ${
                    recordset
                        ? html`
                              <div class="counts" role="status">
                                  <p
                                      >${recordset.filteredCount} of
                                      ${recordset.totalCount} records match;
                                      ${recordset.currentPage.length} shown on
                                      this page.</p
                                  >
                                  <p
                                      >Page ${recordset.pageNumber} ·
                                      ${recordset.pageSize} records per page ·
                                      ${recordset.allRecords.length} records
                                      loaded.</p
                                  >
                                  <p
                                      >${
                                          recordset.sortColumns.length
                                              ? `Sorted by ${recordset.sortColumns.map((column: { field: string; sort: string }) => `${column.field} ${column.sort === 'ascending' ? '↑' : '↓'}`).join(', then ')}.`
                                              : 'Original order; no sort selected.'
                                      }</p
                                  >
                                  ${recordset.isLoading ? html`<p>Loading records…</p>` : ''}
                              </div>
                              <div
                                  class="table-scroll"
                                  tabindex="0"
                                  role="region"
                                  aria-label="Current page stored values"
                              >
                                  <table aria-label="Current page records">
                                      <thead
                                          ><tr>
                                              <th scope="col">Row</th>
                                              ${fields.map(name => html`<th scope="col">${name}</th>`)}
                                              <th scope="col">Validation</th>
                                          </tr></thead
                                      >
                                      <tbody
                                          >${recordset.currentPage.map(
                                              (record, index) =>
                                                  html` <tr>
                                                      <th scope="row"
                                                          >${recordset.firstRecordNumberOnPage + index}</th
                                                      >
                                                      ${fields.map(name => html`<td data-field=${name}>${storedValue(record.getField(name))}${fieldStatus(record, name)}</td>`)}
                                                      <td
                                                          >${record.isValid() ? html`<span aria-label="Valid">Valid</span>` : statusIcon('Invalid')}</td
                                                      >
                                                  </tr>`
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                              ${recordset.currentPage.length ? '' : html`<p>No records on this page.</p>`}
                              ${statusLegend()}
                              <p class="note"
                                  >Values are stored values before formatting.
                                  Validation covers each complete record.</p
                              >
                              <details
                                  ><summary>Inspect full JSON</summary
                                  ><pre>
${JSON.stringify(
                                          {
                                              visibleRows:
                                                  recordset.currentPage.map(
                                                      record => record.values
                                                  ),
                                              totalRecords:
                                                  recordset.totalCount,
                                              loadedRecords:
                                                  recordset.allRecords.length,
                                              matchingRecords:
                                                  recordset.filteredCount,
                                              pageNumber: recordset.pageNumber,
                                              pageSize: recordset.pageSize,
                                              sortColumns:
                                                  recordset.sortColumns,
                                          },
                                          null,
                                          2
                                      )}</pre>
                              </details>
                          `
                        : html`<p>No recordset selected.</p>`
                }
            </div>
        </section>`;
    }

    static styles = [
        FdlRecordInspector.styles,
        css`
            .counts,
            .note {
                font-size: 0.875rem;
                line-height: 1.6;
            }
            .table-scroll {
                overflow-x: auto;
            }
            .table-scroll:focus-visible,
            summary:focus-visible {
                outline: 3px solid #2563eb;
                outline-offset: 3px;
            }
            table {
                table-layout: auto;
            }
            th:first-child,
            th:last-child {
                width: auto;
            }
            th,
            td {
                min-width: 72px;
            }
            td {
                font-family: monospace;
            }
            summary {
                cursor: pointer;
                padding: 12px 0;
                min-height: 44px;
            }
            pre {
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                font-size: 0.8125rem;
            }
        `,
    ];
}

customElements.define('fdl-recordset-inspector', FdlRecordsetInspector);

declare global {
    interface HTMLElementTagNameMap {
        'fdl-recordset-inspector': FdlRecordsetInspector;
    }
}
