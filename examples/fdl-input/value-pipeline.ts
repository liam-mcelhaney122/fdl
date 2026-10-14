import { html } from 'lit';
import Record from '../../record.js';
import { describeValue } from './model-summary';

/** Native input events are composed; read the editing text before formatting can replace it. */
export function inputText(event: Event): string | undefined {
    const input = event.composedPath().find(node => node instanceof HTMLInputElement) as HTMLInputElement | undefined;
    return input?.value;
}
export function valuePipeline(record: Record<any>, field: string, lastInput?: string) {
    const entered = lastInput ?? String(record.getFormattedField(field, 'input-focus'));
    const stages = [
        ['Input text', describeValue(entered)],
        ['Parser result', describeValue(record.parse(field, entered))],
        ['Stored model value', describeValue(record.getField(field))],
        ['Focused input representation', describeValue(String(record.getFormattedField(field, 'input-focus')))],
        ['Printed representation', describeValue(record.getFormattedField(field, 'print'))],
    ];
    return html`<section class="value-pipeline" aria-label="From input to printed output" style="margin-top:20px;border-left:3px solid #2563eb;padding:12px;background:#eff6ff;overflow-wrap:anywhere">
        <h3>From input to printed output</h3>
        <ol style="padding-left:24px">${stages.map(([label, value]) => html`<li><strong>${label}</strong><br><code>${value}</code></li>`)}</ol>
        <p>Parsing changes the model value. Formatting creates a representation; it leaves the stored value intact. The focused representation is what the adapter requests when editing.</p>
        ${typeof record.getField(field) === 'number' && !Number.isFinite(record.getField(field)) ? html`<p role="status">This parser produced a non-finite number. Parsing alone does not validate malformed input; a production field needs an explicit policy for it.</p>` : ''}
    </section>`;
}
