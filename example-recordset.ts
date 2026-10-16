import Recordset from './recordset.js';
import type { FieldDefinition } from './types/field-definition.types';

type ExampleFields<T extends object> = {
    [K in keyof T]: FieldDefinition<T[K]>;
};

export default class ExampleRecordset<T extends object> extends Recordset<T> {
    constructor(fields: ExampleFields<T>, rowCount: number, createRow: (index: number) => T) {
        const data = Array.from({ length: rowCount }, (_, index) => createRow(index));
        super(fields, () => data);
    }
}
