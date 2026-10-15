import FieldType from '../../field-type.js';
import Record from '../../record.js';

export type CompositionRules = {
    visibility: 'all' | 'shipping';
    requiredness: 'never' | 'shipping' | 'always';
    validation: 'off' | 'on';
};
export const defaultCompositionRules: CompositionRules = {visibility: 'shipping', requiredness: 'shipping', validation: 'on'};
export const addressCases = [
    {id: 'empty', title: 'Empty', value: ''},
    {id: 'numbered', title: 'With a street number', value: '42 Orchard Street'},
    {id: 'unnumbered', title: 'Without a street number', value: 'Orchard Street'},
] as const;
export const hasStreetNumber = (value: string) => /^\d+\s+\S/.test(value.trim());
export const addressCase = (value: string) => value === '' ? 'empty' : hasStreetNumber(value) ? 'numbered' : 'unnumbered';

export function compositionFields(rules: CompositionRules) {
    let address = new FieldType<string>().with.label('Shipping address');
    if (rules.visibility === 'shipping') address = address.with.visibleWhen(record => record.getField('fulfillment') === 'ship');
    if (rules.requiredness === 'always') address = address.with.required();
    if (rules.requiredness === 'shipping') address = address.with.required(record => record.getField('fulfillment') === 'ship');
    if (rules.validation === 'on') address = address.with.validator({
        name: 'must start with a street number and a street name',
        validate: value => value === '' || hasStreetNumber(value),
    });
    return {
        fulfillment: new FieldType<string>().with.label('Delivery method').and.tag('select').and.options([
            {text: 'Ship to address', value: 'ship'}, {text: 'Pick up in person', value: 'pickup'},
        ]),
        address,
    };
}
export function compositionRecord(rules: CompositionRules, fulfillment: string, address: string) {
    return new Record(compositionFields(rules), {fulfillment, address});
}
export function compositionDefinition(rules: CompositionRules) {
    return `const address = new FieldType()\n  .with.label('Shipping address')${rules.visibility === 'shipping' ? `
  .and.visibleWhen(record => record.getField('fulfillment') === 'ship')` : ''}${rules.requiredness === 'always' ? '\n  .and.required()' : rules.requiredness === 'shipping' ? `
  .and.required(record => record.getField('fulfillment') === 'ship')` : ''}${rules.validation === 'on' ? `
  .and.validator({
    name: 'must start with a street number and a street name',
    validate: value => value === '' || /^\\d+\\s+\\S/.test(value.trim()),
  })` : ''};`;
}

export function compositionExplanation(rules: CompositionRules, method: string, value: string) {
    return {
        visibility: rules.visibility === 'all' ? 'Both delivery methods show the address.' : `The shipping predicate is ${method === 'ship'}.`,
        requiredness: rules.requiredness === 'always' ? 'The required rule always applies.' : rules.requiredness === 'never' ? 'No required rule is declared.' : `The shipping predicate is ${method === 'ship'}.`,
        format: rules.validation === 'off' ? 'No format validator is declared.' : value === '' ? 'The format validator accepts an empty value; requiredness is checked separately.' : hasStreetNumber(value) ? 'The stored address passes the street-number check.' : 'The stored address fails the street-number check.',
    };
}

export function compositionRuleChanges(saved: CompositionRules, current: CompositionRules) {
    const descriptions = {
        visibility: {label:'Show address', values:{all:'both methods', shipping:'shipping only'}},
        requiredness: {label:'Require address', values:{never:'never', shipping:'shipping only', always:'always'}},
        validation: {label:'Format check', values:{off:'off', on:'street number'}},
    };
    return (Object.keys(descriptions) as (keyof CompositionRules)[]).filter(key=>saved[key]!==current[key]).map(key=>{
        const description=descriptions[key];
        const values=description.values as {[value:string]:string};
        return `${description.label}: ${values[saved[key]]} → ${values[current[key]]}`;
    });
}
