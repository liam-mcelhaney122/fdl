import fs from 'fs';
import path from 'path';
import { boolean, date, field, number, Record, Recordset, string } from '../index';

// Execute the actual published example so undefined helpers and callback drift
// fail here instead of in a reader's first application.
function readmeAppointment() {
    const markdown = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8');
    const source = markdown
        .slice(markdown.indexOf('## Example: Dog Walking Service'))
        .match(/```js\n([\s\S]*?)```/)[1]
        .replace(/^import .*;\n/m, '');
    return new Function('string', 'boolean', 'date', 'Record', `${source}\nreturn appointment;`)(
        string,
        boolean,
        date,
        Record
    );
}

describe('documentation examples', () => {
    it('validates the README scheduling rules, including empty and invalid dates', () => {
        const appointment = readmeAppointment();
        expect(appointment.isValid()).toBe(false);
        appointment.setFields({ name: 'Ada', date: new Date(2026, 9, 12) }); // Monday
        expect(appointment.isValid()).toBe(true);
        expect(appointment.print('name')).toBe('Ada');
        const newCustomer = appointment.fieldTypeForField('newCustomer');
        expect(newCustomer.isDisabled(false, appointment)).toBe(false);
        appointment.setField('name', 'Unknown');
        expect(newCustomer.isDisabled(false, appointment)).toBe(true);
        appointment.setField('name', 'Ada');
        appointment.setField('newCustomer', true);
        expect(appointment.isValid('date')).toBe(false);
        expect(appointment.isValid('comments')).toBe(false);
        appointment.setFields({ date: new Date(2026, 9, 16), comments: 'First visit' }); // Friday
        expect(appointment.isValid()).toBe(true);
        appointment.setField('date', new Date(2026, 11, 25));
        expect(appointment.isValid('date')).toBe(false);
        appointment.setField('date', new Date(2026, 9, 17)); // Saturday
        expect(appointment.isValid('date')).toBe(false);
        appointment.setField('date', new Date('invalid'));
        expect(appointment.isValid('date')).toBe(false);
    });

    it('keeps constructor values raw and applies defaults only on explicit lifecycle operations', () => {
        const fields = { amount: number.defaultValue(5), title: string.required() };
        const record = new Record(fields, { amount: null });
        expect(record.getField('amount')).toBeNull();
        expect(record.getField('title')).toBeUndefined();
        expect(record.isValid()).toBe(true);
        expect(record.isValid('title')).toBe(false);
        record.clear();
        expect(record.values).toEqual({ amount: 5, title: '' });
        record.parseAndSetField('amount', '12');
        expect(record.getField('amount')).toBe('12'); // number adds no parser
    });

    it('uses all finalized emptiness rules regardless of modifier order', () => {
        for (const reference of [
            field.required().emptyWhen(value => value === 'N/A'),
            field.emptyWhen(value => value === 'N/A').required(),
        ]) {
            const record = new Record({ reference }, { reference: 'N/A' });
            expect(record.isValid()).toBe(false);
            expect(record.getField('reference')).toBe('N/A');
        }
    });

    it('loads and sorts the table reference example before reading rows', async () => {
        const markdown = fs.readFileSync(path.join(__dirname, '../docs/field-type.md'), 'utf8');
        const source = [...markdown.matchAll(/```js\n([\s\S]*?)```/g)]
            .map(match => match[1])
            .find(code => code.includes('const people ='))
            .replace(/^import .*;\n/m, '');
        const execute = new Function(
            'field',
            'Recordset',
            `return (async () => { ${source}\nreturn people; })();`
        );
        const people = await execute(field, Recordset);
        expect(people.currentPage.map(record => record.getField('name'))).toEqual([
            'Alpha',
            'Mike',
            'Zulu',
        ]);
    });
});
