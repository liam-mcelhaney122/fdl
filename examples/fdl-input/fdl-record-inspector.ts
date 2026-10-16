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
        <ul>${Object.keys(statusPaths).map(status => html`<li>${statusIcon(status as keyof typeof statusPaths)}<span>${status}</span></li>`)}</ul>
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
        return html`<section aria-label="Record inspector">
            <header>
                <h3 ?hidden=${this.collapsed}>Field state</h3>
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
                        <circle cx="10" cy="10" r="6"></circle>
                        <path d="m15 15 6 6"></path>
                        ${this.collapsed ? '' : html`<path d="M7 10h6"></path>`}
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
            padding: 20px;
            border: 1px solid var(--example-border);
            border-radius: var(--example-radius);
            background: #f8fafc;
            color: #0f172a;
        }
        :host([collapsed]) section {
            padding: 0;
            border: 0;
            background: transparent;
        }
        header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 8px;
        }
        :host([collapsed]) header {
            margin: 0;
        }
        h3 {
            margin: 0;
            font-size: 1rem;
            font-weight: 600;
        }
        button {
            display: grid;
            place-items: center;
            flex-shrink: 0;
            width: 44px;
            height: 44px;
            border: 1px solid #94a3b8;
            border-radius: 6px;
            background: white;
            color: #475569;
            cursor: pointer;
        }
        button:hover {
            background: #eff6ff;
            color: #1d4ed8;
        }
        button:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: 3px;
        }
        button svg {
            width: 24px;
            height: 24px;
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
            color: #64748b;
            font-size: 0.8125rem;
        }
        th:first-child {
            width: 30%;
            padding-left: 0;
        }
        th:last-child {
            width: 110px;
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
        .legend {
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
            section {
                padding: 16px;
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
