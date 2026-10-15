import { html, type TemplateResult } from 'lit';

const keywords = new Set(['async', 'await', 'const', 'let', 'var', 'new', 'return', 'if', 'else', 'throw', 'function', 'class', 'import', 'from', 'export', 'default', 'typeof', 'instanceof']);
const builtins = new Set(['Intl', 'Number', 'String', 'Boolean', 'Promise', 'FieldType', 'FieldTypeBuilder', 'Record', 'Recordset']);

// A display-only tokenizer for the cookbook's JavaScript snippets. Render every
// token through Lit text bindings, so code never becomes executable HTML.
const tokens = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`|\/(?![/*])(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\n\\])+\/[dgimsuvy]*|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*|=>|===|!==|[{}()[\].,;:?=+<>!-]/g;

export function highlightJavaScript(source: string): Array<string | TemplateResult> {
    const output: Array<string | TemplateResult> = [];
    let cursor = 0;
    for (const match of source.matchAll(tokens)) {
        const value = match[0];
        const index = match.index!;
        output.push(source.slice(cursor, index));
        let kind = 'plain';
        if (value.startsWith('//') || value.startsWith('/*')) kind = 'comment';
        else if (/^["'`]/.test(value)) kind = 'string';
        else if (value.startsWith('/')) kind = 'regex';
        else if (/^\d/.test(value)) kind = 'number';
        else if (keywords.has(value)) kind = 'keyword';
        else if (['true', 'false', 'null', 'undefined'].includes(value)) kind = 'literal';
        else if (builtins.has(value)) kind = 'builtin';
        else if (/^[A-Za-z_$]/.test(value) && /^\s*\(/.test(source.slice(index + value.length))) kind = 'function';
        else if (/^[^\w$]+$/.test(value)) kind = 'punctuation';
        output.push(html`<span class=${`syntax-${kind}`}>${value}</span>`);
        cursor = index + value.length;
    }
    output.push(source.slice(cursor));
    return output;
}

/** Locate every complete call, skipping apparent calls inside strings/comments. */
export function modifierLineRanges(source: string, modifier: string): Array<[number, number]> {
    const lexemes = [...source.matchAll(tokens)];
    const ranges: Array<[number, number]> = [];
    for (let index = 0; index < lexemes.length - 2; index++) {
        if (lexemes[index][0] !== '.' || lexemes[index + 1][0] !== modifier || lexemes[index + 2][0] !== '(') continue;
        const start = lexemes[index].index!;
        let depth = 0;
        let end = source.length;
        for (let cursor = index + 2; cursor < lexemes.length; cursor++) {
            if (lexemes[cursor][0] === '(') depth++;
            if (lexemes[cursor][0] === ')' && --depth === 0) { end = lexemes[cursor].index!; break; }
        }
        ranges.push([source.slice(0, start).split('\n').length - 1, source.slice(0, end).split('\n').length - 1]);
    }
    return ranges;
}

export function modifierLineRange(source: string, modifier: string): [number, number] | undefined {
    return modifierLineRanges(source, modifier)[0];
}

export function highlightModifier(source: string, modifier: string) {
    const ranges = modifierLineRanges(source, modifier);
    const lines = source.split('\n');
    return lines.map((line, index) => html`<span class=${`code-line${ranges.some(range => index >= range[0] && index <= range[1]) ? ' focused-line' : ''}`}>${highlightJavaScript(line)}</span>${index < lines.length - 1 ? '\n' : ''}`);
}

export function highlightMarkup(source: string) {
    const pattern = /<!--[\s\S]*?-->|\$\{[^}]*\}|<\/?[\w-]+|[.\w-]+(?=\s*=)|"[^"]*"|'[^']*'|[<>=/]/g;
    const output: Array<string | TemplateResult> = [];
    let cursor = 0;
    for (const match of source.matchAll(pattern)) {
        const value = match[0];
        const kind = value.startsWith('<!--') ? 'comment'
            : value.startsWith('<') || value.startsWith('${') ? 'builtin'
            : /^["']/.test(value) ? 'string' : 'keyword';
        output.push(source.slice(cursor, match.index), html`<span class=${`syntax-${kind}`}>${value}</span>`);
        cursor = match.index! + value.length;
    }
    output.push(source.slice(cursor));
    return output;
}
