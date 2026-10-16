import { render } from 'lit';
import { highlightJavaScript, highlightModifier, modifierLineRange, highlightMarkup } from '../examples/fdl-input/highlight-javascript';

it('highlights JavaScript without changing source text or interpreting it as HTML', () => {
    const code = "// example\nconst definition = field.label('<img src=x onerror=alert(1)>').validator({ name: 'code', validate: value => /^PRJ-\\d{4}$/.test(value) });";
    const container = document.createElement('div');
    render(highlightJavaScript(code), container);
    expect(container.textContent).toBe(code);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.syntax-comment')!.textContent).toBe('// example');
    expect(container.querySelector('.syntax-keyword')!.textContent).toBe('const');
    expect(container.querySelector('.syntax-builtin')!.textContent).toBe('field');
    expect(container.querySelector('.syntax-function')!.textContent).toBe('label');
    expect(container.querySelector('.syntax-regex')!.textContent).toBe('/^PRJ-\\d{4}$/');
});

it('links modifier calls to their documentation without changing syntax color', () => {
    const code = "const definition = field.label('Name').required();";
    const container = document.createElement('div');
    render(highlightJavaScript(code), container);
    const link = container.querySelector<HTMLAnchorElement>('a[href="#required"]')!;
    expect(link.textContent).toBe('required');
    expect(link.getAttribute('style')).toContain('color:inherit');
    expect(link.getAttribute('style')).toContain('text-decoration:underline');
    expect(link.querySelector('.syntax-function')!.textContent).toBe('required');
});


it('emphasizes the complete formatter call without including unrelated setup', () => {
    const code = "const amount = field\n  .label('Amount')\n  .formatter((value) =>\n    String(value)\n  );";
    expect(modifierLineRange(code, 'formatter')).toEqual([2, 4]);
    const container = document.createElement('div');
    render(highlightModifier(code, 'formatter'), container);
    expect(container.textContent).toBe(code);
    expect([...container.querySelectorAll('.focused-line')].map(line => line.textContent)).toEqual([
        '  .formatter((value) =>', '    String(value)', '  );',
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

it('highlights every modifier call while ignoring lookalikes in comments and strings', () => {
    const code = `// .compareFunction(ignored)
const note = '.compareFunction(ignored)';
first.compareFunction((a, b) => a.localeCompare(b));
second.compareFunction(
  compareShirtSizes
);
third.label('Unrelated');`;
    const container = document.createElement('div');
    render(highlightModifier(code, 'compareFunction'), container);
    expect(container.textContent).toBe(code);
    expect([...container.querySelectorAll('.focused-line')].map(line=>line.textContent)).toEqual([
        'first.compareFunction((a, b) => a.localeCompare(b));',
        'second.compareFunction(', '  compareShirtSizes', ');',
    ]);
});
