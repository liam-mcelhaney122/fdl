# FDL interactive example

This example uses TypeScript source files, so it must be served by Vite rather
than opened directly from the filesystem.

```sh
npm run example:fdl-input
```

Then open the exact URL printed by Vite (normally
[`http://localhost:5173/`](http://localhost:5173/)). The home page introduces
the example; the [modifier cookbook](http://localhost:5173/cookbook/) is a
separate page. Do not open either HTML file with a `file://` URL.

The modifier cookbook includes every supported public builder API in alphabetical
order. Compatibility-only builder APIs are intentionally omitted.
Each entry explains one modifier and either provides a
focused live example or clearly documents why this native-control example does
not yet have enough integration to demonstrate it honestly. Expandable field-
type definitions accompany the functional examples.

Every editable example renders the same `<fdl-field>` custom element. The
field's metadata determines whether that component creates a native input,
select, or textarea.
