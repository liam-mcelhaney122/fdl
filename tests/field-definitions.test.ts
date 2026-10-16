import {
    fieldDefinitions,
    firstName,
    email,
    postalCode,
    string,
    FieldType,
    Record,
    Recordset,
} from '../index';
import type { FieldDefinition } from '../index';
import * as api from '../index';

it('exports reusable string definitions individually and as a collection', () => {
    for (const [key, preset] of Object.entries(fieldDefinitions)) {
        expect((api as any)[key]).toBe(preset);
        const definition = preset.valueOf();
        expect(definition).toBeInstanceOf(FieldType);
        expect(definition.label()).toBeTruthy();
        expect(definition.autocomplete()).toBeTruthy();
        const record = new Record({ value: preset }, { value: '' });
        expect(record.isValid()).toBe(true);
        expect(definition.defaultValue()).toBe('');
    }
    expect(firstName.valueOf().autocomplete()).toBe('given-name');
    expect(fieldDefinitions.streetAddress.valueOf().autocomplete()).toBe('street-address');
    expect(fieldDefinitions.phoneNumber.valueOf().type()).toBe('tel');
    expect(email.valueOf().type()).toBe('email');
});

it('specializes presets without mutating the source, primitives, or siblings', () => {
    const required: FieldDefinition<string> = firstName.required().label('Given name');
    const short = firstName.maxLength(3);
    const record = new Record({ required, short }, { required: '', short: 'Alex' });
    expect(record.isValid('required')).toBe(false);
    expect(record.isValid('short')).toBe(false);
    expect(firstName.valueOf().required()).toBe(false);
    expect(firstName.valueOf().label()).toBe('First name');
    expect(string.valueOf().autocomplete()).toBe('off');
    record.setField('required', '李');
    record.setField('short', 'Zoë');
    expect(record.isValid()).toBe(true);
});

it.each(['ada@example.com', 'ada+tag@sub.example.org', '', '   ', null])(
    'accepts optional email value %p in sync and async model validation',
    async value => {
        const record = new Record({ email }, { email: value });
        expect(record.isValid()).toBe(true);
        expect(await record.isValidAsync()).toBe(true);
    }
);

it.each([
    'ada',
    'ada@',
    '@example.com',
    'ada@example',
    'ada @example.com',
    'ada@example.com\n',
    123,
])('rejects malformed email value %p without a browser', async value => {
    const record = new Record({ email }, { email: value });
    expect(record.isValid()).toBe(false);
    expect(await record.isValidAsync()).toBe(false);
});

it('combines email syntax and requiredness', () => {
    const record = new Record({ email: email.required() }, { email: '' });
    expect(record.isValid()).toBe(false);
    record.setField('email', '   ');
    expect(record.isValid()).toBe(false);
    record.setField('email', 'ada@example.com');
    expect(record.isValid()).toBe(true);
});

it('preserves international names, free-form addresses, and leading postal zeros', async () => {
    const table = new Recordset({ firstName, postalCode, phone: fieldDefinitions.phoneNumber }, [
        { firstName: 'محمد', postalCode: '00123', phone: '+44 (0)20 1234 5678' },
    ]);
    await table.requestUpdate();
    expect(table.allRecords[0].isValid()).toBe(true);
    expect(table.allRecords[0].getField('postalCode')).toBe('00123');
});
