import ExampleRecordset from '../example-recordset';
import FieldType from '../field-type.js';

it('creates example rows through an explicit application factory', async () => {
    const rows = new ExampleRecordset({
        name: new FieldType<string>(),
        info: new FieldType<string>(),
    }, 3, index => ({name: `Person ${index + 1}`, info: 'administrator'}));
    await rows.requestUpdate();
    expect(rows.allRecords.map(record => record.values)).toEqual([
        {name: 'Person 1', info: 'administrator'},
        {name: 'Person 2', info: 'administrator'},
        {name: 'Person 3', info: 'administrator'},
    ]);
});

it('does not call the row factory for an empty example recordset', async () => {
    const createRow = jest.fn(() => ({name: 'Unused'}));
    const rows = new ExampleRecordset({name: new FieldType<string>()}, 0, createRow);
    await rows.requestUpdate();
    expect(createRow).not.toHaveBeenCalled();
    expect(rows.allRecords).toEqual([]);
});
