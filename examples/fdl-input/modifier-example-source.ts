import { validatorExamples } from './validator-examples';
import { inputTypeInitialValue, inputTypeNeedsNumber } from './input-type-example';
import type { inputType } from '../../types/input-types.types';
import { assigneeDirectory, optionsDelay } from './assignee-options';
import { shirtOrders, compareShirtSizesSource } from './shirt-size-example';
import { weeklyExpenses, expenseHighlightThreshold } from './weekly-expenses';
import { disabledFieldStyles } from './field-example-styles';
import { tableExampleStyles } from './table-example-styles';
import { exampleFields, exampleTables, exampleMarkup } from './modifier-example-markup';

export type ExampleSettings = { required?: boolean; minimum?: number; rows?: number; inputType?: inputType; filterMode?: 'prefix' | 'contains'; threshold?: number };
type Model = { name: string; fields: {[key: string]: string}; values: object; kind?: 'Recordset'; prefix?: string };
const type = (chain: string) => `new FieldType()\n    .with.${chain}`;
const currency = `const currency = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
});`;
const choose = (label: string, choices: string[][]) => type(`label('${label}').and.tag('select').and.options(${JSON.stringify(choices.map(([text,value]) => ({text,value})), null, 2)})`);
const peopleFields = {
    firstName: type("label('First name').and.compareFunction((a, b) => a.localeCompare(b))"),
    lastName: type("label('Last name').and.compareFunction((a, b) => a.localeCompare(b))"),
};

/** Complete model declarations paired with the bindings in modifier-example-markup. */
function modelFor(name: string, settings: ExampleSettings): Model {
    const records: {[key: string]: Model} = {
        required: {name:'person', fields:{name:type(`label('Legal name')${settings.required === false ? '' : '.and.required()'}`)}, values:{name:''}, prefix: settings.required === false ? '// The required rule is removed; the field is optional.' : undefined},
        formatter: {name:'money', prefix:currency, fields:{amount:type(`label('Amount').and.type('number')
    .and.parser(value => Number(value))
    .and.formatter((value, record, context) =>
      context === 'input-focus' ? String(value) : currency.format(value))`)}, values:{amount:1250}},
        visibleWhen: {name:'delivery', fields:{fulfillment:choose('Delivery method', [['Ship to address','ship'],['Pick up in person','pickup']]), address:type("label('Shipping address').and.visibleWhen(record => record.getField('fulfillment') === 'ship')")}, values:{fulfillment:'ship',address:'42 Orchard Street'}},
        defaultValue: {name:'defaultRecord',fields:{documentTitle:type("label('Document title').and.defaultValue('Untitled document')")},values:{documentTitle:'Quarterly plan'}},
        disabled: {name:'record',fields:{lockedId:type("label('System ID').and.disabled()")},values:{lockedId:'SYS-77'}},
        disabledWhen: {name:'record',fields:{approvalStatus:choose('Approval status',[['Draft','draft'],['Approved','approved']]),budget:type("label('Budget').and.type('number').and.disabledWhen(record => record.getField('approvalStatus') === 'approved')")},values:{approvalStatus:'draft',budget:5000}},
        emptyWhen: {name:'record',fields:{emptyCode:type("label('Reference').and.emptyWhen(value => value === 'N/A').and.required()"),optionalEmptyCode:type("label('Optional reference').and.emptyWhen(value => value === 'N/A')")},values:{emptyCode:'N/A',optionalEmptyCode:'N/A'}},
        label: {name:'record',fields:{expenseType:choose('Expense type',[['Travel','travel'],['Equipment','equipment']]),dynamicAmount:type("label(record => `Amount for ${record.getField('expenseType')}`).and.type('number')")},values:{expenseType:'travel',dynamicAmount:''}},
        maxLength: {name:'record',fields:{shortCode:type("label('Short code').and.maxLength(12)")},values:{shortCode:''}},
        minLength: {name:'record',fields:{longCode:type(`label('Access code').and.minLength(${settings.minimum ?? 4})`)},values:{longCode:''}},
        multipleValues: {name:'record',fields:{skills:type(`label('Skills').and.tag('select').and.multipleValues().and.options([
    { text: 'Design', value: 'design' },
    { text: 'Engineering', value: 'engineering' },
    { text: 'Research', value: 'research' },
  ])`)},values:{skills:['design']}},
        options: {name:'record',prefix:`const directory = ${JSON.stringify(assigneeDirectory, null, 2)};`,fields:{
            department:choose('Department',[['Engineering','engineering'],['Finance','finance']]),
            assignee:type(`label('Assignee (function)').and.tag('select').and.options(record =>
      directory[record.getField('department')]
    )`),
            asyncAssignee:type(`label('Assignee (async function)').and.tag('select').and.options(async record => {
      const choices = directory[record.getField('department')];
      // Simulate an asynchronous directory lookup.
      await new Promise(resolve => setTimeout(resolve, ${optionsDelay}));
      return choices;
    })`),
        },values:{department:'engineering',assignee:'margaret',asyncAssignee:'margaret'}},
        parser: {name:'record',prefix:currency,fields:{money:type(`label('Money')
    .and.formatter(value => currency.format(Number(value)))
    .and.parser(value => Number(String(value).replace(/[$,]/g, '')))` )},values:{money:1000}},
        placeholder: {name:'record',fields:{projectName:type("label('Project name').and.placeholder('For example, Apollo migration')")},values:{projectName:''}},
        readOnly: {name:'record',fields:{fixedOwner:type("label('Owner').and.readOnly()")},values:{fixedOwner:'Ada Lovelace'}},
        readOnlyWhen: {name:'record',fields:{phase:choose('Phase',[['Draft','draft'],['Submitted','submitted']]),conditionalOwner:type("label('Request owner').and.readOnlyWhen(record => record.getField('phase') === 'submitted')")},values:{phase:'draft',conditionalOwner:'Ada Lovelace'}},
        requiredWhen: {name:'record',fields:{followUp:choose('Follow-up needed?',[['No','no'],['Yes','yes']]),followUpNotes:type("label('Follow-up notes').and.tag('textarea').and.rowCount(2).and.requiredWhen(record => record.getField('followUp') === 'yes')")},values:{followUp:'no',followUpNotes:''}},
        rowCount: {name:'record',fields:{comments:type(`label('Comments').and.tag('textarea').and.rowCount(${settings.rows ?? 4})`)},values:{comments:''}},
        type: {name:'record',fields:{inputValue:type(`label('Example: ${settings.inputType ?? 'text'}').and.type('${settings.inputType ?? 'text'}')${inputTypeNeedsNumber(settings.inputType ?? 'text') ? '.and.parser(Number)' : ''}`)},values:{inputValue:inputTypeInitialValue(settings.inputType ?? 'text')}},
        validator: {name:'record',fields:{
            email:type(`label('Email address').and.type('email').and.validator({
      name: 'must be a valid email address',
      validate: value => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(value)),
    })`),
            orderQuantity:type(`label('Order quantity').and.type('number').and.parser(Number)
    .and.validator({name: 'must be a whole number', validate: value => Number.isInteger(value)})
    .and.validator({name: 'must be between 1 and 12', validate: value => value >= 1 && value <= 12})`),
            username:type(`label('Username')
    .and.validator({name: 'must start with a letter', validate: value => /^[A-Za-z]/.test(String(value))})
    .and.validator({name: 'must contain only letters, numbers, or underscores', validate: value => /^[A-Za-z0-9_]+$/.test(String(value))})`),
        },values:{email:'ada@',orderQuantity:2.5,username:'7bad-name'}},
        hashFunction: {name:'probes',prefix:"const hashType = new FieldType()\n  .with.hashFunction(employee => employee.id);",fields:{firstId:type("label('First employee ID')"),secondId:type("label('Second employee ID')")},values:{firstId:'ada',secondId:'ada'}},
        inputMask: {name:'probes',fields:{input:type("label('Digits and periods').and.inputMask(/[0-9.]/)")},values:{input:'7.5'}},
        reducer: {name:'probes',prefix:`${currency}\n\nconst reducerType = new FieldType()\n  .with.reducer('sum');`,fields:Object.fromEntries(['first','second','third'].map((word,index) => [`${word}Amount`, type(`label('${['First','Second','Third'][index]} amount').and.type('number').and.parser(Number)`)])),values:{firstAmount:1200,secondAmount:800,thirdAmount:500}},
    };
    if (records[name]) return records[name];
    const tables: {[key: string]: Model} = {
        cellClass: {name:'cellClassRecordset',fields:{amount:type("label('Amount').and.cellClass('amount-cell').and.textAlign('right')"),category:type("label('Category')")},values:[{amount:42,category:'Travel'},{amount:84,category:'Meals'}]},
        conditionalCellClass: {name:'conditionalClassRecordset',prefix:currency,fields:{day:type("label('Day').and.sortable(false)"),amount:type(`label('Expenses').and.textAlign('right').and.formatter(value => currency.format(Number(value))).and.conditionalCellClass(value => value > ${settings.threshold ?? expenseHighlightThreshold}, 'high-value')`)},values:weeklyExpenses},
        compareFunction: {name:'compareRecordset',prefix:compareShirtSizesSource,fields:{firstName:peopleFields.firstName,lastName:peopleFields.lastName,shirtSize:type("label('T-shirt size').and.compareFunction(compareShirtSizes)")},values:shirtOrders},
        sortable: {name:'compareRecordset',fields:{...peopleFields,shirtSize:type("label('T-shirt size').and.sortable(false)")},values:shirtOrders},
        filter: {name:'filterRecordset',fields:{name:type(`label('Name').and.filter((text, value) =>
    value.toLowerCase().${settings.filterMode === 'contains' ? 'includes' : 'startsWith'}(text.toLowerCase()))`),team:type("label('Team')")},values:[{name:'Ada',team:'Research'},{name:'Grace',team:'Platform'},{name:'Margaret',team:'Research'}]},
        rowClasses: {name:'rowClassRecordset',fields:{status:type("label('Status').and.rowClasses(value => value === 'Disputed' ? ['disputed-row'] : [])"),owner:type("label('Owner')")},values:[{status:'Disputed',owner:'Ada'},{status:'Paid',owner:'Grace'}]},
        template: {name:'templateRecordset',prefix:currency,fields:{invoice:type("label('Invoice')"),balance:type(`label('Balance').and.type('number').and.parser(Number)
    .and.textAlign('right')
    .and.formatter((value, record, context) =>
      context === 'input-focus' ? String(value) : currency.format(Number(value)))
    .and.template((formattedBalance, record) => record.getField('balance') === 0
      ? html\`<span class="paid-balance">✓ Paid in full</span>\`
      : html\`<span class="due-balance"><strong>\${formattedBalance}</strong><small>Payment due</small></span>\`)`)},values:[{invoice:'1048',balance:1250},{invoice:'1049',balance:0},{invoice:'1050',balance:85.5}]},
        textAlign: {name:'alignRecordset',fields:Object.fromEntries(['left','center','right'].map(value => [value,type(`label('${value[0].toUpperCase()+value.slice(1)}').and.textAlign('${value}')`)])),values:[{left:'Ada',center:'Ada',right:'Ada'},{left:'Grace',center:'Grace',right:'Grace'}]},
    };
    if (tables[name]) return {...tables[name],kind:'Recordset'};
    const widths: {[key: string]: [label: string, chain: string, text: string]} = {
        maxColumnWidth:['Maximum (180px)', '.and.minColumnWidth(80).and.maxColumnWidth(180)', 'Stops growing at 180px'],
        minColumnWidth:['Minimum (110px)', '.and.minColumnWidth(110)', 'Stops shrinking at 110px'],
        targetColumnWidth:['Preferred (140px)', '.and.minColumnWidth(80).and.targetColumnWidth(140).and.maxColumnWidth(220)', 'Preferred width: 140px'],
    };
    if (widths[name]) {
        const [label,chain,text] = widths[name];
        return {name:'widthRecordset',kind:'Recordset',fields:{constrained:type(`label('${label}')${chain}`),flexible:type("label('Flexible').and.minColumnWidth(80)")},values:[{constrained:text,flexible:'Makes up the difference'}]};
    }
    const contracts: {[key: string]: string} = {
        range:'range()',
        search:"search({ title: 'Find a person', columns: [{ label: 'Name', field: 'name' }] })",
    };
    if (contracts[name]) return {name:'record',fields:{value:type(`label('Adapter value').and.${contracts[name]}`)},values:{value:null}};
    throw new Error(`Missing complete example for ${name}`);
}

const validationFields: {[key: string]: string} = {required:'name',maxLength:'shortCode',minLength:'longCode',requiredWhen:'followUpNotes'};
export function exampleSource(name: string, settings: ExampleSettings = {}) {
    const model = modelFor(name, settings);
    const kind = model.kind ?? 'Record';
    const helpers: {[key: string]: string[]} = {
        hashFunction: ['hashType'],
        reducer: ['currency', 'reducerType'],
    };
    const exports = [model.name, ...(helpers[name] ?? [])];
    const modelFile = `${name}-model.js`;
    const uiFile = `${name}-view.js`;
    const definition = `${name === 'template' ? "import { html } from 'lit';\n" : ''}import { FieldType, ${kind} } from 'digital-fdl';\n\n${model.prefix ? `${model.prefix}\n\n` : ''}const ${model.name} = new ${kind}({\n${Object.entries(model.fields).map(([key,value]) => `  ${key}: ${value.replace(/\.and\./g, '\n    .and.')},`).join('\n')}\n}, ${JSON.stringify(model.values, null, 2)});\n\nexport { ${exports.join(', ')} };`;
    let markup = exampleMarkup(name);
    if (name === 'template') markup = `\${templateRecordset.allRecords[0] ? html\`
  <p>Edit the balance for invoice #1048. Set it to 0 to mark it paid.</p>
  <fdl-field .record=\${templateRecordset.allRecords[0]} field="balance"></fdl-field>
\` : ''}

${markup}`;
    let setup = '';
    const validation = validationFields[name];
    if (validation && markup) {
        setup = 'let checked = false;\n';
        markup = markup.replace(`field="${validation}"`, `field="${validation}"\n  .showValidationErrors=\${checked}`);
        markup += `\n\n<button @click=\${() => { checked = true; update(); }}>\n  ${name === 'required' ? 'Check record' : 'Check value'}\n</button>\n<p role="status">\n  \${checked ? (${model.name}.isValid('${validation}')\n    ? 'Valid.' : ${model.name}.readableFieldErrors('${validation}').join('. '))\n    : 'Validation message has not been shown.'}\n</p>`;
    }
    if (name === 'validator') {
        setup = 'const checked = new Set();\n';
        markup = validatorExamples.map(example => {
            const field = example.field;
            return `<section>\n  <h3>${example.title}</h3>\n  <p>${example.hint}</p>\n  <fdl-field .record=\${record} field="${field}"\n    .showValidationErrors=\${checked.has('${field}')}></fdl-field>\n  <button @click=\${() => { checked.add('${field}'); update(); }}>${example.button}</button>\n  <p role="status">\n    \${checked.has('${field}') ? (record.isValid('${field}')\n      ? 'Valid.' : record.readableFieldErrors('${field}').join('. ')) : 'Not checked yet.'}\n  </p>\n</section>`;
        }).join('\n\n');
    }
    if (name === 'emptyWhen') markup = ['emptyCode', 'optionalEmptyCode'].map(field =>
        `<fdl-field .record=\${record} field="${field}"></fdl-field>\n<p role="status" data-field="${field}">\n  \${record.fieldTypeForField('${field}').empty(record, '${field}')\n    ? 'This field is considered empty'\n    : 'This field is not considered empty'}<br>\n  \${!record.isValid('${field}')\n    ? 'Invalid: Reference is required.'\n    : '${field === 'optionalEmptyCode' ? 'Valid: this field is optional.' : 'Valid: a reference has been provided.'}'}\n</p>`
    ).join('\n\n');
    if (name === 'defaultValue') markup += '\n\n<button @click=${() => defaultRecord.clear()}>Clear the record</button>';
    if (name === 'maxLength') markup += `\n\n<button @click=\${() => {\n  checked = true;\n  record.setField('shortCode', 'THIS-CODE-IS-TOO-LONG');\n}}>Assign an overlong model value</button>`;

    if (name === 'parser') markup += `\n\n<p>Stored number: \${record.getField('money')}</p>`;
    if (name === 'hashFunction') markup += `\n\n<p role="status">\n  \${hashType.hashFunction()({ id: probes.getField('firstId') }) ===\n    hashType.hashFunction()({ id: probes.getField('secondId') })\n    ? 'Same identity' : 'Different identities'}\n</p>`;
    if (name === 'reducer') markup += `\n\n<p role="status">\n  Sum: \${currency.format(reducerType.aggregate([\n    probes.getField('firstAmount'),\n    probes.getField('secondAmount'),\n    probes.getField('thirdAmount'),\n  ]))}\n</p>`;
    const contract = !markup;
    if (contract) markup = `<p>This adapter does not implement .${name}().</p>\n<p>Stored value: \${JSON.stringify(record.getField('value'))}</p>`;
    const adapters = exampleTables[name] ? `import './fdl-table';\n${name === 'template' ? "import './fdl-field';\n" : ''}` : exampleFields[name] ? "import './fdl-field';\n" : '';
    const ui = `import { html, render } from 'lit';\nimport { ${exports.join(', ')} } from './${modelFile}';\n${adapters}\nconst container = document.createElement('div');\ndocument.body.append(container);\n${setup}\nconst view = () => html\`\n${markup!.split('\n').map(line => `  ${line}`).join('\n')}\n\`;\n\nconst update = () => render(view(), container);\n${model.name}.addEventListener('${kind === 'Recordset' ? 'page-changed' : 'change'}', update);\nupdate();`;
    const fieldStyles = name === 'disabled' || name === 'disabledWhen';
    const styles = (fieldStyles ? disabledFieldStyles : tableExampleStyles[name as keyof typeof tableExampleStyles])?.cssText.trim();
    const stylesComponent = fieldStyles ? 'fdl-field' : 'fdl-table';
    return {definition, ui, styles, stylesComponent, modelFile, uiFile, modelName:model.name, fields:Object.keys(model.fields), kind, contract};
}
