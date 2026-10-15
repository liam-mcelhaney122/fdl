import { modifierSignatures } from './modifier-signatures';
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
const modifierCall = new RegExp(`\\s*\\.(?=(?:${Object.keys(modifierSignatures).join('|')})\\()`, 'g');
const type = (chain: string) => `field\n    .${chain}`;
const currency = `const currency = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
});`;
const choose = (label: string, choices: string[][]) => type(`label('${label}').tag('select').options(${JSON.stringify(choices.map(([text,value]) => ({text,value})), null, 2)})`);
const peopleFields = {
    firstName: type("label('First name').compareFunction((a, b) => a.localeCompare(b))"),
    lastName: type("label('Last name').compareFunction((a, b) => a.localeCompare(b))"),
};

/** Complete model declarations paired with the bindings in modifier-example-markup. */
function modelFor(name: string, settings: ExampleSettings): Model {
    const records: {[key: string]: Model} = {
        required: {name:'person', fields:{name:type(`label('Legal name')${settings.required === false ? '' : '.required()'}`),followUp:choose('Follow-up needed?',[['No','no'],['Yes','yes']]),followUpNotes:type("label('Follow-up notes').tag('textarea').rowCount(2).required((_value, record) => record.getField('followUp') === 'yes')")}, values:{name:'',followUp:'no',followUpNotes:''}, prefix: settings.required === false ? '// The required rule is removed; the field is optional. Follow-up notes keep their conditional rule.' : undefined},
        formatter: {name:'money', prefix:currency, fields:{amount:type(`label('Amount').type('number')
    .parser(value => Number(value))
    .formatter((value, record, context) =>
      context === 'input-focus' ? String(value) : currency.format(value))`)}, values:{amount:1250}},
        visibleWhen: {name:'delivery', fields:{fulfillment:choose('Delivery method', [['Ship to address','ship'],['Pick up in person','pickup']]), address:type("label('Shipping address').visibleWhen((_value, record) => record.getField('fulfillment') === 'ship')")}, values:{fulfillment:'ship',address:'42 Orchard Street'}},
        defaultValue: {name:'defaultRecord',fields:{documentTitle:type("label('Document title').defaultValue('Untitled document')")},values:{documentTitle:'Quarterly plan'}},
        disabled: {name:'record',fields:{lockedId:type("label('System ID').disabled()"),approvalStatus:choose('Approval status',[['Draft','draft'],['Approved','approved']]),budget:type("label('Budget').type('number').disabled((_value, record) => record.getField('approvalStatus') === 'approved')")},values:{lockedId:'SYS-77',approvalStatus:'draft',budget:5000}},
        emptyWhen: {name:'record',fields:{emptyCode:type("label('Reference').emptyWhen(value => value === 'N/A').required()"),optionalEmptyCode:type("label('Optional reference').emptyWhen(value => value === 'N/A')")},values:{emptyCode:'N/A',optionalEmptyCode:'N/A'}},
        label: {name:'record',fields:{expenseType:choose('Expense type',[['Travel','travel'],['Equipment','equipment']]),dynamicAmount:type("label((_value, record) => `Amount for ${record.getField('expenseType')}`).type('number')")},values:{expenseType:'travel',dynamicAmount:''}},
        maxLength: {name:'record',fields:{shortCode:type("label('Short code').maxLength(12)")},values:{shortCode:''}},
        minLength: {name:'record',fields:{longCode:type(`label('Access code').minLength(${settings.minimum ?? 4})`)},values:{longCode:''}},
        multipleValues: {name:'record',fields:{skills:type(`label('Skills').tag('select').multipleValues().options([
    { text: 'Design', value: 'design' },
    { text: 'Engineering', value: 'engineering' },
    { text: 'Research', value: 'research' },
  ])`)},values:{skills:['design']}},
        options: {name:'record',prefix:`const directory = ${JSON.stringify(assigneeDirectory, null, 2)};`,fields:{
            department:choose('Department',[['Engineering','engineering'],['Finance','finance']]),
            assignee:type(`label('Assignee (function)').tag('select').options(record =>
      directory[record.getField('department')]
    )`),
            asyncAssignee:type(`label('Assignee (async function)').tag('select').options(async record => {
      const choices = directory[record.getField('department')];
      // Simulate an asynchronous directory lookup.
      await new Promise(resolve => setTimeout(resolve, ${optionsDelay}));
      return choices;
    })`),
        },values:{department:'engineering',assignee:'margaret',asyncAssignee:'margaret'}},
        parser: {name:'record',prefix:currency,fields:{money:type(`label('Money')
    .formatter(value => currency.format(Number(value)))
    .parser(value => Number(String(value).replace(/[$,]/g, '')))` )},values:{money:1000}},
        placeholder: {name:'record',fields:{projectName:type("label('Project name').placeholder('For example, Apollo migration')")},values:{projectName:''}},
        readOnly: {name:'record',fields:{fixedOwner:type("label('Owner').readOnly()")},values:{fixedOwner:'Ada Lovelace'}},
        readOnlyWhen: {name:'record',fields:{phase:choose('Phase',[['Draft','draft'],['Submitted','submitted']]),conditionalOwner:type("label('Request owner').readOnlyWhen((_value, record) => record.getField('phase') === 'submitted')")},values:{phase:'draft',conditionalOwner:'Ada Lovelace'}},
        rowCount: {name:'record',prefix:'// Deprecated: textarea sizing belongs in fdl-field, not FieldType.\n// This example preserves the existing modifier for compatibility.',fields:{comments:type(`label('Comments').tag('textarea').rowCount(${settings.rows ?? 4})`)},values:{comments:''}},
        type: {name:'record',fields:{inputValue:type(`label('Example: ${settings.inputType ?? 'text'}').type('${settings.inputType ?? 'text'}')${inputTypeNeedsNumber(settings.inputType ?? 'text') ? '.parser(Number)' : ''}`)},values:{inputValue:inputTypeInitialValue(settings.inputType ?? 'text')}},
        validator: {name:'record',fields:{
            email:type(`label('Email address').type('email').validator({
      name: 'must be a valid email address',
      validate: value => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(value)),
    })`),
            orderQuantity:type(`label('Order quantity').type('number').parser(Number)
    .validator({name: 'must be a whole number', validate: value => Number.isInteger(value)})
    .validator({name: 'must be between 1 and 12', validate: value => value >= 1 && value <= 12})`),
            username:type(`label('Username')
    .validator({name: 'must start with a letter', validate: value => /^[A-Za-z]/.test(String(value))})
    .validator({name: 'must contain only letters, numbers, or underscores', validate: value => /^[A-Za-z0-9_]+$/.test(String(value))})`),
        },values:{email:'ada@',orderQuantity:2.5,username:'7bad-name'}},
        hashFunction: {name:'probes',prefix:"const employees = new Record({\n  employee: field.hashFunction(employee => employee.id),\n}, {});\nconst hashType = employees.fieldTypeForField('employee');",fields:{firstId:type("label('First employee ID')"),secondId:type("label('Second employee ID')")},values:{firstId:'ada',secondId:'ada'}},
        inputMask: {name:'probes',fields:{input:type("label('Digits and periods').inputMask(/[0-9.]/)")},values:{input:'7.5'}},
        reducer: {name:'probes',prefix:`${currency}\n\nconst totals = new Record({ amount: field.reducer('sum') }, {});\nconst reducerType = totals.fieldTypeForField('amount');`,fields:Object.fromEntries(['first','second','third'].map((word,index) => [`${word}Amount`, type(`label('${['First','Second','Third'][index]} amount').type('number').parser(Number)`)])),values:{firstAmount:1200,secondAmount:800,thirdAmount:500}},
    };
    if (records[name]) return records[name];
    const tables: {[key: string]: Model} = {
        cellClass: {name:'cellClassRecordset',prefix:currency,fields:{day:type("label('Day').sortable(false)"),amount:type(`label('Expenses').textAlign('right').formatter(value => currency.format(Number(value))).cellClass('amount-cell').cellClass(value => value > ${settings.threshold ?? expenseHighlightThreshold} ? ['high-value', 'over-limit'] : [])`)},values:weeklyExpenses},
        compareFunction: {name:'compareRecordset',prefix:compareShirtSizesSource,fields:{firstName:peopleFields.firstName,lastName:peopleFields.lastName,shirtSize:type("label('T-shirt size').compareFunction(compareShirtSizes)")},values:shirtOrders},
        sortable: {name:'compareRecordset',fields:{...peopleFields,shirtSize:type("label('T-shirt size').sortable(false)")},values:shirtOrders},
        filter: {name:'filterRecordset',fields:{name:type(`label('Name').filter((text, value) =>
    value.toLowerCase().${settings.filterMode === 'contains' ? 'includes' : 'startsWith'}(text.toLowerCase()))`),team:type("label('Team')")},values:[{name:'Ada',team:'Research'},{name:'Grace',team:'Platform'},{name:'Margaret',team:'Research'}]},
        rowClass: {name:'rowClassRecordset',fields:{status:type("label('Status').rowClass('invoice-row').rowClass(value => value === 'Disputed' ? ['disputed-row', 'needs-review'] : [])"),owner:type("label('Owner')")},values:[{status:'Disputed',owner:'Ada'},{status:'Paid',owner:'Grace'}]},
        template: {name:'templateRecordset',prefix:currency,fields:{invoice:type("label('Invoice')"),balance:type(`label('Balance').type('number').parser(Number)
    .textAlign('right')
    .formatter((value, record, context) =>
      context === 'input-focus' ? String(value) : currency.format(Number(value)))
    .template((formattedBalance, record) => record.getField('balance') === 0
      ? html\`<span class="paid-balance">✓ Paid in full</span>\`
      : html\`<span class="due-balance"><strong>\${formattedBalance}</strong><small>Payment due</small></span>\`)`)},values:[{invoice:'1048',balance:1250},{invoice:'1049',balance:0},{invoice:'1050',balance:85.5}]},
        textAlign: {name:'alignRecordset',fields:Object.fromEntries(['left','center','right'].map(value => [value,type(`label('${value[0].toUpperCase()+value.slice(1)}').textAlign('${value}')`)])),values:[{left:'Ada',center:'Ada',right:'Ada'},{left:'Grace',center:'Grace',right:'Grace'}]},
    };
    if (tables[name]) return {...tables[name],kind:'Recordset'};
    const widths: {[key: string]: [label: string, chain: string, text: string]} = {
        maxColumnWidth:['Maximum (180px)', '.minColumnWidth(80).maxColumnWidth(180)', 'Stops growing at 180px'],
        minColumnWidth:['Minimum (110px)', '.minColumnWidth(110)', 'Stops shrinking at 110px'],
        targetColumnWidth:['Preferred (140px)', '.minColumnWidth(80).targetColumnWidth(140).maxColumnWidth(220)', 'Preferred width: 140px'],
    };
    if (widths[name]) {
        const [label,chain,text] = widths[name];
        return {name:'widthRecordset',kind:'Recordset',fields:{constrained:type(`label('${label}')${chain}`),flexible:type("label('Flexible').minColumnWidth(80)")},values:[{constrained:text,flexible:'Makes up the difference'}]};
    }
    const contracts: {[key: string]: string} = {
        range:'range()',
        search:"search({ title: 'Find a person', columns: [{ label: 'Name', field: 'name' }] })",
    };
    if (contracts[name]) return {name:'record',fields:{value:type(`label('Adapter value').${contracts[name]}`)},values:{value:null}};
    throw new Error(`Missing complete example for ${name}`);
}

const validationFields: {[key: string]: string} = {required:'name',maxLength:'shortCode',minLength:'longCode'};
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
    const definition = `${name === 'template' ? "import { html } from 'lit';\n" : ''}import { field, ${kind} } from 'digital-fdl';\n\n${model.prefix ? `${model.prefix}\n\n` : ''}const ${model.name} = new ${kind}({\n${Object.entries(model.fields).map(([key,value]) => `  ${key}: ${value.replace(modifierCall, '\n    .')},`).join('\n')}\n}, ${JSON.stringify(model.values, null, 2)});\n\nexport { ${exports.join(', ')} };`;
    let markup = exampleMarkup(name);
    let setup = '';
    const validation = validationFields[name];
    if (validation && markup) {
        setup = 'let checked = false;\n';
        markup = markup.replace(`field="${validation}"`, `field="${validation}"\n  .showValidationErrors=\${checked}`);
        markup += `\n\n<button @click=\${() => { checked = true; update(); }}>\n  ${name === 'required' ? 'Check record' : 'Check value'}\n</button>\n<p role="status">\n  \${checked ? (${model.name}.isValid('${validation}')\n    ? 'Valid.' : ${model.name}.readableFieldErrors('${validation}').join('. '))\n    : 'Validation message has not been shown.'}\n</p>`;
    }
    if (name === 'required' && markup) {
        markup = markup.replace('field="followUpNotes"', 'field="followUpNotes"\n  .showValidationErrors=${checked}');
        markup = markup.replace("person.isValid('name')", 'person.isValid()')
            .replace("person.readableFieldErrors('name')", 'person.readableRecordErrors()');
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
    const adapters = exampleTables[name] ? "import './fdl-table';\n" : exampleFields[name] ? "import './fdl-field';\n" : '';
    const ui = `import { html, render } from 'lit';\nimport { ${exports.join(', ')} } from './${modelFile}';\n${adapters}\nconst container = document.createElement('div');\ndocument.body.append(container);\n${setup}\nconst view = () => html\`\n${markup!.split('\n').map(line => `  ${line}`).join('\n')}\n\`;\n\nconst update = () => render(view(), container);\n${model.name}.addEventListener('${kind === 'Recordset' ? 'page-changed' : 'change'}', update);\nupdate();`;
    const fieldStyles = name === 'disabled';
    const styles = (fieldStyles ? disabledFieldStyles : tableExampleStyles[name as keyof typeof tableExampleStyles])?.cssText.trim();
    const stylesComponent = fieldStyles ? 'fdl-field' : 'fdl-table';
    return {definition, ui, styles, stylesComponent, modelFile, uiFile, modelName:model.name, fields:Object.keys(model.fields), kind, contract};
}
