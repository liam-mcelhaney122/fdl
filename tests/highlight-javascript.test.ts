import { render } from 'lit';
import { highlightJavaScript, highlightModifier, modifierLineRange, highlightMarkup } from '../examples/fdl-input/highlight-javascript';

it('highlights JavaScript without changing source text or interpreting it as HTML', () => {
    const code = "// example\nconst field = new FieldType().with.label('<img src=x onerror=alert(1)>').and.validator({ name: 'code', validate: value => /^PRJ-\\d{4}$/.test(value) });";
    const container = document.createElement('div');
    render(highlightJavaScript(code), container);
    expect(container.textContent).toBe(code);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.syntax-comment')!.textContent).toBe('// example');
    expect(container.querySelector('.syntax-keyword')!.textContent).toBe('const');
    expect(container.querySelector('.syntax-builtin')!.textContent).toBe('FieldType');
    expect(container.querySelector('.syntax-function')!.textContent).toBe('label');
    expect(container.querySelector('.syntax-regex')!.textContent).toBe('/^PRJ-\\d{4}$/');
});


it('emphasizes the complete formatter call without including unrelated setup', () => {
    const code = "const amount = new FieldType().with\n  .label('Amount')\n  .and.formatter((value) =>\n    String(value)\n  );";
    expect(modifierLineRange(code, 'formatter')).toEqual([2, 4]);
    const container = document.createElement('div');
    render(highlightModifier(code, 'formatter'), container);
    expect(container.textContent).toBe(code);
    expect([...container.querySelectorAll('.focused-line')].map(line => line.textContent)).toEqual([
        '  .and.formatter((value) =>', '    String(value)', '  );',
    ]);
});

it('shows HTML bindings as highlighted source without creating controls', () => {
    const code = '<fdl-field .record=${money} field="amount"></fdl-field>';
    const container = document.createElement('div');
    render(highlightMarkup(code), container);
    expect(container.textContent).toBe(code);
    expect(container.querySelector('fdl-field')).toBeNull();
    expect(container.querySelector('.syntax-string')!.textContent).toBe('"amount"');
});
