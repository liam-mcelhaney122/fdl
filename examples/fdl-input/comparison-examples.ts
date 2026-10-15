import FieldTypeBuilder from '../../field-type-builder';
import { html } from 'lit';
import Recordset from '../../recordset.js';

export const prefixFilter = new FieldTypeBuilder<string>().filter((text, value) => value.toLowerCase().startsWith(text.toLowerCase()));
export const substringFilter = new FieldTypeBuilder<string>().filter((text, value) => value.toLowerCase().includes(text.toLowerCase()));

export function sortCases(table: Recordset<any>) {
    const sizes = [...new Set(table.allRecords.map(record => record.values.shirtSize))] as string[];
    const sizeType = table.getFieldType('shirtSize');
    return html`<section class="case-comparison"><h3>Alphabetic order versus size order</h3><p>The same sizes produce different orders. The table uses compareShirtSizes.</p><div class="comparison-grid"><div><h4>Alphabetic order</h4><p>${[...sizes].sort().join(' → ')}</p></div><div><h4>T-shirt size order</h4><p>${[...sizes].sort((left,right)=>sizeType.compare(left,right)).join(' → ')}</p></div></div></section>`;
}
