import { html, type TemplateResult } from 'lit';
import { explainModifierCall } from './modifier-call-explanation';
import { modifierSignatures } from './modifier-signatures';

const keywords = new Set([
    'async',
    'await',
    'const',
    'let',
    'var',
    'new',
    'return',
    'if',
    'else',
    'throw',
    'function',
    'class',
    'import',
    'from',
    'export',
    'default',
    'typeof',
    'instanceof',
]);
const builtins = new Set([
    'Intl',
    'Number',
    'String',
    'Boolean',
    'Promise',
    'FieldType',
    'field',
    'Record',
    'Recordset',
]);

// A display-only tokenizer for the cookbook's JavaScript snippets. Render every
// token through Lit text bindings, so code never becomes executable HTML.
const tokens =
    /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`|\/(?![/*])(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\n\\])+\/[dgimsuvy]*|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*|=>|===|!==|[{}()[\].,;:?=+<>!-]/g;

function modifierCallText(
    source: string,
    index: number,
    modifier: string
): string {
    const lexemes = [...source.matchAll(tokens)];
    const modifierIndex = lexemes.findIndex(
        match => match.index === index && match[0] === modifier
    );
    if (modifierIndex < 0) return `.${modifier}()`;
    let depth = 0;
    for (let cursor = modifierIndex + 1; cursor < lexemes.length; cursor++) {
        if (lexemes[cursor][0] === '(') depth++;
        if (lexemes[cursor][0] === ')' && --depth === 0) {
            return source.slice(index - 1, lexemes[cursor].index! + 1);
        }
    }
    return source.slice(index - 1, index + modifier.length);
}

export function highlightJavaScript(
    source: string,
    context = source,
    offset = 0
): Array<string | TemplateResult> {
    const output: Array<string | TemplateResult> = [];
    let cursor = 0;
    const contextTokens = [...context.matchAll(tokens)];
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
        else if (['true', 'false', 'null', 'undefined'].includes(value))
            kind = 'literal';
        else if (builtins.has(value)) kind = 'builtin';
        else if (
            /^[A-Za-z_$]/.test(value) &&
            /^\s*\(/.test(source.slice(index + value.length))
        )
            kind = 'function';
        else if (/^[^\w$]+$/.test(value)) kind = 'punctuation';
        const token = html`<span class=${`syntax-${kind}`}>${value}</span>`;
        const modifierCall =
            source[index - 1] === '.' &&
            modifierSignatures[value] !== undefined &&
            /^\s*\(/.test(source.slice(index + value.length));
        // Locate field boundaries in tokenized code, ignoring words in strings
        // and comments. Keep full-snippet context even when rendering one line.
        const fieldStarts = modifierCall
            ? contextTokens.filter(
                  token => token[0] === 'field' && token.index! < index + offset
              )
            : [];
        const chainStart = fieldStarts.length
            ? fieldStarts[fieldStarts.length - 1].index!
            : 0;
        const explanation = modifierCall
            ? explainModifierCall(
                  context.slice(chainStart, index + offset),
                  value,
                  modifierCallText(context, index + offset, value)
              )
            : '';
        output.push(
            modifierCall
                ? html`<a
                      href=${`#${value}`}
                      title=${explanation}
                      aria-label=${`${value} modifier. ${explanation}`}
                      style="color:inherit;text-decoration:underline;text-underline-offset:0.15em"
                      >${token}</a
                  >`
                : token
        );
        cursor = index + value.length;
    }
    output.push(source.slice(cursor));
    return output;
}

/** Locate every complete call, skipping apparent calls inside strings/comments. */
export function modifierLineRanges(
    source: string,
    modifier: string
): Array<[number, number]> {
    const lexemes = [...source.matchAll(tokens)];
    const ranges: Array<[number, number]> = [];
    for (let index = 0; index < lexemes.length - 2; index++) {
        if (
            lexemes[index][0] !== '.' ||
            lexemes[index + 1][0] !== modifier ||
            lexemes[index + 2][0] !== '('
        )
            continue;
        const start = lexemes[index].index!;
        let depth = 0;
        let end = source.length;
        for (let cursor = index + 2; cursor < lexemes.length; cursor++) {
            if (lexemes[cursor][0] === '(') depth++;
            if (lexemes[cursor][0] === ')' && --depth === 0) {
                end = lexemes[cursor].index!;
                break;
            }
        }
        ranges.push([
            source.slice(0, start).split('\n').length - 1,
            source.slice(0, end).split('\n').length - 1,
        ]);
    }
    return ranges;
}

export function modifierLineRange(
    source: string,
    modifier: string
): [number, number] | undefined {
    return modifierLineRanges(source, modifier)[0];
}

export function highlightModifier(source: string, modifier: string) {
    const ranges = modifierLineRanges(source, modifier);
    const lines = source.split('\n');
    let offset = 0;
    return lines.map((line, index) => {
        const start = offset;
        offset += line.length + 1;
        return html`<span
                class=${`code-line${ranges.some(range => index >= range[0] && index <= range[1]) ? ' focused-line' : ''}`}
                >${highlightJavaScript(line, source, start)}</span
            >${index < lines.length - 1 ? '\n' : ''}`;
    });
}

export function highlightMarkup(source: string) {
    const pattern =
        /<!--[\s\S]*?-->|\$\{[^}]*\}|<\/?[\w-]+|[.\w-]+(?=\s*=)|"[^"]*"|'[^']*'|[<>=/]/g;
    const output: Array<string | TemplateResult> = [];
    let cursor = 0;
    for (const match of source.matchAll(pattern)) {
        const value = match[0];
        const kind = value.startsWith('<!--')
            ? 'comment'
            : value.startsWith('<') || value.startsWith('${')
              ? 'builtin'
              : /^["']/.test(value)
                ? 'string'
                : 'keyword';
        output.push(
            source.slice(cursor, match.index),
            html`<span class=${`syntax-${kind}`}>${value}</span>`
        );
        cursor = match.index! + value.length;
    }
    output.push(source.slice(cursor));
    return output;
}
