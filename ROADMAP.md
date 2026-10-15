# FDL Roadmap

This is a future-facing backlog, captured July 30, 2026. It records product
intent only; it does not authorize implementation on its own.

## Documentation site consolidation

As of October 14, 2026, FDL has one documentation site in
`examples/fdl-input/`, served at the root URL with `npm run docs:dev`. It includes
Home, How it Works, Contributing, and the modifier reference. The separate
portfolio app and older example pages have been removed. The dated backlog
below is historical intent, not a request to restore those separate sites.

## Product direction

The first impression should be a solved product problem, rather than a library
reference. The portfolio should make FDL's core value clear quickly: one
declarative field definition can drive forms, validation, tables, and
print/export-oriented output consistently.

That definition should also be extensible: applications can establish a shared
domain type, such as `money`, and derive context-specific types such as
`money.cellClass('balance')` without mutating the baseline. This
baseline-to-specialization pattern is a core part of FDL's value, not merely a
builder convenience.

The modifier cookbook remains valuable reference material, but should be a
secondary destination (for example, a reference page) rather than the primary
landing experience.

## Prioritized backlog

### 1. Deliver a narrative-led end-to-end scenario

Build the ACH payment and multi-jurisdictional child-support scenario as the
primary demonstration. It should show:

- a payment workflow with conditional requirements;
- the same FDL definitions driving input, validation, a review table, and a
  printable or export-oriented representation;
- a business rule changing live, followed by the small field definition that
  produces it;
- conditional required, visible, and disabled fields; dependent options; and
  parsing and formatting; and
- a `Recordset` rendered as a sortable, resizable table.

### 2. Make quality and onboarding visible

- Add GitHub Actions for tests, type checking, and the demo build.
- Add test/typecheck badges, a deployed demo URL, and a short fresh-clone
  "Run locally" path.
- Establish a release/versioning story and changelog.
- Provide generated or tightly curated API reference material.
- Resolve the coverage-output path error reported by the test command before
  using the repository as a showcase, even if the tests otherwise pass.

### 3. Complete reference documentation and demonstrations

Document and demonstrate every modifier sufficiently. Keep the catalog candid,
but surface a concise support matrix that distinguishes implemented behavior,
model-only behavior, and planned adapters rather than foregrounding unsupported
entries.

### 4. Remove the Lit runtime dependency

Refactor the Lit components into framework-independent, bare-metal custom
elements with no dependency on Lit, preserving the separation of business
rules, semantic components, and visual presentation.

### 5. Build the documentation and portfolio site

Create a site that brings together the end-to-end demo, full documentation,
and examples. Include a concise case-study page for hiring managers that covers:

- the problem of duplicated rules across complex financial workflows;
- the model -> semantic component -> presentation theme architecture, with a
  small architecture diagram;
- tradeoffs around immutable builders, renderer independence, validation
  ownership, and accessibility; and
- evidence such as tests, supported integrations, and known limitations.

Distill the design philosophy from `docs/design-principles.md` for this page,
while linking to the complete engineering version.

### 6. Clarify project history and rehabilitation

Add a project-history section stating what was inherited, what was personally
rebuilt or improved, and the permission or license basis for presenting the
project publicly. Add a rehabilitation story with concrete evidence: starting
condition, decisions, AI's role in accelerating exploration or boilerplate,
and how tests, review, and manual verification governed the result. The
headline should be engineering judgment and verification; AI is the
accelerator.

### 7. Build the parallel React implementation

Build a parallel component implementation based on React rather than custom
elements, using the same declarative FDL model where practical.

## Portfolio objective

Develop FDL into a strong portfolio piece demonstrating platform architecture
and AI-assisted development. The near-term focus is a deployed, narrative-led
demo, the end-to-end payment scenario, CI, and a frictionless first-run
experience.
