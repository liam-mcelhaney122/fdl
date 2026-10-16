// Defines delivery fields, conditional rules, ZIP validation, and store lookup.
import { field } from '../../index';
import Record from '../../record.js';
import {
    deliveryMethodOptions,
    shippingStateOptions,
    storesByZip,
} from './delivery-data';

function whenDeliveryMethodRequiresAddress(record: Record<any>) {
    return record.getField('fulfillment') === 'ship';
}

function whenPickingUp(record: Record<any>) {
    return record.getField('fulfillment') === 'pickup';
}

function isValidZip(zip: unknown) {
    return typeof zip === 'string' && /^[0-9]{5}$/.test(zip);
}

function whenZipIsInvalid(record: Record<any>) {
    return !isValidZip(record.getField('zip'));
}

async function loadStoresForZip(zip: string) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return storesByZip[zip] || [];
}

const pickupStoreOptions = {
    fields: ['zip'],
    fetch: (record: Record<any>) => loadStoresForZip(record.getField('zip')),
};
const postalZipValidator = {
    name: 'must contain five digits',
    validate: (zip: unknown) => isValidZip(zip),
};

export function createDelivery() {
    return new Record(
        // prettier-ignore
        {
            fulfillment: field
                .label('Delivery method')
                .options(deliveryMethodOptions),
            address: field
                .label('Shipping address')
                .visible(whenDeliveryMethodRequiresAddress)
                .required(whenDeliveryMethodRequiresAddress),
            city: field
                .label('City')
                .visible(whenDeliveryMethodRequiresAddress)
                .required(whenDeliveryMethodRequiresAddress),
            state: field
                .label('State')
                .visible(whenDeliveryMethodRequiresAddress)
                .required(whenDeliveryMethodRequiresAddress)
                .options(shippingStateOptions),
            zip: field
                .label('ZIP code')
                .required()
                .validator(postalZipValidator),
            store: field
                .label('Pickup store')
                .visible(whenPickingUp)
                .disabled(whenZipIsInvalid)
                .required(whenPickingUp)
                .options(pickupStoreOptions),
        },
        {
            fulfillment: 'ship',
            address: '42 Orchard Street',
            city: 'Charlotte',
            state: 'NC',
            zip: '28202',
            store: '',
        }
    );
}
