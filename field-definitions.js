import { string } from './primitives.js';

// Keep names and addresses free of locale-specific character and length rules.
// Each preset remains optional until the caller specializes it with required().
export const name = string.label('Name').autocomplete('name');
export const firstName = string.label('First name').autocomplete('given-name');
export const middleName = string.label('Middle name').autocomplete('additional-name');
export const lastName = string.label('Last name').autocomplete('family-name');

/** Practical email syntax validation; this does not verify mailbox ownership. */
export const email = string
    .label('Email')
    .type('email')
    .autocomplete('email')
    .validator({
        name: 'must be an email address',
        validate: value =>
            value == null ||
            (typeof value === 'string' &&
                (/^\s*$/.test(value) ||
                    (value.trim() === value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)))),
    });

// Telephone formats vary internationally; applications can add their own validator.
export const phoneNumber = string.label('Phone number').type('tel').autocomplete('tel');
export const streetAddress = string.label('Street address').autocomplete('street-address');
export const addressLine1 = string.label('Address line 1').autocomplete('address-line1');
export const addressLine2 = string.label('Address line 2').autocomplete('address-line2');
export const city = string.label('City').autocomplete('address-level2');
export const state = string.label('State / province / region').autocomplete('address-level1');
export const postalCode = string.label('Postal code').autocomplete('postal-code');
export const country = string.label('Country').autocomplete('country-name');
export const organization = string.label('Organization').autocomplete('organization');
export const username = string.label('Username').autocomplete('username');

/** Common definitions, also available as individual named exports. */
export const fieldDefinitions = Object.freeze({
    name,
    firstName,
    middleName,
    lastName,
    email,
    phoneNumber,
    streetAddress,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    organization,
    username,
});
