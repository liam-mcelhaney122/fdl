import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import FieldType from '../../field-type.js';
import Record from '../../record.js';
import Recordset from '../../recordset.js';
import './fdl-field';
import './fdl-table';

type DemoName =
    | 'cellClass' | 'compareFunction' | 'conditionalCellClass'
    | 'defaultValue' | 'disabled' | 'disabledWhen' | 'emptyWhen'
    | 'exampleValue' | 'filter' | 'formatter' | 'hashFunction'
    | 'inputMask' | 'label' | 'maxColumnWidth' | 'maxLength'
    | 'minColumnWidth' | 'minLength' | 'multipleValues' | 'options'
    | 'placeholder' | 'readOnly' | 'readOnlyWhen' | 'reducer' | 'required'
    | 'parser' | 'requiredWhen' | 'rowClasses' | 'rowCount' | 'sortable'
    | 'targetColumnWidth' | 'template' | 'textAlign' | 'type' | 'validator'
    | 'visibleWhen';

type CatalogEntry = {
    name: string;
    intent: string;
    demo?: DemoName;
    limitation?: string;
    snippet?: string;
};

const customControlGap =
    'The modifier configures a richer custom control API. The cookbook uses FDL-backed form adapters, which do not implement that richer contract.';
const live = (name: string, intent: string, demo: DemoName, snippet?: string): CatalogEntry => ({
    name, intent, demo, snippet,
});
const placeholder = (name: string, intent: string, limitation: string): CatalogEntry => ({
    name, intent, limitation,
});

const entries: CatalogEntry[] = [
    live('cellClass', 'Adds a CSS class to every table cell for this field.', 'cellClass', `.cellClass('amount-cell')`),
    live('compareFunction', 'Defines how two field values are ordered.', 'compareFunction', `const people = new Recordset({
  firstName: new FieldType().with
    .label('First name')
    .and.compareFunction((a, b) => a.localeCompare(b)),
  lastName: new FieldType().with
    .label('Last name')
    .and.compareFunction((a, b) => a.localeCompare(b)),
}, data);

<fdl-table .recordset=\${people}>
  <fdl-column field="firstName"></fdl-column>
  <fdl-column field="lastName"></fdl-column>
  <fdl-column field="team"></fdl-column>
</fdl-table>`),
    live('conditionalCellClass', 'Adds a table-cell class when a value predicate passes.', 'conditionalCellClass', `.conditionalCellClass(value => value > 10000, 'high-value')`),
    live('defaultValue', 'Defines the value Record.clear() restores for this field.', 'defaultValue', `.defaultValue('Pending assignment')`),
    live('disabled', 'Makes a control visible but permanently unavailable for editing.', 'disabled', `.disabled()`),
    live('disabledWhen', 'Disables a control only while a record predicate is true.', 'disabledWhen', `.disabledWhen(record => record.getField('status') === 'approved')`),
    live('emptyWhen', 'Defines additional values that should count as empty during validation.', 'emptyWhen', `.emptyWhen(value => value === 'N/A')`),
    live('exampleValue', 'Supplies fixed or index-derived values for generated example records.', 'exampleValue', `.exampleValue(index => \`Sample contact \${index + 1}\`)`),
    live('filter', 'Makes a table column filterable and defines how text matches its values.', 'filter', `.filter((text, value) => value.toLowerCase().startsWith(text.toLowerCase()))`),
    live('formatter', 'Transforms a stored value for display without changing the model value.', 'formatter', `.formatter(value => currency.format(Number(value)))`),
    live('hashFunction', 'Defines stable identity for complex option values.', 'hashFunction', `.hashFunction(employee => employee.id)`),
    live('inputMask', 'Defines which individual typed characters a field accepts.', 'inputMask', `.inputMask(/[0-9.]/)`),
    live('label', 'Provides a static label or derives one from the current record.', 'label', `.label(record => \`Amount for \${record.getField('expenseType')}\`)`),
    live('maxColumnWidth', 'Sets the maximum width requested for a table column.', 'maxColumnWidth', `.maxColumnWidth(180)`),
    live('maxLength', 'Caps input length and adds equivalent record validation.', 'maxLength', `.maxLength(12)`),
    live('minColumnWidth', 'Sets the minimum width requested for a table column.', 'minColumnWidth', `.minColumnWidth(110)`),
    live('minLength', 'Sets a minimum input length and adds equivalent record validation.', 'minLength', `.minLength(4)`),
    live('multipleValues', 'Marks a native select as allowing more than one choice.', 'multipleValues', `.tag('select')
  .and.multipleValues()
  .and.options([
    { text: 'Design', value: 'design' },
    { text: 'Engineering', value: 'engineering' },
    { text: 'Research', value: 'research' },
  ])`),
    live('options', 'Supplies static or fetched choices and can refresh them from dependency fields.', 'options', `.options({ fields: ['department'], fetch: record => directory[record.getField('department')] })`),
    live('parser', 'Transforms an incoming display value into the stored model representation.', 'parser', `.formatter(value => currency.format(Number(value)))
  .and.parser(value => Number(String(value).replace(/[$,]/g, '')))`),
    live('placeholder', 'Shows temporary hint text while an input is empty.', 'placeholder', `.placeholder('For example, Apollo migration')`),
    placeholder('range', 'Marks a field as representing a start/end range rather than one value.', 'FieldType stores the flag, but FormElement neither chooses nor implements a range control. The intended value and event contract are not clear in this native example.'),
    live('readOnly', 'Always renders the field as a printed, non-editable value.', 'readOnly', `.readOnly()`),
    live('readOnlyWhen', 'Switches a field to printed, non-editable output while a predicate is true.', 'readOnlyWhen', `.readOnlyWhen(record => record.getField('phase') === 'submitted')`),
    live('reducer', 'Aggregates a column’s values, with sum available as a built-in reducer.', 'reducer', `.reducer('sum')`),
    live('required', 'Always requires a non-empty value and adds record validation.', 'required', `.required()`),
    live('requiredWhen', 'Requires a value only while a record predicate is true.', 'requiredWhen', `.requiredWhen(record => record.getField('followUp') === 'yes')`),
    live('rowClasses', 'Computes CSS classes for the table row containing a value.', 'rowClasses', `.rowClasses(value => value === 'Disputed' ? ['disputed-row'] : [])`),
    live('rowCount', 'Sets the visible row count of textarea-like controls.', 'rowCount', `.rowCount(4)`),
    placeholder('search', 'Enables a rich option-search dialog and describes its result columns.', customControlGap),
    placeholder('selectOnFocus', 'Requests selecting all text when a compatible control receives focus.', 'The flag is forwarded as an expando property, but FormElement does not attach a focus handler and native inputs do not interpret that property.'),
    live('sortable', 'Enables or disables sorting for a table column.', 'sortable', `.sortable(false)`),
    live('targetColumnWidth', 'Sets the preferred width requested for a table column.', 'targetColumnWidth', `.targetColumnWidth(140)`),
    live('template', 'Transforms a formatted value into its final printed or table representation.', 'template', `.template(value => \`Invoice #\${value}\`)`),
    live('textAlign', 'Stores the preferred left, center, or right alignment for rendered values.', 'textAlign', `.textAlign('right')`),
    placeholder('toggle', 'Requests toggle-switch presentation from a compatible Boolean control.', customControlGap),
    live('type', 'Sets the native input type, such as email, number, or date.', 'type', `.type('date')`),
    live('validator', 'Adds a named synchronous business rule to record validation.', 'validator', `.validator({ name: 'must look like PRJ-1234', validate: value => /^PRJ-\\d{4}$/.test(value) })`),
    live('visibleWhen', 'Includes the field only while every visibility predicate is true.', 'visibleWhen', `.visibleWhen(record => record.getField('fulfillment') === 'ship')`),
].sort((left, right) => left.name.localeCompare(right.name));

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export class FdlModifierCatalog extends LitElement {
    private validatedFields = new Set<string>();

    private defaultRecord = new Record(
        { defaultId: new FieldType().with.label('Request ID').and.defaultValue('Pending assignment') },
        { defaultId: 'REQ-1042' }
    );

    private record = new Record(
        {
            extraProperty: new FieldType().with.label('Extra property example'),
            lockedId: new FieldType().with.label('System ID').and.disabled(),
            approvalStatus: new FieldType().with.label('Approval status').and.tag('select').and.options([{ text: 'Draft', value: 'draft' }, { text: 'Approved', value: 'approved' }]),
            budget: new FieldType().with.label('Budget').and.type('number').and.disabledWhen(record => record.getField('approvalStatus') === 'approved'),
            emptyCode: new FieldType().with.label('Reference').and.required().and.emptyWhen(value => value === 'N/A'),
            hiddenSearch: new FieldType().with.label('Search directory').and.placeholder('Search directory'),
            expenseType: new FieldType().with.label('Expense type').and.tag('select').and.options([{ text: 'Travel', value: 'travel' }, { text: 'Equipment', value: 'equipment' }]),
            dynamicAmount: new FieldType<any>().with.label((record: any) => `Amount for ${record.getField('expenseType')}`).and.type('number'),
            money: new FieldType<number>().with
                .label('Money')
                .and.formatter(value => currency.format(Number(value)))
                .and.parser(value => Number(String(value).replace(/[$,]/g, ''))),
            shortCode: new FieldType().with.label('Short code').and.maxLength(12),
            longCode: new FieldType().with.label('Access code').and.minLength(4),
            skills: new FieldType().with.label('Skills').and.tag('select').and.multipleValues().and.options([
                { text: 'Design', value: 'design' },
                { text: 'Engineering', value: 'engineering' },
                { text: 'Research', value: 'research' },
            ]),
            quantity: new FieldType<any>().with.label('Quantity').and.tag('select').and.options([{ text: '1', value: 1 }, { text: '2', value: 2 }, { text: '4', value: 4 }]),
            total: new FieldType().with.label('Total at $25 each').and.formatter(value => currency.format(Number(value))).and.readOnly(),
            department: new FieldType().with.label('Department').and.tag('select').and.options([{ text: 'Engineering', value: 'engineering' }, { text: 'Finance', value: 'finance' }]),
            assignee: new FieldType<any>().with.label('Assignee').and.tag('select').and.options({ fields: ['department'], fetch: (record: any) => Promise.resolve(record.getField('department') === 'finance' ? [{ text: 'Katherine Johnson', value: 'katherine' }, { text: 'Mary Jackson', value: 'mary' }] : [{ text: 'Grace Hopper', value: 'grace' }, { text: 'Margaret Hamilton', value: 'margaret' }]) }),
            projectName: new FieldType().with.label('Project name').and.placeholder('For example, Apollo migration'),
            fixedOwner: new FieldType().with.label('Owner').and.readOnly(),
            phase: new FieldType().with.label('Phase').and.tag('select').and.options([{ text: 'Draft', value: 'draft' }, { text: 'Submitted', value: 'submitted' }]),
            conditionalOwner: new FieldType().with.label('Request owner').and.readOnlyWhen(record => record.getField('phase') === 'submitted'),
            requiredName: new FieldType().with.label('Legal name').and.required(),
            followUp: new FieldType().with.label('Follow-up needed?').and.tag('select').and.options([{ text: 'No', value: 'no' }, { text: 'Yes', value: 'yes' }]),
            followUpNotes: new FieldType().with.label('Follow-up notes').and.tag('textarea').and.rowCount(2).and.requiredWhen(record => record.getField('followUp') === 'yes'),
            comments: new FieldType().with.label('Comments').and.tag('textarea').and.rowCount(4),
            dateType: new FieldType().with.label('Start date').and.type('date'),
            projectCode: new FieldType().with.label('Project code').and.validator({ name: 'must look like PRJ-1234', validate: value => /^PRJ-\d{4}$/.test(String(value)) }),
            fulfillment: new FieldType().with.label('Fulfillment').and.tag('select').and.options([{ text: 'Ship', value: 'ship' }, { text: 'Pickup', value: 'pickup' }]),
            address: new FieldType().with.label('Shipping address').and.visibleWhen(record => record.getField('fulfillment') === 'ship'),
        },
        {
            extraProperty: '', lockedId: 'SYS-77', approvalStatus: 'draft', budget: 5000,
            emptyCode: 'N/A', hiddenSearch: '', expenseType: 'travel', dynamicAmount: '',
            money: 1000,
            shortCode: '', longCode: '', skills: 'design', quantity: 2, total: 50, department: 'engineering', assignee: 'grace',
            projectName: '', fixedOwner: 'Ada Lovelace', phase: 'draft', conditionalOwner: 'Ada Lovelace', requiredName: '',
            followUp: 'no', followUpNotes: '', comments: '', dateType: '', projectCode: '',
            fulfillment: 'ship', address: '',
        }
    );

    private exampleType = new FieldType<string>().with.exampleValue(index => `Sample contact ${index + 1}`);
    private filterRecordset = new Recordset(
        {
            name: new FieldType<string>().with
                .label('Name')
                .and.filter((text, value) => value.toLowerCase().startsWith(text.toLowerCase())),
            team: new FieldType().with.label('Team'),
        },
        [
            { name: 'Ada', team: 'Research' },
            { name: 'Grace', team: 'Platform' },
            { name: 'Margaret', team: 'Research' },
        ]
    );
    private hashType = new FieldType().with.hashFunction((employee: { id: string }) => employee.id);
    private maskType = new FieldType().with.inputMask(/[0-9.]/);
    private cellClassRecordset = new Recordset(
        {
            amount: new FieldType().with.label('Amount').and.cellClass('amount-cell').and.textAlign('right'),
            category: new FieldType().with.label('Category'),
        },
        [{ amount: 42, category: 'Travel' }, { amount: 84, category: 'Meals' }]
    );
    private conditionalClassRecordset = new Recordset(
        {
            amount: new FieldType().with
                .label('Amount')
                .and.textAlign('right')
                .and.conditionalCellClass((value: number) => value > 10000, 'high-value'),
            label: new FieldType().with.label('Label'),
        },
        [{ amount: 12000, label: 'High' }, { amount: 2000, label: 'Normal' }]
    );
    private compareRecordset = new Recordset(
        {
            firstName: new FieldType().with
                .label('First name')
                .and.compareFunction((left: string, right: string) => left.localeCompare(right) as -1 | 0 | 1),
            lastName: new FieldType().with
                .label('Last name')
                .and.compareFunction((left: string, right: string) => left.localeCompare(right) as -1 | 0 | 1),
            team: new FieldType().with.label('Team').and.sortable(false),
        },
        [
            { firstName: 'Ada', lastName: 'Zulu', team: 'Research' },
            { firstName: 'Grace', lastName: 'Alpha', team: 'Platform' },
            { firstName: 'Ada', lastName: 'Mike', team: 'Platform' },
            { firstName: 'Grace', lastName: 'Beta', team: 'Research' },
        ]
    );
    private reducerType = new FieldType().with.reducer('sum');
    private formatterRecordset = new Recordset(
        {
            amount: new FieldType().with
                .label('Amount')
                .and.textAlign('right')
                .and.formatter(value => currency.format(Number(value))),
            invoice: new FieldType().with.label('Invoice'),
        },
        [{ amount: 1250, invoice: '1048' }, { amount: 875, invoice: '1049' }]
    );
    private rowClassRecordset = new Recordset(
        {
            status: new FieldType().with
                .label('Status')
                .and.rowClasses((value: string) => value === 'Disputed' ? ['disputed-row'] : []),
            owner: new FieldType().with.label('Owner'),
        },
        [{ status: 'Disputed', owner: 'Ada' }, { status: 'Paid', owner: 'Grace' }]
    );
    private templateRecordset = new Recordset(
        {
            invoice: new FieldType().with
                .label('Invoice')
                .and.template(value => `Invoice #${value}`),
            status: new FieldType().with.label('Status'),
        },
        [{ invoice: '1048', status: 'Open' }, { invoice: '1049', status: 'Paid' }]
    );
    private alignRecordset = new Recordset(
        {
            left: new FieldType().with.label('Left').and.textAlign('left'),
            center: new FieldType().with.label('Center').and.textAlign('center'),
            right: new FieldType().with.label('Right').and.textAlign('right'),
        },
        [{ left: 'Ada', center: 'Ada', right: 'Ada' }, { left: 'Grace', center: 'Grace', right: 'Grace' }]
    );
    private widthRecordsets = {
        maxColumnWidth: new Recordset(
            {
                constrained: new FieldType().with.label('Maximum (180px)').and.minColumnWidth(80).and.maxColumnWidth(180),
                flexible: new FieldType().with.label('Flexible').and.minColumnWidth(80),
            },
            [{ constrained: 'Stops growing at 180px', flexible: 'Makes up the difference' }]
        ),
        minColumnWidth: new Recordset(
            {
                constrained: new FieldType().with.label('Minimum (110px)').and.minColumnWidth(110),
                flexible: new FieldType().with.label('Flexible').and.minColumnWidth(80),
            },
            [{ constrained: 'Stops shrinking at 110px', flexible: 'Makes up the difference' }]
        ),
        targetColumnWidth: new Recordset(
            {
                constrained: new FieldType().with.label('Preferred (140px)').and.minColumnWidth(80).and.targetColumnWidth(140).and.maxColumnWidth(220),
                flexible: new FieldType().with.label('Flexible').and.minColumnWidth(80),
            },
            [{ constrained: 'Preferred width: 140px', flexible: 'Makes up the difference' }]
        ),
    };
    private sortableType = new FieldType().with.sortable(false);

    connectedCallback() {
        super.connectedCallback();
        this.record.addEventListener('change', this.onRecordChange);
        this.defaultRecord.addEventListener('change', this.onRecordChange);
    }

    disconnectedCallback() {
        this.record.removeEventListener('change', this.onRecordChange);
        this.defaultRecord.removeEventListener('change', this.onRecordChange);
        super.disconnectedCallback();
    }

    private onRecordChange = () => this.requestUpdate();

    private clearDefaultRecord = () => {
        this.defaultRecord.clear();
        this.requestUpdate();
    };

    private renderField(
        field: string,
        record: Record<any> = this.record,
        showValidation = false
    ) {
        return html`<fdl-field
            field=${field}
            .record=${record}
            .showValidation=${showValidation}
        ></fdl-field>`;
    }

    private validateField(field: string) {
        this.validatedFields.add(field);
        this.requestUpdate();
    }

    private validationResult(field: string) {
        if (!this.validatedFields.has(field) || !this.record.isValid(field)) return nothing;
        return html`<p class="result valid" role="status">Valid.</p>`;
    }

    private renderValidation(field: string) {
        const showValidation = this.validatedFields.has(field);
        return html`${this.renderField(field, this.record, showValidation)}
            <button type="button" @click=${() => this.validateField(field)}>Check value</button>
            ${this.validationResult(field)}`;
    }

    private renderWidth(name: 'maxColumnWidth' | 'minColumnWidth' | 'targetColumnWidth') {
        const instructions = {
            maxColumnWidth: 'Drag the divider right. The Maximum column stops at 180px.',
            minColumnWidth: 'Drag the divider left. The Minimum column stops at 110px.',
            targetColumnWidth: 'Drag the divider to resize this preferred-width column; its minimum and maximum still apply.',
        };
        return html`<p class="try">${instructions[name]}</p>
            <fdl-table class="width-table" .recordset=${this.widthRecordsets[name]}>
                <fdl-column field="constrained"></fdl-column>
                <fdl-column field="flexible"></fdl-column>
            </fdl-table>`;
    }

    private renderDemo(name: DemoName): TemplateResult {
        switch (name) {
            case 'cellClass': return html`<p class="try">The Amount column is bold, blue, and highlighted because its cells receive the <code>amount-cell</code> class.</p><fdl-table .recordset=${this.cellClassRecordset}><fdl-column field="amount"></fdl-column><fdl-column field="category"></fdl-column></fdl-table>`;
            case 'compareFunction': {
                return html`<p class="try">Click First name and Last name. Numbered arrows show the primary and secondary sort.</p>
                    <fdl-table .recordset=${this.compareRecordset}>
                        <fdl-column field="firstName"></fdl-column>
                        <fdl-column field="lastName"></fdl-column>
                        <fdl-column field="team"></fdl-column>
                    </fdl-table>`;
            }
            case 'conditionalCellClass': return html`<p class="try">Only 12000 receives the <code>high-value</code> class.</p><fdl-table .recordset=${this.conditionalClassRecordset}><fdl-column field="amount"></fdl-column><fdl-column field="label"></fdl-column></fdl-table>`;
            case 'defaultValue': return html`${this.renderField('defaultId', this.defaultRecord)}<button type="button" @click=${this.clearDefaultRecord}>Clear the record</button><p class="computed">Current record value: ${this.defaultRecord.getField('defaultId')}</p>`;
            case 'disabled': return html`${this.renderField('lockedId')}`;
            case 'disabledWhen': return html`<p class="try">Choose Approved to disable Budget.</p>${this.renderField('approvalStatus')}${this.renderField('budget')}`;
            case 'emptyWhen': return html`<p class="try">“N/A” is configured to count as empty.</p>${this.renderValidation('emptyCode')}`;
            case 'exampleValue': return html`<p class="computed">Generated values: ${[0, 1, 2].map(index => this.exampleType.exampleValue()(index)).join(', ')}</p>`;
            case 'filter': return html`<p class="try">Open the filter in the Name heading. This matcher uses “starts with,” so entering “gr” keeps Grace.</p><fdl-table .recordset=${this.filterRecordset}><fdl-column field="name"></fdl-column><fdl-column field="team"></fdl-column></fdl-table>`;
            case 'formatter': return html`<p class="try">The record stores <code>1250</code>; the table prints the formatted value.</p><fdl-table .recordset=${this.formatterRecordset}><fdl-column field="amount"></fdl-column><fdl-column field="invoice"></fdl-column></fdl-table>`;
            case 'hashFunction': return html`<p class="computed">Two separate employee objects hash to “${this.hashType.hashFunction()({ id: 'ada' })}” and “${this.hashType.hashFunction()({ id: 'ada' })}”, so a consumer can match their identity.</p>`;
            case 'inputMask': return html`<p class="computed">Allowed: “7” ${String(this.maskType.allowInputChar('7'))}, “.” ${String(this.maskType.allowInputChar('.'))}; blocked: “A” ${String(this.maskType.allowInputChar('A'))}. The native adapter does not enforce this during typing.</p>`;
            case 'label': return html`<p class="try">Change the expense type and watch the amount label.</p>${this.renderField('expenseType')}${this.renderField('dynamicAmount')}`;
            case 'maxColumnWidth': return this.renderWidth('maxColumnWidth');
            case 'maxLength': return this.renderValidation('shortCode');
            case 'minColumnWidth': return this.renderWidth('minColumnWidth');
            case 'minLength': return this.renderValidation('longCode');
            case 'multipleValues': return html`<p class="try">Hold Ctrl (Windows/Linux) or Command (macOS) to choose more than one option.</p>${this.renderField('skills')}`;
            case 'options': return html`<p class="try">Change Department; Assignee choices refresh.</p>${this.renderField('department')}${this.renderField('assignee')}`;
            case 'parser': return html`<p class="try">Edit the money field. The input is formatted as currency, while the raw stored value updates as you type.</p>${this.renderField('money')}<p class="computed">Raw stored value: <code>${this.record.getField('money')}</code></p>`;
            case 'placeholder': return html`${this.renderField('projectName')}`;
            case 'readOnly': return html`${this.renderField('fixedOwner')}`;
            case 'readOnlyWhen': return html`<p class="try">Choose Submitted to replace the owner input with printed text.</p>${this.renderField('phase')}${this.renderField('conditionalOwner')}`;
            case 'reducer': return html`<p class="computed">aggregate([1200, 800, 500]) → ${currency.format(this.reducerType.aggregate([1200, 800, 500]))}</p>`;
            case 'required': return this.renderValidation('requiredName');
            case 'requiredWhen': return html`<p class="try">Choose Yes, then check the empty notes.</p>${this.renderField('followUp')}${this.renderValidation('followUpNotes')}`;
            case 'rowClasses': return html`<p class="try">Only the Disputed row receives the <code>disputed-row</code> class.</p><fdl-table .recordset=${this.rowClassRecordset}><fdl-column field="status"></fdl-column><fdl-column field="owner"></fdl-column></fdl-table>`;
            case 'rowCount': return html`${this.renderField('comments')}`;
            case 'sortable': return html`<p class="computed">Sortable metadata: ${String((this.sortableType as any).properties.sortable)}. The disabled sort button represents the consuming table.</p><button type="button" disabled>Sort column</button>`;
            case 'targetColumnWidth': return this.renderWidth('targetColumnWidth');
            case 'template': return html`<p class="try">The stored value <code>1048</code> is rendered through the field template.</p><fdl-table .recordset=${this.templateRecordset}><fdl-column field="invoice"></fdl-column><fdl-column field="status"></fdl-column></fdl-table>`;
            case 'textAlign': return html`<p class="try">The columns demonstrate left, center, and right alignment.</p><fdl-table .recordset=${this.alignRecordset}><fdl-column field="left"></fdl-column><fdl-column field="center"></fdl-column><fdl-column field="right"></fdl-column></fdl-table>`;
            case 'type': return html`${this.renderField('dateType')}`;
            case 'validator': return this.renderValidation('projectCode');
            case 'visibleWhen': return html`<p class="try">Choose Pickup to remove Shipping address.</p>${this.renderField('fulfillment')}${this.renderField('address')}`;
        }
        return html``;
    }

    private renderEntry(entry: CatalogEntry) {
        const id = `modifier-${entry.name.toLowerCase()}`;
        const status = entry.demo ? 'live' : 'placeholder';
        return html`<article class="cookbook-recipe" data-modifier=${entry.name} data-status=${status} aria-labelledby=${id}>
            <div class="entry-heading">
                <code class="modifier-name">${entry.name}()</code>
                <span class="status ${status}">${status === 'live' ? 'Live example' : 'Placeholder'}</span>
            </div>
            <h3 id=${id}>${entry.intent}</h3>
            ${entry.demo
                ? html`<div class="demo">${this.renderDemo(entry.demo)}</div>${entry.snippet ? html`<details><summary>View the focused definition</summary><pre><code>${entry.snippet}</code></pre></details>` : nothing}`
                : html`<div class="placeholder-body"><p><strong>Intent:</strong> ${entry.intent}</p><p><strong>Why there is no live example:</strong> ${entry.limitation}</p></div>`}
        </article>`;
    }

    render() {
        return html`<section aria-labelledby="modifier-catalog-heading">
            <p class="eyebrow">Modifier cookbook</p>
            <h2 id="modifier-catalog-heading">Every modifier, alphabetically.</h2>
            <p class="lede">Each entry isolates one supported modifier. Live examples exercise behavior this repository can demonstrate honestly; placeholders document the intended contract and the missing path for everything else.</p>
            <p class="summary"><strong>${entries.filter(entry => entry.demo).length} live or computed examples</strong> · ${entries.filter(entry => !entry.demo).length} documented placeholders · ${entries.length} supported modifiers total</p>
            <div class="catalog">${entries.map(entry => this.renderEntry(entry))}</div>
        </section>`;
    }

    static styles = css`
        :host { display: block; color: #172033; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
        * { box-sizing: border-box; }
        h2, h3, p { margin-top: 0; }
        h2 { color: #111a31; font-family: Georgia, serif; font-size: clamp(2rem, 4vw, 3rem); font-weight: 500; letter-spacing: -.035em; margin-bottom: .6rem; }
        h3 { color: #111a31; font-family: Georgia, serif; font-size: 1.2rem; font-weight: 500; margin: .65rem 0 1rem; }
        .eyebrow { margin-bottom: .6rem; color: #5b52d6; font-size: .75rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
        .lede { max-width: 50rem; color: #586174; font-size: 1.05rem; line-height: 1.65; }
        .summary { color: #586174; font-size: .9rem; margin-bottom: 2rem; }
        .catalog { display: grid; gap: 1rem; }
        .cookbook-recipe { border: 1px solid #dfe3ee; border-radius: 1rem; background: #fff; box-shadow: 0 8px 24px rgba(34,45,78,.04); padding: 1.25rem; }
        .entry-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .modifier-name { border-radius: .35rem; background: #eeecff; color: #7657ff; font-size: .8rem; font-weight: 800; padding: .35rem .6rem; }
        .status { border-radius: 100px; font-size: .7rem; font-weight: 800; letter-spacing: .06em; padding: .3rem .55rem; text-transform: uppercase; }
        .status.live { background: #e8f7ef; color: #067647; } .status.placeholder { background: #f1f3f7; color: #586174; }
        .demo, .placeholder-body { border-radius: .75rem; background: #f7f8fc; padding: 1rem; }
        .placeholder-body { border-left: 4px solid #a7adbb; color: #4d5668; line-height: 1.55; }
        .placeholder-body p:last-child { margin-bottom: 0; }
        .try, .computed { color: #586174; font-size: .88rem; line-height: 1.55; }
        fdl-field { display: block; margin-bottom: .7rem; }
        button { border: 0; border-radius: .45rem; background: #10233f; color: white; cursor: pointer; font: inherit; font-weight: 700; padding: .65rem .9rem; }
        button:disabled { background: #aeb4c2; cursor: not-allowed; }
        .result { font-size: .85rem; font-weight: 700; margin: .7rem 0 0; }
        .result.valid { color: #067647; }
        details { margin-top: .8rem; border: 1px solid #dfe3ee; border-radius: .65rem; background: #101629; color: #d8def0; }
        summary { cursor: pointer; font-size: .8rem; font-weight: 700; padding: .7rem .85rem; }
        pre { overflow-x: auto; border-top: 1px solid #29314a; margin: 0; padding: .85rem; }
        pre code { color: #d8def0; font-size: .76rem; white-space: pre-wrap; }
        .width-table { border: 2px dashed #7657ff; border-radius: .4rem; overflow: hidden; }
        code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        @media (min-width: 58rem) { .catalog { grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; } }
    `;
}

customElements.define('fdl-modifier-catalog', FdlModifierCatalog);
