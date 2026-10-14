# FDL contributor guide

## Repository purpose

FDL (pronounced "fiddle") is a JavaScript/TypeScript library for modeling
complex forms and tables. It defines field types, validation, dependencies,
records, and recordsets declaratively so UI components can concentrate on
rendering. The published package is `digital-fdl`.

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

- Treat the repository root checkout as an integration-only checkout. Do not
  edit files, generate files, run formatters that rewrite files, or develop
  directly in the root checkout; implementation belongs in a linked worktree.
- Before starting work, run `git status --short --branch` and
  `git worktree list`. If the checkout or assigned worktree is dirty, identify
  which task owns each change before proceeding. Never assume an existing
  change is yours.
- Preserve unrelated edits already present in the working tree; do not stage,
  revert, or reformat them as part of another task.
- If the root checkout is dirty when a task begins, stop and report the dirty
  paths unless you are the designated integration task handling those changes.
  Do not make the root checkout clean by reverting, stashing, or committing
  another task's work.
- After every coherent batch of changes, run the relevant verification and
  commit that batch before beginning the next one.
- Stage and commit only files that belong to the current batch. Use a concise,
  imperative commit message that describes the change.
- Immediately before staging and committing, re-check status and the diff so a
  concurrent task has not changed the files or added unrelated paths.
- Before reporting completion, run `git status --short --branch` in the owned
  worktree and confirm it is clean. Report any remaining files explicitly.

## Parallel task worktrees

- Keep the repository root checkout as the integration worktree. It is reserved
  for merging or cherry-picking completed task commits and related integration
  verification; it is not a task worktree.
- Each parallel task must use a linked worktree under `.worktrees/<task-name>`
  on its own `codex/<task-name>` branch.
- A task must not edit, stage, commit, or switch branches in the root checkout
  or in another task's worktree.
- Create a task worktree from the current integration branch with:
  `git worktree add .worktrees/<task-name> -b codex/<task-name> main`
- Before creating a worktree, ensure the integration checkout is clean and on
  the intended base branch. If it is dirty, stop and resolve ownership first.
- A task owns only its assigned worktree and branch. Do not edit another task's
  worktree or branch.
- Run the relevant tests and type checks in the task worktree, commit the
  completed batch there, then merge the task branch from the integration
  worktree.
- Only the designated integration task may modify the root checkout, and only
  for an explicitly identified merge, cherry-pick, conflict resolution, or
  integration-only verification step. It must check status before and after
  that operation and leave the root checkout clean.
- After a successful merge, remove the linked worktree with
  `git worktree remove .worktrees/<task-name>` and prune stale metadata with
  `git worktree prune`.
- Never create a new task worktree from a dirty checkout. Do not use a stash as
  a substitute for ownership or isolation; commit or explicitly isolate the
  pending changes first.
