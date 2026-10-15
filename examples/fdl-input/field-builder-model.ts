import FieldType from '../../field-type.js';
import Record from '../../record.js';
import type { exampleSource } from './modifier-example-source';
export type FieldSpec={name:string;initialValue:string;condition:string;visibility:'always'|'enabled';requiredness:'never'|'enabled'|'always';validation:'none'|'minimum'|'digits'};
export const defaultFieldSpec:FieldSpec={name:'notes',initialValue:'',condition:'enabled',visibility:'enabled',requiredness:'enabled',validation:'none'};
export function buildFieldRecord(spec:FieldSpec){
    let field=new FieldType<string>().with.label(spec.name);
    if(spec.visibility==='enabled')field=field.with.visibleWhen(record=>record.getField('condition')==='enabled');
    if(spec.requiredness==='always')field=field.with.required();
    if(spec.requiredness==='enabled')field=field.with.requiredWhen(record=>record.getField('condition')==='enabled');
    if(spec.validation==='minimum')field=field.with.minLength(3);
    if(spec.validation==='digits')field=field.with.validator({name:'must contain digits only',validate:value=>value===''||/^\d+$/.test(value)});
    return new Record({condition:new FieldType<string>().with.label('Condition').and.tag('select').and.options([{text:'Enabled',value:'enabled'},{text:'Disabled',value:'disabled'}]),[spec.name]:field},{condition:spec.condition,[spec.name]:spec.initialValue});
}
export function builderSource(spec:FieldSpec):ReturnType<typeof exampleSource>{
    const field=JSON.stringify(spec.name);
    const definition=`import { FieldType, Record } from 'digital-fdl';\n\nconst customRecord = new Record({\n  condition: new FieldType().with.label('Condition').and.tag('select')\n    .and.options([{text:'Enabled',value:'enabled'},{text:'Disabled',value:'disabled'}]),\n  ${field}: new FieldType().with.label(${field})${spec.visibility==='enabled'?"\n    .and.visibleWhen(record => record.getField('condition') === 'enabled')":''}${spec.requiredness==='always'?'\n    .and.required()':spec.requiredness==='enabled'?"\n    .and.requiredWhen(record => record.getField('condition') === 'enabled')":''}${spec.validation==='minimum'?'\n    .and.minLength(3)':spec.validation==='digits'?"\n    .and.validator({name:'must contain digits only', validate:value => value === '' || /^\\d+$/.test(value)})":''},\n}, ${JSON.stringify({condition:spec.condition,[spec.name]:spec.initialValue},null,2)});\n\nexport { customRecord };`;
    const ui=`import { html, render } from 'lit';\nimport { customRecord } from './custom-field-model.js';\nimport './fdl-field';\n\nconst container = document.createElement('div');\ndocument.body.append(container);\nconst update = () => render(html\`\n  <fdl-field .record=\${customRecord} field="condition"></fdl-field>\n  <fdl-field .record=\${customRecord} field=${field} .showValidationErrors=\${true}></fdl-field>\n  <p>Stored value: \${JSON.stringify(customRecord.getField(${field}))}</p>\n  <p>Record: \${customRecord.isValid() ? 'valid' : 'invalid'}</p>\n\`, container);\ncustomRecord.addEventListener('change', update);\nupdate();`;
    return {definition,ui,modelFile:'custom-field-model.js',uiFile:'custom-field-view.js',modelName:'customRecord',fields:['condition',spec.name],kind:'Record',contract:false,styles:'',stylesComponent:'fdl-field'};
}
