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
It begins with a fictional payment workflow that uses `FieldType`, `Record`,
`Recordset`, `<fdl-field>`, and `<fdl-table>` together. Change the payment rail
to see ACH-only fields and validation turn on and off, then review the payment
to see the same FDL print formatting drive the table and CSV preview.
Each entry explains one modifier and either provides a
focused live example or clearly documents why this native-control example does
not yet have enough integration to demonstrate it honestly. Expandable field-
type definitions accompany the functional examples.

Every editable example renders the same `<fdl-field>` custom element. The
field's metadata determines whether that component creates a native input,
select, or textarea.

Table column separators are focusable. Use Left Arrow and Right Arrow to resize
by one pixel, hold Shift for ten-pixel steps, or use Home and End to move to the
minimum and maximum widths allowed by the surrounding columns.
