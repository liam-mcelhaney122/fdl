import {createAccount} from '../examples/fdl-input/conditional-validation-model';

it.each([
    ['US', '', true], ['US', 'invalid', true], ['US', 'CA123456', true],
    ['CA', '', false], ['CA', 'invalid', false], ['CA', 'CA123456', true],
] as const)('validates %s / %s independently of rendering', (country, taxId, valid) => {
    const account = createAccount(country, taxId);
    const type = account.fieldTypeForField('taxId');
    expect(account.isValid()).toBe(valid);
    expect(type.visible(undefined, account)).toBe(country !== 'US');
    expect(type.required(undefined, account)).toBe(country !== 'US');
    expect(account.getField('taxId')).toBe(taxId);
});
it('revalidates retained data in both directions when country changes', () => {
    const account = createAccount('CA', 'invalid');
    expect(account.isValid()).toBe(false);
    account.setField('country', 'US');
    expect(account.isValid()).toBe(true);
    expect(account.getField('taxId')).toBe('invalid');
    account.setField('country', 'CA');
    expect(account.isValid()).toBe(false);
    account.setField('taxId', 'CA123456');
    expect(account.isValid()).toBe(true);
});
