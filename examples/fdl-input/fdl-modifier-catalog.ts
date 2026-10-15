import { assigneeDirectory, optionsDelay } from './assignee-options';
import { compareShirtSizes, compareShirtSizesSource, shirtOrders } from './shirt-size-example';
import { weeklyExpenses, expenseHighlightThreshold } from './weekly-expenses';
import { exampleTheme } from './example-theme';
import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import FieldType from '../../field-type.js';
import Record from '../../record.js';
import Recordset from '../../recordset.js';
import './fdl-field';
import { inputText, valuePipeline } from './value-pipeline';
import { validatorCases, sortCases, prefixFilter, substringFilter } from './comparison-examples';
import { describeValue, recordSummary, tableSummary } from './model-summary';
import { keyed } from 'lit/directives/keyed.js';
import { explainDependency } from './dependency-explanation';
import './fdl-table';

type DemoName =
    | 'cellClass' | 'compareFunction' | 'conditionalCellClass'
    | 'defaultValue' | 'disabled' | 'disabledWhen' | 'emptyWhen'
    | 'filter' | 'formatter' | 'hashFunction'
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

export const modifierEntries: CatalogEntry[] = [
    live('cellClass', 'Adds a CSS class to every table cell for this field.', 'cellClass', `.cellClass('amount-cell')`),
    live('compareFunction', 'Defines how two field values are ordered.', 'compareFunction', `${compareShirtSizesSource}

new FieldType()
  .with.label('T-shirt size')
  .and.compareFunction(compareShirtSizes)`),
    live('conditionalCellClass', 'Adds a table-cell class when a value predicate passes.', 'conditionalCellClass', `.conditionalCellClass(value => value > this.probes.getField('classThreshold'), 'high-value')`),
    live('defaultValue', 'Defines the value Record.clear() restores for this field.', 'defaultValue', `.defaultValue('Untitled document')`),
    live('disabled', 'Makes a control visible but permanently unavailable for editing.', 'disabled', `.disabled()`),
    live('disabledWhen', 'Disables a control only while a record predicate is true.', 'disabledWhen', `.disabledWhen(record => record.getField('status') === 'approved')`),
    live('emptyWhen', 'Define when a value is considered empty.', 'emptyWhen', `.emptyWhen(value => value === 'N/A')`),
    live('filter', 'Makes a table column filterable and defines how text matches its values.', 'filter', `.filter((text, value) => value.toLowerCase().startsWith(text.toLowerCase()))`),
    live('formatter', 'Transforms a stored value for display without changing the model value.', 'formatter', `.formatter(value => currency.format(Number(value)))`),
    live('hashFunction', 'Defines stable identity for complex option values.', 'hashFunction', `.hashFunction(employee => employee.id)`),
    live('inputMask', 'Defines which individual typed characters a field accepts.', 'inputMask', `.inputMask(/[0-9.]/)`),
    live('label', 'Provides a static label or derives one from the current record.', 'label', `.label(record => \`Amount for \${record.getField('expenseType')}\`)`),
    live('maxColumnWidth', 'Sets the maximum width requested for a table column.', 'maxColumnWidth', `.maxColumnWidth(180)`),
    live('maxLength', 'Caps input length and adds equivalent record validation.', 'maxLength', `.maxLength(12)`),
    live('minColumnWidth', 'Sets the minimum width requested for a table column.', 'minColumnWidth', `.minColumnWidth(110)`),
    live('minLength', 'Sets a minimum input length and adds equivalent record validation.', 'minLength', `.minLength(4)`),
    live('multipleValues', 'Allows more than one option to be selected.', 'multipleValues', `.tag('select')
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
    static properties = { modifier: { type: String } };

    /** A focused view reuses the cookbook example without rendering the catalog. */
    modifier = '';

    private validatedFields = new Set<string>();
    private minimum = 4;
    private moneyInput?: string;
    private captureMoneyInput = {capture: true, handleEvent: (event: Event) => { this.moneyInput = inputText(event); this.requestUpdate(); }};
    private optionsDepartment = '';
    private assigneeChoices: {text: string; value: string}[] = [];
    private optionsLoading = false;

    private defaultRecord = new Record(
        { documentTitle: new FieldType().with.label('Document title').and.defaultValue('Untitled document') },
        { documentTitle: 'Quarterly plan' }
    );

    private record = new Record(
        {
            extraProperty: new FieldType().with.label('Extra property example'),
            lockedId: new FieldType().with.label('System ID').and.disabled(),
            approvalStatus: new FieldType().with.label('Approval status').and.tag('select').and.options([{ text: 'Draft', value: 'draft' }, { text: 'Approved', value: 'approved' }]),
            budget: new FieldType().with.label('Budget').and.type('number').and.disabledWhen(record => record.getField('approvalStatus') === 'approved'),
            emptyCode: new FieldType().with.label('Reference').and.emptyWhen(value => value === 'N/A').and.required(),
            optionalEmptyCode: new FieldType().with.label('Optional reference').and.emptyWhen(value => value === 'N/A'),
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
            assignee: new FieldType<any>().with.label('Assignee (function)').and.tag('select').and.options((record: any) => assigneeDirectory[record.getField('department')]),
            asyncAssignee: new FieldType<any>().with.label('Assignee (async function)').and.tag('select').and.options(async (record: any) => {
                const choices = assigneeDirectory[record.getField('department')];
                await new Promise(resolve => setTimeout(resolve, optionsDelay));
                return choices;
            }),
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
            emptyCode: 'N/A', optionalEmptyCode: 'N/A', hiddenSearch: '', expenseType: 'travel', dynamicAmount: '',
            money: 1000,
            shortCode: '', longCode: '', skills: ['design'], quantity: 2, total: 50, department: 'engineering', assignee: 'margaret', asyncAssignee: 'margaret',
            projectName: '', fixedOwner: 'Ada Lovelace', phase: 'draft', conditionalOwner: 'Ada Lovelace', requiredName: '',
            followUp: 'no', followUpNotes: '', comments: '', dateType: '', projectCode: '',
            fulfillment: 'ship', address: '',
        }
    );

    private filterRecordset = new Recordset(
        {
            name: new FieldType<string>().with
                .label('Name')
                .and.filter((text, value) => (this.probes.getField('matchRule') === 'contains' ? substringFilter : prefixFilter).match(text, value)),
            team: new FieldType().with.label('Team'),
        },
        [
            { name: 'Ada', team: 'Research' },
            { name: 'Grace', team: 'Platform' },
            { name: 'Margaret', team: 'Research' },
        ]
    );
    private hashType = new FieldType().with.hashFunction((employee: { id: string }) => employee.id);
    private cellClassRecordset = new Recordset(
        {
            amount: new FieldType().with.label('Amount').and.cellClass('amount-cell').and.textAlign('right'),
            category: new FieldType().with.label('Category'),
        },
        [{ amount: 42, category: 'Travel' }, { amount: 84, category: 'Meals' }]
    );
    private conditionalClassRecordset = new Recordset(
        {
            day: new FieldType().with.label('Day').and.sortable(false),
            amount: new FieldType().with.label('Expenses')
                .and.textAlign('right')
                .and.formatter(value => currency.format(Number(value)))
                .and.conditionalCellClass((value: number) => value > this.probes.getField('classThreshold'), 'high-value'),
        },
        weeklyExpenses.map(expense => ({...expense}))
    );
    private compareRecordset = new Recordset({
        firstName: new FieldType<string>().with.label('First name')
            .and.compareFunction((left, right) => Math.sign(left.localeCompare(right)) as -1 | 0 | 1),
        lastName: new FieldType<string>().with.label('Last name')
            .and.compareFunction((left, right) => Math.sign(left.localeCompare(right)) as -1 | 0 | 1),
        shirtSize: new FieldType<string>().with.label('T-shirt size').and.compareFunction(compareShirtSizes),
    }, shirtOrders.map(order => ({...order})));
    private sortableRecordset = new Recordset(
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
    private probes = new Record({
        classThreshold: new FieldType<number>().with.label('Daily Expense Limit').and.type('number').and.parser(Number),
        input: new FieldType<string>().with.label('Digits and periods').and.inputMask(/[0-9.]/),
        filterProbe: new FieldType<string>().with.label('Search names'),
        matchRule: new FieldType<string>().with.label('Filter matching rule').and.tag('select').and.options([{text: 'Starts with', value: 'prefix'}, {text: 'Contains', value: 'contains'}]),
        firstId: new FieldType<string>().with.label('First employee ID'),
        secondId: new FieldType<string>().with.label('Second employee ID'),
        firstAmount: new FieldType<number>().with.label('First amount').and.type('number').and.parser(Number),
        secondAmount: new FieldType<number>().with.label('Second amount').and.type('number').and.parser(Number),
        thirdAmount: new FieldType<number>().with.label('Third amount').and.type('number').and.parser(Number),
    }, { classThreshold:expenseHighlightThreshold, filterProbe: 'ar', matchRule: 'prefix', input: '7.5', firstId: 'ada', secondId: 'ada', firstAmount: 1200, secondAmount: 800, thirdAmount: 500 });

    private get tableRecordsets(): { [name: string]: Recordset<any> } {
        return {
            cellClass: this.cellClassRecordset, conditionalCellClass: this.conditionalClassRecordset,
            compareFunction: this.compareRecordset, filter: this.filterRecordset,
            formatter: this.formatterRecordset, rowClasses: this.rowClassRecordset,
            template: this.templateRecordset, textAlign: this.alignRecordset,
            sortable: this.sortableRecordset, ...this.widthRecordsets,
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.record.addEventListener('change', this.onRecordChange);
        this.defaultRecord.addEventListener('change', this.onRecordChange);
        this.probes.addEventListener('change', this.onProbeChange);
        if (this.modifier === 'options') this.loadAssigneeChoices();
        new Set(Object.values(this.tableRecordsets)).forEach(table => table.addEventListener('page-changed', this.onRecordChange));
    }

    disconnectedCallback() {
        this.record.removeEventListener('change', this.onRecordChange);
        this.defaultRecord.removeEventListener('change', this.onRecordChange);
        this.probes.removeEventListener('change', this.onProbeChange);
        new Set(Object.values(this.tableRecordsets)).forEach(table => table.removeEventListener('page-changed', this.onRecordChange));
        super.disconnectedCallback();
    }

    private onRecordChange = () => {
        if (this.modifier === 'options') this.loadAssigneeChoices();
        this.requestUpdate();
    };
    private onProbeChange = () => {
        if (this.modifier === 'conditionalCellClass') {
            const threshold = this.probes.getField('classThreshold');
            void this.conditionalClassRecordset.requestUpdate();
            this.dispatchEvent(new CustomEvent('example-settings-change', {detail:{threshold}, bubbles:true, composed:true}));
        }

        if (this.modifier === 'filter') {
            const filterMode = this.probes.getField('matchRule') === 'contains' ? 'contains' : 'prefix';
            this.dispatchEvent(new CustomEvent('example-settings-change', {detail: {filterMode}, bubbles: true, composed: true}));
            this.filterRecordset.requestUpdate();
        }
        this.requestUpdate();
    };
    private async loadAssigneeChoices() {
        const department = this.record.getField('department');
        if (department === this.optionsDepartment) return;
        this.optionsDepartment = department;
        this.optionsLoading = true;
        this.requestUpdate();
        const choices = await this.record.fieldTypeForField('assignee').options(this.record) as {text: string; value: string}[];
        if (department !== this.optionsDepartment) return;
        this.assigneeChoices = choices;
        this.optionsLoading = false;
        this.requestUpdate();
    }
    private selectionExplanation() {
        return html`<div class="selection-explanation" role="status">
            <p>Margaret Hamilton appears in both departments. Switching departments keeps her selected.</p>
            <p>Available choices: ${this.optionsLoading ? 'Loading…' : this.assigneeChoices.map(choice => `${choice.text} (${choice.value})`).join(', ')}.</p>
            ${(['assignee', 'asyncAssignee'] as const).map(field => {
                const selected = this.record.getField(field);
                const matches = this.assigneeChoices.some(choice => choice.value === selected);
                return html`<div data-selection=${field}>
                    <p>${field === 'assignee' ? 'Function' : 'Async function'} stored selection: <code>${selected || '(empty)'}</code>.</p>
                    ${this.optionsLoading ? nothing : html`<p>${!selected ? 'No assignee is selected.' : matches ? 'The stored assignee is among the available choices and is not reset when the list changes.' : 'The stored assignee is no longer among the available choices. Refreshing choices preserves the stored selection; the application decides whether to clear it.'}</p>`}
                    <button class="clear-selection" ?disabled=${!selected || this.optionsLoading} @click=${() => this.record.setField(field, '')}>Clear ${field === 'assignee' ? 'function' : 'async function'} selection</button>
                </div>`;
            })}
        </div>`;
    }

    private clearDefaultRecord = () => {
        this.defaultRecord.clear();
        this.requestUpdate();
    };

    private renderField(
        field: string,
        record: Record<any> = this.record,
        showValidationErrors = false
    ) {
        return keyed(record.fieldTypeForField(field), html`<fdl-field
            field=${field}
            .record=${record}
            .showValidationErrors=${showValidationErrors}
        ></fdl-field>`);
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
        const showValidationErrors = this.validatedFields.has(field);
        return html`${this.renderField(field, this.record, showValidationErrors)}
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
            <fdl-table show-width-diagnostics class="width-table" .recordset=${this.widthRecordsets[name]}>
                <fdl-column field="constrained"></fdl-column>
                <fdl-column field="flexible"></fdl-column>
            </fdl-table>`;
    }

    private renderDemo(name: DemoName): TemplateResult {
        switch (name) {
            case 'cellClass': return html`<p class="try">The Amount column is bold, blue, and highlighted because its cells receive the <code>amount-cell</code> class.</p><fdl-table .recordset=${this.cellClassRecordset}><fdl-column field="amount"></fdl-column><fdl-column field="category"></fdl-column></fdl-table>`;
            case 'compareFunction': {
                return html`<p class="try">Sort T-shirt size to order sizes from XS to XXL instead of alphabetically. First and last names use alphabetic order.</p>
                    <fdl-table .recordset=${this.compareRecordset}>
                        <fdl-column field="firstName"></fdl-column>
                        <fdl-column field="lastName"></fdl-column>
                        <fdl-column field="shirtSize"></fdl-column>
                    </fdl-table>${sortCases(this.compareRecordset)}`;
            }
            case 'conditionalCellClass': return html`${this.renderField('classThreshold', this.probes)}<fdl-table .recordset=${this.conditionalClassRecordset}><fdl-column field="day"></fdl-column><fdl-column field="amount"></fdl-column></fdl-table>`;
            case 'defaultValue': return html`${this.renderField('documentTitle', this.defaultRecord)}<button type="button" @click=${this.clearDefaultRecord}>Clear the record</button><p class="computed">Current record value: ${this.defaultRecord.getField('documentTitle')}</p>`;
            case 'disabled': return html`${this.renderField('lockedId')}`;
            case 'disabledWhen': return html`<p class="try">Choose Approved to disable Budget.</p>${this.renderField('approvalStatus')}${this.renderField('budget')}${explainDependency(this.record, 'budget', 'approvalStatus', `approvalStatus === 'approved'`, 'disabled')}`;
            case 'emptyWhen': return html`<p class="try">Both fields treat “N/A” as empty. Reference is required; Optional reference can be left empty.</p>${['emptyCode', 'optionalEmptyCode'].map(field => html`
                ${this.renderField(field)}
                <p class="computed" role="status" data-field=${field}>
                    ${this.record.fieldTypeForField(field).empty(this.record, field) ? 'This field is considered empty' : 'This field is not considered empty'}<br>
                    ${!this.record.isValid(field) ? 'Invalid: Reference is required.' : field === 'optionalEmptyCode' ? 'Valid: this field is optional.' : 'Valid: a reference has been provided.'}
                </p>`)}`;
            case 'filter': return html`<p class="try">Choose a matching rule and enter search text to filter the table.</p>${this.renderField('matchRule', this.probes)}${this.renderField('filterProbe', this.probes)}<fdl-table .recordset=${this.filterRecordset} .filters=${{name: this.probes.getField('filterProbe')}} @filters-changed=${(event: CustomEvent<{name?: string}>) => { const text = event.detail.name ?? ''; if (text !== this.probes.getField('filterProbe')) this.probes.setField('filterProbe', text); }}><fdl-column field="name"></fdl-column><fdl-column field="team"></fdl-column></fdl-table>`;
            case 'formatter': return html`<p class="try">The record stores <code>1250</code>; the table prints the formatted value.</p><fdl-table .recordset=${this.formatterRecordset}><fdl-column field="amount"></fdl-column><fdl-column field="invoice"></fdl-column></fdl-table>`;
            case 'hashFunction': return html`${this.renderField('firstId', this.probes)}${this.renderField('secondId', this.probes)}<p class="computed" role="status">Hash comparison: ${this.hashType.hashFunction()({ id: this.probes.getField('firstId') }) === this.hashType.hashFunction()({ id: this.probes.getField('secondId') }) ? 'same identity' : 'different identities'}. Separate objects match when their IDs match.</p>`;
            case 'inputMask': return html`${this.renderField('input', this.probes)}<p class="try">Only digits and periods are accepted. Other characters are ignored.</p>`;
            case 'label': return html`<p class="try">Change the expense type and watch the amount label.</p>${this.renderField('expenseType')}${this.renderField('dynamicAmount')}`;
            case 'maxColumnWidth': return this.renderWidth('maxColumnWidth');
            case 'maxLength': return html`${this.renderValidation('shortCode')}${this.modifier ? html`<button class="model-assignment" @click=${() => { this.record.setField('shortCode', 'THIS-CODE-IS-TOO-LONG'); this.validateField('shortCode'); }}>Assign an overlong model value</button>` : nothing}`;
            case 'minColumnWidth': return this.renderWidth('minColumnWidth');
            case 'minLength': return html`<label>Minimum length <select class="minimum-rule" .value=${String(this.minimum)} @change=${(event: Event) => {
                this.minimum = Number((event.target as HTMLSelectElement).value);
                this.record.addField('longCode', new FieldType().with.label('Access code').and.minLength(this.minimum), this.record.getField('longCode'));
                this.dispatchEvent(new CustomEvent('example-settings-change', { detail: {minimum: this.minimum}, bubbles: true, composed: true }));
                this.requestUpdate();
            }}>${[2, 4, 8].map(value => html`<option value=${value}>${value} characters</option>`)}</select></label>${this.renderValidation('longCode')}`;
            case 'multipleValues': return html`<p class="try">Hold Ctrl (Windows/Linux) or Command (macOS) to choose more than one option.</p>${this.renderField('skills')}`;
            case 'options': return html`<p class="try">Change Department; Assignee choices refresh.</p>${this.renderField('department')}${this.renderField('assignee')}${this.renderField('asyncAssignee')}${this.selectionExplanation()}`;
            case 'parser': return html`<p class="try">Edit the money field. The stored number updates as you type; currency formatting is applied when you leave the field.</p><div @input=${this.captureMoneyInput}>${this.renderField('money')}</div><p class="computed">Raw stored value: <code>${this.record.getField('money')}</code></p>${valuePipeline(this.record, 'money', this.moneyInput)}`;
            case 'placeholder': return html`${this.renderField('projectName')}`;
            case 'readOnly': return html`${this.renderField('fixedOwner')}`;
            case 'readOnlyWhen': return html`<p class="try">Choose Submitted to replace the owner input with printed text.</p>${this.renderField('phase')}${this.renderField('conditionalOwner')}${explainDependency(this.record, 'conditionalOwner', 'phase', `phase === 'submitted'`, 'readonly')}`;
            case 'reducer': return html`${['firstAmount', 'secondAmount', 'thirdAmount'].map(field => this.renderField(field, this.probes))}<p class="computed" role="status">Sum: ${currency.format(this.reducerType.aggregate([this.probes.getField('firstAmount'), this.probes.getField('secondAmount'), this.probes.getField('thirdAmount')]))}</p>`;
            case 'required': return this.renderValidation('requiredName');
            case 'requiredWhen': return html`<p class="try">Choose Yes, then check the empty notes.</p>${this.renderField('followUp')}${this.renderValidation('followUpNotes')}${explainDependency(this.record, 'followUpNotes', 'followUp', `followUp === 'yes'`, 'required')}`;
            case 'rowClasses': return html`<p class="try">Only the Disputed row receives the <code>disputed-row</code> class.</p><fdl-table .recordset=${this.rowClassRecordset}><fdl-column field="status"></fdl-column><fdl-column field="owner"></fdl-column></fdl-table>`;
            case 'rowCount': return html`${this.renderField('comments')}`;
            case 'sortable': return html`<p class="try">First name and Last name can sort. Team has .sortable(false), so its header has no sort action.</p><fdl-table .recordset=${this.sortableRecordset}><fdl-column field="firstName"></fdl-column><fdl-column field="lastName"></fdl-column><fdl-column field="team"></fdl-column></fdl-table>`;
            case 'targetColumnWidth': return this.renderWidth('targetColumnWidth');
            case 'template': return html`<p class="try">The stored value <code>1048</code> is rendered through the field template.</p><fdl-table .recordset=${this.templateRecordset}><fdl-column field="invoice"></fdl-column><fdl-column field="status"></fdl-column></fdl-table>`;
            case 'textAlign': return html`<p class="try">The columns demonstrate left, center, and right alignment.</p><fdl-table .recordset=${this.alignRecordset}><fdl-column field="left"></fdl-column><fdl-column field="center"></fdl-column><fdl-column field="right"></fdl-column></fdl-table>`;
            case 'type': return html`${this.renderField('dateType')}`;
            case 'validator': return html`${this.renderValidation('projectCode')}${validatorCases(this.record.fieldTypeForField('projectCode'))}`;
            case 'visibleWhen': return html`<p class="try">Choose Pickup to remove Shipping address.</p>${this.renderField('fulfillment')}${this.renderField('address')}`;
        }
        return html``;
    }

    private focusedState(name: string): unknown {
        const fields: { [name: string]: string[] } = {
            disabled: ['lockedId'], disabledWhen: ['approvalStatus', 'budget'], emptyWhen: ['emptyCode', 'optionalEmptyCode'],
            label: ['expenseType', 'dynamicAmount'], maxLength: ['shortCode'], minLength: ['longCode'],
            multipleValues: ['skills'], options: ['department', 'assignee', 'asyncAssignee'], parser: ['money'],
            placeholder: ['projectName'], readOnly: ['fixedOwner'], readOnlyWhen: ['phase', 'conditionalOwner'],
            required: ['requiredName'], requiredWhen: ['followUp', 'followUpNotes'], rowCount: ['comments'],
            type: ['dateType'], validator: ['projectCode'], visibleWhen: ['fulfillment', 'address'],
        };
        if (fields[name]) return Object.fromEntries(fields[name].map(field => [field, this.record.getField(field as keyof typeof this.record.values)]));
        if (name === 'defaultValue') return this.defaultRecord.values;
        if (name === 'hashFunction') return { firstObject: { id: this.probes.getField('firstId') }, secondObject: { id: this.probes.getField('secondId') } };
        if (name === 'inputMask') return {input: this.probes.getField('input')};
        if (name === 'reducer') return { values: (['firstAmount', 'secondAmount', 'thirdAmount'] as const).map(field => this.probes.getField(field)), sum: this.reducerType.aggregate((['firstAmount', 'secondAmount', 'thirdAmount'] as const).map(field => this.probes.getField(field))) };
        const table = this.tableRecordsets[name];
        return table ? {
            visibleRows: table.currentPage.map(record => record.values),
            totalRecords: table.allRecords.length,
            sortColumns: table.sortColumns,
        } : undefined;
    }

    private stateSummary(name: string) {
        const table = this.tableRecordsets[name];
        if (table) return tableSummary(table);
        if (name === 'defaultValue') return recordSummary(this.defaultRecord);
        if (name === 'inputMask') return recordSummary(this.probes, ['input']);
        const state = this.focusedState(name);
        if (state && !['hashFunction', 'reducer'].includes(name)) return recordSummary(this.record, Object.keys(state as object));
        if (name === 'reducer') return html`<p class="state-summary">Three values aggregate to ${currency.format(this.reducerType.aggregate((['firstAmount', 'secondAmount', 'thirdAmount'] as const).map(field => this.probes.getField(field))))}.</p>`;
        return html`<p class="state-summary">${describeValue(state)}</p>`;
    }

    render() {
            const entry = modifierEntries.find(entry => entry.name === this.modifier);
            if (!entry) return nothing;
            return html`<div class=${`focused ${['cellClass', 'compareFunction', 'conditionalCellClass', 'filter', 'formatter', 'maxColumnWidth', 'minColumnWidth', 'rowClasses', 'sortable', 'targetColumnWidth', 'template', 'textAlign'].includes(entry.name) || !entry.demo ? 'full-width' : ''}`} data-modifier=${entry.name}>
                ${entry.demo ? html`<div class="focused-demo">${this.renderDemo(entry.demo)}</div><div class="focused-state"><p class="state-label">${['hashFunction', 'reducer'].includes(entry.name) ? 'MODEL EXERCISE' : this.tableRecordsets[entry.name] ? 'IN THE RECORDSET' : 'IN THE RECORD'}</p>${this.stateSummary(entry.name)}<details><summary>Inspect full JSON</summary><pre>${JSON.stringify(this.focusedState(entry.name), null, 2)}</pre></details></div>`
                : html`<div class="limitation"><strong>Adapter support needed</strong><p>${entry.limitation}</p><p>This page documents the contract; it does not simulate an unsupported control.</p></div>`}
            </div>`;
    }

    static styles = css`
        :host { display: block; container-type:inline-size; color: #172033; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
        * { box-sizing: border-box; }
        :host([modifier]) { color: #0f172a; font-family: Arial, Helvetica, sans-serif; }
        .focused fdl-table { --fdl-table-label-font-size: 1rem; --fdl-table-control-font-size: 1rem; }
        .focused { display: grid; grid-template-columns: minmax(0,1fr); gap: 25px; align-items: start; }
        .focused.full-width { grid-template-columns: minmax(0,1fr); }
        @container(min-width:760px) { .focused:not(.full-width) { grid-template-columns:minmax(0,1.1fr) minmax(0,1fr); } }
        .focused-demo > .try:first-child { display: none; }
        .focused-demo { min-width: 0; overflow-x: auto; }
        .focused[data-modifier="multipleValues"] .focused-demo { overflow:visible; }
        .focused-demo fdl-field { --label: .875rem; --field-control-font-size: 1rem; --field-label-width: 100%; --field-control-width: 100%; font-size: 1.125rem; }
        .focused .try, .focused .computed { color: #475569; font-size: 1.125rem; line-height: 1.8; }
        .focused button { min-height:48px; background:#2563eb; font-size:1rem; font-weight:600; line-height:1.5; }
        summary { cursor:pointer; min-height:44px; padding:8px 0; }
        summary:focus-visible { outline:3px solid #2563eb; outline-offset:3px; }
        .focused pre { padding: 0; border: 0; font: 1rem/1.7 monospace; white-space: pre-wrap; overflow-wrap: anywhere; max-height: 18rem; overflow: auto; }
        .limitation { padding: 20px; border-left: 3px solid #2563eb; background: #eff6ff; font-size: 1.125rem; line-height: 1.8; }
        .case-comparison { margin-top:24px; }
        .case-comparison table, table.case-comparison { border-collapse:collapse; width:100%; font-size:1rem; }
        .case-comparison th,.case-comparison td { padding:8px; text-align:left; border-bottom:1px solid #cbd5e1; overflow-wrap:anywhere; }
        caption { text-align:left; font-weight:bold; padding:8px 0; }
        .comparison-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; }
        h4 { margin:8px 0; }
        .model-assignment { margin-top: 12px; }
        .probe-result { display: inline-block; margin-right: 12px; }
        select { font:inherit; min-height:44px; max-width:100%; }
        button:focus-visible,select:focus-visible { outline: 3px solid #2563eb; outline-offset: 3px; }
        p { margin-top: 0; }
        button { border: 0; border-radius: .45rem; color: white; cursor: pointer; font: inherit; padding: .65rem .9rem; }
        button:disabled { background: #aeb4c2; cursor: not-allowed; }
        .result { font-size: 1rem; font-weight: 700; margin: .7rem 0 0; }
        .result.valid { color: #067647; }
        .width-table { border: 2px dashed #2563eb; border-radius: .4rem; overflow: hidden; }
        code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        ${exampleTheme}
    `;
}

customElements.define('fdl-modifier-catalog', FdlModifierCatalog);
