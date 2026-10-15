# FDL — Field Definition Library

[![Tests](https://github.com/pmcelhaney/FDL/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/pmcelhaney/FDL/actions/workflows/tests.yml)
[![Type check](https://github.com/pmcelhaney/FDL/actions/workflows/typecheck.yml/badge.svg?branch=main)](https://github.com/pmcelhaney/FDL/actions/workflows/typecheck.yml)
[![Documentation build](https://github.com/pmcelhaney/FDL/actions/workflows/docs-build.yml/badge.svg?branch=main)](https://github.com/pmcelhaney/FDL/actions/workflows/docs-build.yml)

FDL (pronounced “fiddle”) solves a recurring problem in complex forms: the same
business rule is often rewritten in input handlers, validation, review tables,
and exported output. FDL puts that behavior in one declarative field definition
so every consumer can interpret the same rule consistently.

The package models field types, records, and recordsets independently of the UI.
Renderers remain responsible for accessible controls and presentation; FDL owns
reusable behavior such as parsing, formatting, validation, dependencies,
comparison, filtering, and aggregation.

The single documentation site includes Home, How it Works, Contributing, and
modifier reference pages that group related rules, with live examples, model
state, and highlighted code. Each modifier retains its own hash link.
Run it locally with `npm run docs:dev` and open the root URL printed by Vite.
Building or previewing the site does not publish it.

## Common field definitions

Use named exports or the `fieldDefinitions` collection as reusable starting points:

```js
import { firstName, email, fieldDefinitions, Record } from "digital-fdl";

const contact = new Record({
  firstName: firstName.required(),
  email: email.required(),
  streetAddress: fieldDefinitions.streetAddress,
  postalCode: fieldDefinitions.postalCode.label("ZIP / postal code"),
}, {
  firstName: "Ada",
  email: "ada@example.com",
  streetAddress: "",
  postalCode: "",
});
```

The exports are `name`, `firstName`, `middleName`, `lastName`, `email`,
`phoneNumber`, `streetAddress`, `addressLine1`, `addressLine2`, `city`, `state`,
`postalCode`, `country`, `organization`, and `username`. Each provides a label
and autocomplete intent. Email and phone also provide input-type intent.

All presets are optional and default to an empty string. Email checks basic
`local@domain.suffix` syntax in the model, including when no UI is present;
it does not verify delivery or ownership. Names, phone numbers, and addresses
have no locale-specific validation or automatic normalization. Postal codes
remain strings, preserving leading zeros. Add application rules with modifiers;
specializing a preset leaves it and other specializations unchanged.

## Example: Dog Walking Service

Imagine a scheduling form for a dog-walking business. It has four fields:
name, date, new-customer status, and comments, with these rules:

- Name is required, must be 2–20 characters, and is capitalized for display.
- The new-customer checkbox is disabled for unrecognized names.
- Dates are required, must be weekdays, cannot be holidays, and new customers may book only on Friday.
- Comments are required for new customers.

Putting these rules directly in a template or scattering them through event
handlers makes them difficult to reuse and maintain. With FDL, define the
rules alongside each field type; the view only decides where to render fields.

```js
import { string, boolean, date, Record } from "digital-fdl";

const existingCustomers = ["Ada", "Grace"];
const holidays = [new Date(2026, 11, 25).toDateString()];

const name = string
  .required()
  .minLength(2)
  .maxLength(20)
  .formatter(capitalize);
const newCustomer = boolean
  .type("checkbox")
  .defaultValue(false)
  .disabled(record =>
    !existingCustomers.includes(record.getField("name")));
const appointmentDate = date
  .required()
  .validator({ name: "weekday", validate: isWeekday })
  .validator({ name: "not-holiday", validate: isNotHoliday })
  .validator({
    name: "new-customer-day",
    validate: isExistingCustomerOrNewCustomerDay,
  });
const comments = string.required(isNewCustomer);

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
  return record.getField("newCustomer");
}

function isDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function isWeekday(value) {
  return isDate(value) && value.getDay() !== 0 && value.getDay() !== 6;
}

function isNotHoliday(value) {
  return isDate(value) && !holidays.includes(value.toDateString());
}

function isExistingCustomerOrNewCustomerDay(value, _, record) {
  return isDate(value) && (!record.getField("newCustomer") || value.getDay() === 5);
}
```

This example validates model values: assign a JavaScript `Date` to `date`.
The `date` primitive does not parse native date-input strings automatically;
a date control needs an explicit parser and formatter. Field-setting callbacks
such as `required` receive `(record)`, while validators receive
`(modelValue, viewValue, record, options, field)`.

## Docs

Start custom definitions with the exported `field` instance, or specialize
`string`, `number`, `boolean`, and `date`. Modifiers chain directly and return
new definitions without changing the original. Pass definitions directly to
`Record` and `Recordset`; they handle runtime behavior automatically.
See [field types](./docs/field-type.md) for custom definitions and migration details. A
[Record](./docs/record.md) connects those definitions to values. A
[Recordset](./docs/recordset.md) manages a collection of records, including
fetching, sorting, filtering, and pagination.

Custom Lit controls can extend [`FormElement`](./docs/form-element.md) to connect a component to a field in a `Record`.

Contributors working on field behavior, components, or presentation should
follow the [FDL design principles](./docs/design-principles.md).
Integrations should also follow the explicit
[adapter contract](./docs/adapter-contract.md), which separates FDL-owned
behavior from component semantics and application concerns.

See [prospective FDL user personas](./docs/user-personas.md) for evaluation
profiles that test the home page and documentation against realistic needs.

The documentation site's modifier pages distinguish live examples, model-level
exercises, and adapter limitations. See the [release guide](./docs/releases.md)
and [changelog](./CHANGELOG.md) for release and versioning discipline.

## Run locally

Use Node 22.13 or newer.

```sh
git clone https://github.com/pmcelhaney/FDL.git
cd FDL
npm ci
npm test
npm run typecheck
```

Start the documentation site:

```sh
npm run docs:dev
```

Open the root URL printed by Vite. Verify the production build with:

```sh
npm run docs:build
```

The site source is in `examples/fdl-input/`. The repository's Markdown API
references and architecture records remain under `docs/`.

## Project status

The core library is being rehabilitated as a portfolio-quality reference. The
work emphasizes explicit architecture, candid capability documentation,
automated verification, and a reproducible first run. See the
[roadmap](./ROADMAP.md) for product direction; roadmap entries are intent, not
claims of shipped support.

## License

FDL is available under the [Apache License 2.0](./LICENSE). Preserve the
repository’s existing copyright and attribution notices when redistributing it.
