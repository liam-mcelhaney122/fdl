import { render } from 'lit';
import { highlightJavaScript } from '../examples/fdl-input/highlight-javascript';

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
