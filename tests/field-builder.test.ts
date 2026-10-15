import {html,render} from 'lit';
import * as ts from 'typescript';
import FieldType from '../field-type.js';
import Record from '../record.js';
import {buildFieldRecord,builderSource,defaultFieldSpec} from '../examples/fdl-input/field-builder-model';
import '../examples/fdl-input/fdl-field';
it('uses independent rules and exports the same current model and Lit bindings',()=>{
 const spec={...defaultFieldSpec,name:'reference',initialValue:'bad',validation:'digits' as const};
 const preview=buildFieldRecord(spec);expect(preview.isValid()).toBe(false);preview.setField('condition','disabled');expect(preview.getField('reference')).toBe('bad');expect(preview.isValid()).toBe(false);
 const source=builderSource(spec),modules:{[name:string]:any}={'digital-fdl':{FieldType,Record},lit:{html,render},'./fdl-field':{}};
 const execute=(code:string)=>{const exports={};const compiled=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;new Function('require','exports',compiled)((name:string)=>{if(!(name in modules))throw new Error(name);return modules[name];},exports);return exports as any;};
 const model=execute(source.definition);modules['./custom-field-model.js']=model;
 const ui=execute(source.ui+'\nexport {container};');expect(model.customRecord.isValid()).toBe(false);expect(ui.container.querySelector('fdl-field[field="reference"]').record).toBe(model.customRecord);
 model.customRecord.setField('reference','123');expect(model.customRecord.isValid()).toBe(true);ui.container.remove();
});

import '../examples/fdl-input/fdl-field-builder';
it('keeps trial data across rule changes and renaming, with explicit starting-value and reset replacement',async()=>{
 const demo=document.createElement('fdl-field-builder') as any;document.body.append(demo);await demo.updateComplete;
 demo.record.setField('notes','AB');demo.record.setField('condition','disabled');
 demo.configuration.setField('validation','minimum');await demo.updateComplete;
 expect(demo.record.getField('notes')).toBe('AB');expect(demo.record.getField('condition')).toBe('disabled');expect(demo.record.isValid()).toBe(false);
 demo.configuration.setField('name','reference');await demo.updateComplete;
 expect(demo.record.getField('reference')).toBe('AB');
 demo.configuration.setField('initialValue','XYZ');await demo.updateComplete;
 expect(demo.record.getField('reference')).toBe('XYZ');expect(demo.record.getField('condition')).toBe('disabled');
 demo.shadowRoot.querySelectorAll('button')[1].click();await demo.updateComplete;
 expect(demo.record.getField('notes')).toBe('');expect(demo.record.getField('condition')).toBe('enabled');demo.remove();
});
