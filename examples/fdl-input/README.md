# FDL documentation site

This is the repository's only documentation website. It includes Home, How it
Works, Contributing, and one page per modifier, with live examples, model-level
exercises, highlighted definitions, and rendering markup. The source uses Lit
and TypeScript, so serve it through Vite instead of opening HTML files directly.

From the repository root:

```sh
npm ci
npm run docs:dev
```

Open the root URL printed by Vite (normally `http://localhost:5173/`).

```sh
npm test
npm run typecheck
npm run docs:build
```

The production output is `examples/fdl-input/dist/`, with a single `index.html`
entry point. Building and previewing do not deploy the site.

Every editable field example uses `<fdl-field>` bound to an FDL record. The
field metadata selects a native input, select, or textarea. Table separators
support keyboard resizing: Left/Right for one pixel, Shift for ten pixels,
and Home/End for the available minimum/maximum.

Repository API references and architecture decision records remain in `docs/`.
