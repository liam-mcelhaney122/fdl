# FDL documentation site

This is the repository's only documentation website. It includes Home, How it
Works, Learn by exploring, Contributing, and one page per modifier, with live examples, model-level
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

## Exploring the explanations

- Home starts with a delivery experiment; `#learn` builds one example through
  storage, parsing, validation, dependencies, and collection reuse.
- How it Works includes an immutable-specialization experiment using the same
  definitions in form and table consumers.
- Modifier pages summarize model state first. Expand **Inspect full JSON** to
  see the complete values. Dependency traces read FDL's public state methods.
- Requiredness, minimum length, and filter matching have adjustable rules. The
  relevant definition updates alongside the example; reset restores its default.
- Validator, filter, and comparator examples compare several cases at once.
  Parser and formatter pages trace original input through stored and display values.
- On wide screens, the active definition sits beside the experiment and stays
  visible while scrolling. **Show its definition** and **Highlight its effect**
  connect the two regions and move keyboard focus; **Clear highlight** removes
  the emphasis. Narrow screens stack the same regions in reading order.

Keep explanations connected to actual FDL behavior. Configuration controls may
change the example's rule, but every editable domain value remains bound through
`fdl-field`. Preserve explicit adapter limitations instead of inventing support.
