# FDL contributor guide

## Repository purpose

FDL (pronounced "fiddle") is a JavaScript/TypeScript library for modeling
complex forms and tables. It defines field types, validation, dependencies,
records, and recordsets declaratively so UI components can concentrate on
rendering. The npm package is `@pmcelhaney/fdl`.

## Layout

- Root JavaScript modules contain the core runtime: `field.js`, `record.js`,
  `recordset.js`, filters, and utilities.
- TypeScript files provide builder APIs, form integration, declarations, and
  shared types. Public type exports are organized under `types/` and
  `index.d.ts`.
- `tests/` contains Jest unit and integration tests; TypeScript tests run via
  `ts-jest`.
- `docs/` holds the public API documentation.
- `examples/fdl-input/` is a Lit/Vite interactive form-control example.

## Development workflow

- Install dependencies with `npm install`.
- Run tests with `npm test` and static type checks with `npm run typecheck`.
- Use `npm run docs:dev` to run the documentation site.
- Keep public behavior, documentation, and type declarations aligned when
  changing exported APIs.
- Add or update focused Jest coverage for behavior changes.
- Prefer function declarations over function expressions and arrow functions
  for named functions.

## Documentation site

- `examples/fdl-input/` contains the single documentation website, including
  Home, How it Works, Contributing, and one page per modifier.
- Run `npm run docs:dev` from the repository root and open the printed root URL.
  Use `npm run docs:build` for production-build checks.
- Keep the site local unless the user explicitly requests deployment.

## Architecture and design principles

- Read [the design principles](docs/design-principles.md) before changing
  modifiers, components, or presentation behavior.
- Keep business rules, UI semantics, and visual presentation orthogonal:
  FDL owns reusable field and record behavior, components own accessible
  structure and interaction, and CSS owns visual expression.
- Modifiers should describe renderer-independent field behavior or stable
  cross-consumer presentation intent. Do not add DOM-specific properties,
  component escape hatches, lifecycle hooks, or event-driven orchestration to
  `FieldType`.
- When a rule is model behavior, enforce it in `FieldType`, `Record`, or
  `Recordset`; do not rely on CSS or a browser attribute as the source of
  truth.
- Keep the dependency direction moving forward: business rules -> semantic
  state -> accessible component -> visual theme.

## Live example presentation

- In table examples, scalar numeric fields such as amounts, totals, counts,
  and percentages should be explicitly right-aligned with the example’s field
  configuration. This is a presentation convention for examples, not a rule
  the framework should apply automatically.

## Architecture decision records

- Store ADRs in `docs/adr/` with a unique, sequential numeric identifier and
  keep them focused on one decision.
- ADRs must not include a radar-blips section or cite Andrew Harmel-Law's
  article. Record the repository-specific context, decision, options,
  consequences, and advice directly.

## Working-tree and Git rules

- Work directly in the repository root checkout on `main` and commit changes
  directly to `main`. Do not create task branches or linked worktrees unless
  the user explicitly requests one.
- Before starting work, check `git status --short --branch`. Identify ownership
  of existing changes and preserve unrelated work; never revert, stash, stage,
  or commit another task's changes.
- After each coherent batch, run relevant verification, inspect status and the
  diff, then stage and commit only files belonging to the current task.
- Use a concise, imperative commit message. Before reporting completion, check
  status again and report any remaining changes explicitly.
- Keep commits local unless the user explicitly requests a push or deployment.
