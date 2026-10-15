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
- `#composition` connects adjustable visibility, requiredness, and validation
  rules to six model-computed outcomes and a selected live form. Selecting an
  outcome loads its exact sample; editing the form highlights the matching
  address category. The address-format check is illustrative.
- How it Works includes an immutable-specialization experiment using the same
  definitions in form and table consumers.
- Modifier pages summarize model state first. Expand **Inspect full JSON** to
  see the complete values. Dependency traces read FDL's public state methods.
- Requiredness, minimum length, and filter matching have adjustable rules. The
  complete definition updates below the example; reset restores its default.
- Validator, filter, and comparator examples compare several cases at once.
  Parser and formatter pages trace original input through stored and display values.
- Every modifier page shows two connected code examples below its demo: the
  complete record or recordset definition, followed by the Lit UI using that
  same model. Save the labeled files in the same folder: the model file exports
  its record and any shared helpers; the Lit file imports them explicitly.
  Component imports refer to this site’s adapters.
  Teaching panels and rule selectors are omitted from the snippets. Unsupported
  adapter interactions remain explicit.
- Class-based styling examples (`cellClass`, `conditionalCellClass`, and
  `rowClasses`) also show their CSS after the Lit UI. These rules are shared
  with the live table and belong in its shadow-root stylesheet, not the page
  stylesheet.

Keep explanations connected to actual FDL behavior. Configuration controls may
change the example's rule, but every editable domain value remains bound through
`fdl-field`. Preserve explicit adapter limitations instead of inventing support.

Disabled field controls use a gray fill, dashed border, and unavailable cursor
while keeping their values readable. The `disabled` and `disabledWhen` pages
show the same CSS used by the field adapter.

Every modifier offers a downloadable runnable ZIP with its model/view files,
compiled example adapters and styles, a bundled snapshot of the current FDL
model, and a minimal Lit/Vite project. `starter-assets.mjs` supplies those assets
through a Vite virtual module, loaded only when downloading. The ZIP is created
locally in the browser; it does not use a download service. Verify representative
starters independently, including a form, table styling, and dependent options.


The learning path uses a compact question selector and a reset for the current
question. Its final step distinguishes the form/review record from table
snapshots, lists abilities to check, and offers an optional cancellation-rule
transfer challenge. Continuing into composition carries the delivery choice and
charge snapshot in the link; plain composition links start a fresh experiment.

Composition places rule controls directly before the outcome comparison. Optional
prediction practice reveals actual model outcomes after a guess. Keep up to six
custom cases to compare their saved rules with current rules, restore them, or
remove them. These cases live only in the current experiment. Reset clears them.
The optional field builder uses structured rules, previews an actual FDL Record,
and exports matching model/Lit files in the same runnable starter format.

Reference paging follows active search/category results. Narrow screens collapse
navigation behind Browse modifiers. Conditional-cell styling exposes an editable
threshold and boundary cases; width examples expose measured widths and active
constraints. Filter text is shared between the table header and comparison.
