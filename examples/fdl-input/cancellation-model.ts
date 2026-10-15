import FieldTypeBuilder from '../../field-type-builder';
import Record from '../../record.js';
export type CancellationRules={visibility:'always'|'cancelled';requiredness:'always'|'cancelled'|'never'};
export function cancellationFields(rules:CancellationRules) {
    let reason=new FieldTypeBuilder<string>().label('Cancellation reason').tag('textarea').rowCount(2);
    if(rules.visibility==='cancelled') reason=reason.visibleWhen((_value, record) =>record.getField('status')==='cancelled');
    if(rules.requiredness==='always') reason=reason.required();
    if(rules.requiredness==='cancelled') reason=reason.required((_value, record) =>record.getField('status')==='cancelled');
    return {status:new FieldTypeBuilder<string>().label('Request status').tag('select').options([{text:'Active',value:'active'},{text:'Cancelled',value:'cancelled'}]),reason};
}
export const cancellationCases=[{status:'active',reason:'',visible:false,required:false,valid:true},{status:'active',reason:'Changed plans',visible:false,required:false,valid:true},{status:'cancelled',reason:'',visible:true,required:true,valid:false},{status:'cancelled',reason:'Changed plans',visible:true,required:true,valid:true}];
export function checkCancellation(rules:CancellationRules) {
    return cancellationCases.map(sample=>{
        const record=new Record(cancellationFields(rules),{status:sample.status,reason:sample.reason}),type=record.fieldTypeForField('reason');
        const actual={visible:type.visible(record.getField('reason'), record),required:type.required(record.getField('reason'), record),valid:record.isValid()};
        return {sample,actual,passes:actual.visible===sample.visible&&actual.required===sample.required&&actual.valid===sample.valid};
    });
}
export function cancellationDefinition(rules:CancellationRules) {
    return `const reason = new FieldTypeBuilder()\n  .label('Cancellation reason')${rules.visibility==='cancelled' ? "\n  .visibleWhen((_value, record) => record.getField('status') === 'cancelled')" : ''}${rules.requiredness==='always' ? '\n  .required()' : rules.requiredness==='cancelled' ? "\n  .required((_value, record) => record.getField('status') === 'cancelled')" : ''};`;
}

export function checkCancellationTransition(rules:CancellationRules) {
    const reason='Changed plans';
    const record=new Record(cancellationFields(rules),{status:'cancelled',reason});
    record.setField('status','active');
    const activeReason=record.getField('reason');
    const hidden=!record.fieldTypeForField('reason').visible(record.getField('reason'), record);
    record.setField('status','cancelled');
    const returnedReason=record.getField('reason');
    return {activeReason,returnedReason,passes:hidden && activeReason===reason && returnedReason===reason && record.fieldTypeForField('reason').visible(record.getField('reason'), record) && record.isValid()};
}
