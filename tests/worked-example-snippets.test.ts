import { render } from 'lit';
import { field, Recordset } from '../index';
import { renderEditableRecordset } from '../examples/fdl-input/editable-recordset-page';

it('runs the displayed shipment setup and aggregation snippets together', async () => {
    const container = document.createElement('div');
    try {
        render(renderEditableRecordset(), container);
        const code = Array.from(container.querySelectorAll('pre code')).map(block => block.textContent).join('\n')
            .replace("import { field, Recordset } from 'digital-fdl';", '');
        const run = new Function('field', 'Recordset', `return (async () => {${code}\nreturn {allTotal, visibleTotal, visibleUnits};})();`);
        await expect(run(field, Recordset)).resolves.toEqual({allTotal: 130, visibleTotal: 30, visibleUnits: 3});
    } finally {
        render(null, container);
    }
});
