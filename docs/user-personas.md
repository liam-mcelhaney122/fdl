# FDL user personas

These personas describe potential users of FDL and the problems its
declarative field, record, and recordset model can help them solve.

## Maya Chen — Design-system engineer

Maya builds reusable React components for a product platform used by several
teams. She needs form fields to behave consistently across products while
allowing each team to apply its own visual theme.

FDL helps Maya centralize field semantics—validation, requiredness,
dependencies, and formatting—without making the design system responsible for
business rules.

## Jordan Reyes — Operations platform developer

Jordan maintains an internal operations app with dense editable tables:
orders, approvals, staffing, and exceptions. Their users need
spreadsheet-like speed, but data rules are complicated and interdependent.

FDL gives Jordan a declarative way to define records, recordsets, calculated
values, and validation so the table UI can stay focused on editing and
accessibility.

## Priya Nair — Product engineer at a SaaS startup

Priya ships customer-facing workflows such as onboarding, billing setup, and
configuration. Requirements change frequently, and form logic tends to sprawl
across components, API handlers, and validation schemas.

She uses FDL to make form rules readable and composable, reducing the cost of
changing a workflow without accidentally breaking conditional behavior.

## Eli Brooks — Agentic coding workflow builder

Eli builds coding agents that generate and revise application features. He
wants the agents to work from a stable, declarative model rather than infer
rules from scattered UI code.

FDL provides an explicit contract for fields, records, validation, and
dependencies. An agent can inspect the model, propose focused changes,
generate tests from defined rules, and update a renderer separately—making
agent-driven edits safer and easier to review.

## Samira Patel — Accessibility-minded frontend consultant

Samira helps organizations modernize legacy form-heavy applications. Her
projects often contain inconsistent error handling, unclear required-field
behavior, and fragile conditional sections.

She uses FDL as the behavioral layer beneath accessible components: field
state and dependencies are modeled once, while the UI implementation can
provide appropriate labels, errors, focus handling, and visual treatment.
