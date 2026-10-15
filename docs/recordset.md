# Recordset

A `Recordset` manages a collection of `Record` instances. It can fetch data,
sort and filter it, paginate the visible records, and report collection-level
validation errors.

Use the same `FieldType` map for every row:

```js
import { boolean, Recordset, string } from 'digital-fdl';

const fields = {
  id: string,
  title: string,
  isFavorite: boolean,
};
```

## Fetching data

Pass a fetch function as the second constructor argument. The function receives
one request object and may return data synchronously or as a promise. It can
return either an array of row values or `{ data, totalCount, summary }`.

```js
const reports = new Recordset(fields, async ({
  parameters,
  startIndex,
  pageSize,
  sort,
}) => {
  const response = await reportsApi.fetch({
    type: parameters.type,
    startIndex,
    pageSize,
    sort,
  });

  return {
    data: response.items.map(report => ({
      id: report.id,
      title: report.customTitle ?? report.title,
      isFavorite: report.favorite,
    })),
    totalCount: response.totalCount,
  };
});

await reports.requestHardUpdate();
```

The request object contains `parameters`, `startIndex`, `pageSize`, `page`,
`sort`, and `isFirstFetch`. Set `parameters`, `sortColumns`, `pageNumber`, or
`pageSize` to request an updated view. Those setters schedule an update; use
`recordset.updating` when code needs to wait for it.

```js
reports.parameters = { type: 'standard' };
reports.sortColumns = [{ field: 'title', sort: 'ascending' }];
await reports.updating;
```

## Client-side and server-side data

When the fetched `totalCount` equals the number of returned rows, the
`Recordset` treats the data as client-side: it sorts, filters, and slices the
current page locally. Otherwise, it treats the data as server-side and the
fetch function is responsible for paging and sorting.

For client-side filtering, assign a predicate that receives each `Record`:

```js
reports.filter = record => record.getField('isFavorite');
await reports.updating;
```

Useful read-only properties include `allRecords`, `currentPage`,
`filteredCount`, `totalCount`, `isLoading`, and `hasChanged`.

## ExampleRecordset

`ExampleRecordset` is intended for prototypes and demos. It creates the given
number of rows using an explicit row factory owned by the application.

```js
import ExampleRecordset from '../example-recordset';

const exampleReports = new ExampleRecordset(fields, 100, index => ({
  id: String(index + 1),
  title: `Report ${index + 1}`,
  isFavorite: false,
}));
await exampleReports.requestHardUpdate();
```

The row factory receives a zero-based index and returns a complete data row
matching the fields. This replaces the removed `exampleValue()` field modifier;
move former per-field generators into this factory. Existing two-argument
`ExampleRecordset(fields, count)` calls must supply the third argument.
