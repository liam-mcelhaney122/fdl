# FDL user personas

These personas represent potential FDL users and give future documentation
reviews a concrete reader to serve. They are not market claims. Each persona
has a distinct job, level of context, and standard for deciding whether FDL is
a good fit.

When using these personas to evaluate documentation, assess whether the
material lets the person answer their questions and complete their first
meaningful task without relying on unstated knowledge of the repository.

## Maya Chen — Design-system engineer

Maya is a staff frontend engineer on a platform team. Her company has six
product teams, a React-based design system, and an established accessibility
review process. The platform team owns shared components such as text inputs,
date pickers, selects, and error summaries. Product teams own their workflow
rules: eligibility, requiredness, valid values, conditional sections, and
domain-specific formatting.

Today, every product team passes a different mixture of props, callbacks, and
schema fragments into the shared components. The result is subtle drift: a
field that is required in a review table is optional in the editor; a date
formatter is copied into a CSV export; a dependency is evaluated in one
component but not another. Maya is investigating FDL because she wants a
renderer-independent definition of field behavior. She does *not* want a
library that chooses DOM structure, replaces her design system, or turns a
component's private props into the application model.

Maya is fluent in TypeScript, React, accessibility basics, and package
integration. She will skim first and then look closely at the public types,
the `FieldType` API, and any component example. She expects a clear boundary
between FDL, a form adapter, and CSS. She is wary of APIs that expose raw HTML
attributes as supposedly reusable model features, or examples that imply a
particular UI control is the only way to render a field.

### Documentation evaluation lens

- Can Maya explain what FDL owns versus what her React components and CSS own?
- Can she define validation, dependencies, parsing, formatting, and stable
  presentation intent once, then see how different consumers could interpret
  them?
- Are public APIs, TypeScript declarations, immutability rules, and modifier
  composition documented precisely enough for a platform-team adoption?
- Does the component documentation show how FDL state becomes accessible
  semantics without claiming that FDL itself supplies the semantics or theme?

## Jordan Reyes — Operations platform developer

Jordan is a senior full-stack developer on an internal operations platform for
fulfillment, staffing, and exception handling. Most screens are large editable
tables rather than one-record-at-a-time forms. A dispatcher may change a
shipment's date, quantity, status, and assigned warehouse across dozens of
rows before submitting. Rules cross fields and rows: a quantity must be
positive, a restricted status requires a reason, an order cannot exceed its
allocation, and a filtered or sorted view must remain predictable while users
edit it.

Jordan's current React table contains ad hoc calculations, duplicate
validation, and fragile synchronization between visible cells and the data
sent to the server. Speed matters: users expect keyboard editing and useful
feedback, not a modal form for every row. Jordan is interested in FDL's
`Record` and `Recordset` abstractions because they may provide a consistent
model beneath both a grid and a detail view. Jordan does not expect FDL to
provide a production grid, persistence layer, permission system, or conflict
resolution strategy.

Jordan is comfortable reading JavaScript and tests, but has little patience
for conceptual prose without a worked example. They begin with a realistic
table use case and need to understand lifecycle and mutation behavior before
trusting the library. They will notice quickly if documentation confuses
sorting, filtering, pagination, validation, aggregation, and UI rendering.

### Documentation evaluation lens

- Can Jordan build a small editable recordset with field definitions,
  initial values, validation, filtering, sorting, and aggregation?
- Is it clear which operations are performed by `FieldType`, `Record`, and
  `Recordset`, and what the consuming grid must implement itself?
- Do examples cover cross-field rules, calculated or derived values, and the
  behavior of invalid data in a way that applies to dense table editing?
- Are mutability, identity, updates, and edge cases described well enough to
  prevent stale UI state or accidental loss of edits?

## Priya Nair — Product engineer at a SaaS startup

Priya is a product engineer at a growing B2B SaaS company. She owns customer
onboarding, billing setup, and account configuration flows. Product managers
frequently revise the workflow: a new plan adds an option, an integration
changes which fields are required, or a compliance rule makes a previously
optional question conditional. She works in a TypeScript application with a
small team, limited time for infrastructure, and no dedicated form-modeling
group.

Her forms currently combine local component state, a schema validator, API
error mapping, and scattered conditional JSX. A change that looks small often
requires edits in several places, and regressions appear when a condition is
updated on one screen but not another. Priya wants FDL to make a workflow's
rules visible close to the fields they govern and reusable in the editor,
review screen, and API-bound record. She needs a quick path to a first working
form, but she also needs to know where FDL stops so she can make sensible
integration decisions.

Priya knows TypeScript and React well, but she is new to FDL's vocabulary. She
will start at the README and copy an example before reading reference material.
She values concise explanations of the common path, explicit imports, runnable
snippets, and troubleshooting guidance. She will abandon the evaluation if
getting from a field definition to a displayed error requires guessing at
hidden setup.

### Documentation evaluation lens

- Does the README make the problem, core terms, installation, and smallest
  useful example immediately clear?
- Can Priya model an onboarding flow with defaults, option lists, conditional
  requiredness, validators, and formatting without having to infer API shape?
- Does the documentation distinguish client-side model validation from server
  validation, submission, routing, and persistence responsibilities?
- Are common changes—adding a field, changing a rule, inspecting errors, and
  testing a workflow—easy to find and follow?

## Eli Brooks — Agentic coding workflow builder

Eli leads developer productivity at a company that uses coding agents to
implement well-scoped application changes. Their agents can read repositories,
write code, run tests, and prepare pull requests, but they are unreliable when
the relevant behavior is implicit in JSX branches, duplicated validators, and
component-specific event handlers. Eli is evaluating FDL as a domain model
that gives agents a stable place to inspect and change form rules.

Eli's ideal task is specific: “Add a tax ID field for international accounts;
require and validate it only when the country is not domestic; show it in the
review table; preserve the existing design-system rendering.” An agent should
be able to identify the field definition, understand which model rule to add,
update focused tests, and know which UI adapter needs semantic rendering work.
It must not treat a CSS class, a component prop, or an incidental test fixture
as the source of truth. Eli also needs changes to be reviewable by humans:
small diffs, explicit contracts, and tests that demonstrate behavior rather
than merely storing implementation details.

Eli is technically expert, skeptical of vague abstractions, and thinks in
terms of repository navigation and verification. He will read API references,
type declarations, test examples, and architectural guidance. He expects
documentation to name invariants, ownership boundaries, extension points, and
negative constraints—especially what an agent should not change when altering
a business rule.

### Documentation evaluation lens

- Can an agent or reviewer locate the authoritative definition for a field's
  validation, dependency, formatting, and presentation intent?
- Are terminology, API contracts, and examples consistent enough to turn into
  reliable code-generation and test-generation instructions?
- Do the design principles explain the forward dependency direction from
  business rules to semantic component state to visual theme, with concrete
  examples of prohibited shortcuts?
- Does the documentation make a focused change like Eli's tax-ID task
  traceable across model code, renderer integration, types, documentation, and
  tests without conflating those responsibilities?

## Samira Patel — Accessibility-minded frontend consultant

Samira is an independent frontend consultant brought into mature applications
where form behavior has become inconsistent. Her clients often have legacy
HTML, a mix of component libraries, uneven automated coverage, and users who
rely on keyboards or assistive technology. She commonly finds that a red
border is the only error message, a visually hidden section remains focusable,
or a required indicator is added by CSS while the submitted data accepts an
empty value.

Samira is not looking for FDL to make an inaccessible interface accessible by
itself. She wants a reliable behavioral model that accessible components can
interpret: required, disabled, read-only, visible, options, validation
results, labels, and errors should be grounded in a single source of truth.
She needs to preserve a client's chosen component stack while steadily
separating business policy from semantics and presentation. She will reject
documentation that presents ARIA attributes or CSS selectors as a substitute
for model behavior, or that claims accessibility without explaining the
component's responsibilities.

Samira knows HTML, ARIA patterns, assistive-technology testing, and TypeScript.
She reads architecture documentation before API references and assesses
examples for semantic omissions. She values candid limitations, because clear
boundaries let her scope adapter work and accessibility testing honestly.

### Documentation evaluation lens

- Does the documentation clearly assign validation and conditional state to
  FDL, accessible structure and interaction to components, and appearance to
  CSS?
- Can Samira determine how an adapter should expose requiredness, errors,
  disabled state, visibility, labels, focus behavior, and keyboard interaction
  without FDL dictating a specific markup structure?
- Do examples avoid implying that browser attributes, visual styling, or
  hidden DOM alone enforce model rules?
- Are limitations and integration responsibilities candid enough for Samira to
  plan accessible components and test them with real assistive technologies?
