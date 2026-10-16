import Record from '../record.js';
import {
    cancellationFields,
    checkCancellation,
    checkCancellationTransition,
} from '../examples/fdl-input/cancellation-model';
it('checks transfer rules against four cases and preserves a hidden reason', () => {
    expect(
        checkCancellation({ visibility: 'always', requiredness: 'never' }).every(
            result => result.passes
        )
    ).toBe(false);
    expect(
        checkCancellation({ visibility: 'cancelled', requiredness: 'cancelled' }).every(
            result => result.passes
        )
    ).toBe(true);
    const record = new Record(
        cancellationFields({ visibility: 'cancelled', requiredness: 'cancelled' }),
        { status: 'cancelled', reason: 'Changed plans' }
    );
    record.setField('status', 'active');
    expect(record.fieldTypeForField('reason').visible(undefined, record)).toBe(false);
    expect(record.getField('reason')).toBe('Changed plans');
    record.setField('status', 'cancelled');
    expect(record.getField('reason')).toBe('Changed plans');
    expect(record.isValid()).toBe(true);
});

it('checks the promised status transition as part of the challenge', () => {
    const result = checkCancellationTransition({
        visibility: 'cancelled',
        requiredness: 'cancelled',
    });
    expect(result).toEqual({
        activeReason: 'Changed plans',
        returnedReason: 'Changed plans',
        passes: true,
    });
    expect(
        checkCancellationTransition({ visibility: 'always', requiredness: 'never' }).passes
    ).toBe(false);
});
