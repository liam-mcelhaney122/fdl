# FDL documentation site

This is the repository's only documentation website. It includes Home, How it
Works, Learn by exploring, Modifier categories, Contributing, and modifier reference pages that group closely related rules, with live examples, model-level
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

Every interactive example uses `<fdl-example>` for its collapsible frame and
source-file tabs. Slot the working demo inside it and pass `filenames` and
`sources` for the model, view, and optional CSS. Modifier examples also set
`modifier` to highlight the relevant calls in the model tab.

Every editable field example uses `<fdl-field>` bound to an FDL record. The
field metadata selects a native input, select, or textarea. Table separators
support keyboard resizing: Left/Right for one pixel, Shift for ten pixels,
and Home/End for the available minimum/maximum.

Repository API references and architecture decision records remain in `docs/`.

## Exploring the explanations

- `#categories` explains all seven category purposes, lists each current modifier,
  and connects related rules with links to their live examples. Category jump
  links preserve the section in the URL.

- Home starts with a delivery experiment. Pickup keeps the store selector visible
  but disabled until a five-digit ZIP is entered. Sample store lookups for 28202
  and 10001 simulate a two-second delay with a loading spinner; changing the ZIP
  starts a new lookup, older results cannot overwrite it, and the record clears
  a store selection absent from the latest choices. `#learn` builds one
  example through storage, parsing, validation, dependencies, and collection reuse.
- `#composition` connects adjustable visibility, requiredness, and validation
  rules to six model-computed outcomes and a selected live form. Selecting an
  outcome loads its exact sample; editing the form highlights the matching
  address category. The address-format check is illustrative.
- How it Works includes an immutable-specialization experiment using the same
  definitions in form and table consumers.
- Modifier pages summarize model state first. Expand **Inspect full JSON** to
  see the complete values. Dependency traces read FDL's public state methods.
- Requiredness, minimum length, and filter matching have adjustable rules. The
  model tab updates with the complete definition; reset restores its default.
- Validator, filter, and comparator examples compare several cases at once.
  Parser and formatter pages trace original input through stored and display values.
- Every modifier example has connected model and view source tabs: the
  complete record or recordset definition, followed by the Lit UI using that
  same model. Save the labeled files in the same folder: the model file exports
  its record and any shared helpers; the Lit file imports them explicitly.
  Component imports refer to this site’s adapters.
  Teaching panels and rule selectors are omitted from the snippets. Unsupported
  adapter interactions remain explicit.
- Class-based styling examples (`cellClass` and
  `rowClass`) also provide a CSS tab. These rules are shared
  with the live table and belong in its shadow-root stylesheet, not the page
  stylesheet.

Keep explanations connected to actual FDL behavior. Configuration controls may
change the example's rule, but every editable domain value remains bound through
`fdl-field`. Preserve explicit adapter limitations instead of inventing support.

Disabled field controls use a gray fill, dashed border, and unavailable cursor
while keeping their values readable. The `disabled` page
shows the same CSS used by the field adapter.

The learning path uses a compact question selector and a reset for the current
question. Its final step distinguishes the form/review record from table
snapshots, lists abilities to check, and offers an optional cancellation-rule
transfer challenge. Continuing into composition carries the delivery choice and
charge snapshot in the link; changing between a continued scenario and a plain
composition link starts a fresh experiment.

Composition places rule controls directly before the outcome comparison. Optional
prediction practice reveals actual model outcomes after a guess. Keep up to six
custom cases to compare their saved rules with current rules, restore them, or
remove them. The explorer retains this experiment, its kept cases, and the field
builder while visiting other pages in the same session. Returning resumes that
work.
Opening a different composition scenario starts a fresh experiment; reloading
the site also starts fresh. Reset rules and example preserves kept cases;
Remove and Clear kept cases delete them. Reset builder restores its initial
configuration and preview values.
The optional field builder uses structured rules, previews an actual FDL Record,
and displays matching model and Lit code below the preview.

Reference paging follows active search/category results. Narrow screens collapse
navigation behind Browse modifiers. Conditional-cell styling exposes an editable
threshold and boundary cases; width examples expose measured widths and active
constraints. Filter text is shared between the table header and comparison.

Clicking a sortable table heading toggles ascending/descending and makes that
column the first sort priority. Existing columns remain as tie-breakers; clicking
a heading never removes its sort. Keyboard activation uses the same button action.

Related modifiers share one reference page: permanent and conditional cell
classes, disabled state, read-only state, and requiredness; minimum and maximum
text length; and minimum, target, and maximum column widths. Every modifier
retains its original hash link and sidebar entry, which opens its section.
Each section has its own live example, reset, model source, and Lit source. Previous/Next navigates between distinct reference pages.

## Reusing the record inspector

Import `./fdl-record-inspector` to register `<fdl-record-inspector>`, then bind
an FDL record as a JavaScript property:

```ts
html`<fdl-record-inspector .record=${record}></fdl-record-inspector>`;
```

The inspector shows every declared field by default, including fields with no
stored value. Set `.fields=${['name', 'email']}` to select and order the displayed
fields. Values are the record's raw stored values, so an option's key appears
rather than its display label. Status icons expose hidden, disabled, read-only,
required, and invalid states; record validity covers the complete record even
when only some fields are displayed.

The magnifying glass button collapses and expands the panel. Set `collapsed`
as an HTML attribute or `.collapsed=${true}` to start with only the icon. The
reflected `collapsed` attribute lets the surrounding layout reclaim the panel's
space, as the delivery example does. The component listens to record changes
and releases its listener when removed or rebound to another record; its parent
does not need to request updates for it. This is a documentation-site component,
imported from the example source alongside `fdl-field`.

## Reusing the recordset inspector

Import `./fdl-recordset-inspector` and bind the live recordset:

```ts
html`<fdl-recordset-inspector .recordset=${recordset}></fdl-recordset-inspector>`;
```

The inspector displays matching, total, loaded, and current-page counts, the page
number and size, sort priorities, and a table of raw stored values on the current
page. Field-state icons and the icon legend are shared with the record inspector.
Applicable field-state icons appear to the left of stored values. A leading status
column shows the same Invalid icon when a complete record fails validation; valid
records have no row status icon or Valid label. The JSON disclosure
includes current-page values and view metadata. Server-side totals can exceed
the number of loaded records; the inspector reports these separately.

Use `.fields=${['name', 'amount']}` to select and order the displayed columns;
the default is every declared field. Column headers use field keys to make it
easy to match values to the model source. The panel observes recordset updates
and loaded-record edits independently of its parent and releases subscriptions
when rebound or removed. `collapsed` and `.collapsed=${true}` work like the
record inspector. Inspection does not change sorting, filtering, paging, or data.
