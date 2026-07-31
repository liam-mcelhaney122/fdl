# FDL

[![Tests](https://github.com/pmcelhaney/FDL/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/pmcelhaney/FDL/actions/workflows/tests.yml)
[![Type check](https://github.com/pmcelhaney/FDL/actions/workflows/typecheck.yml/badge.svg?branch=main)](https://github.com/pmcelhaney/FDL/actions/workflows/typecheck.yml)
[![Portfolio build](https://github.com/pmcelhaney/FDL/actions/workflows/portfolio-build.yml/badge.svg?branch=main)](https://github.com/pmcelhaney/FDL/actions/workflows/portfolio-build.yml)

FDL (pronounced “fiddle”) solves a recurring problem in complex forms: the same
business rule is often rewritten in input handlers, validation, review tables,
and exported output. FDL puts that behavior in one declarative field definition
so every consumer can interpret the same rule consistently.

The package models field types, records, and recordsets independently of the UI.
Renderers remain responsible for accessible controls and presentation; FDL owns
reusable behavior such as parsing, formatting, validation, dependencies,
comparison, filtering, and aggregation.

Explore the portfolio locally through the narrative `/demo`, engineering
`/case-study`, complete `/reference`, and documentation `/docs` routes. The
portfolio is local-only by default and must not be deployed without explicit
authorization.

## Example: Dog Walking Service

Imagine a scheduling form for a dog-walking business. It has four fields:
name, date, new-customer status, and comments, with these rules:

- Name must be 2–20 characters and is capitalized for display.
- The new-customer checkbox is disabled for unrecognized names.
- Dates must be weekdays, cannot be holidays, and new customers may book only on Friday.
- Comments are required for new customers.

Putting these rules directly in a template or scattering them through event
handlers makes them difficult to reuse and maintain. With FDL, define the
rules alongside each field type; the view only decides where to render fields.

```js
import { string, boolean, date, Record } from "digital-fdl";

const name = string.with
  .minLength(2)
  .and.maxLength(20)
  .and.formatter(capitalize);
const newCustomer = boolean.with
  .defaultValue(false)
  .thatIs.disabledWhen(isNewCustomer);
const appointmentDate = date.with
  .validator({ name: "weekday", validate: isWeekday })
  .and.validator({ name: "not-holiday", validate: isNotHoliday })
  .and.validator({
    name: "new-customer-day",
    validate: isExistingCustomerOrNewCustomerDay,
  });
const comments = string.thatIs.requiredWhen(isNewCustomer);

const appointment = new Record({
  name,
  newCustomer,
  date: appointmentDate,
  comments,
}, {
  name: "",
  newCustomer: false,
  date: null,
  comments: "",
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function isNewCustomer(record) {
  return !existingCustomers.includes(record.getField("name"));
}

function isWeekday(value) {
  return value.getDay() !== 0 && value.getDay() !== 6;
}

function isNotHoliday(value) {
  return !holidays.includes(value);
}

function isExistingCustomerOrNewCustomerDay(value, _, record) {
  return existingCustomers.includes(record.getField("name")) || value.getDay() === 5;
}
```

## Docs

In the example, `string`, `boolean`, and `date` are `FieldType` instances. A
[Record](./docs/record.md) connects those definitions to values. A
[Recordset](./docs/recordset.md) manages a collection of records, including
fetching, sorting, filtering, and pagination.

Custom Lit controls can extend [`FormElement`](./docs/form-element.md) to connect a component to a field in a `Record`.

Contributors working on field behavior, components, or presentation should
follow the [FDL design principles](./docs/design-principles.md).

See [potential FDL user personas](./docs/user-personas.md) for the audiences
and form-modeling problems the library is intended to support.

The portfolio’s [modifier support matrix](./portfolio/app/reference/page.tsx)
distinguishes demonstrated behavior, model-only behavior, and adapter work. See
the [release guide](./docs/releases.md) and [changelog](./CHANGELOG.md) for the
current rehabilitation and versioning discipline.

## Run locally

Use Node 22.13 or newer so the library and portfolio share one runtime baseline.

```sh
git clone https://github.com/pmcelhaney/FDL.git
cd FDL
npm ci
npm test
npm run typecheck
```

Start the interactive Lit form-control example with:

```sh
npm run example:fdl-input
```

Set up and run the portfolio from the repository root:

```sh
npm run portfolio:setup
npm run portfolio:dev
```

Open the local URL printed by the development server. Create a production
portfolio build with `npm run portfolio:build`.

## Project status

The core library is being rehabilitated as a portfolio-quality reference. The
work emphasizes explicit architecture, candid capability documentation,
automated verification, and a reproducible first run. See the
[roadmap](./ROADMAP.md) for product direction; roadmap entries are intent, not
claims of shipped support.

## License

FDL is available under the [Apache License 2.0](./LICENSE). Preserve the
repository’s existing copyright and attribution notices when redistributing it.
