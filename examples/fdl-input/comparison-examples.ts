import { html } from 'lit';
import FieldType from '../../field-type.js';
import Record from '../../record.js';
import Recordset from '../../recordset.js';
import comparatorFromColumns from '../../utilities/comparator-from-columns.js';

export const prefixFilter = new FieldType<string>().with.filter((text, value) => value.toLowerCase().startsWith(text.toLowerCase()));
export const substringFilter = new FieldType<string>().with.filter((text, value) => value.toLowerCase().includes(text.toLowerCase()));

export function validatorCases(type: FieldType) {
    const cases = ['', 'PRJ-123', 'PRJ-1234', 'prj-1234', 'PRJ-12345'];
    return html`<section class="case-comparison"><h3>Compare boundary cases</h3><p>The same field definition validates every value below.</p><table><caption>Project-code validation</caption><thead><tr><th scope="col">Value</th><th scope="col">Record validation</th></tr></thead><tbody>${cases.map(value => {
        const record = new Record({ code: type }, { code: value });
        return html`<tr><th scope="row"><code>${value || '(empty)'}</code></th><td>${record.isValid() ? 'Valid' : record.readableFieldErrors('code').join('; ')}</td></tr>`;
    })}</tbody></table></section>`;
}
export function filterCases(text: string) {
    return html`<table class="case-comparison"><caption>How both rules match “${text}”</caption><thead><tr><th scope="col">Name</th><th scope="col">Starts with</th><th scope="col">Contains</th></tr></thead><tbody>${['Ada', 'Grace', 'Margaret'].map(name => html`<tr><th scope="row">${name}</th><td>${prefixFilter.match(text, name) ? 'Match' : 'No match'}</td><td>${substringFilter.match(text, name) ? 'Match' : 'No match'}</td></tr>`)}</tbody></table>`;
}
export function sortCases(table: Recordset<any>) {
    const values = table.allRecords.map(record => record.values);
    const fields = { firstName: table.getFieldType('firstName'), lastName: table.getFieldType('lastName') };
    return html`<section class="case-comparison"><h3>Compare sort precedence</h3><p>Both views use FDL’s comparator and the same source records.</p><div class="comparison-grid">${[['firstName', 'lastName'], ['lastName', 'firstName']].map(order => html`<div><h4>${order.map(field => fields[field as keyof typeof fields].label()).join(' → ')}</h4><ol>${[...values].sort(comparatorFromColumns(order.map(field => ({ field, sort: 'ascending' })), fields)).map(value => html`<li>${value.firstName} ${value.lastName}</li>`)}</ol></div>`)}</div></section>`;
}
