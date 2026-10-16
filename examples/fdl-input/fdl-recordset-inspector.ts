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
        return html`<section aria-label="Recordset Inspector">
            <header>
                <span
                    class="inspector-icon"
                    aria-hidden="true"
                    ?hidden=${this.collapsed}
                >
                    <svg viewBox="0 0 24 24" focusable="false">
                        <circle cx="10" cy="10" r="6"></circle>
                        <path d="m15 15 6 6"></path>
                    </svg>
                </span>
                <div class="inspector-heading" ?hidden=${this.collapsed}>
                    <h3>Recordset Inspector</h3>
                    <p>Current view · Stored values</p>
                </div>
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
                        <g ?hidden=${!this.collapsed}>
                            <circle cx="10" cy="10" r="6"></circle>
                            <path d="m15 15 6 6"></path>
                        </g>
                        <path ?hidden=${this.collapsed} d="m6 9 6 6 6-6"></path>
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
                                              <th
                                                  scope="col"
                                                  class="row-status"
                                              ></th>
                                              <th scope="col">Row</th>
                                              ${fields.map(name => html`<th scope="col">${name}</th>`)}
                                          </tr></thead
                                      >
                                      <tbody
                                          >${recordset.currentPage.map(
                                              (record, index) =>
                                                  html` <tr>
                                                      <td class="row-status"
                                                          >${!record.isValid() ? statusIcon('Invalid') : ''}</td
                                                      >
                                                      <th scope="row"
                                                          >${recordset.firstRecordNumberOnPage + index}</th
                                                      >
                                                      ${fields.map(
                                                          name =>
                                                              html`<td
                                                                  data-field=${name}
                                                                  ><span
                                                                      class="stored-cell"
                                                                      >${fieldStatus(record, name)}<span
                                                                          >${storedValue(record.getField(name))}</span
                                                                      ></span
                                                                  ></td
                                                              >`
                                                      )}
                                                  </tr>`
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                              ${recordset.currentPage.length ? '' : html`<p>No records on this page.</p>`}
                              ${statusLegend()}
                              <p class="note"
                                  >Values are stored values before formatting.
                                  Icons on the left indicate applicable states;
                                  the row status covers the complete record.</p
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
            .counts {
                padding: 0 0 8px;
                border-bottom: 1px solid var(--example-border);
                color: #404040;
            }
            .counts p {
                margin: 12px 0;
            }
            .table-scroll {
                overflow-x: auto;
            }
            .table-scroll:focus-visible,
            summary:focus-visible {
                outline: 3px solid #525252;
                outline-offset: 3px;
            }
            table {
                table-layout: auto;
                min-width: 640px;
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
            .row-status {
                min-width: 32px;
                width: 32px;
            }
            .stored-cell {
                display: flex;
                align-items: flex-start;
                gap: 6px;
            }
            .field-status:not(:has(.status-icon)) {
                display: none;
            }
            summary {
                cursor: pointer;
                padding: 12px 14px;
                min-height: 44px;
                border: 1px solid #d4d4d4;
                border-radius: 8px;
                background: #fafafa;
                color: #262626;
                font-size: 0.875rem;
                font-weight: 600;
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
