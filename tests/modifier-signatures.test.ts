import * as ts from 'typescript';
import { modifierSignatures } from '../examples/fdl-input/modifier-signatures';

it('keeps tooltip signatures aligned with the actual TypeScript builder API', () => {
    const root = ts.sys.getCurrentDirectory();
    const config = ts.readConfigFile(`${root}/tsconfig.json`, ts.sys.readFile).config;
    const options = ts.convertCompilerOptionsFromJson(config.compilerOptions, root).options;
    const filename = `${root}/field-type-builder.ts`;
    const program = ts.createProgram([filename], options);
    const checker = program.getTypeChecker();
    const source = program.getSourceFile(filename)!;
    const builder = source.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === 'FieldTypeBuilder') as ts.ClassDeclaration;
    for (const [name, documented] of Object.entries(modifierSignatures)) {
        const method = builder.members.find(node => ts.isMethodDeclaration(node) && node.name.getText(source) === name) as ts.MethodDeclaration;
        const signature = checker.getSignatureFromDeclaration(method)!;
        const actual = checker.signatureToString(signature, method, ts.TypeFormatFlags.NoTruncation)
            .replace(/_FieldType/g, 'FieldType')
            .replace(/BooleanPredicate/g, '(value: any) => boolean')
            .replace(/predicate: \(record: Record<any>\)/g, 'predicate: (record: Record)')
            .replace(/: FieldTypeBuilder<T>$/, '');
        expect(documented).toBe(`${name}${actual}`);
    }
});
