import { html } from 'lit';
import FieldType from '../../field-type.js';
import Record from '../../record.js';
import Recordset from '../../recordset.js';

export const prefixFilter = new FieldType<string>().with.filter((text, value) => value.toLowerCase().startsWith(text.toLowerCase()));
export const substringFilter = new FieldType<string>().with.filter((text, value) => value.toLowerCase().includes(text.toLowerCase()));

export function validatorCases(type: FieldType) {
    const cases = ['', 'PRJ-123', 'PRJ-1234', 'prj-1234', 'PRJ-12345'];
    return html`<section class="case-comparison"><h3>Compare boundary cases</h3><p>The same field definition validates every value below.</p><table><caption>Project-code validation</caption><thead><tr><th scope="col">Value</th><th scope="col">Record validation</th></tr></thead><tbody>${cases.map(value => {
        const record = new Record({ code: type }, { code: value });
        return html`<tr><th scope="row"><code>${value || '(empty)'}</code></th><td>${record.isValid() ? 'Valid' : record.readableFieldErrors('code').join('; ')}</td></tr>`;
    })}</tbody></table></section>`;
}
export function sortCases(table: Recordset<any>) {
    const sizes = [...new Set(table.allRecords.map(record => record.values.shirtSize))] as string[];
    const sizeType = table.getFieldType('shirtSize');
    return html`<section class="case-comparison"><h3>Alphabetic order versus size order</h3><p>The same sizes produce different orders. The table uses compareShirtSizes.</p><div class="comparison-grid"><div><h4>Alphabetic order</h4><p>${[...sizes].sort().join(' → ')}</p></div><div><h4>T-shirt size order</h4><p>${[...sizes].sort((left,right)=>sizeType.compare(left,right)).join(' → ')}</p></div></div></section>`;
}
