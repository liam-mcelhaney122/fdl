import { LitElement, css, html, nothing } from 'lit';
import FieldType from '../../field-type.js';
import Record from '../../record.js';
import Recordset from '../../recordset.js';
import './fdl-field';
import './fdl-table';

type PaymentValues = {
    payee: string;
    method: 'ach' | 'check';
    amount: number;
    deliveryDate: string;
    routingNumber: string;
    accountNumber: string;
    memo: string;
    status: string;
};

const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const isAch = (record: Record<any>) => record.getField('method') === 'ach';

const isValidRoutingNumber = (value: unknown) => {
    const routingNumber = String(value);
    if (!/^\d{9}$/.test(routingNumber)) return false;
    const digits = [...routingNumber].map(Number);
    const checksum =
        3 * (digits[0] + digits[3] + digits[6]) +
        7 * (digits[1] + digits[4] + digits[7]) +
        digits[2] + digits[5] + digits[8];
    return checksum % 10 === 0;
};

const paymentFields = {
    payee: new FieldType<string>().with
        .label('Payee')
        .and.required()
        .and.minColumnWidth(150),
    method: new FieldType<PaymentValues['method']>().with
        .label('Payment rail')
        .and.tag('select')
        .and.options([
            { text: 'ACH transfer', value: 'ach' },
            { text: 'Mailed check', value: 'check' },
        ])
        .and.required()
        .and.minColumnWidth(130),
    amount: new FieldType<number>().with
        .label('Amount')
        .and.parser(value => Number(String(value).replace(/[$,\s]/g, '')))
        .and.formatter(value => currency.format(Number(value)))
        .and.validator({
            name: 'must be greater than zero',
            validate: value => Number.isFinite(value) && value > 0,
        })
        .and.textAlign('right')
        .and.minColumnWidth(110)
        .and.maxColumnWidth(180),
    deliveryDate: new FieldType<string>().with
        .label('Delivery date')
        .and.type('date')
        .and.required()
        .and.minColumnWidth(130),
    routingNumber: new FieldType<string>().with
        .label('Routing number')
        .and.visibleWhen(isAch)
        .and.requiredWhen(isAch)
        .and.validator({
            name: 'must be a valid 9-digit ABA number',
            validate: (value, _viewValue, record) => !isAch(record) || isValidRoutingNumber(value),
        }),
    accountNumber: new FieldType<string>().with
        .label('Account number')
        .and.visibleWhen(isAch)
        .and.requiredWhen(isAch)
        .and.validator({
            name: 'must contain 4 to 17 digits',
            validate: (value, _viewValue, record) =>
                !isAch(record) || /^\d{4,17}$/.test(String(value)),
        }),
    memo: new FieldType<string>().with.label('Memo').and.tag('textarea').and.rowCount(2),
    status: new FieldType<string>().with
        .label('Status')
        .and.readOnly()
        .and.minColumnWidth(140),
};

const csvCell = (value: unknown) => `"${String(value).replace(/"/g, '""')}"`;

export class FdlPaymentWorkflow extends LitElement {
    private payment = new Record<PaymentValues>(paymentFields, {
        payee: 'Northstar Office Supply',
        method: 'ach',
        amount: 2450,
        deliveryDate: '2026-08-21',
        routingNumber: '021000021',
        accountNumber: '48290173',
        memo: 'Workspace refresh',
        status: 'Ready for approval',
    });

    private reviewRecordset?: Recordset<PaymentValues>;

    private reviewAttempted = false;

    private onPaymentChange = () => {
        this.reviewRecordset = undefined;
        this.requestUpdate();
    };

    connectedCallback() {
        super.connectedCallback();
        this.payment.addEventListener('change', this.onPaymentChange);
    }

    disconnectedCallback() {
        this.payment.removeEventListener('change', this.onPaymentChange);
        super.disconnectedCallback();
    }

    private renderField(field: keyof PaymentValues) {
        const errors = this.reviewAttempted ? this.payment.readableFieldErrors(field) : [];
        return html`
            <div class="field-row">
                <fdl-field .record=${this.payment} field=${field}></fdl-field>
                ${errors.length
                    ? html`<p class="field-error" role="alert">${errors.join('. ')}</p>`
                    : nothing}
            </div>
        `;
    }

    private async reviewPayment() {
        this.reviewAttempted = true;
        if (!this.payment.isValid()) {
            this.reviewRecordset = undefined;
            this.requestUpdate();
            return;
        }

        this.reviewRecordset = new Recordset<PaymentValues>(paymentFields, [
            { ...this.payment.values },
        ]);
        await this.reviewRecordset.requestUpdate();
        this.requestUpdate();
    }

    private editPayment() {
        this.reviewRecordset = undefined;
        this.requestUpdate();
    }

    private exportCsv() {
        const fields: Array<keyof PaymentValues> = [
            'payee',
            'method',
            'amount',
            'deliveryDate',
            'memo',
        ];
        const labels = fields.map(field => paymentFields[field].label(this.payment));
        const values = fields.map(field => this.payment.print(field));
        return `${labels.map(csvCell).join(',')}\n${values.map(csvCell).join(',')}`;
    }

    render() {
        const errors = this.reviewAttempted ? this.payment.readableRecordErrors() : [];
        return html`
            <section class="workflow" aria-labelledby="payment-workflow-title">
                <div class="intro">
                    <p class="eyebrow">A complete example</p>
                    <h2 id="payment-workflow-title">From payment draft to export</h2>
                    <p>
                        One field language drives the editable draft, conditional ACH rules,
                        record validation, review table, and export formatting.
                    </p>
                </div>

                ${this.reviewRecordset
                    ? html`
                          <div class="panel review-panel">
                              <div class="panel-heading">
                                  <div>
                                      <p class="step">Step 2 of 2</p>
                                      <h3>Review payment</h3>
                                  </div>
                                  <span class="status">Model valid</span>
                              </div>
                              <fdl-table .recordset=${this.reviewRecordset}>
                                  <fdl-column field="payee"></fdl-column>
                                  <fdl-column field="method"></fdl-column>
                                  <fdl-column field="amount"></fdl-column>
                                  <fdl-column field="deliveryDate"></fdl-column>
                                  <fdl-column field="status"></fdl-column>
                              </fdl-table>
                              <div class="export-block">
                                  <div>
                                      <p class="step">Export preview</p>
                                      <p>
                                          The amount formatter and payment-rail option label use the
                                          same FDL print path as the review table. The underlying amount
                                          remains a number.
                                      </p>
                                  </div>
                                  <pre data-export-preview>${this.exportCsv()}</pre>
                              </div>
                              <button type="button" class="secondary" @click=${this.editPayment}>
                                  Back to edit
                              </button>
                          </div>
                      `
                    : html`
                          <div class="panel edit-panel">
                              <div class="panel-heading">
                                  <div>
                                      <p class="step">Step 1 of 2</p>
                                      <h3>Draft payment</h3>
                                  </div>
                                  <span class="status">FDL Record</span>
                              </div>
                              <div class="fields">
                                  ${this.renderField('payee')}
                                  ${this.renderField('method')}
                                  ${this.renderField('amount')}
                                  ${this.renderField('deliveryDate')}
                                  ${this.renderField('routingNumber')}
                                  ${this.renderField('accountNumber')}
                                  ${this.renderField('memo')}
                              </div>
                              ${errors.length
                                  ? html`<div class="error-summary" role="alert">
                                        <strong>Check this payment before review.</strong>
                                        <ul>
                                            ${errors.map(error => html`<li>${error}</li>`)}
                                        </ul>
                                    </div>`
                                  : nothing}
                              <div class="actions">
                                  <button type="button" class="primary" @click=${this.reviewPayment}>
                                      Review payment
                                  </button>
                                  <span>${isAch(this.payment)
                                      ? 'ACH account rules are active.'
                                      : 'ACH account rules are inactive.'}</span>
                              </div>
                          </div>
                      `}
            </section>
        `;
    }

    static styles = css`
        :host {
            display: block;
            margin-bottom: 4rem;
        }

        * {
            box-sizing: border-box;
        }

        .workflow {
            display: grid;
            gap: 1.5rem;
        }

        .intro {
            max-width: 48rem;
        }

        .eyebrow,
        .step {
            margin: 0 0 0.45rem;
            color: #7657ff;
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
        }

        h2,
        h3,
        p {
            margin-top: 0;
        }

        h2 {
            margin-bottom: 0.75rem;
            color: #10233f;
            font-size: clamp(2rem, 4vw, 3.2rem);
            letter-spacing: -0.045em;
            line-height: 1.05;
        }

        h3 {
            margin-bottom: 0;
            color: #10233f;
            font-size: 1.35rem;
        }

        .intro > p:last-child,
        .export-block p,
        .actions span {
            color: #586174;
            line-height: 1.6;
        }

        .panel {
            border: 1px solid #dfe3ee;
            border-radius: 1rem;
            background: white;
            box-shadow: 0 1rem 2.5rem rgb(16 35 63 / 8%);
            padding: clamp(1rem, 3vw, 2rem);
        }

        .panel-heading,
        .actions,
        .export-block {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        }

        .panel-heading {
            margin-bottom: 1.5rem;
        }

        .status {
            border-radius: 999px;
            background: #eeecff;
            color: #4938bd;
            padding: 0.4rem 0.7rem;
            font-size: 0.75rem;
            font-weight: 800;
        }

        .fields {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            column-gap: 2rem;
        }

        .field-row {
            min-width: 0;
        }

        fdl-field {
            --field-label-width: 100%;
            --field-control-width: 100%;
            --field-flex-wrap: wrap;
        }

        .field-error {
            margin: -0.25rem 0 0.65rem;
            color: #a42b20;
            font-size: 0.8rem;
        }

        .error-summary {
            margin: 1rem 0;
            border-left: 0.25rem solid #d7493e;
            background: #fff1ef;
            color: #7e241c;
            padding: 0.8rem 1rem;
        }

        .error-summary ul {
            margin-bottom: 0;
            padding-left: 1.25rem;
        }

        .actions {
            margin-top: 1.25rem;
        }

        button {
            border-radius: 0.55rem;
            cursor: pointer;
            font: inherit;
            font-weight: 800;
            padding: 0.7rem 1rem;
        }

        button:focus-visible {
            outline: 3px solid #7657ff;
            outline-offset: 3px;
        }

        .primary {
            border: 1px solid #5b43de;
            background: #5b43de;
            color: white;
        }

        .secondary {
            margin-top: 1rem;
            border: 1px solid #cbd2df;
            background: white;
            color: #343b53;
        }

        .export-block {
            align-items: flex-start;
            margin-top: 1.5rem;
            border-radius: 0.75rem;
            background: #f7f8fb;
            padding: 1rem;
        }

        .export-block > div {
            max-width: 29rem;
        }

        .export-block p:last-child {
            margin-bottom: 0;
            font-size: 0.85rem;
        }

        pre {
            max-width: 100%;
            margin: 0;
            overflow-x: auto;
            color: #25324a;
            font-size: 0.75rem;
            line-height: 1.5;
            white-space: pre;
        }

        @media (max-width: 48rem) {
            .fields {
                grid-template-columns: 1fr;
            }

            .panel-heading,
            .actions,
            .export-block {
                align-items: flex-start;
                flex-direction: column;
            }
        }
    `;
}

customElements.define('fdl-payment-workflow', FdlPaymentWorkflow);
