import { starterFiles } from '../examples/fdl-input/starter-files';
import { exampleSource } from '../examples/fdl-input/modifier-example-source';
import { explorerRecipes } from '../examples/fdl-input/fdl-modifier-explorer';

it.each(explorerRecipes.map(recipe => recipe.name))('packages %s with matching local model and view imports', name => {
    const source=exampleSource(name);
    const files=starterFiles(source, {'fdl-model.js':'model bundle','fdl-field.js':'field adapter','fdl-table.js':'table adapter'});
    expect(files[source.modelFile]).toContain("from './fdl-model.js'");
    expect(files[source.uiFile]).toContain(`from './${source.modelFile}'`);
    expect(files['index.html']).toContain(`src="./${source.uiFile}"`);
    expect(JSON.parse(files['package.json']).scripts.build).toBe('vite build');
    expect(files['README.md']).toContain('snapshot');
    expect(files[source.uiFile]).not.toContain("import './fdl-field';");
    expect(files[source.uiFile]).not.toContain("import './fdl-table';");
});
