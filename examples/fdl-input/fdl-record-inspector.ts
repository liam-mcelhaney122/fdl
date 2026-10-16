import { LitElement, css, html, type PropertyValues } from 'lit';
import Record from '../../record.js';
import { exampleTheme } from './example-theme';

const statusPaths = {
    Hidden: 'M3 3l18 18 M10 5a12 12 0 0 1 12 7s-1 2-3 4 M14 19C6 20 2 12 2 12s1-2 4-4 M10 10a3 3 0 0 0 4 4',
    Disabled: 'M8 11V7a4 4 0 0 1 8 0v4 M5 11h14v10H5z M12 15v2',
    'Read-only': 'M3 17v4h4L20 8l-4-4z M14 6l4 4 M3 3l18 18',
    Required: 'M12 4v16 M5 8l14 8 M5 16l14-8',
    Invalid: 'M12 3L2 21h20z M12 9v5 M12 17v1',
};

export function statusIcon(status: keyof typeof statusPaths) {
    return html`<span
        class="status-icon"
        role="img"
        aria-label=${status}
        title=${status}
    >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d=${statusPaths[status]}></path>
        </svg>
    </span>`;
}

export function storedValue(value: unknown): string {
    if (value === '') return '(empty string)';
    if (value === undefined) return '(undefined)';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' && !Number.isFinite(value))
        return String(value);
    try {
        return JSON.stringify(value) ?? String(value);
    } catch {
        return String(value);
    }
}

export function fieldStatus(record: Record<any>, name: string) {
    const type = record.fieldTypeForField(name);
    const value = record.getField(name);
    return html`<span class="field-status">
        ${!type.visible(value, record) ? statusIcon('Hidden') : ''}
        ${type.isDisabled(value, record) ? statusIcon('Disabled') : ''}
        ${type.readonly(value, record) ? statusIcon('Read-only') : ''}
        ${type.required(value, record) ? statusIcon('Required') : ''}
        ${!record.isValid(name) ? statusIcon('Invalid') : ''}
    </span>`;
}

export function statusLegend() {
    return html`<div class="legend" aria-label="Status icon legend">
        <p>Icon legend</p>
        <ul
            >${Object.keys(statusPaths).map(status => html`<li>${statusIcon(status as keyof typeof statusPaths)}<span>${status}</span></li>`)}</ul
        >
    </div>`;
}

/** Read-only inspection of an FDL record, independent of its form or page. */
export class FdlRecordInspector extends LitElement {
    static properties = {
        record: { attribute: false },
        fields: { attribute: false },
        collapsed: { type: Boolean, reflect: true },
    };

    record?: Record<any>;
    fields?: readonly string[];
    collapsed = false;
    private observedRecord?: Record<any>;
    private readonly handleChange = this.refresh.bind(this);

    connectedCallback() {
        super.connectedCallback();
        this.observeRecord();
        this.requestUpdate();
    }

    disconnectedCallback() {
        this.observedRecord?.removeEventListener('change', this.handleChange);
        this.observedRecord = undefined;
        super.disconnectedCallback();
    }

    protected willUpdate(_changed: PropertyValues<this>) {
        this.observeRecord();
    }

    private observeRecord() {
        if (this.observedRecord === this.record) return;
        this.observedRecord?.removeEventListener('change', this.handleChange);
        this.observedRecord = this.record;
        this.observedRecord?.addEventListener('change', this.handleChange);
    }

    private refresh() {
        this.requestUpdate();
    }

    private toggle() {
        this.collapsed = !this.collapsed;
    }

    render() {
        const record = this.record;
        const fields = this.fields ?? Object.keys(record?.fieldTypes ?? {});
        const action = this.collapsed
            ? 'Inspect record'
            : 'Collapse record inspector';
        return html`<section aria-label="Record Inspector">
            <header>
                <span class="inspector-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                        <circle cx="10" cy="10" r="6"></circle>
                        <path d="m15 15 6 6"></path>
                    </svg>
                </span>
                <div class="inspector-heading">
                    <h3>Record Inspector</h3>
                    <p>Stored values · Field state</p>
                </div>
                <button
                    type="button"
                    aria-label=${action}
                    title=${action}
                    aria-expanded=${!this.collapsed}
                    aria-controls="record-details"
                    @click=${this.toggle}
                >
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <path d="m6 9 6 6 6-6"></path>
                    </svg>
                </button>
            </header>
            <div id="record-details" ?hidden=${this.collapsed}>
                ${
                    record
                        ? html`<table aria-label="Field state">
                                  <thead
                                      ><tr
                                          ><th scope="col">Field</th
                                          ><th scope="col">Stored value</th
                                          ><th scope="col">Status</th></tr
                                      ></thead
                                  >
                                  <tbody
                                      >${fields.map(name => {
                                          const type =
                                              record.fieldTypeForField(name);
                                          const value = record.getField(name);
                                          return html`<tr data-field=${name}>
                                              <th scope="row"
                                                  >${type.label(value, record) || name}</th
                                              >
                                              <td>${storedValue(value)}</td>
                                              <td
                                                  >${fieldStatus(record, name)}</td
                                              >
                                          </tr>`;
                                      })}</tbody
                                  >
                              </table>
                              ${statusLegend()}
                              <p class="validation" role="status"
                                  >Record validation:
                                  <strong
                                      >${record.isValid() ? 'Valid' : 'Invalid'}</strong
                                  ></p
                              >`
                        : html`<p>No record selected.</p>`
                }
            </div>
        </section>`;
    }

    static styles = css`
        :host {
            display: block;
            min-width: 0;
        }
        * {
            box-sizing: border-box;
        }
        [hidden] {
            display: none !important;
        }
        section {
            border: 1px solid #b9d6d5;
            border-radius: 12px;
            background: #fff;
            color: #0f172a;
            box-shadow: 0 2px 6px #0f172a08;
        }
        header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 18px 20px;
            border-bottom: 1px solid #b9d6d5;
            border-radius: 11px 11px 0 0;
            background: linear-gradient(110deg, #e6f5f3, #f1f8f8);
            color: #134e4a;
        }
        :host([collapsed]) header {
            border-bottom: 0;
            border-radius: 11px;
        }
        .inspector-icon {
            display: grid;
            place-items: center;
            width: 40px;
            height: 40px;
            flex-shrink: 0;
            border: 1px solid #b9d6d5;
            border-radius: 10px;
            background: #fff;
            color: #0f766e;
        }
        .inspector-icon svg {
            width: 22px;
            height: 22px;
        }
        .inspector-heading {
            flex: 1;
            min-width: 0;
        }
        h3 {
            margin: 0;
            font-size: 1rem;
            font-weight: 700;
            line-height: 1.4;
        }
        .inspector-heading p {
            margin: 4px 0 0;
            font-size: 0.75rem;
            line-height: 1.5;
            color: #426561;
        }
        #record-details,
        #recordset-details {
            padding: 8px 20px 20px;
        }
        header button {
            display: grid;
            place-items: center;
            flex-shrink: 0;
            width: 44px;
            height: 44px;
            border: 1px solid #b9d6d5;
            border-radius: 50%;
            background: white;
            color: #0f766e;
            cursor: pointer;
        }
        button:hover {
            background: #ccfbf1;
            border-color: #0f766e;
        }
        button:focus-visible {
            outline: 3px solid #0f766e;
            outline-offset: 3px;
        }
        button svg {
            width: 20px;
            height: 20px;
            transition: transform 160ms;
        }
        button[aria-expanded='true'] svg {
            transform: rotate(180deg);
        }
        svg {
            fill: none;
            stroke: currentColor;
            stroke-width: 1.75;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 0.875rem;
            line-height: 1.5;
        }
        th,
        td {
            padding: 12px 6px;
            border-bottom: 1px solid var(--example-border);
            text-align: left;
            vertical-align: top;
            overflow-wrap: anywhere;
        }
        thead th {
            color: #426561;
            font-size: 0.75rem;
            font-weight: 600;
        }
        th:first-child {
            width: 30%;
            padding-left: 0;
        }
        th:last-child {
            width: 110px;
        }
        tbody tr:nth-child(even) {
            background: #f4f9f8;
        }
        tbody td:first-of-type {
            font-family: ui-monospace, monospace;
            font-size: 0.8125rem;
        }
        .field-status {
            display: flex;
            gap: 6px;
        }
        .status-icon {
            display: inline-flex;
            flex: 0 0 20px;
            width: 20px;
            height: 20px;
            color: #475569;
        }
        .status-icon svg {
            width: 100%;
            height: 100%;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.75;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
        .status-icon[aria-label='Invalid'] {
            color: #b91c1c;
        }
        .status-icon[aria-label='Required'] {
            color: #0f766e;
        }
        .legend {
            padding: 16px;
            border: 1px solid var(--example-border);
            border-radius: 8px;
            background: #f8fafc;
            margin-top: 20px;
            font-size: 0.8125rem;
            color: #475569;
        }
        .legend p {
            margin: 0 0 8px;
            font-weight: 600;
        }
        .legend ul {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px 16px;
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .legend li {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .validation {
            padding-top: 16px;
            border-top: 1px solid var(--example-border);
            font-size: 0.875rem;
            margin-bottom: 0;
        }
        .field-status {
            flex-wrap: wrap;
        }
        @media (max-width: 480px) {
            header {
                padding: 16px;
                gap: 10px;
            }
            #record-details,
            #recordset-details {
                padding: 8px 16px 16px;
            }
            .inspector-icon {
                width: 32px;
                height: 32px;
            }
        }
        @media (prefers-reduced-motion: reduce) {
            button svg {
                transition: none;
            }
        }
        @media (forced-colors: active) {
            section,
            header,
            .inspector-icon,
            button {
                border-color: CanvasText;
            }
        }
        ${exampleTheme}
    `;
}

customElements.define('fdl-record-inspector', FdlRecordInspector);

declare global {
    interface HTMLElementTagNameMap {
        'fdl-record-inspector': FdlRecordInspector;
    }
}
