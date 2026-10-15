import type { exampleSource } from './modifier-example-source';

export function starterFiles(source: ReturnType<typeof exampleSource>, assets: {[name: string]: string}) {
    return {
        ...assets,
        [source.modelFile]: source.definition.replace("'digital-fdl'", "'./fdl-model.js'"),
        [source.uiFile]: source.ui.replace(/'\.\/fdl-(field|table)'/g, "'./fdl-$1.js'"),
        'index.html': `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>FDL example</title><style>body{max-width:900px;margin:40px auto;padding:0 20px;font:18px/1.6 system-ui;color:#0f172a}fdl-field{display:block;--field-label-width:100%;--field-control-width:100%}button{font:inherit;padding:8px 16px}fdl-table{display:block}</style></head><body><h1>FDL example</h1><script type="module" src="./${source.uiFile}"></script></body></html>`,
        'package.json': JSON.stringify({name:'fdl-runnable-example',private:true,type:'module',scripts:{dev:'vite',build:'vite build'},dependencies:{lit:'^2.2.3'},devDependencies:{vite:'^5.4.19'}},null,2),
        'README.md': `# Runnable FDL example\n\n1. Install Node.js 18 or newer.\n2. Run npm install in this folder.\n3. Run npm run dev and open the printed local URL.\n4. Run npm run build to check the production bundle.\n\nEdit ${source.modelFile} for model rules and starting values, and ${source.uiFile} for the Lit UI.\n\nfdl-model.js is a bundled snapshot of the current FDL library, included so this example matches the documentation rather than a potentially older published version. fdl-field.js and fdl-table.js are this documentation site's example adapters, including their CSS. Shared chunk files must stay beside these modules. These adapters are examples, not components exported by digital-fdl.\n\nThe model and view use the same rules as the displayed source. Teaching panels and adjustable rule selectors are omitted.\n`,
        'LICENSE': assets.LICENSE ?? 'FDL and the example adapter source are licensed under Apache License 2.0. See https://www.apache.org/licenses/LICENSE-2.0 and https://github.com/pmcelhaney/FDL.\n',
    };
}

/** An uncompressed ZIP archive: standard browser APIs, no download service. */
export function zipFiles(files: {[name: string]: string}): Uint8Array {
    const encoder = new TextEncoder();
    const parts: Uint8Array[] = [], directory: Uint8Array[] = [];
    let offset = 0, directorySize = 0;
    function crc(bytes: Uint8Array) {
        let value = 0xffffffff;
        for (const byte of bytes) { value ^= byte; for (let bit=0;bit<8;bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0); }
        return (value ^ 0xffffffff) >>> 0;
    }
    for (const [name,text] of Object.entries(files)) {
        const filename=encoder.encode(name), data=encoder.encode(text), checksum=crc(data);
        const header=new Uint8Array(30+filename.length), view=new DataView(header.buffer);
        view.setUint32(0,0x04034b50,true); view.setUint16(4,20,true); view.setUint16(6,0x800,true);
        view.setUint32(14,checksum,true); view.setUint32(18,data.length,true); view.setUint32(22,data.length,true); view.setUint16(26,filename.length,true); header.set(filename,30);
        const central=new Uint8Array(46+filename.length), entry=new DataView(central.buffer);
        entry.setUint32(0,0x02014b50,true); entry.setUint16(4,20,true); entry.setUint16(6,20,true); entry.setUint16(8,0x800,true);
        entry.setUint32(16,checksum,true); entry.setUint32(20,data.length,true); entry.setUint32(24,data.length,true); entry.setUint16(28,filename.length,true); entry.setUint32(42,offset,true); central.set(filename,46);
        parts.push(header,data); directory.push(central); offset+=header.length+data.length; directorySize+=central.length;
    }
    const end=new Uint8Array(22), footer=new DataView(end.buffer);
    footer.setUint32(0,0x06054b50,true); footer.setUint16(8,directory.length,true); footer.setUint16(10,directory.length,true); footer.setUint32(12,directorySize,true); footer.setUint32(16,offset,true);
    const archive=new Uint8Array(offset+directorySize+end.length); let cursor=0;
    for (const part of [...parts,...directory,end]) { archive.set(part,cursor); cursor+=part.length; }
    return archive;
}

export function downloadStarter(source: ReturnType<typeof exampleSource>, assets: {[name: string]: string}) {
    const url=URL.createObjectURL(new Blob([zipFiles(starterFiles(source,assets))],{type:'application/zip'}));
    const link=document.createElement('a'); link.href=url; link.download=source.modelFile.replace('-model.js','-example.zip'); link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
}
