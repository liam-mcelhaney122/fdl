import FieldTypeBuilder from '../field-type-builder';
import Record from '../record.js';

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}

function choice(value) {
    return { text: String(value), value };
}

it('clears an unavailable initial selection without a rendered control', async () => {
    const record = new Record({ store: new FieldTypeBuilder().required().options([choice('uptown')]) }, { store: 'missing' });
    const changed = jest.fn();
    record.addEventListener('change', changed);
    await record.whenOptionsReady();
    expect(record.getField('store')).toBeUndefined();
    expect(record.isValid()).toBe(false);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed.mock.calls[0][0].detail.field).toBe('store');
});

it('keeps valid shared choices and clears unavailable choices after dependencies change', async () => {
    const choices = { a: [choice('shared'), choice('a-only')], b: [choice('shared'), choice('b-only')] };
    const record = new Record({
        group: new FieldTypeBuilder(),
        shared: new FieldTypeBuilder().options(record => choices[record.getField('group')]),
        exclusive: new FieldTypeBuilder().options({ fields: ['group'], fetch: record => choices[record.getField('group')] }),
    }, { group: 'a', shared: 'shared', exclusive: 'a-only' });
    await record.whenOptionsReady();
    record.setField('group', 'b');
    await record.whenOptionsReady();
    expect(record.getField('shared')).toBe('shared');
    expect(record.getField('exclusive')).toBeUndefined();
    record.setField('exclusive', 'not-an-option');
    await record.whenOptionsReady();
    expect(record.getField('exclusive')).toBeUndefined();
});

it('removes only unavailable items from multiple selections and preserves typed option identities', async () => {
    const record = new Record({
        selected: new FieldTypeBuilder().multipleValues().options([choice(0), choice(false), choice({ id: 1 })]),
        scalar: new FieldTypeBuilder().options([choice(0)]),
    }, { selected: [0, false, { id: 1 }, '0', 'missing'], scalar: 0 });
    await record.whenOptionsReady();
    expect(record.getField('selected')).toEqual([0, false, { id: 1 }]);
    expect(record.getField('scalar')).toBe(0);
});

it('uses an empty array when no multiple selections remain and leaves unconstrained fields alone', async () => {
    const record = new Record({ selected: new FieldTypeBuilder().multipleValues().options([]), free: new FieldTypeBuilder() },
        { selected: ['gone'], free: 'anything' });
    await record.whenOptionsReady();
    expect(record.values).toEqual({ selected: [], free: 'anything' });
});

it('ignores an older async response and reconciles the latest value when current choices arrive', async () => {
    const old = deferred();
    const current = deferred();
    const record = new Record({ zip: new FieldTypeBuilder(), store: new FieldTypeBuilder().options({
        fields: ['zip'], fetch: record => record.getField('zip') === 'old' ? old.promise : current.promise,
    }) }, { zip: 'old', store: 'keep' });
    await Promise.resolve();
    record.setField('zip', 'current');
    await Promise.resolve();
    old.resolve([]);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(record.getField('store')).toBe('keep');
    current.resolve([choice('keep')]);
    await record.whenOptionsReady();
    expect(record.getField('store')).toBe('keep');
});

it('retains the current value while loading and after a failed lookup', async () => {
    const lookup = deferred();
    const record = new Record({ store: new FieldTypeBuilder().options(() => lookup.promise) }, { store: 'keep' });
    await Promise.resolve();
    expect(record.getField('store')).toBe('keep');
    lookup.reject(new Error('lookup failed'));
    await record.whenOptionsReady();
    expect(record.getField('store')).toBe('keep');
});

it('settles cascaded dependent choices and rechecks reset and added fields', async () => {
    const record = new Record({
        parent: new FieldTypeBuilder().options([choice('a')]),
        child: new FieldTypeBuilder().options(record => record.getField('parent') === 'a' ? [choice('b')] : []),
    }, { parent: 'a', child: 'b' });
    await record.whenOptionsReady();
    record.setField('parent', 'gone');
    await record.whenOptionsReady();
    expect(record.getField('parent')).toBeUndefined();
    expect(record.getField('child')).toBeUndefined();
    record.reset();
    await record.whenOptionsReady();
    expect(record.values).toEqual({ parent: 'a', child: 'b' });
    record.addField('extra', new FieldTypeBuilder().options([]), 'unavailable');
    await record.whenOptionsReady();
    expect(record.getField('extra')).toBeUndefined();
});
