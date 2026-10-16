import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import prettier from 'prettier';
import ts from 'typescript';

const check = process.argv.includes('--check');
const directory = 'examples/fdl-input';
let changed = 0;

// Prettier formats source files and tagged HTML/CSS templates, but leaves plain
// strings alone. Format complete static code examples stored in those strings too.
for (const file of await readdir(directory)) {
    if (!file.endsWith('.ts')) continue;
    const path = join(directory, file);
    const config = await prettier.resolveConfig(path);
    const source = await readFile(path, 'utf8');
    const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
    const literals = [];
    function visit(node) {
        if (
            (ts.isNoSubstitutionTemplateLiteral(node) || ts.isStringLiteral(node)) &&
            node.text.includes('\n') &&
            /^(?:import|export|const|let|function|async function|class)\b/.test(node.text.trim())
        ) {
            literals.push(node);
        } else {
            ts.forEachChild(node, visit);
        }
    }
    visit(ast);
    let output = source;
    for (const literal of literals.reverse()) {
        const formatted = await prettier.format(literal.text, { ...config, parser: 'typescript' });
        const escaped = formatted
            .trimEnd()
            .replaceAll('\\', '\\\\')
            .replaceAll('`', '\\`')
            .replaceAll('${', '\\${');
        const replacement = '`' + escaped + '`';
        output = output.slice(0, literal.getStart(ast)) + replacement + output.slice(literal.end);
    }
    if (output === source) continue;
    changed++;
    if (check) {
        console.error(`Code snippets need formatting: ${path}`);
    } else {
        await writeFile(path, output);
        console.log(`Formatted code snippets: ${path}`);
    }
}
if (check && changed) process.exitCode = 1;
