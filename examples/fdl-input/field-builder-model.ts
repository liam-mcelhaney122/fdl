import { field } from '../../index';
import Record from '../../record.js';
import type { exampleSource } from './modifier-example-source';
export type FieldSpec={name:string;initialValue:string;condition:string;visibility:'always'|'enabled';requiredness:'never'|'enabled'|'always';validation:'none'|'minimum'|'digits'};
export const defaultFieldSpec:FieldSpec={name:'notes',initialValue:'',condition:'enabled',visibility:'enabled',requiredness:'enabled',validation:'none'};
export function buildFieldRecord(spec:FieldSpec){
    let definition=field.label(spec.name);
    if(spec.visibility==='enabled')definition=definition.visibleWhen((_value, record) =>record.getField('condition')==='enabled');
    if(spec.requiredness==='always')definition=definition.required();
    if(spec.requiredness==='enabled')definition=definition.required((_value, record) =>record.getField('condition')==='enabled');
    if(spec.validation==='minimum')definition=definition.minLength(3);
    if(spec.validation==='digits')definition=definition.validator({name:'must contain digits only',validate:value=>value===''||/^\d+$/.test(value)});
    return new Record({condition:field.label('Condition').tag('select').options([{text:'Enabled',value:'enabled'},{text:'Disabled',value:'disabled'}]),[spec.name]:definition},{condition:spec.condition,[spec.name]:spec.initialValue});
}
export function builderSource(spec:FieldSpec):ReturnType<typeof exampleSource>{
    const field=JSON.stringify(spec.name);
    const definition=`import { field, Record } from 'digital-fdl';\n\nconst customRecord = new Record({\n  condition: field\n    .label('Condition').tag('select')\n    .options([{text:'Enabled',value:'enabled'},{text:'Disabled',value:'disabled'}]),\n  ${field}: field\n    .label(${field})${spec.visibility==='enabled'?"\n    .visibleWhen((_value, record) => record.getField('condition') === 'enabled')":''}${spec.requiredness==='always'?'\n    .required()':spec.requiredness==='enabled'?"\n    .required((_value, record) => record.getField('condition') === 'enabled')":''}${spec.validation==='minimum'?'\n    .minLength(3)':spec.validation==='digits'?"\n    .validator({name:'must contain digits only', validate:value => value === '' || /^\\d+$/.test(value)})":''},\n}, ${JSON.stringify({condition:spec.condition,[spec.name]:spec.initialValue},null,2)});\n\nexport { customRecord };`;
    const ui=`import { html, render } from 'lit';\nimport { customRecord } from './custom-field-model.js';\nimport './fdl-field';\n\nconst container = document.createElement('div');\ndocument.body.append(container);\nconst update = () => render(html\`\n  <fdl-field .record=\${customRecord} field="condition"></fdl-field>\n  <fdl-field .record=\${customRecord} field=${field} .showValidationErrors=\${true}></fdl-field>\n  <p>Stored value: \${JSON.stringify(customRecord.getField(${field}))}</p>\n  <p>Record: \${customRecord.isValid() ? 'valid' : 'invalid'}</p>\n\`, container);\ncustomRecord.addEventListener('change', update);\nupdate();`;
    return {definition,ui,modelFile:'custom-field-model.js',uiFile:'custom-field-view.js',modelName:'customRecord',fields:['condition',spec.name],kind:'Record',contract:false,styles:'',stylesComponent:'fdl-field'};
}
