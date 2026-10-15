import Recordset from './recordset.js';
import FieldType from './field-type';

type ExampleFields<T extends object> = {
    [K in keyof T]: FieldType<T[K]>;
};

export default class ExampleRecordset<
    T extends object
> extends Recordset<T> {
    constructor(fields: ExampleFields<T>, rowCount: number, createRow: (index: number) => T) {
        const data = Array.from({ length: rowCount }, (_, index) => createRow(index));
        super(fields, () => data);
    }
}
