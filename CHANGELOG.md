# Changelog

All notable changes to FDL will be documented in this file. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A single documentation site with an introduction, contributor guidance, and
  one page per modifier with examples and explicit adapter limitations.
- Continuous integration for tests, static type checking, and the documentation-site
  production build.
- A documented release and compatibility checklist.
- An optional [Svelte 5 adapter](./docs/svelte-adapter.md) with one `FdlField`
  component, `recordStore`, `recordsetStore`, and `fieldStore` stores, and a
  `fieldControl` action. Svelte is an optional peer dependency; see
  [ADR-0009](./docs/adr/0009-add-svelte-adapter.md).

### Changed

- **Breaking:** modifiers now chain directly on immutable field definitions.
  Start custom definitions with the exported `field` instance or specialize a
  primitive. Records and recordsets prepare runtime behavior automatically.
  Remove sentence-style aliases and replace builder construction with `field`;
  see the [migration guide](./docs/field-type.md#migrating-direct-chains).

- The repository landing page now leads with the product problem FDL solves and
  includes a reproducible first-run path.

### Fixed

- Correct the README scheduling example, clarify primitive conversion and default
  lifecycle behavior, document synchronous/async validation boundaries, and align
  the adapter and modifier reference with current multiselect and emptiness rules.

### Removed

- The separate portfolio application, original example home page, and all-in-one
  cookbook page. The documentation site is now served at the root URL.

### Deprecated

- Renderer-specific and legacy modifiers listed in
  [ADR-0001](./docs/adr/0001-retire-post-jack-henry-modifiers.md). Their eventual
  removal requires a future breaking release.

## Repository baseline

The package manifest currently identifies version `1.0.0`. Historical release
dates and contents have not been reconstructed, so this changelog does not
present that manifest version as a newly verified or newly published release.
Future releases should add dated, comparison-linked sections only after their
tags and publication status are verified.
